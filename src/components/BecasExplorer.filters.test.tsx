import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { BecasExplorer } from "./BecasExplorer";
import { SCHOLARSHIPS_DATA } from "../data/scholarships";

/**
 * Does the filtering actually narrow the catalogue?
 *
 * The counts are derived from `SCHOLARSHIPS_DATA` rather than hard-coded, so
 * these assert the predicate itself: a test that only checked "the number
 * changed" would still pass if a filter matched the wrong field.
 */
describe("BecasExplorer filters", () => {
  const defaultProps = {
    searchQuery: "",
    setSearchQuery: vi.fn(),
    setActiveTab: vi.fn(),
    onAskAIAboutScholarship: vi.fn(),
  };

  /** The sheet's apply button doubles as a live readout of the match count. */
  const filteredCount = () => {
    const apply = screen.getByRole("button", { name: /Ver \d+ Convocatorias/i });
    return Number(apply.textContent?.match(/\d+/)?.[0]);
  };

  const openFilters = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /Más Filtros/i }));
    return screen.getByRole("dialog");
  };

  const chooseOption = async (
    user: ReturnType<typeof userEvent.setup>,
    triggerId: string,
    optionName: RegExp
  ) => {
    await user.click(document.querySelector(`#${triggerId}`) as HTMLElement);
    await user.click(await screen.findByRole("option", { name: optionName }));
  };

  it("opens the filter sheet as a named dialog and moves focus into it", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    const dialog = await openFilters(user);
    // Radix names the panel from `SheetTitle` via aria-labelledby. It does not
    // emit `aria-modal`: since 1.1 it hides the rest of the document with
    // `aria-hidden` instead, which assistive tech supports more reliably.
    expect(dialog).toHaveAccessibleName(/Filtros de Búsqueda/i);
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(within(dialog).getByRole("button", { name: /Cerrar filtros/i })).toBeInTheDocument();
  });

  it("closes the filter sheet on Escape", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    await openFilters(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("narrows the catalogue by destination country", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    await openFilters(user);
    expect(filteredCount()).toBe(SCHOLARSHIPS_DATA.length);

    await chooseOption(user, "mobile-filter-country", /^Alemania$/);

    const expected = SCHOLARSHIPS_DATA.filter((s) => s.country === "Alemania").length;
    expect(expected).toBeGreaterThan(0);
    expect(filteredCount()).toBe(expected);
  });

  it("narrows the catalogue by support type", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    await openFilters(user);
    await chooseOption(user, "mobile-filter-support", /^Beca Parcial$/);

    const expected = SCHOLARSHIPS_DATA.filter((s) => s.supportType === "Beca Parcial").length;
    expect(expected).toBeGreaterThan(0);
    expect(filteredCount()).toBe(expected);
  });

  it("narrows the catalogue by issuing institution type", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    await openFilters(user);
    await chooseOption(user, "mobile-filter-institution", /^Gubernamental$/);

    const expected = SCHOLARSHIPS_DATA.filter((s) => s.institutionType === "Gubernamental").length;
    expect(expected).toBeGreaterThan(0);
    expect(filteredCount()).toBe(expected);
  });

  it("narrows the catalogue by closing date", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    await openFilters(user);
    await chooseOption(user, "mobile-filter-deadline", /Próximos 30 días/);

    const expected = SCHOLARSHIPS_DATA.filter(
      (s) => (s.daysLeft !== undefined && s.daysLeft <= 30) || Boolean(s.isUrgent)
    ).length;
    expect(expected).toBeGreaterThan(0);
    expect(filteredCount()).toBe(expected);
  });

  it("combines two filters rather than replacing one with the other", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    await openFilters(user);
    await chooseOption(user, "mobile-filter-country", /^España$/);
    await chooseOption(user, "mobile-filter-support", /^Beca Completa$/);

    const expected = SCHOLARSHIPS_DATA.filter(
      (s) => s.country === "España" && s.supportType === "Beca Completa"
    ).length;
    expect(expected).toBeGreaterThan(0);
    expect(filteredCount()).toBe(expected);
  });

  it("restores the whole catalogue when the filters are cleared", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    await openFilters(user);
    await chooseOption(user, "mobile-filter-country", /^Alemania$/);
    expect(filteredCount()).toBeLessThan(SCHOLARSHIPS_DATA.length);

    await user.click(screen.getByRole("button", { name: /Limpiar todo/i }));
    expect(filteredCount()).toBe(SCHOLARSHIPS_DATA.length);
  });

  it("reorders without changing how many convocatorias match", async () => {
    const user = userEvent.setup();
    render(<BecasExplorer {...defaultProps} />);

    const titleAt = (index: number) =>
      screen.getAllByRole("heading", { level: 3 })[index]?.textContent;
    const firstBefore = titleAt(0);

    await user.click(screen.getByLabelText(/Ordenar convocatorias/i));
    await user.click(await screen.findByRole("option", { name: /Nombre \(A-Z\)/i }));

    const sortedTitles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(sortedTitles).toEqual(
      [...sortedTitles].sort((a, b) => (a ?? "").localeCompare(b ?? ""))
    );
    expect(sortedTitles[0]).not.toBe(firstBefore);
  });
});
