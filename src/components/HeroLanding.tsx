import React from "react";
import { Search, Compass, Bot, Award, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { NavigationTab } from "../types";

interface HeroLandingProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Header Section */}
      <section className="pt-8 md:pt-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 font-label-md text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tu viaje comienza aquí</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-headline-lg text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary dark:text-sky-300 tracking-tight leading-tight">
              Tu futuro no tiene fronteras
            </h1>

            {/* Subtitle */}
            <p className="font-body-lg text-lg text-on-surface-variant dark:text-slate-300 max-w-2xl leading-relaxed">
              Conectamos a estudiantes y profesionales latinoamericanos con oportunidades globales. Encuentra becas financiadas, navega procesos migratorios con apoyo de IA y únete a una comunidad que te respalda.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setActiveTab("becas")}
                id="hero-btn-becas"
                className="inline-flex items-center gap-2 bg-primary dark:bg-sky-600 hover:bg-primary-container text-on-primary dark:text-white px-6 py-3.5 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
              >
                <Search className="w-5 h-5" />
                <span>Buscar Becas</span>
              </button>

              <button
                onClick={() => setActiveTab("guia")}
                id="hero-btn-guia"
                className="inline-flex items-center gap-2 bg-surface-container dark:bg-slate-800 hover:bg-surface-container-high text-primary dark:text-sky-300 px-6 py-3.5 rounded-xl font-semibold text-base border border-outline-variant/60 dark:border-slate-700 transition-all"
              >
                <Compass className="w-5 h-5" />
                <span>Ver Guías Migratorias</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-sm text-on-surface-variant dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Fuentes 100% Oficiales</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Trámites Consulares Actualizados</span>
              </div>
            </div>
          </div>

          {/* Right Image & Floating Badge Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-surface-container-lowest dark:border-slate-800 aspect-4/3 lg:aspect-square">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80"
                alt="Estudiantes latinoamericanos en el extranjero"
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
                  Oportunidades
                </span>
                <span className="text-xl font-extrabold text-primary dark:text-sky-300">
                  +5,000 Becas Activas
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
            Todo lo que necesitas para dar el gran paso
          </h2>
          <p className="text-on-surface-variant dark:text-slate-300 text-base">
            Herramientas diseñadas por y para la comunidad migrante latinoamericana.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Assistant */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-xl font-bold text-primary dark:text-sky-300">
                Asistente Migratorio IA
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
                Aclara dudas sobre visados, apostillas, cartas de motivación y requerimientos financieros al instante con LatinoMigra IA.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("chat")}
              id="feature-btn-chat"
              className="inline-flex items-center gap-2 text-secondary dark:text-teal-300 font-semibold text-sm hover:underline pt-2"
            >
              <span>Probar Chat IA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Step-by-Step Guides */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-xl font-bold text-primary dark:text-sky-300">
                Guías Paso a Paso
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
                Rutas claras para España, Alemania, EE.UU., Canadá y más. Requisitos legales, costo de vida real y checklists descargables.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("guia")}
              id="feature-btn-guia-step"
              className="inline-flex items-center gap-2 text-secondary dark:text-teal-300 font-semibold text-sm hover:underline pt-2"
            >
              <span>Explorar Guías</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Scholarship Database */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-xl font-bold text-primary dark:text-sky-300">
                Becas 100% Verificadas
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
                Filtra por país, área de estudio y nivel de financiamiento. Recibe alertas de convocatorias antes de que cierren.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("becas")}
              id="feature-btn-becas-verified"
              className="inline-flex items-center gap-2 text-secondary dark:text-teal-300 font-semibold text-sm hover:underline pt-2"
            >
              <span>Ver Catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
