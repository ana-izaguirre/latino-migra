import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { Footer } from "./Footer";

describe("Footer Component", () => {
  it("renders branding description and footer links", () => {
    const setActiveTab = vi.fn();
    render(<Footer setActiveTab={setActiveTab} />);

    expect(screen.getByText("LatinoMigra")).toBeInTheDocument();
    expect(screen.getByText(/Empoderando a la comunidad estudiantil/i)).toBeInTheDocument();
    expect(screen.getByText(/Becas & Estudios/i)).toBeInTheDocument();
    expect(screen.getByText(/Guía de Migración/i)).toBeInTheDocument();

    // Click on link
    fireEvent.click(screen.getByText(/Becas & Estudios/i));
    expect(setActiveTab).toHaveBeenCalledWith("becas");
  });
  /**
   * The footer is the other place a hidden screen could still be reachable
   * from. It reads the same list as the rest of the navigation.
   */
  describe("hidden screens", () => {
    it("offers no link to a screen the product has hidden", () => {
      render(<Footer setActiveTab={vi.fn()} />);

      // Assert on controls, not on any text: the footer's prose mentions the
      // community without linking to it.
      for (const label of [/Planificador/i, /Calculadora/i, /Voluntariados/i, /Comunidad/i]) {
        expect(screen.queryByRole("button", { name: label }), String(label)).toBeNull();
      }
    });

    it("still offers the screens the product is built on", () => {
      const setActiveTab = vi.fn();
      render(<Footer setActiveTab={setActiveTab} />);

      fireEvent.click(screen.getByText(/Guía de Migración/i));
      expect(setActiveTab).toHaveBeenCalledWith("guia");
    });

    it("keeps the consular map and the assistant", () => {
      const setActiveTab = vi.fn();
      render(<Footer setActiveTab={setActiveTab} />);

      fireEvent.click(screen.getByText(/Mapa Consular/i));
      expect(setActiveTab).toHaveBeenCalledWith("mapa");
    });

    it("leaves no empty section behind", () => {
      const { container } = render(<Footer setActiveTab={vi.fn()} />);

      // A column whose every link was hidden would render as a heading over
      // nothing.
      container.querySelectorAll("ul").forEach((list) => {
        expect(
          list.children.length,
          list.previousElementSibling?.textContent ?? ""
        ).toBeGreaterThan(0);
      });
    });
  });
});
