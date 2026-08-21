import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../../test/renderWithProviders";
import { ImageWithFallback } from "./ImageWithFallback";

describe("ImageWithFallback", () => {
  it("renders the image while it loads fine", () => {
    render(<ImageWithFallback id="cover" src="https://example.test/a.jpg" alt="Beca DAAD" />);

    const img = screen.getByAltText("Beca DAAD");
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "https://example.test/a.jpg");
  });

  it("defers loading until the image is near the viewport", () => {
    render(<ImageWithFallback src="https://example.test/a.jpg" alt="Beca DAAD" />);
    expect(screen.getByAltText("Beca DAAD")).toHaveAttribute("loading", "lazy");
  });

  it("replaces a failed image with a placeholder, not the browser's broken icon", () => {
    render(<ImageWithFallback id="cover" src="https://example.test/gone.jpg" alt="Beca DAAD" />);

    fireEvent.error(screen.getByAltText("Beca DAAD"));

    expect(screen.queryByAltText("Beca DAAD")).not.toBeInTheDocument();
    expect(screen.getByText(/Imagen no disponible/i)).toBeInTheDocument();
  });

  it("names what is missing, so the placeholder is not an anonymous grey box", () => {
    render(<ImageWithFallback src="https://example.test/gone.jpg" alt="Beca DAAD" />);
    fireEvent.error(screen.getByAltText("Beca DAAD"));

    expect(
      screen.getByRole("img", { name: /Imagen no disponible: Beca DAAD/i })
    ).toBeInTheDocument();
  });

  it("treats a missing src as a failure rather than fetching the page itself", () => {
    // An empty `src` resolves against the document URL, so the browser
    // downloads the HTML and then fails to decode it as an image.
    render(<ImageWithFallback src="" alt="Beca sin portada" />);

    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(/Imagen no disponible/i)).toBeInTheDocument();
  });

  it("treats an absent src the same way", () => {
    render(<ImageWithFallback alt="Beca sin portada" />);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(/Imagen no disponible/i)).toBeInTheDocument();
  });

  it("keeps the caller's layout classes on the placeholder", () => {
    // The placeholder stands in for the image inside a fixed-height card, so
    // it has to fill the same box or the card collapses around it.
    render(<ImageWithFallback id="cover" src="" alt="Beca" className="w-full h-full" />);

    const placeholder = document.getElementById("cover");
    expect(placeholder).toHaveClass("w-full");
    expect(placeholder).toHaveClass("h-full");
  });
});
