import React, { createContext, useContext, useState, useEffect } from "react";

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
  "nav.becas": { es: "Becas", en: "Scholarships" },
  "nav.guia": { es: "Guía de Migración", en: "Migration Guide" },
  "nav.mapa": { es: "Mapa Consular", en: "Consular Map" },
  "nav.comunidad": { es: "Comunidad", en: "Community" },
  "nav.feedback": { es: "Sugerencias", en: "Feedback" },
  "nav.chat": { es: "Chat IA", en: "AI Chat" },
  "nav.login": { es: "Acceder", en: "Sign In" },
  "nav.logout": { es: "Cerrar Sesión", en: "Sign Out" },
  "nav.tagline": { es: "Plataforma de Migración & Becas para Latinoamérica", en: "Migration & Scholarship Platform for Latin America" },

  // Hero & General
  "hero.badge": { es: "Plataforma Gratuita para Migrantes y Becarios", en: "Free Platform for Migrants and Scholars" },
  "hero.title": { es: "Tu futuro en el extranjero comienza con claridad", en: "Your future abroad begins with clarity" },
  "hero.subtitle": { es: "Descubre becas vigentes, requisitos oficiales de visados, costo de vida real en tu moneda y conecta con una comunidad de apoyo mutuo.", en: "Discover active scholarships, official visa requirements, real cost of living in your currency, and connect with a mutual support community." },
  "hero.ctaPlan": { es: "Crear mi Plan Migratorio", en: "Build My Migration Plan" },
  "hero.ctaScholarships": { es: "Explorar Becas Activas", en: "Explore Scholarships" },
  "hero.ctaAI": { es: "Evaluar Perfil con IA", en: "Evaluate Profile with AI" },

  // Profile Evaluator Banner
  "evaluator.title": { es: "Diagnóstico de Perfil Migratorio con IA", en: "AI Migration Profile Diagnosis" },
  "evaluator.desc": { es: "Descubre cuál es tu mejor país, tipo de visa o beca según tu carrera, edad, situación familiar y ahorros.", en: "Find out your best country, visa type, or scholarship based on your career, age, family status, and savings." },
  "evaluator.btn": { es: "Iniciar Evaluación Gratuita", en: "Start Free Assessment" },

  // Community
  "community.title": { es: "Foros y Experiencias de Migrantes", en: "Forums & Migrant Experiences" },
  "community.subtitle": { es: "Conéctate con miles de latinoamericanos compartiendo consejos reales sobre alojamientos, trámites y vida estudiantil.", en: "Connect with thousands of Latin Americans sharing real tips on housing, paperwork, and student life." },
  "community.createBtn": { es: "Crear Publicación", en: "Create Post" },
  "community.searchPlaceholder": { es: "Buscar tema, ciudad o pregunta...", en: "Search topic, city, or question..." },
  "community.duplicateAlert": { es: "¡Prevención de Duplicados! Temas similares ya respondidos:", en: "Duplicate Prevention! Similar topics already answered:" },
  "community.howToTitle": { es: "¿Cómo funciona la Comunidad LatinoMigra?", en: "How does LatinoMigra Community work?" },

  // Chat
  "chat.evalProfile": { es: "🎯 Diagnosticar Mi Perfil", en: "🎯 Diagnose My Profile" },
  "chat.welcomeTitle": { es: "¡Hola! ¿Cómo puedo orientar tu plan migratorio?", en: "Hello! How can I guide your migration journey?" },
  "chat.welcomeSubtitle": { es: "Soy tu asesor de IA para becas completas, visas de trabajo, búsqueda de empleo y migración con o sin familia.", en: "I'm your AI advisor for full scholarships, work visas, job search, and migrating with or without family." },
  "chat.inputPlaceholder": { es: "Pregunta sobre visas, becas, ciudades o tu situación profesional...", en: "Ask about visas, scholarships, cities, or your career profile..." },
  "chat.disclaimer": { es: "LatinoMigra IA es una guía orientativa. Verifica siempre la información oficial en los consulados correspondientes.", en: "LatinoMigra AI is an informative guide. Always verify official details at the respective embassies or consulates." },

  // Footer
  "footer.tools": { es: "Herramientas", en: "Tools" },
  "footer.community": { es: "Comunidad", en: "Community" },
  "footer.legal": { es: "Garantía y Legal", en: "Guarantee & Legal" },
  "footer.verified": { es: "Fuentes 100% Verificadas", en: "100% Verified Sources" },
  "footer.terms": { es: "Términos y Condiciones", en: "Terms & Conditions" },
  "footer.privacy": { es: "Política de Privacidad", en: "Privacy Policy" },
  "footer.guidelines": { es: "Normas de Convivencia", en: "Community Guidelines" },
  "footer.contact": { es: "Contacto y Soporte", en: "Contact & Support" },
  "footer.rights": { es: "Todos los derechos reservados.", en: "All rights reserved." },
  "footer.madeWith": { es: "Hecho con amor para Latinoamérica", en: "Made with love for Latin America" },
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
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("latinomigra_lang");
    return saved === "en" || saved === "es" ? saved : "es";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("latinomigra_lang", lang);
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
