import React, { useState } from "react";
import {
  Compass,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  DollarSign,
  Download,
  Bot,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building,
  UserCheck,
  Calendar as CalendarIcon
} from "lucide-react";
import { NavigationTab } from "../types";
import { MIGRATION_GUIDES_DATA } from "../data/migrationGuides";
import { generateGoogleCalendarUrl } from "../lib/googleCalendar";

interface GuiaMigracionProps {
  setActiveTab: (tab: NavigationTab) => void;
  onAskAIAboutGuide: (countryName: string, visaName?: string) => void;
}

export const GuiaMigracion: React.FC<GuiaMigracionProps> = ({
  setActiveTab,
  onAskAIAboutGuide,
}) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("ES");
  const [activeRoadmapStep, setActiveRoadmapStep] = useState<number>(2);

  const guide = MIGRATION_GUIDES_DATA[selectedCountryCode] || MIGRATION_GUIDES_DATA["ES"];
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
      `CHECKLIST MIGRATORIO - ${guide.country.toUpperCase()}`,
      `Fecha: ${new Date().toLocaleDateString()}`,
      `-----------------------------------------`,
      ...guide.documents.map(
        (doc) => `[${docState[doc.id] ? "X" : " "}] ${doc.title}: ${doc.subtitle}`
      ),
      `-----------------------------------------`,
      `Generado por LatinoMigra (https://latinomigra.org)`
    ];

    const blob = new Blob([textLines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Checklist-Migracion-${guide.country}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const roadmapSteps = [
    { num: 1, title: "Decisión y Búsqueda", desc: "Programa académico o laboral" },
    { num: 2, title: "Selección de Visa", desc: "Tipo de visado según permanencia" },
    { num: 3, title: "Documentación Consular", desc: "Apostillas, seguros y fondos" },
    { num: 4, title: "Llegada y Empadronamiento", desc: "Cita TIE, NIE y banco local" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      {/* Country Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-3xl border border-outline-variant/40 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Guías Oficiales Paso a Paso</span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
            {guide.country}: Tu Nuevo Comienzo
          </h1>
        </div>

        {/* Country Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.values(MIGRATION_GUIDES_DATA).map((item) => {
            const isSelected = item.id === selectedCountryCode;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedCountryCode(item.id);
                  const newDocs: Record<string, boolean> = {};
                  item.documents.forEach((d) => (newDocs[d.id] = d.completed));
                  setDocState(newDocs);
                }}
                id={`guide-country-${item.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-primary dark:bg-sky-600 text-white shadow-md"
                    : "bg-surface dark:bg-slate-700 text-on-surface dark:text-slate-200 hover:bg-surface-container"
                }`}
              >
                <span>{item.flag}</span>
                <span>{item.country}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Roadmap & Time Banner */}
      <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-outline-variant/40 dark:border-slate-700 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-700 pb-4">
          <h2 className="font-headline-md text-xl font-bold text-primary dark:text-sky-300">
            Ruta de Tramitación Migratoria
          </h2>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <Clock className="w-4 h-4" />
            <span>Tiempo estimado de trámite: {guide.estimatedTime}</span>
          </div>
        </div>

        {/* Roadmap Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roadmapSteps.map((step) => {
            const isActive = activeRoadmapStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => setActiveRoadmapStep(step.num)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  isActive
                    ? "bg-primary/10 dark:bg-sky-900/40 border-primary dark:border-sky-400 shadow-sm"
                    : "bg-surface dark:bg-slate-900 border-outline-variant/30 dark:border-slate-800 hover:border-outline-variant"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isActive
                        ? "bg-primary dark:bg-sky-500 text-white"
                        : "bg-surface-container dark:bg-slate-800 text-on-surface-variant"
                    }`}
                  >
                    0{step.num}
                  </span>
                  {isActive && <Sparkles className="w-4 h-4 text-primary dark:text-sky-400" />}
                </div>
                <h4 className="font-bold text-sm text-primary dark:text-sky-300">{step.title}</h4>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">{step.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visas Section & Cost of Living */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Visas Cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-2xl font-bold text-primary dark:text-sky-300">
              Tipos de Visado en {guide.country}
            </h3>
            <button
              onClick={() => onAskAIAboutGuide(guide.country)}
              className="text-xs font-bold text-secondary dark:text-teal-300 flex items-center gap-1 hover:underline"
            >
              <Bot className="w-4 h-4" />
              <span>Preguntar a IA cuál me conviene</span>
            </button>
          </div>

          <div className="space-y-4">
            {guide.visas.map((visa) => (
              <div
                key={visa.id}
                className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                      {visa.name}
                    </h4>
                    {visa.tag && (
                      <span className="bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {visa.tag}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant dark:text-slate-400 font-semibold bg-surface dark:bg-slate-900 px-3 py-1 rounded-lg">
                    Vigencia: {visa.duration}
                  </span>
                </div>

                <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
                  {visa.description}
                </p>

                <div className="space-y-2 bg-surface dark:bg-slate-900 p-4 rounded-xl">
                  <span className="text-xs font-bold text-primary dark:text-sky-300 uppercase tracking-wider block">
                    Requisitos Indispensables
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant dark:text-slate-300">
                    {visa.keyRequirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
                  <a
                    href={generateGoogleCalendarUrl({
                      title: `Cita / Entrega Expediente: ${visa.name} (${guide.country})`,
                      details: `Recordatorio de cita consular y presentación de documentos para la visa ${visa.name} en ${guide.country}. Requisitos: ${visa.keyRequirements.join(", ")}`,
                      location: `Consulado de ${guide.country}`,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg transition-colors"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Agendar Cita en Google Calendar</span>
                  </a>

                  <button
                    onClick={() => onAskAIAboutGuide(guide.country, visa.name)}
                    className="inline-flex items-center gap-2 text-xs font-bold bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 hover:bg-primary hover:text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Verificar mi perfil para {visa.name}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Cost of Living Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                Estimado Costo de Vida
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400">
              Promedio mensual aproximado para un estudiante o profesional en {guide.country}.
            </p>

            <div className="space-y-4 pt-2">
              {guide.costs.map((cost, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-on-surface dark:text-slate-200">
                    <span>{cost.category}</span>
                    <span className="font-bold text-primary dark:text-sky-300">{cost.range}</span>
                  </div>
                  <div className="w-full bg-surface-container dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cost.color}`}
                      style={{ width: `${cost.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Tip Card */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-sky-950/40 dark:to-teal-950/40 p-6 rounded-2xl border border-primary/20 dark:border-sky-800 space-y-3">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Consejo de la Comunidad</span>
            </div>
            <h4 className="font-bold text-sm text-primary dark:text-sky-300">{guide.communityTip.title}</h4>
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
                <span>Ver Foro</span>
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
              <span>Documentación Clave Requerida</span>
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
              Haz clic en la casilla cuando tengas el documento listo para tu expediente consular.
            </p>
          </div>

          <button
            onClick={handleDownloadChecklist}
            id="download-checklist-btn"
            className="inline-flex items-center gap-2 bg-secondary dark:bg-teal-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-secondary-container transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Checklist (.txt)</span>
          </button>
        </div>

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
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">{doc.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
