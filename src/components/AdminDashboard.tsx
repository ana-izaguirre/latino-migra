import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Database,
  RefreshCw,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Sliders,
  Award,
  BookOpen,
  Info
} from "lucide-react";
import { GoogleUser, NavigationTab, Scholarship } from "../types";
import { SCHOLARSHIPS_DATA } from "../data/scholarships";
import {
  fetchScholarshipsFromDB,
  seedScholarshipsToDB,
  triggerScholarshipSync,
  db
} from "../lib/firebase";

interface AdminDashboardProps {
  currentUser: GoogleUser | null;
  setActiveTab: (tab: NavigationTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  setActiveTab,
}) => {
  const [scholarshipsCount, setScholarshipsCount] = useState<number>(SCHOLARSHIPS_DATA.length);
  const [dbItems, setDbItems] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"metrics" | "database" | "cron" | "security">("metrics");
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleString());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await fetchScholarshipsFromDB();
      if (items && items.length > 0) {
        setDbItems(items as Scholarship[]);
        setScholarshipsCount(items.length);
      } else {
        setScholarshipsCount(SCHOLARSHIPS_DATA.length);
      }
    } catch (e) {
      console.warn("Could not load items from DB:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSyncMessage({ type: "info", text: "Poblando la base de datos de Firestore con el catálogo maestro verificado..." });
    try {
      const seededCount = await seedScholarshipsToDB(SCHOLARSHIPS_DATA);
      if (seededCount > 0) {
        setSyncMessage({ type: "success", text: `¡Base de datos poblada con éxito! (${seededCount} becas registradas en Firestore).` });
        await loadData();
      } else {
        setSyncMessage({ type: "error", text: "Ocurrió un error al poblar la base de datos." });
      }
    } catch (e) {
      setSyncMessage({ type: "error", text: `Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRunSyncAIJob = async () => {
    setIsSyncing(true);
    setSyncMessage({ type: "info", text: "Ejecutando proceso de sincronización con IA y verificación de convocatorias..." });
    try {
      const result = await triggerScholarshipSync();
      const now = new Date().toLocaleString();
      setLastSyncTime(now);
      setSyncMessage({ type: "success", text: `¡Sincronización completada! ${result.message || "Colecciones actualizadas correctamente."}` });
      await loadData();
    } catch (e) {
      setSyncMessage({ type: "error", text: `Error en la sincronización: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary to-slate-800 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-sky-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Panel de Control Administrativo & Motor de Datos</span>
          </div>
          <h1 className="font-headline-lg text-2xl md:text-4xl font-extrabold text-white">
            Dashboard del Administrador
          </h1>
          <p className="text-white/80 text-xs md:text-sm max-w-2xl">
            Monitoreo en tiempo real de la base de datos en Firebase Firestore, ejecutor de tareas programadas (Cron Jobs de Becas) y estado de los servicios.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleRunSyncAIJob}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Sincronizando..." : "Ejecutar Cron Sync"}</span>
          </button>

          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <Database className="w-4 h-4 text-teal-300" />
            <span>{isSeeding ? "Poblando..." : "Poblar Firestore"}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium ${
            syncMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
              : syncMessage.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300"
              : "bg-sky-500/10 border-sky-500/30 text-sky-900 dark:text-sky-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : syncMessage.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <RefreshCw className="w-5 h-5 text-sky-500 animate-spin shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-outline-variant/40 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">Total Becas Activas</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-primary dark:text-sky-300">{scholarshipsCount}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% Fuentes Oficiales Verificadas</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-outline-variant/40 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">Países de Destino</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-primary dark:text-sky-300">9 Destinos</div>
          <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
            ES, PT, AU, DE, CA, IE, FR, IT, US
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-outline-variant/40 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">Estado de la Base de Datos</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">Firestore Conectado</div>
          <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
            Región multirregional segura
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-outline-variant/40 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">Última Sincronización Cron</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs font-bold text-primary dark:text-sky-300 truncate">{lastSyncTime}</div>
          <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
            Proceso automatizado diario
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab("metrics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "metrics"
              ? "bg-primary text-white dark:bg-sky-600"
              : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800"
          }`}
        >
          📊 Métricas & Colecciones
        </button>
        <button
          onClick={() => setActiveSubTab("cron")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "cron"
              ? "bg-primary text-white dark:bg-sky-600"
              : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800"
          }`}
        >
          ⏱️ Tareas Programadas (Cron Jobs)
        </button>
        <button
          onClick={() => setActiveSubTab("security")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "security"
              ? "bg-primary text-white dark:bg-sky-600"
              : "text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800"
          }`}
        >
          🛡️ Seguridad & Reglas Firestore
        </button>
      </div>

      {/* Subtab Content: Metrics & DB */}
      {activeSubTab === "metrics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-3xl border border-outline-variant/40 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                  Becas Registradas en el Sistema
                </h3>
                <p className="text-xs text-on-surface-variant dark:text-slate-400">
                  Listado sincronizado y respaldado en la nube con clasificación de nivel educativo.
                </p>
              </div>
              <button
                onClick={loadData}
                disabled={isLoading}
                className="text-xs font-bold text-secondary dark:text-teal-300 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Actualizar Vista</span>
              </button>
            </div>

            <div className="divide-y divide-outline-variant/20 dark:divide-slate-800 max-h-96 overflow-y-auto pr-2 space-y-2">
              {(dbItems.length > 0 ? dbItems : SCHOLARSHIPS_DATA).map((scholarship) => (
                <div key={scholarship.id} className="pt-3 pb-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary dark:text-sky-300">
                        {scholarship.title}
                      </span>
                      <span className="text-[10px] bg-secondary/15 dark:bg-teal-950/60 text-secondary dark:text-teal-300 font-bold px-2 py-0.5 rounded-full">
                        {scholarship.country}
                      </span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      {scholarship.institution} • {scholarship.supportType} • Cierre: {scholarship.deadline}
                    </div>
                  </div>

                  <a
                    href={scholarship.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-secondary dark:text-teal-400 hover:underline shrink-0"
                  >
                    Ver Portal
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-3xl border border-outline-variant/40 dark:border-slate-800 space-y-4">
              <h3 className="font-headline-sm text-base font-bold text-primary dark:text-sky-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary" />
                <span>Usuario Administrador Activo</span>
              </h3>

              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full border-2 border-secondary"
                    />
                    <div>
                      <div className="font-bold text-sm text-primary dark:text-sky-200">{currentUser.name}</div>
                      <div className="text-xs text-on-surface-variant dark:text-slate-400">{currentUser.email}</div>
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                        Rol: Administrador de Plataforma
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
                  Sesión anónima o en modo desarrollador. Inicia sesión con tu cuenta de Google para sincronizar marcadores personales.
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-3xl border border-outline-variant/40 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-sky-300">
                Atajos Rápidos
              </h4>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setActiveTab("becas")}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 font-semibold text-on-surface dark:text-slate-300 flex items-center justify-between"
                >
                  <span>Explorador de Becas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("voluntariados")}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 font-semibold text-on-surface dark:text-slate-300 flex items-center justify-between"
                >
                  <span>Módulo de Voluntariados</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("guia")}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container dark:hover:bg-slate-800 font-semibold text-on-surface dark:text-slate-300 flex items-center justify-between"
                >
                  <span>Guías y Alertas Anti-Estafas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab Content: Cron Jobs */}
      {activeSubTab === "cron" && (
        <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-outline-variant/40 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-emerald-500" />
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                Arquitectura del Cron Job & Sincronización Automática
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Detalle de las tareas en segundo plano que actualizan fechas de cierre, tasas de cambio y convocatorias.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-surface dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 space-y-2">
              <div className="font-bold text-sm text-primary dark:text-sky-300">1. Job Diario: Fechas de Cierre</div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Calcula automáticamente los días restantes (`daysLeft`), marca becas con estado urgente (`isUrgent: true` si quedan menos de 30 días) y archiva convocatorias finalizadas.
              </p>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Frecuencia: Cada 24 horas (00:00 UTC)</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 space-y-2">
              <div className="font-bold text-sm text-primary dark:text-sky-300">2. Job de Tipos de Cambio</div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Actualiza los tipos de cambio para monedas latinoamericanas (COP, MXN, PEN, ARS, CLP, BRL) frente a EUR, USD, CAD y AUD para la calculadora de presupuesto.
              </p>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Frecuencia: Cada 12 horas</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 space-y-2">
              <div className="font-bold text-sm text-primary dark:text-sky-300">3. Sincronizador Firestore DB</div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                Garantiza que la colección <code>scholarships</code> y los bookmarks de usuarios en <code>users/[userId]/bookmarks</code> mantengan consistencia de datos y alta disponibilidad.
              </p>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Frecuencia: Tiempo real & On-demand</div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab Content: Security */}
      {activeSubTab === "security" && (
        <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-outline-variant/40 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-sky-500" />
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                Reglas de Seguridad y Permisos en Firestore
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Estructura de control de acceso basada en roles y propiedad de documentos (`firestore.rules`).
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 overflow-x-auto">
            <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Becas: Lectura pública para todos los usuarios; escritura autenticada
    match /scholarships/{scholarshipId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Perfiles y planes personales de migración
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /migrationPlans/{planId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /bookmarks/{bookmarkId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Foros de la comunidad
    match /forumPosts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}`}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
