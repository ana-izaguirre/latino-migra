import { MigrationRoute, StudyProgramme, StudyProgrammeKind } from "../types";

/**
 * Domains this catalogue may cite.
 *
 * The product owner's rule for the studies section is the same one the
 * scholarship catalogue follows: official programmes and official sources
 * only, each with a link. That rule survives exactly as long as someone
 * remembers it during review, so it lives here instead — a programme served
 * from anywhere else does not render.
 *
 * A subdomain of a listed domain is accepted (`examenes.cervantes.es`,
 * `erasmus-plus.ec.europa.eu`). Adding a programme on a new domain is
 * deliberately two changes: the entry, and the source the platform vouches
 * for.
 */
export const OFFICIAL_STUDY_DOMAINS: readonly string[] = [
  "todofp.es",
  "cervantes.es",
  "santanderopenacademy.com",
  "uned.es",
  "make-it-in-germany.com",
  "goethe.de",
  "instituto-camoes.pt",
  "iefp.pt",
  "fetchcourses.ie",
  "state.gov",
  "studyaustralia.gov.au",
  "canada.ca",
  "europa.eu",
] as const;

/** Why an entry was rejected. Rendered to the reader, so it is in Spanish. */
export const REJECTION_REASONS: Record<string, string> = {
  "missing-field": "le falta un campo obligatorio",
  "insecure-url": "su enlace no usa https",
  "unofficial-domain": "su enlace no apunta a un dominio oficial",
};

export type RejectionReason = keyof typeof REJECTION_REASONS;

export interface RejectedProgramme {
  id: string;
  reason: RejectionReason;
}

/** Whether a URL is served from an allowlisted official domain over https. */
export function isOfficialStudyUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return OFFICIAL_STUDY_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

const REQUIRED_TEXT_FIELDS = [
  "id",
  "title",
  "institution",
  "officialPortalName",
  "officialUrl",
  "country",
  "countryCode",
  "modality",
  "duration",
  "cost",
  "description",
  "outcome",
] as const;

/**
 * Why an entry cannot be shown, or `null` when it can.
 *
 * Blank is treated as missing: `cost: ""` on screen reads as "free", which is
 * a claim the entry never made.
 */
export function validateStudyProgramme(programme: StudyProgramme): RejectionReason | null {
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (!programme[field] || programme[field].trim() === "") return "missing-field";
  }
  if (programme.requirements.length === 0) return "missing-field";

  let parsed: URL;
  try {
    parsed = new URL(programme.officialUrl);
  } catch {
    return "unofficial-domain";
  }
  if (parsed.protocol !== "https:") return "insecure-url";
  if (!isOfficialStudyUrl(programme.officialUrl)) return "unofficial-domain";

  return null;
}

export interface ValidatedCatalogue {
  valid: StudyProgramme[];
  rejected: RejectedProgramme[];
}

/**
 * Splits the catalogue into what can be shown and what cannot.
 *
 * The rejected half is returned rather than discarded so the section can say
 * on screen that it is short. A catalogue that quietly shrinks is the failure
 * this project has already shipped once (CLAUDE.md constraint 5).
 */
export function validateStudyProgrammes(programmes: StudyProgramme[]): ValidatedCatalogue {
  const valid: StudyProgramme[] = [];
  const rejected: RejectedProgramme[] = [];

  for (const programme of programmes) {
    const reason = validateStudyProgramme(programme);
    if (reason) {
      rejected.push({ id: programme.id, reason });
    } else {
      valid.push(programme);
    }
  }

  return { valid, rejected };
}

/** Spanish labels for the three kinds, in the order the filter shows them. */
export const STUDY_KIND_LABELS: Record<StudyProgrammeKind, string> = {
  curso: "Cursos",
  certificado: "Certificados",
  fp: "Formación Profesional",
};

/** Singular label for the badge on a card. */
export const STUDY_KIND_BADGE_LABELS: Record<StudyProgrammeKind, string> = {
  curso: "Curso",
  certificado: "Certificado",
  fp: "FP",
};

/** Spanish labels for the migration routes, in the order the filter shows them. */
export const MIGRATION_ROUTE_LABELS: Record<MigrationRoute, string> = {
  directa: "Abre vía migratoria",
  requisito: "Requisito de un visado",
  ninguna: "No abre vía",
};

/** Shorter label for the badge on a card. */
export const MIGRATION_ROUTE_BADGE_LABELS: Record<MigrationRoute, string> = {
  directa: "Vía migratoria",
  requisito: "Requisito de visado",
  ninguna: "Sin vía migratoria",
};

/** Every axis the studies catalogue can be narrowed on. */
export interface StudyFilters {
  kind: StudyProgrammeKind | "todos";
  country: string;
  modality: string;
  migrationRoute: MigrationRoute | "todas" | "sin-verificar";
  /** Matched against the title and the institution. */
  search: string;
}

export const EMPTY_STUDY_FILTERS: StudyFilters = {
  kind: "todos",
  country: "Todos",
  modality: "Todas",
  migrationRoute: "todas",
  search: "",
};

/**
 * One definition of the rule.
 *
 * The counts beside each chip come from this same predicate with a single axis
 * relaxed, so the number on a chip is always what selecting it renders. Writing
 * the predicate twice — once for the list, once for the counts — is how an
 * interface starts lying about its own behaviour.
 */
export function matchesStudyFilters(programme: StudyProgramme, filters: StudyFilters): boolean {
  if (filters.kind !== "todos" && programme.kind !== filters.kind) return false;
  if (filters.country !== "Todos" && programme.country !== filters.country) return false;
  if (filters.modality !== "Todas" && programme.modality !== filters.modality) return false;

  if (filters.migrationRoute === "sin-verificar") {
    if (programme.migrationRoute) return false;
  } else if (filters.migrationRoute !== "todas") {
    if (programme.migrationRoute !== filters.migrationRoute) return false;
  }

  const search = filters.search.trim().toLowerCase();
  if (search) {
    const haystack = `${programme.title} ${programme.institution}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  return true;
}

/**
 * How many results each option of one axis would give, with the other filters
 * as they are — which is the number the chips promise.
 */
export function countByOption<T extends string>(
  programmes: StudyProgramme[],
  filters: StudyFilters,
  axis: keyof StudyFilters,
  option: T
): number {
  return programmes.filter((programme) =>
    matchesStudyFilters(programme, { ...filters, [axis]: option })
  ).length;
}
