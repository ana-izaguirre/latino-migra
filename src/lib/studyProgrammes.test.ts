import { describe, it, expect } from "vitest";

import { SCHOLARSHIPS_DATA } from "../data/scholarships";
import { STUDY_PROGRAMMES_DATA } from "../data/studyProgrammes";
import { StudyProgramme } from "../types";
import {
  OFFICIAL_STUDY_DOMAINS,
  isOfficialStudyUrl,
  validateStudyProgramme,
  validateStudyProgrammes,
} from "./studyProgrammes";

const validProgramme = (overrides: Partial<StudyProgramme> = {}): StudyProgramme => ({
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
    expect(validateStudyProgramme(validProgramme())).toBeNull();
  });

  it("rejects a blank required field", () => {
    expect(validateStudyProgramme(validProgramme({ cost: "" }))).toBe("missing-field");
    expect(validateStudyProgramme(validProgramme({ outcome: "   " }))).toBe("missing-field");
  });

  it("rejects an entry with no requirements", () => {
    expect(validateStudyProgramme(validProgramme({ requirements: [] }))).toBe("missing-field");
  });

  it("rejects http", () => {
    expect(validateStudyProgramme(validProgramme({ officialUrl: "http://www.todofp.es" }))).toBe(
      "insecure-url"
    );
  });

  it("rejects an off-allowlist domain", () => {
    expect(
      validateStudyProgramme(validProgramme({ officialUrl: "https://cursos.example.com" }))
    ).toBe("unofficial-domain");
  });
});

describe("validateStudyProgrammes", () => {
  it("separates what can be shown from what cannot, keeping the rejected ones", () => {
    const bad = validProgramme({ id: "bad", officialUrl: "https://example.com" });
    const result = validateStudyProgrammes([validProgramme(), bad]);

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
