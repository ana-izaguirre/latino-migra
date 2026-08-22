import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { renderWithProviders as render } from "../test/renderWithProviders";
import { FloatingChatWidget } from "../components/FloatingChatWidget";
import { ChatIA } from "../components/ChatIA";

/**
 * Regression for #4.
 *
 * There were two assistants. `ChatIA` called `/api/chat` and reached Gemini;
 * `FloatingChatWidget` — the bubble on every screen, and so the surface most
 * people used — ran an `if/else` over five keywords and answered everything
 * else with a paragraph that answered nothing. The same question gave
 * different answers depending on where it was asked.
 */

const mockChatResponse = (reply: string, extra: Record<string, unknown> = {}) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ reply, ...extra }),
  } as Response);

const askInWidget = async (question: string) => {
  fireEvent.click(screen.getByLabelText(/Abrir asistente|Abrir chat|asistente/i));
  const input = await screen.findByPlaceholderText(/Escribe|Pregunta/i);
  fireEvent.change(input, { target: { value: question } });
  fireEvent.submit(input.closest("form")!);
};

describe("Both chat surfaces", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("answers from /api/chat in the floating bubble, not from keywords", async () => {
    const fetchSpy = mockChatResponse("Respuesta del servidor.");

    render(<FloatingChatWidget onNavigateToFullChat={vi.fn()} />);
    // "estafa" was one of the five hardcoded branches, so a keyword reply
    // would still look like an answer. It has to come from the network.
    await askInWidget("¿Cómo evito una estafa de alquiler?");

    await waitFor(() => expect(screen.getByText("Respuesta del servidor.")).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith("/api/chat", expect.objectContaining({ method: "POST" }));
    expect(screen.queryByText(/Reglas de Oro Anti-Estafas/)).not.toBeInTheDocument();
  });

  it("answers from /api/chat in the full screen too", async () => {
    const fetchSpy = mockChatResponse("Respuesta del servidor.");

    render(<ChatIA />);
    const input = screen.getByPlaceholderText(/Pregunta sobre visas, becas, ciudades/i);
    fireEvent.change(input, { target: { value: "¿Cómo evito una estafa de alquiler?" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(screen.getByText("Respuesta del servidor.")).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith("/api/chat", expect.objectContaining({ method: "POST" }));
  });

  it("sends the conversation so far, so the assistant has the thread", async () => {
    const fetchSpy = mockChatResponse("Primera.");

    render(<FloatingChatWidget onNavigateToFullChat={vi.fn()} />);
    await askInWidget("Primera pregunta");
    await waitFor(() => expect(screen.getByText("Primera.")).toBeInTheDocument());

    fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ reply: "Segunda." }) } as Response);
    const input = screen.getByPlaceholderText(/Escribe|Pregunta/i);
    fireEvent.change(input, { target: { value: "Segunda pregunta" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(screen.getByText("Segunda.")).toBeInTheDocument());

    const body = JSON.parse((fetchSpy.mock.calls[1][1] as RequestInit).body as string);
    expect(body.message).toBe("Segunda pregunta");
    expect(body.history.map((m: { content: string }) => m.content)).toContain("Primera pregunta");
  });

  it("says the assistant did not answer instead of showing a reply it never gave", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    } as Response);

    render(<FloatingChatWidget onNavigateToFullChat={vi.fn()} />);
    await askInWidget("¿Cuánto dinero necesito?");

    await waitFor(() =>
      expect(screen.getByText(/No pudimos conectar con el asistente/)).toBeInTheDocument()
    );
    // The old fallback answered a rate-limited request with a budget breakdown.
    expect(screen.queryByText(/Presupuesto Realista/)).not.toBeInTheDocument();
  });

  it("attributes no sources the answer did not carry", async () => {
    mockChatResponse("Sin fuentes.");

    render(<ChatIA />);
    const input = screen.getByPlaceholderText(/Pregunta sobre visas, becas, ciudades/i);
    fireEvent.change(input, { target: { value: "Una pregunta" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(screen.getByText("Sin fuentes.")).toBeInTheDocument());
    // Every reply used to be credited to two fixed portals it had never cited.
    expect(screen.queryByText(/Ministerio de Asuntos Exteriores/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Portal de Inmigración Oficial/)).not.toBeInTheDocument();
  });

  it("hands the whole exchange to the full screen when maximised", async () => {
    mockChatResponse("Respuesta.");
    const onNavigateToFullChat = vi.fn();

    render(<FloatingChatWidget onNavigateToFullChat={onNavigateToFullChat} />);
    await askInWidget("Mi pregunta");
    await waitFor(() => expect(screen.getByText("Respuesta.")).toBeInTheDocument());

    fireEvent.click(document.getElementById("chat-widget-maximise")!);

    const [, history] = onNavigateToFullChat.mock.calls[0];
    expect(history.map((m: { content: string }) => m.content)).toEqual(
      expect.arrayContaining(["Mi pregunta", "Respuesta."])
    );
  });
});
