import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  CheckCircle2,
  ExternalLink,
  Globe2,
  GraduationCap,
  Heart,
  Landmark,
  Link2,
  Plane,
  RotateCcw,
  Search,
  Wifi,
} from "lucide-react";

import { STUDY_PROGRAMMES_DATA } from "../data/studyProgrammes";
import { useLanguage } from "../lib/i18n";
import {
  EMPTY_STUDY_FILTERS,
  MIGRATION_ROUTE_BADGE_LABELS,
  MIGRATION_ROUTE_LABELS,
  REJECTION_REASONS,
  STUDY_KIND_BADGE_LABELS,
  STUDY_KIND_LABELS,
  StudyFilters,
  countByOption,
  matchesStudyFilters,
  validateStudyProgrammes,
} from "../lib/studyProgrammes";
import { MigrationRoute, Scholarship, StudyProgramme, StudyProgrammeKind } from "../types";
import { isFavourite } from "../lib/favourites";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Disclosure } from "./ui/Disclosure";
import { FilterChipGroup } from "./ui/FilterChipGroup";

interface EstudiosSectionProps {
  /**
   * The scholarship catalogue as it is on screen — the live Firestore one when
   * it loaded, the bundled copy otherwise. A related scholarship is linked only
   * when it is in this list: pointing at a record that is not there would be
   * inventing one.
   */
  scholarships: Scholarship[];
  /** Opens a scholarship's detail panel on the other half of the screen. */
  onOpenScholarship: (scholarship: Scholarship) => void;
  /** Catalogue used instead of the bundled one. Tests pass their own. */
  programmes?: StudyProgramme[];
  /** Favourite keys, shared with the scholarship half of the screen (#82). */
  favourites?: string[];
  /** Omitted when saving is not offered — the heart is then not rendered. */
  onToggleFavourite?: (id: string) => void;
  /** Hides the section heading, for the favourites tab which has its own. */
  hideHeading?: boolean;
}

const KIND_ORDER: StudyProgrammeKind[] = ["curso", "certificado", "fp"];

const ROUTE_ORDER: MigrationRoute[] = ["directa", "requisito", "ninguna"];

/**
 * How many programmes each "Ver más" adds.
 *
 * The whole catalogue at once is 9463px on a 375px viewport — eleven screens,
 * the density #54 was opened about. The sibling scholarship list already pages
 * in sixes, and two catalogues on one screen behaving differently is worse
 * than either behaviour.
 */
const STUDY_BATCH_SIZE = 6;

/**
 * Filter options with the count each one would give.
 *
 * Hoisted out of the component so the count and the list are one call to one
 * predicate, and so the memos that build the options declare a complete
 * dependency list rather than closing over a helper redefined on every render.
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
 * Courses, certificates and vocational training — the half of "Becas &
 * Estudios" that had nothing behind it (#56).
 *
 * Every entry is an official programme cited from its institution's own
 * domain. Entries that fail that check are reported above the list rather than
 * dropped, so a catalogue that shrinks says so.
 */
export const EstudiosSection: React.FC<EstudiosSectionProps> = ({
  scholarships,
  onOpenScholarship,
  programmes = STUDY_PROGRAMMES_DATA,
  favourites = [],
  onToggleFavourite,
  hideHeading = false,
}) => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<StudyFilters>(EMPTY_STUDY_FILTERS);
  const [visibleCount, setVisibleCount] = useState(STUDY_BATCH_SIZE);

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
    () => valid.filter((programme) => matchesStudyFilters(programme, filters)),
    [valid, filters]
  );

  const visible = matching.slice(0, visibleCount);

  /**
   * Every count is this same predicate with one axis relaxed, so the number on
   * a chip is exactly what selecting it renders. Two definitions of one rule
   * drift, and the interface starts lying about its own behaviour.
   */
  const kindOptions = useMemo(
    () =>
      optionsFor(valid, filters, "kind", [
        { id: "todos", label: t("estudios.filterAll", "Todos") },
        ...KIND_ORDER.map((kind) => ({ id: kind, label: STUDY_KIND_LABELS[kind] })),
      ]),
    [valid, filters, t]
  );

  const countryOptions = useMemo(
    () =>
      optionsFor(valid, filters, "country", [
        { id: "Todos", label: t("estudios.filterAll", "Todos") },
        ...Array.from(new Set(valid.map((p) => p.country)))
          .sort((a, b) => a.localeCompare(b, "es"))
          .map((country) => ({ id: country, label: country })),
      ]),
    [valid, filters, t]
  );

  const modalityOptions = useMemo(
    () =>
      optionsFor(valid, filters, "modality", [
        { id: "Todas", label: t("estudios.filterAllF", "Todas") },
        ...Array.from(new Set(valid.map((p) => p.modality)))
          .sort((a, b) => a.localeCompare(b, "es"))
          .map((modality) => ({ id: modality, label: modality })),
      ]),
    [valid, filters, t]
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
        ...ROUTE_ORDER.map((route) => ({ id: route, label: MIGRATION_ROUTE_LABELS[route] })),
        { id: "sin-verificar", label: t("estudios.routeUnverified", "Sin verificar") },
      ]),
    [valid, filters, t]
  );

  /**
   * Which filters are narrowing the list, in words.
   *
   * An empty state that says "no results" without saying which of four filters
   * caused it leaves the reader guessing at the one to relax.
   */
  const activeFilterSummary = [
    filters.search.trim() && `"${filters.search.trim()}"`,
    filters.country !== "Todos" && filters.country,
    filters.kind !== "todos" && STUDY_KIND_LABELS[filters.kind],
    filters.modality !== "Todas" && filters.modality,
    filters.migrationRoute === "sin-verificar"
      ? t("estudios.routeUnverified", "Sin verificar")
      : filters.migrationRoute !== "todas" && MIGRATION_ROUTE_LABELS[filters.migrationRoute],
  ].filter((entry): entry is string => Boolean(entry));

  /** Scholarships an entry names, keeping only the ones actually loaded. */
  const relatedScholarships = (programme: StudyProgramme): Scholarship[] =>
    (programme.relatedScholarshipIds ?? [])
      .map((id) => scholarships.find((s) => s.id === id))
      .filter((s): s is Scholarship => Boolean(s));

  return (
    <section
      className="space-y-6"
      aria-label={t("estudios.title", "Estudiar sin beca: cursos, certificados y FP")}
    >
      {!hideHeading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" aria-hidden="true" />
            <span>{t("estudios.eyebrow", "Programas y portales oficiales")}</span>
          </div>
          <h2
            id="estudios-heading"
            className="font-headline-sm text-2xl font-extrabold text-primary dark:text-sky-300"
          >
            {t("estudios.title", "Estudiar sin beca: cursos, certificados y FP")}
          </h2>
          <p className="text-sm text-on-surface-variant dark:text-slate-300 max-w-3xl">
            {t(
              "estudios.subtitle",
              "Rutas de estudio que no dependen de financiación: formación profesional, certificaciones de idioma y cursos oficiales. Cada una enlaza a la fuente oficial que la publica."
            )}
          </p>
        </div>
      )}

      {/* An entry the catalogue could not vouch for is reported, never hidden. */}
      {rejected.length > 0 && (
        <div
          role="status"
          id="estudios-rejected-status"
          className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl px-3.5 py-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {t("estudios.rejectedNotice", "No mostramos")} {rejected.length}{" "}
            {rejected.length === 1
              ? t("estudios.rejectedOne", "programa porque")
              : t("estudios.rejectedMany", "programas porque")}{" "}
            {rejected.map((r) => REJECTION_REASONS[r.reason]).join("; ")}.
          </span>
        </div>
      )}

      <div className="space-y-3.5 bg-surface-container-lowest dark:bg-slate-800 p-3.5 rounded-2xl border border-outline-variant/40 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              id="estudios-search-input"
              aria-label={t("estudios.searchLabel", "Buscar programa o institución")}
              placeholder={t("estudios.searchPlaceholder", "Buscar por nombre o institución…")}
              className="pl-9"
            />
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              id="estudios-clear-filters"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-semibold text-secondary dark:text-teal-400 hover:underline cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("estudios.clearFilters", "Limpiar")}</span>
            </button>
          )}
        </div>

        {/*
          Migration first. It is the reason somebody is here rather than on a
          course aggregator, and putting it under three other filters would bury
          the one question this platform exists to answer.
        */}
        <FilterChipGroup
          label={t("estudios.routeLabel", "¿Abre vía migratoria?")}
          icon={<Plane className="w-4 h-4 text-secondary dark:text-teal-400" />}
          options={routeOptions}
          value={filters.migrationRoute}
          onChange={(id) => setFilter("migrationRoute", id as StudyFilters["migrationRoute"])}
          idPrefix="estudios-route-chip"
          onClear={
            filters.migrationRoute !== "todas"
              ? () => setFilter("migrationRoute", "todas")
              : undefined
          }
        />

        <FilterChipGroup
          label={t("estudios.countryLabel", "País")}
          icon={<Globe2 className="w-4 h-4 text-secondary dark:text-teal-400" />}
          options={countryOptions}
          value={filters.country}
          onChange={(id) => setFilter("country", id)}
          idPrefix="estudios-country-chip"
          onClear={filters.country !== "Todos" ? () => setFilter("country", "Todos") : undefined}
        />

        <FilterChipGroup
          label={t("estudios.kindLabel", "Tipo de programa")}
          icon={<GraduationCap className="w-4 h-4 text-secondary dark:text-teal-400" />}
          options={kindOptions}
          value={filters.kind}
          onChange={(id) => setFilter("kind", id as StudyFilters["kind"])}
          idPrefix="estudios-kind-chip"
          onClear={filters.kind !== "todos" ? () => setFilter("kind", "todos") : undefined}
        />

        <FilterChipGroup
          label={t("estudios.modalityLabel", "Modalidad")}
          icon={<Wifi className="w-4 h-4 text-secondary dark:text-teal-400" />}
          options={modalityOptions}
          value={filters.modality}
          onChange={(id) => setFilter("modality", id)}
          idPrefix="estudios-modality-chip"
          onClear={filters.modality !== "Todas" ? () => setFilter("modality", "Todas") : undefined}
        />
      </div>

      {visible.length === 0 ? (
        <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl p-10 text-center space-y-4 border border-outline-variant/40 dark:border-slate-700">
          <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
            {valid.length === 0
              ? t("estudios.emptyCatalogueTitle", "No pudimos mostrar el catálogo de estudios")
              : t("estudios.emptyFilterTitle", "Ningún programa con estos filtros")}
          </h3>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-md mx-auto">
            {valid.length === 0
              ? t(
                  "estudios.emptyCatalogueBody",
                  "Ninguna de las entradas cumple la regla de fuente oficial, así que no hay nada verificado que enseñarte."
                )
              : `${t("estudios.emptyFilterBody", "Ningún programa cumple a la vez")}: ${activeFilterSummary.join(", ")}.`}
          </p>
          {valid.length > 0 && (
            <Button variant="soft" size="sm" onClick={clearFilters}>
              {t("estudios.seeAll", "Ver todos los programas")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-300">
            {t("estudios.showing", "Mostrando")} <strong>{visible.length}</strong>{" "}
            {t("estudios.of", "de")} <strong>{matching.length}</strong>{" "}
            {t("estudios.programmes", "programas oficiales")}
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5" id="estudios-list">
            {visible.map((programme) => {
              const related = relatedScholarships(programme);

              return (
                <Card key={programme.id} id={`estudio-card-${programme.id}`}>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="level">{STUDY_KIND_BADGE_LABELS[programme.kind]}</Badge>
                      <Badge variant="institution">{programme.country}</Badge>
                      <Badge variant="support">{programme.modality}</Badge>
                      {/*
                        Absent, not guessed. An entry nobody has checked says so
                        rather than borrowing the answer from a similar one.
                      */}
                      <Badge
                        variant={programme.migrationRoute === "directa" ? "official" : "neutral"}
                      >
                        {programme.migrationRoute
                          ? MIGRATION_ROUTE_BADGE_LABELS[programme.migrationRoute]
                          : t("estudios.routeUnverified", "Sin verificar")}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2">
                      <h3 className="flex-1 text-lg font-bold text-primary dark:text-sky-300 text-pretty">
                        {programme.title}
                      </h3>
                      {onToggleFavourite && (
                        <button
                          type="button"
                          id={`estudio-fav-${programme.id}`}
                          onClick={() => onToggleFavourite(programme.id)}
                          aria-pressed={isFavourite(favourites, "programme", programme.id)}
                          title={
                            isFavourite(favourites, "programme", programme.id)
                              ? t("estudios.removeFavourite", "Quitar de mis guardados")
                              : t("estudios.addFavourite", "Guardar este programa")
                          }
                          className="shrink-0 grid place-items-center w-11 h-11 -mt-1.5 -mr-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer active:scale-95 transition-transform"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              isFavourite(favourites, "programme", programme.id)
                                ? "fill-current"
                                : ""
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>

                    <p className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant dark:text-slate-300">
                      <Landmark className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {programme.institution}
                    </p>

                    <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
                      {programme.description}
                    </p>

                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <div>
                        <dt className="font-bold text-on-surface dark:text-slate-200">
                          {t("estudios.duration", "Duración")}
                        </dt>
                        <dd className="text-on-surface-variant dark:text-slate-400">
                          {programme.duration}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold text-on-surface dark:text-slate-200">
                          {t("estudios.cost", "Coste")}
                        </dt>
                        <dd className="text-on-surface-variant dark:text-slate-400">
                          {programme.cost}
                        </dd>
                      </div>
                    </dl>

                    {/*
                      The bulk of the card collapses below `lg` and stays open
                      above it — the same Disclosure the guides (#54) and the
                      scholarship detail panel (#53) use. The official link is
                      never inside it: it is why the entry exists.
                    */}
                    <Disclosure
                      id={`estudio-details-${programme.id}`}
                      label={t("estudios.showDetails", "Ver requisitos y titulación")}
                      labelWhenOpen={t("estudios.hideDetails", "Ocultar requisitos")}
                    >
                      {programme.migrationRouteNote && (
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-on-surface dark:text-slate-200">
                            <Plane className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            {t("estudios.routeHeading", "Vía migratoria")}
                          </p>
                          <p className="text-xs text-on-surface-variant dark:text-slate-400">
                            {programme.migrationRouteNote}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-on-surface dark:text-slate-200">
                          {t("estudios.outcome", "Qué obtienes")}
                        </p>
                        <p className="text-xs text-on-surface-variant dark:text-slate-400">
                          {programme.outcome}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-on-surface dark:text-slate-200">
                          {t("estudios.requirements", "Requisitos")}
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-on-surface-variant dark:text-slate-400">
                          {programme.requirements.map((requirement) => (
                            <li key={requirement}>{requirement}</li>
                          ))}
                        </ul>
                      </div>
                    </Disclosure>

                    {related.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-secondary dark:text-teal-300">
                          <Link2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          {t("estudios.relatedScholarships", "Becas para esta ruta")}
                        </p>
                        <ul className="space-y-1">
                          {related.map((scholarship) => (
                            <li key={scholarship.id}>
                              <button
                                type="button"
                                id={`estudio-beca-link-${scholarship.id}`}
                                onClick={() => onOpenScholarship(scholarship)}
                                className="text-xs font-semibold text-secondary dark:text-teal-300 hover:underline text-left min-h-[44px] sm:min-h-0 cursor-pointer"
                              >
                                {scholarship.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Button variant="secondary" size="sm" className="flex-1" asChild>
                      <a
                        href={programme.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        id={`estudio-official-link-${programme.id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="truncate">{programme.officialPortalName}</span>
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* One way through the catalogue, matching the scholarship list. */}
          {matching.length > STUDY_BATCH_SIZE && (
            <div className="pt-1 text-center">
              {visible.length < matching.length ? (
                <Button
                  variant="secondary"
                  id="btn-load-more-estudios"
                  onClick={() => setVisibleCount((count) => count + STUDY_BATCH_SIZE)}
                >
                  <ArrowDownCircle className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {t("estudios.loadMore", "Ver más programas")} (+
                    {Math.min(STUDY_BATCH_SIZE, matching.length - visible.length)})
                  </span>
                </Button>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {t("estudios.reachedEnd", "Has visto los")} {matching.length}{" "}
                    {t("estudios.programmes", "programas oficiales")}
                  </span>
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
