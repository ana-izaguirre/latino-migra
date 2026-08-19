import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { BecasExplorer } from "./BecasExplorer";
import * as firebase from "../lib/firebase";

describe("BecasExplorer Component", () => {
  const defaultProps = {
    searchQuery: "",
    setSearchQuery: vi.fn(),
    setActiveTab: vi.fn(),
    onAskAIAboutScholarship: vi.fn(),
  };

  it("renders scholarships header and search field", () => {
    render(<BecasExplorer {...defaultProps} />);
    expect(screen.getByText(/Directorio Oficial de Becas/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Buscar por nombre, país, área o universidad/i)
    ).toBeInTheDocument();
  });

  it("filters scholarships when typing in the search bar", () => {
    const { rerender } = render(<BecasExplorer {...defaultProps} searchQuery="" />);
    expect(screen.getByText(/Fundación Carolina/i)).toBeInTheDocument();

    // Rerender with search query for DAAD
    rerender(<BecasExplorer {...defaultProps} searchQuery="DAAD" />);
    expect(screen.getByText(/DAAD Helmut-Schmidt/i)).toBeInTheDocument();
  });

  it("opens scholarship modal details when clicking on a card", () => {
    render(<BecasExplorer {...defaultProps} />);

    // Find and click on the first scholarship "Ver Detalles" button
    const detailButtons = screen.getAllByRole("button", { name: /Ver Detalles/i });
    expect(detailButtons.length).toBeGreaterThan(0);
    fireEvent.click(detailButtons[0]);

    // Check that modal details appear
    expect(screen.getByText(/Requisitos Principales/i)).toBeInTheDocument();
    expect(screen.getByText(/Beneficios Incluidos/i)).toBeInTheDocument();
  });

  it("calls onAskAIAboutScholarship when clicking Consultar IA in modal", () => {
    render(<BecasExplorer {...defaultProps} />);

    // Open modal
    const detailButtons = screen.getAllByRole("button", { name: /Ver Detalles/i });
    fireEvent.click(detailButtons[0]);

    // Click on "Consultar IA" button
    const askAiBtn = screen.getByRole("button", { name: /Consultar IA/i });
    fireEvent.click(askAiBtn);

    expect(defaultProps.onAskAIAboutScholarship).toHaveBeenCalled();
  });

  it("opens suggest scholarship modal when clicking Sugerir Beca Oficial", () => {
    render(<BecasExplorer {...defaultProps} />);
    const suggestBtn = screen.getByRole("button", { name: /Sugerir Beca Oficial/i });
    fireEvent.click(suggestBtn);
    expect(screen.getByText(/Sugerir Beca Universitaria/i)).toBeInTheDocument();
  });

  it("renders pagination controls and navigates between pages", () => {
    render(<BecasExplorer {...defaultProps} />);

    // Page 1 should be active initially with 6 cards displayed
    const page1Btn = screen.getByRole("button", { name: "1" });
    expect(page1Btn).toHaveAttribute("aria-current", "page");

    // Check next page button
    const nextBtn = screen.getByRole("button", { name: /Siguiente/i });
    expect(nextBtn).toBeInTheDocument();
    expect(nextBtn).not.toBeDisabled();

    // Click next page
    fireEvent.click(nextBtn);
    const page2Btn = screen.getByRole("button", { name: "2" });
    expect(page2Btn).toHaveAttribute("aria-current", "page");
  });

  it("supports lazy loading / carga diferida mode and loading more items", () => {
    render(<BecasExplorer {...defaultProps} />);

    // Switch to Carga Diferida mode
    const lazyModeBtn = screen.getByRole("button", { name: /Carga Diferida/i });
    fireEvent.click(lazyModeBtn);

    // Look for the "Cargar Más Convocatorias" button
    const loadMoreBtn = screen.getByRole("button", { name: /Cargar Más Convocatorias/i });
    expect(loadMoreBtn).toBeInTheDocument();

    // Click load more
    fireEvent.click(loadMoreBtn);
    expect(screen.getByText(/Progreso de carga/i)).toBeInTheDocument();
  });

  it("changes items per page when selecting size option", () => {
    const { container } = render(<BecasExplorer {...defaultProps} />);

    // Click on "Todas" items per page button by ID
    const allBtn = container.querySelector("#items-per-page-all");
    expect(allBtn).toBeInTheDocument();
    if (allBtn) {
      fireEvent.click(allBtn);
    }

    expect(screen.getByText(/Mostrando todas las/i)).toBeInTheDocument();
  });

  it("toggles favorites in memory and filters by My Favorites section", () => {
    const { container } = render(<BecasExplorer {...defaultProps} />);

    // Favourites start empty — nothing is restored from browser storage.
    const favTab = screen.getByRole("button", { name: /Mis Becas Favoritas/i });
    expect(favTab).toBeInTheDocument();
    fireEvent.click(favTab);
    expect(screen.getByText(/Sección: Mis Becas Guardadas/i)).toBeInTheDocument();

    // Switch back to all. The empty-favourites state also renders a
    // "Ver Todas las Convocatorias" call to action, so target the tab by id.
    const allTab = container.querySelector("#tab-all-scholarships");
    expect(allTab).toBeInTheDocument();
    fireEvent.click(allTab!);

    // Find favorite button on a card and click it
    const favButtons = container.querySelectorAll(
      'button[title*="favoritos"], button[title*="beca"]'
    );
    expect(favButtons.length).toBeGreaterThan(0);
    fireEvent.click(favButtons[0]);

    // The favourites tab counter reflects the new selection.
    expect(screen.getByRole("button", { name: /Mis Becas Favoritas\s*1/i })).toBeInTheDocument();
  });

  it("persists nothing to browser storage", () => {
    const { container } = render(<BecasExplorer {...defaultProps} />);

    const favButtons = container.querySelectorAll(
      'button[title*="favoritos"], button[title*="beca"]'
    );
    expect(favButtons.length).toBeGreaterThan(0);
    fireEvent.click(favButtons[0]);

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  /**
   * Regression for #39. The bundled dataset renders immediately, so the
   * catalogue was never blank — it was silently swapped when Firestore
   * answered, and a failed load was indistinguishable from a successful one.
   */
  describe("catalogue load status", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("announces that it is updating while the fetch is in flight", () => {
      vi.spyOn(firebase, "fetchScholarshipsFromDB").mockReturnValue(new Promise(() => {}));

      render(<BecasExplorer {...defaultProps} />);

      expect(screen.getByText(/Actualizando convocatorias/i)).toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
      // The bundled list stays on screen rather than being replaced by a
      // skeleton: it is real content, and hiding it would be a regression.
      expect(screen.getByText(/Directorio Oficial de Becas/i)).toBeInTheDocument();
    });

    it("clears the status once the live catalogue arrives", async () => {
      vi.spyOn(firebase, "fetchScholarshipsFromDB").mockResolvedValue([
        { id: "live-1", title: "Beca en vivo", country: "España" },
      ] as never);

      render(<BecasExplorer {...defaultProps} />);

      await waitFor(() =>
        expect(screen.queryByText(/Actualizando convocatorias/i)).not.toBeInTheDocument()
      );
      expect(screen.queryByText(/No pudimos cargar/i)).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false");
    });

    it("says the list is the bundled one when the fetch fails", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(firebase, "fetchScholarshipsFromDB").mockRejectedValue(new Error("offline"));

      render(<BecasExplorer {...defaultProps} />);

      // Visible, not just logged: a silent fallback is how a broken feature
      // goes unnoticed here.
      await waitFor(() => expect(screen.getByText(/No pudimos cargar/i)).toBeInTheDocument());
    });

    it("says the same when the collection is empty", async () => {
      vi.spyOn(firebase, "fetchScholarshipsFromDB").mockResolvedValue([] as never);

      render(<BecasExplorer {...defaultProps} />);

      await waitFor(() => expect(screen.getByText(/No pudimos cargar/i)).toBeInTheDocument());
    });
  });
});
