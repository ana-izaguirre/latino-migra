import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  const defaultProps = { activeTab: "becas" as const, setActiveTab: vi.fn() };

  it("renders nothing on the first screen", () => {
    // A trail from home to home says nothing.
    const { container } = render(<Breadcrumbs {...defaultProps} activeTab="home" />);
    expect(container.firstChild).toBeNull();
  });

  it("names the trail for assistive technology", () => {
    render(<Breadcrumbs {...defaultProps} />);
    expect(screen.getByRole("navigation")).toHaveAccessibleName(/breadcrumb/i);
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
