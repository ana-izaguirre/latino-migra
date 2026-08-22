import React, { useState } from "react";
import { ShieldCheck, Bookmark, Calendar, Sparkles, LogOut, AlertTriangle } from "lucide-react";
import { GoogleUser } from "../types";
import { signInWithGoogle, isUserAdmin } from "../lib/firebase";
import { getSafeImageUrl } from "../lib/sanitize";
import { Modal } from "./ui/Modal";
import { useLanguage } from "../lib/i18n";
import { LATIN_AMERICAN_COUNTRIES } from "../data/countriesData";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUser | null;
  onSignIn: (user: GoogleUser) => void;
  onSignOut: () => void;
}

/** Resolves a key to the visitor's language. `useLanguage().t`, in practice. */
type Translate = (key: string, fallback?: string) => string;

/**
 * Every country the platform is for, alphabetically.
 *
 * The modal listed nine, written into the markup: someone from Honduras could
 * say so, someone from Panamá, Paraguay or Uruguay could not — on a platform
 * whose audience is Latin America (#88). `countriesData.ts` already holds all
 * twenty, so the list comes from there rather than from a second copy beside
 * it that has to be kept in step.
 */
const originCountries = [...LATIN_AMERICAN_COUNTRIES].sort((a, b) =>
  a.name.localeCompare(b.name, "es")
);

/**
 * What to tell the visitor when sign-in did not complete.
 *
 * Firebase reports the common cases by code. Everything else gets the generic
 * message rather than the raw error, which is English and mentions Firebase.
 *
 * The translator is passed in rather than the strings being written here: the
 * whole modal rendered in Spanish regardless of the chosen language, and this
 * function held four of those strings (#80).
 */
export function describeSignInError(err: unknown, t: Translate): string {
  const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : "";

  if (code === "auth/popup-blocked") {
    return t(
      "auth.errorPopupBlocked",
      "Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes de este sitio e inténtalo de nuevo."
    );
  }
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return t(
      "auth.errorPopupClosed",
      "Cerraste la ventana de Google antes de terminar. Inténtalo de nuevo cuando quieras."
    );
  }
  if (code === "auth/network-request-failed") {
    return t(
      "auth.errorNetwork",
      "No pudimos conectar con Google. Revisa tu conexión e inténtalo de nuevo."
    );
  }
  return t(
    "auth.errorGeneric",
    "No pudimos completar el inicio de sesión con Google. Inténtalo de nuevo."
  );
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignIn,
  onSignOut,
}) => {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<string>("Colombia");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /** Message shown, in the visitor's language, when sign-in did not complete. */
  const [signInError, setSignInError] = useState<string | null>(null);

  const handleFirebaseGoogleSignIn = async () => {
    setIsLoading(true);
    setSignInError(null);
    try {
      const { user: fbUser, countryOfOrigin } = await signInWithGoogle(selectedCountry);
      // App.tsx resolves this too, from its auth-state subscription, but the two
      // race: whichever lands last wins. Without it here, an administrator who
      // signs in can end up flagged as a normal user until the next reload.
      const admin = await isUserAdmin(fbUser.uid);
      const userToSignIn: GoogleUser = {
        id: fbUser.uid,
        name: fbUser.displayName || "Usuario LatinoMigra",
        email: fbUser.email || "usuario@latinomigra.com",
        avatar:
          fbUser.photoURL ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        countryOfOrigin: countryOfOrigin || selectedCountry,
        isAdmin: admin,
        signedInAt: new Date().toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
      onSignIn(userToSignIn);
      onClose();
    } catch (err) {
      // Never fabricate a session. This branch used to build a
      // "Invitada LatinoMigra" user and sign the visitor in with it, so a
      // blocked popup was indistinguishable from a successful sign-in: the
      // modal closed, the greeting said hello, and everything the visitor
      // saved went under an id that changed on every attempt — and vanished
      // on the next reload, because Firebase had never heard of it.
      console.warn("Google sign-in did not complete:", err);
      setSignInError(describeSignInError(err, t));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={
        currentUser
          ? t("auth.titleAccount", "Tu Cuenta LatinoMigra")
          : t("auth.titleSignIn", "Inicia Sesión con Google")
      }
      description={
        currentUser
          ? t(
              "auth.descAccount",
              "Tus becas guardadas, progreso de visas y recordatorios están sincronizados."
            )
          : t(
              "auth.descSignIn",
              "Guarda tu progreso de postulación, recordatorios en Google Calendar e historial de IA."
            )
      }
      size="md"
      id="auth-modal"
    >
      {/* Logged In View */}
      {currentUser ? (
        <div className="space-y-6">
          <div className="bg-surface-container/60 dark:bg-slate-800/80 p-4 rounded-2xl border border-outline-variant/40 dark:border-slate-700 flex items-center gap-4">
            <img
              src={getSafeImageUrl(currentUser.avatar)}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-primary dark:text-sky-300 truncate">
                {currentUser.name}
              </h4>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 truncate">
                {currentUser.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {t("auth.verifiedAccount", "Cuenta Google Verificada")}
                </span>
              </div>
            </div>
          </div>

          {/* Account role — display only. The role selector that used to live
                here called onSignIn({ ...currentUser, role: "admin" }), which
                let any signed-in user grant themselves the admin interface.
                Administrators are now defined by the `admins/{uid}` collection,
                which no client can write. */}
          <div className="p-3 bg-surface dark:bg-slate-800/90 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface dark:text-slate-200">
                {t("auth.roleLabel", "Rol de Cuenta:")}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentUser.isAdmin
                    ? "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                }`}
              >
                {currentUser.isAdmin
                  ? t("auth.roleAdmin", "🔑 Administrador")
                  : t("auth.roleStandard", "👤 Usuario Estándar")}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
              {currentUser.isAdmin
                ? t(
                    "auth.roleAdminBody",
                    "Como administrador puedes gestionar convocatorias, acceder al Panel Admin y sincronizar la base de datos."
                  )
                : t(
                    "auth.roleStandardBody",
                    "Como usuario estándar ves la plataforma limpia sin herramientas técnicas ni botones de administración."
                  )}
            </p>
          </div>

          {/* Sync Features List */}
          <div className="space-y-2 text-xs text-on-surface-variant dark:text-slate-300">
            <div className="flex items-center gap-2 p-2.5 bg-surface dark:bg-slate-800 rounded-xl">
              <Bookmark className="w-4 h-4 text-primary dark:text-sky-400" />
              <span>{t("auth.syncBookmarks", "Sincronización activa de Becas Guardadas")}</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-surface dark:bg-slate-800 rounded-xl">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>{t("auth.syncCalendar", "Conexión directa con Google Calendar")}</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-surface dark:bg-slate-800 rounded-xl">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t("auth.syncChat", "Historial del Asistente LatinoMigra IA")}</span>
            </div>
          </div>

          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="btn-tactile w-full flex items-center justify-center gap-2 py-3 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("auth.signOut", "Cerrar Sesión")}</span>
          </button>
        </div>
      ) : (
        /* Sign In View */
        <div className="space-y-4">
          {/* Direct Official Google Button */}
          <button
            onClick={handleFirebaseGoogleSignIn}
            disabled={isLoading}
            id="google-signin-btn"
            aria-label={t("auth.continueWithGoogle", "Continuar con Google")}
            className="btn-tactile w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm py-3 px-4 rounded-xl border border-slate-300 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{t("auth.continueWithGoogle", "Continuar con Google")}</span>
          </button>

          {/* A failed sign-in has to be visible: it used to close the modal and
              hand back a fabricated session instead. */}
          {signInError && (
            <p
              id="auth-signin-error"
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs font-semibold text-amber-800 dark:text-amber-300"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{signInError}</span>
            </p>
          )}

          {/* Country Selection */}
          <div className="space-y-1.5 pt-2">
            <label
              htmlFor="auth-origin-country"
              className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block"
            >
              {t("auth.originCountry", "País de origen (para personalización de visas):")}
            </label>
            <select
              id="auth-origin-country"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full p-2.5 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-semibold"
            >
              {originCountries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name} {country.flag}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 text-center text-[11px] text-on-surface-variant dark:text-slate-400 space-y-1">
            <p>
              {t(
                "auth.privacyNotice",
                "Protegido por Google OAuth 2.0. No compartiremos tu información personal."
              )}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
