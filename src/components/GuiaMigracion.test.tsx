import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { GuiaMigracion } from "./GuiaMigracion";
import { MIGRATION_GUIDES_DATA } from "../data/migrationGuides";

describe("GuiaMigracion Component", () => {
  const defaultProps = {
    setActiveTab: vi.fn(),
    onAskAIAboutGuide: vi.fn(),
  };

  it("renders migration guides header and country selection tabs", () => {
    render(<GuiaMigracion {...defaultProps} />);
    expect(screen.getByText(/Guías Oficiales Paso a Paso/i)).toBeInTheDocument();
    expect(screen.getAllByText(/España/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Alemania/i)).toBeInTheDocument();
  });

  it("changes country guide when clicking on a different country button", () => {
    render(<GuiaMigracion {...defaultProps} />);

    const germanyBtn = screen.getByRole("button", { name: /Alemania/i });
    fireEvent.click(germanyBtn);

    expect(screen.getByText(/Tipos de Visado en Alemania/i)).toBeInTheDocument();
  });

  it("allows clicking on checklist documents to toggle status", () => {
    render(<GuiaMigracion {...defaultProps} />);

    expect(screen.getByText(/Documentación Clave Requerida/i)).toBeInTheDocument();
    const docItem = screen.getByText(/Pasaporte Vigente/i);
    expect(docItem).toBeInTheDocument();
    fireEvent.click(docItem);
  });

  it("calls onAskAIAboutGuide when clicking Ask AI button in guide", () => {
    render(<GuiaMigracion {...defaultProps} />);
    const askAiBtn = screen.getByRole("button", { name: /Preguntar a IA cuál me conviene/i });
    fireEvent.click(askAiBtn);
    expect(defaultProps.onAskAIAboutGuide).toHaveBeenCalledWith("España");
  });
  /**
   * The route is a sequence of four phases to follow. It used to render as
   * four buttons with `activeRoadmapStep` starting at 2, so phase two was
   * marked as the current one on every load, for everyone — and tapping a
   * card moved the marker, which meant nothing, because the application does
   * not know where anyone is in their process.
   */
  describe("migration route", () => {
    it("renders the phases as an ordered list", () => {
      render(<GuiaMigracion {...defaultProps} />);

      const step = document.getElementById("roadmap-step-1");
      expect(step).toBeInTheDocument();
      expect(step?.tagName).toBe("LI");
      expect(step?.closest("ol")).not.toBeNull();
    });

    it("marks no phase as the one you are on", () => {
      render(<GuiaMigracion {...defaultProps} />);

      // Regression: nothing may single out a phase, since no phase can be
      // known to be current.
      for (const num of [1, 2, 3, 4]) {
        const step = document.getElementById(`roadmap-step-${num}`);
        expect(step).toBeInTheDocument();
        expect(step?.getAttribute("aria-current")).toBeNull();
        expect(step?.className).toBe(document.getElementById("roadmap-step-1")?.className);
      }
    });

    it("offers nothing to click in the route", () => {
      render(<GuiaMigracion {...defaultProps} />);

      const list = document.getElementById("roadmap-step-1")?.closest("ol");
      expect(list).not.toBeNull();
      expect(within(list as HTMLElement).queryAllByRole("button")).toHaveLength(0);
    });

    it("numbers the phases for a screen reader as well as visually", () => {
      render(<GuiaMigracion {...defaultProps} />);

      // The digit badge is decorative; the phase number belongs to the
      // heading, where it is announced.
      expect(screen.getByText(/^Fase 1:/)).toBeInTheDocument();
      expect(screen.getByText(/^Fase 4:/)).toBeInTheDocument();
    });
  });

  /**
   * The guides' claim is that they point at official sources. That link was a
   * grey text link wedged between a vote counter and an AI button.
   */
  describe("official visa sources", () => {
    const spanishVisas = MIGRATION_GUIDES_DATA.ES?.visas ?? [];

    it("has a visa catalogue to assert against", () => {
      expect(spanishVisas.length).toBeGreaterThan(0);
    });

    it("links every visa to its official source", () => {
      render(<GuiaMigracion {...defaultProps} />);

      for (const visa of spanishVisas) {
        const link = document.getElementById(`visa-official-source-${visa.id}`);
        const missing = document.getElementById(`visa-missing-source-${visa.id}`);

        if (visa.officialSourceUrl) {
          expect(link).toBeInTheDocument();
          expect(link).toHaveAttribute("href", visa.officialSourceUrl);
        } else {
          // Never silent: a guide that promises official sources has to say
          // when one is absent.
          expect(missing).toBeInTheDocument();
        }
      }
    });

    it("opens the official source safely in a new tab", () => {
      render(<GuiaMigracion {...defaultProps} />);

      const withSource = spanishVisas.filter((v) => v.officialSourceUrl);
      expect(withSource.length).toBeGreaterThan(0);

      for (const visa of withSource) {
        const link = document.getElementById(`visa-official-source-${visa.id}`);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
        expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
      }
    });

    it("names the visa in the link, so the destination is not just 'Portal oficial'", () => {
      render(<GuiaMigracion {...defaultProps} />);

      const visa = spanishVisas.find((v) => v.officialSourceUrl);
      const link = document.getElementById(`visa-official-source-${visa!.id}`);
      expect(link).toHaveTextContent(visa!.name);
    });
  });

  /**
   * The guide ran to 9857px on a 375px viewport — twelve screens to reach the
   * anti-scam section. The heavy blocks collapse on a phone now.
   */
  describe("density on a phone", () => {
    it("collapses the visa details, the checklist and the anti-scam guide", () => {
      render(<GuiaMigracion {...defaultProps} />);

      for (const id of ["checklist-details", "antiscam-details"]) {
        const control = document.getElementById(id);
        expect(control, id).toBeInTheDocument();
        expect(control).toHaveAttribute("aria-expanded", "false");
      }

      const visa = MIGRATION_GUIDES_DATA.ES?.visas?.[0];
      expect(document.getElementById(`visa-details-${visa!.id}`)).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    });

    it("expands a section when its control is used", () => {
      render(<GuiaMigracion {...defaultProps} />);

      const control = document.getElementById("checklist-details") as HTMLElement;
      fireEvent.click(control);

      expect(control).toHaveAttribute("aria-expanded", "true");
      expect(document.getElementById("checklist-details-panel")).not.toHaveClass("hidden");
    });
  });
});
