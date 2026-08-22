import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithProviders as render } from "../test/renderWithProviders";
import { EstudiosSection } from "../components/EstudiosSection";
import { StudyProgramme } from "../types";
import { useStudyFilters } from "./useStudyFilters";

const programme = (overrides: Partial<StudyProgramme> = {}): StudyProgramme => ({
  id: "programa-uno",
  title: "Formación Profesional de prueba",
  kind: "fp",
  institution: "Ministerio de prueba",
  officialPortalName: "TodoFP (todofp.es)",
  officialUrl: "https://www.todofp.es",
  country: "España",
  countryCode: "ES",
  modality: "Presencial",
  duration: "2 años",
  cost: "Gratuito",
  description: "Ciclos formativos de grado superior.",
  outcome: "Título de Técnico Superior",
  requirements: ["Bachillerato homologado"],
  ...overrides,
});

/**
 * The wiring `BecasExplorer` performs, reduced to what these tests exercise:
 * the search box and the clear control sit outside the list, and the chips
 * render in the sidebar scope. Testing the hook through its own markup rather
 * than through the whole explorer keeps the failure legible while still going
 * through the components the screen actually renders.
 */
const Harness: React.FC<{ programmes: StudyProgramme[] }> = ({ programmes }) => {
  const state = useStudyFilters(programmes);

  return (
    <div>
      <input
        id="harness-search"
        value={state.filters.search}
        onChange={(e) => state.setFilter("search", e.target.value)}
      />
      <button id="harness-clear" type="button" onClick={state.clearFilters}>
        Limpiar
      </button>
      {state.renderGroups("sidebar")}
      <EstudiosSection
        scholarships={[]}
        onOpenScholarship={vi.fn()}
        programmes={programmes}
        filterState={state}
      />
    </div>
  );
};

describe("useStudyFilters", () => {
  it("filters by country, modality, migration route and name", () => {
    render(
      <Harness
        programmes={[
          programme({ migrationRoute: "directa", migrationRouteNote: "Da acceso al visado." }),
          programme({
            id: "programa-dos",
            title: "Curso en línea",
            institution: "UNED",
            kind: "curso",
            country: "Alemania",
            modality: "En línea",
            migrationRoute: "ninguna",
            migrationRouteNote: "No genera estancia.",
          }),
        ]}
      />
    );

    const list = () => document.getElementById("estudios-list");
    expect(list()?.children).toHaveLength(2);

    fireEvent.click(document.getElementById("sidebar-estudios-country-chip-Alemania")!);
    expect(list()?.children).toHaveLength(1);
    expect(document.getElementById("estudio-card-programa-dos")).toBeInTheDocument();

    fireEvent.click(document.getElementById("harness-clear")!);
    expect(list()?.children).toHaveLength(2);

    fireEvent.click(document.getElementById("sidebar-estudios-modality-chip-En línea")!);
    expect(list()?.children).toHaveLength(1);
    expect(document.getElementById("estudio-card-programa-dos")).toBeInTheDocument();

    fireEvent.click(document.getElementById("harness-clear")!);
    fireEvent.click(document.getElementById("sidebar-estudios-route-chip-directa")!);
    expect(list()?.children).toHaveLength(1);
    expect(document.getElementById("estudio-card-programa-uno")).toBeInTheDocument();

    fireEvent.click(document.getElementById("harness-clear")!);
    fireEvent.change(document.getElementById("harness-search")!, {
      target: { value: "uned" },
    });
    expect(list()?.children).toHaveLength(1);
    expect(document.getElementById("estudio-card-programa-dos")).toBeInTheDocument();
  });

  it("says which filters emptied the list", () => {
    render(<Harness programmes={[programme({ country: "España", kind: "fp" })]} />);

    fireEvent.change(document.getElementById("harness-search")!, {
      target: { value: "no existe" },
    });

    expect(screen.getByText(/Ningún programa con estos filtros/i)).toBeInTheDocument();
    expect(screen.getByText(/"no existe"/)).toBeInTheDocument();
  });

  it("narrows the list by kind, with counts that cascade from the other filters", () => {
    render(
      <Harness
        programmes={[
          programme(),
          programme({ id: "programa-dos", title: "Curso de prueba", kind: "curso" }),
          programme({
            id: "programa-tres",
            title: "Curso alemán",
            kind: "curso",
            country: "Alemania",
          }),
        ]}
      />
    );

    expect(document.getElementById("estudios-list")?.children).toHaveLength(3);

    // Addressed by id, not by its Spanish label: the chip's text comes from
    // the shared label module and changes with the language.
    const kindChip = () => document.getElementById("sidebar-estudios-kind-chip-curso")!;
    expect(kindChip()).toHaveTextContent("2");

    // Narrowing one axis has to move the counts on the others, or the number
    // on the chip stops being what selecting it renders.
    fireEvent.click(document.getElementById("sidebar-estudios-country-chip-España")!);
    expect(kindChip()).toHaveTextContent("1");

    fireEvent.click(kindChip());
    const list = document.getElementById("estudios-list");
    expect(list?.children).toHaveLength(1);
    expect(document.getElementById("estudio-card-programa-dos")).toBeInTheDocument();
    expect(document.getElementById("estudio-card-programa-uno")).not.toBeInTheDocument();
    expect(document.getElementById("estudio-card-programa-tres")).not.toBeInTheDocument();
  });

  it("scopes chip ids so the sidebar and the sheet can both be mounted", () => {
    const Both: React.FC = () => {
      const state = useStudyFilters([programme()]);
      return (
        <>
          {state.renderGroups("sidebar")}
          {state.renderGroups("sheet")}
        </>
      );
    };

    render(<Both />);

    // Below `lg` both copies are in the DOM at once. Unscoped ids would make
    // the second copy unaddressable and duplicate every `id` on the page.
    expect(document.getElementById("sidebar-estudios-kind-chip-fp")).toBeInTheDocument();
    expect(document.getElementById("sheet-estudios-kind-chip-fp")).toBeInTheDocument();
  });

  it("counts and selects the same set for an unchecked migration route", () => {
    render(
      <Harness
        programmes={[
          programme(),
          programme({
            id: "programa-dos",
            title: "Curso verificado",
            kind: "curso",
            migrationRoute: "directa",
            migrationRouteNote: "Da acceso al visado.",
          }),
        ]}
      />
    );

    const chip = document.getElementById("sidebar-estudios-route-chip-sin-verificar")!;
    expect(chip).toHaveTextContent("1");

    fireEvent.click(chip);
    expect(document.getElementById("estudios-list")?.children).toHaveLength(1);
    expect(document.getElementById("estudio-card-programa-uno")).toBeInTheDocument();
  });
});
