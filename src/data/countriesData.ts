export interface LatinCountry {
  name: string;
  code: string;
  flag: string;
  currencyCode: string;
  currencyName: string;
  region: "América del Sur" | "Centroamérica" | "Caribe" | "Norteamérica";
}

export interface DestinationCountry {
  code: string;
  name: string;
  flag: string;
  region: "Europa" | "Norteamérica" | "Oceanía";
  description: string;
  languages: string[];
  postStudyWork: string;
  currencyCode: string;
  currencySymbol: string;
}

export const LATIN_AMERICAN_COUNTRIES: LatinCountry[] = [
  { name: "Argentina", code: "AR", flag: "🇦🇷", currencyCode: "ARS", currencyName: "Peso Argentino", region: "América del Sur" },
  { name: "Bolivia", code: "BO", flag: "🇧🇴", currencyCode: "BOB", currencyName: "Boliviano", region: "América del Sur" },
  { name: "Brasil", code: "BR", flag: "🇧🇷", currencyCode: "BRL", currencyName: "Real Brasileño", region: "América del Sur" },
  { name: "Chile", code: "CL", flag: "🇨🇱", currencyCode: "CLP", currencyName: "Peso Chileno", region: "América del Sur" },
  { name: "Colombia", code: "CO", flag: "🇨🇴", currencyCode: "COP", currencyName: "Peso Colombiano", region: "América del Sur" },
  { name: "Costa Rica", code: "CR", flag: "🇨🇷", currencyCode: "CRC", currencyName: "Colón Costarricense", region: "Centroamérica" },
  { name: "Cuba", code: "CU", flag: "🇨🇺", currencyCode: "CUP", currencyName: "Peso Cubano", region: "Caribe" },
  { name: "Ecuador", code: "EC", flag: "🇪🇨", currencyCode: "USD", currencyName: "Dólar Estadounidense", region: "América del Sur" },
  { name: "El Salvador", code: "SV", flag: "🇸🇻", currencyCode: "USD", currencyName: "Dólar Estadounidense", region: "Centroamérica" },
  { name: "Guatemala", code: "GT", flag: "🇬🇹", currencyCode: "GTQ", currencyName: "Quetzal", region: "Centroamérica" },
  { name: "Honduras", code: "HN", flag: "🇭🇳", currencyCode: "HNL", currencyName: "Lempira", region: "Centroamérica" },
  { name: "México", code: "MX", flag: "🇲🇽", currencyCode: "MXN", currencyName: "Peso Mexicano", region: "Norteamérica" },
  { name: "Nicaragua", code: "NI", flag: "🇳🇮", currencyCode: "NIO", currencyName: "Córdoba", region: "Centroamérica" },
  { name: "Panamá", code: "PA", flag: "🇵🇦", currencyCode: "USD", currencyName: "Balboa / USD", region: "Centroamérica" },
  { name: "Paraguay", code: "PY", flag: "🇵🇾", currencyCode: "PYG", currencyName: "Guaraní", region: "América del Sur" },
  { name: "Perú", code: "PE", flag: "🇵🇪", currencyCode: "PEN", currencyName: "Sol Peruano", region: "América del Sur" },
  { name: "Puerto Rico", code: "PR", flag: "🇵🇷", currencyCode: "USD", currencyName: "Dólar Estadounidense", region: "Caribe" },
  { name: "República Dominicana", code: "DO", flag: "🇩🇴", currencyCode: "DOP", currencyName: "Peso Dominicano", region: "Caribe" },
  { name: "Uruguay", code: "UY", flag: "🇺🇾", currencyCode: "UYU", currencyName: "Peso Uruguayo", region: "América del Sur" },
  { name: "Venezuela", code: "VE", flag: "🇻🇪", currencyCode: "USD", currencyName: "Dólar / Bolívar", region: "América del Sur" },
];

export const DESTINATION_COUNTRIES: DestinationCountry[] = [
  {
    code: "ES",
    name: "España",
    flag: "🇪🇸",
    region: "Europa",
    description: "Nacionalidad española a los 2 años para iberoamericanos, 30h semanales de trabajo para estudiantes y visas de búsqueda de empleo.",
    languages: ["Español"],
    postStudyWork: "12 a 24 meses (Búsqueda de empleo para graduados de máster o grado)",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  {
    code: "PT",
    name: "Portugal",
    flag: "🇵🇹",
    region: "Europa",
    description: "Excelente calidad de vida, costo accesible, visado D8 para nómadas digitales, visado D2 para emprendedores y visado de búsqueda de trabajo (Procura de Trabalho).",
    languages: ["Portugués", "Inglés"],
    postStudyWork: "12 meses para egresados de instituciones portuguesas",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    region: "Oceanía",
    description: "Salarios mínimos altos (aprox. $24.10 AUD/h), permiso de trabajo de 48h quincenales para estudiantes (Subclass 500) y Post-Study Work Visa (Subclass 485) de 2 a 4 años.",
    languages: ["Inglés"],
    postStudyWork: "2 a 4 años (Subclass 485 Temporary Graduate Visa)",
    currencyCode: "AUD",
    currencySymbol: "A$",
  },
  {
    code: "DE",
    name: "Alemania",
    flag: "🇩🇪",
    region: "Europa",
    description: "Educación pública gratuita (cero colegiatura en la mayoría de estados), Chancenkarte (Tarjeta de Oportunidad) y 18 meses para buscar empleo post-estudios.",
    languages: ["Alemán", "Inglés"],
    postStudyWork: "18 meses (Post-study work permit)",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  {
    code: "CA",
    name: "Canadá",
    flag: "🇨🇦",
    region: "Norteamérica",
    description: "Vía de inmigración estructurada mediante PGWP (Post-Graduation Work Permit hasta 3 años) y puntos para Express Entry.",
    languages: ["Inglés", "Francés"],
    postStudyWork: "Hasta 3 años (PGWP)",
    currencyCode: "CAD",
    currencySymbol: "C$",
  },
  {
    code: "IE",
    name: "Irlanda",
    flag: "🇮🇪",
    region: "Europa",
    description: "Cursos de inglés Stamp 2 con permiso de trabajo de 20h/semana (40h en verano/navidad) y hub tecnológico de Europa.",
    languages: ["Inglés"],
    postStudyWork: "Hasta 2 años (Third Level Graduate Scheme 1G)",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  {
    code: "FR",
    name: "Francia",
    flag: "🇫🇷",
    region: "Europa",
    description: "Subsidios públicos de vivienda CAF para todos los estudiantes, becas Eiffel y permiso APS para graduados.",
    languages: ["Francés", "Inglés"],
    postStudyWork: "12 meses (Autorisation Provisoire de Séjour / RECE)",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  {
    code: "IT",
    name: "Italia",
    flag: "🇮🇹",
    region: "Europa",
    description: "Becas regionales DSU por nivel de ingresos familiares (cubren matrícula, comida y dinero de bolsillo) y trámite de ciudadanía iure sanguinis.",
    languages: ["Italiano", "Inglés"],
    postStudyWork: "12 meses (Permesso di soggiorno per ricerca lavoro)",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  {
    code: "US",
    name: "Estados Unidos",
    flag: "🇺🇸",
    region: "Norteamérica",
    description: "Visa F-1 con OPT (Optional Practical Training) de 12 a 36 meses para STEM y programas de becas Fulbright.",
    languages: ["Inglés"],
    postStudyWork: "12 meses (estándar) o 36 meses (carreras STEM)",
    currencyCode: "USD",
    currencySymbol: "$",
  },
];
