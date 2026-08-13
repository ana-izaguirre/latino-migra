import React from "react";
import { Globe, Heart, ShieldCheck } from "lucide-react";
import { NavigationTab } from "../types";

interface FooterProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-surface-container-lowest dark:bg-slate-900 border-t border-outline-variant/30 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <span className="font-headline-md text-xl font-bold text-primary dark:text-sky-300">
                LatinoMigra
              </span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
              Empoderando a la comunidad estudiantil y profesional de América Latina para estudiar y trabajar en el extranjero.
            </p>
          </div>

          {/* Col 2: Explorar */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-sky-300">
              Explorar
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant dark:text-slate-300">
              <li>
                <button onClick={() => setActiveTab("becas")} className="hover:underline">
                  Catálogo de Becas 2026
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("guia")} className="hover:underline">
                  Guía Migratoria España
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("guia")} className="hover:underline">
                  Guía Migratoria Alemania
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("chat")} className="hover:underline">
                  Asistente IA de Visas
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Comunidad */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-sky-300">
              Comunidad
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant dark:text-slate-300">
              <li>
                <button onClick={() => setActiveTab("comunidad")} className="hover:underline">
                  Foros de Migrantes
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("comunidad")} className="hover:underline">
                  Experiencias de Becarios
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("comunidad")} className="hover:underline">
                  Consejos de Alojamiento
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Confianza */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-sky-300">
              Garantía y Legal
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant dark:text-slate-300">
              <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Fuentes 100% Verificadas</span>
              </li>
              <li>Términos y Condiciones</li>
              <li>Política de Privacidad</li>
              <li>Contacto e Información</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-outline-variant/20 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant dark:text-slate-400 gap-4">
          <span>© 2026 LatinoMigra. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> para Latinoamérica
          </span>
        </div>
      </div>
    </footer>
  );
};
