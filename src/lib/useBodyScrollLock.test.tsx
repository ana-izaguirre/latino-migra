import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useBodyScrollLock } from "./useBodyScrollLock";

/**
 * Regression cover for the frozen-page bug: a `fixed` overlay left the document
 * scrollable underneath, so swiping moved the page while the panel stayed put
 * and the screen read as stuck.
 */
const Harness = ({ locked, reset = false }: { locked: boolean; reset?: boolean }) => {
  const resetRef = useRef(reset);
  resetRef.current = reset;
  useBodyScrollLock(locked, resetRef);
  return <div data-testid="harness">{locked ? "open" : "closed"}</div>;
};

describe("useBodyScrollLock", () => {
  let scrolledTo: { top: number; behavior: string } | null;

  beforeEach(() => {
    scrolledTo = null;
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    vi.spyOn(window, "scrollTo").mockImplementation((arg: any) => {
      scrolledTo = arg;
    });
  });

  afterEach(() => {
    document.body.removeAttribute("style");
    vi.restoreAllMocks();
  });

  it("does nothing while closed", () => {
    render(<Harness locked={false} />);
    expect(document.body.style.position).toBe("");
    expect(document.body.style.overflow).toBe("");
  });

  it("pins the body at the current scroll position while open", () => {
    (window as any).scrollY = 640;
    render(<Harness locked />);

    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.width).toBe("100%");
    // Negative offset keeps the same content under the viewport.
    expect(document.body.style.top).toBe("-640px");
  });

  it("restores the reading position on close", () => {
    (window as any).scrollY = 640;
    const { rerender } = render(<Harness locked />);
    rerender(<Harness locked={false} />);

    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(document.body.style.overflow).toBe("");
    // "instant", not "auto": the page sets scroll-behavior: smooth, so "auto"
    // would animate the restore.
    expect(scrolledTo).toEqual({ top: 640, behavior: "instant" });
  });

  it("returns to the top instead when the close also navigates", () => {
    (window as any).scrollY = 640;
    const { rerender } = render(<Harness locked reset />);
    rerender(<Harness locked={false} reset />);

    expect(scrolledTo).toEqual({ top: 0, behavior: "instant" });
  });

  it("restores the body when the component unmounts while still open", () => {
    (window as any).scrollY = 200;
    const { unmount } = render(<Harness locked />);
    expect(document.body.style.position).toBe("fixed");

    unmount();

    // An overlay unmounted without its state flipping first must not leave the
    // page frozen with no way to unfreeze it.
    expect(document.body.style.position).toBe("");
    expect(document.body.style.overflow).toBe("");
  });

  it("leaves styles it did not set alone", () => {
    document.body.style.overflow = "visible";
    (window as any).scrollY = 0;
    const { rerender } = render(<Harness locked />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Harness locked={false} />);
    expect(document.body.style.overflow).toBe("visible");
  });

  it("keeps the harness rendering", () => {
    render(<Harness locked />);
    expect(screen.getByTestId("harness")).toHaveTextContent("open");
    fireEvent.click(screen.getByTestId("harness"));
  });
});
