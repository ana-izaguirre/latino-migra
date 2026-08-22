import React, { useMemo, useState } from "react";
import { Globe2, GraduationCap, Plane, Wifi } from "lucide-react";
import {
  EMPTY_STUDY_FILTERS,
  StudyFilters,
  countByOption,
  matchesStudyFilters,
  validateStudyProgrammes,
} from "./studyProgrammes";
import { MigrationRoute, StudyProgramme, StudyProgrammeKind } from "../types";
import { useLanguage } from "./i18n";
import { useLabels } from "./labels";
import { FilterChipGroup } from "../components/ui/FilterChipGroup";

const KIND_ORDER: StudyProgrammeKind[] = ["curso", "certificado", "fp"];
const ROUTE_ORDER: MigrationRoute[] = ["directa", "requisito", "ninguna"];

/**
 * How many programmes each "Ver más" adds. The sibling scholarship list pages
 * in sixes, and two catalogues on one screen behaving differently is worse
 * than either behaviour.
 */
export const STUDY_BATCH_SIZE = 6;

/**
 * How the list can be ordered.
 *
 * Deliberately not the scholarship options: a programme has no closing date,
 * so "cierre más próximo" would order by a field no record carries — the shape
 * of the `daysLeft` defect that matched everything.
 */
export const STUDY_SORT_OPTIONS = ["name", "country", "institution"] as const;
export type StudySortOption = (typeof STUDY_SORT_OPTIONS)[number];

const SORT_KEY: Record<StudySortOption, (programme: StudyProgramme) => string> = {
  name: (p) => p.title,
  country: (p) => p.country,
  institution: (p) => p.institution,
};

/**
 * Filter options with the count each one would give: one predicate, so the
 * number on a chip is exactly what selecting it renders.
 */
const optionsFor = <T extends string>(
  programmes: StudyProgramme[],
  filters: StudyFilters,
  axis: keyof StudyFilters,
  entries: { id: T; label: string }[]
) =>
  entries.map((entry) => ({
    ...entry,
    count: countByOption(programmes, filters, axis, entry.id),
  }));

/**
 * The studies filters, owned outside the list they narrow.
 *
 * They used to live inside `EstudiosSection`, rendered as a full-width block
 * above the results — while the scholarship filters sat in a sticky sidebar
 * and behind a sheet on a phone. The two tabs of one screen looked like two
 * different products (#105). The state lives here so `BecasExplorer` can put
 * these chips in the same sidebar and the same sheet as its own.
 */
export const useStudyFilters = (programmes: StudyProgramme[]) => {
  const { t } = useLanguage();
  const label = useLabels();
  const [filters, setFilters] = useState<StudyFilters>(EMPTY_STUDY_FILTERS);
  const [visibleCount, setVisibleCount] = useState(STUDY_BATCH_SIZE);
  const [sortBy, setSortByState] = useState<StudySortOption>("name");

  /** Reordering starts the list again from the top of the new order. */
  const setSortBy = (next: StudySortOption) => {
    setSortByState(next);
    setVisibleCount(STUDY_BATCH_SIZE);
  };

  /** Narrowing the list starts it again from the top of the new list. */
  const setFilter = <K extends keyof StudyFilters>(axis: K, value: StudyFilters[K]) => {
    setFilters((prev) => ({ ...prev, [axis]: value }));
    setVisibleCount(STUDY_BATCH_SIZE);
  };

  const clearFilters = () => {
    setFilters(EMPTY_STUDY_FILTERS);
    setVisibleCount(STUDY_BATCH_SIZE);
  };

  const activeFilterCount = (Object.keys(EMPTY_STUDY_FILTERS) as (keyof StudyFilters)[]).filter(
    (axis) => filters[axis] !== EMPTY_STUDY_FILTERS[axis]
  ).length;

  const { valid, rejected } = useMemo(() => validateStudyProgrammes(programmes), [programmes]);

  const matching = useMemo(
    () =>
      valid
        .filter((programme) => matchesStudyFilters(programme, filters))
        .sort((a, b) => SORT_KEY[sortBy](a).localeCompare(SORT_KEY[sortBy](b), "es")),
    [valid, filters, sortBy]
  );

  const visible = matching.slice(0, visibleCount);

  const kindOptions = useMemo(
    () =>
      optionsFor(valid, filters, "kind", [
        { id: "todos", label: t("estudios.filterAll", "Todos") },
        ...KIND_ORDER.map((kind) => ({ id: kind, label: label("programmeKind", kind) })),
      ]),
    [valid, filters, t, label]
  );

  const countryOptions = useMemo(
    () =>
      optionsFor(valid, filters, "country", [
        { id: "Todos", label: t("estudios.filterAll", "Todos") },
        ...Array.from(new Set(valid.map((p) => p.country)))
          .sort((a, b) => a.localeCompare(b, "es"))
          .map((country) => ({ id: country, label: label("country", country) })),
      ]),
    [valid, filters, t, label]
  );

  const modalityOptions = useMemo(
    () =>
      optionsFor(valid, filters, "modality", [
        { id: "Todas", label: t("estudios.filterAllF", "Todas") },
        ...Array.from(new Set(valid.map((p) => p.modality)))
          .sort((a, b) => a.localeCompare(b, "es"))
          .map((modality) => ({ id: modality, label: label("modality", modality) })),
      ]),
    [valid, filters, t, label]
  );

  /**
   * "Sin verificar" is an option rather than a silent omission: an entry whose
   * route nobody checked carries no value, and hiding those would let the
   * filter imply the catalogue knows more than it does.
   */
  const routeOptions = useMemo(
    () =>
      optionsFor(valid, filters, "migrationRoute", [
        { id: "todas", label: t("estudios.filterAllF", "Todas") },
        ...ROUTE_ORDER.map((route) => ({ id: route, label: label("migrationRoute", route) })),
        { id: "sin-verificar", label: label("migrationRoute", "sin-verificar") },
      ]),
    [valid, filters, t, label]
  );

  /**
   * Which filters are narrowing the list, in words. An empty state that says
   * "no results" without naming the filter that caused it leaves the reader
   * guessing at the one to relax.
   */
  const activeFilterSummary = [
    filters.search.trim() && `"${filters.search.trim()}"`,
    filters.country !== "Todos" && label("country", filters.country),
    filters.kind !== "todos" && label("programmeKind", filters.kind),
    filters.modality !== "Todas" && label("modality", filters.modality),
    filters.migrationRoute !== "todas" && label("migrationRoute", filters.migrationRoute),
  ].filter((entry): entry is string => Boolean(entry));

  /**
   * The chip groups, rendered wherever the caller puts them — the sidebar on
   * desktop, the sheet on a phone. Both copies are in the DOM at once below
   * `lg`, so each scopes its element ids.
   */
  const renderGroups = (scope: "sidebar" | "sheet") => (
    <>
      {/*
        Migration first. It is the reason somebody is here rather than on a
        course aggregator, and putting it under three other filters would bury
        the one question this platform exists to answer.
      */}
      <FilterChipGroup
        label={t("estudios.routeLabel", "¿Abre vía migratoria?")}
        icon={<Plane className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={routeOptions}
        value={filters.migrationRoute}
        onChange={(id) => setFilter("migrationRoute", id as StudyFilters["migrationRoute"])}
        idPrefix={`${scope}-estudios-route-chip`}
        layout="wrap"
      />
      <FilterChipGroup
        label={t("estudios.countryLabel", "País")}
        icon={<Globe2 className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={countryOptions}
        value={filters.country}
        onChange={(id) => setFilter("country", id)}
        idPrefix={`${scope}-estudios-country-chip`}
        layout="wrap"
      />
      <FilterChipGroup
        label={t("estudios.kindLabel", "Tipo de programa")}
        icon={<GraduationCap className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={kindOptions}
        value={filters.kind}
        onChange={(id) => setFilter("kind", id as StudyFilters["kind"])}
        idPrefix={`${scope}-estudios-kind-chip`}
        layout="wrap"
      />
      <FilterChipGroup
        label={t("estudios.modalityLabel", "Modalidad")}
        icon={<Wifi className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={modalityOptions}
        value={filters.modality}
        onChange={(id) => setFilter("modality", id)}
        idPrefix={`${scope}-estudios-modality-chip`}
        layout="wrap"
      />
    </>
  );

  return {
    filters,
    sortBy,
    setSortBy,
    setFilter,
    clearFilters,
    activeFilterCount,
    activeFilterSummary,
    valid,
    rejected,
    matching,
    visible,
    loadMore: () => setVisibleCount((prev) => prev + STUDY_BATCH_SIZE),
    renderGroups,
  };
};

export type StudyFilterState = ReturnType<typeof useStudyFilters>;
