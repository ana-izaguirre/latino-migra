import React, { useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Heart,
  Landmark,
  Link2,
  Plane,
} from "lucide-react";

import { STUDY_PROGRAMMES_DATA } from "../data/studyProgrammes";
import { useLanguage } from "../lib/i18n";
import { useLabels } from "../lib/labels";
import { STUDY_BATCH_SIZE, StudyFilterState, useStudyFilters } from "../lib/useStudyFilters";
import { REJECTION_REASONS } from "../lib/studyProgrammes";
import { Scholarship, StudyProgramme } from "../types";
import { isFavourite } from "../lib/favourites";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Modal } from "./ui/Modal";

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
  /**
   * Filter state owned by the caller, so the chips can render in the shared
   * sidebar and sheet. Omitted by callers that show a fixed list.
   */
  filterState?: StudyFilterState;
  /** Favourite keys, shared with the scholarship half of the screen (#82). */
  favourites?: string[];
  /** Omitted when saving is not offered — the heart is then not rendered. */
  onToggleFavourite?: (id: string) => void;
  /** Hides the section heading, for the favourites tab which has its own. */
  hideHeading?: boolean;
}

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
  filterState,
}) => {
  const { t } = useLanguage();
  const label = useLabels();
  /*
    The detail panel, opened from the card exactly as a scholarship's is. The
    requirements used to sit inline behind a Disclosure, which made a study
    card three times the height of the scholarship card beside it (#105).
  */
  const [selectedProgramme, setSelectedProgramme] = useState<StudyProgramme | null>(null);
  /*
    The filters live outside this component so they can be rendered in the
    same sidebar and the same sheet as the scholarship ones (#105). A caller
    that has no filter state of its own — the saved-programmes strip inside
    favourites — gets one here.
  */
  const ownState = useStudyFilters(programmes);
  const state = filterState ?? ownState;
  const { clearFilters, activeFilterSummary, valid, rejected, matching, visible, loadMore } = state;
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
            {visible.map((programme) => (
              <Card key={programme.id} id={`estudio-card-${programme.id}`}>
                <CardContent className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="level">{label("programmeKindBadge", programme.kind)}</Badge>
                    <Badge variant="institution">{label("country", programme.country)}</Badge>
                    <Badge variant="support">{label("modality", programme.modality)}</Badge>
                    {/*
                        Absent, not guessed. An entry nobody has checked says so
                        rather than borrowing the answer from a similar one.
                      */}
                    <Badge
                      variant={programme.migrationRoute === "directa" ? "official" : "neutral"}
                    >
                      {programme.migrationRoute
                        ? label("migrationRouteBadge", programme.migrationRoute)
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
                            isFavourite(favourites, "programme", programme.id) ? "fill-current" : ""
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

                  <p className="text-sm text-on-surface-variant dark:text-slate-400 line-clamp-2 leading-relaxed">
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
                </CardContent>

                <CardFooter>
                  <Button
                    variant="soft"
                    size="sm"
                    className="flex-1"
                    id={`estudio-details-${programme.id}`}
                    onClick={() => setSelectedProgramme(programme)}
                  >
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t("estudios.viewDetails", "Ver Detalles")}</span>
                  </Button>

                  <Button variant="secondary" size="sm" asChild>
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
            ))}
          </div>

          {/* One way through the catalogue, matching the scholarship list. */}
          {matching.length > STUDY_BATCH_SIZE && (
            <div className="pt-1 text-center">
              {visible.length < matching.length ? (
                <Button variant="secondary" id="btn-load-more-estudios" onClick={loadMore}>
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

      {selectedProgramme && (
        <Modal
          open={selectedProgramme !== null}
          onOpenChange={(next) => {
            if (!next) setSelectedProgramme(null);
          }}
          title={selectedProgramme.title}
          size="lg"
          id="estudio-detail-modal"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="level">{label("programmeKindBadge", selectedProgramme.kind)}</Badge>
              <Badge variant="institution">{label("country", selectedProgramme.country)}</Badge>
              <Badge variant="support">{label("modality", selectedProgramme.modality)}</Badge>
              <Badge
                variant={selectedProgramme.migrationRoute === "directa" ? "official" : "neutral"}
              >
                {selectedProgramme.migrationRoute
                  ? label("migrationRouteBadge", selectedProgramme.migrationRoute)
                  : t("estudios.routeUnverified", "Sin verificar")}
              </Badge>
            </div>

            <p className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant dark:text-slate-300">
              <Landmark className="w-4 h-4 shrink-0" aria-hidden="true" />
              {selectedProgramme.institution}
            </p>

            <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
              {selectedProgramme.description}
            </p>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="font-bold text-on-surface dark:text-slate-200">
                  {t("estudios.duration", "Duración")}
                </dt>
                <dd className="text-on-surface-variant dark:text-slate-400">
                  {selectedProgramme.duration}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-on-surface dark:text-slate-200">
                  {t("estudios.cost", "Coste")}
                </dt>
                <dd className="text-on-surface-variant dark:text-slate-400">
                  {selectedProgramme.cost}
                </dd>
              </div>
            </dl>

            {/* Present only when somebody checked it. Never inferred. */}
            {selectedProgramme.migrationRouteNote && (
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-sm font-bold text-on-surface dark:text-slate-200">
                  <Plane className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {t("estudios.routeHeading", "Vía migratoria")}
                </p>
                <p className="text-sm text-on-surface-variant dark:text-slate-400">
                  {selectedProgramme.migrationRouteNote}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-bold text-on-surface dark:text-slate-200">
                {t("estudios.outcome", "Qué obtienes")}
              </p>
              <p className="text-sm text-on-surface-variant dark:text-slate-400">
                {selectedProgramme.outcome}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-on-surface dark:text-slate-200">
                {t("estudios.requirements", "Requisitos")}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-on-surface-variant dark:text-slate-400">
                {selectedProgramme.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </div>

            {/*
              Linked only when the catalogue on screen holds the record. An id
              that resolves to nothing gets no link rather than a dead one.
            */}
            {relatedScholarships(selectedProgramme).length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-sm font-bold text-secondary dark:text-teal-300">
                  <Link2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {t("estudios.relatedScholarships", "Becas para esta ruta")}
                </p>
                <ul className="space-y-1">
                  {relatedScholarships(selectedProgramme).map((scholarship) => (
                    <li key={scholarship.id}>
                      <button
                        type="button"
                        id={`estudio-beca-link-${scholarship.id}`}
                        onClick={() => {
                          setSelectedProgramme(null);
                          onOpenScholarship(scholarship);
                        }}
                        className="text-sm font-semibold text-secondary dark:text-teal-300 hover:underline text-left min-h-[44px] sm:min-h-0 cursor-pointer"
                      >
                        {scholarship.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="secondary" className="w-full" asChild>
              <a
                href={selectedProgramme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                id={`estudio-modal-official-link-${selectedProgramme.id}`}
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                <span className="truncate">{selectedProgramme.officialPortalName}</span>
              </a>
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
};
