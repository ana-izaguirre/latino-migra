import { CountryGuide } from "../types";

export const MIGRATION_GUIDES_DATA: Record<string, CountryGuide> = {
  ES: {
    id: "ES",
    country: "España",
    flag: "🇪🇸",
    heroImage: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80",
    estimatedTime: "3 - 6 Meses",
    visas: [
      {
        id: "student-visa-es",
        name: "Visado de Estudiante",
        tag: "Más Solicitada",
        description: "Para estancias superiores a 90 días con fines de estudio, formación, intercambio académico o investigación en centros autorizados.",
        duration: "1 año (renovable por duración del programa)",
        keyRequirements: [
          "Carta de admisión de universidad o centro oficial registrado.",
          "Demostración de medios económicos (100% IPREM mensual: aprox. 600€/mes).",
          "Seguro de salud privado sin copagos en España.",
          "Antecedentes penales apostillados en país de origen (últimos 3 meses)."
        ]
      },
      {
        id: "nomad-visa-es",
        name: "Nómada Digital",
        tag: "Nueva Ley",
        description: "Permite residir y teletrabajar desde España para empresas o clientes fuera del territorio español.",
        duration: "3 años (inicial) + 2 años prórroga",
        keyRequirements: [
          "Demostrar relación laboral o profesional remota de al menos 3 meses.",
          "Ingresos mínimos equivalentes al 200% del Salario Mínimo Interprofesional (aprox. 2,640€/mes).",
          "Título universitario o 3 años de experiencia en la profesión."
        ]
      },
      {
        id: "non-lucrative-es",
        name: "Residencia No Lucrativa",
        tag: "Ingresos Pasivos",
        description: "Para personas o familias con fondos propios demostrables que desean vivir en España sin trabajar localmente.",
        duration: "1 año inicial",
        keyRequirements: [
          "Demostrar fondos propios de 400% IPREM anual (aprox. 28,800€).",
          "Seguro médico privado completo sin copagos.",
          "Informe de no antecedentes penales."
        ]
      }
    ],
    costs: [
      {
        category: "Alojamiento (Habitación)",
        range: "€450 - €650",
        percentage: 70,
        color: "bg-primary"
      },
      {
        category: "Alimentación",
        range: "€200 - €300",
        percentage: 45,
        color: "bg-secondary"
      },
      {
        category: "Transporte",
        range: "€20 - €50",
        percentage: 15,
        color: "bg-outline"
      }
    ],
    documents: [
      {
        id: "passport",
        title: "Pasaporte Vigente",
        subtitle: "Mínimo 1 año de vigencia restante y páginas libres.",
        completed: true
      },
      {
        id: "criminal",
        title: "Antecedentes Penales",
        subtitle: "Apostillados en país de origen, emitidos en los últimos 3 meses.",
        completed: false
      },
      {
        id: "insurance",
        title: "Seguro Médico Privado",
        subtitle: "Sin copagos ni carencias, válido para toda España.",
        completed: false
      },
      {
        id: "funds",
        title: "Acreditación de Medios Económicos",
        subtitle: "Estados de cuenta bancarios con sello o carta de patrocinio.",
        completed: false
      },
      {
        id: "acceptance",
        title: "Carta de Aceptación Universitaria",
        subtitle: "Emitida por centro registrado en la RUCT de España.",
        completed: true
      },
      {
        id: "medical",
        title: "Certificado Médico Oficial",
        subtitle: "Conste ausencia de enfermedades de salud pública grave (RSI 2005).",
        completed: false
      }
    ],
    communityTip: {
      title: "El empadronamiento es lo primero",
      text: "Apenas llegues a tu ciudad en España, pide cita para empadronarte en el Ayuntamiento. Sin el certificado de empadronamiento no podrás tramitar tu TIE (Tarjeta de Identidad de Extranjero), abrir cuenta bancaria ni registrarte en la red médica.",
      author: "Comunidad LatinoMigra Madrid"
    }
  },
  DE: {
    id: "DE",
    country: "Alemania",
    flag: "🇩🇪",
    heroImage: "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&w=1200&q=80",
    estimatedTime: "4 - 7 Meses",
    visas: [
      {
        id: "student-visa-de",
        name: "Visado de Estudiante (Visum zur Ausbildung)",
        tag: "Recomendado",
        description: "Para estudios universitarios de grado, máster o curso preparatorio (Studienkolleg).",
        duration: "1-2 años renovables",
        keyRequirements: [
          "Cuenta bloqueada (Sperrkonto) con aprox. 11,208€/año.",
          "Carta de admisión de la universidad alemana o uni-assist.",
          "Seguro de salud público o privado reconocido en Alemania (GKV/PKV).",
          "Certificado de nivel de idioma B2/C1 (Inglés o Alemán)."
        ]
      },
      {
        id: "opportunity-card-de",
        name: "Tarjeta de Oportunidad (Chancenkarte)",
        tag: "Nueva Ley 2024",
        description: "Basado en un sistema de puntos para buscar empleo directamente en territorio alemán.",
        duration: "1 año",
        keyRequirements: [
          "Título universitario o técnico reconocido.",
          "Acumular mínimo 6 puntos (idiomas, experiencia, edad, vínculo).",
          "Demostrar fondos de manutención mensual (aprox. 1,027€/mes)."
        ]
      }
    ],
    costs: [
      {
        category: "Alojamiento (WG / Habitación)",
        range: "€400 - €700",
        percentage: 75,
        color: "bg-primary"
      },
      {
        category: "Alimentación",
        range: "€250 - €350",
        percentage: 50,
        color: "bg-secondary"
      },
      {
        category: "Seguro Médico y Transporte",
        range: "€120 - €160",
        percentage: 25,
        color: "bg-outline"
      }
    ],
    documents: [
      {
        id: "sperrkonto",
        title: "Cuenta Bloqueada (Sperrkonto)",
        subtitle: "Apertura previa en Fintiba, Coracle o Expatrio.",
        completed: false
      },
      {
        id: "insurance-de",
        title: "Seguro de Salud Aceptado",
        subtitle: "Cobertura desde el día de llegada a Alemania.",
        completed: true
      },
      {
        id: "anabin",
        title: "Apostilla y Homologación Anabin",
        subtitle: "Verificación de equivalencia del título universitario.",
        completed: false
      }
    ],
    communityTip: {
      title: "Consigue la cita de la Anmeldung rápido",
      text: "El registro de domicilio (Anmeldung) en Alemania es obligatorio en las primeras 2 semanas. Sin él no tendrás tu Tax ID ni tu cuenta bancaria operativa.",
      author: "Comunidad LatinoMigra Berlín"
    }
  },
  US: {
    id: "US",
    country: "Estados Unidos",
    flag: "🇺🇸",
    heroImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    estimatedTime: "5 - 8 Meses",
    visas: [
      {
        id: "f1-visa-us",
        name: "Visa de Estudiante F-1",
        tag: "Más Popular",
        description: "Para realizar programas académicos de tiempo completo en universidades o colegios aprobados por SEVP.",
        duration: "Duración del programa + OPT",
        keyRequirements: [
          "Formulario I-20 emitido por la universidad.",
          "Pago de tarifa SEVIS I-901 y formulario DS-160.",
          "Demostrar lazos financieros y lazos sólidos con el país de origen."
        ]
      },
      {
        id: "j1-visa-us",
        name: "Visa J-1 (Intercambio)",
        tag: "Becas Oficiales",
        description: "Utilizada comunmente para becarios Fulbright, investigadores y pasantes.",
        duration: "Variable",
        keyRequirements: [
          "Formulario DS-2019 de la entidad patrocinadora.",
          "Acreditar fondos o beca del gobierno.",
          "Cumplir con la regla de 2 años de residencia en país de origen tras concluir."
        ]
      }
    ],
    costs: [
      {
        category: "Alojamiento (Dorm/Apto)",
        range: "$700 - $1,200 USD",
        percentage: 85,
        color: "bg-primary"
      },
      {
        category: "Alimentación",
        range: "$300 - $500 USD",
        percentage: 60,
        color: "bg-secondary"
      },
      {
        category: "Seguro Médico Estudiantil",
        range: "$150 - $300 USD",
        percentage: 30,
        color: "bg-outline"
      }
    ],
    documents: [
      {
        id: "i20",
        title: "Formulario I-20 / DS-2019",
        subtitle: "Documento oficial de elegibilidad universitaria.",
        completed: true
      },
      {
        id: "sevis",
        title: "Comprobante Pago SEVIS I-901",
        subtitle: "Registrado previo a la cita en la embajada.",
        completed: false
      },
      {
        id: "ds160",
        title: "Formulario DS-160 Confirmado",
        subtitle: "Solicitud electrónica de visa de no inmigrante.",
        completed: true
      }
    ],
    communityTip: {
      title: "Prepárate para la entrevista consular",
      text: "En la entrevista F-1, lo más crítico es demostrar con claridad que tienes los fondos suficientes y tu intención honesta de estudiar e inspirar el desarrollo de tu país de origen al graduarte.",
      author: "Comunidad LatinoMigra Boston"
    }
  }
};
