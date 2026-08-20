import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render } from "../../test/renderWithProviders";
import { Modal } from "./Modal";

/**
 * The behaviour twelve hand-rolled overlays never had between them. Focus was
 * the worst gap: with a modal open, Tab walked into the page behind it and a
 * screen reader user had no way to tell they had left the dialog.
 */
const Harness = ({ onClosed }: { onClosed?: () => void } = {}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <button>Fuera del modal</button>
      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onClosed?.();
        }}
        title="Diálogo de prueba"
        description="Una descripción"
      >
        <button>Primero</button>
        <button>Segundo</button>
      </Modal>
    </>
  );
};

describe("Modal", () => {
  it("renders nothing until it is opened", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes the title and description as the accessible name", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Diálogo de prueba");
    expect(dialog).toHaveAccessibleDescription("Una descripción");
  });

  it("traps focus inside the dialog", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await screen.findByRole("dialog");

    const inside = ["Cerrar modal", "Primero", "Segundo"];
    for (let i = 0; i < inside.length * 2; i++) {
      await user.tab();
      const active = document.activeElement as HTMLElement;
      // Never lands on the page behind, however many times Tab is pressed.
      expect(screen.getByRole("dialog").contains(active)).toBe(true);
    }
    // The page behind is hidden from assistive technology while the dialog is
    // open, so it is not even reachable by role.
    expect(screen.queryByRole("button", { name: "Fuera del modal" })).not.toBeInTheDocument();
    expect(screen.getByText("Fuera del modal")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes from its own close button", async () => {
    const onClosed = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClosed={onClosed} />);
    await user.click(screen.getByRole("button", { name: "Abrir" }));

    await user.click(await screen.findByRole("button", { name: "Cerrar modal" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onClosed).toHaveBeenCalled();
  });

  // Focus restoration on close is covered in tests/e2e/mobile.spec.ts. jsdom
  // does not model Radix's focus scope faithfully enough for the result here to
  // mean anything either way.

  it("hides its own close button when the content provides one", async () => {
    render(
      <Modal open onOpenChange={() => {}} title="Sin cerrar" hideCloseButton>
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.queryByRole("button", { name: "Cerrar modal" })).not.toBeInTheDocument();
  });

  it("keeps a single heading when a custom header supplies one", async () => {
    render(
      <Modal
        open
        onOpenChange={() => {}}
        title="Nombre accesible"
        header={<h3>Nombre accesible</h3>}
      >
        <p>Contenido</p>
      </Modal>
    );
    // The accessible name is a span, so it does not duplicate the heading.
    expect(screen.getAllByRole("heading", { name: "Nombre accesible" })).toHaveLength(1);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Nombre accesible");
  });
});
