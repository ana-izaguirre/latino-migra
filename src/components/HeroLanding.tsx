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
import { Avatar } from "./ui/Avatar";

interface HeroLandingProps {
  setActiveTab: (tab: NavigationTab) => void;
  currentUser?: GoogleUser | null;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ setActiveTab, currentUser }) => {
  return (
    <div className="space-y-12 pb-12">
      {/* Personalized Welcome Banner if User is Logged In */}
      {currentUser && (
        <section className="px-4 md:px-8 max-w-7xl mx-auto pt-6">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent dark:from-sky-950/60 dark:via-teal-950/40 dark:to-slate-900/40 p-6 rounded-3xl border border-secondary/30 dark:border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar
                src={currentUser.avatar}
                name={currentUser.name}
                className="w-14 h-14 rounded-2xl border-2 border-secondary dark:border-teal-400 shadow-md text-xl"
              />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-primary dark:text-sky-300">
                  ¡Hola, {currentUser.name}! 👋
                </h2>
                <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-300">
                  Perfil conectado desde{" "}
                  <strong className="text-secondary dark:text-teal-400">
                    {currentUser.countryOfOrigin || "América Latina"}
                  </strong>
                  . Tu ruta migratoria personalizada está lista.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTab("planificador")}
                className="inline-flex items-center gap-2 bg-secondary dark:bg-teal-600 hover:bg-secondary/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>Crear Plan de Migración</span>
              </button>
              <button
                onClick={() => setActiveTab("becas")}
                className="inline-flex items-center gap-2 bg-surface-container-lowest dark:bg-slate-800 text-primary dark:text-sky-300 hover:bg-surface-container px-3.5 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 dark:border-slate-700 transition-all"
              >
                <span>Ver Becas</span>
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
              <span>Tu viaje comienza aquí — Plataforma 100% segura</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-headline-lg text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary dark:text-sky-300 tracking-tight leading-tight">
              Tu futuro no tiene fronteras
            </h1>

            {/* Subtitle */}
            <p className="font-body-lg text-lg text-on-surface-variant dark:text-slate-300 max-w-2xl leading-relaxed">
              Conectamos a estudiantes y profesionales latinoamericanos con oportunidades globales:
              becas con financiamiento completo, planes de mudanza con cálculo de presupuesto real,
              prevención de estafas y soporte consular.
            </p>

            {/*
              Two destinations, side by side even on a phone. Three wide
              buttons wrapped onto three full-width lines at 375px and read as
              stacked blocks rather than a choice — and the third led to the
              planner, which the navigation no longer offers.
            */}
            <div className="grid grid-cols-2 gap-3 pt-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                onClick={() => setActiveTab("becas")}
                id="hero-btn-becas"
                aria-label="Buscar Becas"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary dark:bg-sky-600 px-4 text-sm font-bold text-on-primary dark:text-white shadow-md transition-all hover:bg-primary-container hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Buscar Becas</span>
              </button>

              <button
                onClick={() => setActiveTab("guia")}
                id="hero-btn-guias"
                aria-label="Ver Guías Migratorias"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-secondary dark:bg-teal-600 px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-secondary/90 hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ver Guías</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-on-surface-variant dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Fuentes 100% Oficiales de Ministerios y Universidades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Guías de Empadronamiento, Alquiler Seguro y Visas</span>
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

            {/*
              No catalogue figures here. This badge claimed "+5,000 Becas
              Activas" against a catalogue of 22, on the screen whose job is
              to say what the product is. Numbers about the catalogue belong
              on the catalogue, where they are counted rather than asserted.
            */}
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
          {/* Card 2: AI Assistant */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                Asistente Migratorio IA
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                Aclara dudas sobre visados, apostillas, cartas de motivación y requerimientos
                financieros al instante con LatinoMigra IA.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("chat")}
              id="feature-btn-chat"
              className="inline-flex items-center gap-2 min-h-[44px] text-secondary dark:text-teal-300 font-semibold text-xs hover:underline pt-2"
            >
              <span>Probar Chat IA</span>
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
                Guías Paso a Paso
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                Rutas claras para España, Alemania, EE.UU., Canadá y más. Requisitos legales, costo
                de vida real y trámites como empadronamiento.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("guia")}
              id="feature-btn-guia-step"
              className="inline-flex items-center gap-2 min-h-[44px] text-secondary dark:text-teal-300 font-semibold text-xs hover:underline pt-2"
            >
              <span>Explorar Guías</span>
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
                Becas por Fechas
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                Filtra por fecha límite de postulación, nivel de cobertura e institución oficial sin
                intermediarios.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("becas")}
              id="feature-btn-becas-verified"
              className="inline-flex items-center gap-2 min-h-[44px] text-secondary dark:text-teal-300 font-semibold text-xs hover:underline pt-2"
            >
              <span>Ver Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
