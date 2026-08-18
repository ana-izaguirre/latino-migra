import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Heart,
  Share2,
  Plus,
  Search,
  Filter,
  MapPin,
  Sparkles,
  User,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  CornerDownRight,
  Send,
  X,
  ThumbsUp,
  BookmarkCheck,
  Cloud,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ForumPost, NavigationTab, GoogleUser } from "../types";
import { Breadcrumbs } from "./Breadcrumbs";
import { isAdmin } from "../lib/authUtils";
import { useBodyScrollLock } from "../lib/useBodyScrollLock";
import { useLanguage } from "../lib/i18n";
import {
  fetchCommunityPosts,
  fetchCommunityPostsPaginated,
  createCommunityPost,
  likeCommunityPost,
  fetchPostReplies,
  addPostReply,
  CloudForumPost,
  CloudForumReply,
  auth,
} from "../lib/firebase";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

const INITIAL_SEED_POSTS: Omit<CloudForumPost, "id">[] = [
  {
    title: "¿Cómo fue el proceso de empadronamiento en Madrid siendo estudiante?",
    author: "Carlos Mendoza (Colombia)",
    authorCountry: "Colombia",
    country: "España",
    city: "Madrid",
    likes: 24,
    replies: 2,
    category: "Dudas de Visas",
    content:
      "Les comparto mi experiencia tramitando el empadronamiento en la Junta Municipal de Moncloa. Alquilé una habitación con contrato subarrendado y el propietario tuvo que autorizarme con copia de su DNI. ¡Sin cita previa no te atienden!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    title: "Mi experiencia aplicando a la Beca DAAD en Alemania desde México",
    author: "Sofia Ramírez (México)",
    authorCountry: "México",
    country: "Alemania",
    city: "Múnich",
    likes: 56,
    replies: 0,
    category: "Experiencias Reales",
    content:
      "El proceso tomó aprox 7 meses desde que envié mi solicitud hasta la carta de aprobación. La clave para la carta de motivación fue enfocarla en cómo aplicaré el conocimiento en mi país. ¡Ánimo a todos los que están postulando!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    title: "Supermercados baratos y consejos de ahorro en Berlín para latinoamericanos",
    author: "Mateo Silva (Chile)",
    authorCountry: "Chile",
    country: "Alemania",
    city: "Berlín",
    likes: 41,
    replies: 0,
    category: "Costo de Vida",
    content:
      "Lidl y Aldi son las mejores opciones para compras semanales. Para productos latinoamericanos (harina pan, plátano verde, frijoles), la zona de Neukölln tiene tiendas especializadas a muy buen precio.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    title: "Cursos de inglés Stamp 2 en Dublín: ¿Es fácil conseguir trabajo de 20h semanales?",
    author: "Valeria Gómez (Perú)",
    authorCountry: "Perú",
    country: "Irlanda",
    city: "Dublín",
    likes: 38,
    replies: 1,
    category: "Dudas de Visas",
    content:
      "Llegué hace 3 semanas con el visado Stamp 2 de 8 meses. Tramité el IRP y el PPSN. En hostelería y cafeterías contratan rápido si tienes buen nivel conversacional (mínimo B1).",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    title: "Alquiler de habitaciones para parejas en Montreal y Toronto",
    author: "Andrés & Lucía (Ecuador)",
    authorCountry: "Ecuador",
    country: "Canadá",
    city: "Montreal",
    likes: 29,
    replies: 0,
    category: "Alojamiento",
    content:
      "Si vienen con permiso de estudios + permiso de trabajo abierto para la pareja, les recomendamos buscar por Kijiji o Marketplace con 1 mes de anticipación. En Montreal no suelen pedir fiador si pagan depósito inicial.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

interface ComunidadProps {
  currentUser?: GoogleUser | null;
  setActiveTab?: (tab: NavigationTab) => void;
}

export const Comunidad: React.FC<ComunidadProps> = ({ currentUser, setActiveTab }) => {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showNewPostModal, setShowNewPostModal] = useState<boolean>(false);

  useBodyScrollLock(showNewPostModal);
  const [expandedRepliesPostId, setExpandedRepliesPostId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState<string>("");

  // Loading and error states for Firestore
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMorePosts, setHasMorePosts] = useState<boolean>(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null
  );
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);
  const [loadingRepliesPostId, setLoadingRepliesPostId] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // Post form state
  const [postTitle, setPostTitle] = useState<string>("");
  const [postContent, setPostContent] = useState<string>("");
  const [postCategory, setPostCategory] = useState<string>("Dudas de Visas");
  const [postCountry, setPostCountry] = useState<string>("España");
  const [postCity, setPostCity] = useState<string>("Madrid");
  const [postAuthor, setPostAuthor] = useState<string>("");
  const [postAuthorCountry, setPostAuthorCountry] = useState<string>("España");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Main Posts state directly synced with Cloud Firestore
  const [posts, setPosts] = useState<ForumPost[]>([]);

  // Cached replies loaded on demand from Firestore subcollections
  const [postReplies, setPostReplies] = useState<
    Record<string, { id: string; author: string; text: string; time: string }[]>
  >({});

  // Format relative timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return "Recién publicado";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Reciente";
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Hace un momento";
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
  };

  // Load first page of posts from Firestore on component mount (6 posts per page for efficient reading)
  const loadPostsFromCloud = async () => {
    setIsLoadingPosts(true);
    try {
      const result = await fetchCommunityPostsPaginated(6, null, selectedCategory);
      setLastVisibleDoc(result.lastDoc);
      setHasMorePosts(result.hasMore);

      if (result.posts.length > 0) {
        setPosts(
          result.posts.map((cp) => ({
            id: cp.id,
            title: cp.title,
            author: cp.author,
            country: cp.country,
            city: cp.city,
            date: formatTime(cp.createdAt),
            likes: cp.likes,
            replies: cp.replies,
            category: cp.category,
            content: cp.content,
          }))
        );
      } else {
        // Automatically seed initial discussions into Firestore if empty
        const seeded: ForumPost[] = [];
        for (const seed of INITIAL_SEED_POSTS) {
          try {
            const id = await createCommunityPost(seed);
            seeded.push({
              id,
              title: seed.title,
              author: seed.author,
              country: seed.country,
              city: seed.city,
              date: formatTime(seed.createdAt),
              likes: seed.likes,
              replies: seed.replies,
              category: seed.category,
              content: seed.content,
            });
          } catch {
            // fallback
          }
        }
        if (seeded.length > 0) {
          setPosts(seeded);
        }
      }
    } catch (e) {
      console.error("Error loading cloud community posts:", e);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Load subsequent page on demand
  const handleLoadMore = async () => {
    if (!lastVisibleDoc || isLoadingMore || !hasMorePosts) return;

    setIsLoadingMore(true);
    try {
      const result = await fetchCommunityPostsPaginated(6, lastVisibleDoc, selectedCategory);
      setLastVisibleDoc(result.lastDoc);
      setHasMorePosts(result.hasMore);

      const nextPosts = result.posts.map((cp) => ({
        id: cp.id,
        title: cp.title,
        author: cp.author,
        country: cp.country,
        city: cp.city,
        date: formatTime(cp.createdAt),
        likes: cp.likes,
        replies: cp.replies,
        category: cp.category,
        content: cp.content,
      }));

      setPosts((prev) => [...prev, ...nextPosts]);
    } catch (e) {
      console.error("Error loading more posts:", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPostsFromCloud();
  }, []);

  // Lazy load replies from Firestore only when a post is expanded
  const handleToggleReplies = async (postId: string) => {
    if (expandedRepliesPostId === postId) {
      setExpandedRepliesPostId(null);
      return;
    }

    setExpandedRepliesPostId(postId);

    // If replies are already cached for this session, don't re-fetch (saves Firestore reads)
    if (postReplies[postId]) return;

    setLoadingRepliesPostId(postId);
    try {
      const replies = await fetchPostReplies(postId);
      setPostReplies((prev) => ({
        ...prev,
        [postId]: replies.map((r) => ({
          id: r.id,
          author: r.author,
          text: r.text,
          time: formatTime(r.createdAt),
        })),
      }));
    } catch (err) {
      console.error("Error loading replies for post:", postId, err);
    } finally {
      setLoadingRepliesPostId(null);
    }
  };

  const categories = [
    "Todas",
    "Dudas de Visas",
    "Experiencias Reales",
    "Costo de Vida",
    "Alojamiento",
    "Becas y Convocatorias",
  ];

  // Real-time duplicate detection: matches existing posts with similar keywords
  const potentialDuplicates = posts.filter((p) => {
    if (!postTitle.trim() || postTitle.trim().length < 4) return false;
    const words = postTitle
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const postTitleLower = p.title.toLowerCase();
    const postContentLower = p.content.toLowerCase();
    return words.some((word) => postTitleLower.includes(word) || postContentLower.includes(word));
  });

  const filteredPosts = posts.filter((p) => {
    const matchesCategory = selectedCategory === "Todas" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim() || isSubmittingPost) return;

    setIsSubmittingPost(true);
    const authorName = postAuthor.trim()
      ? `${postAuthor.trim()} (${postAuthorCountry})`
      : `Migrante Anónimo (${postAuthorCountry})`;

    const newPostPayload = {
      title: postTitle.trim(),
      author: authorName,
      authorCountry: postAuthorCountry,
      country: postCountry,
      city: postCity.trim() || "Principal",
      likes: 1,
      replies: 0,
      category: postCategory,
      content: postContent.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const createdId = await createCommunityPost(newPostPayload);

      const createdPost: ForumPost = {
        id: createdId,
        title: newPostPayload.title,
        author: newPostPayload.author,
        country: newPostPayload.country,
        city: newPostPayload.city,
        date: "Recién publicado",
        likes: 1,
        replies: 0,
        category: newPostPayload.category,
        content: newPostPayload.content,
      };

      setPosts([createdPost, ...posts]);
      setPostTitle("");
      setPostContent("");
      setShowNewPostModal(false);
    } catch (err) {
      console.error("Error creating post in Firestore:", err);
      alert("Hubo un error guardando tu publicación en la nube. Intenta de nuevo.");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleLike = async (id: string) => {
    const alreadyLiked = likedPosts[id];
    setLikedPosts((prev) => ({ ...prev, [id]: !alreadyLiked }));
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: alreadyLiked ? p.likes - 1 : p.likes + 1 } : p))
    );

    if (!alreadyLiked) {
      try {
        await likeCommunityPost(id);
      } catch (err) {
        console.error("Error liking post in Firestore:", err);
      }
    }
  };

  const handleAddReply = async (postId: string) => {
    if (!replyInput.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    const replyAuthor = postAuthor.trim() ? `${postAuthor.trim()} (Tú)` : "Compañero Latino";
    const text = replyInput.trim();

    try {
      const replyId = await addPostReply(postId, replyAuthor, text);

      const newReply = {
        id: replyId,
        author: replyAuthor,
        text,
        time: "Justo ahora",
      };

      setPostReplies((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newReply],
      }));

      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, replies: p.replies + 1 } : p)));

      setReplyInput("");
    } catch (err) {
      console.error("Error adding reply to Firestore:", err);
      alert("Error al enviar la respuesta a la nube.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      {setActiveTab && <Breadcrumbs activeTab="comunidad" setActiveTab={setActiveTab} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>
              {language === "en" ? "LatinoMigra Community Forum" : "Comunidad LatinoMigra"}
            </span>
            {isAdmin(currentUser) && (
              <span className="inline-flex items-center gap-1 ml-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-300 dark:border-emerald-800">
                <Cloud className="w-3 h-3" />
                <span>
                  {language === "en"
                    ? "Cloud Firestore (Permanent)"
                    : "Nube Firestore (Permanente)"}
                </span>
              </span>
            )}
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
            {t("community.title", "Foros y Experiencias de Migrantes")}
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-sm mt-1">
            {t(
              "community.subtitle",
              "Conéctate con miles de latinoamericanos compartiendo consejos reales sobre alojamientos, trámites y vida estudiantil."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPostsFromCloud}
            disabled={isLoadingPosts}
            title={language === "en" ? "Refresh community from cloud" : "Recargar desde la nube"}
            className="p-3 bg-surface-container-lowest dark:bg-slate-800 text-on-surface-variant dark:text-slate-200 border border-outline-variant/40 dark:border-slate-700 rounded-2xl hover:bg-surface-container transition-all cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingPosts ? "animate-spin text-secondary" : ""}`}
            />
          </button>

          <button
            onClick={() => setShowNewPostModal(true)}
            id="new-post-forum-btn"
            className="inline-flex items-center gap-2 bg-primary dark:bg-sky-600 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-primary-container dark:hover:bg-sky-500 transition-all shadow-md shrink-0 cursor-pointer hover:scale-102 active:scale-98"
          >
            <Plus className="w-5 h-5" />
            <span>{t("community.createBtn", "Crear Publicación")}</span>
          </button>
        </div>
      </div>

      {/* Guide Banner: ¿Cómo funciona la comunidad y cómo crear preguntas? */}
      <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-3xl border border-outline-variant/40 dark:border-slate-700 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-outline-variant/20 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-secondary dark:text-teal-400" />
            <span>
              {language === "en"
                ? "How to participate and create posts effectively:"
                : "¿Cómo participar y crear publicaciones efectivas?"}
            </span>
          </div>
          <span className="text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>
              {language === "en"
                ? "Duplicate Prevention & Cloud Storage"
                : "Prevención de Duplicados & Almacenamiento en la Nube"}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface dark:bg-slate-900 border border-outline-variant/30 space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 font-bold flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-primary dark:text-sky-300">
              {language === "en" ? "1. Search Before Posting" : "1. Busca antes de preguntar"}
            </h4>
            <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
              {language === "en"
                ? "Type keywords like 'Empadronamiento', 'DAAD', 'Dublín Stamp 2'. The system flags existing answers automatically."
                : "Escribe palabras clave como 'Empadronamiento', 'DAAD', 'Dublín Stamp 2'. El sistema te mostrará si ya fue respondido."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface dark:bg-slate-900 border border-outline-variant/30 space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-secondary/10 dark:bg-teal-500/20 text-secondary dark:text-teal-300 font-bold flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-primary dark:text-sky-300">
              {language === "en" ? "2. Click 'Create Post'" : "2. Haz clic en 'Crear Publicación'"}
            </h4>
            <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
              {language === "en"
                ? "Specify your target country, city, and situation (e.g. studying solo or moving with family)."
                : "Indica tu país de destino, ciudad y situación (ej. estudiante en solitario o familia con hijos)."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface dark:bg-slate-900 border border-outline-variant/30 space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center">
              3
            </div>
            <h4 className="font-bold text-primary dark:text-sky-300">
              {language === "en"
                ? "3. Permanent Cloud Storage"
                : "3. Guardado Permanente y Escalable"}
            </h4>
            <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
              {language === "en"
                ? "All posts and replies are saved permanently in Firestore without using local browser storage."
                : "Todas las publicaciones se guardan permanentemente en Firestore en la nube, visibles desde cualquier dispositivo."}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Categories Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary dark:bg-sky-600 text-white shadow-xs"
                  : "bg-surface-container-lowest dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700 hover:bg-surface-container"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("community.searchPlaceholder", "Buscar tema o ciudad...")}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
          />
        </div>
      </div>

      {/* Forum Posts List */}
      <div className="space-y-5">
        {isLoadingPosts ? (
          <div className="text-center py-16 bg-surface-container-lowest dark:bg-slate-800 rounded-3xl border border-outline-variant/30 space-y-3">
            <Loader2 className="w-8 h-8 text-primary dark:text-sky-300 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-on-surface-variant">
              {language === "en"
                ? "Connecting to Cloud Community..."
                : "Cargando temas de la comunidad desde la nube..."}
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest dark:bg-slate-800 rounded-3xl border border-outline-variant/30 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-sm text-primary dark:text-sky-300">
              {language === "en"
                ? "No topics found with that keyword"
                : "No se encontraron temas con esa búsqueda"}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              {language === "en"
                ? "Be the first to start a conversation about this destination or visa process."
                : "Sé el primero en abrir una consulta sobre este destino o trámite."}
            </p>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="px-4 py-2 bg-primary dark:bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-primary-container cursor-pointer"
            >
              {t("community.createBtn", "Crear Publicación")}
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = likedPosts[post.id];
            const repliesList = postReplies[post.id] || [];
            const isRepliesExpanded = expandedRepliesPostId === post.id;
            const isLoadingThisReplies = loadingRepliesPostId === post.id;

            return (
              <div
                key={post.id}
                className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-3xl border border-outline-variant/40 dark:border-slate-700 space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 flex items-center justify-center font-bold text-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-primary dark:text-sky-300">
                        {post.author}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-secondary dark:text-teal-300">
                          <MapPin className="w-3.5 h-3.5" />
                          {post.city}, {post.country}
                        </span>
                        <span>• {post.date}</span>
                      </div>
                    </div>
                  </div>

                  <span className="bg-secondary/10 dark:bg-teal-950/60 text-secondary dark:text-teal-300 border border-secondary/20 text-[11px] px-3 py-1 rounded-full font-bold">
                    {post.category}
                  </span>
                </div>

                <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                  {post.title}
                </h3>
                <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-3 border-t border-outline-variant/20 dark:border-slate-700/50 text-xs font-semibold text-on-surface-variant dark:text-slate-400 flex-wrap">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isLiked
                        ? "bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200 dark:border-red-800"
                        : "hover:bg-surface-container border-transparent"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span>
                      {post.likes} {language === "en" ? "Likes" : "Me gusta"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleToggleReplies(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-surface-container dark:hover:bg-slate-700 transition-colors cursor-pointer text-primary dark:text-sky-300"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {post.replies} {language === "en" ? "Replies" : "Respuestas"}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/#comunidad`);
                      alert(
                        language === "en"
                          ? "Link copied to clipboard!"
                          : "¡Enlace del hilo copiado!"
                      );
                    }}
                    className="flex items-center gap-1.5 hover:text-primary dark:hover:text-sky-300 transition-colors ml-auto cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{language === "en" ? "Share" : "Compartir"}</span>
                  </button>
                </div>

                {/* Expanded Replies Section */}
                {isRepliesExpanded && (
                  <div className="pt-3 mt-2 border-t border-outline-variant/20 dark:border-slate-700/40 space-y-3 animate-in fade-in duration-150">
                    <h5 className="text-xs font-bold text-primary dark:text-sky-300 flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-secondary" />
                      <span>
                        {language === "en"
                          ? "Thread Replies & Experiences (Cloud)"
                          : "Respuestas y Consejos de la Comunidad (Nube)"}
                      </span>
                    </h5>

                    <div className="space-y-2 pl-4 border-l-2 border-secondary/30 dark:border-teal-800">
                      {isLoadingThisReplies ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary" />
                          <span>
                            {language === "en" ? "Loading replies..." : "Cargando respuestas..."}
                          </span>
                        </div>
                      ) : repliesList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          {language === "en"
                            ? "No replies yet. Be the first to advise!"
                            : "Aún no hay respuestas. ¡Sé el primero en aconsejar!"}
                        </p>
                      ) : (
                        repliesList.map((rep) => (
                          <div
                            key={rep.id}
                            className="p-3 bg-surface dark:bg-slate-900 rounded-xl text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold text-primary dark:text-sky-300">
                              <span>{rep.author}</span>
                              <span className="text-slate-400 font-normal">{rep.time}</span>
                            </div>
                            <p className="text-on-surface-variant dark:text-slate-300">
                              {rep.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add reply input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddReply(post.id);
                        }}
                        disabled={isSubmittingReply}
                        placeholder={
                          language === "en"
                            ? "Write a helpful reply or question..."
                            : "Escribe una respuesta o consejo constructivo..."
                        }
                        className="flex-1 px-3.5 py-2 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                      />
                      <button
                        onClick={() => handleAddReply(post.id)}
                        disabled={isSubmittingReply || !replyInput.trim()}
                        className="p-2 bg-primary dark:bg-sky-600 text-white rounded-xl hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Cursor-based pagination footer button */}
        {!isLoadingPosts && hasMorePosts && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              id="load-more-posts-btn"
              className="inline-flex items-center gap-2 bg-surface-container-lowest dark:bg-slate-800 hover:bg-surface-container dark:hover:bg-slate-700 text-primary dark:text-sky-300 px-6 py-3 rounded-2xl border border-outline-variant/60 dark:border-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer hover:scale-102 active:scale-98 disabled:opacity-60"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                  <span>
                    {language === "en" ? "Loading more topics..." : "Cargando más temas..."}
                  </span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-secondary" />
                  <span>
                    {language === "en"
                      ? "Load More Discussions (Paginated)"
                      : "Cargar Más Temas (Paginación Firestore)"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* New Post Modal with Real-time Duplicate Detection */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lm-overlay">
          <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-outline-variant/40 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/30 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-headline-md text-xl font-bold text-primary dark:text-sky-300 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                  <span>
                    {language === "en"
                      ? "Create New Community Topic"
                      : "Nueva Publicación en la Comunidad"}
                  </span>
                </h3>
                <p className="text-xs text-on-surface-variant dark:text-slate-400">
                  {language === "en"
                    ? "Ask a question or share your real-life migration experience (Stored in Cloud Firestore)"
                    : "Consulta una duda o comparte tu experiencia migratoria real (Guardado permanente en la nube)"}
                </p>
              </div>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Title input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-primary dark:text-sky-300">
                  {language === "en"
                    ? "Title / Question *"
                    : "Título de la Consulta o Experiencia *"}
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder={
                    language === "en"
                      ? "e.g., How to get student health insurance in Spain without copays?"
                      : "ej. ¿Cómo tramitar el seguro médico en España sin copagos para la visa?"
                  }
                  className="w-full p-3 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                />
              </div>

              {/* Duplicate Prevention Alert Box */}
              {potentialDuplicates.length > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {t(
                        "community.duplicateAlert",
                        "¡Prevención de Duplicados! Temas similares ya respondidos:"
                      )}
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {potentialDuplicates.slice(0, 2).map((dup) => (
                      <div
                        key={dup.id}
                        className="text-xs text-amber-800 dark:text-amber-200 flex items-start justify-between gap-2"
                      >
                        <span className="font-semibold truncate">• {dup.title}</span>
                        <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded-full font-bold shrink-0">
                          {dup.replies} respuestas
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 pl-6">
                    {language === "en"
                      ? "If your question is different, feel free to proceed with publishing below."
                      : "Si tu caso tiene detalles particulares, puedes continuar publicando sin problemas."}
                  </p>
                </div>
              )}

              {/* Categoría y Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary dark:text-sky-300 mb-1">
                    {language === "en" ? "Category" : "Categoría"}
                  </label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                  >
                    {categories
                      .filter((c) => c !== "Todas")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary dark:text-sky-300 mb-1">
                    {language === "en" ? "Country of Destination" : "País de Destino"}
                  </label>
                  <select
                    value={postCountry}
                    onChange={(e) => setPostCountry(e.target.value)}
                    className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                  >
                    <option value="España">🇪🇸 España</option>
                    <option value="Alemania">🇩🇪 Alemania</option>
                    <option value="Irlanda">🇮🇪 Irlanda</option>
                    <option value="Canadá">🇨🇦 Canadá</option>
                    <option value="Francia">🇫🇷 Francia</option>
                    <option value="Italia">🇮🇹 Italia</option>
                    <option value="EE.UU.">🇺🇸 Estados Unidos</option>
                    <option value="Australia">🇦🇺 Australia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary dark:text-sky-300 mb-1">
                    {language === "en" ? "City" : "Ciudad"}
                  </label>
                  <input
                    type="text"
                    value={postCity}
                    onChange={(e) => setPostCity(e.target.value)}
                    placeholder="ej. Madrid, Barcelona, Valencia..."
                    className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Autor info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary dark:text-sky-300 mb-1">
                    {language === "en" ? "Your Name or Alias" : "Tu Nombre o Alias"}
                  </label>
                  <input
                    type="text"
                    value={postAuthor}
                    onChange={(e) => setPostAuthor(e.target.value)}
                    placeholder="ej. Mariana S."
                    className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary dark:text-sky-300 mb-1">
                    {language === "en" ? "Your Origin Country" : "Tu País de Origen o Ubicación"}
                  </label>
                  <select
                    value={postAuthorCountry}
                    onChange={(e) => setPostAuthorCountry(e.target.value)}
                    className="w-full p-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                  >
                    <option value="España">🇪🇸 España</option>
                    <option value="Colombia">🇨🇴 Colombia</option>
                    <option value="México">🇲🇽 México</option>
                    <option value="Perú">🇵🇪 Perú</option>
                    <option value="Argentina">🇦🇷 Argentina</option>
                    <option value="Chile">🇨🇱 Chile</option>
                    <option value="Ecuador">🇪🇨 Ecuador</option>
                    <option value="Venezuela">🇻🇪 Venezuela</option>
                    <option value="Bolivia">🇧🇴 Bolivia</option>
                    <option value="Guatemala">🇬🇹 Guatemala</option>
                    <option value="Costa Rica">🇨🇷 Costa Rica</option>
                    <option value="Honduras">🇭🇳 Honduras</option>
                    <option value="El Salvador">🇸🇻 El Salvador</option>
                    <option value="Rep. Dominicana">🇩🇴 Rep. Dominicana</option>
                  </select>
                </div>
              </div>

              {/* Contenido */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-primary dark:text-sky-300">
                  {language === "en" ? "Detailed Description *" : "Detalle o Consulta *"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={
                    language === "en"
                      ? "Explain your situation, visa timeline, questions or advice for others..."
                      : "Explica tu situación, fechas de tu viaje, dudas específicas o recomendaciones para otros postulantes..."
                  }
                  className="w-full p-3 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant/20 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:text-primary dark:hover:text-sky-300 cursor-pointer"
                >
                  {language === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="bg-primary dark:bg-sky-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-container dark:hover:bg-sky-500 shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingPost && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{language === "en" ? "Publish to Cloud" : "Publicar en la Nube"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
