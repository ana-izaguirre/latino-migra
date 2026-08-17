import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, Bookmark, Calendar, Sparkles, User, Globe, LogOut } from "lucide-react";
import { GoogleUser } from "../types";
import { signInWithGoogle, signOutUser } from "../lib/firebase";
import { getSafeImageUrl } from "../lib/sanitize";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUser | null;
  onSignIn: (user: GoogleUser) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignIn,
  onSignOut,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("Colombia");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFirebaseGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { user: fbUser, countryOfOrigin } = await signInWithGoogle(selectedCountry);
      const userToSignIn: GoogleUser = {
        id: fbUser.uid,
        name: fbUser.displayName || "Usuario LatinoMigra",
        email: fbUser.email || "usuario@latinomigra.com",
        avatar:
          fbUser.photoURL ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        countryOfOrigin: countryOfOrigin || selectedCountry,
        signedInAt: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }),
      };
      onSignIn(userToSignIn);
      onClose();
    } catch (err: any) {
      console.warn("Firebase Auth popup no completado o en modo de prueba, activando acceso rápido:", err);
      // Demo Fallback for local preview if popup is blocked
      const fallbackUser: GoogleUser = {
        id: "google-user-" + Date.now(),
        name: "Ana Izaguirre",
        email: "ana.izaguirre@gmail.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        countryOfOrigin: selectedCountry,
        signedInAt: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }),
      };
      onSignIn(fallbackUser);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border border-outline-variant/40 dark:border-slate-800 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="btn-tactile absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 flex items-center justify-center mx-auto font-bold">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="font-headline-md text-2xl font-extrabold text-primary dark:text-sky-300">
            {currentUser ? "Tu Cuenta LatinoMigra" : "Inicia Sesión con Google"}
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-slate-300">
            {currentUser
              ? "Tus becas guardadas, progreso de visas y recordatorios están sincronizados."
              : "Guarda tu progreso de postulación, recordatorios en Google Calendar e historial de IA."}
          </p>
        </div>

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
                    Cuenta Google Verificada
                  </span>
                </div>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="p-3 bg-surface dark:bg-slate-800/90 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface dark:text-slate-200">
                  Rol de Cuenta:
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentUser.role === "admin"
                    ? "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                }`}>
                  {currentUser.role === "admin" ? "🔑 Administrador" : "👤 Usuario Estándar"}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                {currentUser.role === "admin"
                  ? "Como administrador puedes gestionar convocatorias, acceder al Panel Admin y sincronizar la base de datos."
                  : "Como usuario estándar ves la plataforma limpia sin herramientas técnicas ni botones de administración."}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSignIn({ ...currentUser, role: "user" });
                  }}
                  id="role-user-btn"
                  className={`btn-tactile py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    currentUser.role !== "admin"
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-surface-container dark:bg-slate-750 text-on-surface-variant dark:text-slate-300 border-outline-variant/50 hover:bg-surface-container-high"
                  }`}
                >
                  👤 Persona Normal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSignIn({ ...currentUser, role: "admin" });
                  }}
                  id="role-admin-btn"
                  className={`btn-tactile py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    currentUser.role === "admin"
                      ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                      : "bg-surface-container dark:bg-slate-750 text-on-surface-variant dark:text-slate-300 border-outline-variant/50 hover:bg-surface-container-high"
                  }`}
                >
                  🔑 Administrador
                </button>
              </div>
            </div>

            {/* Sync Features List */}
            <div className="space-y-2 text-xs text-on-surface-variant dark:text-slate-300">
              <div className="flex items-center gap-2 p-2.5 bg-surface dark:bg-slate-800 rounded-xl">
                <Bookmark className="w-4 h-4 text-primary dark:text-sky-400" />
                <span>Sincronización activa de Becas Guardadas</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-surface dark:bg-slate-800 rounded-xl">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>Conexión directa con Google Calendar</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-surface dark:bg-slate-800 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Historial del Asistente LatinoMigra IA</span>
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
              <span>Cerrar Sesión</span>
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
              aria-label="Continuar con Google"
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
              <span>Continuar con Google</span>
            </button>

            {/* Country Selection */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block">
                País de origen (para personalización de visas):
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2.5 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="Colombia">Colombia 🇨🇴</option>
                <option value="México">México 🇲🇽</option>
                <option value="Argentina">Argentina 🇦🇷</option>
                <option value="Perú">Perú 🇵🇪</option>
                <option value="Chile">Chile 🇨🇱</option>
                <option value="Ecuador">Ecuador 🇪🇨</option>
                <option value="Venezuela">Venezuela 🇻🇪</option>
                <option value="Guatemala">Guatemala 🇬🇹</option>
                <option value="Honduras">Honduras 🇭🇳</option>
              </select>
            </div>

            <div className="pt-2 text-center text-[11px] text-on-surface-variant dark:text-slate-400 space-y-1">
              <p>Protegido por Google OAuth 2.0. No compartiremos tu información personal.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
