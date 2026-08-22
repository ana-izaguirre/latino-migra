import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";

import { renderWithProviders as render } from "../test/renderWithProviders";
import { SCHOLARSHIPS_DATA } from "../data/scholarships";
import { STUDY_PROGRAMMES_DATA } from "../data/studyProgrammes";
import { StudyProgramme } from "../types";
import { EstudiosSection } from "./EstudiosSection";

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

describe("EstudiosSection", () => {
  it("renders each programme with a link to its official source", () => {
    render(
      <EstudiosSection
        scholarships={[]}
        onOpenScholarship={vi.fn()}
        programmes={[
          programme(),
          programme({ id: "programa-dos", title: "Curso de prueba", kind: "curso" }),
        ]}
      />
    );

    expect(screen.getByText("Formación Profesional de prueba")).toBeInTheDocument();

    const link = document.getElementById("estudio-official-link-programa-uno");
    expect(link).toHaveAttribute("href", "https://www.todofp.es");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("opens the requirements in the same detail modal a scholarship uses", () => {
    render(
      <EstudiosSection scholarships={[]} onOpenScholarship={vi.fn()} programmes={[programme()]} />
    );

    // The card is a preview: the requirements are behind the control, so a
    // study card is the height of the scholarship card beside it (#105).
    expect(screen.queryByText("Bachillerato homologado")).not.toBeInTheDocument();

    fireEvent.click(document.getElementById("estudio-details-programa-uno")!);

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAccessibleName(/Formación Profesional de prueba/i);
    expect(within(modal).getByText("Bachillerato homologado")).toBeVisible();
    expect(within(modal).getByText("Título de Técnico Superior")).toBeVisible();
    // The official source is in the panel too: it is why the entry exists.
    expect(modal.querySelector("#estudio-modal-official-link-programa-uno")).toHaveAttribute(
      "href",
      "https://www.todofp.es"
    );
  });

  it("says an unchecked migration route is unchecked rather than guessing", () => {
    render(
      <EstudiosSection scholarships={[]} onOpenScholarship={vi.fn()} programmes={[programme()]} />
    );

    // The fixture records no route at all. The card says so; it does not
    // borrow "no route" from an entry that was actually checked.
    const card = document.getElementById("estudio-card-programa-uno")!;
    expect(within(card).getByText("Sin verificar")).toBeInTheDocument();
    expect(within(card).queryByText(/Sin vía migratoria/)).not.toBeInTheDocument();
  });

  it("reports a rejected entry instead of dropping it silently", () => {
    render(
      <EstudiosSection
        scholarships={[]}
        onOpenScholarship={vi.fn()}
        programmes={[
          programme(),
          programme({ id: "agregador", officialUrl: "https://becas.example.com" }),
        ]}
      />
    );

    const notice = document.getElementById("estudios-rejected-status");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/no apunta a un dominio oficial/i);
    expect(document.getElementById("estudio-card-agregador")).not.toBeInTheDocument();
  });

  it("explains an empty catalogue rather than rendering nothing", () => {
    render(
      <EstudiosSection
        scholarships={[]}
        onOpenScholarship={vi.fn()}
        programmes={[programme({ officialUrl: "https://becas.example.com" })]}
      />
    );

    expect(screen.getByText(/No pudimos mostrar el catálogo de estudios/i)).toBeInTheDocument();
  });

  it("links a related scholarship only when the loaded catalogue holds it", () => {
    const onOpenScholarship = vi.fn();
    const beca = SCHOLARSHIPS_DATA[0];

    const { rerender } = render(
      <EstudiosSection
        scholarships={[]}
        onOpenScholarship={onOpenScholarship}
        programmes={[programme({ relatedScholarshipIds: [beca.id] })]}
      />
    );

    fireEvent.click(document.getElementById("estudio-details-programa-uno")!);

    // The id is named by the entry but absent from the catalogue on screen:
    // rendering a link to it would be inventing a record.
    expect(document.getElementById(`estudio-beca-link-${beca.id}`)).not.toBeInTheDocument();

    rerender(
      <EstudiosSection
        scholarships={[beca]}
        onOpenScholarship={onOpenScholarship}
        programmes={[programme({ relatedScholarshipIds: [beca.id] })]}
      />
    );

    const link = document.getElementById(`estudio-beca-link-${beca.id}`);
    expect(link).toBeInTheDocument();
    fireEvent.click(link!);
    expect(onOpenScholarship).toHaveBeenCalledWith(beca);
    // Two stacked panels would trap focus in the one underneath, so the
    // programme's closes as the scholarship's opens.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ships a catalogue where every entry links to an official source", () => {
    render(<EstudiosSection scholarships={[]} onOpenScholarship={vi.fn()} />);

    expect(document.getElementById("estudios-rejected-status")).not.toBeInTheDocument();

    // The list pages in sixes like the scholarship list beside it, so the
    // whole catalogue is reachable through the one control and no other.
    let rendered = document.getElementById("estudios-list")?.children.length ?? 0;
    while (document.getElementById("btn-load-more-estudios")) {
      fireEvent.click(document.getElementById("btn-load-more-estudios")!);
      const next = document.getElementById("estudios-list")?.children.length ?? 0;
      expect(next).toBeGreaterThan(rendered);
      rendered = next;
    }

    expect(rendered).toBe(STUDY_PROGRAMMES_DATA.length);
  });
});
