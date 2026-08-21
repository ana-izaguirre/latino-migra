import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../../test/renderWithProviders";
import { Disclosure } from "./Disclosure";

describe("Disclosure", () => {
  const content = "Contenido plegable";

  it("starts closed, with the panel hidden and the control saying so", () => {
    render(
      <Disclosure id="test-disclosure" label="Ver detalles">
        <p>{content}</p>
      </Disclosure>
    );

    const control = screen.getByRole("button", { name: /Ver detalles/i });
    expect(control).toHaveAttribute("aria-expanded", "false");

    // The panel stays in the DOM: it is shown by CSS at `lg`, where the
    // control is not rendered at all. Only its classes change.
    const panel = document.getElementById("test-disclosure-panel");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass("hidden");
    expect(panel).toHaveClass("lg:block");
  });

  it("points the control at the panel it controls", () => {
    render(
      <Disclosure id="test-disclosure" label="Ver detalles">
        <p>{content}</p>
      </Disclosure>
    );

    const control = screen.getByRole("button", { name: /Ver detalles/i });
    expect(control).toHaveAttribute("aria-controls", "test-disclosure-panel");
    expect(document.getElementById("test-disclosure-panel")).toBeInTheDocument();
  });

  it("opens and closes on click, and changes its own label", () => {
    render(
      <Disclosure id="test-disclosure" label="Ver detalles" labelWhenOpen="Ocultar detalles">
        <p>{content}</p>
      </Disclosure>
    );

    const control = screen.getByRole("button", { name: /Ver detalles/i });
    fireEvent.click(control);

    expect(control).toHaveAttribute("aria-expanded", "true");
    expect(control).toHaveTextContent(/Ocultar detalles/i);
    expect(document.getElementById("test-disclosure-panel")).not.toHaveClass("hidden");

    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-expanded", "false");
    expect(control).toHaveTextContent(/Ver detalles/i);
  });

  it("keeps the label when no open label is given", () => {
    render(
      <Disclosure id="test-disclosure" label="Ver detalles">
        <p>{content}</p>
      </Disclosure>
    );

    const control = screen.getByRole("button", { name: /Ver detalles/i });
    fireEvent.click(control);
    expect(control).toHaveTextContent(/Ver detalles/i);
  });

  it("can start open", () => {
    render(
      <Disclosure id="test-disclosure" label="Ver detalles" defaultOpen>
        <p>{content}</p>
      </Disclosure>
    );

    expect(screen.getByRole("button", { name: /Ver detalles/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(document.getElementById("test-disclosure-panel")).not.toHaveClass("hidden");
  });

  it("hides the control from wide screens rather than the panel", () => {
    render(
      <Disclosure id="test-disclosure" label="Ver detalles">
        <p>{content}</p>
      </Disclosure>
    );

    // `lg:hidden` and a display utility on the same element let the emitted
    // order decide the winner, and it picked the wrong one once already. The
    // breakpoint belongs to a wrapper that sets nothing else.
    const control = screen.getByRole("button", { name: /Ver detalles/i });
    expect(control).not.toHaveClass("lg:hidden");
    expect(control.parentElement).toHaveClass("lg:hidden");
  });

  it("gives each instance its own panel id when none is supplied", () => {
    render(
      <>
        <Disclosure label="Primero">
          <p>uno</p>
        </Disclosure>
        <Disclosure label="Segundo">
          <p>dos</p>
        </Disclosure>
      </>
    );

    const [first, second] = screen.getAllByRole("button");
    expect(first.getAttribute("aria-controls")).not.toBe(second.getAttribute("aria-controls"));
  });
});
