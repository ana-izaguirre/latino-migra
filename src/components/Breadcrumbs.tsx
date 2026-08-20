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
  const { t } = useLanguage();

  if (activeTab === "home") return null;

  // The label pairs used to live here as an inline English/Spanish ternary.
  // They are dictionary keys now, so this component holds no copy of its own.
  const currentLabel = t(`breadcrumb.${activeTab}`, activeTab);

  return (
    <nav
      aria-label={t("breadcrumb.aria")}
      className={`flex items-center gap-1.5 text-xs text-on-surface-variant/80 dark:text-slate-400 overflow-x-auto no-scrollbar max-w-full whitespace-nowrap ${className}`}
    >
      {/* Home link */}
      <button
        onClick={() => {
          setActiveTab("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="inline-flex items-center gap-1 min-h-[44px] py-2 hover:text-primary dark:hover:text-sky-300 font-medium transition-colors cursor-pointer shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>{t("breadcrumb.home")}</span>
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
            className="min-h-[44px] py-2 hover:text-primary dark:hover:text-sky-300 font-medium transition-colors cursor-pointer shrink-0 truncate max-w-[150px] sm:max-w-none"
          >
            {currentLabel}
          </button>
          <ChevronRight className="w-3 h-3 text-outline-variant/70 dark:text-slate-600 shrink-0" />
          <span className="font-bold text-primary dark:text-sky-300 shrink-0 truncate max-w-[200px] sm:max-w-none">
            {subPageTitle}
          </span>
        </>
      ) : (
        <span className="font-bold text-primary dark:text-sky-300 shrink-0">{currentLabel}</span>
      )}
    </nav>
  );
};
