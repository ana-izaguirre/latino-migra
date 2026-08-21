export type NavigationTab =
  | "home"
  | "planificador"
  | "calculadora"
  | "becas"
  | "voluntariados"
  | "guia"
  | "comunidad"
  | "chat"
  | "mapa"
  | "feedback"
  | "admin";

export type ThemeMode = "light" | "dark";

export type EducationLevel =
  | "todos"
  | "pregrado"
  | "postgrado"
  | "doctorado"
  | "postdoctorado"
  | "intercambio_voluntariado"
  | "Pregrado"
  | "Postgrado"
  | "Doctorado"
  | "Postdoctorado"
  | "Intercambio / Voluntariado"
  | "Todos los niveles"
  | string;

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  countryOfOrigin?: string;
  signedInAt: string;
  /**
   * Derived from the `admins/{uid}` document at sign-in. Never read from the
   * user's own profile: `users/{uid}` is client-writable, so a role stored
   * there is a role the user can grant themselves.
   */
  isAdmin?: boolean;
}

export interface MigrationPlan {
  id?: string;
  userName?: string;
  originCountry: string;
  destinationCountry: string;
  migrationPathway: "estudios" | "trabajo" | "nomada" | "busqueda" | "ahorros" | "idiomas";
  familyStatus: "solo" | "pareja" | "familia_ninos";
  numberOfChildren?: number;
  climatePreference: "calido_mediterraneo" | "templado" | "frio";
  lifestylePreference: "gran_metropolis" | "universitaria_tranquila" | "costera";
  estimatedMonthlyBudgetEur: number;
  initialSavingsBudgetEur: number;
  hasTraveledBefore: boolean;
  completedSteps?: string[];
  notes?: string;
  createdAt?: string;
}

export interface FeedbackSuggestion {
  id: string;
  title: string;
  description: string;
  category: "feature" | "scholarship" | "visa_update" | "bug" | "testimonial";
  authorName: string;
  authorCountry: string;
  upvotes: number;
  hasUpvoted?: boolean;
  status: "revisando" | "en_desarrollo" | "implementado";
  officialResponse?: string;
  createdAt: string;
}

export interface LocationMarker {
  id: string;
  name: string;
  type: "consulado" | "embajada" | "universidad";
  country: string; // Target country (España, Alemania, EE.UU., Canadá, Irlanda)
  city: string;
  hostCountry: string; // Country where located (e.g. Colombia, México, Argentina, etc.)
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  hours?: string;
  description: string;
  tips?: string;
}

export interface Scholarship {
  id: string;
  title: string;
  institution: string;
  country: string;
  countryCode: string;
  area: string; // e.g. "STEM", "Artes y Humanidades", "Salud", "Negocios", "Todas las áreas"
  educationLevel?: EducationLevel;
  supportType: "Beca Completa" | "Beca Parcial" | "Manutención";
  deadline: string;
  deadlineDate: string; // YYYY-MM-DD for sorting
  daysLeft?: number;
  isUrgent?: boolean;
  description: string;
  requirements: string[];
  benefits: string[];
  link: string;
  imageUrl: string;
  institutionType?:
    "Universidad Directa" | "Gubernamental" | "Organismo Internacional" | "Fundación";
  officialPortalName?: string;
}

/** What kind of study route an entry describes. */
export type StudyProgrammeKind = "curso" | "certificado" | "fp";

/**
 * A study route that is not a scholarship: a course, a certificate or a
 * vocational qualification.
 *
 * `country` and `countryCode` carry the same strings as `Scholarship`, so the
 * two halves of the Becas & Estudios screen name a country identically and
 * `relatedScholarshipIds` can be resolved against the catalogue.
 */
export interface StudyProgramme {
  id: string;
  /** The programme's own name, as its institution writes it. */
  title: string;
  kind: StudyProgrammeKind;
  /** Who runs it. */
  institution: string;
  /** What the reader will see when the official link opens. */
  officialPortalName: string;
  /** https, on the institution's own domain. See OFFICIAL_STUDY_DOMAINS. */
  officialUrl: string;
  country: string;
  countryCode: string;
  /** "Presencial", "En línea" or "Mixta". */
  modality: string;
  duration: string;
  /** Including "Gratuito". Never blank: silence about cost reads as free. */
  cost: string;
  description: string;
  /** What the reader holds at the end — a title, a certificate, credits. */
  outcome: string;
  requirements: string[];
  /** Ids in the scholarship catalogue that fund this route. */
  relatedScholarshipIds?: string[];
}

export interface VisaType {
  id: string;
  name: string;
  category?:
    | "Estudios"
    | "Trabajo / Express"
    | "Idiomas"
    | "Nómada Digital"
    | "Búsqueda Empleo / Oportunidad"
    | "Residencia";
  tag?: string;
  description: string;
  duration: string;
  workPermitHours?: string;
  officialSourceUrl?: string;
  officialSourceLabel?: string;
  keyRequirements: string[];
  estimatedCostOfVisa?: string;
  proofOfFundsRequired?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
  notes?: string;
}

export interface CostItem {
  category: string;
  /**
   * The range as the destination itself quotes it, in `currency`.
   *
   * These were single strings — "€400 - €750" — which is why the guide showed
   * euros to a reader who had chosen lempiras (#75). A number can be converted;
   * a string can only be printed.
   */
  min: number;
  max: number;
  /** What the destination actually charges in. Rent in Berlin is in euros. */
  currency: string;
  /** Australia quotes rent by the week; everywhere else quotes by the month. */
  period: "mes" | "semana";
  percentage: number; // for progress bar
  color: string;
}

export interface CountryGuide {
  id: string;
  country: string;
  flag: string;
  heroImage: string;
  estimatedTime: string;
  officialImmigrationPortal?: string;
  officialPortalName?: string;
  visas: VisaType[];
  costs: CostItem[];
  documents: DocumentItem[];
  communityTip: {
    title: string;
    text: string;
    author: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: { title: string; url: string }[];
}

export interface ChatConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  country: string;
  city: string;
  date: string;
  likes: number;
  replies: number;
  category: string;
  content: string;
}

export interface UserAlertPreferences {
  email: string;
  notifyScholarshipDeadlines: boolean;
  notifyVisaPolicyChanges: boolean;
  notifyForumReplies: boolean;
  notifyWeeklyDigest: boolean;
  destinationCountry: string;
  preferredArea: string;
  pushEnabled: boolean;
}
