import React, { useState, useEffect } from "react";
import {
  Globe,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  MapPin,
  ShieldCheck,
  LogOut,
  Languages,
  Bell,
  Sparkles,
  ChevronRight,
  Compass,
  Calculator,
  GraduationCap,
  HeartHandshake,
  BookOpen,
  Users,
  MessageSquarePlus,
  MessageSquare,
  Database
} from "lucide-react";
import { NavigationTab, ThemeMode, GoogleUser } from "../types";
import { useLanguage } from "../lib/i18n";
import { useCurrency } from "../lib/CurrencyContext";
import { getSafeImageUrl } from "../lib/sanitize";

interface TopNavBarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentUser: GoogleUser | null;
  onOpenAuthModal: () => void;
  onOpenAlertsModal?: () => void;
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
  onOpenAlertsModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [langToast, setLangToast] = useState<string | null>(null);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const allNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: "planificador", label: t("nav.planificador", "Planificador 360°"), icon: <Compass className="w-4 h-4 text-emerald-500" /> },
    { id: "calculadora", label: t("nav.calculadora", "Calculadora Costo de Vida"), icon: <Calculator className="w-4 h-4 text-teal-500" /> },
    { id: "becas", label: t("nav.becas", "Becas"), icon: <GraduationCap className="w-4 h-4 text-sky-500" /> },
    { id: "voluntariados", label: t("nav.voluntariados", "Voluntariados"), icon: <HeartHandshake className="w-4 h-4 text-rose-500" /> },
    { id: "guia", label: t("nav.guia", "Guía de Migración"), icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
    { id: "mapa", label: t("nav.mapa", "Mapa Consular"), icon: <MapPin className="w-4 h-4 text-indigo-500" /> },
    { id: "comunidad", label: t("nav.comunidad", "Comunidad"), icon: <Users className="w-4 h-4 text-amber-500" /> },
    { id: "feedback", label: t("nav.feedback", "Sugerencias"), icon: <MessageSquarePlus className="w-4 h-4 text-pink-500" /> },
    { id: "chat", label: t("nav.chat", "Chat IA"), icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
    { id: "admin", label: t("nav.admin", "Panel Admin"), icon: <Database className="w-4 h-4 text-violet-500" />, adminOnly: true },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || currentUser?.role === "admin");

  const toggleLanguage = () => {
    const newLang = language === "es" ? "en" : "es";
    setLanguage(newLang);
    setLangToast(newLang === "es" ? "Idioma cambiado a Español 🇪🇸" : "Language switched to English 🇺🇸");
    setTimeout(() => setLangToast(null), 2200);
  };

  const handleNavClick = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="bg-surface-container-lowest dark:bg-slate-900 w-full top-0 sticky shadow-sm z-50 transition-colors border-b border-outline-variant/30 dark:border-slate-800">
      {/* Visual Feedback Toast for Language switch */}
      {langToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-slate-100/95 text-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-white/20 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none flex items-center gap-2">
          <Languages className="w-4 h-4 text-secondary dark:text-teal-600" />
          <span>{langToast}</span>
        </div>
      )}

      <div className="flex justify-between items-center px-4 md:px-8 py-3 max-w-7xl mx-auto">
        {/* Left Side: Mobile Hamburger & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {/* Mobile Hamburger Menu Button (Positioned at the Left as requested) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            className="lg:hidden p-2 -ml-1 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-primary dark:text-sky-300" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer active:scale-95 transition-transform"
            id="nav-logo-button"
            aria-label="LatinoMigra Inicio"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-sky-500/20 flex items-center justify-center text-primary dark:text-sky-400 group-hover:scale-105 transition-transform shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="font-headline-md text-2xl font-bold text-primary dark:text-sky-300 tracking-tight block leading-none">
                LatinoMigra
              </span>
              <span className="text-[10px] text-on-surface-variant/80 dark:text-slate-400 font-medium hidden sm:inline">
                {language === "en" ? "Latin America Migration Platform" : "Migración & Becas Oficiales"}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 pl-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  id={`nav-item-${item.id}`}
                  aria-label={item.id === "guia" ? "Guía de Migración" : item.label}
                  className={`font-body-md text-xs xl:text-sm font-medium transition-all py-1.5 px-2.5 rounded-lg relative flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 select-none ${
                    isActive
                      ? "text-primary dark:text-sky-300 font-bold bg-primary/10 dark:bg-sky-950/40"
                      : "text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-sky-300 hover:bg-surface-container dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="scale-90">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-secondary dark:bg-teal-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
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

          {/* Notification Alerts Center Button */}
          {onOpenAlertsModal && (
            <button
              onClick={onOpenAlertsModal}
              id="alerts-center-btn"
              title={language === "en" ? "Configure Alerts & Notifications" : "Configurar Alertas y Avisos"}
              className="relative p-2 rounded-xl text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-90 active:bg-amber-100 dark:active:bg-amber-950/50"
              aria-label="Alertas y Notificaciones"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-amber-500 dark:text-amber-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            </button>
          )}

          {/* Currency Switcher Dropdown */}
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              id="currency-select-nav"
              aria-label="Seleccionar moneda"
              className="px-2 py-1.5 rounded-xl text-xs font-bold bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-on-surface dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-750 transition-all cursor-pointer shadow-xs outline-none focus:ring-1 focus:ring-secondary"
            >
              {availableCurrencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Language Switcher Button (ES / EN) */}
          <button
            onClick={toggleLanguage}
            id="lang-toggle-btn"
            title={language === "es" ? "Cambiar a Inglés / Switch to English" : "Cambiar a Español / Switch to Spanish"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-on-surface dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-750 transition-all cursor-pointer shadow-xs active:scale-95 active:bg-secondary/20"
            aria-label="Cambiar Idioma"
          >
            <Languages className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
            <span className="font-mono">{language === "es" ? "🇪🇸 ES" : "🇺🇸 EN"}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            title={theme === "light" ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
            className="p-2 rounded-xl text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-90 active:rotate-12"
            aria-label="Cambiar tema visual"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 md:w-5 md:h-5 text-slate-700 hover:text-primary transition-colors" />
            ) : (
              <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-300 hover:text-amber-400 transition-colors" />
            )}
          </button>

          {/* Login / Profile Button */}
          <button
            onClick={onOpenAuthModal}
            id="login-profile-btn"
            aria-label={currentUser ? `Cuenta de ${currentUser.name}` : "Acceder con Google"}
            className="flex items-center gap-2 bg-primary dark:bg-sky-600 text-white px-3 md:px-3.5 py-2 rounded-xl font-label-md text-xs font-bold hover:bg-primary-container dark:hover:bg-sky-500 transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
          >
            {currentUser ? (
              <>
                <img
                  src={getSafeImageUrl(currentUser.avatar)}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover border border-white"
                />
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
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
                <span className="hidden sm:inline">{language === "en" ? "Sign In" : "Acceder con Google"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modern Mobile Hamburger Drawer & Backdrop Overlay (Opens smoothly from Left side) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-start">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer Panel (Left-aligned) */}
          <div className="relative w-full max-w-xs bg-surface-container-lowest dark:bg-slate-900 h-full shadow-2xl border-r border-outline-variant/30 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-outline-variant/30 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-400 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="font-headline-md text-lg font-bold text-primary dark:text-sky-300">
                  LatinoMigra
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800 active:scale-90 transition-all cursor-pointer"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body with Smooth Scrolling */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* User Profile Card if Logged In */}
              {currentUser ? (
                <div className="p-3 bg-secondary/10 dark:bg-teal-950/40 rounded-2xl border border-secondary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getSafeImageUrl(currentUser.avatar)}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white dark:border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-xs text-primary dark:text-teal-300 leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-on-surface-variant dark:text-slate-400">
                        {currentUser.countryOfOrigin || "América Latina"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onOpenAuthModal();
                      setMobileMenuOpen(false);
                    }}
                    className="text-[11px] font-bold text-secondary dark:text-teal-300 bg-surface dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-secondary/30 active:scale-95 transition-transform"
                  >
                    Ver Perfil
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuthModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-primary dark:bg-sky-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform"
                >
                  <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{language === "en" ? "Sign In with Google" : "Acceder con Google"}</span>
                </button>
              )}

              {/* Search Bar in Mobile Menu */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab !== "becas") setActiveTab("becas");
                  }}
                  placeholder={language === "en" ? "Search scholarships or visas..." : "Buscar becas o visas..."}
                  className="w-full pl-9 pr-4 py-2 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs text-on-surface dark:text-slate-100 outline-none focus:border-secondary"
                />
              </div>

              {/* Alert Center Trigger */}
              {onOpenAlertsModal && (
                <button
                  onClick={() => {
                    onOpenAlertsModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-bold active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>{language === "en" ? "Manage Alerts & Notices" : "Gestionar Alertas y Avisos"}</span>
                  </div>
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                </button>
              )}

              {/* Navigation Items List */}
              <div className="space-y-1 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 dark:text-slate-400 px-3 pb-1">
                  {language === "en" ? "Navigation" : "Módulos & Herramientas"}
                </div>
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                        isActive
                          ? "bg-primary/10 dark:bg-sky-950/50 text-primary dark:text-sky-300 font-bold border border-primary/20"
                          : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${isActive ? "text-primary dark:text-sky-300" : ""}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Controls (Currency, Language & Theme) */}
            <div className="p-4 border-t border-outline-variant/30 dark:border-slate-800 bg-surface dark:bg-slate-900/80 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant dark:text-slate-400 mb-1">
                  {language === "en" ? "Preferred Currency" : "Moneda Preferida"}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-xs font-bold text-on-surface dark:text-slate-200 outline-none"
                >
                  {availableCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={toggleLanguage}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-xs font-bold text-on-surface dark:text-slate-200 active:scale-95 transition-transform"
                >
                  <Languages className="w-4 h-4 text-secondary dark:text-teal-400" />
                  <span>{language === "es" ? "🇪🇸 Español" : "🇺🇸 English"}</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-xs font-bold text-on-surface dark:text-slate-200 active:scale-95 transition-transform"
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="w-4 h-4 text-slate-700" />
                      <span>Modo Oscuro</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 text-amber-300" />
                      <span>Modo Claro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

