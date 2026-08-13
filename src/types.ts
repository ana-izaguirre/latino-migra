export type NavigationTab = "home" | "becas" | "guia" | "comunidad" | "chat" | "mapa";

export type ThemeMode = "light" | "dark";

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  countryOfOrigin?: string;
  signedInAt: string;
}

export interface LocationMarker {
  id: string;
  name: string;
  type: "consulado" | "embajada" | "universidad";
  country: string; // Target country (España, Alemania, EE.UU., Canadá)
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
  area: string; // e.g. "STEM", "Artes y Humanidades", "Salud", "Negocios"
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
}

export interface VisaType {
  id: string;
  name: string;
  tag?: string;
  description: string;
  duration: string;
  keyRequirements: string[];
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
  range: string;
  percentage: number; // for progress bar
  color: string;
}

export interface CountryGuide {
  id: string;
  country: string;
  flag: string;
  heroImage: string;
  estimatedTime: string;
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
