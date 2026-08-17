import React, { useState } from "react";
import { Globe, Heart, ShieldCheck, ExternalLink, HelpCircle, FileText, Lock, MessageSquare, Mail, X, Sparkles, Compass, Calculator, GraduationCap, MapPin, BookOpen, MessageSquarePlus, HeartHandshake, Bot } from "lucide-react";
import { NavigationTab } from "../types";
import { useLanguage } from "../lib/i18n";

interface FooterProps {
  setActiveTab: (tab: NavigationTab) => void;
}

type ModalType = "terms" | "privacy" | "guidelines" | "contact" | null;

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { language, t } = useLanguage();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleNavigate = (tab: NavigationTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-surface-container-lowest dark:bg-slate-900 border-t border-outline-variant/30 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3.5 md:col-span-1">
            <div
              onClick={() => handleNavigate("home")}
              className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <span className="font-headline-md text-xl font-bold text-primary dark:text-sky-300">
                LatinoMigra
              </span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
              {language === "en"
                ? "Empowering Latin American students and professionals to study, work, and settle abroad with verified data, scholarships, and active peer support."
                : "Empoderando a la comunidad estudiantil y profesional de América Latina para estudiar y trabajar en el extranjero con datos oficiales y apoyo mutuo."}
            </p>
            <div className="pt-1">
              <button
                onClick={() => handleNavigate("chat")}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary/10 dark:bg-teal-950/40 text-secondary dark:text-teal-300 text-xs font-bold border border-secondary/20 hover:bg-secondary/20 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{language === "en" ? "Evaluate Profile with AI" : "Evaluar Perfil con IA"}</span>
              </button>
            </div>
          </div>

          {/* Col 2: Herramientas */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-sky-300 flex items-center gap-1.5">
              <span>{t("footer.tools", "Herramientas")}</span>
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant dark:text-slate-300">
              <li>
                <button
                  onClick={() => handleNavigate("planificador")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t("nav.planificador", "Planificador 360° (Presupuesto & Clima)")}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate("calculadora")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <Calculator className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span>{t("nav.calculadora", "Calculadora de Costo de Vida y Divisas")}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate("becas")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>{t("nav.becas", "Catálogo de Becas 2026-2027")}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate("voluntariados")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{language === "en" ? "Volunteering & Exchanges" : "Voluntariados e Intercambios"}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate("mapa")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{t("nav.mapa", "Mapa Consular & Visados")}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate("guia")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{t("nav.guia", "Guía Oficial de Migración")}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Comunidad y Asistente */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-sky-300">
              {t("footer.community", "Comunidad & Asistencia")}
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant dark:text-slate-300">
              <li>
                <button
                  onClick={() => handleNavigate("comunidad")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{language === "en" ? "Community Forum & Experiences" : "Foro de Migrantes & Consejos"}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate("feedback")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{language === "en" ? "Suggest New Feature or Scholarship" : "Sugerir Nueva Beca o Función"}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate("chat")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>{language === "en" ? "AI Migration Consultant" : "Consultor Migratorio con IA"}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Confianza */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-sky-300">
              {t("footer.legal", "Garantía y Legal")}
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant dark:text-slate-300">
              <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold py-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{t("footer.verified", "Fuentes 100% Verificadas")}</span>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("terms")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{t("footer.terms", "Términos y Condiciones de Uso")}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("privacy")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{t("footer.privacy", "Política de Privacidad")}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("guidelines")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{t("footer.guidelines", "Normas de la Comunidad")}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("contact")}
                  className="footer-link w-full min-h-[44px] sm:min-h-0 flex items-center gap-2 py-2.5 sm:py-1 px-2 -mx-2 rounded-lg hover:bg-surface-container dark:hover:bg-slate-800 hover:text-primary dark:hover:text-sky-300 transition-all text-left"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{t("footer.contact", "Contacto y Soporte")}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-outline-variant/20 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant dark:text-slate-400 gap-4">
          <span>© 2026 LatinoMigra. {t("footer.rights", "Todos los derechos reservados.")}</span>
          <span className="flex items-center gap-1.5">
            <span>{t("footer.madeWith", "Hecho con")}</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>{language === "en" ? "for Latin America" : "para Latinoamérica"}</span>
          </span>
        </div>
      </div>

      {/* Interactive Information Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-4 shadow-2xl border border-outline-variant/40 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/30 dark:border-slate-700 pb-3">
              <h3 className="font-headline-sm text-lg md:text-xl font-bold text-primary dark:text-sky-300 flex items-center gap-2">
                {activeModal === "terms" && <FileText className="w-5 h-5 text-secondary" />}
                {activeModal === "privacy" && <Lock className="w-5 h-5 text-emerald-500" />}
                {activeModal === "guidelines" && <HelpCircle className="w-5 h-5 text-sky-400" />}
                {activeModal === "contact" && <Mail className="w-5 h-5 text-indigo-400" />}
                <span>
                  {activeModal === "terms" && (language === "en" ? "Terms & Conditions" : "Términos y Condiciones de Uso")}
                  {activeModal === "privacy" && (language === "en" ? "Privacy Policy" : "Política de Privacidad y Manejo de Datos")}
                  {activeModal === "guidelines" && (language === "en" ? "Community Guidelines" : "Normas de Convivencia de la Comunidad")}
                  {activeModal === "contact" && (language === "en" ? "Contact & Support" : "Contacto y Asistencia")}
                </span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs md:text-sm text-on-surface-variant dark:text-slate-300 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              {activeModal === "terms" && (
                <>
                  <p className="font-semibold text-primary dark:text-sky-300">
                    1. Naturaleza Informativa y Orientativa
                  </p>
                  <p>
                    LatinoMigra es una plataforma digital de información pública, organizada y orientada a apoyar a postulantes latinoamericanos. LatinoMigra no es una agencia de cobro ni sustituye a los consulados, embajadas u organismos oficiales de inmigración.
                  </p>
                  <p className="font-semibold text-primary dark:text-sky-300">
                    2. Verificación de Requisitos
                  </p>
                  <p>
                    Todos los requisitos de visados, fondos económicos (como el IPREM o la Sperrkonto) y convocatorias de becas son revisados periódicamente, pero recomendamos siempre cotejar con las fuentes consulares oficiales de cada país de destino.
                  </p>
                </>
              )}

              {activeModal === "privacy" && (
                <>
                  <p className="font-semibold text-primary dark:text-sky-300">
                    Protección y Privacidad de tus Datos
                  </p>
                  <p>
                    En LatinoMigra valoramos la privacidad de los migrantes y estudiantes. No vendemos ni compartimos tus datos de contacto con terceros ni agencias con fines de publicidad invasiva.
                  </p>
                  <p>
                    Tus planes guardados y preferencias de simulación se almacenan de manera segura bajo tu perfil de usuario para permitirte sincronizar tus calculadoras y agendas consulares entre dispositivos.
                  </p>
                </>
              )}

              {activeModal === "guidelines" && (
                <>
                  <p className="font-semibold text-primary dark:text-sky-300">
                    1. Respeto y Empatía Mutua
                  </p>
                  <p>
                    Todos los miembros de la comunidad se encuentran en procesos migratorios o de estudio que requieren paciencia y apoyo. No se tolera discriminación, desinformación intencional ni venta de servicios no autorizados.
                  </p>
                  <p className="font-semibold text-primary dark:text-sky-300">
                    2. Búsqueda y Prevención de Preguntas Duplicadas
                  </p>
                  <p>
                    Antes de publicar una duda, te sugerimos utilizar la barra de búsqueda para verificar si otro compañero ya recibió una respuesta detallada con enlaces y consejos.
                  </p>
                </>
              )}

              {activeModal === "contact" && (
                <>
                  <p className="font-semibold text-primary dark:text-sky-300">
                    Equipo de LatinoMigra
                  </p>
                  <p>
                    ¿Tienes dudas sobre una beca, encontraste un enlace consular desactualizado o deseas colaborar con la comunidad?
                  </p>
                  <div className="p-3 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/50 space-y-1">
                    <p className="font-bold text-xs text-primary dark:text-sky-300">📧 Correo de soporte:</p>
                    <a href="mailto:latinomigra@gmail.com" className="text-xs text-secondary font-mono hover:underline">latinomigra@gmail.com</a>
                    <p className="font-bold text-xs text-primary dark:text-sky-300 pt-1">💡 Sugerencias directas:</p>
                    <p className="text-xs">
                      Puedes publicar en la sección de <button onClick={() => { setActiveModal(null); handleNavigate("feedback"); }} className="underline font-bold text-secondary cursor-pointer">Sugerencias Comunitarias</button> para que el equipo priorice nuevas integraciones.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-primary dark:bg-sky-600 text-white font-bold text-xs hover:bg-primary-container transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                {language === "en" ? "Close" : "Entendido y Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
