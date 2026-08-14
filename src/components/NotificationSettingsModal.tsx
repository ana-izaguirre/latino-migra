import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Mail,
  Smartphone,
  Globe,
  Sliders,
  Send,
  Sparkles,
  Info
} from "lucide-react";
import { GoogleUser, UserAlertPreferences } from "../types";
import { useLanguage } from "../lib/i18n";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUser | null;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const { language } = useLanguage();
  const [preferences, setPreferences] = useState<UserAlertPreferences>(() => {
    try {
      const saved = localStorage.getItem("latinomigra_alert_preferences");
      if (saved) return JSON.parse(saved);
    } catch {}

    return {
      email: currentUser?.email || "",
      notifyScholarshipDeadlines: true,
      notifyVisaPolicyChanges: true,
      notifyForumReplies: true,
      notifyWeeklyDigest: false,
      destinationCountry: "España",
      preferredArea: "Todas las áreas",
      pushEnabled: false,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<string>("default");

  useEffect(() => {
    if (currentUser?.email && !preferences.email) {
      setPreferences((prev) => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPushPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const result = await Notification.requestPermission();
        setPermissionState(result);
        if (result === "granted") {
          setPreferences((prev) => ({ ...prev, pushEnabled: true }));
          new Notification("LatinoMigra 🌍", {
            body: "¡Alertas activadas! Te avisaremos cuando abran becas o cambien requisitos consulares.",
            icon: "/favicon.ico",
          });
        }
      } catch (e) {
        console.error("Error solicitando permisos de notificación:", e);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("latinomigra_alert_preferences", JSON.stringify(preferences));
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-outline-variant/50 dark:border-slate-800 p-5 sm:p-7 space-y-5 relative animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Alerts & Notifications" : "Centro de Alertas Migratorias"}</span>
          </div>
          <h2 className="font-headline-md text-xl sm:text-2xl font-extrabold text-primary dark:text-sky-300">
            {language === "en" ? "Configure Your Alerts" : "Configura tus Notificaciones"}
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
            {language === "en"
              ? "Receive timely alerts about scholarship deadlines, visa policy updates, and forum responses directly to your email or device."
              : "Recibe recordatorios de cierre de becas, cambios consulares y respuestas a tus dudas en tu correo o en tu navegador móvil."}
          </p>
        </div>

        {savedSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-5 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="font-bold text-sm">
              {language === "en" ? "Alerts Saved Successfully!" : "¡Preferencias Guardadas con Éxito!"}
            </h3>
            <p className="text-xs">
              {language === "en"
                ? "You will receive updates according to your chosen destination and study area."
                : "Recibirás avisos clave según tu país de destino y área de estudio seleccionados."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                {language === "en" ? "Notification Email Address" : "Correo electrónico para recibir alertas *"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400" />
                <input
                  type="email"
                  required
                  value={preferences.email}
                  onChange={(e) => setPreferences({ ...preferences, email: e.target.value })}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-medium outline-none focus:ring-2 focus:ring-secondary dark:text-slate-100"
                />
              </div>
            </div>

            {/* Target Filters for Alerts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container/50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-outline-variant/40 dark:border-slate-800">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant dark:text-slate-400 block mb-1">
                  {language === "en" ? "Target Destination" : "País de Destino Prioritario"}
                </label>
                <select
                  value={preferences.destinationCountry}
                  onChange={(e) => setPreferences({ ...preferences, destinationCountry: e.target.value })}
                  className="w-full px-3 py-2 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary dark:text-slate-200"
                >
                  <option value="España">🇪🇸 España</option>
                  <option value="Alemania">🇩🇪 Alemania</option>
                  <option value="Canadá">🇨🇦 Canadá</option>
                  <option value="Irlanda">🇮🇪 Irlanda</option>
                  <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
                  <option value="Todos">🌍 Todos los destinos</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface-variant dark:text-slate-400 block mb-1">
                  {language === "en" ? "Academic / Job Area" : "Área de Interés"}
                </label>
                <select
                  value={preferences.preferredArea}
                  onChange={(e) => setPreferences({ ...preferences, preferredArea: e.target.value })}
                  className="w-full px-3 py-2 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary dark:text-slate-200"
                >
                  <option value="Todas las áreas">🎓 Todas las áreas</option>
                  <option value="STEM">🔬 STEM & Tecnología</option>
                  <option value="Negocios">💼 Negocios y Finanzas</option>
                  <option value="Salud">🏥 Salud y Medicina</option>
                  <option value="Artes y Humanidades">🎨 Artes y Humanidades</option>
                </select>
              </div>
            </div>

            {/* Notification Types Toggles */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block">
                {language === "en" ? "What alerts do you want to receive?" : "¿Qué alertas deseas activar?"}
              </label>

              {/* Toggle 1: Scholarship Deadlines */}
              <label className="flex items-start gap-3 p-3 bg-surface dark:bg-slate-800/60 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl border border-outline-variant/30 dark:border-slate-800 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.notifyScholarshipDeadlines}
                  onChange={(e) => setPreferences({ ...preferences, notifyScholarshipDeadlines: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-primary dark:text-sky-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
                    <span>{language === "en" ? "Scholarship Deadlines (30 / 15 / 5 days left)" : "Cierre de Becas (30, 15 y 5 días antes)"}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                    {language === "en"
                      ? "Get reminded before Carolina, DAAD, AUIP or university grants close."
                      : "Aviso previo para que alcances a preparar tus cartas de recomendación y apostillas."}
                  </p>
                </div>
              </label>

              {/* Toggle 2: Visa Policy Updates */}
              <label className="flex items-start gap-3 p-3 bg-surface dark:bg-slate-800/60 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl border border-outline-variant/30 dark:border-slate-800 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.notifyVisaPolicyChanges}
                  onChange={(e) => setPreferences({ ...preferences, notifyVisaPolicyChanges: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-primary dark:text-sky-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === "en" ? "Immigration & Visa Policy Changes" : "Cambios en Leyes de Extranjería y Visas"}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                    {language === "en"
                      ? "Updates to financial proof amounts (IPREM, Sperrkonto), work permits and post-study visas."
                      : "Noticias oficiales sobre fondos exigidos (IPREM, Sperrkonto), horas de trabajo y arraigo."}
                  </p>
                </div>
              </label>

              {/* Toggle 3: Forum Replies */}
              <label className="flex items-start gap-3 p-3 bg-surface dark:bg-slate-800/60 hover:bg-surface-container dark:hover:bg-slate-800 rounded-xl border border-outline-variant/30 dark:border-slate-800 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.notifyForumReplies}
                  onChange={(e) => setPreferences({ ...preferences, notifyForumReplies: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-primary dark:text-sky-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>{language === "en" ? "Community Forum Responses" : "Respuestas a mis preguntas en la Comunidad"}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                    {language === "en"
                      ? "Notify me when other students or mentors reply to my posts."
                      : "Avisarme cuando otros estudiantes o mentores comenten mi consulta."}
                  </p>
                </div>
              </label>
            </div>

            {/* Mobile Browser Web Push Permission Banner */}
            <div className="bg-sky-500/10 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-500/30 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-sky-300">
                  <Smartphone className="w-4 h-4" />
                  <span>{language === "en" ? "Push Notifications on Device" : "Notificaciones en tu Móvil / Android"}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                  {permissionState === "granted"
                    ? (language === "en" ? "✓ Push alerts enabled on this device" : "✓ Alertas push activas en este dispositivo")
                    : (language === "en" ? "Allow instant notifications in your browser" : "Permite alertas instantáneas en tu navegador")}
                </p>
              </div>

              {permissionState !== "granted" ? (
                <button
                  type="button"
                  onClick={handleRequestPushPermission}
                  className="px-3 py-1.5 bg-primary dark:bg-sky-600 hover:bg-primary-container text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  {language === "en" ? "Enable" : "Activar"}
                </button>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  Activo
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-on-surface-variant dark:text-slate-400 hover:bg-surface-container rounded-xl transition-colors"
              >
                {language === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary dark:bg-teal-600 hover:bg-secondary/90 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === "en" ? "Save Alert Preferences" : "Guardar Preferencias"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
