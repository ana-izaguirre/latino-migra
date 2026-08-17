import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { NavigationTab } from "../types";
import { useLanguage } from "../lib/i18n";

interface BreadcrumbsProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  subPageTitle?: string;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  activeTab,
  setActiveTab,
  subPageTitle,
  className = "",
}) => {
  const { language, t } = useLanguage();

  if (activeTab === "home") return null;

  const tabLabels: Record<NavigationTab, { es: string; en: string }> = {
    home: { es: "Inicio", en: "Home" },
    planificador: { es: "Planificador 360°", en: "360° Planner" },
    calculadora: { es: "Calculadora de Costo de Vida", en: "Cost of Living Calculator" },
    becas: { es: "Catálogo de Becas", en: "Scholarship Directory" },
    voluntariados: { es: "Voluntariados e Intercambios", en: "Volunteering & Exchanges" },
    guia: { es: "Guía de Migración", en: "Migration Guide" },
    mapa: { es: "Mapa y Directorio Consular", en: "Consular Directory & Map" },
    comunidad: { es: "Comunidad y Experiencias", en: "Community & Forum" },
    feedback: { es: "Sugerencias y Mejoras", en: "Feedback & Roadmap" },
    chat: { es: "Asistente IA", en: "AI Assistant" },
    admin: { es: "Panel de Administración", en: "Admin Dashboard" },
  };

  const currentLabel =
    language === "en"
      ? tabLabels[activeTab]?.en || activeTab
      : tabLabels[activeTab]?.es || activeTab;

  return (
    <nav
      aria-label="Breadcrumbs"
      className={`flex items-center gap-1.5 text-xs text-on-surface-variant/80 dark:text-slate-400 py-2 overflow-x-auto max-w-full whitespace-nowrap scrollbar-none ${className}`}
    >
      {/* Home link */}
      <button
        onClick={() => {
          setActiveTab("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="inline-flex items-center gap-1 hover:text-primary dark:hover:text-sky-300 font-medium transition-colors cursor-pointer shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>{language === "en" ? "Home" : "Inicio"}</span>
      </button>

      <ChevronRight className="w-3 h-3 text-outline-variant/70 dark:text-slate-600 shrink-0" />

      {/* Active Tab link / item */}
      {subPageTitle ? (
        <>
          <button
            onClick={() => {
              setActiveTab(activeTab);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-primary dark:hover:text-sky-300 font-medium transition-colors cursor-pointer shrink-0 truncate max-w-[150px] sm:max-w-none"
          >
            {currentLabel}
          </button>
          <ChevronRight className="w-3 h-3 text-outline-variant/70 dark:text-slate-600 shrink-0" />
          <span className="font-bold text-primary dark:text-sky-300 shrink-0 truncate max-w-[200px] sm:max-w-none">
            {subPageTitle}
          </span>
        </>
      ) : (
        <span className="font-bold text-primary dark:text-sky-300 shrink-0">
          {currentLabel}
        </span>
      )}
    </nav>
  );
};
