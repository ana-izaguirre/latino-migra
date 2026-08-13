import React, { useState } from "react";
import { Globe, Search, Moon, Sun, Menu, X, User, MapPin, ShieldCheck, LogOut, Languages } from "lucide-react";
import { NavigationTab, ThemeMode, GoogleUser } from "../types";
import { useLanguage } from "../lib/i18n";

interface TopNavBarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentUser: GoogleUser | null;
  onOpenAuthModal: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  searchQuery,
  setSearchQuery,
  currentUser,
  onOpenAuthModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navItems: { id: NavigationTab; label: string; icon?: React.ReactNode }[] = [
    { id: "planificador", label: t("nav.planificador", "Planificador 360°") },
    { id: "calculadora", label: t("nav.calculadora", "Calculadora Costo de Vida") },
    { id: "becas", label: t("nav.becas", "Becas") },
    { id: "guia", label: t("nav.guia", "Guías de Migración") },
    { id: "mapa", label: t("nav.mapa", "Mapa Consular"), icon: <MapPin className="w-3.5 h-3.5 text-sky-400 inline ml-1" /> },
    { id: "comunidad", label: t("nav.comunidad", "Comunidad") },
    { id: "feedback", label: t("nav.feedback", "Sugerencias") },
    { id: "chat", label: t("nav.chat", "Asesor IA") },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es");
  };

  return (
    <nav className="bg-surface-container-lowest dark:bg-slate-900 w-full top-0 sticky shadow-sm z-50 transition-colors border-b border-outline-variant/30 dark:border-slate-800">
      <div className="flex justify-between items-center px-4 md:px-8 py-3.5 max-w-7xl mx-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
            id="nav-logo-button"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-sky-500/20 flex items-center justify-center text-primary dark:text-sky-400 group-hover:scale-105 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <span className="font-headline-md text-2xl font-bold text-primary dark:text-sky-300 tracking-tight">
              LatinoMigra
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5 pl-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-item-${item.id}`}
                  className={`font-body-md text-xs xl:text-sm font-medium transition-colors py-1 relative flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "text-primary dark:text-sky-300 font-bold"
                      : "text-on-surface-variant dark:text-slate-300 hover:text-secondary dark:hover:text-teal-400"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.icon}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary dark:bg-teal-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Greeting for Logged-in User */}
          {currentUser && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-secondary/10 dark:bg-teal-950/40 text-primary dark:text-teal-300 rounded-full text-xs font-semibold border border-secondary/20">
              <span>👋 ¡Hola, {currentUser.name.split(" ")[0]}!</span>
              {currentUser.countryOfOrigin && (
                <span className="text-[10px] bg-secondary/20 dark:bg-teal-800/60 px-1.5 py-0.5 rounded-full font-bold">
                  {currentUser.countryOfOrigin}
                </span>
              )}
            </div>
          )}

          {/* Quick Search Input */}
          <div className="relative hidden 2xl:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "becas") setActiveTab("becas");
              }}
              placeholder={language === "en" ? "Search scholarships or visas..." : "Buscar becas o visas..."}
              id="global-search-input"
              className="pl-9 pr-4 py-1.5 bg-surface dark:bg-slate-800 rounded-full border border-outline-variant/60 dark:border-slate-700 focus:border-secondary dark:focus:border-teal-400 focus:ring-1 focus:ring-secondary outline-none text-xs text-on-surface dark:text-slate-100 w-44 transition-all"
            />
          </div>

          {/* Language Switcher Button (ES / EN) */}
          <button
            onClick={toggleLanguage}
            id="lang-toggle-btn"
            title={language === "es" ? "Switch to English (for presentations / global demo)" : "Cambiar a Español"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-surface dark:bg-slate-800 border border-outline-variant/50 dark:border-slate-700 text-on-surface dark:text-slate-200 hover:bg-surface-container transition-all cursor-pointer shadow-xs"
          >
            <Languages className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
            <span>{language === "es" ? "🇪🇸 ES" : "🇺🇸 EN"}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            title={theme === "light" ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
            className="p-2 rounded-full text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === "light" ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-300" />}
          </button>

          {/* Login / Profile Button */}
          <button
            onClick={onOpenAuthModal}
            id="login-profile-btn"
            className="flex items-center gap-2 bg-primary dark:bg-sky-600 text-white px-3 md:px-3.5 py-2 rounded-xl font-label-md text-xs font-bold hover:bg-primary-container dark:hover:bg-sky-500 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            {currentUser ? (
              <>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-white"
                />
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{language === "en" ? "Sign In" : "Acceder"}</span>
              </>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
            className="lg:hidden p-2 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-lowest dark:bg-slate-900 border-b border-outline-variant/40 dark:border-slate-800 px-6 py-4 space-y-3">
          {currentUser && (
            <div className="p-3 bg-secondary/10 dark:bg-teal-950/40 rounded-xl mb-3 flex items-center justify-between text-xs">
              <span className="font-bold text-primary dark:text-teal-300">👋 ¡Hola, {currentUser.name}!</span>
              <span className="text-[11px] text-on-surface-variant dark:text-slate-400 font-semibold">{currentUser.countryOfOrigin}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between py-2 border-b border-outline-variant/30 dark:border-slate-800">
            <span className="text-xs font-semibold text-on-surface-variant dark:text-slate-400">Idioma / Language:</span>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-surface dark:bg-slate-800 border border-outline-variant"
            >
              <Languages className="w-3.5 h-3.5 text-secondary" />
              <span>{language === "es" ? "🇪🇸 Español" : "🇺🇸 English"}</span>
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "becas") setActiveTab("becas");
              }}
              placeholder={language === "en" ? "Search scholarships or visas..." : "Buscar becas o visas..."}
              className="w-full pl-9 pr-4 py-2 bg-surface dark:bg-slate-800 rounded-lg border border-outline-variant/60 dark:border-slate-700 text-sm"
            />
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 text-base font-medium ${
                activeTab === item.id
                  ? "text-primary dark:text-sky-300 font-bold"
                  : "text-on-surface-variant dark:text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => {
              onOpenAuthModal();
              setMobileMenuOpen(false);
            }}
            className="w-full mt-2 bg-primary dark:bg-sky-600 text-white py-2.5 rounded-lg text-center font-semibold text-sm"
          >
            {currentUser ? `Cuenta: ${currentUser.name}` : (language === "en" ? "Sign In with Google" : "Acceder con Google")}
          </button>
        </div>
      )}
    </nav>
  );
};

