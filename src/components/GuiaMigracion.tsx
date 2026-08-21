import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  Clock,
  CheckCircle2,
  Circle,
  DollarSign,
  Download,
  Bot,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Building,
  ExternalLink,
  Briefcase,
  Check,
  ThumbsUp,
} from "lucide-react";
import { NavigationTab } from "../types";
import { useLanguage } from "../lib/i18n";
import { Breadcrumbs } from "./Breadcrumbs";
import { MIGRATION_GUIDES_DATA } from "../data/migrationGuides";
import { COUNTRY_ANTI_SCAM_DATA } from "../data/antiScamData";
import { Disclosure } from "./ui/Disclosure";
import { FilterChipGroup } from "./ui/FilterChipGroup";
import { CalendarAgendaButton } from "./CalendarAgendaButton";
import { fetchVisaGuideVotes, voteVisaHelpful, VisaVotesData } from "../lib/firebase";
import { GoogleUser } from "../types";
import { usePreferences } from "../lib/PreferencesContext";
import { useCurrency } from "../lib/CurrencyContext";
import { convertCostRange, formatCostRange } from "../lib/currency";

interface GuiaMigracionProps {
  setActiveTab: (tab: NavigationTab) => void;
  onAskAIAboutGuide: (countryName: string, visaName?: string) => void;
  /** Voting needs an identity: the vote document is keyed by it. */
  currentUser?: GoogleUser | null;
  onOpenAuthModal?: () => void;
}

export const GuiaMigracion: React.FC<GuiaMigracionProps> = ({
  setActiveTab,
  onAskAIAboutGuide,
  currentUser,
  onOpenAuthModal,
}) => {
  const { t } = useLanguage();
  // Country selection is shared app-wide, so opening a guide for Alemania also
  // moves the planner, calculator, consular map and alerts to Alemania.
  const { destinationCountryCode, setDestinationCountryByCode } = usePreferences();
  const { currency } = useCurrency();
  const selectedCountryCode = destinationCountryCode || "ES";
  const setSelectedCountryCode = setDestinationCountryByCode;
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [visaVotes, setVisaVotes] = useState<Record<string, VisaVotesData>>({});
  const [userVotedVisas, setUserVotedVisas] = useState<Record<string, boolean>>({});

  /**
   * How the vote counts are going.
   *
   * The counter used to print `helpfulVotes || 18` — so a country with no votes
   * at all, which is every country while the collection is empty, claimed
   * eighteen people had found each visa useful. A count that could not be read
   * now renders as no count (#79).
   */
  const [votesStatus, setVotesStatus] = useState<"loading" | "loaded" | "failed">("loading");
  const [voteError, setVoteError] = useState<string | null>(null);

  const guide = MIGRATION_GUIDES_DATA[selectedCountryCode] || MIGRATION_GUIDES_DATA["ES"];

  // Community vote counts for the active country.
  useEffect(() => {
    let isMounted = true;
    setVotesStatus("loading");
    fetchVisaGuideVotes(selectedCountryCode)
      .then((data) => {
        if (!isMounted) return;
        setVisaVotes(data);
        setVotesStatus("loaded");
      })
      .catch((e) => {
        console.warn("Could not load visa votes:", e);
        if (isMounted) setVotesStatus("failed");
      });
    return () => {
      isMounted = false;
    };
  }, [selectedCountryCode]);

  // A vote belongs to a person, so the tab change carries no votes with it.
  useEffect(() => {
    setUserVotedVisas({});
  }, [selectedCountryCode, currentUser?.id]);

  const handleVoteVisa = async (visaId: string) => {
    if (!currentUser?.id) {
      onOpenAuthModal?.();
      return;
    }
    if (userVotedVisas[visaId]) return;

    setVoteError(null);
    try {
      const newCount = await voteVisaHelpful(currentUser.id, selectedCountryCode, visaId);
      setUserVotedVisas((prev) => ({ ...prev, [visaId]: true }));
      setVisaVotes((prev) => ({ ...prev, [visaId]: { helpfulVotes: newCount } }));
      setVotesStatus("loaded");
    } catch (e) {
      // The write used to be answered with an invented number from an
      // in-memory cache, so a denied write looked exactly like a successful
      // one. A failure has to be visible somewhere.
      console.warn("Vote error:", e);
      setVoteError(
        t("guia.voteFailed", "No pudimos registrar tu voto. Inténtalo de nuevo más tarde.")
      );
    }
  };

  /**
   * Moving to another country resets the category filter and reloads the
   * checklist: the document ids differ per country, so keeping the old state
   * would tick boxes for documents the new country does not ask for.
   */
  const selectCountry = (code: string) => {
    const next = MIGRATION_GUIDES_DATA[code];
    if (!next) return;
    setSelectedCountryCode(code);
    setSelectedCategory("todos");
    const newDocs: Record<string, boolean> = {};
    next.documents.forEach((d) => (newDocs[d.id] = d.completed));
    setDocState(newDocs);
  };

  const countryOptions = useMemo(
    () =>
      Object.values(MIGRATION_GUIDES_DATA).map((item) => ({
        id: item.id,
        label: `${item.flag} ${item.country}`,
        count: item.visas.length,
      })),
    []
  );

  const [docState, setDocState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    guide.documents.forEach((d) => (initial[d.id] = d.completed));
    return initial;
  });

  const toggleDoc = (docId: string) => {
    setDocState((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const handleDownloadChecklist = () => {
    const textLines = [
      `=========================================`,
      `CHECKLIST OFICIAL DE MIGRACIÓN - ${guide.country.toUpperCase()}`,
      `Portal Oficial: ${guide.officialPortalName || "Gobierno Oficial"} (${guide.officialImmigrationPortal || ""})`,
      `Generado: ${new Date().toLocaleDateString()} vía LatinoMigra`,
      `=========================================`,
      ``,
      `[ ESTADO DE DOCUMENTOS Y REQUISITOS ]`,
      ...guide.documents.map(
        (doc) =>
          `[${docState[doc.id] ? "LISTO / OK" : "PENDIENTE"}] ${doc.title}\n   Detalle: ${doc.subtitle}\n`
      ),
      ``,
      `=========================================`,
      `[ CONSEJO CLAVE DE LLEGADA ]`,
      `"${guide.communityTip.text}"`,
      `— ${guide.communityTip.author}`,
      `=========================================`,
      `Generado por LatinoMigra - Plataforma de Migración y Becas para Latinoamérica`,
    ];

    const blob = new Blob([textLines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Checklist-Migratorio-${guide.country}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredVisas = guide.visas.filter((v) => {
    if (selectedCategory === "todos") return true;
    return v.category === selectedCategory;
  });

  const availableCategories = Array.from(
    new Set(guide.visas.map((v) => v.category).filter(Boolean))
  ) as string[];

  const roadmapSteps = [
    { num: 1, title: "Decisión y Búsqueda", desc: "Programa académico, idiomas o contrato" },
    { num: 2, title: "Selección de Visa", desc: "Tipo de visado según categoría y fondos" },
    { num: 3, title: "Documentación Consular", desc: "Apostillas, seguro médico y citas" },
    { num: 4, title: "Llegada y Trámites", desc: "Padrón/Anmeldung/SIN/PPS y banco" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs activeTab="guia" setActiveTab={setActiveTab} subPageTitle={guide.country} />

      {/* Country Selector Header */}
      <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-outline-variant/40 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>
                {t("guia.eyebrow", "Guías Oficiales Paso a Paso • Fuentes Gubernamentales")}
              </span>
            </div>
            <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300 flex items-center gap-3">
              <span>{guide.flag}</span>
              <span>{guide.country}: Vías Migratorias y Trámites</span>
            </h1>
            {guide.officialImmigrationPortal && (
              <p className="text-xs text-on-surface-variant dark:text-slate-400 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t("guia.directSource", "Fuente directa:")}</span>
                <a
                  href={guide.officialImmigrationPortal}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary dark:text-sky-300 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  {guide.officialPortalName || guide.officialImmigrationPortal}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            )}
          </div>

          {/*
            One swipeable row, not a wrapped grid of blocks.

            Seven full-size buttons in a `flex-wrap` row took three lines at
            375px, sat between the title and the content, and the selected one
            carried `scale-105`, so it overlapped its neighbours. The chips are
            the pattern the scholarship filters already use (#50); a third
            pattern for the same job is the problem, not the styling.

            The count is the number of visa routes for that country — the same
            list the selection leads to, so the chip cannot promise a screen
            the guide does not have.
          */}
          <FilterChipGroup
            label={t("guia.countryLabel", "País de destino")}
            icon={<Compass className="w-4 h-4 text-secondary dark:text-teal-400" />}
            options={countryOptions}
            value={selectedCountryCode}
            onChange={selectCountry}
            idPrefix="guide-country"
          />
        </div>
      </div>

      {/* Roadmap & Time Banner */}
      <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-outline-variant/40 dark:border-slate-700 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-700 pb-4">
          <div className="space-y-0.5">
            <h2 className="font-headline-md text-xl font-bold text-primary dark:text-sky-300">
              {t("guia.routeTitle", "Ruta Migratoria y Cronograma Realista")}
            </h2>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">
              Las cuatro fases, en orden, desde la preparación en tu país hasta tus primeros días en
              destino. Es la ruta que vas a recorrer, no un registro de tu avance.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto">
            <Clock className="w-4 h-4" />
            <span>Tiempo promedio total: {guide.estimatedTime}</span>
          </div>
        </div>

        {/* Roadmap Steps */}
        {/*
          An ordered list, not a set of buttons. These are four phases in a
          fixed order, and the order is the information — but the interface
          used to mark phase two as the current one on every load, for
          everyone, because `activeRoadmapStep` started at 2. Tapping a card
          moved the highlight, which meant nothing: the application does not
          know where anyone is in their process. A marker that cannot be true
          is worse than no marker.
        */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roadmapSteps.map((step) => (
            <li
              key={step.num}
              id={`roadmap-step-${step.num}`}
              className="p-4 rounded-2xl border bg-surface dark:bg-slate-900 border-outline-variant/30 dark:border-slate-800"
            >
              <span
                className="w-8 h-8 mb-2 rounded-full flex items-center justify-center font-bold text-xs bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 tabular-nums"
                aria-hidden="true"
              >
                0{step.num}
              </span>
              <h4 className="font-bold text-sm text-primary dark:text-sky-300">
                <span className="sr-only">Fase {step.num}: </span>
                {step.title}
              </h4>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 leading-relaxed">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Visas Section & Cost of Living */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Visas Cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-headline-md text-2xl font-bold text-primary dark:text-sky-300">
                Tipos de Visado en {guide.country}
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                {t(
                  "guia.visaTypesIntro",
                  "Explora estudios, cursos de idiomas, trabajo express, nómadas y residencia."
                )}
              </p>
            </div>
            <button
              onClick={() => onAskAIAboutGuide(guide.country)}
              aria-label="Preguntar a IA cuál me conviene"
              className="text-xs font-bold bg-secondary/10 dark:bg-teal-950/50 text-secondary dark:text-teal-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-secondary hover:text-white transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>{t("guia.askAIWhich", "Preguntar a IA cuál me conviene")}</span>
            </button>
          </div>

          {/*
            Where the vote counts came from. A denied read used to be swallowed
            by a catch and replaced with an invented 18 per visa, so a broken
            collection and a working one looked identical (#79, #24).
          */}
          <div role="status" aria-live="polite" className="empty:hidden">
            {votesStatus === "failed" && (
              <p
                id="visa-votes-failed-status"
                className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {t(
                  "guia.votesUnavailable",
                  "No pudimos cargar cuántas personas marcaron estas guías como útiles."
                )}
              </p>
            )}
            {voteError && (
              <p
                id="visa-vote-error"
                className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {voteError}
              </p>
            )}
          </div>

          {/* Visa Category Filter Chips */}
          {availableCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => setSelectedCategory("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedCategory === "todos"
                    ? "bg-primary dark:bg-sky-600 text-white shadow-sm"
                    : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container"
                }`}
              >
                Todas ({guide.visas.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary dark:bg-sky-600 text-white shadow-sm"
                      : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {filteredVisas.map((visa) => (
              <div
                key={visa.id}
                className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-3xl border border-outline-variant/40 dark:border-slate-700 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                        {visa.name}
                      </h4>
                      {visa.category && (
                        <span className="bg-primary/10 text-primary dark:text-sky-300 dark:bg-sky-950/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                          {visa.category}
                        </span>
                      )}
                      {visa.tag && (
                        <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                          {visa.tag}
                        </span>
                      )}
                    </div>

                    {visa.workPermitHours && (
                      <p className="text-xs font-semibold text-secondary dark:text-teal-300 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Permiso laboral: {visa.workPermitHours}</span>
                      </p>
                    )}
                  </div>

                  <span className="text-xs text-on-surface-variant dark:text-slate-300 font-semibold bg-surface dark:bg-slate-900 px-3 py-1 rounded-xl border border-outline-variant/30 dark:border-slate-800">
                    ⏱️ {visa.duration}
                  </span>
                </div>

                <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
                  {visa.description}
                </p>

                {visa.officialSourceUrl ? (
                  <a
                    id={`visa-official-source-${visa.id}`}
                    href={visa.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary/10 dark:bg-sky-900/40 px-4 py-2 text-xs font-bold text-primary dark:text-sky-300 hover:bg-primary hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {visa.officialSourceLabel || "Portal oficial"}
                      <span className="sr-only">
                        {" "}
                        de la visa {visa.name} (se abre en otra pestaña)
                      </span>
                    </span>
                  </a>
                ) : (
                  // Visible rather than silent: a guide that claims official
                  // sources has to say when one is missing.
                  <p
                    id={`visa-missing-source-${visa.id}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {t("guia.noOfficialLink", "Todavía no tenemos el enlace oficial de esta visa.")}
                  </p>
                )}

                {/* Funds, requirements and actions: the bulk of the card. */}
                <Disclosure
                  id={`visa-details-${visa.id}`}
                  label={t("guia.showVisaDetails", "Ver requisitos y trámites")}
                  labelWhenOpen={t("guia.hideVisaDetails", "Ocultar requisitos y trámites")}
                >
                  {/* Key Facts: Cost & Funds */}
                  {(visa.estimatedCostOfVisa || visa.proofOfFundsRequired) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface/80 dark:bg-slate-900/60 p-3.5 rounded-2xl text-xs border border-outline-variant/20 dark:border-slate-800">
                      {visa.proofOfFundsRequired && (
                        <div className="space-y-0.5">
                          <span className="text-on-surface-variant dark:text-slate-400 font-medium">
                            💰 Fondos Mínimos Exigidos:
                          </span>
                          <p className="font-bold text-primary dark:text-sky-300">
                            {visa.proofOfFundsRequired}
                          </p>
                        </div>
                      )}
                      {visa.estimatedCostOfVisa && (
                        <div className="space-y-0.5">
                          <span className="text-on-surface-variant dark:text-slate-400 font-medium">
                            🏷️ Tasa Oficial del Trámite:
                          </span>
                          <p className="font-bold text-on-surface dark:text-slate-200">
                            {visa.estimatedCostOfVisa}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Key Requirements List */}
                  <div className="space-y-2 bg-surface dark:bg-slate-900 p-4 rounded-2xl border border-outline-variant/20 dark:border-slate-800">
                    <span className="text-xs font-bold text-primary dark:text-sky-300 uppercase tracking-wider block">
                      {t("guia.requirements", "Requisitos Indispensables")}
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant dark:text-slate-300">
                      {visa.keyRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons: Official Source, DB Votes, Calendar & AI */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Community Upvotes */}
                      <button
                        onClick={() => handleVoteVisa(visa.id)}
                        disabled={userVotedVisas[visa.id]}
                        id={`visa-vote-${visa.id}`}
                        title={
                          currentUser
                            ? t("guia.voteTitle", "Marcar esta información como útil")
                            : t("guia.voteSignIn", "Inicia sesión para marcar esta guía como útil")
                        }
                        className={`inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          userVotedVisas[visa.id]
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-surface hover:bg-surface-container text-on-surface-variant dark:bg-slate-900 dark:text-slate-300 border-outline-variant/40 dark:border-slate-800"
                        }`}
                      >
                        <ThumbsUp
                          className={`w-3.5 h-3.5 ${userVotedVisas[visa.id] ? "fill-current" : ""}`}
                        />
                        {/*
                          A count is shown only when one was read. No vote yet
                          is "sé el primero", not a number — the control used to
                          print 18 for every visa in the product.
                        */}
                        <span>
                          {votesStatus === "loaded" && visaVotes[visa.id]
                            ? `${visaVotes[visa.id].helpfulVotes} ${t("guia.voteCount", "útiles")}`
                            : votesStatus === "loaded"
                              ? t("guia.voteFirst", "Sé el primero en marcarla útil")
                              : t("guia.voteUseful", "Marcar como útil")}
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Calendar Agenda Button */}
                      <CalendarAgendaButton
                        variant="compact"
                        label="Agendar Cita"
                        event={{
                          title: `Cita / Trámite Visa: ${visa.name} (${guide.country})`,
                          details: `Recordatorio de cita y entrega de expediente para la visa ${visa.name} en ${guide.country}.\n\nRequisitos clave: \n- ${visa.keyRequirements.join("\n- ")}\n\nFondos requeridos: ${visa.proofOfFundsRequired || "N/A"}\nPortal oficial: ${visa.officialSourceUrl || "LatinoMigra"}`,
                          location: `Consulado / Centro de Visas de ${guide.country}`,
                        }}
                      />

                      <button
                        onClick={() => onAskAIAboutGuide(guide.country, visa.name)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 hover:bg-primary hover:text-white px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>{t("guia.askAI", "Consultar con IA")}</span>
                      </button>
                    </div>
                  </div>
                </Disclosure>
              </div>
            ))}
          </div>
        </div>

        {/* Right Cost of Living Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-3xl border border-outline-variant/40 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                  {t("guia.costTitle", "Costo de Vida Estimado")}
                </h3>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">
              {t("guia.costsIntro", "Promedio estimado para un estudiante o profesional en")}{" "}
              {guide.country}.
            </p>

            <div className="space-y-4 pt-2">
              {guide.costs.map((cost, idx) => {
                /*
                  Two lines, not one. The first is what the destination
                  actually charges: rent in Berlin is quoted in euros and
                  paying it in lempiras is not a thing. The second is the same
                  range in the currency the visitor chose, marked as an
                  approximation — presenting a conversion as the price would
                  be quoting a number nobody published.
                */
                const local = formatCostRange(cost.min, cost.max, cost.currency);
                const converted = convertCostRange(cost.min, cost.max, cost.currency, currency);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex flex-wrap justify-between gap-x-3 text-xs font-semibold text-on-surface dark:text-slate-200">
                      <span>{cost.category}</span>
                      <span className="font-bold text-primary dark:text-sky-300 whitespace-nowrap">
                        {local} / {cost.period}
                      </span>
                    </div>
                    {converted && (
                      <p className="text-[11px] text-on-surface-variant dark:text-slate-400 text-right">
                        ≈ {converted} / {cost.period}
                      </p>
                    )}
                    <div className="w-full bg-surface-container dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cost.color}`}
                        style={{ width: `${cost.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {guide.costs.some((cost) => cost.currency !== currency) && (
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400 pt-1">
                {t(
                  "guia.conversionNotice",
                  "La segunda cifra es una conversión aproximada a la moneda que elegiste, no un precio publicado. Cámbiala en Preferencias."
                )}
              </p>
            )}
          </div>

          {/* Community Tip Card */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-sky-950/40 dark:to-teal-950/40 p-6 rounded-3xl border border-primary/20 dark:border-sky-800 space-y-3">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t("guia.communityTip", "Consejo Real de la Comunidad")}</span>
            </div>
            <h4 className="font-bold text-sm text-primary dark:text-sky-300">
              {guide.communityTip.title}
            </h4>
            <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed italic">
              "{guide.communityTip.text}"
            </p>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant dark:text-slate-400 font-medium">
                — {guide.communityTip.author}
              </span>
              <button
                onClick={() => setActiveTab("comunidad")}
                className="text-secondary dark:text-teal-300 font-bold hover:underline flex items-center gap-1"
              >
                <span>{t("guia.openForum", "Ver Foro")}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Checklist Section */}
      <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-outline-variant/40 dark:border-slate-700 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-700 pb-4">
          <div>
            <h3 className="font-headline-md text-xl font-bold text-primary dark:text-sky-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Documentación Clave Requerida ({guide.country})</span>
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
              Marca las casillas conforme reúnas cada documento para tu cita consular o trámites de
              llegada.
            </p>
          </div>

          <button
            onClick={handleDownloadChecklist}
            id="download-checklist-btn"
            className="inline-flex items-center gap-2 bg-secondary dark:bg-teal-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-secondary-container transition-colors shadow-sm self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>{t("guia.downloadChecklist", "Descargar Checklist (.txt)")}</span>
          </button>
        </div>

        <Disclosure
          id="checklist-details"
          label={t("guia.showChecklist", "Ver la lista de documentos")}
          labelWhenOpen={t("guia.hideChecklist", "Ocultar la lista de documentos")}
        >
          {/* Interactive Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guide.documents.map((doc) => {
              const isChecked = docState[doc.id] ?? false;
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isChecked
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                      : "bg-surface dark:bg-slate-900 border-outline-variant/30 dark:border-slate-800 hover:border-outline-variant"
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-on-surface-variant dark:text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4
                      className={`font-bold text-sm ${
                        isChecked ? "line-through opacity-80" : "text-primary dark:text-sky-300"
                      }`}
                    >
                      {doc.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                      {doc.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Disclosure>
      </div>

      {/* Dynamic Country-Specific Anti-Scam Guide Section */}
      {COUNTRY_ANTI_SCAM_DATA[selectedCountryCode] && (
        <div className="bg-rose-500/5 dark:bg-rose-950/20 border-2 border-rose-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>
                  {t("guia.antiScamBadge", "Protocolo de Protección & Prevención de Fraudes")}
                </span>
              </div>
              <h3 className="font-headline-md text-xl md:text-2xl font-bold text-rose-950 dark:text-rose-200">
                Guía Anti-Estafas Oficial para {COUNTRY_ANTI_SCAM_DATA[selectedCountryCode].country}{" "}
                {COUNTRY_ANTI_SCAM_DATA[selectedCountryCode].flag}
              </h3>
              <p className="text-xs text-rose-900/80 dark:text-rose-300/80 max-w-2xl leading-relaxed">
                Estafas más frecuentes reportadas por migrantes y estudiantes en este país, cómo
                detectarlas y canales directos de denuncia oficial.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-xs space-y-1 self-start sm:self-auto">
              <div className="font-bold text-rose-900 dark:text-rose-200">
                🚨 Teléfono de Emergencia / Denuncia:
              </div>
              <div className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {COUNTRY_ANTI_SCAM_DATA[selectedCountryCode].emergencyPhone}
              </div>
              <a
                href={COUNTRY_ANTI_SCAM_DATA[selectedCountryCode].policeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-secondary dark:text-teal-400 hover:underline inline-flex items-center gap-1"
              >
                <span>{t("guia.policePortal", "Portal de Denuncias Telemáticas")}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <Disclosure
            id="antiscam-details"
            label={t("guia.showAntiScam", "Ver estafas frecuentes y cómo denunciar")}
            labelWhenOpen={t("guia.hideAntiScam", "Ocultar estafas frecuentes")}
          >
            {/* Housing & Rental Safety Advice */}
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-rose-200 dark:border-slate-800 text-xs space-y-1.5">
              <h4 className="font-bold text-primary dark:text-sky-300 flex items-center gap-2">
                <Building className="w-4 h-4 text-secondary" />
                <span>
                  Reglas de Oro para Alquiler Seguro en{" "}
                  {COUNTRY_ANTI_SCAM_DATA[selectedCountryCode].country}:
                </span>
              </h4>
              <p className="text-on-surface-variant dark:text-slate-300 leading-relaxed">
                {COUNTRY_ANTI_SCAM_DATA[selectedCountryCode].officialRentalPortalInfo}
              </p>
            </div>

            {/* Common Scams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COUNTRY_ANTI_SCAM_DATA[selectedCountryCode].keyScamAlerts.map((scam, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 space-y-3 shadow-xs"
                >
                  <div className="font-bold text-sm text-rose-950 dark:text-rose-200 flex items-start gap-2">
                    <span className="text-rose-600 font-black">⚠️</span>
                    <span>{scam.scamType}</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-on-surface dark:text-slate-200">
                      {t("guia.warningSign", "Señal de Alerta:")}
                    </div>
                    <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed italic">
                      "{scam.warningSign}"
                    </p>
                  </div>

                  <div className="space-y-1 text-xs pt-1 border-t border-rose-100 dark:border-slate-800">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t("guia.howToProtect", "Cómo Protegerte:")}</span>
                    </div>
                    <p className="text-on-surface dark:text-slate-300 leading-relaxed font-medium">
                      {scam.howToProtect}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-on-surface-variant dark:text-slate-400 flex items-center gap-1.5 pt-1">
              <span>Organismo oficial de defensa al consumidor: </span>
              <strong className="text-primary dark:text-sky-300">
                {COUNTRY_ANTI_SCAM_DATA[selectedCountryCode].officialConsumerProtectionAgency}
              </strong>
            </div>
          </Disclosure>
        </div>
      )}
    </div>
  );
};
