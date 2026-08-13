import React, { useState } from "react";
import {
  ThumbsUp,
  MessageSquarePlus,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Send,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  FileCheck,
  Bug,
  Heart,
  X
} from "lucide-react";
import { FeedbackSuggestion, GoogleUser } from "../types";

interface FeedbackHubProps {
  currentUser: GoogleUser | null;
  onOpenAuthModal: () => void;
}

const INITIAL_SUGGESTIONS: FeedbackSuggestion[] = [
  {
    id: "sug-1",
    title: "Calculadora de Conversión de Monedas en Vivo (COP, MXN, ARS, PEN a EUR/USD)",
    description: "Sería genial poder ver los presupuestos mensuales de alquiler y manutención en la moneda local de mi país con el tipo de cambio oficial actualizado.",
    category: "feature",
    authorName: "Camila R.",
    authorCountry: "Colombia",
    upvotes: 42,
    hasUpvoted: false,
    status: "en_desarrollo",
    officialResponse: "¡Gran idea! Ya estamos integrando la API de tipos de cambio para el calculador de costos de vida.",
    createdAt: "10 ago 2026"
  },
  {
    id: "sug-2",
    title: "Agregar Guía Paso a Paso para Visas Working Holiday y Nómada Digital en Portugal e Italia",
    description: "Muchos latinoamericanos buscamos opciones en el sur de Europa donde el clima y el costo de vida son muy accesibles.",
    category: "visa_update",
    authorName: "Mateo Silva",
    authorCountry: "Argentina",
    upvotes: 38,
    hasUpvoted: false,
    status: "revisando",
    createdAt: "11 ago 2026"
  },
  {
    id: "sug-3",
    title: "Notificaciones y Recordatorios en Google Calendar para Cierre de Becas",
    description: "Poder agendar con un solo clic en mi calendario la fecha de cierre de la beca con 7 días de anticipación.",
    category: "feature",
    authorName: "Valeria Gómez",
    authorCountry: "México",
    upvotes: 65,
    hasUpvoted: true,
    status: "implementado",
    officialResponse: "✅ ¡Ya implementado! En cada tarjeta de beca ahora puedes hacer clic en 'Agendar en Google Calendar'.",
    createdAt: "05 ago 2026"
  },
  {
    id: "sug-4",
    title: "Sección especial con checklist para familias que viajan con niños pequeños (colegios y vacunas)",
    description: "Información clara sobre la inscripción al colegio público y cómo apostillar actas de nacimiento.",
    category: "visa_update",
    authorName: "Diego & Laura",
    authorCountry: "Perú",
    upvotes: 29,
    hasUpvoted: false,
    status: "implementado",
    officialResponse: "✅ ¡Incorporado en el nuevo Planificador de Migración 360°!",
    createdAt: "08 ago 2026"
  }
];

export const FeedbackHub: React.FC<FeedbackHubProps> = ({
  currentUser,
  onOpenAuthModal
}) => {
  const [suggestions, setSuggestions] = useState<FeedbackSuggestion[]>(() => {
    try {
      const saved = localStorage.getItem("latinomigra_feedback_suggestions");
      return saved ? JSON.parse(saved) : INITIAL_SUGGESTIONS;
    } catch {
      return INITIAL_SUGGESTIONS;
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newCat, setNewCat] = useState<FeedbackSuggestion["category"]>("feature");
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  const categories = [
    { id: "todas", label: "Todas las Ideas", icon: <Filter className="w-4 h-4" /> },
    { id: "feature", label: "💡 Nuevas Funciones", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "scholarship", label: "🎓 Becas & Convenios", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "visa_update", label: "📝 Guías de Visas", icon: <FileCheck className="w-4 h-4" /> },
    { id: "bug", label: "🐛 Errores Técnicos", icon: <Bug className="w-4 h-4" /> },
    { id: "testimonial", label: "❤️ Testimonios", icon: <Heart className="w-4 h-4" /> }
  ];

  const handleUpvote = (id: string) => {
    setSuggestions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          const isUpvoted = s.hasUpvoted;
          return {
            ...s,
            upvotes: isUpvoted ? s.upvotes - 1 : s.upvotes + 1,
            hasUpvoted: !isUpvoted
          };
        }
        return s;
      });
      try {
        localStorage.setItem("latinomigra_feedback_suggestions", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleCreateSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const item: FeedbackSuggestion = {
      id: `sug-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      category: newCat,
      authorName: currentUser?.name || "Viajero Comunitario",
      authorCountry: currentUser?.countryOfOrigin || "Latinoamérica",
      upvotes: 1,
      hasUpvoted: true,
      status: "revisando",
      createdAt: "Hoy"
    };

    const updated = [item, ...suggestions];
    setSuggestions(updated);
    try {
      localStorage.setItem("latinomigra_feedback_suggestions", JSON.stringify(updated));
    } catch {}

    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      setShowNewModal(false);
      setNewTitle("");
      setNewDesc("");
    }, 1800);
  };

  const filtered = suggestions.filter((s) => {
    const matchesCat = selectedCategory === "todas" || s.category === selectedCategory;
    const matchesSearch =
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.authorCountry.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  }).sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Buzón Comunitario & Sistema de Votación</span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
            Sugerencias y Feedback para Mejorar LatinoMigra
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-sm md:text-base mt-1">
            ¿Cómo manejamos el feedback para que no sean miles de mensajes repetidos? <strong>Vota las ideas de la comunidad</strong> (👍) para priorizar las más pedidas o propón una nueva idea si no existe.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              onOpenAuthModal();
            } else {
              setShowNewModal(true);
            }
          }}
          id="propose-idea-btn"
          className="flex items-center gap-2 bg-secondary dark:bg-teal-500 text-white dark:text-slate-950 px-5 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-md shrink-0 self-start md:self-auto"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span>Proponer Nueva Idea</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? "bg-primary dark:bg-sky-600 text-white shadow-sm"
                  : "bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar ideas o temas..."
            className="w-full pl-9 pr-4 py-2 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-secondary dark:text-slate-100"
          />
        </div>
      </div>

      {/* Feedback List with Upvoting Cards */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant dark:hover:border-slate-700 rounded-2xl p-5 md:p-6 transition-all shadow-sm flex items-start gap-4"
          >
            {/* Upvote Button Box */}
            <button
              onClick={() => handleUpvote(item.id)}
              title="Votar por esta sugerencia"
              className={`flex flex-col items-center justify-center w-14 py-2.5 rounded-2xl border transition-all shrink-0 ${
                item.hasUpvoted
                  ? "bg-secondary dark:bg-teal-500 border-secondary text-white dark:text-slate-950 shadow-md scale-105"
                  : "bg-surface dark:bg-slate-800 border-outline-variant/60 dark:border-slate-700 text-on-surface-variant dark:text-slate-300 hover:border-secondary hover:text-secondary"
              }`}
            >
              <ThumbsUp className="w-5 h-5 mb-1" />
              <span className="font-extrabold text-sm">{item.upvotes}</span>
              <span className="text-[9px] font-medium uppercase">Votos</span>
            </button>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-base md:text-lg text-primary dark:text-sky-300 leading-snug">
                  {item.title}
                </h3>
                
                {/* Status Badge */}
                <div>
                  {item.status === "implementado" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Implementado
                    </span>
                  )}
                  {item.status === "en_desarrollo" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                      <Clock className="w-3.5 h-3.5" /> En Desarrollo
                    </span>
                  )}
                  {item.status === "revisando" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                      🔍 En Revisión
                    </span>
                  )}
                </div>
              </div>

              <p className="text-on-surface-variant dark:text-slate-300 text-sm leading-relaxed">
                {item.description}
              </p>

              {/* Official response note if available */}
              {item.officialResponse && (
                <div className="mt-3 p-3 bg-secondary/10 dark:bg-teal-950/30 border border-secondary/30 dark:border-teal-800 rounded-xl text-xs text-primary dark:text-teal-200">
                  <strong>Respuesta del equipo LatinoMigra:</strong> {item.officialResponse}
                </div>
              )}

              {/* Author & Meta */}
              <div className="flex items-center gap-3 text-xs text-on-surface-variant/80 dark:text-slate-400 pt-1">
                <span>Por <strong>{item.authorName}</strong> ({item.authorCountry})</span>
                <span>•</span>
                <span>{item.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Propose Idea Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 md:p-8 border border-outline-variant/60 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowNewModal(false)}
              aria-label="Cerrar modal de sugerencia"
              className="absolute top-5 right-5 p-2 text-on-surface-variant hover:text-on-surface rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-secondary dark:text-teal-400 text-xs font-bold uppercase mb-1">
              <Lightbulb className="w-4 h-4" />
              <span>Proponer Idea o Sugerencia</span>
            </div>
            <h2 className="font-headline-sm text-2xl font-bold text-primary dark:text-sky-300 mb-4">
              ¿Qué te gustaría ver en LatinoMigra?
            </h2>

            {successNotice ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200">¡Sugerencia Registrada!</h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Tu idea ya está visible para que otros miembros de la comunidad puedan votar por ella.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateSuggestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-slate-100"
                  >
                    <option value="feature">💡 Nueva Función o Herramienta</option>
                    <option value="scholarship">🎓 Sugerir Nueva Beca o Convenio</option>
                    <option value="visa_update">📝 Actualizar Guía de Visado o Requisito</option>
                    <option value="bug">🐛 Reportar Error o Corrección</option>
                    <option value="testimonial">❤️ Compartir Historia / Testimonio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 mb-1">
                    Título de la Idea (Claro y Conciso)
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej: Agregar comparador de alquileres por barrio"
                    className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 mb-1">
                    Detalle o justificación
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Explica cómo beneficiaría esto a otros viajeros y estudiantes..."
                    className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-on-surface-variant dark:text-slate-400 hover:bg-surface-container"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-primary dark:bg-sky-600 text-white hover:opacity-90"
                  >
                    Publicar Sugerencia
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
