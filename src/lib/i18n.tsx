import React, { createContext, useContext, useState, useEffect } from "react";
import { getPreferences, setPreference, subscribeToPreferences } from "./preferencesStore";

export type Language = "es" | "en";

interface TranslationDictionary {
  [key: string]: {
    es: string;
    en: string;
  };
}

export const TRANSLATIONS: TranslationDictionary = {
  // Navigation
  "nav.planificador": { es: "Planificador 360°", en: "360° Planner" },
  "nav.calculadora": { es: "Calculadora Costo de Vida", en: "Cost of Living Calculator" },
  "nav.becas": { es: "Becas & Estudios", en: "Scholarships & Studies" },
  "nav.voluntariados": { es: "Voluntariados & Intercambios", en: "Volunteering & Exchanges" },
  "nav.guia": { es: "Guía de Migración", en: "Migration Guide" },
  "nav.mapa": { es: "Mapa Consular", en: "Consular Map" },
  "nav.comunidad": { es: "Comunidad", en: "Community" },
  "nav.feedback": { es: "Sugerencias", en: "Feedback" },
  "nav.chat": { es: "Chat IA", en: "AI Chat" },
  "nav.admin": { es: "Panel de Control", en: "Admin Dashboard" },
  "nav.login": { es: "Acceder con Google", en: "Sign In with Google" },
  "nav.logout": { es: "Cerrar Sesión", en: "Sign Out" },
  "nav.tagline": {
    es: "Plataforma de Migración, Becas & Intercambios para Latinoamérica",
    en: "Migration, Scholarships & Exchange Platform for Latin America",
  },
  "nav.menu": { es: "Menú", en: "Menu" },
  "nav.close": { es: "Cerrar", en: "Close" },
  "nav.search": {
    es: "Buscar becas, voluntariados o visas...",
    en: "Search scholarships, volunteering, or visas...",
  },
  "nav.alerts": { es: "Alertas y Avisos", en: "Alerts & Notices" },

  // Hero & General
  "hero.badge": {
    es: "Plataforma Gratuita para Migrantes y Becarios",
    en: "Free Platform for Migrants and Scholars",
  },
  "hero.title": {
    es: "Tu futuro en el extranjero comienza con claridad",
    en: "Your future abroad begins with clarity",
  },
  "hero.subtitle": {
    es: "Descubre becas vigentes, voluntariados internacionales, requisitos oficiales de visados, costo de vida real en tu moneda y conecta con una comunidad de apoyo mutuo.",
    en: "Discover active scholarships, international volunteering, official visa requirements, real cost of living in your currency, and connect with a mutual support community.",
  },
  "hero.ctaPlan": { es: "Crear mi Plan Migratorio", en: "Build My Migration Plan" },
  "hero.ctaScholarships": { es: "Explorar Becas Activas", en: "Explore Scholarships" },
  "hero.ctaVolunteering": { es: "Voluntariados & Intercambios", en: "Volunteering & Exchanges" },
  "hero.ctaAI": { es: "Evaluar Perfil con IA", en: "Evaluate Profile with AI" },

  // Profile Evaluator Banner
  "evaluator.title": {
    es: "Diagnóstico de Perfil Migratorio con IA",
    en: "AI Migration Profile Diagnosis",
  },
  "evaluator.desc": {
    es: "Descubre cuál es tu mejor país, tipo de visa o beca según tu carrera, nivel educativo, situación familiar y ahorros.",
    en: "Find out your best country, visa type, or scholarship based on your career, education level, family status, and savings.",
  },
  "evaluator.btn": { es: "Iniciar Evaluación Gratuita", en: "Start Free Assessment" },

  // Education Level Selector
  "edu.title": {
    es: "Filtra por tu Nivel Educativo Actual o de Interés",
    en: "Filter by Your Education Level of Interest",
  },
  "edu.subtitle": {
    es: "Te recomendamos las mejores vías y becas según tu grado académico, siempre pudiendo explorar todos los niveles.",
    en: "We recommend top pathways and scholarships matching your degree, while letting you explore all options.",
  },
  "edu.pregrado": { es: "Pregrado / Licenciatura", en: "Undergraduate / Bachelor" },
  "edu.postgrado": { es: "Postgrado / Máster", en: "Postgraduate / Master's" },
  "edu.doctorado": { es: "Doctorado (PhD)", en: "Doctorate (PhD)" },
  "edu.postdoc": { es: "Post Doctorado", en: "Post Doctorate" },
  "edu.intercambio": { es: "Intercambio / Voluntariado", en: "Exchange / Volunteering" },
  "edu.todos": { es: "Ver Todos los Niveles", en: "View All Levels" },

  // Planner
  "planner.title": {
    es: "Simulador & Planificador de Migración Integral",
    en: "Comprehensive Migration Simulator & Planner",
  },
  "planner.origin": { es: "Tu País de Origen", en: "Your Country of Origin" },
  "planner.destination": { es: "País de Destino", en: "Destination Country" },
  "planner.save": { es: "Guardar mi Plan", en: "Save My Plan" },
  "planner.saved": { es: "¡Plan Guardado en tu Perfil!", en: "Plan Saved to Your Profile!" },
  "planner.askAI": { es: "Consultar Detalles a la IA", en: "Ask AI for Roadmap" },

  // Volunteering
  "vol.disclaimerTitle": {
    es: "Aviso Importante: Voluntariados e Intercambios NO son Vías Migratorias",
    en: "Important Notice: Volunteering & Cultural Exchanges are NOT Direct Migration Routes",
  },
  "vol.disclaimerText": {
    es: "Estas experiencias son ideales para enriquecimiento cultural, mejorar idiomas, hacer contactos y conocer un país por periodos cortos/medianos. No otorgan residencia permanente ni permiso de trabajo formal ordinario.",
    en: "These programs are designed for cultural immersion, language learning, networking, and experiencing a country for short-to-medium stays. They do NOT grant permanent residency or standard local open work permits.",
  },

  // Budget source
  "budget.sourceTitle": {
    es: "Fuentes Oficiales y Metodología de Presupuestos",
    en: "Official Sources & Budget Methodology",
  },
  "budget.sourceText": {
    es: "Los costos reflejados provienen de los requisitos financieros de inmigración oficiales (IPREM en España, Sperrkonto en Alemania, Formulario I-20/SEVIS en EE.UU., requisito IRCC en Canadá, Índice de Precios Numbeo y reportes de estudiantes de la comunidad).",
    en: "Reflected estimates are sourced from official government visa subsistence thresholds (IPREM Spain, Sperrkonto Germany, Form I-20/SEVIS USA, IRCC guidelines Canada, Numbeo living benchmarks, and verified community student submissions).",
  },

  // Community
  "community.title": {
    es: "Foros y Experiencias de Migrantes",
    en: "Forums & Migrant Experiences",
  },
  "community.subtitle": {
    es: "Conéctate con miles de latinoamericanos compartiendo consejos reales sobre alojamientos, trámites y vida estudiantil.",
    en: "Connect with thousands of Latin Americans sharing real tips on housing, paperwork, and student life.",
  },
  "community.createBtn": { es: "Crear Publicación", en: "Create Post" },
  "community.searchPlaceholder": {
    es: "Buscar tema, ciudad o pregunta...",
    en: "Search topic, city, or question...",
  },
  "community.duplicateAlert": {
    es: "¡Prevención de Duplicados! Temas similares ya respondidos:",
    en: "Duplicate Prevention! Similar topics already answered:",
  },
  "community.howToTitle": {
    es: "¿Cómo funciona la Comunidad LatinoMigra?",
    en: "How does LatinoMigra Community work?",
  },

  // Chat
  "chat.newConversation": { es: "Nueva Consulta", en: "New Consultation" },
  "chat.requestFailed": {
    es: "No pudimos conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.",
    en: "We could not reach the assistant. Check your connection and try again.",
  },
  "chat.evalProfile": { es: "🎯 Diagnosticar Mi Perfil", en: "🎯 Diagnose My Profile" },
  "chat.welcomeTitle": {
    es: "¡Hola! ¿Cómo puedo orientar tu plan migratorio?",
    en: "Hello! How can I guide your migration journey?",
  },
  "chat.welcomeSubtitle": {
    es: "Soy tu asesor de IA para becas completas, visas de trabajo, búsqueda de empleo y migración con o sin familia.",
    en: "I'm your AI advisor for full scholarships, work visas, job search, and migrating with or without family.",
  },
  "chat.inputPlaceholder": {
    es: "Pregunta sobre visas, becas, ciudades o tu situación profesional...",
    en: "Ask about visas, scholarships, cities, or your career profile...",
  },
  "chat.disclaimer": {
    es: "LatinoMigra IA es una guía orientativa. Verifica siempre la información oficial en los consulados correspondientes.",
    en: "LatinoMigra AI is an informative guide. Always verify official details at the respective embassies or consulates.",
  },

  // Admin Dashboard
  "admin.title": {
    es: "Panel de Administración & Métricas de la Plataforma",
    en: "Admin Dashboard & Platform Metrics",
  },
  "admin.sync": { es: "Sincronizar y Actualizar Datos", en: "Sync & Update Database" },
  "admin.totalScholarships": { es: "Becas Activas en Sistema", en: "Active Scholarships in DB" },
  "admin.users": { es: "Usuarios y Registros", en: "Users & Profiles" },
  "admin.cron": {
    es: "Estado de Tareas en Segundo Plano (Cron Job)",
    en: "Background Tasks Status (Cron Job)",
  },

  // Migration guides (Guías)
  "guia.eyebrow": {
    es: "Guías Oficiales Paso a Paso • Fuentes Gubernamentales",
    en: "Official Step-by-Step Guides • Government Sources",
  },
  "guia.routeTitle": {
    es: "Ruta Migratoria y Cronograma Realista",
    en: "Migration Route and Realistic Timeline",
  },
  "guia.routeIntro": {
    es: "Las cuatro fases, en orden, desde la preparación en tu país hasta tus primeros días en destino. Es la ruta que vas a recorrer, no un registro de tu avance.",
    en: "The four phases, in order, from preparing at home to your first days abroad. This is the route ahead, not a record of your progress.",
  },
  "guia.phase": { es: "Fase", en: "Phase" },
  "guia.averageTime": { es: "Tiempo promedio total:", en: "Typical total time:" },
  "guia.visaTypesIn": { es: "Tipos de Visado en", en: "Visa Types in" },
  "guia.visaTypesIntro": {
    es: "Explora estudios, cursos de idiomas, trabajo express, nómadas y residencia.",
    en: "Study, language courses, fast-track work, digital nomad and residency routes.",
  },
  "guia.requirements": { es: "Requisitos Indispensables", en: "Essential Requirements" },
  "guia.officialPortal": { es: "Portal oficial", en: "Official portal" },
  "guia.noOfficialLink": {
    es: "Todavía no tenemos el enlace oficial de esta visa.",
    en: "We do not have the official link for this visa yet.",
  },
  "guia.showVisaDetails": { es: "Ver requisitos y trámites", en: "See requirements and paperwork" },
  "guia.hideVisaDetails": {
    es: "Ocultar requisitos y trámites",
    en: "Hide requirements and paperwork",
  },
  "guia.askAI": { es: "Consultar con IA", en: "Ask the assistant" },
  "guia.askAIWhich": {
    es: "Preguntar a IA cuál me conviene",
    en: "Ask the assistant which suits me",
  },
  "guia.costTitle": { es: "Costo de Vida Estimado", en: "Estimated Cost of Living" },
  "guia.openCalculator": { es: "Abrir Calculadora", en: "Open Calculator" },
  "guia.checklistTitle": { es: "Documentación Clave Requerida", en: "Key Documents Required" },
  "guia.checklistIntro": {
    es: "Marca las casillas conforme reúnas cada documento para tu cita consular o trámites de llegada.",
    en: "Tick each document off as you gather it for your consular appointment or on arrival.",
  },
  "guia.downloadChecklist": { es: "Descargar Checklist (.txt)", en: "Download Checklist (.txt)" },
  "guia.showChecklist": { es: "Ver la lista de documentos", en: "See the document list" },
  "guia.hideChecklist": { es: "Ocultar la lista de documentos", en: "Hide the document list" },
  "guia.antiScamBadge": {
    es: "Protocolo de Protección & Prevención de Fraudes",
    en: "Protection and Fraud Prevention",
  },
  "guia.antiScamTitle": {
    es: "Guía Anti-Estafas Oficial para",
    en: "Official Anti-Scam Guide for",
  },
  "guia.antiScamIntro": {
    es: "Estafas más frecuentes reportadas por migrantes y estudiantes en este país, cómo detectarlas y canales directos de denuncia oficial.",
    en: "The scams migrants and students report most often in this country, how to spot them, and where to report them officially.",
  },
  "guia.showAntiScam": {
    es: "Ver estafas frecuentes y cómo denunciar",
    en: "See common scams and how to report them",
  },
  "guia.hideAntiScam": { es: "Ocultar estafas frecuentes", en: "Hide common scams" },
  "guia.emergencyPhone": {
    es: "Teléfono de Emergencia / Denuncia:",
    en: "Emergency / Reporting Phone:",
  },
  "guia.policePortal": { es: "Portal de Denuncias Telemáticas", en: "Online Reporting Portal" },
  "guia.warningSign": { es: "Señal de Alerta:", en: "Warning Sign:" },
  "guia.howToProtect": { es: "Cómo Protegerte:", en: "How to Protect Yourself:" },
  "guia.directSource": { es: "Fuente directa:", en: "Direct source:" },
  "guia.consumerAgency": {
    es: "Organismo oficial de defensa al consumidor:",
    en: "Official consumer protection body:",
  },
  "guia.communityTip": { es: "Consejo Real de la Comunidad", en: "Real Advice from the Community" },
  "guia.openForum": { es: "Ver Foro", en: "Open the Forum" },
  // Scholarships (Becas)
  "becas.eyebrow": {
    es: "Convocatorias y Portales Oficiales Verificados 2026-2027",
    en: "Verified Official Calls and Portals 2026-2027",
  },
  "becas.title": { es: "Directorio Oficial de Becas", en: "Official Scholarship Directory" },
  "becas.subtitle": {
    es: "Encuentra becas directas de universidades internacionales, convenios gubernamentales y organismos iberoamericanos.",
    en: "Find scholarships straight from international universities, government agreements and Ibero-American bodies.",
  },
  "becas.suggest": { es: "Sugerir Beca Oficial", en: "Suggest an Official Scholarship" },
  "becas.sortBy": { es: "Ordenar por:", en: "Sort by:" },
  "becas.tabAll": { es: "Todas las Convocatorias", en: "All Calls" },
  "becas.tabFavorites": { es: "Mis Becas Favoritas", en: "My Saved Scholarships" },
  "becas.tabStudies": { es: "Cursos, Certificados y FP", en: "Courses, Certificates and VET" },
  // Estudios: the non-scholarship half of the Becas & Estudios screen (#56)
  "estudios.eyebrow": {
    es: "Programas y portales oficiales",
    en: "Official programmes and portals",
  },
  "estudios.title": {
    es: "Estudiar sin beca: cursos, certificados y FP",
    en: "Studying without a scholarship: courses, certificates and VET",
  },
  "estudios.subtitle": {
    es: "Rutas de estudio que no dependen de financiación: formación profesional, certificaciones de idioma y cursos oficiales. Cada una enlaza a la fuente oficial que la publica.",
    en: "Study routes that do not depend on funding: vocational training, language certifications and official courses. Each one links to the official source that publishes it.",
  },
  "estudios.kindLabel": { es: "Tipo de programa", en: "Programme type" },
  "estudios.kindAll": { es: "Todos", en: "All" },
  "estudios.showing": { es: "Mostrando", en: "Showing" },
  "estudios.programmes": { es: "programas oficiales", en: "official programmes" },
  "estudios.of": { es: "de", en: "of" },
  "estudios.loadMore": { es: "Ver más programas", en: "See more programmes" },
  "estudios.reachedEnd": { es: "Has visto los", en: "You have seen all" },
  "estudios.duration": { es: "Duración", en: "Duration" },
  "estudios.cost": { es: "Coste", en: "Cost" },
  "estudios.outcome": { es: "Qué obtienes", en: "What you end up with" },
  "estudios.requirements": { es: "Requisitos", en: "Requirements" },
  "estudios.showDetails": {
    es: "Ver requisitos y titulación",
    en: "Show requirements and qualification",
  },
  "estudios.hideDetails": { es: "Ocultar requisitos", en: "Hide requirements" },
  "estudios.relatedScholarships": { es: "Becas para esta ruta", en: "Scholarships for this route" },
  "estudios.seeAll": { es: "Ver todos los programas", en: "See every programme" },
  "estudios.emptyFilterTitle": {
    es: "Ningún programa de este tipo",
    en: "No programme of this type",
  },
  "estudios.emptyFilterBody": {
    es: "Cambia el tipo de programa para ver el resto del catálogo.",
    en: "Change the programme type to see the rest of the catalogue.",
  },
  "estudios.emptyCatalogueTitle": {
    es: "No pudimos mostrar el catálogo de estudios",
    en: "We could not show the studies catalogue",
  },
  "estudios.emptyCatalogueBody": {
    es: "Ninguna de las entradas cumple la regla de fuente oficial, así que no hay nada verificado que enseñarte.",
    en: "None of the entries meets the official-source rule, so there is nothing verified to show you.",
  },
  "estudios.rejectedNotice": { es: "No mostramos", en: "We are not showing" },
  "estudios.rejectedOne": { es: "programa porque", en: "programme because" },
  "estudios.rejectedMany": { es: "programas porque", en: "programmes because" },
  "becas.quickFilters": { es: "Filtros Rápidos", en: "Quick Filters" },
  "becas.clear": { es: "Limpiar", en: "Clear" },
  "becas.moreFilters": { es: "Más Filtros", en: "More Filters" },
  "becas.searchFilters": { es: "Filtros de Búsqueda", en: "Search Filters" },
  "becas.clearAll": { es: "Limpiar todo", en: "Clear all" },
  "becas.onlyFavorites": { es: "Ver solo mis favoritas", en: "Show only my saved ones" },
  "becas.advancedFilters": { es: "Filtros Avanzados", en: "Advanced Filters" },
  "becas.quickView": { es: "Vista Rápida", en: "Quick View" },
  "becas.onlyMine": { es: "Solo mis favoritas", en: "Only my saved ones" },
  "becas.updating": { es: "Actualizando convocatorias…", en: "Updating calls…" },
  "becas.bundledNotice": {
    es: "No pudimos cargar las convocatorias más recientes. Estás viendo la lista incluida en la aplicación, que puede estar desactualizada.",
    en: "We could not load the most recent calls. You are seeing the list bundled with the application, which may be out of date.",
  },
  "becas.showing": { es: "Mostrando", en: "Showing" },
  "becas.of": { es: "de", en: "of" },
  "becas.calls": { es: "convocatorias", en: "calls" },
  "becas.noneFound": { es: "0 convocatorias encontradas", en: "0 calls found" },
  "becas.saved": { es: "guardadas", en: "saved" },
  "becas.emptyFavoritesTitle": {
    es: "Aún no tienes becas en favoritos",
    en: "You have not saved any scholarships yet",
  },
  "becas.emptyFavoritesBody": {
    es: "Haz clic en el icono de corazón (♥) en cualquier convocatoria para guardarla y acceder a ella rápidamente aquí.",
    en: "Tap the heart (♥) on any call to save it and find it quickly here.",
  },
  "becas.seeAllCalls": { es: "Ver Todas las Convocatorias", en: "See All Calls" },
  "becas.emptyFilteredTitle": {
    es: "No encontramos becas con los filtros seleccionados",
    en: "No scholarships match the filters you picked",
  },
  "becas.emptyFilteredBody": {
    es: "Prueba ajustando los términos de búsqueda, o limpia los filtros para ver el catálogo completo.",
    en: "Try adjusting your search, or clear the filters to see the whole catalogue.",
  },
  "becas.clearFilters": { es: "Limpiar Filtros", en: "Clear Filters" },
  "becas.official": { es: "Oficial", en: "Official" },
  "becas.viewDetails": { es: "Ver Detalles", en: "View Details" },
  "becas.loadProgress": { es: "Progreso de carga", en: "Loading progress" },
  "becas.loadMore": { es: "Cargar Más Convocatorias", en: "Load More Calls" },
  "becas.remaining": { es: "becas por mostrar", en: "scholarships left to show" },
  "becas.reachedEnd": { es: "Has llegado al final de las", en: "You have reached the end of the" },
  "becas.backToTop": { es: "Volver arriba del listado ↑", en: "Back to the top of the list ↑" },
  "becas.countryLabel": { es: "País Destino", en: "Destination Country" },
  "becas.levelLabel": { es: "Nivel Educativo", en: "Education Level" },
  "becas.areaLabel": { es: "Área de Estudio", en: "Field of Study" },
  "becas.supportLabel": { es: "Tipo de Apoyo", en: "Type of Support" },
  "becas.institutionLabel": { es: "Tipo de Entidad", en: "Type of Body" },
  "becas.deadlineLabel": { es: "Fecha de Cierre", en: "Closing Date" },
  "becas.officialCall": { es: "Convocatoria oficial", en: "Official call" },
  "becas.remindMe": { es: "Recordarme la fecha límite", en: "Remind me of the deadline" },
  "becas.showRequirements": { es: "Ver requisitos principales", en: "See key requirements" },
  "becas.hideRequirements": { es: "Ocultar requisitos", en: "Hide requirements" },
  "becas.showBenefits": { es: "Ver beneficios incluidos", en: "See what is included" },
  "becas.hideBenefits": { es: "Ocultar beneficios", en: "Hide benefits" },
  "becas.requirements": { es: "Requisitos Principales", en: "Key Requirements" },
  "becas.benefits": { es: "Beneficios Incluidos", en: "What Is Included" },
  "becas.noResultsForOption": {
    es: "No hay convocatorias con los filtros actuales",
    en: "No calls match the current filters",
  },

  // Footer
  "footer.tools": { es: "Herramientas", en: "Tools" },
  "footer.community": { es: "Comunidad & Recursos", en: "Community & Resources" },
  "footer.legal": { es: "Garantía y Legal", en: "Guarantee & Legal" },
  "footer.verified": { es: "Fuentes 100% Verificadas", en: "100% Verified Sources" },
  "footer.terms": { es: "Términos y Condiciones", en: "Terms & Conditions" },
  "footer.privacy": { es: "Política de Privacidad", en: "Privacy Policy" },
  "footer.guidelines": { es: "Normas de Convivencia", en: "Community Guidelines" },
  "footer.contact": { es: "Contacto y Soporte", en: "Contact & Support" },
  "footer.rights": { es: "Todos los derechos reservados.", en: "All rights reserved." },
  "footer.madeWith": {
    es: "Hecho con amor para toda Latinoamérica",
    en: "Made with love for all of Latin America",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "es",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getPreferences().language ?? "es");

  useEffect(() => subscribeToPreferences((prefs) => setLanguageState(prefs.language ?? "es")), []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setPreference("language", lang);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = TRANSLATIONS[key];
    if (!entry) return fallback || key;
    return entry[language] || entry["es"] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
