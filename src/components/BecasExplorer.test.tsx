import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  /**
   * The screen used to carry a numbered pager and a "load more" button behind
   * a mode switch, plus a page-size selector — three controls doing one job.
   * On a phone the numbered pager was a row of tap targets nobody asked for.
   */
  describe("paging through the catalogue", () => {
    it("offers exactly one way to see more", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      expect(container.querySelector("#btn-load-more-scholarships")).toBeInTheDocument();
      expect(container.querySelector("#pagination-first-page")).toBeNull();
      expect(container.querySelector("#pagination-prev-page")).toBeNull();
      expect(container.querySelector("#mode-paginated-btn")).toBeNull();
      expect(container.querySelector("#mode-lazy-btn")).toBeNull();
      expect(container.querySelector('[id^="items-per-page-"]')).toBeNull();
    });

    it("starts with one batch and says how much of the catalogue that is", () => {
      render(<BecasExplorer {...defaultProps} />);

      expect(screen.getByText(/Mostrando/)).toHaveTextContent(/6.*de.*22 convocatorias/);
      expect(screen.getAllByRole("button", { name: /Ver Detalles/i })).toHaveLength(6);
    });

    it("adds a batch on each request and says how many that will be", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      const loadMore = container.querySelector("#btn-load-more-scholarships") as HTMLElement;
      expect(loadMore).toHaveTextContent(/\+6/);

      fireEvent.click(loadMore);
      expect(screen.getAllByRole("button", { name: /Ver Detalles/i })).toHaveLength(12);
    });

    it("never promises more than is left", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      // 22 scholarships: the first batch is 6, two more take it to 18, and
      // the button then has to offer the remaining 4 rather than a full batch.
      for (let i = 0; i < 2; i += 1) {
        fireEvent.click(container.querySelector("#btn-load-more-scholarships") as HTMLElement);
      }
      expect(container.querySelector("#btn-load-more-scholarships")).toHaveTextContent(/\+4/);
    });

    it("reports the end instead of a button that would add nothing", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      for (let i = 0; i < 4; i += 1) {
        const more = container.querySelector("#btn-load-more-scholarships");
        if (more) fireEvent.click(more as HTMLElement);
      }

      expect(container.querySelector("#btn-load-more-scholarships")).toBeNull();
      expect(screen.getByText(/Has llegado al final de las 22 convocatorias/i)).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "22");
    });

    it("goes back to the first batch when the filters change", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      fireEvent.click(container.querySelector("#btn-load-more-scholarships") as HTMLElement);
      expect(screen.getAllByRole("button", { name: /Ver Detalles/i })).toHaveLength(12);

      // What was loaded before a filter changed says nothing about what
      // matches after it.
      fireEvent.click(container.querySelector("#country-chip-España") as HTMLElement);
      expect(screen.getAllByRole("button", { name: /Ver Detalles/i }).length).toBeLessThanOrEqual(
        6
      );
    });

    it("announces loading progress rather than only drawing a bar", () => {
      render(<BecasExplorer {...defaultProps} />);

      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAccessibleName(/Progreso de carga/i);
      expect(bar).toHaveAttribute("aria-valuenow", "6");
      expect(bar).toHaveAttribute("aria-valuemax", "22");
    });
  });

  it("toggles favorites in memory and filters by My Favorites section", async () => {
    const user = userEvent.setup();
    const { container } = render(<BecasExplorer {...defaultProps} />);

    // Favourites start empty — nothing is restored from browser storage.
    // The view switcher is a real tablist, so the triggers carry `role="tab"`,
    // and they activate on pointer-down rather than on a bare click event —
    // hence `userEvent`, which fires the whole pointer sequence.
    const favTab = screen.getByRole("tab", { name: /Mis Becas Favoritas/i });
    expect(favTab).toBeInTheDocument();
    await user.click(favTab);
    expect(screen.getByText(/Sección: Mis Becas Guardadas/i)).toBeInTheDocument();

    // Switch back to all. The empty-favourites state also renders a
    // "Ver Todas las Convocatorias" call to action, so target the tab by id.
    const allTab = container.querySelector("#tab-all-scholarships");
    expect(allTab).toBeInTheDocument();
    await user.click(allTab!);

    // Find favorite button on a card and click it
    const favButtons = container.querySelectorAll(
      'button[title*="favoritos"], button[title*="beca"]'
    );
    expect(favButtons.length).toBeGreaterThan(0);
    fireEvent.click(favButtons[0]);

    // The favourites tab counter reflects the new selection.
    expect(screen.getByRole("tab", { name: /Mis Becas Favoritas\s*1/i })).toBeInTheDocument();
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

    it("gives up when the fetch never settles", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.spyOn(firebase, "fetchScholarshipsFromDB").mockReturnValue(new Promise(() => {}));

      render(<BecasExplorer {...defaultProps} />);
      expect(screen.getByText(/Actualizando convocatorias/i)).toBeInTheDocument();

      // An unreachable Firestore leaves the promise pending forever. Without a
      // timeout the notice sits there for the rest of the session, which on a
      // phone with a dead connection is the common case.
      await vi.advanceTimersByTimeAsync(9000);
      await waitFor(() => expect(screen.getByText(/No pudimos cargar/i)).toBeInTheDocument());

      vi.useRealTimers();
    });

    it("says the same when the collection is empty", async () => {
      vi.spyOn(firebase, "fetchScholarshipsFromDB").mockResolvedValue([] as never);

      render(<BecasExplorer {...defaultProps} />);

      await waitFor(() => expect(screen.getByText(/No pudimos cargar/i)).toBeInTheDocument());
    });
  });
  /**
   * The filters worked; the interface lied about what they would give. Counts
   * were computed against the whole catalogue while the list was filtered, so
   * "Alemania" showed 1 result and "Doctorado" still advertised 4 — and
   * picking both returned nothing. With 22 scholarships across 12 countries,
   * 30 of the 48 country x level combinations are empty.
   */
  describe("filters", () => {
    const chip = (container: HTMLElement, id: string) =>
      container.querySelector<HTMLButtonElement>(`#${id}`);

    /** The number shown in a chip's count badge. */
    const chipCount = (container: HTMLElement, id: string) => {
      const el = chip(container, id);
      if (!el) throw new Error(`missing chip #${id}`);
      return Number(el.textContent?.match(/(\d+)\s*$/)?.[1]);
    };

    it("puts the country filter before the education level", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      const country = chip(container, "country-chip-Todos");
      const level = chip(container, "edu-level-chip-todos");
      expect(country).toBeInTheDocument();
      expect(level).toBeInTheDocument();
      // The destination is the decision people arrive with, and it is what
      // makes the level counts mean anything.
      expect(country!.compareDocumentPosition(level!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("re-counts the education levels when a country is picked", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      const before = chipCount(container, "edu-level-chip-postgrado");
      fireEvent.click(chip(container, "country-chip-Alemania")!);
      const after = chipCount(container, "edu-level-chip-postgrado");

      expect(after).toBeLessThan(before);
      // Alemania has a single scholarship, so no level can promise more.
      expect(chipCount(container, "country-chip-Alemania")).toBe(1);
      expect(after).toBeLessThanOrEqual(1);
    });

    it("disables an option that would give no results instead of hiding it", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      fireEvent.click(chip(container, "country-chip-Alemania")!);

      // Every level that Alemania has nothing for is a dead end, and says so.
      const deadEnds = ["pregrado", "doctorado", "postdoctorado"].filter(
        (id) => chipCount(container, `edu-level-chip-${id}`) === 0
      );
      expect(deadEnds.length).toBeGreaterThan(0);
      deadEnds.forEach((id) => {
        const el = chip(container, `edu-level-chip-${id}`)!;
        // Still on screen: hiding it would make the list of levels shift
        // underneath the reader every time the country changed.
        expect(el).toBeInTheDocument();
        expect(el).toBeDisabled();
      });
    });

    it("counts every option against the catalogue, not against nothing", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      // 22 scholarships in the bundled dataset.
      expect(chipCount(container, "country-chip-Todos")).toBe(22);
      expect(chipCount(container, "edu-level-chip-todos")).toBe(22);
      expect(chipCount(container, "country-chip-España")).toBe(7);
    });

    describe("deadline filter", () => {
      beforeEach(() => {
        // The dataset carries fixed deadlines, so the clock has to be fixed
        // too or the expected counts drift with the calendar.
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      /**
       * Regression: the filter read `daysLeft`, which no scholarship carries.
       * "Cierra en 90 días" and "Más de 90 días" therefore matched the entire
       * catalogue — two of the three options did nothing at all.
       */
      it("narrows the list rather than matching everything", () => {
        const { container } = render(<BecasExplorer {...defaultProps} />);

        const total = chipCount(container, "sidebar-deadline-Todas");
        expect(chipCount(container, "sidebar-deadline-semester")).toBeLessThan(total);
        expect(chipCount(container, "sidebar-deadline-later")).toBeLessThan(total);
        expect(chipCount(container, "sidebar-deadline-urgent")).toBeLessThan(total);
      });

      it("splits the catalogue between the three ranges", () => {
        const { container } = render(<BecasExplorer {...defaultProps} />);

        // Counted by hand from the bundled deadlines against 2026-10-01:
        // one call already closed (2026-09-11), three close within 30 days,
        // nine within 90, and the remaining twelve later than that.
        expect(chipCount(container, "sidebar-deadline-Todas")).toBe(22);
        expect(chipCount(container, "sidebar-deadline-urgent")).toBe(3);
        expect(chipCount(container, "sidebar-deadline-semester")).toBe(9);
        expect(chipCount(container, "sidebar-deadline-later")).toBe(12);
      });
    });

    it("offers no native select on the mobile filter sheet", () => {
      const { container } = render(<BecasExplorer {...defaultProps} />);

      fireEvent.click(container.querySelector("#btn-open-mobile-filters")!);
      // The sheet is the shared `Modal`, so it is addressed by its role
      // rather than by a class the panel happens to carry.
      const sheet = screen.getByRole("dialog");

      // A phone's own picker cannot show how many results an option leads to,
      // and with most combinations empty that count is the point.
      expect(within(sheet).queryByRole("combobox")).toBeNull();
      expect(sheet.querySelectorAll("select")).toHaveLength(0);
      expect(sheet).toHaveAccessibleName(/Filtros de Búsqueda/i);
      // The sheet is portalled to `document.body`, so it is outside the
      // render container that the other assertions use.
      expect(sheet.querySelector("#sheet-country-España")).toBeInTheDocument();
    });
  });
});
