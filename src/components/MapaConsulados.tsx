import React, { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Phone,
  Globe as GlobeIcon,
  Clock,
  ExternalLink,
  Building2,
  GraduationCap,
  Compass,
  Search,
  Filter,
  ShieldCheck,
  LocateFixed,
  Loader2,
  AlertCircle
} from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { LocationMarker } from "../types";
import { LOCATIONS_DATA } from "../data/locations";
import { useLanguage } from "../lib/i18n";

const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidApiKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== "YOUR_API_KEY";

// Comprehensive Country Centers mapping for all Latin America and destination countries
const COUNTRY_CENTERS: Record<string, { lat: number; lng: number; zoom: number; name: string }> = {
  todos: { lat: 10.0, lng: -55.0, zoom: 3, name: "Toda Latinoamérica y Europa" },
  Argentina: { lat: -34.6037, lng: -58.3816, zoom: 6, name: "Argentina" },
  Bolivia: { lat: -16.5000, lng: -68.1500, zoom: 6, name: "Bolivia" },
  Brasil: { lat: -15.7975, lng: -47.8919, zoom: 5, name: "Brasil" },
  Chile: { lat: -33.4489, lng: -70.6693, zoom: 6, name: "Chile" },
  Colombia: { lat: 4.711, lng: -74.0721, zoom: 6, name: "Colombia" },
  "Costa Rica": { lat: 9.9281, lng: -84.0907, zoom: 7, name: "Costa Rica" },
  Cuba: { lat: 23.1136, lng: -82.3666, zoom: 7, name: "Cuba" },
  Ecuador: { lat: -0.1807, lng: -78.4678, zoom: 6, name: "Ecuador" },
  "El Salvador": { lat: 13.6929, lng: -89.2182, zoom: 7, name: "El Salvador" },
  Guatemala: { lat: 14.6349, lng: -90.5069, zoom: 7, name: "Guatemala" },
  Honduras: { lat: 14.0723, lng: -87.1921, zoom: 7, name: "Honduras" },
  México: { lat: 19.4326, lng: -99.1332, zoom: 6, name: "México" },
  Nicaragua: { lat: 12.1149, lng: -86.2362, zoom: 7, name: "Nicaragua" },
  Panamá: { lat: 8.9824, lng: -79.5199, zoom: 7, name: "Panamá" },
  Paraguay: { lat: -25.2637, lng: -57.5759, zoom: 6, name: "Paraguay" },
  Perú: { lat: -12.0464, lng: -77.0428, zoom: 6, name: "Perú" },
  "República Dominicana": { lat: 18.4861, lng: -69.9312, zoom: 7, name: "República Dominicana" },
  Uruguay: { lat: -34.9011, lng: -56.1645, zoom: 7, name: "Uruguay" },
  Venezuela: { lat: 10.4806, lng: -66.9036, zoom: 6, name: "Venezuela" },
  España: { lat: 40.4168, lng: -3.7038, zoom: 6, name: "España" },
  Alemania: { lat: 51.1657, lng: 10.4515, zoom: 6, name: "Alemania" },
  Canadá: { lat: 43.6532, lng: -79.3832, zoom: 6, name: "Canadá" },
  "EE.UU.": { lat: 38.9072, lng: -77.0369, zoom: 5, name: "Estados Unidos" },
  Suiza: { lat: 47.3769, lng: 8.5417, zoom: 7, name: "Suiza" },
  "Reino Unido": { lat: 51.5074, lng: -0.1278, zoom: 6, name: "Reino Unido" },
};

export const LATIN_AMERICAN_COUNTRIES_LIST = [
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Bolivia", flag: "🇧🇴" },
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Cuba", flag: "🇨🇺" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "El Salvador", flag: "🇸🇻" },
  { name: "Guatemala", flag: "🇬🇹" },
  { name: "Honduras", flag: "🇭🇳" },
  { name: "México", flag: "🇲🇽" },
  { name: "Nicaragua", flag: "🇳🇮" },
  { name: "Panamá", flag: "🇵🇦" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "Perú", flag: "🇵🇪" },
  { name: "República Dominicana", flag: "🇩🇴" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Venezuela", flag: "🇻🇪" },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

interface MapaConsuladosProps {
  initialCountry?: string;
}

export const MapaConsulados: React.FC<MapaConsuladosProps> = ({ initialCountry }) => {
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [userHomeCountry, setUserHomeCountry] = useState<string>(() => {
    if (initialCountry && initialCountry !== "todos") return initialCountry;
    return localStorage.getItem("latino_migra_home_country") || "todos";
  });
  const [destinationFilter, setDestinationFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Filter and sort locations
  const filteredLocations = LOCATIONS_DATA.filter((loc) => {
    // Check type matching
    let matchesType = true;
    if (selectedType === "consulado") {
      matchesType = loc.type === "consulado" || loc.type === "embajada";
    } else if (selectedType === "universidad") {
      matchesType = loc.type === "universidad";
    }

    const matchesDestination = destinationFilter === "todos" || loc.country === destinationFilter;
    const matchesHomeCountry =
      userHomeCountry === "todos" ||
      loc.hostCountry === userHomeCountry ||
      (selectedType === "universidad" && loc.type === "universidad");
      
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.hostCountry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.country.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesDestination && matchesHomeCountry && matchesSearch;
  });

  const [activeMarker, setActiveMarker] = useState<LocationMarker | null>(() => {
    return filteredLocations[0] || LOCATIONS_DATA[0];
  });

  // Whenever filters change, update active marker to the first matching entry
  useEffect(() => {
    if (filteredLocations.length > 0) {
      if (!activeMarker || !filteredLocations.some((l) => l.id === activeMarker.id)) {
        setActiveMarker(filteredLocations[0]);
      }
    } else {
      setActiveMarker(null);
    }
  }, [selectedType, userHomeCountry, destinationFilter, searchQuery]);

  // Handle Home Country selection change
  const handleHomeCountryChange = (country: string) => {
    setUserHomeCountry(country);
    localStorage.setItem("latino_migra_home_country", country);
    if (country !== "todos") {
      const match = LOCATIONS_DATA.find((l) => l.hostCountry === country);
      if (match) {
        setActiveMarker(match);
      }
    }
  };

  // Detect GPS Location and sync dropdown
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatus("Detectando tu ubicación GPS...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setIsDetectingLocation(false);
        setLocationStatus("¡Ubicación detectada con éxito!");

        // Find nearest location to user
        let nearest: LocationMarker | null = null;
        let minDistance = Infinity;

        LOCATIONS_DATA.forEach((loc) => {
          const dist = calculateDistanceKm(coords.lat, coords.lng, loc.lat, loc.lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearest = loc;
          }
        });

        if (nearest) {
          setActiveMarker(nearest);
          if ((nearest as LocationMarker).hostCountry) {
            const countryName = (nearest as LocationMarker).hostCountry;
            setUserHomeCountry(countryName);
            localStorage.setItem("latino_migra_home_country", countryName);
          }
        }

        setTimeout(() => setLocationStatus(null), 4000);
      },
      (error) => {
        setIsDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("Permiso de ubicación denegado. Puedes seleccionar tu país manualmente.");
        } else {
          setLocationStatus("No se pudo obtener la ubicación. Selecciona tu país en la lista.");
        }
        setTimeout(() => setLocationStatus(null), 5000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const getMarkerColor = (type: LocationMarker["type"]) => {
    if (type === "consulado" || type === "embajada") return "#0284c7"; // Sky blue
    return "#10b981"; // Emerald green for university
  };

  const centerCoords = userLocation
    ? userLocation
    : userHomeCountry !== "todos" && COUNTRY_CENTERS[userHomeCountry]
    ? { lat: COUNTRY_CENTERS[userHomeCountry].lat, lng: COUNTRY_CENTERS[userHomeCountry].lng }
    : activeMarker
    ? { lat: activeMarker.lat, lng: activeMarker.lng }
    : { lat: 10.0, lng: -55.0 };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>{language === "en" ? "Interactive Consular Map & Directory" : "Mapa y Directorio Consular Interactivo"}</span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
            {language === "en" ? "Consulates, Embassies & Target Campuses" : "Consulados, Embajadas y Campus Destino"}
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-sm mt-1">
            {language === "en"
              ? "Find official consular offices to process visas in your country and explore receiving universities abroad."
              : "Encuentra las sedes consulares oficiales para tramitar tus visados en tu país y explora las universidades receptoras en el extranjero."}
          </p>
        </div>

        {/* Location Detection / Origin Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            id="btn-detect-location"
            className="flex items-center gap-2 bg-secondary/10 dark:bg-teal-500/20 text-secondary dark:text-teal-300 hover:bg-secondary/20 dark:hover:bg-teal-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-secondary/30 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isDetectingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
            ) : (
              <LocateFixed className="w-4 h-4 text-teal-500" />
            )}
            <span>{userLocation ? (language === "en" ? "Update GPS Location" : "Actualizar mi GPS") : (language === "en" ? "Detect My Location" : "Detectar mi ubicación actual")}</span>
          </button>

          <div className="flex items-center gap-2 bg-primary/10 dark:bg-sky-500/20 text-primary dark:text-sky-300 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
            <span>{language === "en" ? "Verified Official Venues" : "Sedes Oficiales Verificadas"}</span>
          </div>
        </div>
      </div>

      {/* Location Status Message banner */}
      {locationStatus && (
        <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-200 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <span>{locationStatus}</span>
        </div>
      )}

      {/* User Origin & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-surface-container-lowest dark:bg-slate-900 p-4 rounded-2xl border border-outline-variant/40 dark:border-slate-800 shadow-sm">
        {/* Origin Country Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary dark:text-sky-400" />
            <span>{language === "en" ? "Your Origin Country:" : "Tu País de Origen:"}</span>
          </span>
          <select
            value={userHomeCountry}
            onChange={(e) => handleHomeCountryChange(e.target.value)}
            id="select-user-country"
            className="p-2 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-bold text-primary dark:text-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="todos">🌎 {language === "en" ? "All countries" : "Todos los países"}</option>
            {LATIN_AMERICAN_COUNTRIES_LIST.map((c) => (
              <option key={c.name} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type & Search Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedType("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedType === "todos"
                  ? "bg-primary dark:bg-sky-600 text-white"
                  : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
              }`}
            >
              {language === "en" ? "All" : "Todos"}
            </button>
            <button
              onClick={() => setSelectedType("consulado")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                selectedType === "consulado"
                  ? "bg-primary dark:bg-sky-600 text-white"
                  : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Consulates & Embassies" : "Consulados y Embajadas"}</span>
            </button>
            <button
              onClick={() => setSelectedType("universidad")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                selectedType === "universidad"
                  ? "bg-primary dark:bg-sky-600 text-white"
                  : "bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Universities" : "Universidades"}</span>
            </button>
          </div>

          {/* Destination Country Filter */}
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="p-2 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs font-semibold text-on-surface dark:text-slate-200"
          >
            <option value="todos">{language === "en" ? "Destination: All" : "País Destino: Todos"}</option>
            <option value="España">España 🇪🇸</option>
            <option value="Alemania">Alemania 🇩🇪</option>
            <option value="EE.UU.">Estados Unidos 🇺🇸</option>
            <option value="Canadá">Canadá 🇨🇦</option>
            <option value="Suiza">Suiza 🇨🇭</option>
            <option value="Reino Unido">Reino Unido 🇬🇧</option>
          </select>

          {/* Quick Search */}
          <div className="relative w-40 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "en" ? "Search city..." : "Buscar ciudad..."}
              className="w-full pl-8 pr-3 py-1.5 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs text-on-surface dark:text-slate-100 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Map + Details / Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Interactive Map Frame */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-slate-900 rounded-3xl overflow-hidden border border-outline-variant/40 dark:border-slate-800 h-[520px] relative shadow-lg">
          {hasValidApiKey ? (
            <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
              <Map
                defaultCenter={centerCoords}
                defaultZoom={userLocation || userHomeCountry !== "todos" ? 5 : 4}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                style={{ width: "100%", height: "100%" }}
              >
                {/* User GPS Location Marker */}
                {userLocation && (
                  <AdvancedMarker position={userLocation}>
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-sky-400 opacity-75"></span>
                      <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-md"></div>
                    </div>
                  </AdvancedMarker>
                )}

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
            <div className="w-full h-full flex flex-col relative bg-slate-900">
              <iframe
                title="Consulados y Universidades Map"
                className="w-full h-full border-0 filter contrast-105"
                src={`https://maps.google.com/maps?q=${
                  activeMarker
                    ? `${activeMarker.lat},${activeMarker.lng}`
                    : centerCoords.lat + "," + centerCoords.lng
                }&hl=es&z=${userHomeCountry !== "todos" || activeMarker ? 13 : 4}&output=embed`}
                loading="lazy"
              />

              {/* Floating Current Location Card */}
              {activeMarker && (
                <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/40 dark:border-slate-800 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        activeMarker.type === "universidad"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                      }`}
                    >
                      {activeMarker.type === "universidad" ? (
                        <GraduationCap className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-primary dark:text-sky-300 truncate max-w-xs md:max-w-md">
                        {activeMarker.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400">
                        {activeMarker.city}, {activeMarker.hostCountry} (Destino: {activeMarker.country})
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      activeMarker.address
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-primary dark:bg-sky-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-primary-container shrink-0"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ruta GPS</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Active Marker Detail Card + Fast Directory (5 cols) */}
        <div className="space-y-6">
          {activeMarker ? (
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-6 border border-outline-variant/40 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                    activeMarker.type === "universidad"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                  }`}
                >
                  {activeMarker.type === "universidad" ? "🎓 Universidad / Campus" : "🏛️ Consulado / Embajada"}
                </span>

                <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">
                  {activeMarker.city}, {activeMarker.hostCountry}
                </span>
              </div>

              <div>
                <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                  {activeMarker.name}
                </h3>
                <p className="text-xs text-secondary dark:text-teal-400 font-medium">
                  {activeMarker.type === "universidad" ? "País del Campus:" : "Representa a:"} <strong>{activeMarker.country}</strong>
                </p>
              </div>

              <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
                {activeMarker.description}
              </p>

              {/* Distance from user if available */}
              {userLocation && (
                <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 rounded-xl">
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>
                    Aprox. {calculateDistanceKm(userLocation.lat, userLocation.lng, activeMarker.lat, activeMarker.lng).toLocaleString()}{" "}
                    km de tu ubicación
                  </span>
                </div>
              )}

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
                    💡 Consejos clave:
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
          ) : (
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-6 border border-outline-variant/40 dark:border-slate-800 shadow-md text-center py-10 space-y-2">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-on-surface dark:text-slate-200">
                No hay resultados para este filtro
              </p>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Prueba cambiando el país de origen o el tipo de sede.
              </p>
            </div>
          )}

          {/* Directory List */}
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400">
              {selectedType === "universidad"
                ? `Campus Universitarios (${filteredLocations.length})`
                : selectedType === "consulado"
                ? `Consulados y Embajadas (${filteredLocations.length})`
                : `Directorio de Sedes (${filteredLocations.length})`}
            </h4>
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setActiveMarker(loc)}
                className={`w-full text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
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
                    {loc.city} ({loc.hostCountry})
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
