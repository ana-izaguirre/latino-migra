export interface VolunteeringProgram {
  id: string;
  title: string;
  organization: string;
  country: string;
  countryCode: string;
  category:
    | "Voluntariado"
    | "Intercambio Cultural"
    | "Au Pair"
    | "Work & Travel / Working Holiday"
    | "Asistente de Idioma";
  duration: string;
  financialSupport:
    | "Alojamiento y Comida incluidos"
    | "Estipendio Mensual + Alojamiento"
    | "Beca Completa"
    | "Auto-financiado / Tarifa Base";
  visaType: string;
  importantDisclaimer: string;
  targetAudience: string;
  description: string;
  requirements: string[];
  benefits: string[];
  link: string;
  imageUrl: string;
}

export const VOLUNTEERING_PROGRAMS_DATA: VolunteeringProgram[] = [
  {
    id: "cuerpo-europeo-solidaridad",
    title: "Cuerpo Europeo de Solidaridad (CES / European Solidarity Corps)",
    organization: "Unión Europea (Comisión Europea)",
    country: "España, Portugal, Alemania, Francia",
    countryCode: "EU",
    category: "Voluntariado",
    duration: "2 a 12 meses",
    financialSupport: "Beca Completa",
    visaType: "Visado de Voluntariado / CES Nacional",
    importantDisclaimer:
      "⚠️ Este programa NO otorga residencia permanente ni permiso de trabajo por cuenta ajena. Es exclusivamente para servicio comunitario voluntario y aprendizaje intercultural.",
    targetAudience:
      "Jóvenes de 18 a 30 años (incluye países asociados de América Latina en convenios específicos)",
    description:
      "Iniciativa de la Unión Europea que financia proyectos de voluntariado en ONG, protección medioambiental, educación infantil, inclusión social y centros juveniles.",
    requirements: [
      "Tener entre 18 y 30 años al inicio del proyecto.",
      "Registro previo en el portal oficial del European Solidarity Corps.",
      "Compromiso ético con los valores comunitarios de solidaridad y tolerancia.",
      "No se requiere experiencia laboral previa ni titulación universitaria.",
    ],
    benefits: [
      "Alojamiento 100% cubierto por la organización de acogida.",
      "Dinero de bolsillo mensual (Pocket money de 150€ a 180€/mes) más manutención completa de alimentos.",
      "Seguro médico privado integral Cigna/Henner durante toda la estancia.",
      "Curso en línea de idiomas oficial (Online Language Support).",
      "Reembolso íntegro de los billetes de avión ida y vuelta.",
    ],
    link: "https://youth.europa.eu/solidarity_es",
    imageUrl:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "aiesec-global-volunteer",
    title: "AIESEC Global Volunteer & Global Talent",
    organization: "AIESEC International",
    country: "Portugal, Brasil, Alemania, Italia",
    countryCode: "GLOBAL",
    category: "Voluntariado",
    duration: "6 a 12 semanas (Intercambio corto)",
    financialSupport: "Alojamiento y Comida incluidos",
    visaType: "Visado de Corta Estancia / Turista / Voluntario según país",
    importantDisclaimer:
      "⚠️ Diseñado para desarrollo de liderazgo y proyectos alineados con los ODS de la ONU. NO es una vía de inmigración laboral ni de residencia a largo plazo.",
    targetAudience: "Estudiantes universitarios y recién graduados de 18 a 29 años",
    description:
      "Proyectos de voluntariado internacional enfocados en educación de idiomas a niños desfavorecidos, conservación ecológica, empoderamiento femenino y salud pública.",
    requirements: [
      "Edad entre 18 y 29 años.",
      "Nivel conversacional básico/intermedio del idioma local o inglés.",
      "Entrevista con el comité local de AIESEC en tu país de origen.",
      "Disponibilidad mínima de 6 semanas.",
    ],
    benefits: [
      "Alojamiento provisto en casa de familia anfitriona o residencia de voluntarios.",
      "Al menos una comida diaria proporcionada.",
      "Certificado internacional de liderazgo juvenil expedido por AIESEC.",
      "Acompañamiento en el destino por el comité local receptor.",
    ],
    link: "https://aiesec.org",
    imageUrl:
      "https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "workaway-worldpackers",
    title: "Intercambio de Habilidades Worldpackers & Workaway",
    organization: "Redes Internacionales de Anfitriones Certificados",
    country: "Portugal, Australia, España, Irlanda, Canadá",
    countryCode: "GLOBAL",
    category: "Intercambio Cultural",
    duration: "2 semanas a 6 meses",
    financialSupport: "Alojamiento y Comida incluidos",
    visaType: "Visado de Turista / Working Holiday si aplica",
    importantDisclaimer:
      "⚠️ Intercambio de 20-25 horas semanales de ayuda (recepción de hostel, eco-granjas, fotografía) a cambio de techo y comida. No se percibe salario ni sustituye un visado de trabajo legal.",
    targetAudience: "Viajeros culturales, nómadas y exploradores de cualquier edad (+18)",
    description:
      "Plataformas globales que conectan a viajeros con eco-aldeas, granjas orgánicas, escuelas comunitarias y hostales para vivir una experiencia inmersiva económica.",
    requirements: [
      "Membresía activa verificada en la plataforma.",
      "Perfil completo con habilidades comunicativas y referencias.",
      "Seguro de viaje médico internacional contratado.",
      "Respetar las horas acordadas (máx. 25h/semana) y normas del anfitrión.",
    ],
    benefits: [
      "Hospedaje gratuito en habitación privada o compartida.",
      "Desayuno y comidas completas en la mayoría de anfitriones.",
      "Clases gratuitas de idiomas, yoga o surf en muchos proyectos anfitriones.",
      "Inmersión cultural profunda con personas locales.",
    ],
    link: "https://www.worldpackers.com/es",
    imageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "working-holiday-australia",
    title: "Working Holiday Visa Australia (Subclass 462)",
    organization: "Department of Home Affairs - Australia",
    country: "Australia",
    countryCode: "AU",
    category: "Work & Travel / Working Holiday",
    duration: "12 meses (extendible a 2º y 3er año por trabajo regional)",
    financialSupport: "Estipendio Mensual + Alojamiento",
    visaType: "Working Holiday Subclass 462",
    importantDisclaimer:
      "⚠️ Permite viajar y realizar trabajos temporales remunerados para costear las vacaciones. NO es una visa de patrocinio profesional directo, aunque permite conocer el mercado laboral australiano y ahorrar.",
    targetAudience:
      "Jóvenes de 18 a 30 años de países latinoamericanos con convenio (Argentina, Chile, Perú, Uruguay, Ecuador)",
    description:
      "Visa bilateral que permite a jóvenes latinoamericanos viajar por Australia durante un año entero, trabajando hasta 6 meses con un mismo empleador en hostelería, agricultura, turismo o servicios.",
    requirements: [
      "Tener entre 18 y 30 años cumplidos.",
      "Pasaporte de un país participante (ej. Argentina, Chile, Perú, Uruguay, Ecuador).",
      "Demostrar fondos económicos mínimos ($5.000 AUD aprox. 3.200€) más pasaje de regreso.",
      "Nivel de inglés funcional acreditado (IELTS 4.5, TOEFL o equivalente).",
      "Haber completado al menos 2 años de estudios universitarios o terciarios.",
    ],
    benefits: [
      "Permiso de trabajo a jornada completa (full-time) en territorio australiano.",
      "Salario mínimo garantizado por ley de $24.10 AUD por hora.",
      "Posibilidad de extender a un 2º y 3er año si se realizan 88 días de trabajo en zonas regionales.",
      "Estudiar cursos cortos o de inglés hasta 4 meses.",
    ],
    link: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462",
    imageUrl:
      "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "auxiliares-conversacion-espana",
    title: "Auxiliares de Conversación en Lengua Extranjera (NALCAP / MEFP)",
    organization: "Ministerio de Educación, Formación Profesional y Deportes de España",
    country: "España",
    countryCode: "ES",
    category: "Asistente de Idioma",
    duration: "8 meses (Octubre a Mayo)",
    financialSupport: "Estipendio Mensual + Alojamiento",
    visaType: "Visado de Estancia por Estudios / Intercambio",
    importantDisclaimer:
      "⚠️ Se colabora como asistente en centros educativos de primaria y secundaria. Otorga asignación mensual libre de impuestos, pero es una estancia temporal de formación docente.",
    targetAudience: "Graduados universitarios o estudiantes de último año",
    description:
      "Programa oficial que asigna a asistentes en colegios públicos españoles para impartir clases de conversación (14-16 horas por semana) recibiendo una mensualidad.",
    requirements: [
      "Título universitario de grado o cursando el último año.",
      "Dominio nativo o C1/C2 del idioma enseñado (inglés/francés/alemán).",
      "Sin antecedentes penales.",
      "Carta de motivación y expediente académico.",
    ],
    benefits: [
      "Asignación mensual de 700€ a 1.000€ según la Comunidad Autónoma.",
      "Jornada reducida de 14 a 16 horas semanales con fines de semana libres para viajar.",
      "Seguro médico completo cubierto por la Consejería de Educación.",
      "Días festivos escolares retribuidos.",
    ],
    link: "https://www.educacionfpydeportes.gob.es",
    imageUrl:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "au-pair-europa",
    title: "Programa Cultural Au Pair en Familia Anfitriona",
    organization: "Agencias Acreditadas Au Pair (IAPA / AuPairWorld)",
    country: "Alemania, Francia, España, Australia",
    countryCode: "GLOBAL",
    category: "Au Pair",
    duration: "6 a 12 meses",
    financialSupport: "Estipendio Mensual + Alojamiento",
    visaType: "Visado Au Pair Nacional (ej. Au-Pair Visum Alemania)",
    importantDisclaimer:
      "⚠️ Es una estancia de convivencia familiar donde se cuida a los niños de la casa a cambio de alojamiento, comida y dinero de bolsillo. NO es empleo doméstico formal ordinario.",
    targetAudience: "Jóvenes de 18 a 26/30 años solteros y sin hijos",
    description:
      "Vivir con una familia anfitriona europea, cuidando a sus hijos hasta 30h semanales y asistiendo a academias de idiomas locales con gastos básicos resueltos.",
    requirements: [
      "Edad entre 18 y 26 años (Alemania/Francia) o hasta 30 años según el país.",
      "Conocimientos básicos del idioma del país anfitrión (ej. A1 alemán certificado por Goethe).",
      "Gusto genuino por el cuidado de niños y referencias.",
      "No tener hijos propios ni estar casado.",
    ],
    benefits: [
      "Habitación privada individual y alimentación completa 7 días a la semana.",
      "Dinero de bolsillo mensual reglamentado (aprox. 280€ a 350€/mes en Alemania / Francia).",
      "Subsidio o aporte de la familia anfitriona para el curso de idiomas (50€/mes).",
      "Seguro médico y de accidentes cubierto por la familia anfitriona.",
    ],
    link: "https://www.aupairworld.com/es",
    imageUrl:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80",
  },
];
