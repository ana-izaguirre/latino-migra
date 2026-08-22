import { describe, it, expect } from "vitest";

import { SCHOLARSHIPS_DATA } from "../data/scholarships";
import { STUDY_PROGRAMMES_DATA } from "../data/studyProgrammes";
import { StudyProgramme } from "../types";
import {
  EMPTY_STUDY_FILTERS,
  OFFICIAL_STUDY_DOMAINS,
  countByOption,
  isOfficialStudyUrl,
  matchesStudyFilters,
  validateStudyProgramme,
  validateStudyProgrammes,
} from "./studyProgrammes";

const programmeFor = (overrides: Partial<StudyProgramme> = {}): StudyProgramme => ({
  id: "test-programme",
  title: "Programa de prueba",
  kind: "curso",
  institution: "Institución",
  officialPortalName: "Portal",
  officialUrl: "https://www.todofp.es",
  country: "España",
  countryCode: "ES",
  modality: "En línea",
  duration: "4 semanas",
  cost: "Gratuito",
  description: "Descripción",
  outcome: "Certificado",
  requirements: ["Requisito"],
  ...overrides,
});

describe("isOfficialStudyUrl", () => {
  it("accepts an allowlisted domain over https", () => {
    expect(isOfficialStudyUrl("https://www.todofp.es")).toBe(true);
  });

  it("accepts a subdomain of an allowlisted domain", () => {
    expect(isOfficialStudyUrl("https://examenes.cervantes.es")).toBe(true);
    expect(isOfficialStudyUrl("https://erasmus-plus.ec.europa.eu")).toBe(true);
  });

  it("rejects http", () => {
    expect(isOfficialStudyUrl("http://www.todofp.es")).toBe(false);
  });

  it("rejects a domain that only ends with an allowlisted name", () => {
    // "notcervantes.es" ends with "cervantes.es" as a string but is a
    // different registrable domain — the check has to be on a label boundary.
    expect(isOfficialStudyUrl("https://notcervantes.es")).toBe(false);
  });

  it("rejects an aggregator", () => {
    expect(isOfficialStudyUrl("https://becas-y-cursos.example.com")).toBe(false);
  });

  it("rejects a string that is not a URL", () => {
    expect(isOfficialStudyUrl("todofp.es")).toBe(false);
  });
});

describe("validateStudyProgramme", () => {
  it("accepts a complete entry on an official domain", () => {
    expect(validateStudyProgramme(programmeFor())).toBeNull();
  });

  it("rejects a blank required field", () => {
    expect(validateStudyProgramme(programmeFor({ cost: "" }))).toBe("missing-field");
    expect(validateStudyProgramme(programmeFor({ outcome: "   " }))).toBe("missing-field");
  });

  it("rejects an entry with no requirements", () => {
    expect(validateStudyProgramme(programmeFor({ requirements: [] }))).toBe("missing-field");
  });

  it("rejects http", () => {
    expect(validateStudyProgramme(programmeFor({ officialUrl: "http://www.todofp.es" }))).toBe(
      "insecure-url"
    );
  });

  it("rejects an off-allowlist domain", () => {
    expect(
      validateStudyProgramme(programmeFor({ officialUrl: "https://cursos.example.com" }))
    ).toBe("unofficial-domain");
  });
});

describe("validateStudyProgrammes", () => {
  it("separates what can be shown from what cannot, keeping the rejected ones", () => {
    const bad = programmeFor({ id: "bad", officialUrl: "https://example.com" });
    const result = validateStudyProgrammes([programmeFor(), bad]);

    expect(result.valid.map((p) => p.id)).toEqual(["test-programme"]);
    expect(result.rejected).toEqual([{ id: "bad", reason: "unofficial-domain" }]);
  });
});

describe("the shipped catalogue", () => {
  it("is not empty", () => {
    expect(STUDY_PROGRAMMES_DATA.length).toBeGreaterThan(0);
  });

  it("has no duplicate ids", () => {
    const ids = STUDY_PROGRAMMES_DATA.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("passes validation for every entry", () => {
    const failures = STUDY_PROGRAMMES_DATA.map((p) => [p.id, validateStudyProgramme(p)]).filter(
      ([, reason]) => reason !== null
    );
    expect(failures).toEqual([]);
  });

  it("only names scholarships that exist in the catalogue", () => {
    const scholarshipIds = new Set(SCHOLARSHIPS_DATA.map((s) => s.id));
    const dangling = STUDY_PROGRAMMES_DATA.flatMap((p) =>
      (p.relatedScholarshipIds ?? []).filter((id) => !scholarshipIds.has(id))
    );
    expect(dangling).toEqual([]);
  });

  it("uses every domain on the allowlist", () => {
    // An allowlist entry nothing is served from is a source the platform
    // vouches for without using — it should be removed with its programme.
    const hosts = STUDY_PROGRAMMES_DATA.map((p) => new URL(p.officialUrl).hostname);
    const unused = OFFICIAL_STUDY_DOMAINS.filter(
      (domain) => !hosts.some((host) => host === domain || host.endsWith(`.${domain}`))
    );
    expect(unused).toEqual([]);
  });
});

describe("matchesStudyFilters", () => {
  const fp = programmeFor({ id: "fp", kind: "fp", country: "España", modality: "Presencial" });
  const online = programmeFor({
    id: "online",
    title: "Curso abierto",
    institution: "UNED",
    kind: "curso",
    country: "España",
    modality: "En línea",
    migrationRoute: "ninguna",
    migrationRouteNote: "No genera estancia.",
  });
  const german = programmeFor({
    id: "de",
    title: "Ausbildung",
    kind: "fp",
    country: "Alemania",
    modality: "Mixta",
    migrationRoute: "directa",
    migrationRouteNote: "El contrato es la base del visado.",
  });
  const all = [fp, online, german];

  const withFilters = (overrides: Partial<typeof EMPTY_STUDY_FILTERS>) =>
    all.filter((p) => matchesStudyFilters(p, { ...EMPTY_STUDY_FILTERS, ...overrides }));

  it("matches everything with no filters", () => {
    expect(withFilters({})).toHaveLength(3);
  });

  it("narrows by country, kind and modality", () => {
    expect(withFilters({ country: "Alemania" }).map((p) => p.id)).toEqual(["de"]);
    expect(withFilters({ kind: "curso" }).map((p) => p.id)).toEqual(["online"]);
    expect(withFilters({ modality: "En línea" }).map((p) => p.id)).toEqual(["online"]);
  });

  it("narrows by migration route", () => {
    expect(withFilters({ migrationRoute: "directa" }).map((p) => p.id)).toEqual(["de"]);
    expect(withFilters({ migrationRoute: "ninguna" }).map((p) => p.id)).toEqual(["online"]);
  });

  it("treats an unrecorded route as unverified rather than as 'no route'", () => {
    // `fp` carries no migrationRoute at all. It must not answer "ninguna":
    // not knowing and knowing there is no route are different facts.
    expect(withFilters({ migrationRoute: "sin-verificar" }).map((p) => p.id)).toEqual(["fp"]);
    expect(withFilters({ migrationRoute: "ninguna" }).map((p) => p.id)).not.toContain("fp");
  });

  it("searches the title and the institution, case- and space-insensitively", () => {
    expect(withFilters({ search: "ausbildung" }).map((p) => p.id)).toEqual(["de"]);
    expect(withFilters({ search: "  UNED " }).map((p) => p.id)).toEqual(["online"]);
    expect(withFilters({ search: "nada" })).toHaveLength(0);
  });

  it("combines filters rather than widening", () => {
    expect(withFilters({ country: "España", kind: "fp" }).map((p) => p.id)).toEqual(["fp"]);
    expect(withFilters({ country: "Alemania", kind: "curso" })).toHaveLength(0);
  });
});

describe("countByOption", () => {
  const all = [
    programmeFor({ id: "a", kind: "fp", country: "España" }),
    programmeFor({ id: "b", kind: "curso", country: "España" }),
    programmeFor({ id: "c", kind: "curso", country: "Alemania" }),
  ];

  it("counts an option with the other filters as they are", () => {
    const filters = { ...EMPTY_STUDY_FILTERS, country: "España" };

    // Within España: one fp, one curso — not the two cursos in the catalogue.
    expect(countByOption(all, filters, "kind", "curso")).toBe(1);
    expect(countByOption(all, filters, "kind", "fp")).toBe(1);
    expect(countByOption(all, filters, "kind", "todos")).toBe(2);
  });

  it("gives a count that equals what selecting the option renders", () => {
    const filters = { ...EMPTY_STUDY_FILTERS, kind: "curso" as const };
    for (const country of ["Todos", "España", "Alemania"]) {
      const selected = { ...filters, country };
      expect(countByOption(all, filters, "country", country)).toBe(
        all.filter((p) => matchesStudyFilters(p, selected)).length
      );
    }
  });
});

describe("the shipped catalogue's migration routes", () => {
  it("never records a route without saying why", () => {
    const unexplained = STUDY_PROGRAMMES_DATA.filter(
      (p) => p.migrationRoute && !p.migrationRouteNote?.trim()
    ).map((p) => p.id);
    expect(unexplained).toEqual([]);
  });

  it("never leaves a note without the route it explains", () => {
    const orphaned = STUDY_PROGRAMMES_DATA.filter(
      (p) => p.migrationRouteNote && !p.migrationRoute
    ).map((p) => p.id);
    expect(orphaned).toEqual([]);
  });
});
