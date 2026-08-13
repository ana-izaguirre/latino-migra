import { Scholarship } from "../types";

export const SCHOLARSHIPS_DATA: Scholarship[] = [
  // 1. FUNDACIÓN CAROLINA
  {
    id: "beca-carolina-2026",
    title: "Beca Excelencia Fundación Carolina",
    institution: "Universidad Complutense de Madrid / Universidades Españolas",
    institutionType: "Fundación",
    officialPortalName: "Fundación Carolina (Oficial)",
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
      "Matrícula 100% cubierta o 80% según el convenio específico.",
      "Boleto de avión de ida y vuelta desde el país de origen.",
      "Asignación mensual para manutención (aprox. 750€ - 1,000€).",
      "Seguro médico de viaje y enfermedad no farmacéutico."
    ],
    link: "https://www.fundacioncarolina.es",
    imageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80"
  },

  // 2. UNIVERSIDAD DE SALAMANCA (USAL)
  {
    id: "beca-usal-internacional",
    title: "Becas de Máster Universitario Internacional USAL",
    institution: "Universidad de Salamanca (USAL)",
    institutionType: "Universidad Directa",
    officialPortalName: "Portal Oficial USAL (usal.es)",
    country: "España",
    countryCode: "ES",
    area: "Artes y Humanidades",
    supportType: "Beca Completa",
    deadline: "Cierra el 28 Feb",
    deadlineDate: "2027-02-28",
    daysLeft: 199,
    isUrgent: false,
    description: "La Universidad de Salamanca otorga becas completas de máster para estudiantes iberoamericanos con excelencia académica, incluyendo exención total de matrícula y alojamiento en colegios mayores.",
    requirements: [
      "Nacionalidad de un país de América Latina.",
      "Título universitario que dé acceso a estudios de Máster Oficial.",
      "Nota media de grado superior a 8.0/10 o equivalente.",
      "No haber residido en España durante los dos años anteriores."
    ],
    benefits: [
      "Exención del 100% de los precios públicos de matrícula del Máster (60 ECTS).",
      "Alojamiento y manutención en el Colegio Mayor Universitario San Bartolomé.",
      "Seguro médico de asistencia sanitaria y accidentes.",
      "Asignación de 750€ para gastos de viaje e instalación."
    ],
    link: "https://rel-int.usal.es/es/proyectos-internacionales/becas-internacionales-de-la-usal",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80"
  },

  // 3. ASOCIACIÓN UNIVERSITARIA IBEROAMERICANA DE POSGRADO (AUIP)
  {
    id: "becas-auip-andalucia",
    title: "Becas AUIP de Movilidad Académica y Máster",
    institution: "Universidades Públicas de Andalucía (Sevilla, Granada, Málaga, Cádiz)",
    institutionType: "Organismo Internacional",
    officialPortalName: "Sede Electrónica AUIP (auip.org)",
    country: "España",
    countryCode: "ES",
    area: "STEM",
    supportType: "Beca Parcial",
    deadline: "Cierra el 30 Abr",
    deadlineDate: "2027-04-30",
    daysLeft: 260,
    isUrgent: false,
    description: "Programa conjunto entre la AUIP y la Junta de Andalucía para facilitar que titulados latinoamericanos cursen másteres oficiales en universidades andaluzas con ayuda de traslado y matrícula subvencionada.",
    requirements: [
      "Estar vinculado o graduado en una universidad latinoamericana asociada a la AUIP.",
      "Carta de aval institucional del Rector o Decano de origen.",
      "Preinscripción realizada en el Distrito Único Andaluz (DUA).",
      "Currículum vitae académico y carta de motivos."
    ],
    benefits: [
      "Bolsa de viaje de hasta 1,500€ para traslado internacional.",
      "Exención de tasas académicas de matrícula en la universidad de destino.",
      "Acceso prioritario a residencias universitarias públicas.",
      "Reconocimiento de créditos y doble titulación."
    ],
    link: "https://www.auip.org/es/becas-auip",
    imageUrl: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80"
  },

  // 4. DAAD ALEMANIA
  {
    id: "daad-masters-germany",
    title: "DAAD Helmut-Schmidt-Programme (PPGG)",
    institution: "Universidades Asociadas de Alemania (Passau, Erfurt, Duisburg, Potsdam)",
    institutionType: "Gubernamental",
    officialPortalName: "DAAD Germany (daad.de)",
    country: "Alemania",
    countryCode: "DE",
    area: "Negocios",
    supportType: "Beca Completa",
    deadline: "Cierra el 30 Nov",
    deadlineDate: "2026-11-30",
    daysLeft: 109,
    isUrgent: false,
    description: "El Servicio Alemán de Intercambio Académico (DAAD) financia másteres en Gobernanza, Políticas Públicas y Desarrollo para futuros líderes latinoamericanos.",
    requirements: [
      "Título universitario en Ciencias Sociales, Economía, Derecho o Administración.",
      "Promedio académico en el tercio superior de su promoción.",
      "Certificado de inglés B2/C1 (IELTS mínimo 6.5 o TOEFL iBT 90).",
      "Carta de motivación demostrando vocación de servicio público o impacto social."
    ],
    benefits: [
      "Estipendio mensual libre de impuestos de 934€.",
      "Subsidio de pasajes aéreos internacionales de ida y regreso.",
      "Seguro médico completo en Alemania para el becario.",
      "Curso intensivo de idioma alemán de 6 meses gratuito antes del inicio."
    ],
    link: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    imageUrl: "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&w=800&q=80"
  },

  // 5. ETH ZURICH (SUIZA)
  {
    id: "eth-zurich-esop",
    title: "Excellence Scholarship & Opportunity Programme (ESOP)",
    institution: "ETH Zurich (Swiss Federal Institute of Technology)",
    institutionType: "Universidad Directa",
    officialPortalName: "ETH Zurich Official (ethz.ch)",
    country: "Suiza",
    countryCode: "CH",
    area: "STEM",
    supportType: "Beca Completa",
    deadline: "Cierra el 15 Dic",
    deadlineDate: "2026-12-15",
    daysLeft: 124,
    isUrgent: false,
    description: "ETH Zurich premia a los estudiantes de máster con los mejores expedientes del mundo con una beca completa que cubre matrícula, manutención y tutoría de investigación.",
    requirements: [
      "Excelente rendimiento académico en la licenciatura (Top 10% de la clase, nota equivalente a Grado A).",
      "Propuesta de tesis o proyecto de investigación para la maestría.",
      "Dos cartas de recomendación de profesores titulares.",
      "Admisión formal en un programa de Master of Science en ETH Zurich."
    ],
    benefits: [
      "Cobertura total de las tasas de matrícula universitaria en Suiza.",
      "Estipendio de manutención de 12,000 CHF por semestre (aprox. 24,000 CHF al año).",
      "Supervisión directa de profesores de élite mundial y networking científico.",
      "Exención de pago de tasas administrativas universitarias."
    ],
    link: "https://ethz.ch/students/en/studies/financial/scholarships/excellencescholarship.html",
    imageUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80"
  },

  // 6. ERASMUS MUNDUS (UNIÓN EUROPEA)
  {
    id: "erasmus-mundus-emjmd",
    title: "Becas Erasmus Mundus Joint Master Degrees (EMJM)",
    institution: "Consorcio de Universidades Europeas (Francia, Alemania, Italia, España)",
    institutionType: "Organismo Internacional",
    officialPortalName: "Comisión Europea (erasmus-plus.ec.europa.eu)",
    country: "España",
    countryCode: "EU",
    area: "STEM",
    supportType: "Beca Completa",
    deadline: "Cierra el 15 Ene",
    deadlineDate: "2027-01-15",
    daysLeft: 155,
    isUrgent: false,
    description: "Másteres internacionales conjuntos de excelencia impartidos por al menos tres universidades europeas de países distintos, con título múltiple y financiación 100% comunitaria.",
    requirements: [
      "Título universitario de grado previo en área afín al máster seleccionado.",
      "Dominio certificado de inglés académico (C1 recomendado).",
      "No haber residido en la Unión Europea por más de 12 meses en los últimos 5 años.",
      "Carta de motivación específica y 2 referencias académicas internacionales."
    ],
    benefits: [
      "Financiación del 100% de la matrícula y costos de laboratorio.",
      "Asignación mensual de 1,400€ durante los 24 meses de la maestría.",
      "Subsidio de viaje internacional e instalación (hasta 3,000€ anuales).",
      "Seguro médico internacional integral de la Unión Europea."
    ],
    link: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters",
    imageUrl: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80"
  },

  // 7. POLIMI / INVEST YOUR TALENT IN ITALY (ITALIA)
  {
    id: "invest-talent-italy",
    title: "Invest Your Talent in Italy - Laurea Magistrale",
    institution: "Politecnico di Milano / Università di Bologna / Sapienza",
    institutionType: "Universidad Directa",
    officialPortalName: "Ministero degli Affari Esteri (postgradinitaly.esteri.it)",
    country: "Italia",
    countryCode: "IT",
    area: "STEM",
    supportType: "Beca Completa",
    deadline: "Cierra el 01 Mar",
    deadlineDate: "2027-03-01",
    daysLeft: 200,
    isUrgent: false,
    description: "Programa del Ministerio de Relaciones Exteriores de Italia y universidades italianas que combina beca académica de máster en inglés con una pasantía profesional remunerada en empresas italianas.",
    requirements: [
      "Nacionalidad de países seleccionados (incluye Colombia, México, Brasil, etc.).",
      "Título de grado en Ingeniería, Tecnología, Arquitectura, Economía o Administración.",
      "Nivel B2 de inglés (o italiano si aplica).",
      "Edad menor a 26 años al momento de postular."
    ],
    benefits: [
      "Exención del 100% del pago de matrícula universitaria en Italia.",
      "Beca mensual de 900€ depositada directamente en cuenta bancaria italiana.",
      "Pasantía obligatoria de 3 meses garantizada en prestigiosas compañías italianas.",
      "Cursos gratuitos de idioma y cultura italiana."
    ],
    link: "https://postgradinitaly.esteri.it/postgradinitaly/en/invest-your-talent-in-italy",
    imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80"
  },

  // 8. CAMPUS FRANCE / BECAS EIFFEL (FRANCIA)
  {
    id: "eiffel-campus-france",
    title: "Beca Eiffel de Excelencia",
    institution: "Sorbonne Université / École Polytechnique / Université Paris-Saclay",
    institutionType: "Gubernamental",
    officialPortalName: "Campus France (campusfrance.org)",
    country: "Francia",
    countryCode: "FR",
    area: "STEM",
    supportType: "Beca Completa",
    deadline: "Cierra el 10 Ene",
    deadlineDate: "2027-01-10",
    daysLeft: 150,
    isUrgent: false,
    description: "Herramienta desarrollada por el Ministerio para Europa y de Asuntos Exteriores de Francia para permitir que las universidades francesas atraigan a los mejores estudiantes extranjeros a formaciones de Máster y Doctorado.",
    requirements: [
      "Ser postulado directamente por una universidad francesa (no por el estudiante individualmente).",
      "Nacionalidad no francesa (abierto a todos los países latinoamericanos).",
      "Menor de 25 años para máster / Menor de 30 años para doctorado.",
      "Excelencia académica demostrada y proyecto profesional coherente."
    ],
    benefits: [
      "Asignación mensual de 1,181€ (Máster) o 1,800€ (Doctorado).",
      "Billetes de avión ida y vuelta internacional cubiertos por el gobierno francés.",
      "Cobertura de seguro médico Campus France y actividades culturales.",
      "Acceso prioritario y reservado a residencias estudiantiles públicas CROUS."
    ],
    link: "https://www.campusfrance.org/es/el-programa-de-becas-eiffel",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80"
  },

  // 9. PAÍSES BAJOS - NL SCHOLARSHIP (TU DELFT / UNIV AMSTERDAM)
  {
    id: "nl-scholarship-holland",
    title: "NL Scholarship (Antes Holland Scholarship)",
    institution: "TU Delft / University of Amsterdam / Erasmus University Rotterdam",
    institutionType: "Universidad Directa",
    officialPortalName: "Study in NL (studyinnl.org)",
    country: "Países Bajos",
    countryCode: "NL",
    area: "STEM",
    supportType: "Beca Parcial",
    deadline: "Cierra el 01 Feb",
    deadlineDate: "2027-02-01",
    daysLeft: 172,
    isUrgent: false,
    description: "Financiada por el Ministerio de Educación, Cultura y Ciencia de los Países Bajos junto con universidades de investigación neerlandesas para estudiantes internacionales no pertenecientes al EEE.",
    requirements: [
      "Nacionalidad no perteneciente a la Unión Europea.",
      "Haber solicitado admisión a un programa de licenciatura o máster a tiempo completo.",
      "Cumplir los requisitos de idioma inglés (IELTS 6.5+ o TOEFL 90+).",
      "No haber obtenido previamente un título en los Países Bajos."
    ],
    benefits: [
      "Beca de 5,000€ otorgada durante el primer año de estudios.",
      "Descuento en tasas de matrícula en universidades asociadas.",
      "Asistencia en el trámite de permiso de residencia MVV/VVR.",
      "Red de exalumnos NL Alumni Network con conexiones en empresas globales."
    ],
    link: "https://www.studyinnl.org/finances/nl-scholarship",
    imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80"
  },

  // 10. SUECIA - KAROLINSKA INSTITUTET (SALUD / MEDICINA)
  {
    id: "karolinska-global-masters",
    title: "Karolinska Institutet Global Master's Scholarship",
    institution: "Karolinska Institutet (Suecia - Comité Nobel de Medicina)",
    institutionType: "Universidad Directa",
    officialPortalName: "Karolinska Institutet (ki.se)",
    country: "Suecia",
    countryCode: "SE",
    area: "Salud",
    supportType: "Beca Parcial",
    deadline: "Cierra el 15 Ene",
    deadlineDate: "2027-01-15",
    daysLeft: 155,
    isUrgent: false,
    description: "El prestigioso Instituto Karolinska en Estocolmo ofrece exención de matrícula a estudiantes con expedientes sobresalientes en Salud Pública, Biomedicina, Toxicología y Ciencias de la Salud.",
    requirements: [
      "Estar obligado al pago de matrícula universitaria en Suecia (ciudadanos fuera de la UE).",
      "Haber seleccionado un programa de Master Global de Karolinska como primera opción.",
      "Título universitario en Medicina, Biología, Farmacia o áreas afines a la salud.",
      "Excelente expediente académico evaluado por el comité de admisiones."
    ],
    benefits: [
      "Cobertura del 100% de la matrícula universitaria (Tuition fee waiver).",
      "Acceso a los laboratorios científicos más avanzados de Europa.",
      "Seguro médico FASPlus sueco integral para estudiantes internacionales.",
      "Contacto directo con investigadores y jurados de los Premios Nobel."
    ],
    link: "https://ki.se/en/education/scholarships",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
  },

  // 11. REINO UNIDO - GATES CAMBRIDGE
  {
    id: "gates-cambridge-scholarship",
    title: "Becas Gates Cambridge de Posgrado",
    institution: "University of Cambridge",
    institutionType: "Universidad Directa",
    officialPortalName: "Gates Cambridge Trust (gatescambridge.org)",
    country: "Reino Unido",
    countryCode: "GB",
    area: "Todas las áreas",
    supportType: "Beca Completa",
    deadline: "Cierra el 07 Dic",
    deadlineDate: "2026-12-07",
    daysLeft: 116,
    isUrgent: false,
    description: "Creada por donación de la Fundación Bill y Melinda Gates, financia programas completos de posgrado en Cambridge para personas comprometidas a mejorar la vida de los demás.",
    requirements: [
      "Ciudadanía de cualquier país fuera del Reino Unido.",
      "Postulación a un curso de posgrado a tiempo completo en Cambridge (PhD, MSc, MLitt).",
      "Capacidad intelectual sobresaliente y potencial de liderazgo.",
      "Compromiso documentado con el bienestar social y la equidad."
    ],
    benefits: [
      "Composición de la matrícula universitaria completa en Cambridge.",
      "Asignación de manutención individual de £20,000 al año.",
      "Boleto aéreo internacional en clase turista al inicio y fin del curso.",
      "Financiación para desarrollo académico, conferencias y cursos de campo."
    ],
    link: "https://www.gatescambridge.org/apply/overview/",
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80"
  },

  // 12. CHEVENING REINO UNIDO
  {
    id: "chevening-uk-2026",
    title: "Becas Chevening del Gobierno Británico",
    institution: "Universidades del Reino Unido (Oxford, Cambridge, LSE, UCL, Edinburgh)",
    institutionType: "Gubernamental",
    officialPortalName: "Chevening UK (chevening.org)",
    country: "Reino Unido",
    countryCode: "GB",
    area: "Negocios",
    supportType: "Beca Completa",
    deadline: "Cierra el 05 Nov",
    deadlineDate: "2026-11-05",
    daysLeft: 84,
    isUrgent: false,
    description: "Programa mundial de becas del gobierno británico financiado por el Foreign, Commonwealth & Development Office para formar a los futuros líderes mundiales.",
    requirements: [
      "Demostrar mínimo 2 años de experiencia laboral (2,800 horas).",
      "Solicitar 3 cursos universitarios elegibles en el Reino Unido y recibir oferta incondicional.",
      "Retornar al país de ciudadanía por un mínimo de 2 años al terminar.",
      "Liderazgo demostrado y plan de carrera claro a 5 años."
    ],
    benefits: [
      "Costo completo de matrícula universitaria (incluso en las universidades más prestigiosas).",
      "Asignación mensual de manutención viviendo en Londres o provincias.",
      "Vuelos en clase económica de ida y vuelta.",
      "Acceso exclusivo a eventos de networking con líderes del gobierno británico."
    ],
    link: "https://www.chevening.org",
    imageUrl: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&w=800&q=80"
  },

  // 13. ESTADOS UNIDOS - FULBRIGHT
  {
    id: "fulbright-usa-2026",
    title: "Fulbright Foreign Student Program",
    institution: "Universidades Asociadas en Estados Unidos (Columbia, Harvard, Stanford, NYU)",
    institutionType: "Gubernamental",
    officialPortalName: "Fulbright Program (foreign.fulbrightonline.org)",
    country: "Estados Unidos",
    countryCode: "US",
    area: "Todas las áreas",
    supportType: "Beca Completa",
    deadline: "Cierra el 01 Dic",
    deadlineDate: "2026-12-01",
    daysLeft: 110,
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
    link: "https://foreign.fulbrightonline.org",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80"
  },

  // 14. CANADÁ - UNIVERSITY OF TORONTO LESTER B. PEARSON
  {
    id: "uoft-pearson-scholarship",
    title: "Lester B. Pearson International Scholarship",
    institution: "University of Toronto",
    institutionType: "Universidad Directa",
    officialPortalName: "University of Toronto (future.utoronto.ca)",
    country: "Canadá",
    countryCode: "CA",
    area: "Todas las áreas",
    supportType: "Beca Completa",
    deadline: "Cierra el 15 Ene",
    deadlineDate: "2027-01-15",
    daysLeft: 155,
    isUrgent: false,
    description: "Reconoce a estudiantes internacionales excepcionales que demuestran un rendimiento académico sobresaliente y creatividad, considerados líderes dentro de sus escuelas y comunidades.",
    requirements: [
      "Ser nominado oficialmente por la institución de educación secundaria o preparatoria.",
      "Solicitante internacional que requiere permiso de estudios para Canadá.",
      "Demostrar compromiso con el liderazgo comunitario y rendimiento académico de élite.",
      "Admisión a un programa de pregrado en la Universidad de Toronto."
    ],
    benefits: [
      "Matrícula completa durante los cuatro años de carrera universitaria.",
      "Gastos de libros de texto, materiales de laboratorio y cuotas incidentales.",
      "Apoyo total para residencia universitaria y manutención completa en Toronto.",
      "Tutoría personalizada y participación en el programa de liderazgo Pearson."
    ],
    link: "https://future.utoronto.ca/pearson/",
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80"
  },

  // 15. CANADÁ - VANIER DOCTORAL
  {
    id: "vanier-canada-2026",
    title: "Becas de Doctorado Vanier Canadá",
    institution: "Universidades de Canadá (McGill, UBC, UofT, Alberta)",
    institutionType: "Gubernamental",
    officialPortalName: "Vanier Canada (vanier.gc.ca)",
    country: "Canadá",
    countryCode: "CA",
    area: "Salud",
    supportType: "Beca Completa",
    deadline: "Cierra el 20 Oct",
    deadlineDate: "2026-10-20",
    daysLeft: 68,
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

  // 16. OEA - PAEC
  {
    id: "becas-oea-2026",
    title: "Programa de Becas OEA - PAEC",
    institution: "Red de Universidades Aliadas OEA en Las Américas y Europa",
    institutionType: "Organismo Internacional",
    officialPortalName: "Organización de los Estados Americanos (oas.org)",
    country: "España",
    countryCode: "ES",
    area: "Artes y Humanidades",
    supportType: "Beca Parcial",
    deadline: "Cierra el 15 Nov",
    deadlineDate: "2026-11-15",
    daysLeft: 94,
    isUrgent: false,
    description: "La Organización de los Estados Americanos (OEA) apoya a ciudadanos de Estados miembros con descuentos en colegiaturas del 50% al 100% para maestrías y doctorados.",
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
  },

  // 17. SANTANDER OPEN ACADEMY
  {
    id: "santander-open-academy",
    title: "Becas Santander Open Academy - Movilidad Iberoamérica",
    institution: "Red Universitaria Santander (Más de 1,000 universidades aliadas)",
    institutionType: "Fundación",
    officialPortalName: "Santander Open Academy (santanderopenacademy.com)",
    country: "España",
    countryCode: "ES",
    area: "Negocios",
    supportType: "Beca Parcial",
    deadline: "Cierra el 31 Mar",
    deadlineDate: "2027-03-31",
    daysLeft: 230,
    isUrgent: false,
    description: "Banco Santander impulsa la formación continua y la movilidad estudiantil de jóvenes de América Latina hacia España, Portugal y Latinoamérica con ayudas de matrícula e intercambios.",
    requirements: [
      "Estar matriculado en una universidad iberoamericana en convenio.",
      "Haber superado al menos el 50% de los créditos del plan de estudios de grado.",
      "Buen expediente académico.",
      "Inscripción activa en la plataforma Santander Open Academy."
    ],
    benefits: [
      "Ayudas económicas de 1,000€ a 3,000€ para cubrir costos de desplazamiento o matrícula.",
      "Acceso a cursos certificados de idiomas y habilidades digitales de Cambridge y Harvard.",
      "Comunidad global de becarios y bolsa de empleo internacional."
    ],
    link: "https://www.santanderopenacademy.com",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"
  }
];
