import { Scholarship } from "../types";

export const SCHOLARSHIPS_DATA: Scholarship[] = [
  {
    id: "beca-carolina-2026",
    title: "Beca Excelencia Fundación Carolina",
    institution: "Universidad Complutense de Madrid / Universidades Españolas",
    country: "España",
    countryCode: "ES",
    area: "STEM",
    supportType: "Beca Completa",
    deadline: "Cierra en 15 días (15 Oct)",
    deadlineDate: "2026-10-15",
    daysLeft: 15,
    isUrgent: true,
    description: "Financia estudios de máster y posgrados en universidades públicas y privadas de España para graduados de la Comunidad Iberoamericana de Naciones.",
    requirements: [
      "Ser nacional de un país de la Comunidad Iberoamericana de Naciones (Latinoamérica, Portugal, España).",
      "Poseer título universitario oficial de grado o licenciatura.",
      "Acreditar expediente académico con nota promedio traducida a escala española.",
      "Cumplir con los requisitos de admisión del programa universitario específico."
    ],
    benefits: [
      "Matrícula 100% cubierta o 80% según el convenio.",
      "Boleto de avión de ida y vuelta desde el país de origen.",
      "Asignación mensual para manutención (aprox. 750€ - 1,000€).",
      "Seguro médico de viaje y enfermedad no farmacéutico."
    ],
    link: "https://www.fundacioncarolina.es",
    imageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "daad-masters-germany",
    title: "DAAD Scholarship for Masters in EPOS",
    institution: "Múltiples Universidades en Alemania",
    country: "Alemania",
    countryCode: "DE",
    area: "STEM",
    supportType: "Beca Parcial",
    deadline: "Cierra el 30 Nov",
    deadlineDate: "2026-11-30",
    daysLeft: 61,
    isUrgent: false,
    description: "El Servicio Alemán de Intercambio Académico (DAAD) ofrece becas a profesionales de países en desarrollo para maestría en ingeniería, tecnología y desarrollo.",
    requirements: [
      "Mínimo 2 años de experiencia profesional calificada posterior al título universitario.",
      "Título universitario de grado en área afín.",
      "Dominio de inglés (TOEFL/IELTS) o alemán según el programa elegido.",
      "Carta de motivación y proyecto de impacto para el país de origen."
    ],
    benefits: [
      "Estipendio mensual de 934€ para estudiantes de máster.",
      "Seguro de salud, accidentes y responsabilidad personal.",
      "Subsidio para gastos de viaje internacional.",
      "Curso previo de idioma alemán intensivo financiado."
    ],
    link: "https://www.daad.de",
    imageUrl: "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "fulbright-usa-2026",
    title: "Fulbright Foreign Student Program",
    institution: "Universidades Asociadas en Estados Unidos",
    country: "Estados Unidos",
    countryCode: "US",
    area: "Todas las áreas",
    supportType: "Beca Completa",
    deadline: "Cierra el 01 Dic",
    deadlineDate: "2026-12-01",
    daysLeft: 62,
    isUrgent: false,
    description: "Programa insigne del gobierno de EE.UU. para jóvenes profesionales y académicos latinoamericanos que desean realizar estudios de máster o doctorado.",
    requirements: [
      "Ciudadanía de un país latinoamericano con comisión o sección Fulbright activa.",
      "Grado académico universitario con promedio elevado.",
      "Alto nivel de inglés certificado (TOEFL iBT > 90 o Duolingo/GRE según comisión nacional).",
      "Compromiso de regresar al país de origen al finalizar los estudios (Visa J-1)."
    ],
    benefits: [
      "Costo total de matrícula universitaria (Tuition waiver).",
      "Estipendio mensual ajustado al costo de vida de la ciudad universitaria.",
      "Pasaje aéreo de ida y regreso.",
      "Seguro médico patrocinado por el Departamento de Estado de EE.UU."
    ],
    link: "https://fulbrightstate.gov",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "chevening-uk-2026",
    title: "Becas Chevening del Reino Unido",
    institution: "Universidades del Reino Unido (Oxford, Cambridge, LSE, etc.)",
    country: "Reino Unido",
    countryCode: "GB",
    area: "Negocios",
    supportType: "Beca Completa",
    deadline: "Cierra el 05 Nov",
    deadlineDate: "2026-11-05",
    daysLeft: 36,
    isUrgent: false,
    description: "Programa mundial de becas del gobierno británico financiado por el Ministerio de Asuntos Exteriores para formar a los futuros líderes mundiales.",
    requirements: [
      "Demostrar mínimo 2 años de experiencia laboral (2,000 horas).",
      "Solicitar 3 cursos universitarios elegibles en el Reino Unido.",
      "Retornar al país de ciudadanía por un mínimo de 2 años al terminar.",
      "Liderazgo demostrado y plan de carrera claro a 5 años."
    ],
    benefits: [
      "Costo completo de matrícula universitaria.",
      "Asignación mensual de manutención viviendo en Londres o provincias.",
      "Vuelos en clase económica de ida y vuelta.",
      "Acceso exclusivo a eventos de networking con líderes del gobierno británico."
    ],
    link: "https://www.chevening.org",
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "vanier-canada-2026",
    title: "Becas de Doctorado Vanier Canadá",
    institution: "Universidades de Canadá",
    country: "Canadá",
    countryCode: "CA",
    area: "Salud",
    supportType: "Beca Completa",
    deadline: "Cierra el 20 Oct",
    deadlineDate: "2026-10-20",
    daysLeft: 20,
    isUrgent: true,
    description: "Atrae a los estudiantes de doctorado más cualificados del mundo en salud, ciencias naturales, ingeniería, ciencias sociales y humanidades.",
    requirements: [
      "Ser nominado por una institución canadiense con cuota Vanier.",
      "Demostrar excelencia académica, potencial de investigación y capacidad de liderazgo.",
      "Dominio de inglés o francés académico.",
      "Propuesta de investigación de alto impacto."
    ],
    benefits: [
      "50,000 $CAD al año durante 3 años de doctorado.",
      "Cobertura de investigación y desarrollo científico.",
      "Oportunidad de residencia permanente canadiense posterior al programa."
    ],
    link: "https://vanier.gc.ca",
    imageUrl: "https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "becas-oea-2026",
    title: "Programa de Becas OEA - PAEC",
    institution: "Red de Universidades Aliadas OEA en Las Américas y Europa",
    country: "España",
    countryCode: "ES",
    area: "Artes y Humanidades",
    supportType: "Beca Parcial",
    deadline: "Cierra el 15 Nov",
    deadlineDate: "2026-11-15",
    daysLeft: 46,
    isUrgent: false,
    description: "La Organización de los Estados Americanos (OEA) apoya a ciudadanos de Estados miembros con descuentos en colegiaturas del 30% al 80% para maestrías en línea y presenciales.",
    requirements: [
      "Ser ciudadano o residente permanente de un Estado Miembro de la OEA.",
      "No haber recibido previamente una beca OEA para el mismo nivel de estudios.",
      "Estar admitido en una universidad del convenio OEA."
    ],
    benefits: [
      "Descuento directo entre el 50% y 100% del valor de la colegiatura.",
      "Acompañamiento personalizado durante la solicitud de visado consular.",
      "Certificado internacional conjunto OEA e institución educativa."
    ],
    link: "https://www.oas.org/scholarships",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
  }
];
