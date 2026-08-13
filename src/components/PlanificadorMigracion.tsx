import React, { useState } from "react";
import {
  Compass,
  MapPin,
  GraduationCap,
  Briefcase,
  Laptop,
  Users,
  Sun,
  CloudSnow,
  Trees,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Building,
  ShieldCheck,
  Plane,
  HeartHandshake,
  Baby,
  Hotel,
  Train,
  CreditCard,
  PhoneCall,
  Sparkles,
  ArrowRight,
  Printer,
  Download,
  Info,
  Calculator
} from "lucide-react";
import { GoogleUser, NavigationTab, MigrationPlan } from "../types";

interface PlanificadorMigracionProps {
  currentUser: GoogleUser | null;
  setActiveTab: (tab: NavigationTab) => void;
  onAskAIWithCustomPrompt: (prompt: string) => void;
}

export const PlanificadorMigracion: React.FC<PlanificadorMigracionProps> = ({
  currentUser,
  setActiveTab,
  onAskAIWithCustomPrompt,
}) => {
  // Wizard State
  const [originCountry, setOriginCountry] = useState<string>(currentUser?.countryOfOrigin || "Colombia");
  const [destinationCountry, setDestinationCountry] = useState<string>("España");
  const [pathway, setPathway] = useState<"estudios" | "trabajo" | "nomada" | "busqueda" | "ahorros">("estudios");
  const [familyStatus, setFamilyStatus] = useState<"solo" | "pareja" | "familia_ninos">("solo");
  const [numChildren, setNumChildren] = useState<number>(1);
  const [climate, setClimate] = useState<"calido_mediterraneo" | "templado" | "frio">("calido_mediterraneo");
  const [lifestyle, setLifestyle] = useState<"gran_metropolis" | "universitaria_tranquila" | "costera">("universitaria_tranquila");
  const [hasTraveledBefore, setHasTraveledBefore] = useState<boolean>(false);
  const [planSaved, setPlanSaved] = useState<boolean>(false);

  // Suggested Cities based on choices
  const getCityRecommendations = () => {
    if (destinationCountry === "España") {
      if (lifestyle === "gran_metropolis") {
        return [
          { name: "Madrid", desc: "Gran oferta laboral, conexiones globales, transporte de primer nivel (Metro Madrid), costo medio-alto.", cost: "1.100€ - 1.400€/mes" },
          { name: "Barcelona", desc: "Epicentro tecnológico e innovador, costa mediterránea, costo de vida alto.", cost: "1.200€ - 1.500€/mes" }
        ];
      }
      if (lifestyle === "universitaria_tranquila") {
        return [
          { name: "Salamanca", desc: "Cuna universitaria con 800 años de historia, muy segura, económica y caminable.", cost: "650€ - 850€/mes" },
          { name: "Granada", desc: "Excelente ambiente estudiantil, tapas gratuitas, clima agradable y costo muy asequible.", cost: "600€ - 800€/mes" }
        ];
      }
      return [
        { name: "Valencia", desc: "Perfecto balance entre playa, tecnología, calidad de vida y costo moderado.", cost: "850€ - 1.100€/mes" },
        { name: "Málaga", desc: "Hub tecnológico en auge, clima cálido todo el año y comunidad internacional.", cost: "850€ - 1.150€/mes" }
      ];
    }

    if (destinationCountry === "Alemania") {
      if (lifestyle === "gran_metropolis") {
        return [
          { name: "Berlín", desc: "Capital multicultural, gran escena de startups, inglés muy hablado, transporte excepcional.", cost: "1.100€ - 1.450€/mes" },
          { name: "Múnich", desc: "Potencia económica e ingeniería, salarios muy altos, costo de vida elevado.", cost: "1.400€ - 1.800€/mes" }
        ];
      }
      return [
        { name: "Heidelberg", desc: "Prestigiosa ciudad universitaria, pintoresca, segura y de gran tradición académica.", cost: "900€ - 1.200€/mes" },
        { name: "Leipzig", desc: "Joven, dinámica, accesible económicamente y con fuerte auge cultural.", cost: "750€ - 950€/mes" }
      ];
    }

    if (destinationCountry === "Canadá") {
      return [
        { name: "Montreal", desc: "Cultura bilingüe, costo de vida más accesible que Toronto/Vancouver, gran ambiente estudiantil.", cost: "1.400$ - 1.800$ CAD/mes" },
        { name: "Toronto", desc: "Capital financiera, mayor mercado laboral y multiculturalidad.", cost: "1.800$ - 2.300$ CAD/mes" },
        { name: "Calgary", desc: "Cercanía a las Rocosas, salarios competitivos e impuestos provinciales bajos.", cost: "1.500$ - 1.900$ CAD/mes" }
      ];
    }

    if (destinationCountry === "Irlanda") {
      return [
        { name: "Dublín", desc: "Hub tecnológico europeo (Google, Meta, TikTok), gran oferta laboral pero alquiler muy competitivo.", cost: "1.200€ - 1.600€/mes" },
        { name: "Cork / Galway", desc: "Ciudades universitarias costeras con alta calidad de vida y alquileres 25% más accesibles.", cost: "900€ - 1.250€/mes" }
      ];
    }

    return [
      { name: "Ciudad Principal", desc: "Centro económico y académico con servicios consulares e internacionales completos.", cost: "1.000€ - 1.300€/mes" }
    ];
  };

  // Real-time calculated budget breakdown
  const calculateBudget = () => {
    let baseMonthly = 800;
    if (destinationCountry === "Alemania") baseMonthly = 992; // Cuenta bloqueada oficial Sperrkonto
    if (destinationCountry === "Francia") baseMonthly = 850;
    if (destinationCountry === "Canadá") baseMonthly = 1200;

    let multiplier = 1;
    if (familyStatus === "pareja") multiplier = 1.6;
    if (familyStatus === "familia_ninos") multiplier = 1.6 + numChildren * 0.35;

    const monthlyTotal = Math.round(baseMonthly * multiplier);
    const rentEstimate = Math.round((monthlyTotal * 0.45));
    const foodEstimate = Math.round((monthlyTotal * 0.28));
    const transportEstimate = Math.round((monthlyTotal * 0.08));
    const utilitiesHealth = Math.round((monthlyTotal * 0.19));

    // Initial arrival savings needed (Flights + 2 months deposit/fianza + 1st month rent + emergency buffer)
    const initialSavings = Math.round(rentEstimate * 3 + monthlyTotal * 1.5 + 850 * (familyStatus === "solo" ? 1 : familyStatus === "pareja" ? 2 : 2 + numChildren));

    return {
      monthlyTotal,
      rentEstimate,
      foodEstimate,
      transportEstimate,
      utilitiesHealth,
      initialSavings
    };
  };

  const budget = calculateBudget();
  const recommendedCities = getCityRecommendations();

  const handleSavePlan = () => {
    const plan: MigrationPlan = {
      userName: currentUser?.name || "Viajero Latino",
      originCountry,
      destinationCountry,
      migrationPathway: pathway,
      familyStatus,
      numberOfChildren: familyStatus === "familia_ninos" ? numChildren : 0,
      climatePreference: climate,
      lifestylePreference: lifestyle,
      estimatedMonthlyBudgetEur: budget.monthlyTotal,
      initialSavingsBudgetEur: budget.initialSavings,
      hasTraveledBefore,
      createdAt: new Date().toLocaleDateString("es-ES")
    };

    try {
      localStorage.setItem("latinomigra_saved_plan", JSON.stringify(plan));
      setPlanSaved(true);
      setTimeout(() => setPlanSaved(false), 3000);
    } catch {}
  };

  const handleConsultAI = () => {
    const prompt = `Hola LatinoMigra IA, generé mi plan de migración con estos datos:
- País de Origen: ${originCountry}
- País de Destino: ${destinationCountry}
- Vía de Migración: ${pathway === "estudios" ? "Estudios / Beca" : pathway === "trabajo" ? "Trabajo Altamente Cualificado" : pathway === "nomada" ? "Nómada Digital" : pathway === "busqueda" ? "Búsqueda de Empleo" : "Ahorros"}
- Situación Familiar: ${familyStatus === "solo" ? "Viajo Solo/a" : familyStatus === "pareja" ? "En Pareja" : `Con Familia (${numChildren} hijos)`}
- Experiencia de Viaje Previo: ${hasTraveledBefore ? "Ya he viajado al exterior antes" : "NUNCA he viajado al extranjero, es mi primer viaje internacional"}
- Presupuesto mensual estimado: ~${budget.monthlyTotal}€/mes
- Presupuesto de ahorro inicial: ~${budget.initialSavings}€

¿Podrías darme un cronograma de 6 meses con los pasos exactos, cómo evitar estafas en el primer alquiler y qué trámites legales (como empadronamiento/visado) debo realizar al llegar?`;

    onAskAIWithCustomPrompt(prompt);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-primary to-primary-container dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-amber-300" />
            <span>Simulador & Planificador de Migración Integral 2026-2027</span>
          </div>

          <h1 className="font-headline-lg text-3xl md:text-5xl font-extrabold leading-tight">
            {currentUser ? `¡Hola, ${currentUser.name.split(' ')[0]}!` : "Diseña tu Plan de Migración a Medida"}
          </h1>

          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            Personaliza tu proyecto migratorio según tu vía (becas, empleo o nómada digital), tu presupuesto realista, situación familiar y consejos esenciales si es tu primer viaje al extranjero para no caer en estafas.
          </p>
        </div>

        {/* Decorative background vectors */}
        <div className="absolute right-[-40px] bottom-[-40px] opacity-10 pointer-events-none">
          <Plane className="w-80 h-80" />
        </div>
      </div>

      {/* Grid: 2 Columns (Form Wizard + Realtime Dynamic Plan Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Wizard Form (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/50 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-8">
          
          {/* Step 1: Origin & Destination */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-lg font-bold border-b border-outline-variant/30 dark:border-slate-800 pb-2">
              <MapPin className="w-5 h-5 text-secondary dark:text-teal-400" />
              <span>1. Origen y País de Destino</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 mb-1.5">
                  Tu País de Origen
                </label>
                <select
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  <option value="Colombia">🇨🇴 Colombia</option>
                  <option value="México">🇲🇽 México</option>
                  <option value="Perú">🇵🇪 Perú</option>
                  <option value="Argentina">🇦🇷 Argentina</option>
                  <option value="Chile">🇨🇱 Chile</option>
                  <option value="Ecuador">🇪🇨 Ecuador</option>
                  <option value="Venezuela">🇻🇪 Venezuela</option>
                  <option value="Bolivia">🇧🇴 Bolivia</option>
                  <option value="Guatemala">🇬🇹 Guatemala</option>
                  <option value="Costa Rica">🇨🇷 Costa Rica</option>
                  <option value="Otro País">🌎 Otro País Latinoamericano</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 mb-1.5">
                  País de Destino Seleccionado
                </label>
                <select
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  <option value="España">🇪🇸 España (Facilidad de idioma & Nacionalidad a los 2 años)</option>
                  <option value="Canadá">🇨🇦 Canadá (Express Entry, Estudiantes y PGWP)</option>
                  <option value="Irlanda">🇮🇪 Irlanda (Cursos de Inglés Stamp 2 con permiso de trabajo & Tech)</option>
                  <option value="Alemania">🇩🇪 Alemania (Universidades públicas, Chancenkarte & Trabajo)</option>
                  <option value="Francia">🇫🇷 Francia (Becas Eiffel & Subsidios de Alojamiento CAF)</option>
                  <option value="Italia">🇮🇹 Italia (Becas DSU por ingresos familiares)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Migration Pathway */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-lg font-bold border-b border-outline-variant/30 dark:border-slate-800 pb-2">
              <GraduationCap className="w-5 h-5 text-secondary dark:text-teal-400" />
              <span>2. Vía de Entrada Principal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPathway("estudios")}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  pathway === "estudios"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 shadow-sm"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant dark:hover:border-slate-700"
                }`}
              >
                <GraduationCap className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">🎓 Beca o Estudios</div>
                  <div className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
                    Grado, Máster o Doctorado. Permite trabajar 30h/semana en España.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPathway("trabajo")}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  pathway === "trabajo"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 shadow-sm"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant dark:hover:border-slate-700"
                }`}
              >
                <Briefcase className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">💼 Trabajo Cualificado</div>
                  <div className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
                    Tarjeta Azul UE o patrocinio de empresa contratante local.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPathway("nomada")}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  pathway === "nomada"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 shadow-sm"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant dark:hover:border-slate-700"
                }`}
              >
                <Laptop className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">💻 Nómada Digital</div>
                  <div className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
                    Trabajo en remoto para clientes extranjeros (ingresos ~2.646€/mes).
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPathway("busqueda")}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  pathway === "busqueda"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 shadow-sm"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant dark:hover:border-slate-700"
                }`}
              >
                <Compass className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">🧳 Búsqueda de Empleo</div>
                  <div className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
                    Chancenkarte en Alemania o visado post-estudio para buscar empleo.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Family Situation & Children */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-lg font-bold border-b border-outline-variant/30 dark:border-slate-800 pb-2">
              <Users className="w-5 h-5 text-secondary dark:text-teal-400" />
              <span>3. Situación Familiar e Hijos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFamilyStatus("solo")}
                className={`p-3.5 rounded-xl border text-center font-medium text-sm transition-all ${
                  familyStatus === "solo"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 font-bold"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant"
                }`}
              >
                👤 Viajo Solo/a
              </button>

              <button
                type="button"
                onClick={() => setFamilyStatus("pareja")}
                className={`p-3.5 rounded-xl border text-center font-medium text-sm transition-all ${
                  familyStatus === "pareja"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 font-bold"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant"
                }`}
              >
                👫 En Pareja
              </button>

              <button
                type="button"
                onClick={() => setFamilyStatus("familia_ninos")}
                className={`p-3.5 rounded-xl border text-center font-medium text-sm transition-all ${
                  familyStatus === "familia_ninos"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 font-bold"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant"
                }`}
              >
                👨‍👩‍👧‍👦 Con Niños / Familia
              </button>
            </div>

            {familyStatus === "familia_ninos" && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-300">
                    Número de hijos menores a cargo:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNumChildren(Math.max(1, numChildren - 1))}
                      className="w-7 h-7 rounded-lg bg-amber-200 dark:bg-amber-900 font-bold flex items-center justify-center text-amber-900 dark:text-amber-100"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm px-2">{numChildren}</span>
                    <button
                      type="button"
                      onClick={() => setNumChildren(numChildren + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-200 dark:bg-amber-900 font-bold flex items-center justify-center text-amber-900 dark:text-amber-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  📌 <strong>Requisitos con Niños en {destinationCountry}:</strong> La escolarización es 100% gratuita y obligatoria (3-16 años en España). Deberás presentar partidas de nacimiento apostilladas (con traducción jurada si aplica) y cartilla de vacunación al día. En España, los fondos demostrables aumentan un +25% del IPREM por cada menor (~150€/mes adicional).
                </div>
              </div>
            )}
          </div>

          {/* Step 4: First Time Traveling / Anti-Scam Alert */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-lg font-bold border-b border-outline-variant/30 dark:border-slate-800 pb-2">
              <Plane className="w-5 h-5 text-secondary dark:text-teal-400" />
              <span>4. Experiencia de Viaje & Guía Primerizo</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface dark:bg-slate-800 rounded-xl border border-outline-variant/50 dark:border-slate-700">
              <div className="space-y-1">
                <div className="text-sm font-bold text-on-surface dark:text-slate-100">
                  ¿Es tu primera vez viajando al extranjero o a Europa?
                </div>
                <div className="text-xs text-on-surface-variant dark:text-slate-400">
                  Activaremos la guía paso a paso de llegada, transporte en metro, alojamiento seguro y prevención de estafas.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasTraveledBefore(!hasTraveledBefore)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  !hasTraveledBefore
                    ? "bg-amber-500 text-white"
                    : "bg-surface-container dark:bg-slate-700 text-on-surface-variant dark:text-slate-300"
                }`}
              >
                {!hasTraveledBefore ? "🚨 Soy Primerizo" : "✈️ Ya he viajado"}
              </button>
            </div>
          </div>

          {/* Step 5: Climate & Lifestyle Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-lg font-bold border-b border-outline-variant/30 dark:border-slate-800 pb-2">
              <Sun className="w-5 h-5 text-secondary dark:text-teal-400" />
              <span>5. Preferencias de Clima y Entorno</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 mb-1.5">
                  Preferencia de Clima
                </label>
                <select
                  value={climate}
                  onChange={(e) => setClimate(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  <option value="calido_mediterraneo">☀️ Cálido / Mediterráneo (Mucho sol, inviernos suaves)</option>
                  <option value="templado">⛅ Templado (4 estaciones marcadas)</option>
                  <option value="frio">❄️ Frío / Nieve (Clima nórdico)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 mb-1.5">
                  Estilo de Vida Preferido
                </label>
                <select
                  value={lifestyle}
                  onChange={(e) => setLifestyle(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  <option value="universitaria_tranquila">🎓 Ciudad Universitaria Tranquila & Asequible</option>
                  <option value="gran_metropolis">🏙️ Gran Metrópolis Cosmopolita (Gran mercado laboral)</option>
                  <option value="costera">🏖️ Ciudad Costera con Playa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-outline-variant/30 dark:border-slate-800">
            <button
              onClick={handleSavePlan}
              id="save-plan-btn"
              className="flex items-center gap-2 bg-secondary dark:bg-teal-500 text-white dark:text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{planSaved ? "¡Plan Guardado!" : "Guardar mi Plan"}</span>
            </button>

            <button
              onClick={handleConsultAI}
              id="ask-ai-plan-btn"
              className="flex items-center gap-2 bg-primary dark:bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Consultar Detalles a la IA</span>
            </button>
          </div>

        </div>

        {/* Right Column: Dynamic Plan Summary, Budget & Survival Guide (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Presupuesto Realista Desglosado */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/50 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-lg font-bold">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span>Presupuesto Realista Estimado</span>
              </div>
              <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                {destinationCountry}
              </span>
            </div>

            {/* Big Numbers */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-surface-container dark:bg-slate-800/60 rounded-xl">
              <div>
                <div className="text-[11px] text-on-surface-variant dark:text-slate-400 font-medium">
                  Costo de Vida Mensual:
                </div>
                <div className="text-2xl font-extrabold text-primary dark:text-sky-300">
                  ~{budget.monthlyTotal}€ <span className="text-xs font-normal">/mes</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant dark:text-slate-400 font-medium">
                  Colchón de Llegada Sugerido:
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ~{budget.initialSavings}€
                </div>
              </div>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>🏠 Alojamiento (Habitación/Piso)</span>
                  <span className="font-bold">~{budget.rentEstimate}€</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>🛒 Alimentación y Supermercado</span>
                  <span className="font-bold">~{budget.foodEstimate}€</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '28%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>🚇 Transporte Público Local</span>
                  <span className="font-bold">~{budget.transportEstimate}€</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>🏥 Seguro Médico, Telefonía y Servicios</span>
                  <span className="font-bold">~{budget.utilitiesHealth}€</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("calculadora")}
              className="w-full py-2.5 px-4 bg-secondary/10 dark:bg-teal-950/40 hover:bg-secondary hover:text-white text-secondary dark:text-teal-300 rounded-xl text-xs font-bold transition-all border border-secondary/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Abrir Calculadora Completa y Convertir a mi Moneda Local</span>
            </button>
          </div>

          {/* Card: Ciudades Recomendadas para tu Estilo de Vida */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/50 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-base font-bold">
              <Building className="w-5 h-5 text-secondary dark:text-teal-400" />
              <span>Ciudades Recomendadas para tu Perfil</span>
            </div>

            <div className="space-y-3">
              {recommendedCities.map((city, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-surface dark:bg-slate-800/80 rounded-xl border border-outline-variant/40 dark:border-slate-700/60 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm text-on-surface dark:text-slate-100 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />
                      {city.name}, {destinationCountry}
                    </div>
                    <div className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5 leading-relaxed">
                      {city.desc}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-primary dark:text-sky-300 bg-primary/10 dark:bg-sky-950/50 px-2 py-1 rounded-lg whitespace-nowrap">
                      {city.cost}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Guía Anti-Estafas y Supervivencia para Primerizos */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-950 dark:text-amber-300 font-headline-sm text-base font-bold">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>🚨 Guía Anti-Estafas & Llegada Segura</span>
            </div>

            <div className="space-y-3 text-xs text-amber-950/90 dark:text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cero transferencias previas:</strong> NUNCA envíes dinero por Western Union, MoneyGram o Bizum a supuestos arrendadores antes de ver el piso en persona o sin plataformas con retención de fianza (Spotahome, Uniplaces, Badi).
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Hotel className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Alojamiento inicial temporal:</strong> Reserva 10 a 15 días en un hostal céntrico o Airbnb verificado. Ese tiempo te permitirá visitar habitaciones reales y solicitar el <strong>contrato para empadronamiento</strong>.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Train className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Transporte desde el aeropuerto:</strong> Usa el Metro o tren de cercanías (en Madrid Línea 8 o Renfe C1; en Barcelona Línea 9 Sud o Aerobús). Evita personas que te ofrezcan "taxis informales" en el hall de llegadas.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Trámites obligatorios al llegar:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>1. Padrón Municipal (Ayuntamiento de tu barrio).</li>
                    <li>2. Cita de toma de huellas TIE / NIE en Comisaría (dentro de los 30 días).</li>
                    <li>3. Apertura de cuenta bancaria local (BBVA, Santander, N26, Revolut).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
