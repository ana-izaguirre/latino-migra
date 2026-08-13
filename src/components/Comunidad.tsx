import React, { useState } from "react";
import { MessageSquare, Heart, Share2, Plus, Search, Filter, MapPin, Sparkles, User, CheckCircle2 } from "lucide-react";
import { ForumPost } from "../types";

export const Comunidad: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showNewPostModal, setShowNewPostModal] = useState<boolean>(false);

  const posts: ForumPost[] = [
    {
      id: "post-1",
      title: "¿Cómo fue el proceso de empadronamiento en Madrid siendo estudiante?",
      author: "Carlos Mendoza (Colombia)",
      country: "España",
      city: "Madrid",
      date: "Hace 2 horas",
      likes: 24,
      replies: 8,
      category: "Dudas de Visas",
      content: "Les comparto mi experiencia tramitando el empadronamiento en la Junta Municipal de Moncloa. Alquilé una habitación con contrato subarrendado y el propietario tuvo que autorizarme con copia de su DNI. ¡Sin cita previa no te atienden!"
    },
    {
      id: "post-2",
      title: "Mi experiencia aplicando a la Beca DAAD en Alemania desde México",
      author: "Sofia Ramírez (México)",
      country: "Alemania",
      city: "Múnich",
      date: "Ayer",
      likes: 56,
      replies: 19,
      category: "Experiencias Reales",
      content: "El proceso tomó aprox 7 meses desde que envié mi solicitud hasta la carta de aprobación. La clave para la carta de motivación fue enfocarla en cómo aplicaré el conocimiento en mi país. ¡Ánimo a todos los que están postulando!"
    },
    {
      id: "post-3",
      title: "Supermercados baratos y consejos de ahorro en Berlín para latinoamericanos",
      author: "Mateo Silva (Chile)",
      country: "Alemania",
      city: "Berlín",
      date: "Hace 3 días",
      likes: 41,
      replies: 12,
      category: "Costo de Vida",
      content: "Lidl y Aldi son las mejores opciones para compras semanales. Para productos latinoamericanos (harina pan, plátano verde, frijoles), la zona de Neukölln tiene tiendas especializadas a muy buen precio."
    }
  ];

  const categories = ["Todas", "Dudas de Visas", "Experiencias Reales", "Costo de Vida", "Alojamiento"];

  const filteredPosts = posts.filter((p) => {
    const matchesCategory = selectedCategory === "Todas" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Comunidad LatinoMigra</span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
            Foros y Experiencias de Migrantes
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-sm mt-1">
            Conéctate con miles de latinoamericanos compartiendo consejos reales sobre alojamientos, trámites y vida estudiantil.
          </p>
        </div>

        <button
          onClick={() => setShowNewPostModal(true)}
          id="new-post-forum-btn"
          className="inline-flex items-center gap-2 bg-primary dark:bg-sky-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-primary-container transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Crear Publicación</span>
        </button>
      </div>

      {/* Filter Categories Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedCategory === cat
                  ? "bg-primary dark:bg-sky-600 text-white"
                  : "bg-surface-container-lowest dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700 hover:bg-surface-container"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tema o ciudad..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-sm"
          />
        </div>
      </div>

      {/* Forum Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-primary dark:text-sky-300">{post.author}</h4>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {post.city}, {post.country}
                    </span>
                    <span>• {post.date}</span>
                  </div>
                </div>
              </div>

              <span className="bg-secondary-container/30 dark:bg-teal-500/20 text-secondary dark:text-teal-300 text-xs px-3 py-1 rounded-full font-bold">
                {post.category}
              </span>
            </div>

            <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">{post.title}</h3>
            <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">{post.content}</p>

            <div className="flex items-center gap-6 pt-2 border-t border-outline-variant/20 dark:border-slate-700/50 text-xs font-semibold text-on-surface-variant dark:text-slate-400">
              <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                <Heart className="w-4 h-4" />
                <span>{post.likes} Me gusta</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary dark:hover:text-sky-300 transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>{post.replies} Respuestas</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary dark:hover:text-sky-300 transition-colors ml-auto">
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-outline-variant/40 dark:border-slate-700">
            <h3 className="font-headline-md text-xl font-bold text-primary dark:text-sky-300">
              Crear Nueva Publicación en la Comunidad
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Título descriptivo..."
                className="w-full p-3 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-sm"
              />
              <textarea
                rows={4}
                placeholder="Escribe tu consulta o consejo para otros latinoamericanos..."
                className="w-full p-3 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewPostModal(false)}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="bg-primary dark:bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary-container"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
