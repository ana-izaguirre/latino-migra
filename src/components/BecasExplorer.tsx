import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Heart,
  Calendar as CalendarIcon,
  ExternalLink,
  MapPin,
  Sparkles,
  Bot,
  X,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Building2,
  GraduationCap,
  Globe2,
  Award,
  PlusCircle,
  Send
} from "lucide-react";
import { Scholarship, NavigationTab } from "../types";
import { SCHOLARSHIPS_DATA } from "../data/scholarships";
import { generateGoogleCalendarUrl } from "../lib/googleCalendar";

interface BecasExplorerProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setActiveTab: (tab: NavigationTab) => void;
  onAskAIAboutScholarship: (scholarship: Scholarship) => void;
}

export const BecasExplorer: React.FC<BecasExplorerProps> = ({
  searchQuery,
  setSearchQuery,
  setActiveTab,
  onAskAIAboutScholarship,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("Todos");
  const [selectedArea, setSelectedArea] = useState<string>("Todas");
  const [selectedSupportType, setSelectedSupportType] = useState<string>("Todos");
  const [selectedInstitutionType, setSelectedInstitutionType] = useState<string>("Todas");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("Todas");
  const [sortBy, setSortBy] = useState<"deadline-asc" | "deadline-desc" | "title-asc" | "support-first">("deadline-asc");
  const [favorites, setFavorites] = useState<string[]>(["beca-carolina-2026", "beca-usal-internacional"]);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState<boolean>(false);
  const [suggestForm, setSuggestForm] = useState({
    university: "",
    country: "España",
    scholarshipName: "",
    officialUrl: "",
    notes: ""
  });
  const [suggestSuccess, setSuggestSuccess] = useState<boolean>(false);

  const countries = [
    "Todos",
    "España",
    "Alemania",
    "Francia",
    "Italia",
    "Países Bajos",
    "Suiza",
    "Suecia",
    "Reino Unido",
    "Estados Unidos",
    "Canadá"
  ];
  const areas = ["Todas", "STEM", "Artes y Humanidades", "Salud", "Negocios", "Todas las áreas"];
  const supportTypes = ["Todos", "Beca Completa", "Beca Parcial", "Manutención"];
  const institutionTypes = ["Todas", "Universidad Directa", "Gubernamental", "Organismo Internacional", "Fundación"];
  const dateRanges = [
    { id: "Todas", label: "Todas las fechas" },
    { id: "urgent", label: "⚡ Próximos 30 días (Cierre Urgente)" },
    { id: "semester", label: "📅 Próximos 90 días (Semestre actual)" },
    { id: "later", label: "⏳ Más de 90 días / Anuales" }
  ];

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedCountry("Todos");
    setSelectedArea("Todas");
    setSelectedSupportType("Todos");
    setSelectedInstitutionType("Todas");
    setSelectedDateRange("Todas");
    setSortBy("deadline-asc");
    setSearchQuery("");
  };

  const filteredScholarships = useMemo(() => {
    return SCHOLARSHIPS_DATA.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.officialPortalName && item.officialPortalName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCountry = selectedCountry === "Todos" || item.country === selectedCountry;
      const matchesArea = selectedArea === "Todas" || item.area === selectedArea || item.area === "Todas las áreas";
      const matchesSupport = selectedSupportType === "Todos" || item.supportType === selectedSupportType;
      const matchesInstType = selectedInstitutionType === "Todas" || item.institutionType === selectedInstitutionType;

      // Date Range Match
      let matchesDate = true;
      if (selectedDateRange === "urgent") {
        matchesDate = (item.daysLeft !== undefined && item.daysLeft <= 30) || !!item.isUrgent;
      } else if (selectedDateRange === "semester") {
        matchesDate = item.daysLeft !== undefined ? item.daysLeft <= 90 : true;
      } else if (selectedDateRange === "later") {
        matchesDate = item.daysLeft !== undefined ? item.daysLeft > 90 : true;
      }

      return matchesSearch && matchesCountry && matchesArea && matchesSupport && matchesInstType && matchesDate;
    }).sort((a, b) => {
      if (sortBy === "deadline-asc") {
        return a.deadlineDate.localeCompare(b.deadlineDate);
      }
      if (sortBy === "deadline-desc") {
        return b.deadlineDate.localeCompare(a.deadlineDate);
      }
      if (sortBy === "support-first") {
        const supportOrder = { "Beca Completa": 3, "Manutención": 2, "Beca Parcial": 1 };
        const orderA = supportOrder[a.supportType] || 0;
        const orderB = supportOrder[b.supportType] || 0;
        return orderB - orderA;
      }
      return a.title.localeCompare(b.title);
    });
  }, [searchQuery, selectedCountry, selectedArea, selectedSupportType, selectedInstitutionType, selectedDateRange, sortBy]);

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestSuccess(true);
    setTimeout(() => {
      setSuggestSuccess(false);
      setShowSuggestModal(false);
      setSuggestForm({
        university: "",
        country: "España",
        scholarshipName: "",
        officialUrl: "",
        notes: ""
      });
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Convocatorias y Portales Oficiales Verificados 2026-2027</span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
            Directorio Oficial de Becas
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-sm md:text-base mt-1">
            Encuentra becas directas de universidades internacionales, convenios gubernamentales y organismos iberoamericanos.
          </p>
        </div>

        {/* Suggest & Search Header Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSuggestModal(true)}
            id="suggest-scholarship-btn"
            className="inline-flex items-center gap-2 bg-secondary/10 dark:bg-teal-500/20 text-secondary dark:text-teal-300 hover:bg-secondary hover:text-white dark:hover:bg-teal-600 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-secondary/30 dark:border-teal-500/30 transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Sugerir Beca Oficial</span>
          </button>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, país, área o universidad..."
              id="becas-search-input"
              className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-teal-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 whitespace-nowrap">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              id="becas-sort-select"
              className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 text-xs font-medium rounded-xl px-3 py-2 text-on-surface dark:text-slate-200 outline-none focus:ring-1 focus:ring-secondary"
            >
              <option value="deadline-asc">⏱️ Cierre más próximo (Inminente)</option>
              <option value="deadline-desc">⏳ Más tiempo para postular</option>
              <option value="support-first">💰 Beca Completa primero</option>
              <option value="title-asc">🔤 Nombre (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Sidebar + Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Filters */}
        <aside className="lg:col-span-3 bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-primary dark:text-sky-300">
              <Filter className="w-5 h-5 text-secondary dark:text-teal-400" />
              <span>Filtros Avanzados</span>
            </div>
            <button
              onClick={clearFilters}
              id="clear-filters-btn"
              className="text-xs font-semibold text-secondary dark:text-teal-300 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>

          {/* Fecha Límite de Aplicación */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
              <span>Fecha de Aplicación</span>
            </label>
            <div className="space-y-1">
              {dateRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setSelectedDateRange(range.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedDateRange === range.id
                      ? "bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 font-bold"
                      : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span>{range.label}</span>
                  {selectedDateRange === range.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary dark:text-sky-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Emisor / Entidad */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
              <span>Tipo de Entidad</span>
            </label>
            <div className="space-y-1">
              {institutionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedInstitutionType(type)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedInstitutionType === type
                      ? "bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 font-bold"
                      : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span>{type}</span>
                  {selectedInstitutionType === type && <CheckCircle2 className="w-3.5 h-3.5 text-primary dark:text-sky-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* País Destino */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
              <span>País Destino</span>
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedCountry === country
                      ? "bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 font-bold"
                      : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span>{country}</span>
                  {selectedCountry === country && <CheckCircle2 className="w-3.5 h-3.5 text-primary dark:text-sky-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Área de Estudio */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
              <span>Área de Estudio</span>
            </label>
            <div className="space-y-1">
              {areas.map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedArea === area
                      ? "bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 font-bold"
                      : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span>{area}</span>
                  {selectedArea === area && <CheckCircle2 className="w-3.5 h-3.5 text-primary dark:text-sky-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Apoyo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
              <span>Tipo de Apoyo</span>
            </label>
            <div className="space-y-1">
              {supportTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedSupportType(type)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedSupportType === type
                      ? "bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 font-bold"
                      : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span>{type}</span>
                  {selectedSupportType === type && <CheckCircle2 className="w-3.5 h-3.5 text-primary dark:text-sky-400" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Scholarships Grid */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between text-sm text-on-surface-variant dark:text-slate-400">
            <span>
              Mostrando <strong>{filteredScholarships.length}</strong> convocatorias oficiales encontradas
            </span>
            {favorites.length > 0 && (
              <span className="text-secondary dark:text-teal-300 font-semibold">
                ♥ {favorites.length} Becas Guardadas
              </span>
            )}
          </div>

          {filteredScholarships.length === 0 ? (
            <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl p-12 text-center space-y-4 border border-outline-variant/40 dark:border-slate-700">
              <Search className="w-12 h-12 text-on-surface-variant mx-auto opacity-50" />
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                No encontramos becas con los filtros seleccionados
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-md mx-auto">
                Prueba ajustando los términos de búsqueda o haz clic en "Limpiar" para ver las 17+ becas disponibles.
              </p>
              <button
                onClick={clearFilters}
                className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary-container"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredScholarships.map((beca) => {
                const isFav = favorites.includes(beca.id);
                return (
                  <div
                    key={beca.id}
                    className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant/40 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Image Header */}
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={beca.imageUrl}
                          alt={beca.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-sky-400" />
                            <span>{beca.country}</span>
                          </div>

                          <button
                            onClick={(e) => toggleFavorite(beca.id, e)}
                            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                              isFav ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
                            }`}
                            title={isFav ? "Quitar de favoritos" : "Guardar beca"}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? "fill-white" : ""}`} />
                          </button>
                        </div>

                        {/* Deadline Alert Banner */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-amber-500/90 text-amber-950 font-bold px-3 py-1 rounded-lg text-xs backdrop-blur-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{beca.deadline}</span>
                        </div>

                        {/* Verified Portal Indicator */}
                        {beca.officialPortalName && (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold px-2 py-0.5 rounded text-[11px] backdrop-blur-xs">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Oficial</span>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            {beca.supportType}
                          </span>
                          {beca.institutionType && (
                            <span className="bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                              {beca.institutionType}
                            </span>
                          )}
                          <span className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">
                            • {beca.area}
                          </span>
                        </div>

                        <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300 group-hover:text-secondary transition-colors line-clamp-2">
                          {beca.title}
                        </h3>

                        <p className="text-xs font-semibold text-on-surface-variant dark:text-slate-300 line-clamp-1">
                          {beca.institution}
                        </p>

                        <p className="text-sm text-on-surface-variant dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {beca.description}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="px-5 pb-5 pt-2 border-t border-outline-variant/30 dark:border-slate-700/50 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedScholarship(beca)}
                        className="flex-1 bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 hover:bg-primary hover:text-white dark:hover:bg-sky-600 font-semibold text-xs py-2.5 rounded-xl transition-colors text-center"
                      >
                        Ver Detalles
                      </button>

                      <a
                        href={generateGoogleCalendarUrl({
                          title: `Límite Postulación Beca: ${beca.title}`,
                          details: `Fecha límite de la convocatoria para ${beca.title} de ${beca.institution}. Enlace oficial: ${beca.link}`,
                          startDate: beca.deadlineDate,
                          location: beca.country,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-surface dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors"
                        title="Añadir fecha límite a Google Calendar"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Calendar</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Suggest Official Scholarship Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-outline-variant/40 dark:border-slate-700 p-6 md:p-8 space-y-6 relative">
            <button
              onClick={() => setShowSuggestModal(false)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verificación de Fuentes Oficiales</span>
              </div>
              <h2 className="font-headline-md text-2xl font-extrabold text-primary dark:text-sky-300">
                Sugerir Beca Universitaria
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-300">
                Agrega becas y ayudas publicadas directamente en portales universitarios (.edu, .es, .de, etc.) para que nuestro equipo y la IA las verifiquen e incorporen al directorio.
              </p>
            </div>

            {suggestSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm">¡Beca enviada para verificación!</h4>
                <p className="text-xs">Revisaremos el enlace institucional para integrarla al catálogo oficial de LatinoMigra.</p>
              </div>
            ) : (
              <form onSubmit={handleSuggestSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                    Universidad o Institución *
                  </label>
                  <input
                    type="text"
                    required
                    value={suggestForm.university}
                    onChange={(e) => setSuggestForm({ ...suggestForm, university: e.target.value })}
                    placeholder="Ej. Universidad Autónoma de Madrid, Sorbonne..."
                    className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                      País Destino *
                    </label>
                    <select
                      value={suggestForm.country}
                      onChange={(e) => setSuggestForm({ ...suggestForm, country: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                    >
                      {countries.filter(c => c !== "Todos").map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                      Nombre de la Beca *
                    </label>
                    <input
                      type="text"
                      required
                      value={suggestForm.scholarshipName}
                      onChange={(e) => setSuggestForm({ ...suggestForm, scholarshipName: e.target.value })}
                      placeholder="Ej. Ayuda de Matrícula Máster..."
                      className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                    Enlace de la Página Oficial (.edu, .es, .org, .de, .ca) *
                  </label>
                  <input
                    type="url"
                    required
                    value={suggestForm.officialUrl}
                    onChange={(e) => setSuggestForm({ ...suggestForm, officialUrl: e.target.value })}
                    placeholder="https://www.universidad.es/becas/internacional..."
                    className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                    Notas o Requisitos Relevantes
                  </label>
                  <textarea
                    rows={2}
                    value={suggestForm.notes}
                    onChange={(e) => setSuggestForm({ ...suggestForm, notes: e.target.value })}
                    placeholder="Fechas de cierre, si cubre manutención o exención..."
                    className="w-full px-3.5 py-2 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSuggestModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-sky-600 hover:bg-primary-container text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Convocatoria</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Scholarship Details Modal */}
      {selectedScholarship && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/40 dark:border-slate-700 p-6 md:p-8 space-y-6 relative">
            <button
              onClick={() => setSelectedScholarship(null)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 text-xs px-3 py-1 rounded-full font-bold">
                  {selectedScholarship.supportType}
                </span>
                <span className="bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 text-xs px-3 py-1 rounded-full font-bold">
                  {selectedScholarship.country}
                </span>
                {selectedScholarship.institutionType && (
                  <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {selectedScholarship.institutionType}
                  </span>
                )}
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 ml-auto">
                  <Clock className="w-4 h-4" />
                  {selectedScholarship.deadline}
                </span>
              </div>

              <h2 className="font-headline-md text-2xl font-extrabold text-primary dark:text-sky-300">
                {selectedScholarship.title}
              </h2>
              <p className="text-sm font-semibold text-on-surface-variant dark:text-slate-300">
                {selectedScholarship.institution}
              </p>
              {selectedScholarship.officialPortalName && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Portal Oficial Verificado: {selectedScholarship.officialPortalName}</span>
                </p>
              )}
            </div>

            <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
              {selectedScholarship.description}
            </p>

            {/* Requisitos */}
            <div className="space-y-3 bg-surface dark:bg-slate-900 p-4 rounded-2xl">
              <h4 className="font-bold text-sm text-primary dark:text-sky-300 uppercase tracking-wider">
                Requisitos Principales
              </h4>
              <ul className="space-y-2">
                {selectedScholarship.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Beneficios */}
            <div className="space-y-3 bg-surface dark:bg-slate-900 p-4 rounded-2xl">
              <h4 className="font-bold text-sm text-primary dark:text-sky-300 uppercase tracking-wider">
                Beneficios Incluidos
              </h4>
              <ul className="space-y-2">
                {selectedScholarship.benefits.map((ben, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{ben}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-outline-variant/30 dark:border-slate-700">
              <a
                href={selectedScholarship.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-primary dark:bg-sky-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-container transition-colors text-xs"
              >
                <span>Visitar Portal Oficial</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={generateGoogleCalendarUrl({
                  title: `Cierre de Convocatoria: ${selectedScholarship.title}`,
                  details: `Fecha límite para enviar expediente a ${selectedScholarship.title}. Requisitos: ${selectedScholarship.requirements.join(", ")}. Enlace: ${selectedScholarship.link}`,
                  startDate: selectedScholarship.deadlineDate,
                  location: selectedScholarship.country,
                })}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-xs"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Agendar en Google Calendar</span>
              </a>

              <button
                onClick={() => {
                  const scholarshipToAsk = selectedScholarship;
                  setSelectedScholarship(null);
                  onAskAIAboutScholarship(scholarshipToAsk);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary dark:bg-teal-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-secondary-container transition-colors text-xs"
              >
                <Bot className="w-4 h-4" />
                <span>Consultar IA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
