import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { BecasExplorer } from "./BecasExplorer";
import * as firebase from "../lib/firebase";
import { STUDY_BATCH_SIZE } from "../lib/useStudyFilters";

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

    const detailButtons = screen.getAllByRole("button", { name: /Ver Detalles/i });
    expect(detailButtons.length).toBeGreaterThan(0);
    fireEvent.click(detailButtons[0]);

    // Requisitos and beneficios collapse on a phone, so the panel is
    // addressed by its controls rather than by the headings inside them.
    expect(document.getElementById("beca-requisitos")).toBeInTheDocument();
    expect(document.getElementById("beca-beneficios")).toBeInTheDocument();
    // The disclosure control reads "Ver requisitos principales", so match the
    // heading by role rather than by a case-insensitive substring.
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Requisitos Principales" })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: "Beneficios Incluidos" })
    ).toBeInTheDocument();
  });

  /**
   * The panel arrived as one wall of text with three equally loud buttons,
   * one of which offered an assistant that cannot yet answer about a specific
   * call, and another of which said "Agendar" — which reads as booking an
   * appointment with somebody.
   */
  describe("the scholarship detail panel", () => {
    const openFirstDetail = () => {
      const result = render(<BecasExplorer {...defaultProps} />);
      fireEvent.click(screen.getAllByRole("button", { name: /Ver Detalles/i })[0]);
      return result;
    };

    it("collapses requisitos and beneficios, closed to begin with", () => {
      openFirstDetail();

      for (const id of ["beca-requisitos", "beca-beneficios"]) {
        expect(document.getElementById(id), id).toHaveAttribute("aria-expanded", "false");
      }
    });

    it("opens a section when its control is used", () => {
      openFirstDetail();

      const control = document.getElementById("beca-requisitos") as HTMLElement;
      fireEvent.click(control);

      expect(control).toHaveAttribute("aria-expanded", "true");
      expect(document.getElementById("beca-requisitos-panel")).not.toHaveClass("hidden");
    });

    it("says the calendar action creates a reminder, not an appointment", () => {
      openFirstDetail();

      const link = document.getElementById("beca-calendar-reminder");
      expect(link).toHaveTextContent(/Recordarme la fecha límite/i);
      expect(link).not.toHaveTextContent(/Agendar/i);

      // The event that lands in the reader's calendar says so too.
      // Query strings encode spaces as `+`, which decodeURIComponent leaves
      // alone.
      const href = decodeURIComponent(link?.getAttribute("href") ?? "").replace(/\+/g, " ");
      expect(href).toMatch(/Recordatorio: cierra la beca/);
      expect(href).not.toMatch(/Cierre de Convocatoria/);
    });

    it("links to the official call exactly once", () => {
      const { container } = openFirstDetail();

      // The header and the action row both linked to the same page.
      const officialLinks = [...container.ownerDocument.querySelectorAll("a")].filter((a) =>
        /convocatoria oficial/i.test(a.textContent || "")
      );
      expect(officialLinks).toHaveLength(1);
      expect(document.getElementById("beca-official-link")).toHaveAttribute("target", "_blank");
      expect(document.getElementById("beca-official-link")).toHaveAttribute(
        "rel",
        expect.stringContaining("noopener")
      );
    });

    it("hides the assistant button without unwiring it", () => {
      const onAskAIAboutScholarship = vi.fn();
      render(<BecasExplorer {...defaultProps} onAskAIAboutScholarship={onAskAIAboutScholarship} />);
      fireEvent.click(screen.getAllByRole("button", { name: /Ver Detalles/i })[0]);

      expect(document.getElementById("beca-ask-ai")).toBeNull();
      expect(screen.queryByRole("button", { name: /Consultar IA/i })).toBeNull();
      expect(onAskAIAboutScholarship).not.toHaveBeenCalled();
    });

    it("keeps every action reachable by a thumb", () => {
      openFirstDetail();

      for (const id of ["beca-official-link", "beca-calendar-reminder"]) {
        expect(document.getElementById(id), id).toHaveClass("min-h-[44px]");
      }
    });
  });

  /**
   * Regression for #82. Favourites held bare scholarship ids, so a language
   * certification or a vocational programme could be found and not kept — and
   * with two catalogues on one screen a bare id no longer identifies anything.
   */
  describe("favourites across both catalogues", () => {
    const openStudies = async () => {
      const user = userEvent.setup();
      const result = render(<BecasExplorer {...defaultProps} />);
      await user.click(screen.getByRole("tab", { name: /Cursos, Certificados y FP/i }));
      return { ...result, user };
    };

    it("saves a study programme and shows it in the saved tab", async () => {
      const { user } = await openStudies();

      const heart = document.querySelector('[id^="estudio-fav-"]') as HTMLElement;
      expect(heart).toBeTruthy();
      expect(heart).toHaveAttribute("aria-pressed", "false");

      const programmeId = heart.id.replace("estudio-fav-", "");
      fireEvent.click(heart);
      expect(heart).toHaveAttribute("aria-pressed", "true");

      await user.click(screen.getByRole("tab", { name: /Mis Guardados/i }));

      expect(document.getElementById("saved-programmes")).toBeInTheDocument();
      expect(document.getElementById(`estudio-card-${programmeId}`)).toBeInTheDocument();
    });

    it("counts saved scholarships and programmes together", async () => {
      const { user } = await openStudies();

      fireEvent.click(document.querySelector('[id^="estudio-fav-"]') as HTMLElement);
      await user.click(screen.getByRole("tab", { name: /Todas las Convocatorias/i }));

      const scholarshipHeart = document.querySelector(
        'button[title*="favoritos"], button[title*="beca"]'
      ) as HTMLElement;
      fireEvent.click(scholarshipHeart);

      expect(screen.getByRole("tab", { name: /Mis Guardados\s*2/i })).toBeInTheDocument();
    });

    it("restores a bookmark written before the change as a scholarship", async () => {
      // Documents written before #82 carry `scholarshipId` and no kind. They
      // must still resolve, or every reader's saved list empties on deploy.
      vi.spyOn(firebase, "fetchUserBookmarks").mockResolvedValue([
        "scholarship:beca-carolina-2026",
      ]);

      render(
        <BecasExplorer
          {...defaultProps}
          currentUser={{
            id: "u1",
            name: "Ana",
            email: "ana@example.com",
            avatar: "",
            signedInAt: "hoy",
          }}
        />
      );

      await waitFor(() =>
        expect(screen.getByRole("tab", { name: /Mis Guardados\s*1/i })).toBeInTheDocument()
      );
    });
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
    const favTab = screen.getByRole("tab", { name: /Mis Guardados/i });
    expect(favTab).toBeInTheDocument();
    await user.click(favTab);
    expect(screen.getByText(/Sección: Mis Guardados/i)).toBeInTheDocument();

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
    expect(screen.getByRole("tab", { name: /Mis Guardados\s*1/i })).toBeInTheDocument();
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

    /*
      The studies half of the screen used to render its own filter block,
      full-width above the results, while the scholarships used a sticky
      sidebar and a sheet. One screen, two products (#105).
    */
    describe("parity with the studies tab", () => {
      /**
       * The tab triggers activate on pointer-down rather than on a bare click
       * event, so the whole pointer sequence has to be fired.
       */
      const openStudies = async () => {
        const user = userEvent.setup();
        const result = render(<BecasExplorer {...defaultProps} />);
        await user.click(result.container.querySelector("#tab-estudios")!);
        return result;
      };

      it("puts the study filters in the same sidebar as the scholarship ones", async () => {
        const { container } = await openStudies();

        const sidebar = container.querySelector("aside")!;
        expect(sidebar.querySelector("#sidebar-estudios-route-chip-directa")).toBeInTheDocument();
        expect(sidebar.querySelector("#sidebar-estudios-country-chip-Todos")).toBeInTheDocument();
        // The scholarship chips are not rendered beside them: two filter sets
        // on one list is how the favourites tab started lying about itself.
        expect(sidebar.querySelector("#sidebar-country-Todos")).toBeNull();
      });

      it("opens the same sheet on a phone, with the study filters inside", async () => {
        const { container } = await openStudies();

        // The trigger lives in the mobile bar, which used to render only for
        // scholarships — leaving the studies tab with no filters at all below
        // `lg`, since the sidebar is `hidden lg:block`.
        fireEvent.click(container.querySelector("#btn-open-mobile-filters")!);
        const sheet = screen.getByRole("dialog");
        expect(sheet.querySelector("#sheet-estudios-kind-chip-curso")).toBeInTheDocument();
        expect(sheet.querySelectorAll("select")).toHaveLength(0);
      });

      it("clears the filters of the catalogue that is showing", async () => {
        const { container } = await openStudies();

        const list = () => container.querySelector("#estudios-list");
        const before = list()!.children.length;

        fireEvent.click(container.querySelector("#sidebar-estudios-kind-chip-certificado")!);
        expect(list()!.children.length).toBeLessThan(before);

        // Same control as the scholarships use. Wired to `clearFilters` it
        // reset the scholarship state and left this list narrowed.
        fireEvent.click(container.querySelector("#clear-filters-btn")!);
        expect(list()!.children.length).toBe(before);
      });

      it("renames the whole screen, not just the list", async () => {
        const { container } = await openStudies();

        // Reported from a live screenshot: the page still announced itself as
        // "Directorio Oficial de Becas" while showing a list of courses, and
        // offered to suggest a scholarship.
        expect(screen.queryByText(/Directorio Oficial de Becas/i)).not.toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: /Estudiar sin beca/i, level: 1 })
        ).toBeInTheDocument();
        expect(screen.getByText(/Rutas de estudio que no dependen/i)).toBeInTheDocument();
        expect(container.querySelector("#suggest-scholarship-btn")).toHaveTextContent(
          /Sugerir Curso Oficial/i
        );

        // The crumb names the sub-page rather than stopping at the directory.
        expect(
          within(container.querySelector('[aria-label="Breadcrumbs"]')!).getByText(
            /Cursos, Certificados y FP/i
          )
        ).toBeInTheDocument();
      });

      it("renames the suggestion form to match the catalogue", async () => {
        const { container } = await openStudies();
        fireEvent.click(container.querySelector("#suggest-scholarship-btn")!);

        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText(/Sugerir Curso, Certificado o FP/i)).toBeInTheDocument();
        expect(within(dialog).getByText(/Nombre del Programa/i)).toBeInTheDocument();
        expect(within(dialog).queryByText(/Sugerir Beca Universitaria/i)).not.toBeInTheDocument();
      });

      it("renders one heading for the screen, not two stacked", async () => {
        await openStudies();

        // The section repeated the page title inside the content column.
        expect(screen.getAllByText(/Estudiar sin beca/i)).toHaveLength(1);
        expect(document.getElementById("estudios-heading")).not.toBeInTheDocument();
      });

      it("reports its size in the same toolbar the scholarships use", async () => {
        const { container } = await openStudies();

        const toolbar = container.querySelector("#estudios-toolbar");
        expect(toolbar).toBeInTheDocument();
        expect(toolbar).toHaveTextContent(/Mostrando/i);
        // A bordered container, not a bare paragraph.
        expect(toolbar?.className).toMatch(/rounded-2xl/);
        expect(toolbar?.className).toMatch(/border/);
      });

      it("gives each card the cover the scholarship cards have", async () => {
        const { container } = await openStudies();

        const cover = container.querySelector('[id^="estudio-cover-"]');
        expect(cover).toBeInTheDocument();
        // The heart sits on the cover, as it does on a scholarship card.
        expect(container.querySelector('[id^="estudio-fav-"]')).toBeInTheDocument();
      });

      it("orders the list by what a programme actually carries", async () => {
        const { container } = await openStudies();

        const sort = container.querySelector("#estudios-sort-select");
        expect(sort).toBeInTheDocument();
        // A programme has no closing date, so the scholarship options would
        // sort by a field no record carries.
        expect(sort).not.toHaveTextContent(/Cierre/i);
        expect(sort).toHaveTextContent(/Nombre/i);

        const titles = () =>
          Array.from(container.querySelectorAll('[id^="estudio-card-"] h3')).map(
            (h) => h.textContent ?? ""
          );
        const rendered = titles();
        expect(rendered).toEqual([...rendered].sort((a, b) => a.localeCompare(b, "es")));
      });

      it("pages the study list in the same batches", async () => {
        const { container } = await openStudies();

        const shown = () => container.querySelector("#estudios-list")!.children.length;
        expect(shown()).toBe(STUDY_BATCH_SIZE);
        fireEvent.click(container.querySelector("#btn-load-more-estudios")!);
        expect(shown()).toBe(STUDY_BATCH_SIZE * 2);
      });
    });
  });

  /**
   * The suggestion form. It is the only way a reader can add to a catalogue
   * whose whole claim is that every entry is an official source, so its
   * behaviour is worth pinning.
   */
  describe("suggesting an official scholarship", () => {
    const openForm = () => {
      const result = render(<BecasExplorer {...defaultProps} />);
      fireEvent.click(document.getElementById("suggest-scholarship-btn") as HTMLElement);
      return result;
    };

    it("asks for the institution, the country and the link", () => {
      openForm();
      const dialog = screen.getByRole("dialog");

      expect(within(dialog).getByText(/Universidad o Institución/i)).toBeInTheDocument();
      expect(within(dialog).getByText(/País Destino/i)).toBeInTheDocument();
    });

    it("will not submit without the institution", () => {
      openForm();

      const input = screen
        .getByRole("dialog")
        .querySelector('input[type="text"]') as HTMLInputElement;
      // Required, so an empty form cannot reach the catalogue at all.
      expect(input).toBeRequired();
      expect(input.value).toBe("");
    });

    it("keeps what was typed while the form is open", () => {
      openForm();

      const input = screen
        .getByRole("dialog")
        .querySelector('input[type="text"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Universidad Autónoma de Madrid" } });

      expect(input.value).toBe("Universidad Autónoma de Madrid");
    });

    it("confirms the suggestion was sent for verification", () => {
      openForm();

      const form = screen.getByRole("dialog").querySelector("form") as HTMLFormElement;
      const input = form.querySelector('input[type="text"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Universidad de Salamanca" } });
      fireEvent.submit(form);

      // Verification is the point: nothing enters the catalogue unchecked.
      expect(screen.getByText(/enviada para verificación/i)).toBeInTheDocument();
    });

    it("does not close the panel the moment it is opened", () => {
      openForm();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/Sugerir Beca Universitaria/i)).toBeInTheDocument();
    });
  });
});
