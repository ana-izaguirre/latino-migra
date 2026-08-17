import React, { useState, useMemo } from "react";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Globe,
  Users,
  Home,
  Utensils,
  Train,
  HeartPulse,
  Smartphone,
  Coffee,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Download,
  Bot,
} from "lucide-react";
import { NavigationTab, GoogleUser } from "../types";
import { Breadcrumbs } from "./Breadcrumbs";
import { CalendarAgendaButton } from "./CalendarAgendaButton";

interface CalculadoraCostoVidaProps {
  setActiveTab: (tab: NavigationTab) => void;
  currentUser?: GoogleUser | null;
  onAskAIAboutBudget?: (prompt: string) => void;
}

interface CityData {
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  currencySymbol: string;
  currencyCode: "EUR" | "USD" | "CAD" | "AUD";
  eurRate: number; // 1 unit in EUR
  roomShared: number;
  roomPrivate: number;
  apartmentStudio: number;
  groceries: number;
  transitPass: number;
  healthInsurance: number;
  phoneInternet: number;
  entertainment: number;
  childcarePerKid?: number;
  officialVisaRequirementMonthly: number;
  officialRequirementNote: string;
}

const CITIES_DATA: Record<string, CityData> = {
  "madrid-es": {
    city: "Madrid",
    country: "España",
    countryCode: "ES",
    flag: "🇪🇸",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 380,
    roomPrivate: 520,
    apartmentStudio: 890,
    groceries: 240,
    transitPass: 20, // Abono Joven
    healthInsurance: 55,
    phoneInternet: 35,
    entertainment: 140,
    childcarePerKid: 350,
    officialVisaRequirementMonthly: 600,
    officialRequirementNote:
      "100% IPREM mensual (aprox. 600€/mes exigidos para visado de estudiante)",
  },
  "barcelona-es": {
    city: "Barcelona",
    country: "España",
    countryCode: "ES",
    flag: "🇪🇸",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 420,
    roomPrivate: 580,
    apartmentStudio: 980,
    groceries: 260,
    transitPass: 25,
    healthInsurance: 55,
    phoneInternet: 35,
    entertainment: 160,
    childcarePerKid: 400,
    officialVisaRequirementMonthly: 600,
    officialRequirementNote: "100% IPREM mensual (aprox. 600€/mes para Extranjería)",
  },
  "valencia-es": {
    city: "Valencia / Salamanca",
    country: "España",
    countryCode: "ES",
    flag: "🇪🇸",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 290,
    roomPrivate: 390,
    apartmentStudio: 680,
    groceries: 210,
    transitPass: 18,
    healthInsurance: 50,
    phoneInternet: 30,
    entertainment: 110,
    childcarePerKid: 280,
    officialVisaRequirementMonthly: 600,
    officialRequirementNote: "100% IPREM mensual (ciudades universitarias muy accesibles)",
  },
  "lisbon-pt": {
    city: "Lisboa",
    country: "Portugal",
    countryCode: "PT",
    flag: "🇵🇹",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 320,
    roomPrivate: 480,
    apartmentStudio: 820,
    groceries: 210,
    transitPass: 30, // Passe Navegante Metropolitano
    healthInsurance: 45,
    phoneInternet: 30,
    entertainment: 120,
    childcarePerKid: 300,
    officialVisaRequirementMonthly: 820,
    officialRequirementNote: "100% Salario Mínimo Nacional (820€/mes para visado de estudiante D4)",
  },
  "porto-pt": {
    city: "Oporto / Coímbra",
    country: "Portugal",
    countryCode: "PT",
    flag: "🇵🇹",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 260,
    roomPrivate: 390,
    apartmentStudio: 650,
    groceries: 190,
    transitPass: 30,
    healthInsurance: 40,
    phoneInternet: 28,
    entertainment: 100,
    childcarePerKid: 250,
    officialVisaRequirementMonthly: 820,
    officialRequirementNote: "Exigencia legal AIMA de medios de subsistencia del salario mínimo",
  },
  "sydney-au": {
    city: "Sídney",
    country: "Australia",
    countryCode: "AU",
    flag: "🇦🇺",
    currencySymbol: "$ AUD",
    currencyCode: "AUD",
    eurRate: 0.61,
    roomShared: 950,
    roomPrivate: 1450,
    apartmentStudio: 2400,
    groceries: 480,
    transitPass: 180, // Opal Card
    healthInsurance: 65, // OSHC mensual
    phoneInternet: 55,
    entertainment: 260,
    childcarePerKid: 1600,
    officialVisaRequirementMonthly: 2475,
    officialRequirementNote:
      "$29,710 AUD/año fijado por el Department of Home Affairs (Subclass 500)",
  },
  "melbourne-au": {
    city: "Melbourne / Brisbane",
    country: "Australia",
    countryCode: "AU",
    flag: "🇦🇺",
    currencySymbol: "$ AUD",
    currencyCode: "AUD",
    eurRate: 0.61,
    roomShared: 820,
    roomPrivate: 1250,
    apartmentStudio: 2050,
    groceries: 440,
    transitPass: 160,
    healthInsurance: 65,
    phoneInternet: 50,
    entertainment: 220,
    childcarePerKid: 1400,
    officialVisaRequirementMonthly: 2475,
    officialRequirementNote:
      "Requisito financiero unificado Home Affairs para solvencia de estudiante",
  },
  "toronto-ca": {
    city: "Toronto",
    country: "Canadá",
    countryCode: "CA",
    flag: "🇨🇦",
    currencySymbol: "$ CAD",
    currencyCode: "CAD",
    eurRate: 0.68,
    roomShared: 750,
    roomPrivate: 1150,
    apartmentStudio: 1850,
    groceries: 420,
    transitPass: 128,
    healthInsurance: 75,
    phoneInternet: 70,
    entertainment: 220,
    childcarePerKid: 1100,
    officialVisaRequirementMonthly: 1720,
    officialRequirementNote:
      "$20,635 CAD/año exigido por IRCC (aprox. $1,720 CAD/mes sin incluir matrícula)",
  },
  "montreal-ca": {
    city: "Montreal",
    country: "Canadá",
    countryCode: "CA",
    flag: "🇨🇦",
    currencySymbol: "$ CAD",
    currencyCode: "CAD",
    eurRate: 0.68,
    roomShared: 550,
    roomPrivate: 850,
    apartmentStudio: 1350,
    groceries: 360,
    transitPass: 97,
    healthInsurance: 70,
    phoneInternet: 65,
    entertainment: 170,
    childcarePerKid: 650,
    officialVisaRequirementMonthly: 1600,
    officialRequirementNote: "Fondos de manutención de Quebec CAQ / IRCC",
  },
  "dublin-ie": {
    city: "Dublín",
    country: "Irlanda",
    countryCode: "IE",
    flag: "🇮🇪",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 520,
    roomPrivate: 820,
    apartmentStudio: 1550,
    groceries: 280,
    transitPass: 65, // Student Leap Card cap
    healthInsurance: 45,
    phoneInternet: 40,
    entertainment: 180,
    childcarePerKid: 850,
    officialVisaRequirementMonthly: 560,
    officialRequirementNote:
      "Stamp 2 requiere demostrar €4,500 (o €10,000 según país) al registrarse en el IRP",
  },
  "cork-ie": {
    city: "Cork / Galway",
    country: "Irlanda",
    countryCode: "IE",
    flag: "🇮🇪",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 420,
    roomPrivate: 640,
    apartmentStudio: 1200,
    groceries: 250,
    transitPass: 50,
    healthInsurance: 45,
    phoneInternet: 35,
    entertainment: 140,
    childcarePerKid: 680,
    officialVisaRequirementMonthly: 560,
    officialRequirementNote:
      "Mismo estándar ILEP / IRP de Irlanda pero con alquiler 25% más bajo que Dublín",
  },
  "berlin-de": {
    city: "Berlín",
    country: "Alemania",
    countryCode: "DE",
    flag: "🇩🇪",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 400,
    roomPrivate: 590,
    apartmentStudio: 980,
    groceries: 270,
    transitPass: 49, // Deutschlandticket
    healthInsurance: 125, // GKV Student
    phoneInternet: 35,
    entertainment: 150,
    childcarePerKid: 150, // Subvencionado Kita
    officialVisaRequirementMonthly: 992,
    officialRequirementNote:
      "Sperrkonto obligatorio de 11,904€/año (992€/mes) o Chancenkarte 1,027€/mes",
  },
  "munich-de": {
    city: "Múnich / Frankfurt",
    country: "Alemania",
    countryCode: "DE",
    flag: "🇩🇪",
    currencySymbol: "€",
    currencyCode: "EUR",
    eurRate: 1,
    roomShared: 480,
    roomPrivate: 720,
    apartmentStudio: 1250,
    groceries: 290,
    transitPass: 49,
    healthInsurance: 125,
    phoneInternet: 40,
    entertainment: 180,
    childcarePerKid: 250,
    officialVisaRequirementMonthly: 992,
    officialRequirementNote: "Sperrkonto fijado a nivel federal en 992€/mes",
  },
  "boston-us": {
    city: "Boston / New York",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    currencySymbol: "$ USD",
    currencyCode: "USD",
    eurRate: 0.92,
    roomShared: 780,
    roomPrivate: 1250,
    apartmentStudio: 2100,
    groceries: 450,
    transitPass: 90,
    healthInsurance: 180,
    phoneInternet: 75,
    entertainment: 240,
    childcarePerKid: 1400,
    officialVisaRequirementMonthly: 1800,
    officialRequirementNote: "Estipulado en el Formulario I-20 de la universidad para la visa F-1",
  },
};

// Exchange rates relative to 1 USD
const FX_RATES_FROM_USD: Record<string, { rate: number; name: string; symbol: string }> = {
  COP: { rate: 4150, name: "Peso Colombiano (COP)", symbol: "COP $" },
  MXN: { rate: 18.8, name: "Peso Mexicano (MXN)", symbol: "MXN $" },
  PEN: { rate: 3.75, name: "Sol Peruano (PEN)", symbol: "S/" },
  ARS: { rate: 1180, name: "Peso Argentino (ARS)", symbol: "ARS $" },
  CLP: { rate: 940, name: "Peso Chileno (CLP)", symbol: "CLP $" },
  BRL: { rate: 5.4, name: "Real Brasileño (BRL)", symbol: "R$" },
  USD: { rate: 1.0, name: "Dólar Estadounidense (USD)", symbol: "$ USD" },
  EUR: { rate: 0.92, name: "Euro (EUR)", symbol: "€" },
  CAD: { rate: 1.36, name: "Dólar Canadiense (CAD)", symbol: "$ CAD" },
  AUD: { rate: 1.52, name: "Dólar Australiano (AUD)", symbol: "$ AUD" },
};

export const CalculadoraCostoVida: React.FC<CalculadoraCostoVidaProps> = ({
  setActiveTab,
  currentUser,
  onAskAIAboutBudget,
}) => {
  const [selectedCityKey, setSelectedCityKey] = useState<string>("madrid-es");
  const [targetCurrency, setTargetCurrency] = useState<string>("COP");
  const [lifestyle, setLifestyle] = useState<"estudiante" | "profesional" | "familia">(
    "estudiante"
  );
  const [housingType, setHousingType] = useState<"shared" | "private" | "studio">("private");
  const [numberOfKids, setNumberOfKids] = useState<number>(1);
  const [includeEntertainment, setIncludeEntertainment] = useState<boolean>(true);
  const [monthsToPlan, setMonthsToPlan] = useState<number>(6);

  const city = CITIES_DATA[selectedCityKey] || CITIES_DATA["madrid-es"];

  // Calculate monthly costs in local currency
  const monthlyCostBreakdown = useMemo(() => {
    let rent = city.roomPrivate;
    if (housingType === "shared") rent = city.roomShared;
    if (housingType === "studio") rent = city.apartmentStudio;

    let groceries = city.groceries;
    let transit = city.transitPass;
    let health = city.healthInsurance;
    let phone = city.phoneInternet;
    let entertainment = includeEntertainment ? city.entertainment : 0;
    let childcare = 0;

    if (lifestyle === "profesional") {
      groceries = Math.round(groceries * 1.25);
      entertainment = includeEntertainment ? Math.round(city.entertainment * 1.4) : 0;
    } else if (lifestyle === "familia") {
      rent = Math.round(city.apartmentStudio * 1.3); // 2 bedroom / family flat
      groceries = Math.round(groceries * 2.2);
      transit = transit * 2;
      health = health * (2 + numberOfKids);
      phone = Math.round(phone * 1.5);
      childcare = (city.childcarePerKid || 400) * numberOfKids;
      entertainment = includeEntertainment ? Math.round(city.entertainment * 1.6) : 0;
    }

    const totalLocal = rent + groceries + transit + health + phone + entertainment + childcare;

    return {
      rent,
      groceries,
      transit,
      health,
      phone,
      entertainment,
      childcare,
      totalLocal,
    };
  }, [city, lifestyle, housingType, numberOfKids, includeEntertainment]);

  // Convert to user's selected Latin American currency
  const conversionMultiplier = useMemo(() => {
    // 1 USD = fxRates[curr].rate
    // City has currencyCode (EUR, CAD, USD)
    let amountInUsd = 1;
    if (city.currencyCode === "EUR") amountInUsd = 1 / 0.92;
    else if (city.currencyCode === "CAD") amountInUsd = 1 / 1.36;
    else amountInUsd = 1;

    const rateToTarget = FX_RATES_FROM_USD[targetCurrency]?.rate || 1;
    return amountInUsd * rateToTarget;
  }, [city.currencyCode, targetCurrency]);

  const targetFx = FX_RATES_FROM_USD[targetCurrency] || FX_RATES_FROM_USD["COP"];

  const formatLocal = (val: number) => {
    return `${city.currencySymbol} ${val.toLocaleString()}`;
  };

  const formatConverted = (val: number) => {
    const converted = Math.round(val * conversionMultiplier);
    return `${targetFx.symbol} ${converted.toLocaleString()}`;
  };

  const handleExportPlan = () => {
    const textLines = [
      `================================================`,
      `PRESUPUESTO ESTIMADO DE VIDA - ${city.city.toUpperCase()} (${city.country.toUpperCase()})`,
      `Generado en LatinoMigra: ${new Date().toLocaleDateString()}`,
      `Perfil: ${lifestyle.toUpperCase()} • Alojamiento: ${housingType.toUpperCase()}`,
      `================================================`,
      ``,
      `[ DESGLOSE MENSUAL EN MONEDA LOCAL (${city.currencyCode}) ]`,
      `- Alquiler estimado: ${formatLocal(monthlyCostBreakdown.rent)} (${formatConverted(monthlyCostBreakdown.rent)})`,
      `- Alimentación y supermercado: ${formatLocal(monthlyCostBreakdown.groceries)} (${formatConverted(monthlyCostBreakdown.groceries)})`,
      `- Transporte público: ${formatLocal(monthlyCostBreakdown.transit)} (${formatConverted(monthlyCostBreakdown.transit)})`,
      `- Seguro médico obligatorio: ${formatLocal(monthlyCostBreakdown.health)} (${formatConverted(monthlyCostBreakdown.health)})`,
      `- Telefonía e Internet: ${formatLocal(monthlyCostBreakdown.phone)} (${formatConverted(monthlyCostBreakdown.phone)})`,
      `- Ocio y gastos personales: ${formatLocal(monthlyCostBreakdown.entertainment)} (${formatConverted(monthlyCostBreakdown.entertainment)})`,
      lifestyle === "familia"
        ? `- Cuidado infantil/Escuela (${numberOfKids} hijos): ${formatLocal(monthlyCostBreakdown.childcare)}`
        : "",
      `------------------------------------------------`,
      `TOTAL MENSUAL ESTIMADO: ${formatLocal(monthlyCostBreakdown.totalLocal)} (${formatConverted(monthlyCostBreakdown.totalLocal)})`,
      ``,
      `[ FONDO PARA ${monthsToPlan} MESES DE ESTANCIA ]`,
      `Total ${monthsToPlan} meses: ${formatLocal(monthlyCostBreakdown.totalLocal * monthsToPlan)} (${formatConverted(monthlyCostBreakdown.totalLocal * monthsToPlan)})`,
      `Fianza inicial y primer mes: ${formatLocal(monthlyCostBreakdown.rent * 2)}`,
      ``,
      `[ REQUISITO OFICIAL DE VISADO ]`,
      `Exigencia consular mensual: ${formatLocal(city.officialVisaRequirementMonthly)}`,
      `Nota oficial: ${city.officialRequirementNote}`,
      `================================================`,
      `Visita LatinoMigra (https://latinomigra.org) para más simulaciones y guías.`,
    ].filter(Boolean);

    const blob = new Blob([textLines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Presupuesto-${city.city}-${targetCurrency}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs activeTab="calculadora" setActiveTab={setActiveTab} />

      {/* Header Banner */}
      <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-outline-variant/40 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4" />
              <span>Simulador Financiero & Conversor de Divisas</span>
            </div>
            <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
              Calculadora de Costo de Vida Realista
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-300 max-w-2xl">
              Calcula con precisión tus gastos mensuales en España, Canadá, Irlanda, Alemania o
              EE.UU. y conviértelos al instante a tu moneda local latinoamericana (COP, MXN, PEN,
              ARS, CLP, etc.).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportPlan}
              className="inline-flex items-center gap-2 bg-secondary dark:bg-teal-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold hover:bg-secondary/90 transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Presupuesto (.txt)</span>
            </button>
            <button
              onClick={() => setActiveTab("planificador")}
              className="inline-flex items-center gap-2 bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 px-4 py-2.5 rounded-2xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
            >
              <span>Ver Planificador 360°</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls & Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Selectors & Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-3xl border border-outline-variant/40 dark:border-slate-700 space-y-5">
            <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-secondary dark:text-teal-400" />
              <span>1. Destino y Moneda de Comparación</span>
            </h3>

            {/* City Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block">
                Ciudad y País de Destino:
              </label>
              <select
                value={selectedCityKey}
                onChange={(e) => setSelectedCityKey(e.target.value)}
                className="w-full bg-surface dark:bg-slate-900 border border-outline-variant/60 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-on-surface dark:text-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <optgroup label="🇪🇸 España">
                  <option value="madrid-es">🇪🇸 Madrid (España)</option>
                  <option value="barcelona-es">🇪🇸 Barcelona (España)</option>
                  <option value="valencia-es">🇪🇸 Valencia / Salamanca (España)</option>
                </optgroup>
                <optgroup label="🇨🇦 Canadá">
                  <option value="toronto-ca">🇨🇦 Toronto, Ontario (Canadá)</option>
                  <option value="montreal-ca">🇨🇦 Montreal, Quebec (Canadá)</option>
                </optgroup>
                <optgroup label="🇮🇪 Irlanda">
                  <option value="dublin-ie">🇮🇪 Dublín (Irlanda - Stamp 2 / Work)</option>
                  <option value="cork-ie">🇮🇪 Cork / Galway (Irlanda)</option>
                </optgroup>
                <optgroup label="🇩🇪 Alemania">
                  <option value="berlin-de">🇩🇪 Berlín (Alemania - Chancenkarte / Uni)</option>
                  <option value="munich-de">🇩🇪 Múnich / Frankfurt (Alemania)</option>
                </optgroup>
                <optgroup label="🇺🇸 Estados Unidos">
                  <option value="boston-us">🇺🇸 Boston / New York (EE.UU. - F-1 / J-1)</option>
                </optgroup>
              </select>
            </div>

            {/* Currency Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block">
                Convertir y ver totales en mi moneda local:
              </label>
              <select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                className="w-full bg-surface dark:bg-slate-900 border border-outline-variant/60 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-on-surface dark:text-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {Object.entries(FX_RATES_FROM_USD).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-outline-variant/30 dark:border-slate-700 pt-4 space-y-4">
              <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary dark:text-teal-400" />
                <span>2. Modalidad y Tipo de Vivienda</span>
              </h3>

              {/* Lifestyle toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block">
                  Situación de viaje:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLifestyle("estudiante")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      lifestyle === "estudiante"
                        ? "bg-primary dark:bg-sky-600 text-white shadow-sm"
                        : "bg-surface dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
                    }`}
                  >
                    🎒 Estudiante
                  </button>
                  <button
                    type="button"
                    onClick={() => setLifestyle("profesional")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      lifestyle === "profesional"
                        ? "bg-primary dark:bg-sky-600 text-white shadow-sm"
                        : "bg-surface dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
                    }`}
                  >
                    💼 Profesional
                  </button>
                  <button
                    type="button"
                    onClick={() => setLifestyle("familia")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      lifestyle === "familia"
                        ? "bg-primary dark:bg-sky-600 text-white shadow-sm"
                        : "bg-surface dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
                    }`}
                  >
                    👨‍👩‍👧 Familia
                  </button>
                </div>
              </div>

              {/* Housing Type */}
              {lifestyle !== "familia" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block">
                    Tipo de alojamiento:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setHousingType("shared")}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        housingType === "shared"
                          ? "bg-secondary dark:bg-teal-600 text-white shadow-sm"
                          : "bg-surface dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
                      }`}
                    >
                      Compartida
                    </button>
                    <button
                      type="button"
                      onClick={() => setHousingType("private")}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        housingType === "private"
                          ? "bg-secondary dark:bg-teal-600 text-white shadow-sm"
                          : "bg-surface dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
                      }`}
                    >
                      Hab. Privada
                    </button>
                    <button
                      type="button"
                      onClick={() => setHousingType("studio")}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        housingType === "studio"
                          ? "bg-secondary dark:bg-teal-600 text-white shadow-sm"
                          : "bg-surface dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
                      }`}
                    >
                      Estudio/Apto
                    </button>
                  </div>
                </div>
              )}

              {lifestyle === "familia" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block">
                    Número de hijos menores:
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNumberOfKids(num)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          numberOfKids === num
                            ? "bg-secondary dark:bg-teal-600 text-white shadow-sm"
                            : "bg-surface dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 border border-outline-variant/40 dark:border-slate-700"
                        }`}
                      >
                        {num} {num === 1 ? "Hijo" : "Hijos"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra toggles */}
              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeEntertainment}
                    onChange={(e) => setIncludeEntertainment(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>Incluir presupuesto para ocio, café y salidas sociales</span>
                </label>
              </div>

              {/* Months Slider */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold text-on-surface dark:text-slate-300">
                  <span>Fondo total a planificar:</span>
                  <span className="text-primary dark:text-sky-300">{monthsToPlan} meses</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={monthsToPlan}
                  onChange={(e) => setMonthsToPlan(Number(e.target.value))}
                  className="w-full h-2 bg-surface-container dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cost Breakdown & Highlights */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Total Display Card */}
          <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 dark:from-sky-950/60 dark:via-teal-950/40 dark:to-slate-900 p-6 md:p-8 rounded-3xl border border-primary/20 dark:border-sky-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary dark:text-teal-300">
                  Estimación Mensual en {city.city} ({city.flag})
                </span>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
                    {formatLocal(monthlyCostBreakdown.totalLocal)}
                    <span className="text-sm font-normal text-on-surface-variant dark:text-slate-400">
                      {" "}
                      /mes
                    </span>
                  </h2>
                </div>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  ≈ {formatConverted(monthlyCostBreakdown.totalLocal)} /mes en {targetFx.name}
                </p>
              </div>

              {/* Calendar button for monthly budget review */}
              <CalendarAgendaButton
                label="Agendar Recordatorio"
                event={{
                  title: `Revisión Presupuesto Mensual: ${city.city}`,
                  details: `Plan de gastos mensual en ${city.city} (${city.country}):\n- Total: ${formatLocal(monthlyCostBreakdown.totalLocal)} (~${formatConverted(monthlyCostBreakdown.totalLocal)})\n- Alquiler: ${formatLocal(monthlyCostBreakdown.rent)}\n- Comida: ${formatLocal(monthlyCostBreakdown.groceries)}\n- Transporte y Seguro: ${formatLocal(monthlyCostBreakdown.transit + monthlyCostBreakdown.health)}`,
                }}
              />
            </div>

            {/* Months Total Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-primary/15 dark:border-slate-700 text-xs">
              <div className="bg-surface/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-outline-variant/30 dark:border-slate-700">
                <span className="text-on-surface-variant dark:text-slate-400 font-medium block">
                  💰 Ahorro Total para {monthsToPlan} meses:
                </span>
                <p className="text-lg font-extrabold text-primary dark:text-sky-300 mt-1">
                  {formatLocal(monthlyCostBreakdown.totalLocal * monthsToPlan)}
                </p>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  ≈ {formatConverted(monthlyCostBreakdown.totalLocal * monthsToPlan)}
                </p>
              </div>

              <div className="bg-surface/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-outline-variant/30 dark:border-slate-700">
                <span className="text-on-surface-variant dark:text-slate-400 font-medium block">
                  🔑 Costo de Llegada (Fianza + 1er mes):
                </span>
                <p className="text-lg font-extrabold text-on-surface dark:text-slate-200 mt-1">
                  {formatLocal(monthlyCostBreakdown.rent * 2 + monthlyCostBreakdown.health)}
                </p>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
                  Depósito de fianza + primer mes de alquiler
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Categories List */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-outline-variant/40 dark:border-slate-700 space-y-4">
            <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
              Desglose Detallado por Rubro
            </h3>

            <div className="space-y-3">
              {/* Rent */}
              <div className="flex items-center justify-between p-3.5 bg-surface dark:bg-slate-900 rounded-2xl border border-outline-variant/20 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary dark:text-sky-300">
                      Alojamiento & Alquiler
                    </h4>
                    <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      {housingType === "shared"
                        ? "Habitación compartida"
                        : housingType === "private"
                          ? "Habitación privada en piso compartido"
                          : "Estudio individual / Piso familiar"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-primary dark:text-sky-300">
                    {formatLocal(monthlyCostBreakdown.rent)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                    {formatConverted(monthlyCostBreakdown.rent)}
                  </p>
                </div>
              </div>

              {/* Food */}
              <div className="flex items-center justify-between p-3.5 bg-surface dark:bg-slate-900 rounded-2xl border border-outline-variant/20 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary dark:text-sky-300">
                      Supermercado y Alimentación
                    </h4>
                    <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      Cocinar en casa (Lidl, Aldi, Mercadona, No Frills, Tesco)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-primary dark:text-sky-300">
                    {formatLocal(monthlyCostBreakdown.groceries)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                    {formatConverted(monthlyCostBreakdown.groceries)}
                  </p>
                </div>
              </div>

              {/* Transit */}
              <div className="flex items-center justify-between p-3.5 bg-surface dark:bg-slate-900 rounded-2xl border border-outline-variant/20 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Train className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary dark:text-sky-300">
                      Transporte Público
                    </h4>
                    <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      Pase mensual (Abono Joven / Leap Card / Deutschlandticket / TTC)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-primary dark:text-sky-300">
                    {formatLocal(monthlyCostBreakdown.transit)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                    {formatConverted(monthlyCostBreakdown.transit)}
                  </p>
                </div>
              </div>

              {/* Health Insurance */}
              <div className="flex items-center justify-between p-3.5 bg-surface dark:bg-slate-900 rounded-2xl border border-outline-variant/20 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary dark:text-sky-300">
                      Seguro Médico Obligatorio
                    </h4>
                    <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      Requisito consular indispensable sin copagos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-primary dark:text-sky-300">
                    {formatLocal(monthlyCostBreakdown.health)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                    {formatConverted(monthlyCostBreakdown.health)}
                  </p>
                </div>
              </div>

              {/* Phone and Internet */}
              <div className="flex items-center justify-between p-3.5 bg-surface dark:bg-slate-900 rounded-2xl border border-outline-variant/20 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary dark:text-sky-300">
                      Telefonía Móvil & Datos
                    </h4>
                    <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      SIM local con 50-100GB y llamadas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-primary dark:text-sky-300">
                    {formatLocal(monthlyCostBreakdown.phone)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                    {formatConverted(monthlyCostBreakdown.phone)}
                  </p>
                </div>
              </div>

              {/* Entertainment */}
              {includeEntertainment && (
                <div className="flex items-center justify-between p-3.5 bg-surface dark:bg-slate-900 rounded-2xl border border-outline-variant/20 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary dark:text-sky-300">
                        Ocio, Café y Salidas
                      </h4>
                      <p className="text-[11px] text-on-surface-variant dark:text-slate-400">
                        Cine, restaurantes, vida social y viajes cortos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-primary dark:text-sky-300">
                      {formatLocal(monthlyCostBreakdown.entertainment)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant dark:text-slate-400">
                      {formatConverted(monthlyCostBreakdown.entertainment)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Official Visa Proof of Funds Warning Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/30 dark:border-amber-700/50 p-6 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Requisito Oficial de Fondos para el Visado ({city.country})</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>{city.officialRequirementNote}</strong>. Ten en cuenta que el consulado exige
              extractos bancarios demostrables a tu nombre o carta de beca que cubra este monto
              antes de concederte el visado.
            </p>
          </div>

          {/* Sources & Methodology Citation Box */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/40 dark:border-slate-800 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Transparencia: ¿De Dónde Salen Estos Valores de Presupuesto?</span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
              Los costos reflejados en LatinoMigra se calculan combinando tres fuentes oficiales y
              empíricas auditadas:
            </p>
            <ul className="text-xs space-y-1.5 text-on-surface-variant dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">1.</span>
                <span>
                  <strong>Leyes e Índices Oficiales de Migración:</strong> Tabulador IPREM (España),
                  Sperrkonto federal reglamentado por el DAAD/Auswärtiges Amt (Alemania), baremo de
                  fondos IRCC (Canadá), Department of Home Affairs (Australia) y Formulario
                  I-20/SEVIS (EE.UU.).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">2.</span>
                <span>
                  <strong>Benchmarks Numbeo & Portales Oficiales de Transporte:</strong> Precios de
                  abonos de transporte mensual regulados (Abono Joven Madrid, Deutschlandticket
                  Alemania, Passe Navegante Lisboa, TTC Toronto, Opal NSW).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">3.</span>
                <span>
                  <strong>Reportes Verificados de Estudiantes:</strong> Datos reales actualizados
                  por los miembros de la Comunidad LatinoMigra residentes en cada ciudad.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
