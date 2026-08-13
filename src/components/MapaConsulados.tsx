import React, { useState } from "react";
import { MapPin, Navigation, Phone, Globe as GlobeIcon, Clock, ExternalLink, Building2, GraduationCap, Compass, Search, Filter, ShieldCheck } from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { LocationMarker } from "../types";
import { LOCATIONS_DATA } from "../data/locations";

const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidApiKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== "YOUR_API_KEY";

export const MapaConsulados: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [selectedCountry, setSelectedCountry] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeMarker, setActiveMarker] = useState<LocationMarker | null>(LOCATIONS_DATA[0]);

  const filteredLocations = LOCATIONS_DATA.filter((loc) => {
    const matchesType = selectedType === "todos" || loc.type === selectedType;
    const matchesCountry = selectedCountry === "todos" || loc.country === selectedCountry;
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.hostCountry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCountry && matchesSearch;
  });

  const getMarkerColor = (type: LocationMarker["type"]) => {
    if (type === "consulado" || type === "embajada") return "#0284c7"; // Sky blue
    return "#10b981"; // Emerald green for university
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Mapa Interactivo Google Maps</span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
            Consulados, Embajadas y Campus Destino
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-sm mt-1">
            Encuentra las sedes donde tramitar tus visados en Latinoamérica y las principales universidades receptoras en el extranjero.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
          <span>Sedes Oficiales Verificadas</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface-container-lowest dark:bg-slate-900 p-4 rounded-2xl border border-outline-variant/40 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <button
            onClick={() => setSelectedType("todos")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              selectedType === "todos"
                ? "bg-primary dark:bg-sky-600 text-white"
                : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedType("consulado")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              selectedType === "consulado"
                ? "bg-primary dark:bg-sky-600 text-white"
                : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Consulados y Embajadas</span>
          </button>
          <button
            onClick={() => setSelectedType("universidad")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              selectedType === "universidad"
                ? "bg-primary dark:bg-sky-600 text-white"
                : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Universidades</span>
          </button>
        </div>

        {/* Country Filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="p-2.5 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-semibold text-on-surface dark:text-slate-200"
          >
            <option value="todos">Todos los países de destino</option>
            <option value="España">España 🇪🇸</option>
            <option value="Alemania">Alemania 🇩🇪</option>
            <option value="EE.UU.">Estados Unidos 🇺🇸</option>
            <option value="Canadá">Canadá 🇨🇦</option>
          </select>

          <div className="relative w-48 hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ciudad..."
              className="w-full pl-8 pr-3 py-2 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Map + List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Interactive Map Frame */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-slate-900 rounded-3xl overflow-hidden border border-outline-variant/40 dark:border-slate-800 h-[520px] relative shadow-lg">
          {hasValidApiKey ? (
            <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
              <Map
                defaultCenter={{
                  lat: activeMarker ? activeMarker.lat : 4.6762,
                  lng: activeMarker ? activeMarker.lng : -74.0531,
                }}
                defaultZoom={4}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                style={{ width: "100%", height: "100%" }}
              >
                {filteredLocations.map((loc) => (
                  <AdvancedMarker
                    key={loc.id}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    onClick={() => setActiveMarker(loc)}
                  >
                    <Pin
                      background={getMarkerColor(loc.type)}
                      glyphColor="#ffffff"
                      borderColor="#ffffff"
                    />
                  </AdvancedMarker>
                ))}

                {activeMarker && (
                  <InfoWindow
                    position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                    onCloseClick={() => setActiveMarker(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-900 font-sans space-y-2">
                      <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                        {activeMarker.type} • {activeMarker.country}
                      </span>
                      <h4 className="font-bold text-sm leading-snug">{activeMarker.name}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{activeMarker.address}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          activeMarker.address
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-600 font-bold hover:underline pt-1"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Ver en Google Maps</span>
                      </a>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Google Maps Fallback Embed Preview when key is pending */
            <div className="w-full h-full relative flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center space-y-4">
              <iframe
                title="Google Maps Embedded"
                width="100%"
                height="100%"
                className="absolute inset-0 opacity-40 pointer-events-none filter grayscale contrast-125"
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  activeMarker ? activeMarker.address : "Consulado Espana Bogota"
                )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              />

              <div className="relative z-10 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 max-w-md shadow-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-300 flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white">Visualizador de Mapa Interactivo</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para activar marcadores dinámicos 3D y búsqueda en tiempo real, puedes agregar tu clave de Google Maps Platform en los Secretos.
                </p>
                <div className="text-[11px] bg-slate-800 p-3 rounded-xl text-left font-mono text-slate-300">
                  Ajustes ⚙️ → Secretos → <span className="text-sky-300">GOOGLE_MAPS_PLATFORM_KEY</span>
                </div>
                {activeMarker && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      activeMarker.address
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-sky-400 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Abrir ubicación de {activeMarker.city} en Google Maps</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Selected Location Detail & Directory */}
        <div className="space-y-4">
          {/* Active Detail Card */}
          {activeMarker && (
            <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-3xl border-2 border-primary/40 dark:border-sky-500/40 space-y-4 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  {activeMarker.type === "universidad" ? (
                    <GraduationCap className="w-3.5 h-3.5" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5" />
                  )}
                  {activeMarker.type} • {activeMarker.country}
                </span>

                <span className="text-xs text-on-surface-variant font-bold">
                  {activeMarker.city}, {activeMarker.hostCountry}
                </span>
              </div>

              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                {activeMarker.name}
              </h3>

              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                {activeMarker.description}
              </p>

              {/* Information Grid */}
              <div className="space-y-2 text-xs border-t border-outline-variant/30 dark:border-slate-800 pt-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant dark:text-slate-300">
                    {activeMarker.address}
                  </span>
                </div>

                {activeMarker.hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-on-surface-variant dark:text-slate-300">
                      {activeMarker.hours}
                    </span>
                  </div>
                )}

                {activeMarker.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-on-surface-variant dark:text-slate-300">
                      {activeMarker.phone}
                    </span>
                  </div>
                )}
              </div>

              {/* Community Tip */}
              {activeMarker.tips && (
                <div className="bg-secondary-container/20 dark:bg-teal-500/10 p-3 rounded-xl border border-secondary/20 text-xs text-secondary-container-on font-medium space-y-1">
                  <span className="font-bold text-secondary dark:text-teal-300 block">
                    💡 Consejos para la cita:
                  </span>
                  <p className="text-on-surface-variant dark:text-slate-300">{activeMarker.tips}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    activeMarker.address
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary dark:bg-sky-600 text-white py-2.5 px-4 rounded-xl font-bold text-xs hover:bg-primary-container transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Cómo Llegar</span>
                </a>

                {activeMarker.website && (
                  <a
                    href={activeMarker.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center p-2.5 bg-surface dark:bg-slate-800 text-on-surface border border-outline-variant/60 dark:border-slate-700 rounded-xl hover:bg-surface-container"
                    title="Sitio Web Oficial"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Directory List */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400">
              Directorio de Sedes ({filteredLocations.length})
            </h4>
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setActiveMarker(loc)}
                className={`w-full text-left p-3 rounded-2xl border text-xs transition-all ${
                  activeMarker?.id === loc.id
                    ? "bg-primary/10 border-primary dark:bg-sky-950/40 dark:border-sky-500 font-bold"
                    : "bg-surface-container-lowest dark:bg-slate-800 border-outline-variant/40 dark:border-slate-700 hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary dark:text-sky-300 truncate">
                    {loc.name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant dark:text-slate-400 shrink-0 ml-2">
                    {loc.city}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
