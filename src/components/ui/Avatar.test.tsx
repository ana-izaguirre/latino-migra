import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Avatar } from "./Avatar";
import { getSafeImageUrl } from "../../lib/sanitize";

/**
 * Regression for #99.
 *
 * Every avatar in the product fell back to one stock photograph from Unsplash,
 * rendered as though it were the visitor's own face. A photograph of somebody
 * else is a claim about who an account belongs to; an initial is not.
 */
describe("Avatar", () => {
  it("shows the person's own picture when there is one", () => {
    render(<Avatar src="https://example.com/ana.jpg" name="Ana Izaguirre" />);

    const img = screen.getByAltText("Ana Izaguirre") as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    expect(img.getAttribute("src")).toBe("https://example.com/ana.jpg");
  });

  it("shows the initial rather than a stranger's face when there is none", () => {
    render(<Avatar src="" name="Ana Izaguirre" />);

    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByLabelText("Ana Izaguirre")).toHaveTextContent("A");
    expect(document.body.innerHTML).not.toMatch(/unsplash/i);
  });

  it("does the same for an unsafe URL", () => {
    render(<Avatar src="javascript:alert(1)" name="Ana" />);

    expect(document.querySelector("img")).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/javascript:/i);
  });

  it("survives an account with no name", () => {
    render(<Avatar src={null} name="" />);

    // A neutral glyph, not a letter borrowed from somewhere else.
    expect(screen.getByRole("img")).toHaveTextContent("·");
  });

  it("uppercases the initial for an accented name", () => {
    render(<Avatar src={null} name="ángela" />);
    expect(screen.getByLabelText("ángela")).toHaveTextContent("Á");
  });
});

describe("getSafeImageUrl", () => {
  it("returns nothing for an unusable URL, so the caller decides", () => {
    // It used to return a stock photograph, which is how every avatar in the
    // product came to show the same stranger.
    expect(getSafeImageUrl("javascript:alert(1)")).toBe("");
    expect(getSafeImageUrl("")).toBe("");
    expect(getSafeImageUrl(null)).toBe("");
    expect(getSafeImageUrl(undefined)).toBe("");
  });

  it("keeps a safe URL", () => {
    expect(getSafeImageUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
  });

  it("keeps a relative path", () => {
    expect(getSafeImageUrl("/img/a.jpg")).toBe("/img/a.jpg");
  });

  it("still honours an explicit fallback", () => {
    expect(getSafeImageUrl("javascript:alert(1)", "/placeholder.png")).toBe("/placeholder.png");
  });
});
