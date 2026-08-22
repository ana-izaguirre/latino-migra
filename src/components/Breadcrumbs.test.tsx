import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { Breadcrumbs } from "./Breadcrumbs";
import { useLanguage } from "../lib/i18n";

/** Flips the shared language from inside the provider tree. */
const LanguageSwitch: React.FC = () => {
  const { setLanguage } = useLanguage();
  return (
    <button type="button" onClick={() => setLanguage("en")}>
      switch-to-english
    </button>
  );
};

describe("Breadcrumbs", () => {
  const defaultProps = { activeTab: "becas" as const, setActiveTab: vi.fn() };

  it("renders nothing on the first screen", () => {
    // A trail from home to home says nothing.
    const { container } = render(<Breadcrumbs {...defaultProps} activeTab="home" />);
    expect(container.firstChild).toBeNull();
  });

  it("names the trail for assistive technology, in the reader's language", () => {
    render(
      <>
        <LanguageSwitch />
        <Breadcrumbs {...defaultProps} />
      </>
    );

    // The label was the literal "Breadcrumbs" — English announced to a screen
    // reader on a Spanish page, which is the half-and-half state of #51.
    expect(screen.getByRole("navigation")).toHaveAccessibleName(/rutas de navegación/i);

    act(() => {
      screen.getByRole("button", { name: "switch-to-english" }).click();
    });
    expect(screen.getByRole("navigation")).toHaveAccessibleName(/breadcrumbs/i);
  });

  it("names the screen in the reader's language", () => {
    render(
      <>
        <LanguageSwitch />
        <Breadcrumbs {...defaultProps} />
      </>
    );

    expect(screen.getByText("Catálogo de Becas")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "switch-to-english" }).click();
    });

    // The crumb carried its own label map beside the dictionary's `nav.*`
    // entries, so it kept naming the screen in Spanish after the switch.
    expect(screen.getByText("Scholarship Directory")).toBeInTheDocument();
    expect(screen.queryByText("Catálogo de Becas")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Home$/ })).toBeInTheDocument();
  });

  it("offers a way back to the first screen", () => {
    const setActiveTab = vi.fn();
    render(<Breadcrumbs {...defaultProps} setActiveTab={setActiveTab} />);

    fireEvent.click(screen.getByRole("button", { name: /Inicio/i }));
    expect(setActiveTab).toHaveBeenCalledWith("home");
  });

  it("names the screen you are on", () => {
    render(<Breadcrumbs {...defaultProps} />);
    expect(screen.getByText(/Catálogo de Becas/i)).toBeInTheDocument();
  });

  it("adds the sub-page when one is given", () => {
    render(<Breadcrumbs {...defaultProps} subPageTitle="Beca DAAD" />);

    expect(screen.getByText(/Catálogo de Becas/i)).toBeInTheDocument();
    expect(screen.getByText("Beca DAAD")).toBeInTheDocument();
  });

  it("falls back to the tab's own name rather than rendering a blank step", () => {
    render(<Breadcrumbs {...defaultProps} activeTab={"guia"} />);
    expect(screen.getByText(/Guía de Migración/i)).toBeInTheDocument();
  });

  it("accepts extra classes without losing its own layout", () => {
    render(<Breadcrumbs {...defaultProps} className="mb-4" />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("mb-4");
    // The trail scrolls rather than wrapping: it sits above the page title
    // on a phone.
    expect(nav).toHaveClass("overflow-x-auto");
  });
});
