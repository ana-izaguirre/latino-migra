import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, within, act } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { BecasExplorer } from "./BecasExplorer";
import { TRANSLATIONS, useLanguage } from "../lib/i18n";
import React from "react";

/**
 * Regression for #51.
 *
 * Switching to English changed the navigation, the footer and 31 strings —
 * and nothing else. `t()` was called in 4 of 20 components, and this screen,
 * the one the product is built around, called it zero times. The mechanism
 * had always worked; the coverage was never built.
 */

/** Flips the shared language from inside the provider tree. */
const LanguageSwitch: React.FC = () => {
  const { setLanguage } = useLanguage();
  return (
    <button type="button" onClick={() => setLanguage("en")}>
      switch-to-english
    </button>
  );
};

describe("BecasExplorer translation", () => {
  const defaultProps = {
    searchQuery: "",
    setSearchQuery: vi.fn(),
    setActiveTab: vi.fn(),
    onAskAIAboutScholarship: vi.fn(),
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithSwitch = () =>
    render(
      <>
        <LanguageSwitch />
        <BecasExplorer {...defaultProps} />
      </>
    );

  it("renders Spanish by default", () => {
    render(<BecasExplorer {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: /Directorio Oficial de Becas/i })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ver Detalles/i }).length).toBeGreaterThan(0);
  });

  it("changes the screen's own copy when the language changes", () => {
    renderWithSwitch();

    expect(
      screen.getByRole("heading", { name: /Directorio Oficial de Becas/i })
    ).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "switch-to-english" }).click();
    });

    // Not just the navigation and the footer: the screen itself.
    expect(
      screen.getByRole("heading", { name: /Official Scholarship Directory/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Directorio Oficial de Becas/i })).toBeNull();
  });

  it("translates the controls a reader actually operates", () => {
    renderWithSwitch();

    act(() => {
      screen.getByRole("button", { name: "switch-to-english" }).click();
    });

    expect(screen.getAllByRole("button", { name: /View Details/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /More Filters/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /All Calls/i })).toBeInTheDocument();
  });

  it("translates the filter groups, not only the headings", () => {
    renderWithSwitch();

    act(() => {
      screen.getByRole("button", { name: "switch-to-english" }).click();
    });

    expect(screen.getAllByText(/Destination Country/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Education Level/i).length).toBeGreaterThan(0);
  });

  it("translates the detail panel", () => {
    renderWithSwitch();

    act(() => {
      screen.getByRole("button", { name: "switch-to-english" }).click();
    });
    act(() => {
      screen.getAllByRole("button", { name: /View Details/i })[0].click();
    });

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Key Requirements" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "What Is Included" })).toBeInTheDocument();
  });

  it("goes back to Spanish", () => {
    const Toggle: React.FC = () => {
      const { setLanguage, language } = useLanguage();
      return (
        <button type="button" onClick={() => setLanguage(language === "es" ? "en" : "es")}>
          toggle
        </button>
      );
    };

    render(
      <>
        <Toggle />
        <BecasExplorer {...defaultProps} />
      </>
    );

    const toggle = screen.getByRole("button", { name: "toggle" });
    act(() => toggle.click());
    expect(
      screen.getByRole("heading", { name: /Official Scholarship Directory/i })
    ).toBeInTheDocument();

    act(() => toggle.click());
    expect(
      screen.getByRole("heading", { name: /Directorio Oficial de Becas/i })
    ).toBeInTheDocument();
  });

  describe("the dictionary itself", () => {
    const becasKeys = Object.keys(TRANSLATIONS).filter((key) => key.startsWith("becas."));

    it("carries an entry for this screen", () => {
      expect(becasKeys.length).toBeGreaterThan(40);
    });

    it("has both languages filled in for every key", () => {
      // A missing `en` silently falls back to Spanish, which looks exactly
      // like the bug this issue is about.
      for (const key of becasKeys) {
        expect(TRANSLATIONS[key].es, key).toBeTruthy();
        expect(TRANSLATIONS[key].en, key).toBeTruthy();
      }
    });

    it("does not ship an English string identical to its Spanish one", () => {
      const untranslated = becasKeys.filter((key) => TRANSLATIONS[key].es === TRANSLATIONS[key].en);
      expect(untranslated, untranslated.join(", ")).toEqual([]);
    });
  });
});
