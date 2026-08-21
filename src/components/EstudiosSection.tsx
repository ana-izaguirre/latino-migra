import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Landmark,
  Link2,
} from "lucide-react";

import { STUDY_PROGRAMMES_DATA } from "../data/studyProgrammes";
import { useLanguage } from "../lib/i18n";
import {
  REJECTION_REASONS,
  STUDY_KIND_BADGE_LABELS,
  STUDY_KIND_LABELS,
  validateStudyProgrammes,
} from "../lib/studyProgrammes";
import { Scholarship, StudyProgramme, StudyProgrammeKind } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
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
}

type KindFilter = "todos" | StudyProgrammeKind;

const KIND_ORDER: StudyProgrammeKind[] = ["curso", "certificado", "fp"];

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
}) => {
  const { t } = useLanguage();
  const [kindFilter, setKindFilter] = useState<KindFilter>("todos");
  const [visibleCount, setVisibleCount] = useState(STUDY_BATCH_SIZE);

  /** Narrowing the list starts it again from the top of the new list. */
  const changeKind = (kind: KindFilter) => {
    setKindFilter(kind);
    setVisibleCount(STUDY_BATCH_SIZE);
  };

  const { valid, rejected } = useMemo(() => validateStudyProgrammes(programmes), [programmes]);

  const matching = useMemo(
    () => (kindFilter === "todos" ? valid : valid.filter((p) => p.kind === kindFilter)),
    [valid, kindFilter]
  );

  const visible = matching.slice(0, visibleCount);

  /**
   * The counts come from the same list the chips filter, so a chip cannot
   * promise results the list does not have.
   */
  const kindOptions = useMemo(
    () => [
      { id: "todos", label: t("estudios.kindAll", "Todos"), count: valid.length },
      ...KIND_ORDER.map((kind) => ({
        id: kind,
        label: STUDY_KIND_LABELS[kind],
        count: valid.filter((p) => p.kind === kind).length,
      })),
    ],
    [valid, t]
  );

  /** Scholarships an entry names, keeping only the ones actually loaded. */
  const relatedScholarships = (programme: StudyProgramme): Scholarship[] =>
    (programme.relatedScholarshipIds ?? [])
      .map((id) => scholarships.find((s) => s.id === id))
      .filter((s): s is Scholarship => Boolean(s));

  return (
    <section className="space-y-6" aria-labelledby="estudios-heading">
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

      <FilterChipGroup
        label={t("estudios.kindLabel", "Tipo de programa")}
        icon={<GraduationCap className="w-4 h-4 text-secondary dark:text-teal-400" />}
        options={kindOptions}
        value={kindFilter}
        onChange={(id) => changeKind(id as KindFilter)}
        idPrefix="estudios-kind-chip"
        onClear={kindFilter !== "todos" ? () => setKindFilter("todos") : undefined}
      />

      {visible.length === 0 ? (
        <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl p-10 text-center space-y-4 border border-outline-variant/40 dark:border-slate-700">
          <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
            {valid.length === 0
              ? t("estudios.emptyCatalogueTitle", "No pudimos mostrar el catálogo de estudios")
              : t("estudios.emptyFilterTitle", "Ningún programa de este tipo")}
          </h3>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-md mx-auto">
            {valid.length === 0
              ? t(
                  "estudios.emptyCatalogueBody",
                  "Ninguna de las entradas cumple la regla de fuente oficial, así que no hay nada verificado que enseñarte."
                )
              : t(
                  "estudios.emptyFilterBody",
                  "Cambia el tipo de programa para ver el resto del catálogo."
                )}
          </p>
          {valid.length > 0 && (
            <Button variant="soft" size="sm" onClick={() => changeKind("todos")}>
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
                    </div>

                    <h3 className="text-lg font-bold text-primary dark:text-sky-300 text-pretty">
                      {programme.title}
                    </h3>

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
