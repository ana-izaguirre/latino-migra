import React from "react";
import { Home, GraduationCap, BookOpen, Sparkles, Menu } from "lucide-react";
import { NavigationTab } from "../types";
import { useLanguage } from "../lib/i18n";

interface MobileBottomNavProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenMenu: () => void;
}

/**
 * Primary navigation for touch layouts.
 *
 * Before this existed, every screen change on a phone cost three taps
 * (hamburger → scroll the drawer → item). The five destinations below cover
 * the most used journeys; everything else stays one tap away behind "Menú".
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
}) => {
  const { language } = useLanguage();
  const es = language !== "en";

  const items: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: es ? "Inicio" : "Home", icon: <Home className="w-5 h-5" /> },
    { id: "becas", label: es ? "Becas" : "Grants", icon: <GraduationCap className="w-5 h-5" /> },
    { id: "guia", label: es ? "Guías" : "Guides", icon: <BookOpen className="w-5 h-5" /> },
    { id: "chat", label: es ? "Chat IA" : "AI Chat", icon: <Sparkles className="w-5 h-5" /> },
  ];

  const handleNavigate = (tab: NavigationTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label={es ? "Navegación principal" : "Primary navigation"}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest dark:bg-slate-900 border-t border-outline-variant/40 dark:border-slate-800 pb-[var(--safe-bottom)] px-[var(--safe-left)] shadow-[0_-2px_12px_-4px_rgba(0,0,0,0.15)]"
    >
      <ul className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => handleNavigate(item.id)}
                id={`bottom-nav-${item.id}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={`relative w-full h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 ${
                  isActive
                    ? "text-primary dark:text-sky-300"
                    : "text-on-surface-variant dark:text-slate-400"
                }`}
              >
                <span className={isActive ? "scale-110 transition-transform" : "transition-transform"}>
                  {item.icon}
                </span>
                <span className={`text-[10px] leading-none ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-8 bg-secondary dark:bg-teal-400 rounded-full" />
                )}
              </button>
            </li>
          );
        })}

        <li className="flex-1">
          <button
            onClick={onOpenMenu}
            id="bottom-nav-menu"
            aria-label={es ? "Abrir menú completo" : "Open full menu"}
            className="w-full h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant dark:text-slate-400 transition-colors active:scale-95"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] leading-none font-medium">{es ? "Menú" : "Menu"}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};
