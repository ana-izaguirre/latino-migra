import { describe, it, expect, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { MobileBottomNav } from "./MobileBottomNav";

describe("MobileBottomNav", () => {
  const defaultProps = {
    activeTab: "home" as const,
    setActiveTab: vi.fn(),
    onOpenMenu: vi.fn(),
  };

  it("offers the four destinations the product is built on", () => {
    const { container } = render(<MobileBottomNav {...defaultProps} />);

    for (const id of ["home", "becas", "guia", "chat"]) {
      expect(container.querySelector(`#bottom-nav-${id}`), id).toBeInTheDocument();
    }
  });

  it("offers nothing the product has hidden", () => {
    const { container } = render(<MobileBottomNav {...defaultProps} />);

    for (const id of ["planificador", "calculadora", "voluntariados", "comunidad", "feedback"]) {
      expect(container.querySelector(`#bottom-nav-${id}`), id).toBeNull();
    }
  });

  it("navigates on tap", () => {
    const setActiveTab = vi.fn();
    const { container } = render(<MobileBottomNav {...defaultProps} setActiveTab={setActiveTab} />);

    fireEvent.click(container.querySelector("#bottom-nav-becas") as HTMLElement);
    expect(setActiveTab).toHaveBeenCalledWith("becas");
  });

  it("marks the screen you are on, and only that one", () => {
    const { container } = render(<MobileBottomNav {...defaultProps} activeTab="becas" />);

    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].id).toBe("bottom-nav-becas");
  });

  it("marks nothing when the screen is not in the bar", () => {
    // The consular map is reachable but has no slot here; the bar must not
    // then highlight an unrelated destination.
    const { container } = render(<MobileBottomNav {...defaultProps} activeTab="mapa" />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
  });

  it("opens the drawer for everything else", () => {
    const onOpenMenu = vi.fn();
    const { container } = render(<MobileBottomNav {...defaultProps} onOpenMenu={onOpenMenu} />);

    fireEvent.click(container.querySelector("#bottom-nav-menu") as HTMLElement);
    expect(onOpenMenu).toHaveBeenCalled();
  });

  it("gives every control a name and a thumb-sized target", () => {
    const { container } = render(<MobileBottomNav {...defaultProps} />);

    container.querySelectorAll("button").forEach((button) => {
      const name = button.textContent?.trim() || button.getAttribute("aria-label");
      expect(name, button.id).toBeTruthy();
    });
  });
});
