import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { ChatIA } from "./ChatIA";

describe("ChatIA Component", () => {
  /**
   * This test used to assert the seeded conversation — a question the reader
   * had never asked and a long assistant reply hardcoded in the client,
   * addressed to "Ana" by name. The test was pinning a fabricated exchange as
   * though it were history, so it is the test that was wrong, not the fix
   * (#4). What the screen owes a new reader is its welcome state.
   */
  it("opens on the welcome state rather than on a conversation nobody had", () => {
    render(<ChatIA />);
    expect(screen.getAllByText(/LatinoMigra IA/i).length).toBeGreaterThan(0);
    expect(
      screen.getByPlaceholderText(/Pregunta sobre visas, becas, ciudades/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/¿Cómo puedo orientar tu plan migratorio\?/i)).toBeInTheDocument();
    expect(
      screen.queryByText(
        /¿Cuáles son los requisitos clave para la visa de estudiante de España desde Colombia\?/i
      )
    ).not.toBeInTheDocument();
  });

  it("carries the floating bubble's exchange over when handed one", () => {
    render(
      <ChatIA
        initialHistory={[
          { id: "m1", role: "user", content: "¿Cómo evito estafas?", timestamp: "10:00" },
          {
            id: "m2",
            role: "assistant",
            content: "Nunca transfieras antes de ver.",
            timestamp: "10:00",
          },
        ]}
      />
    );

    expect(screen.getByText(/¿Cómo evito estafas\?/)).toBeInTheDocument();
    expect(screen.getByText(/Nunca transfieras antes de ver./)).toBeInTheDocument();
  });

  it("updates text input when user types a custom question", () => {
    render(<ChatIA />);
    const input = screen.getByPlaceholderText(
      /Pregunta sobre visas, becas, ciudades/i
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "¿Cómo obtengo la visa para Alemania?" } });
    expect(input.value).toBe("¿Cómo obtengo la visa para Alemania?");
  });

  it("allows starting a new conversation", () => {
    render(<ChatIA />);
    const newChatBtn = document.getElementById("new-chat-btn")!;
    fireEvent.click(newChatBtn);
    expect(screen.getByText(/¿Cómo puedo orientar tu plan migratorio\?/i)).toBeInTheDocument();
  });
});
