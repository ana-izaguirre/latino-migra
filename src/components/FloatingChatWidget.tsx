import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Maximize2 } from "lucide-react";
import { ChatMessage, GoogleUser } from "../types";
import { useLanguage } from "../lib/i18n";
import { chatErrorMessage, useMigrationChat } from "../lib/useMigrationChat";

interface FloatingChatWidgetProps {
  currentUser?: GoogleUser | null;
  /**
   * Hands the conversation over to the full-screen Chat IA tab.
   *
   * The whole exchange, not just the draft: maximising used to start over,
   * which on the surface most people use meant losing the conversation to see
   * it in a bigger window.
   */
  onNavigateToFullChat: (prompt: string, history: ChatMessage[]) => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({ onNavigateToFullChat }) => {
  const { language, t } = useLanguage();
  const { ask } = useMigrationChat();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "¡Hola! 👋 Soy tu Asistente de Migración y Becas de LatinoMigra. ¿En qué país o trámite estás interesado hoy? Puedo ayudarte a calcular presupuestos, armar tu ruta para no caer en estafas o explicarte cómo empadronarte.",
      timestamp: "Ahora",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "¿Cómo evitar estafas en el primer alquiler?",
    "¿Qué es el empadronamiento y cómo se tramita en España?",
    "¿Cuánto dinero necesito para los primeros 3 meses?",
    "¿Puedo trabajar con visa de estudiante en España?",
  ];

  /**
   * One implementation, two presentations.
   *
   * This used to be an `if/else` over five keywords with fixed replies, and
   * anything outside them got a paragraph that answered nothing — while the
   * Chat IA tab asked Gemini. Same question, different answers, and the bubble
   * is the surface people actually reach for (#4).
   */
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: "Ahora",
    };

    const history = messages;
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const reply = await ask(text, { history, language });
      setMessages((prev) => [...prev, reply]);
    } catch (e) {
      // A failure is visible in the conversation rather than swallowed: the
      // reader has to know the assistant did not answer.
      console.warn("Chat request failed:", e);
      setMessages((prev) => [
        ...prev,
        chatErrorMessage(
          t(
            "chat.requestFailed",
            "No pudimos conectar con el asistente. Revisa tu conexión e inténtalo de nuevo."
          )
        ),
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className={
        isOpen
          ? // Open: a near full-height sheet on phones, a docked panel from sm up.
            "fixed z-50 inset-x-2 sm:inset-x-auto sm:right-5 bottom-[calc(var(--bottom-nav-height)+var(--safe-bottom)+0.5rem)] sm:bottom-5"
          : // Closed: a compact pill that clears the mobile bottom navigation.
            "fixed z-50 right-3 sm:right-5 above-bottom-nav max-w-[calc(100vw-1.5rem)]"
      }
    >
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="floating-chat-trigger-btn"
          aria-label="Abrir asistente de chat bot"
          className="flex items-center justify-center gap-2 w-14 h-14 sm:w-auto sm:h-auto bg-gradient-to-r from-primary to-secondary dark:from-sky-600 dark:to-teal-500 text-white sm:px-4 sm:py-3 rounded-full shadow-2xl hover:scale-105 transition-all duration-200 group border border-white/20"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          {/* On phones the pill collapses to a circular FAB so it stops
              covering the primary call-to-action underneath it. */}
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            Chatbot LatinoMigra
          </span>
        </button>
      )}

      {/* Floating Chat Popup Window */}
      {isOpen && (
        <div
          id="floating-chat-popup"
          role="dialog"
          aria-label="Asistente LatinoMigra IA"
          className="w-full sm:w-[380px] md:w-[420px] h-[75dvh] sm:h-[520px] max-h-[calc(100dvh-var(--bottom-nav-height)-var(--safe-bottom)-5rem)] sm:max-h-[80vh] bg-surface dark:bg-slate-900 rounded-3xl shadow-2xl border border-outline-variant/60 dark:border-slate-800 flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary dark:from-sky-800 dark:to-slate-800 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/20 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>LatinoMigra IA</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                </h2>
                <p className="text-[11px] text-white/80">Asistente Migratorio 24/7</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToFullChat(inputMessage.trim(), messages);
                }}
                id="chat-widget-maximise"
                title="Abrir en pantalla completa"
                aria-label="Abrir el chat en pantalla completa"
                className="tap-target p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar chat"
                aria-label="Cerrar chat"
                className="tap-target p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-surface-container-lowest/50 dark:bg-slate-950/40 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-sky-950 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-primary dark:text-sky-400" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary dark:bg-sky-600 text-white rounded-br-none"
                      : "bg-surface dark:bg-slate-800 text-on-surface dark:text-slate-100 border border-outline-variant/40 dark:border-slate-700/80 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.role === "user"
                        ? "text-white/70"
                        : "text-on-surface-variant dark:text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 text-xs">
                <Bot className="w-4 h-4 animate-bounce text-secondary" />
                <span>Analizando respuesta migratoria...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="p-2 border-t border-outline-variant/30 dark:border-slate-800 bg-surface dark:bg-slate-900 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="text-[11px] px-3 py-2 min-h-[36px] bg-surface-container dark:bg-slate-800 hover:bg-secondary/10 dark:hover:bg-teal-950/40 text-on-surface-variant dark:text-slate-300 rounded-full border border-outline-variant/40 dark:border-slate-700 whitespace-nowrap shrink-0 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 pb-[calc(0.75rem+var(--safe-bottom))] sm:pb-3 bg-surface dark:bg-slate-900 border-t border-outline-variant/40 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu consulta..."
              aria-label="Mensaje para el asistente"
              enterKeyHint="send"
              className="flex-1 min-w-0 px-3.5 py-2.5 text-xs bg-surface-container dark:bg-slate-800 border border-outline-variant/50 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              aria-label="Enviar mensaje"
              className="tap-target p-2 bg-secondary dark:bg-teal-500 disabled:opacity-40 text-white dark:text-slate-950 rounded-xl hover:opacity-90 transition-opacity shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
