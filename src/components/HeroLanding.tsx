import React from "react";
import {
  Search,
  Compass,
  Bot,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calculator,
} from "lucide-react";
import { NavigationTab, GoogleUser } from "../types";
import { getSafeImageUrl } from "../lib/sanitize";
import { useLanguage } from "../lib/i18n";

interface HeroLandingProps {
  setActiveTab: (tab: NavigationTab) => void;
  currentUser?: GoogleUser | null;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ setActiveTab, currentUser }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-12 pb-12">
      {/* Personalized Welcome Banner if User is Logged In */}
      {currentUser && (
        <section className="px-4 md:px-8 max-w-7xl mx-auto pt-6">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent dark:from-sky-950/60 dark:via-teal-950/40 dark:to-slate-900/40 p-6 rounded-3xl border border-secondary/30 dark:border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <img
                src={getSafeImageUrl(currentUser.avatar)}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-secondary dark:border-teal-400 shadow-md"
              />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-primary dark:text-sky-300">
                  {t("hero.greeting")}, {currentUser.name}! 👋
                </h2>
                <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-300">
                  {t("hero.profileFrom")}{" "}
                  <strong className="text-secondary dark:text-teal-400">
                    {currentUser.countryOfOrigin || t("hero.defaultRegion")}
                  </strong>
                  . {t("hero.routeReady")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTab("planificador")}
                className="inline-flex items-center gap-2 bg-secondary dark:bg-teal-600 hover:bg-secondary/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>{t("hero.ctaCreatePlan")}</span>
              </button>
              <button
                onClick={() => setActiveTab("becas")}
                className="inline-flex items-center gap-2 bg-surface-container-lowest dark:bg-slate-800 text-primary dark:text-sky-300 hover:bg-surface-container px-3.5 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 dark:border-slate-700 transition-all"
              >
                <span>{t("hero.ctaViewScholarships")}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Header Section */}
      <section className="pt-4 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 font-label-md text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("hero.badge")}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-headline-lg text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary dark:text-sky-300 tracking-tight leading-tight">
              {t("hero.title")}
            </h1>

            {/* Subtitle */}
            <p className="font-body-lg text-lg text-on-surface-variant dark:text-slate-300 max-w-2xl leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => setActiveTab("becas")}
                id="hero-btn-becas"
                aria-label={t("hero.ctaScholarships")}
                className="inline-flex items-center gap-2 bg-primary dark:bg-sky-600 hover:bg-primary-container text-on-primary dark:text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{t("hero.ctaScholarships")}</span>
              </button>

              <button
                onClick={() => setActiveTab("guia")}
                id="hero-btn-guias"
                aria-label={t("hero.ctaGuides")}
                className="inline-flex items-center gap-2 bg-secondary dark:bg-teal-600 hover:bg-secondary/90 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>{t("hero.ctaGuides")}</span>
              </button>

              <button
                onClick={() => setActiveTab("planificador")}
                id="hero-btn-planificador"
                aria-label={t("hero.ctaPlanner")}
                className="inline-flex items-center gap-2 bg-surface-container dark:bg-slate-800 hover:bg-surface-container-high text-primary dark:text-sky-300 px-4 py-3 rounded-xl font-semibold text-sm border border-outline-variant/60 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>{t("hero.ctaPlanner")}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-on-surface-variant dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t("hero.trustSources")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t("hero.trustGuides")}</span>
              </div>
            </div>
          </div>

          {/* Right Image & Floating Badge Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-surface-container-lowest dark:border-slate-800 aspect-4/3 lg:aspect-square">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80"
                alt={t("hero.imageAlt")}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>

            {/* Floating Stats Badge */}
            <div className="absolute -bottom-6 -left-4 sm:left-4 bg-surface-container-lowest dark:bg-slate-800/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-outline-variant/50 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                  {t("hero.statsLabel")}
                </span>
                <span className="text-xl font-extrabold text-primary dark:text-sky-300">
                  {t("hero.statsValue")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Section */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="font-headline-md text-3xl font-extrabold text-primary dark:text-sky-300">
            {t("features.title")}
          </h2>
          <p className="text-on-surface-variant dark:text-slate-300 text-base">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Card 1: Planificador */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-secondary/30 dark:border-teal-500/30 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                {t("features.plannerTitle")}
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                {t("features.plannerDesc")}
              </p>
            </div>
            <button
              onClick={() => setActiveTab("planificador")}
              id="feature-btn-plan"
              className="inline-flex items-center gap-2 min-h-[44px] text-secondary dark:text-teal-300 font-semibold text-xs hover:underline pt-2"
            >
              <span>{t("features.plannerCta")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: AI Assistant */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                {t("features.aiTitle")}
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                {t("features.aiDesc")}
              </p>
            </div>
            <button
              onClick={() => setActiveTab("chat")}
              id="feature-btn-chat"
              className="inline-flex items-center gap-2 min-h-[44px] text-secondary dark:text-teal-300 font-semibold text-xs hover:underline pt-2"
            >
              <span>{t("features.aiCta")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Step-by-Step Guides */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                {t("features.guidesTitle")}
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                {t("features.guidesDesc")}
              </p>
            </div>
            <button
              onClick={() => setActiveTab("guia")}
              id="feature-btn-guia-step"
              className="inline-flex items-center gap-2 min-h-[44px] text-secondary dark:text-teal-300 font-semibold text-xs hover:underline pt-2"
            >
              <span>{t("features.guidesCta")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Scholarship Database */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                {t("features.scholarshipsTitle")}
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                {t("features.scholarshipsDesc")}
              </p>
            </div>
            <button
              onClick={() => setActiveTab("becas")}
              id="feature-btn-becas-verified"
              className="inline-flex items-center gap-2 min-h-[44px] text-secondary dark:text-teal-300 font-semibold text-xs hover:underline pt-2"
            >
              <span>{t("features.scholarshipsCta")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
