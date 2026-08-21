import { useCallback, useState } from "react";

import { ChatMessage } from "../types";

/** What `POST /api/chat` answers with. */
interface ChatApiResponse {
  reply?: string;
  text?: string;
  sources?: { title: string; url: string }[];
}

export interface AskOptions {
  /** Turns already exchanged, oldest first. */
  history: ChatMessage[];
  language: string;
}

export interface MigrationChat {
  /** Sends one turn and resolves with the assistant's message. */
  ask: (prompt: string, options: AskOptions) => Promise<ChatMessage>;
  isLoading: boolean;
}

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * The one implementation of "ask the assistant".
 *
 * There used to be two. `ChatIA` called `/api/chat` and reached Gemini;
 * `FloatingChatWidget` — the bubble on every screen, and so the surface most
 * people actually used — ran an `if/else` over five keywords and answered
 * anything else with a paragraph that answered nothing. The same question gave
 * different answers depending on where it was asked, and the more prominent
 * surface was the one that could not answer (#4).
 *
 * The fixed replies also carried their own figures — 350–650 € rent, a
 * 2,500–4,000 € buffer — duplicating numbers that also live in the server's
 * system instruction and in the datasets. Three copies that could drift.
 */
export function useMigrationChat(): MigrationChat {
  const [isLoading, setIsLoading] = useState(false);

  const ask = useCallback(async (prompt: string, options: AskOptions): Promise<ChatMessage> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          language: options.language,
          history: options.history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      /*
        A 429 or a 500 answers with a body too, and reading `data.reply` from
        it yields undefined — which used to become "No se pudo obtener la
        respuesta." rendered as though the assistant had said it.
      */
      if (!response.ok) {
        throw new Error(`chat request failed with ${response.status}`);
      }

      const data: ChatApiResponse = await response.json();
      const reply = data.reply ?? data.text;
      if (!reply) throw new Error("chat response carried no reply");

      return {
        id: `msg-ai-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: now(),
        /*
          Sources come from the answer or not at all. They used to fall back to
          two fixed portals, so every reply was attributed to sources it had
          never cited — on a platform whose credibility rests on official
          sourcing.
        */
        sources: data.sources?.length ? data.sources : undefined,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { ask, isLoading };
}

/**
 * The message shown when the request could not be completed.
 *
 * The copy is passed in rather than written here: it is user-visible, so it
 * comes from `t()` in the component that renders it.
 */
export function chatErrorMessage(text: string): ChatMessage {
  return {
    id: `msg-err-${Date.now()}`,
    role: "assistant",
    content: text,
    timestamp: now(),
  };
}
