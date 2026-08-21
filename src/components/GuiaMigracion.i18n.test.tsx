import { describe, it, expect, vi } from "vitest";
import { screen, act } from "@testing-library/react";
import React from "react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { GuiaMigracion } from "./GuiaMigracion";
import { TRANSLATIONS, useLanguage } from "../lib/i18n";

/**
 * The other half of #51. `GuiaMigracion` called `t()` zero times, so the
 * guides stayed entirely in Spanish while the breadcrumbs above them read
 * "Home / Migration Guide".
 */
const Toggle: React.FC = () => {
  const { setLanguage, language } = useLanguage();
  return (
    <button type="button" onClick={() => setLanguage(language === "es" ? "en" : "es")}>
      toggle
    </button>
  );
};

describe("GuiaMigracion translation", () => {
  const defaultProps = { setActiveTab: vi.fn(), onAskAIAboutGuide: vi.fn() };

  const renderWithToggle = () =>
    render(
      <>
        <Toggle />
        <GuiaMigracion {...defaultProps} />
      </>
    );

  const toggle = () =>
    act(() => {
      screen.getByRole("button", { name: "toggle" }).click();
    });

  it("renders Spanish by default", () => {
    render(<GuiaMigracion {...defaultProps} />);
    expect(screen.getByText(/Ruta Migratoria y Cronograma Realista/i)).toBeInTheDocument();
  });

  it("changes the screen's own copy, not only the chrome", () => {
    renderWithToggle();
    toggle();

    expect(screen.getByText(/Migration Route and Realistic Timeline/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ruta Migratoria y Cronograma Realista/i)).toBeNull();
  });

  it("translates the collapse controls a phone reader operates", () => {
    renderWithToggle();
    toggle();

    expect(screen.getByText(/See the document list/i)).toBeInTheDocument();
    expect(screen.getAllByText(/See requirements and paperwork/i).length).toBeGreaterThan(0);
  });

  it("translates the anti-scam section", () => {
    renderWithToggle();
    toggle();

    expect(screen.getByText(/Protection and Fraud Prevention/i)).toBeInTheDocument();
    expect(screen.getByText(/See common scams and how to report them/i)).toBeInTheDocument();
  });

  it("goes back to Spanish", () => {
    renderWithToggle();
    toggle();
    toggle();

    expect(screen.getByText(/Ruta Migratoria y Cronograma Realista/i)).toBeInTheDocument();
  });

  describe("the dictionary", () => {
    const guiaKeys = Object.keys(TRANSLATIONS).filter((key) => key.startsWith("guia."));

    it("carries entries for this screen", () => {
      expect(guiaKeys.length).toBeGreaterThan(25);
    });

    it("fills in both languages for every key", () => {
      for (const key of guiaKeys) {
        expect(TRANSLATIONS[key].es, key).toBeTruthy();
        expect(TRANSLATIONS[key].en, key).toBeTruthy();
      }
    });

    it("ships no English string identical to its Spanish one", () => {
      // A missing translation falls back to Spanish, which looks exactly like
      // the bug being fixed.
      const untranslated = guiaKeys.filter((key) => TRANSLATIONS[key].es === TRANSLATIONS[key].en);
      expect(untranslated, untranslated.join(", ")).toEqual([]);
    });
  });
});
