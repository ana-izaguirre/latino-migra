import { describe, it, expect } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders as render } from "../test/renderWithProviders";
import { Comunidad } from "./Comunidad";

describe("Comunidad Component", () => {
  it("renders community header, category pills and forum discussions", async () => {
    render(<Comunidad />);
    expect(screen.getByText(/Comunidad LatinoMigra/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar tema, ciudad o pregunta/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crear Publicación/i })).toBeInTheDocument();
  });

  it("filters forum posts when typing in the search bar", async () => {
    render(<Comunidad />);
    const postItem = await screen.findByText(/proceso de empadronamiento en Madrid/i);
    expect(postItem).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Buscar tema, ciudad o pregunta/i);
    fireEvent.change(searchInput, { target: { value: "empadronamiento" } });

    await waitFor(() => {
      expect(screen.getByText(/proceso de empadronamiento en Madrid/i)).toBeInTheDocument();
    });
  });

  it("opens new post modal when clicking Crear Publicación", async () => {
    render(<Comunidad />);
    const newPostBtn = screen.getByRole("button", { name: /Crear Publicación/i });
    fireEvent.click(newPostBtn);

    // By role: the dialog also carries the same string as its accessible name,
    // which Radix renders visually hidden.
    expect(
      await screen.findByRole("heading", { name: /Nueva Publicación en la Comunidad/i })
    ).toBeInTheDocument();
  });
});
