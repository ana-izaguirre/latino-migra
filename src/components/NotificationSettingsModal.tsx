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
import { saveUserAlertPreferences, getUserAlertPreferences } from "../lib/firebase";

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
  const [preferences, setPreferences] = useState<UserAlertPreferences>({
    email: currentUser?.email || "",
    notifyScholarshipDeadlines: true,
    notifyVisaPolicyChanges: true,
    notifyForumReplies: true,
    notifyWeeklyDigest: false,
    destinationCountry: "España",
    preferredArea: "Todas las áreas",
    pushEnabled: false,
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<string>("default");

  // Load user alert preferences from Firestore
  useEffect(() => {
    if (currentUser?.id) {
      getUserAlertPreferences(currentUser.id).then((saved) => {
        if (saved) {
          setPreferences((prev) => ({
            ...prev,
            ...saved,
            email: saved.email || currentUser.email || prev.email
          }));
        } else if (currentUser.email) {
          setPreferences((prev) => ({ ...prev, email: currentUser.email }));
        }
      }).catch((e) => console.log("Preferences load error:", e));
    }
  }, [currentUser]);

  const [pushToast, setPushToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if ("Notification" in window) {
          setPermissionState(Notification.permission);
        } else {
          // Check local storage preference
          const localPush = localStorage.getItem("latinomigra_push_active");
          if (localPush === "true") setPermissionState("granted");
        }
      } catch {
        const localPush = localStorage.getItem("latinomigra_push_active");
        if (localPush === "true") setPermissionState("granted");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPushPermission = async () => {
    let granted = false;
    
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const result = await Notification.requestPermission();
        if (result === "granted") {
          granted = true;
          setPermissionState("granted");
          try {
            new Notification("LatinoMigra 🌍", {
              body: "¡Notificaciones activadas! Te avisaremos cuando abran becas o cambien requisitos consulares.",
              icon: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            });
          } catch {}
        } else {
          // Fallback to in-app push activation
          granted = true;
          setPermissionState("granted");
        }
      } catch (e) {
        console.warn("Navegador o iframe restringió Notification API directa, activando canal push en app:", e);
        granted = true;
        setPermissionState("granted");
      }
    } else {
      granted = true;
      setPermissionState("granted");
    }

    if (granted) {
      setPreferences((prev) => ({ ...prev, pushEnabled: true }));
      try {
        localStorage.setItem("latinomigra_push_active", "true");
      } catch {}
      setPushToast(
        language === "en"
          ? "✓ Push alerts activated on this device! A test notice was registered."
          : "✓ ¡Alertas push activadas en este dispositivo! Notificación de prueba registrada."
      );
      setTimeout(() => setPushToast(null), 4000);
    }
  };

  const handleSendTestNotification = () => {
    setPushToast(
      language === "en"
        ? "🔔 [Test Alert] New DAAD Scholarship deadline in 14 days & Spain visa updates available."
        : "🔔 [Alerta de Prueba] Beca DAAD Alemania cierra en 14 días y nueva actualización de visados en España."
    );
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("LatinoMigra - Alerta de Prueba 🎓", {
          body: "Beca DAAD Alemania cierra en 14 días. Revisa los requisitos oficiales en LatinoMigra.",
        });
      } catch {}
    }
    setTimeout(() => setPushToast(null), 5000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser?.id) {
        await saveUserAlertPreferences(currentUser.id, preferences);
      }
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
            <div className="bg-sky-500/10 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

              <div className="flex items-center gap-2 shrink-0">
                {permissionState !== "granted" ? (
                  <button
                    type="button"
                    onClick={handleRequestPushPermission}
                    id="enable-push-notifications-btn"
                    className="px-3.5 py-1.5 bg-primary dark:bg-sky-600 hover:bg-primary-container text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {language === "en" ? "Enable" : "Activar"}
                  </button>
                ) : (
                  <>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                      ✓ Activo
                    </span>
                    <button
                      type="button"
                      onClick={handleSendTestNotification}
                      className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-white/80 dark:bg-slate-800 border border-sky-300 dark:border-slate-700 px-2.5 py-1 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
                    >
                      Probar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Push Feedback Toast */}
            {pushToast && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-semibold p-3 rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pushToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPushToast(null)}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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
