import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { Footer } from "./Footer";

describe("Footer Component", () => {
  it("renders branding description and footer links", () => {
    const setActiveTab = vi.fn();
    render(<Footer setActiveTab={setActiveTab} />);

    expect(screen.getByText("LatinoMigra")).toBeInTheDocument();
    expect(screen.getByText(/Empoderando a la comunidad estudiantil/i)).toBeInTheDocument();
    expect(screen.getByText(/Becas & Estudios/i)).toBeInTheDocument();
    expect(screen.getByText(/Guía de Migración/i)).toBeInTheDocument();

    // Click on link
    fireEvent.click(screen.getByText(/Becas & Estudios/i));
    expect(setActiveTab).toHaveBeenCalledWith("becas");
  });
});
