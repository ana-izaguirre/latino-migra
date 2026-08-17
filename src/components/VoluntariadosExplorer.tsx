import React, { useState } from "react";
import {
  HeartHandshake,
  AlertTriangle,
  Globe2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Bot,
  Sparkles,
  Search,
  Filter,
  Info,
  Layers,
  MapPin,
  Clock
} from "lucide-react";
import { NavigationTab, GoogleUser } from "../types";
import { Breadcrumbs } from "./Breadcrumbs";
import { VOLUNTEERING_PROGRAMS_DATA, VolunteeringProgram } from "../data/volunteeringData";
import { useLanguage } from "../lib/i18n";
import { CalendarAgendaButton } from "./CalendarAgendaButton";

interface VoluntariadosExplorerProps {
  setActiveTab: (tab: NavigationTab) => void;
  onAskAIWithCustomPrompt: (prompt: string) => void;
  currentUser?: GoogleUser | null;
}

export const VoluntariadosExplorer: React.FC<VoluntariadosExplorerProps> = ({
  setActiveTab,
  onAskAIWithCustomPrompt,
  currentUser,
}) => {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<VolunteeringProgram | null>(null);

  const categories = [
    "Todos",
    "Voluntariado",
    "Intercambio Cultural",
    "Work & Travel / Working Holiday",
    "Asistente de Idioma",
    "Au Pair"
  ];

  const filteredPrograms = VOLUNTEERING_PROGRAMS_DATA.filter((prog) => {
    const matchesCategory = selectedCategory === "Todos" || prog.category === selectedCategory;
    const matchesSearch =
      prog.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      prog.country.toLowerCase().includes(searchFilter.toLowerCase()) ||
      prog.organization.toLowerCase().includes(searchFilter.toLowerCase()) ||
      prog.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAskAI = (prog: VolunteeringProgram) => {
    const prompt = `Hola LatinoMigra IA, me interesa el programa de voluntariado/intercambio "${prog.title}" en ${prog.country} (${prog.organization}).
Soporte financiero: ${prog.financialSupport}.
Tipo de visado: ${prog.visaType}.
Sé que este programa NO es para migrar de forma permanente, pero me gustaría saber:
1. ¿Cómo postular paso a paso con éxito?
2. ¿Qué requisitos de idioma o seguro médico necesito?
3. ¿Cómo aprovechar esta experiencia cultural para hacer contactos en el país?`;
    onAskAIWithCustomPrompt(prompt);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 animate-fade-in">
      {/* Breadcrumbs */}
      <Breadcrumbs activeTab="voluntariados" setActiveTab={setActiveTab} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-sky-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-teal-200">
            <HeartHandshake className="w-4 h-4 text-amber-300" />
            <span>Experiencias Internacionales de Intercambio & Voluntariado</span>
          </div>

          <h1 className="font-headline-lg text-3xl md:text-5xl font-extrabold leading-tight">
            Voluntariados, Au Pair e Intercambios Culturales
          </h1>

          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            Descubre programas para viajar, practicar idiomas, hacer voluntariado comunitario o trabajar temporalmente con alojamiento y comidas cubiertas.
          </p>
        </div>
      </div>

      {/* CRITICAL MIGRATION DISCLAIMER BOX */}
      <div className="p-5 md:p-6 bg-amber-500/10 dark:bg-amber-950/40 rounded-3xl border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 space-y-2.5 shadow-sm">
        <div className="flex items-center gap-3 font-bold text-sm md:text-base text-amber-900 dark:text-amber-300">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{t("vol.disclaimerTitle", "Aviso Importante: Voluntariados e Intercambios NO son Vías de Migración Permanente")}</span>
        </div>
        <p className="text-xs md:text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed pl-9">
          {t(
            "vol.disclaimerText",
            "Estas experiencias son ideales para enriquecimiento cultural, mejorar idiomas, hacer contactos y conocer un país por periodos cortos o medianos (de 2 meses a 1 año). No otorgan residencia permanente ni permiso de trabajo formal ordinario. Si tu meta es emigrar y radicarte a largo plazo, te recomendamos consultar el Planificador 360° o la Guía de Visados de Estudio y Trabajo."
          )}
        </p>
        <div className="pl-9 pt-1">
          <button
            onClick={() => setActiveTab("planificador")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 hover:underline"
          >
            <span>👉 Ir al Planificador de Migración a Largo Plazo</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar por programa, país u organización..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-xs text-on-surface dark:text-slate-100 outline-none focus:border-secondary"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-secondary text-white shadow-sm"
                      : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700 hover:bg-surface-container"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((prog) => (
          <div
            key={prog.id}
            className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-outline-variant/40 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={prog.imageUrl}
                  alt={prog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                  {prog.category}
                </div>
                <div className="absolute bottom-3 right-3 bg-secondary/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {prog.duration}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="text-[11px] font-bold text-secondary dark:text-teal-400 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>{prog.country} • {prog.organization}</span>
                </div>

                <h3 className="font-bold text-base text-primary dark:text-sky-300 leading-snug line-clamp-2">
                  {prog.title}
                </h3>

                <p className="text-xs text-on-surface-variant dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {prog.description}
                </p>

                <div className="p-3 bg-surface dark:bg-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="font-semibold text-primary dark:text-sky-200 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Soporte: {prog.financialSupport}</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
                    Visa requerida: {prog.visaType}
                  </div>
                </div>

                {/* Important notice badge */}
                <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-tight">
                  {prog.importantDisclaimer}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-outline-variant/20 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setSelectedProgram(prog)}
                className="btn-tactile text-xs font-bold text-secondary dark:text-teal-400 hover:underline cursor-pointer py-1 px-1.5 rounded-lg"
              >
                Ver Requisitos
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAskAI(prog)}
                  className="btn-tactile inline-flex items-center gap-1 bg-primary/10 dark:bg-sky-950/60 text-primary dark:text-sky-300 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-xs"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Consultar IA</span>
                </button>

                <a
                  href={prog.link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-tactile inline-flex items-center gap-1 bg-secondary text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Sitio</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Full Program Requirements */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest dark:bg-slate-900 max-w-2xl w-full rounded-3xl p-6 md:p-8 border border-outline-variant/40 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  {selectedProgram.category} • {selectedProgram.country}
                </span>
                <h2 className="font-headline-md text-xl md:text-2xl font-bold text-primary dark:text-sky-300">
                  {selectedProgram.title}
                </h2>
                <div className="text-xs text-on-surface-variant dark:text-slate-400">
                  Organizado por: <strong>{selectedProgram.organization}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProgram(null)}
                aria-label="Cerrar modal"
                className="btn-tactile p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-amber-500/10 dark:bg-amber-950/40 rounded-2xl border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              {selectedProgram.importantDisclaimer}
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-primary dark:text-sky-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Requisitos de Admisión</span>
              </h4>
              <ul className="space-y-2 text-xs text-on-surface-variant dark:text-slate-300">
                {selectedProgram.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-primary dark:text-sky-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Beneficios y Coberturas</span>
              </h4>
              <ul className="space-y-2 text-xs text-on-surface-variant dark:text-slate-300">
                {selectedProgram.benefits.map((ben, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">✓</span>
                    <span>{ben}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedProgram(null)}
                className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant dark:text-slate-400 hover:bg-surface-container transition-all"
              >
                Cerrar
              </button>
              <a
                href={selectedProgram.link}
                target="_blank"
                rel="noreferrer"
                className="btn-tactile inline-flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all shadow-md"
              >
                <span>Ir al Portal Oficial</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
