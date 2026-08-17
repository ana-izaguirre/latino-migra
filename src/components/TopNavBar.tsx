import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
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
  Database,
  LayoutGrid,
  ChevronDown,
  Settings,
} from "lucide-react";
import { NavigationTab, ThemeMode, GoogleUser } from "../types";
import { useLanguage } from "../lib/i18n";
import { useCurrency } from "../lib/CurrencyContext";
import { getSafeImageUrl } from "../lib/sanitize";
import { isAdmin } from "../lib/authUtils";

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
  /** Drawer visibility is lifted so the mobile bottom bar can open it too. */
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
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
  mobileMenuOpen: controlledMenuOpen,
  setMobileMenuOpen: setControlledMenuOpen,
}) => {
  const [uncontrolledMenuOpen, setUncontrolledMenuOpen] = useState(false);
  const isControlled = controlledMenuOpen !== undefined && setControlledMenuOpen !== undefined;
  const mobileMenuOpen = isControlled ? controlledMenuOpen : uncontrolledMenuOpen;
  const setMobileMenuOpen = isControlled ? setControlledMenuOpen : setUncontrolledMenuOpen;
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [langToast, setLangToast] = useState<string | null>(null);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [prefsMenuOpen, setPrefsMenuOpen] = useState(false);
  const resetScrollOnCloseRef = useRef(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const prefsMenuRef = useRef<HTMLDivElement>(null);

  // Dismiss the desktop popover menus on outside click or Escape
  useEffect(() => {
    if (!toolsMenuOpen && !prefsMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(target)) {
        setToolsMenuOpen(false);
      }
      if (prefsMenuRef.current && !prefsMenuRef.current.contains(target)) {
        setPrefsMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setToolsMenuOpen(false);
        setPrefsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toolsMenuOpen, prefsMenuOpen]);

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

  // Prevent background scroll when mobile drawer is open. The scroll position
  // is restored on close so iOS does not jump the page back to the top.
  //
  // useLayoutEffect, not useEffect: the drawer is a full-screen fixed overlay,
  // and by the time a passive effect runs the browser has already painted it
  // and clamped the scroll position to 0 — so the position being saved was
  // always 0 and dismissing the drawer sent the user back to the top.
  useLayoutEffect(() => {
    if (!mobileMenuOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      // Navigating from the drawer should land at the top of the new screen;
      // merely dismissing it should return to where the user was reading.
      const target = resetScrollOnCloseRef.current ? 0 : scrollY;
      resetScrollOnCloseRef.current = false;

      // Fixing the body collapses the document to viewport height, so the
      // scrollable range is 0 until layout is recalculated. Read a layout
      // property to force that reflow, otherwise the scroll below is clamped
      // to 0 and the user is thrown back to the top of the page.
      void document.body.offsetHeight;

      // "instant" rather than "auto": the page sets `scroll-behavior: smooth`,
      // and "auto" defers to that, which would animate the restore and leave
      // the user watching the page glide back to where they already were.
      window.scrollTo({ top: target, behavior: "instant" });
    };
  }, [mobileMenuOpen]);

  // Close the drawer with the Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  type NavItem = {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    /** Shown inline in the desktop bar; the rest live under "Herramientas". */
    primary?: boolean;
  };

  // Ten inline items did not fit the desktop bar: they overlapped each other
  // and the account controls. The five most-used destinations stay visible and
  // the rest move into a single grouped menu.
  const allNavItems: NavItem[] = [
    {
      id: "becas",
      label: t("nav.becas", "Becas"),
      icon: <GraduationCap className="w-4 h-4 text-sky-500" />,
      primary: true,
    },
    {
      id: "guia",
      label: t("nav.guia", "Guía de Migración"),
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
      primary: true,
    },
    {
      id: "mapa",
      label: t("nav.mapa", "Mapa Consular"),
      icon: <MapPin className="w-4 h-4 text-indigo-500" />,
      primary: true,
    },
    {
      id: "comunidad",
      label: t("nav.comunidad", "Comunidad"),
      icon: <Users className="w-4 h-4 text-amber-500" />,
    },
    {
      id: "chat",
      label: t("nav.chat", "Chat IA"),
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      primary: true,
    },
    {
      id: "planificador",
      label: t("nav.planificador", "Planificador 360°"),
      icon: <Compass className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: "calculadora",
      label: t("nav.calculadora", "Calculadora Costo de Vida"),
      icon: <Calculator className="w-4 h-4 text-teal-500" />,
    },
    {
      id: "voluntariados",
      label: t("nav.voluntariados", "Voluntariados"),
      icon: <HeartHandshake className="w-4 h-4 text-rose-500" />,
    },
    {
      id: "feedback",
      label: t("nav.feedback", "Sugerencias"),
      icon: <MessageSquarePlus className="w-4 h-4 text-pink-500" />,
    },
    {
      id: "admin",
      label: t("nav.admin", "Panel Admin"),
      icon: <Database className="w-4 h-4 text-violet-500" />,
      adminOnly: true,
    },
  ];

  const userIsAdmin = isAdmin(currentUser);
  const navItems = allNavItems.filter((item) => !item.adminOnly || userIsAdmin);
  const primaryNavItems = navItems.filter((item) => item.primary);
  const secondaryNavItems = navItems.filter((item) => !item.primary);
  const secondaryIsActive = secondaryNavItems.some((item) => item.id === activeTab);

  const toggleLanguage = () => {
    const newLang = language === "es" ? "en" : "es";
    setLanguage(newLang);
    setLangToast(
      newLang === "es" ? "Idioma cambiado a Español 🇪🇸" : "Language switched to English 🇺🇸"
    );
    setTimeout(() => setLangToast(null), 2200);
  };

  const handleNavClick = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    if (mobileMenuOpen) {
      // The scroll-lock cleanup owns the scroll position while the drawer is
      // open, so ask it to land at the top instead of scrolling here.
      resetScrollOnCloseRef.current = true;
      setMobileMenuOpen(false);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="bg-surface-container-lowest dark:bg-slate-900 w-full top-0 sticky shadow-sm z-50 transition-colors border-b border-outline-variant/30 dark:border-slate-800 pt-[var(--safe-top)] px-[var(--safe-left)]">
      {/* Visual Feedback Toast for Language switch */}
      {langToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-slate-100/95 text-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-white/20 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none flex items-center gap-2">
          <Languages className="w-4 h-4 text-secondary dark:text-teal-600" />
          <span>{langToast}</span>
        </div>
      )}

      <div className="flex justify-between items-center gap-2 px-3 sm:px-4 md:px-8 py-2 md:py-3 max-w-7xl mx-auto">
        {/* Left Side: Mobile Hamburger & Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 min-w-0">
          {/* Mobile Hamburger Menu Button (Positioned at the Left as requested) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            className="tap-target lg:hidden p-2 -ml-1 shrink-0 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-primary dark:text-sky-300" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 lg:shrink-0 text-left focus:outline-none group cursor-pointer active:scale-95 transition-transform"
            id="nav-logo-button"
            aria-label="LatinoMigra Inicio"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-primary/10 dark:bg-sky-500/20 flex items-center justify-center text-primary dark:text-sky-400 group-hover:scale-105 transition-transform shadow-xs">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-headline-md text-lg sm:text-xl md:text-2xl font-bold text-primary dark:text-sky-300 tracking-tight block leading-none truncate">
                LatinoMigra
              </span>
              <span className="text-[10px] text-on-surface-variant/80 dark:text-slate-400 font-medium hidden md:inline">
                {language === "en"
                  ? "Latin America Migration Platform"
                  : "Migración & Becas Oficiales"}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 pl-2 min-w-0">
            {primaryNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  id={`nav-item-${item.id}`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.id === "guia" ? "Guía de Migración" : item.label}
                  className={`font-body-md text-sm font-medium transition-all py-2 px-3 rounded-lg relative flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 select-none ${
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

            {/* Grouped menu for the remaining tools */}
            {secondaryNavItems.length > 0 && (
              <div className="relative" ref={toolsMenuRef}>
                <button
                  onClick={() => setToolsMenuOpen((open) => !open)}
                  id="nav-tools-menu-btn"
                  aria-haspopup="menu"
                  aria-expanded={toolsMenuOpen}
                  className={`font-body-md text-sm font-medium transition-all py-2 px-3 rounded-lg relative flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 select-none ${
                    secondaryIsActive || toolsMenuOpen
                      ? "text-primary dark:text-sky-300 font-bold bg-primary/10 dark:bg-sky-950/40"
                      : "text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-sky-300 hover:bg-surface-container dark:hover:bg-slate-800"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-emerald-500 scale-90" />
                  <span>{language === "en" ? "Tools" : "Herramientas"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${toolsMenuOpen ? "rotate-180" : ""}`}
                  />
                  {secondaryIsActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-secondary dark:bg-teal-400 rounded-full" />
                  )}
                </button>

                {toolsMenuOpen && (
                  <div
                    role="menu"
                    id="nav-tools-menu"
                    className="absolute left-0 top-full mt-2 w-72 p-2 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-xl border border-outline-variant/50 dark:border-slate-700 animate-in fade-in z-50"
                  >
                    {secondaryNavItems.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          role="menuitem"
                          onClick={() => {
                            handleNavClick(item.id);
                            setToolsMenuOpen(false);
                          }}
                          id={`nav-item-${item.id}`}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                            isActive
                              ? "bg-primary/10 dark:bg-sky-950/50 text-primary dark:text-sky-300 font-bold"
                              : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3 shrink-0">
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

          {/* Notification Alerts Center Button */}
          {onOpenAlertsModal && (
            <button
              onClick={onOpenAlertsModal}
              id="alerts-center-btn"
              title={
                language === "en"
                  ? "Configure Alerts & Notifications"
                  : "Configurar Alertas y Avisos"
              }
              className="tap-target relative p-2 rounded-xl text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-90 active:bg-amber-100 dark:active:bg-amber-950/50"
              aria-label="Alertas y Notificaciones"
            >
              <Bell className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            </button>
          )}

          {/* Preferences menu (desktop).
              Currency, language and theme used to sit in the bar as three bare
              controls that crowded the navigation and offered no explanation of
              what they did. Grouping them behind one labelled menu frees the
              bar and gives each setting a plain-language label. On phones the
              same settings live in the drawer footer. */}
          <div className="relative hidden lg:block" ref={prefsMenuRef}>
            <button
              onClick={() => setPrefsMenuOpen((open) => !open)}
              id="preferences-menu-btn"
              aria-haspopup="menu"
              aria-expanded={prefsMenuOpen}
              aria-label={language === "en" ? "Preferences" : "Preferencias"}
              title={language === "en" ? "Preferences" : "Preferencias"}
              className={`tap-target p-2 rounded-xl transition-all cursor-pointer active:scale-90 ${
                prefsMenuOpen
                  ? "bg-primary/10 dark:bg-sky-950/40 text-primary dark:text-sky-300"
                  : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800"
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {prefsMenuOpen && (
              <div
                role="menu"
                id="preferences-menu"
                className="absolute right-0 top-full mt-2 w-72 p-3 space-y-3 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-xl border border-outline-variant/50 dark:border-slate-700 animate-in fade-in z-50"
              >
                <div>
                  <label
                    htmlFor="currency-select-nav"
                    className="block text-xs font-bold text-on-surface dark:text-slate-200 mb-1.5"
                  >
                    {language === "en" ? "Show prices in" : "Mostrar precios en"}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    id="currency-select-nav"
                    className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-on-surface dark:text-slate-200 cursor-pointer outline-none focus:ring-2 focus:ring-secondary"
                  >
                    {availableCurrencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={toggleLanguage}
                  id="lang-toggle-btn"
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-on-surface dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-secondary dark:text-teal-400" />
                    {language === "en" ? "Language" : "Idioma"}
                  </span>
                  <span>{language === "es" ? "🇪🇸 Español" : "🇺🇸 English"}</span>
                </button>

                <button
                  onClick={toggleTheme}
                  id="theme-toggle-btn"
                  title={theme === "light" ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
                  aria-label="Cambiar tema visual"
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-on-surface dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {theme === "light" ? (
                      <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-400" />
                    )}
                    {language === "en" ? "Appearance" : "Apariencia"}
                  </span>
                  <span>
                    {theme === "light"
                      ? language === "en"
                        ? "Light"
                        : "Claro"
                      : language === "en"
                        ? "Dark"
                        : "Oscuro"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Login / Profile Button */}
          <button
            onClick={onOpenAuthModal}
            id="login-profile-btn"
            aria-label={currentUser ? `Cuenta de ${currentUser.name}` : "Acceder con Google"}
            className="tap-target flex items-center gap-2 bg-primary dark:bg-sky-600 text-white px-2.5 md:px-3.5 py-2 rounded-xl font-label-md text-xs font-bold hover:bg-primary-container dark:hover:bg-sky-500 transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
          >
            {currentUser ? (
              <>
                <img
                  src={getSafeImageUrl(currentUser.avatar)}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 md:w-5 md:h-5 rounded-full object-cover border border-white"
                />
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 md:w-4 md:h-4 bg-white rounded-full p-0.5 shrink-0"
                  viewBox="0 0 24 24"
                >
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
                <span className="hidden sm:inline">
                  {language === "en" ? "Sign In" : "Acceder con Google"}
                </span>
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
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="relative w-[88%] max-w-xs bg-surface-container-lowest dark:bg-slate-900 h-full shadow-2xl border-r border-outline-variant/30 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-left pl-[var(--safe-left)]"
          >
            {/* Drawer Header */}
            <div className="p-4 pt-[calc(1rem+var(--safe-top))] border-b border-outline-variant/30 dark:border-slate-800 flex items-center justify-between">
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
                className="tap-target p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800 active:scale-90 transition-all cursor-pointer"
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
                  <span>{language === "en" ? "Sign In with Google" : "Acceder con Google"}</span>
                </button>
              )}

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
                    <span>
                      {language === "en" ? "Manage Alerts & Notices" : "Gestionar Alertas y Avisos"}
                    </span>
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
                      id={`drawer-nav-item-${item.id}`}
                      className={`w-full min-h-[44px] flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                        isActive
                          ? "bg-primary/10 dark:bg-sky-950/50 text-primary dark:text-sky-300 font-bold border border-primary/20"
                          : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 opacity-50 ${isActive ? "text-primary dark:text-sky-300" : ""}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Controls (Currency, Language & Theme) */}
            <div className="p-4 pb-[calc(1rem+var(--safe-bottom))] border-t border-outline-variant/30 dark:border-slate-800 bg-surface dark:bg-slate-900/80 space-y-3">
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
