import { describe, it, expect, vi } from "vitest";
import { screen, act } from "@testing-library/react";
import React from "react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { useLanguage } from "../lib/i18n";
import { Breadcrumbs } from "./Breadcrumbs";
import { Footer } from "./Footer";
import { ScrollTopBottomButton } from "./ScrollTopBottomButton";
import { MobileBottomNav } from "./MobileBottomNav";

/**
 * Regression for #51 on the chrome — the parts of the page that surround every
 * screen and so leak in both directions.
 *
 * These four carried their own `language === "en" ? … : …` ternaries, and the
 * ones they missed stayed in one language whatever the reader chose: the
 * breadcrumb announced itself as "Breadcrumbs" to a screen reader on a Spanish
 * page, and the scroll controls' `aria-label` was English-only.
 */
const LanguageSwitch: React.FC = () => {
  const { setLanguage } = useLanguage();
  return (
    <button type="button" onClick={() => setLanguage("en")}>
      switch-to-english
    </button>
  );
};

const toEnglish = () =>
  act(() => {
    screen.getByRole("button", { name: "switch-to-english" }).click();
  });

describe("chrome translation", () => {
  it("translates the breadcrumb, including the label only a screen reader hears", () => {
    render(
      <>
        <LanguageSwitch />
        <Breadcrumbs activeTab="guia" setActiveTab={vi.fn()} />
      </>
    );

    expect(screen.getByRole("navigation")).toHaveAccessibleName(/rutas de navegación/i);
    expect(screen.getByText("Guía de Migración")).toBeInTheDocument();

    toEnglish();
    expect(screen.getByRole("navigation")).toHaveAccessibleName(/breadcrumbs/i);
    expect(screen.getByText("Migration Guide")).toBeInTheDocument();
  });

  it("translates the scroll controls' title and label together", () => {
    render(
      <>
        <LanguageSwitch />
        <ScrollTopBottomButton />
      </>
    );

    // The control hides itself until the page is long or scrolled, so the
    // assertions below would pass against nothing without this.
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    const top = () => document.getElementById("scroll-to-top-btn");
    expect(top(), "the control never became visible").not.toBeNull();

    // The label and the tooltip must agree: they were a Spanish title beside
    // an English `aria-label`, so the two disagreed in every language.
    expect(top()).toHaveAttribute("title", "Subir al inicio");
    expect(top()).toHaveAttribute("aria-label", "Subir al inicio");

    toEnglish();
    expect(top()).toHaveAttribute("title", "Scroll to Top");
    expect(top()).toHaveAttribute("aria-label", "Scroll to Top");
  });

  it("translates the bottom bar, the only navigation a phone has", () => {
    render(
      <>
        <LanguageSwitch />
        <MobileBottomNav activeTab="becas" setActiveTab={vi.fn()} onOpenMenu={vi.fn()} />
      </>
    );

    const bar = () => document.getElementById("mobile-bottom-nav")!;
    expect(bar()).toHaveAttribute("aria-label", "Navegación principal");
    expect(bar()).toHaveTextContent("Guías");

    toEnglish();
    expect(bar()).toHaveAttribute("aria-label", "Primary navigation");
    expect(bar()).toHaveTextContent("Guides");
    expect(bar()).not.toHaveTextContent("Guías");
  });

  it("translates the footer's mission and its links", () => {
    render(
      <>
        <LanguageSwitch />
        <Footer setActiveTab={vi.fn()} />
      </>
    );

    expect(screen.getByText(/Empoderando a la comunidad/i)).toBeInTheDocument();

    toEnglish();
    expect(screen.queryByText(/Empoderando a la comunidad/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Empowering Latin American/i)).toBeInTheDocument();
  });
});
