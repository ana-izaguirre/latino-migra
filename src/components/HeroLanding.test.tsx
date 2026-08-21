import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { HeroLanding } from "./HeroLanding";

describe("HeroLanding Component", () => {
  it("renders hero title, metrics and quick action buttons", () => {
    const setActiveTab = vi.fn();
    render(<HeroLanding setActiveTab={setActiveTab} />);

    // Check main title and tagline
    expect(screen.getByText(/Tu viaje comienza aquí/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Tu futuro no tiene fronteras/i
    );

    // Check action buttons exist
    const becasBtn = screen.getByRole("button", { name: /Buscar Becas/i });
    const guiasBtn = screen.getByRole("button", { name: /Ver Guías Migratorias/i });

    expect(becasBtn).toBeInTheDocument();
    expect(guiasBtn).toBeInTheDocument();

    // Verify clicks trigger navigation tab changes
    fireEvent.click(becasBtn);
    expect(setActiveTab).toHaveBeenCalledWith("becas");

    fireEvent.click(guiasBtn);
    expect(setActiveTab).toHaveBeenCalledWith("guia");
  });
  describe("navigation", () => {
    /** Every destination the landing offers, and where it must lead. */
    const destinations: [string, string][] = [
      ["hero-btn-becas", "becas"],
      ["hero-btn-guias", "guia"],
      ["feature-btn-chat", "chat"],
      ["feature-btn-guia-step", "guia"],
      ["feature-btn-becas-verified", "becas"],
    ];

    it.each(destinations)("sends %s to the %s screen", (id, tab) => {
      const setActiveTab = vi.fn();
      const { container } = render(<HeroLanding setActiveTab={setActiveTab} />);

      const button = container.querySelector(`#${id}`);
      expect(button, id).toBeInTheDocument();
      fireEvent.click(button as HTMLElement);

      expect(setActiveTab).toHaveBeenCalledWith(tab);
    });

    it("leads nowhere that does not exist", () => {
      const setActiveTab = vi.fn();
      const { container } = render(<HeroLanding setActiveTab={setActiveTab} />);

      // A landing page whose buttons point at a removed screen is the failure
      // this guards: every destination has to be one the app can render.
      const known = new Set(["becas", "guia", "chat", "home"]);
      container.querySelectorAll("button").forEach((button) => {
        setActiveTab.mockClear();
        fireEvent.click(button);
        for (const call of setActiveTab.mock.calls) {
          expect(known, `${button.id || button.textContent?.trim()}`).toContain(call[0]);
        }
      });
    });
  });

  describe("when somebody is signed in", () => {
    const user = {
      id: "uid-1",
      name: "Ana Izaguirre",
      email: "ana@example.com",
      avatar: "https://example.com/a.jpg",
      countryOfOrigin: "Honduras",
      signedInAt: "21 ago 2026",
    };

    it("greets them by name and shows where they are from", () => {
      render(<HeroLanding setActiveTab={vi.fn()} currentUser={user} />);

      expect(screen.getByText(/¡Hola, Ana Izaguirre!/)).toBeInTheDocument();
      expect(screen.getByText("Honduras")).toBeInTheDocument();
    });

    it("falls back to a region rather than an empty chip", () => {
      render(<HeroLanding setActiveTab={vi.fn()} currentUser={{ ...user, countryOfOrigin: "" }} />);

      expect(screen.getByText(/América Latina/)).toBeInTheDocument();
    });

    it("offers the two things a returning visitor came back for", () => {
      const setActiveTab = vi.fn();
      render(<HeroLanding setActiveTab={setActiveTab} currentUser={user} />);

      fireEvent.click(screen.getByRole("button", { name: /Crear Plan de Migración/i }));
      expect(setActiveTab).toHaveBeenCalledWith("planificador");

      fireEvent.click(screen.getByRole("button", { name: /^Ver Becas$/i }));
      expect(setActiveTab).toHaveBeenCalledWith("becas");
    });

    it("renders no image at all for an unsafe avatar URL", () => {
      // A profile photo is a remote URL from a third party. Rendering one
      // unchecked is how a `javascript:` src reaches the page.
      //
      // The sanitiser used to answer an unusable URL with a stock photograph,
      // so this asserted the `src` was merely not `javascript:`. It answers
      // with nothing now, and `Avatar` shows the person's initial instead of a
      // stranger's face (#99) — a stronger property, so the assertion moves
      // with it rather than the test being weakened.
      render(
        <HeroLanding
          setActiveTab={vi.fn()}
          currentUser={{ ...user, avatar: "javascript:alert(1)" }}
        />
      );

      expect(document.querySelector("img[alt='Ana Izaguirre']")).toBeNull();
      expect(screen.getByLabelText("Ana Izaguirre")).toHaveTextContent("A");
      expect(document.body.innerHTML).not.toMatch(/javascript:/i);
    });

    it("shows the picture when there is a safe one", () => {
      render(
        <HeroLanding
          setActiveTab={vi.fn()}
          currentUser={{ ...user, avatar: "https://example.com/ana.jpg" }}
        />
      );

      const avatar = screen.getByAltText("Ana Izaguirre") as HTMLImageElement;
      expect(avatar.tagName).toBe("IMG");
      expect(avatar.getAttribute("src")).toBe("https://example.com/ana.jpg");
    });
  });

  describe("when nobody is signed in", () => {
    it("shows no greeting rather than an empty one", () => {
      render(<HeroLanding setActiveTab={vi.fn()} />);

      expect(screen.queryByText(/¡Hola,/)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Crear Plan de Migración/i })
      ).not.toBeInTheDocument();
    });

    it("still offers every destination", () => {
      const { container } = render(<HeroLanding setActiveTab={vi.fn()} />);

      for (const id of ["hero-btn-becas", "hero-btn-guias"]) {
        expect(container.querySelector(`#${id}`), id).toBeInTheDocument();
      }
    });
  });

  describe("accessibility", () => {
    it("has one first-level heading", () => {
      render(<HeroLanding setActiveTab={vi.fn()} />);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    });

    it("gives every control an accessible name", () => {
      const { container } = render(<HeroLanding setActiveTab={vi.fn()} />);

      container.querySelectorAll("button").forEach((button) => {
        const name = button.textContent?.trim() || button.getAttribute("aria-label");
        expect(name, `button#${button.id}`).toBeTruthy();
      });
    });
  });
  /**
   * The first screen says what the platform is and where to go. It used to
   * also carry catalogue figures, and its actions read as stacked blocks on a
   * phone.
   */
  describe("what the first screen offers", () => {
    it("leads only to screens the navigation offers", () => {
      const setActiveTab = vi.fn();
      const { container } = render(<HeroLanding setActiveTab={setActiveTab} />);

      // The planner is hidden, so a link to it from here is a dead end.
      expect(container.querySelector("#hero-btn-planificador")).toBeNull();
      expect(container.querySelector("#feature-btn-plan")).toBeNull();

      container.querySelectorAll("button").forEach((button) => {
        setActiveTab.mockClear();
        fireEvent.click(button);
        for (const call of setActiveTab.mock.calls) {
          expect(call[0], button.id || button.textContent?.trim()).not.toBe("planificador");
        }
      });
    });

    it("makes no claim about the size of the catalogue", () => {
      render(<HeroLanding setActiveTab={vi.fn()} />);

      // The badge said "+5,000 Becas Activas" against a catalogue of 22.
      expect(screen.queryByText(/\+5,000/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Becas Activas/i)).not.toBeInTheDocument();
    });

    it("puts its two destinations side by side rather than stacked", () => {
      const { container } = render(<HeroLanding setActiveTab={vi.fn()} />);

      const becas = container.querySelector("#hero-btn-becas");
      const guias = container.querySelector("#hero-btn-guias");
      expect(becas?.parentElement).toBe(guias?.parentElement);
      // Two columns at every width, so neither becomes a full-bleed block.
      expect(becas?.parentElement).toHaveClass("grid-cols-2");
    });

    it("keeps both actions at a thumb-sized target", () => {
      const { container } = render(<HeroLanding setActiveTab={vi.fn()} />);

      for (const id of ["hero-btn-becas", "hero-btn-guias"]) {
        expect(container.querySelector(`#${id}`), id).toHaveClass("min-h-[48px]");
      }
    });
  });
});
