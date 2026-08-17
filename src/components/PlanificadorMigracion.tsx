import React, { useState, useEffect, useMemo } from "react";
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
  Calculator,
  CheckCheck,
  ListChecks,
  RotateCcw,
  Trophy,
  Target,
  FileCheck,
  ArrowUpRight,
  Bus,
  Bike
} from "lucide-react";
import { GoogleUser, NavigationTab, MigrationPlan } from "../types";
import { Breadcrumbs } from "./Breadcrumbs";
import { saveUserMigrationPlan, getUserMigrationPlan } from "../lib/firebase";
import { LATIN_AMERICAN_COUNTRIES, DESTINATION_COUNTRIES } from "../data/countriesData";
import { useCurrency } from "../lib/CurrencyContext";
import { usePreferences } from "../lib/PreferencesContext";
import { formatCurrency } from "../lib/currency";

interface PlanificadorMigracionProps {
  currentUser: GoogleUser | null;
  setActiveTab: (tab: NavigationTab) => void;
  onAskAIWithCustomPrompt: (prompt: string) => void;
}

interface MigrationStepItem {
  id: string;
  phase: number;
  phaseTitle: string;
  title: string;
  description: string;
  category: "preparacion" | "visado" | "logistica" | "llegada";
  tip?: string;
}

/**
 * Circular Progress Indicator Component
 * Renders an accessible SVG progress ring visualizing completion of migration steps
 */
export const CircularProgressIndicator: React.FC<{
  percentage: number;
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}> = ({ percentage, completed, total, size = 130, strokeWidth = 10, className = "" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  // Dynamic color transitions according to completion level
  let strokeColor = "stroke-amber-500 text-amber-500";
  let badgeColor = "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300";
  let statusText = "Fase Inicial";

  if (percentage === 100) {
    strokeColor = "stroke-emerald-500 text-emerald-500";
    badgeColor = "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300";
    statusText = "¡Plan 100% Listo!";
  } else if (percentage >= 70) {
    strokeColor = "stroke-teal-500 text-teal-500";
    badgeColor = "bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300";
    statusText = "Fase de Llegada";
  } else if (percentage >= 40) {
    strokeColor = "stroke-secondary dark:stroke-teal-400 text-secondary dark:text-teal-400";
    badgeColor = "bg-sky-100 dark:bg-sky-950/60 text-primary dark:text-sky-300";
    statusText = "Fase Consular";
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          className="w-full h-full transform -rotate-90 drop-shadow-xs"
          viewBox={`0 0 ${size} ${size}`}
          aria-label={`Progreso del plan migratorio: ${percentage}%`}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-200/80 dark:stroke-slate-800 fill-none"
          />
          {/* Animated dynamic progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${strokeColor} fill-none transition-all duration-700 ease-out`}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none select-none">
          <span className="font-extrabold text-2xl md:text-3xl text-on-surface dark:text-slate-100 tracking-tight leading-none">
            {percentage}%
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 mt-1 uppercase tracking-wider">
            {completed}/{total} Pasos
          </span>
        </div>
      </div>

      <div className="mt-2">
        <span className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
};

export const PlanificadorMigracion: React.FC<PlanificadorMigracionProps> = ({
  currentUser,
  setActiveTab,
  onAskAIWithCustomPrompt,
}) => {
  const { currency } = useCurrency();

  // Wizard State
  // Shared with the consular map, calculator, scholarship filter and alerts so
  // a country picked anywhere is reflected everywhere.
  const {
    originCountry: sharedOrigin,
    setOriginCountry,
    destinationCountry: sharedDestination,
    setDestinationCountry,
  } = usePreferences();
  const originCountry = sharedOrigin || currentUser?.countryOfOrigin || "Colombia";
  const destinationCountry = sharedDestination || "España";
  const [pathway, setPathway] = useState<"estudios" | "trabajo" | "nomada" | "busqueda" | "ahorros">("estudios");
  const [familyStatus, setFamilyStatus] = useState<"solo" | "pareja" | "familia_ninos">("solo");
  const [numChildren, setNumChildren] = useState<number>(1);
  const [climate, setClimate] = useState<"calido_mediterraneo" | "templado" | "frio">("calido_mediterraneo");
  const [lifestyle, setLifestyle] = useState<"gran_metropolis" | "universitaria_tranquila" | "costera">("universitaria_tranquila");
  const [mobility, setMobility] = useState<"cualquiera" | "ave_tren" | "aeropuerto" | "bus_metro" | "bici_caminable">("cualquiera");
  const [hasTraveledBefore, setHasTraveledBefore] = useState<boolean>(false);
  const [planSaved, setPlanSaved] = useState<boolean>(false);

  // Migration Steps Completed Tracking State. Persisted to Firestore for
  // signed-in users only; never written to browser storage.
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [stepsFilter, setStepsFilter] = useState<"todos" | "pendientes" | "completados">("todos");

  // Sync originCountry when currentUser changes or logs in
  useEffect(() => {
    if (currentUser?.countryOfOrigin) {
      setOriginCountry(currentUser.countryOfOrigin);
    }
  }, [currentUser?.countryOfOrigin]);

  // Load existing plan from Firestore if available
  useEffect(() => {
    if (currentUser?.id) {
      getUserMigrationPlan(currentUser.id).then((savedPlan) => {
        if (savedPlan) {
          if (savedPlan.originCountry) setOriginCountry(savedPlan.originCountry);
          if (savedPlan.destinationCountry) setDestinationCountry(savedPlan.destinationCountry);
          if (savedPlan.migrationPathway) setPathway(savedPlan.migrationPathway);
          if (savedPlan.familyStatus) setFamilyStatus(savedPlan.familyStatus);
          if (savedPlan.numberOfChildren) setNumChildren(savedPlan.numberOfChildren);
          if (savedPlan.climatePreference) setClimate(savedPlan.climatePreference);
          if (savedPlan.lifestylePreference) setLifestyle(savedPlan.lifestylePreference);
          if (savedPlan.hasTraveledBefore !== undefined) setHasTraveledBefore(savedPlan.hasTraveledBefore);
          if (savedPlan.completedSteps && Array.isArray(savedPlan.completedSteps)) {
            setCompletedSteps(savedPlan.completedSteps);
          }
        }
      }).catch((e) => console.log("No saved plan in Firestore yet:", e));
    }
  }, [currentUser?.id]);

  // Dynamic tailored migration steps based on destination and pathway
  const migrationSteps = useMemo<MigrationStepItem[]>(() => {
    const steps: MigrationStepItem[] = [
      {
        id: "step_passport_apostille",
        phase: 1,
        phaseTitle: "Fase 1: Preparación en Origen",
        category: "preparacion",
        title: "Pasaporte Vigente y Documentos Base Apostillados",
        description: `Verifica que tu pasaporte tenga al menos 12 meses de vigencia. Tramita ante la Cancillería de ${originCountry} la Apostilla de La Haya para tu partida de nacimiento, títulos universitarios y certificado de antecedentes penales.`,
        tip: "Solicita mínimo 2 copias legalizadas y escanea todo en PDF de alta resolución."
      },
      {
        id: "step_proof_funds",
        phase: 1,
        phaseTitle: "Fase 1: Preparación en Origen",
        category: "preparacion",
        title: `Demostración de Fondos Económicos y Ahorro`,
        description: destinationCountry === "Alemania"
          ? "Apertura y depósito en la cuenta bloqueada oficial (Sperrkonto: ~11.904€ anuales / ~992€/mes en Expatrio, Fintiba o Coracle)."
          : destinationCountry === "España"
          ? "Acreditación bancaria del 100% del IPREM mensual (~600€/mes para estudios o salario demostrable para nómada/trabajo) en extractos certificados."
          : `Acreditación bancaria de solvencia financiera exigida por el consulado de ${destinationCountry} para cubrir manutención y estancia inicial.`,
        tip: "Los extractos bancarios no deben tener más de 30 días de antigüedad al presentarlos."
      },
      {
        id: "step_admission_contract",
        phase: 2,
        phaseTitle: "Fase 2: Admisión / Oferta & Trámite Consular",
        category: "visado",
        title: pathway === "estudios"
          ? `Carta Oficial de Admisión o Concesión de Beca en ${destinationCountry}`
          : pathway === "trabajo"
          ? `Contrato Laboral / Oferta Formal de Empleador en ${destinationCountry}`
          : pathway === "nomada"
          ? "Acreditación de Empleo Remoto o Facturación Externa (>2.646€/mes)"
          : pathway === "busqueda"
          ? `Chancenkarte o Visado de Búsqueda con Puntos y Homologación en ${destinationCountry}`
          : `Documento de Justificación de Estancia en ${destinationCountry}`,
        description: pathway === "estudios"
          ? `Carta de aceptación incondicional emitida por la universidad o centro educativo acreditado en ${destinationCountry}.`
          : pathway === "trabajo"
          ? `Autorización previa inicial de residencia y trabajo tramitada por la empresa contratante ante la delegación de gobierno.`
          : `Contratos mercantiles con clientes internacionales y extractos de cobros continuos durante los últimos 3 meses.`,
        tip: "Guarda el justificante de matrícula pagada o resolución de beca completa."
      },
      {
        id: "step_health_insurance",
        phase: 2,
        phaseTitle: "Fase 2: Admisión / Oferta & Trámite Consular",
        category: "visado",
        title: `Seguro Médico Internacional con Cobertura Completa`,
        description: `Póliza de seguro médico sin copagos ni periodos de carencia, que cubra repatriación y urgencias médicas hospitalarias en ${destinationCountry} (Sanitas, Adeslas, Mawista, Allianz Care o seguro público oficial).`,
        tip: "Verifica que el certificado mencione explícitamente cobertura ilimitada o mínima de 30.000€."
      },
      {
        id: "step_consular_appointment",
        phase: 2,
        phaseTitle: "Fase 2: Admisión / Oferta & Trámite Consular",
        category: "visado",
        title: `Cita Consular y Concesión de Visado Nacional`,
        description: `Presentación presencial en el Consulado General o centro BLS/VFS de ${destinationCountry} en ${originCountry}. Pago de tasas consulares y toma de datos biométricos.`,
        tip: "Solicita tu cita con 60 a 90 días de antelación al inicio de tus clases o contrato."
      },
      {
        id: "step_safe_accommodation_flight",
        phase: 3,
        phaseTitle: "Fase 3: Llegada y Alojamiento Seguro",
        category: "logistica",
        title: "Reserva de Vuelo y Alojamiento Temporal Seguro",
        description: `Compra de billete aéreo y reserva de 10 a 15 días en un hostal o Airbnb céntrico verificado. NUNCA envíes transferencias bancarias anticipadas a particulares antes de visitar el piso y firmar el contrato presencialmente.`,
        tip: "Descarga las apps oficiales de transporte público (DB Navigator, Renfe Cercanías, Metro) antes de subir al avión."
      },
      {
        id: "step_local_registration",
        phase: 4,
        phaseTitle: "Fase 4: Trámites Legales de Asentamiento",
        category: "llegada",
        title: destinationCountry === "Alemania"
          ? "Anmeldung: Registro de Domicilio en el Bürgeramt (14 días)"
          : destinationCountry === "España"
          ? "Empadronamiento Municipal en el Ayuntamiento del Barrio"
          : destinationCountry === "Canadá"
          ? "Activación de Study/Work Permit en CBSA + Número SIN"
          : destinationCountry === "Portugal"
          ? "Obtención de NIF y Registro de Residencia en Junta de Freguesia"
          : destinationCountry === "Irlanda"
          ? "Registro de Residencia IRP + Solicitud de Número PPS"
          : `Registro Oficial de Domicilio y Cita Migratoria en ${destinationCountry}`,
        description: `Trámite fundamental e inmediato para acceder a servicios públicos, sanidad, banco y tramitar tu tarjeta de residencia definitiva.`,
        tip: "Pide a tu casero el formulario firmado de confirmación de vivienda (Wohnungsgeberbestätigung en Alemania o autorización de padrón en España)."
      },
      {
        id: "step_residence_card_bank",
        phase: 4,
        phaseTitle: "Fase 4: Trámites Legales de Asentamiento",
        category: "llegada",
        title: destinationCountry === "España"
          ? "Toma de Huellas TIE en Comisaría + Cuenta Bancaria & Centro de Salud (CAP)"
          : destinationCountry === "Alemania"
          ? "Cita Aufenthaltstitel en Ausländerbehörde + Activación Sperrkonto y Seguro Público"
          : destinationCountry === "Canadá"
          ? "Apertura de Cuenta Bancaria Local + Registro en Seguro Médico Provincial (OHIP/MSP)"
          : `Emisión de Tarjeta de Residencia + Apertura de Cuenta Bancaria Local`,
        description: `Obtención de tu documento de identidad de extranjero definitivo y activación de tus servicios financieros y de salud locales.`,
        tip: "Lleva siempre pasaporte original, foto tamaño carné y justificante de pago de tasa del trámite."
      }
    ];

    return steps;
  }, [originCountry, destinationCountry, pathway]);

  // Calculate progress stats
  const totalSteps = migrationSteps.length;
  const completedStepsCount = migrationSteps.filter((s) => completedSteps.includes(s.id)).length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  // Toggle step completion handler
  const handleToggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const isCompleted = prev.includes(stepId);
      const updated = isCompleted ? prev.filter((id) => id !== stepId) : [...prev, stepId];

      // Sync with Firestore if logged in
      if (currentUser?.id) {
        saveUserMigrationPlan(currentUser.id, {
          originCountry,
          destinationCountry,
          migrationPathway: pathway,
          completedSteps: updated,
          updatedAt: new Date().toISOString()
        }).catch((err) => console.log("Silent sync completed steps error:", err));
      }

      return updated;
    });
  };

  // Mark all / reset helpers
  const handleMarkAllSteps = () => {
    const allIds = migrationSteps.map((s) => s.id);
    setCompletedSteps(allIds);
    if (currentUser?.id) {
      saveUserMigrationPlan(currentUser.id, {
        originCountry,
        destinationCountry,
        migrationPathway: pathway,
        completedSteps: allIds,
      }).catch(() => {});
    }
  };

  const handleResetSteps = () => {
    setCompletedSteps([]);
    if (currentUser?.id) {
      saveUserMigrationPlan(currentUser.id, {
        originCountry,
        destinationCountry,
        migrationPathway: pathway,
        completedSteps: [],
      }).catch(() => {});
    }
  };

  // Filtered steps list
  const filteredSteps = useMemo(() => {
    if (stepsFilter === "completados") {
      return migrationSteps.filter((s) => completedSteps.includes(s.id));
    }
    if (stepsFilter === "pendientes") {
      return migrationSteps.filter((s) => !completedSteps.includes(s.id));
    }
    return migrationSteps;
  }, [migrationSteps, completedSteps, stepsFilter]);

  // Suggested Cities based on choices
  const getCityRecommendations = () => {
    if (destinationCountry === "Portugal") {
      if (lifestyle === "gran_metropolis") {
        return [
          { name: "Lisboa", desc: "Capital costera, gran ecosistema tecnológico (Web Summit), transporte integrado y alta demanda de alquiler.", cost: "900€ - 1.250€/mes" },
          { name: "Oporto", desc: "Segunda ciudad con gran encanto arquitectónico, universidades de renombre y costo 15% más asequible.", cost: "750€ - 1.050€/mes" }
        ];
      }
      if (lifestyle === "universitaria_tranquila") {
        return [
          { name: "Coímbra", desc: "La histórica ciudad universitaria de Portugal, ambiente estudiantil inigualable, tradiciones y costo muy económico.", cost: "550€ - 750€/mes" },
          { name: "Braga", desc: "Ciudad joven, dinámica y una de las de mayor crecimiento en tecnología y startups del norte.", cost: "600€ - 800€/mes" }
        ];
      }
      return [
        { name: "Faro / Algarve", desc: "Costa sur paradisíaca, clima templado todo el año, ideal para nómadas digitales.", cost: "700€ - 950€/mes" },
        { name: "Aveiro", desc: "La 'Venecia portuguesa', ciudad universitaria innovadora, costera y tranquila.", cost: "600€ - 800€/mes" }
      ];
    }

    if (destinationCountry === "Australia") {
      if (lifestyle === "gran_metropolis") {
        return [
          { name: "Sídney", desc: "Capital financiera, playas emblemáticas (Bondi, Manly), salarios elevados y gran oferta de empleo.", cost: "$2.200 - $2.800 AUD/mes" },
          { name: "Melbourne", desc: "Capital cultural y universitaria de Australia, arte urbano, gastronomía y transporte en tranvía de primer nivel.", cost: "$2.000 - $2.500 AUD/mes" }
        ];
      }
      if (lifestyle === "universitaria_tranquila") {
        return [
          { name: "Adelaida", desc: "Ciudad regional designada, puntos extra para migración calificada, costo 20% menor que Sídney.", cost: "$1.600 - $2.100 AUD/mes" },
          { name: "Canberra", desc: "Capital nacional con excelentes universidades (ANU), salarios más altos de Australia y máxima seguridad.", cost: "$1.800 - $2.300 AUD/mes" }
        ];
      }
      return [
        { name: "Brisbane / Gold Coast", desc: "Clima subtropical cálido, playas de surf, hub para los Juegos Olímpicos 2032 y auge de empleo.", cost: "$1.800 - $2.300 AUD/mes" },
        { name: "Perth", desc: "Costa oeste soleada, potente industria de ingeniería y recursos, gran calidad de vida.", cost: "$1.700 - $2.200 AUD/mes" }
      ];
    }

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
    if (destinationCountry === "Portugal") baseMonthly = 720;
    if (destinationCountry === "Australia") baseMonthly = 1350;
    if (destinationCountry === "Alemania") baseMonthly = 992; // Cuenta bloqueada oficial Sperrkonto
    if (destinationCountry === "Francia") baseMonthly = 850;
    if (destinationCountry === "Canadá") baseMonthly = 1200;
    if (destinationCountry === "Estados Unidos") baseMonthly = 1400;

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

  const handleSavePlan = async () => {
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
      completedSteps,
      createdAt: new Date().toLocaleDateString("es-ES")
    };

    if (currentUser?.id) {
      try {
        await saveUserMigrationPlan(currentUser.id, plan);
      } catch (e) {
        console.error("Error guardando plan en Firestore:", e);
      }
    }
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 3000);
  };

  const handleConsultAI = () => {
    const mobilityLabel =
      mobility === "ave_tren"
        ? "Tren de Alta Velocidad (AVE / ICE / TGV)"
        : mobility === "aeropuerto"
        ? "Aeropuerto Internacional cercano (< 45 min)"
        : mobility === "bus_metro"
        ? "Red Integral de Autobús y Metro"
        : mobility === "bici_caminable"
        ? "Carriles Bici y Ciudad 100% Ciclable / Caminable"
        : "Cualquier conectividad urbana";

    const prompt = `Hola LatinoMigra IA, generé mi plan de migración con estos datos:
- País de Origen: ${originCountry}
- País de Destino: ${destinationCountry}
- Vía de Migración: ${pathway === "estudios" ? "Estudios / Beca" : pathway === "trabajo" ? "Trabajo Altamente Cualificado" : pathway === "nomada" ? "Nómada Digital" : pathway === "busqueda" ? "Búsqueda de Empleo" : "Ahorros"}
- Situación Familiar: ${familyStatus === "solo" ? "Viajo Solo/a" : familyStatus === "pareja" ? "En Pareja" : `Con Familia (${numChildren} hijos)`}
- Requisito de Movilidad y Transporte: ${mobilityLabel}
- Experiencia de Viaje Previo: ${hasTraveledBefore ? "Ya he viajado al exterior antes" : "NUNCA he viajado al extranjero, es mi primer viaje internacional"}
- Presupuesto mensual estimado: ~${formatCurrency(budget.monthlyTotal, currency)} (${currency})
- Presupuesto de ahorro inicial: ~${formatCurrency(budget.initialSavings, currency)} (${currency})

¿Podrías darme un cronograma de 6 meses con los pasos exactos, cómo moverme con transporte público / ${mobilityLabel}, cómo evitar estafas en el primer alquiler y qué trámites legales (como empadronamiento/visado) debo realizar al llegar?`;

    if (onAskAIWithCustomPrompt) {
      onAskAIWithCustomPrompt(prompt);
    } else {
      setActiveTab("chat");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 animate-fade-in">
      {/* Breadcrumbs */}
      <Breadcrumbs activeTab="planificador" setActiveTab={setActiveTab} />

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
                  id="planner-origin-country"
                  className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  {LATIN_AMERICAN_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant dark:text-slate-400 mb-1.5">
                  País de Destino Seleccionado
                </label>
                <select
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  id="planner-destination-country"
                  className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-800 border border-outline-variant/60 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary outline-none dark:text-slate-100"
                >
                  {DESTINATION_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name} ({c.region} · {c.currencyCode})
                    </option>
                  ))}
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
                className={`p-3.5 rounded-xl border text-center font-medium text-sm transition-all active:scale-95 cursor-pointer ${
                  familyStatus === "solo"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 font-bold shadow-xs"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant text-on-surface dark:text-slate-200"
                }`}
              >
                👤 Viajo Solo/a
              </button>

              <button
                type="button"
                onClick={() => setFamilyStatus("pareja")}
                className={`p-3.5 rounded-xl border text-center font-medium text-sm transition-all active:scale-95 cursor-pointer ${
                  familyStatus === "pareja"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 font-bold shadow-xs"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant text-on-surface dark:text-slate-200"
                }`}
              >
                👫 En Pareja
              </button>

              <button
                type="button"
                onClick={() => setFamilyStatus("familia_ninos")}
                className={`p-3.5 rounded-xl border text-center font-medium text-sm transition-all active:scale-95 cursor-pointer ${
                  familyStatus === "familia_ninos"
                    ? "border-secondary dark:border-teal-400 bg-secondary/10 dark:bg-teal-950/30 text-primary dark:text-teal-200 font-bold shadow-xs"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant text-on-surface dark:text-slate-200"
                }`}
              >
                👨‍👩‍👧‍👦 Con Niños / Familia
              </button>
            </div>

            {familyStatus === "familia_ninos" && (
              <div className="bg-sky-50/70 dark:bg-slate-800/80 border border-sky-200/80 dark:border-slate-700 rounded-2xl p-5 text-xs space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-primary dark:text-sky-300">
                    <Baby className="w-4 h-4 text-secondary dark:text-teal-400" />
                    <span>Número de hijos menores a cargo:</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setNumChildren(Math.max(1, numChildren - 1))}
                      className="w-11 h-11 sm:w-8 sm:h-8 rounded-lg bg-surface dark:bg-slate-800 hover:bg-surface-container-high dark:hover:bg-slate-700 font-bold flex items-center justify-center text-on-surface dark:text-slate-100 transition-colors active:scale-90"
                      aria-label="Disminuir hijos"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm px-2.5 text-primary dark:text-sky-300">{numChildren}</span>
                    <button
                      type="button"
                      onClick={() => setNumChildren(numChildren + 1)}
                      className="w-11 h-11 sm:w-8 sm:h-8 rounded-lg bg-surface dark:bg-slate-800 hover:bg-surface-container-high dark:hover:bg-slate-700 font-bold flex items-center justify-center text-on-surface dark:text-slate-100 transition-colors active:scale-90"
                      aria-label="Aumentar hijos"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Country-Specific Family Requirements and Rights */}
                <div className="space-y-2.5">
                  <div className="font-bold text-xs text-primary dark:text-sky-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Requisitos y Beneficios Oficiales para Familias en {destinationCountry}:</span>
                  </div>

                  {destinationCountry === "Alemania" && (
                    <ul className="space-y-2 text-on-surface-variant dark:text-slate-300 leading-relaxed pl-1">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🏫 Educación Gratuita:</span>
                        <span>La escolarización pública es obligatoria y gratuita (<em>Schulpflicht</em> de 6 a 18 años). Guarderías (<em>Kita</em>) subvencionadas desde el primer año de vida.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">💶 Subsidio Kindergeld:</span>
                        <span>Tienes derecho a solicitar la prestación por hijo (<strong>~250€/mes por menor</strong>) una vez completado el <em>Anmeldung</em> y obtenido tu permiso de residencia.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🏥 Salud Familiar:</span>
                        <span>El seguro médico público legal (TK, AOK, Barmer) incluye a tus hijos y cónyuge sin ingresos <strong>sin coste mensual adicional</strong> (<em>Familienversicherung</em>).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">📋 Documentación:</span>
                        <span>Partidas de nacimiento apostilladas con traducción jurada al alemán (<em>vereidigte Übersetzung</em>) y cartilla de vacunación al día (vacunación de sarampión/Masernschutzgesetz obligatoria para matricular).</span>
                      </li>
                    </ul>
                  )}

                  {destinationCountry === "España" && (
                    <ul className="space-y-2 text-on-surface-variant dark:text-slate-300 leading-relaxed pl-1">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🏫 Educación Gratuita:</span>
                        <span>Escolarización pública 100% gratuita y obligatoria (3 a 16 años). La plaza escolar se solicita en la delegación de educación tras el empadronamiento.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">💶 Fondos Demostrables:</span>
                        <span>En el visado, los fondos económicos demostrables se incrementan en un <strong>+25% del IPREM mensual</strong> (~150€/mes adicionales) por cada menor a cargo.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🏥 Tarjeta Sanitaria:</span>
                        <span>Acceso pleno al sistema de salud autonómico (médico de cabecera y pediatra en el CAP de tu barrio) a través del padrón municipal.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">📋 Documentación:</span>
                        <span>Partidas de nacimiento apostilladas ante la Cancillería de tu país de origen y cartilla de vacunas infantil actualizada.</span>
                      </li>
                    </ul>
                  )}

                  {destinationCountry === "Canadá" && (
                    <ul className="space-y-2 text-on-surface-variant dark:text-slate-300 leading-relaxed pl-1">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🏫 Escuela Pública Gratuita:</span>
                        <span>Los hijos de portadores de <em>Study Permit</em> o <em>Work Permit</em> tienen derecho a estudiar sin pagar matrícula internacional en escuelas públicas (Elementary & High School).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🍁 Fondos IRCC:</span>
                        <span>Se exige demostrar fondos de manutención adicionales (~3.000$ a 4.000$ CAD anuales por cada dependiente menor).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🏥 Cobertura Provincial:</span>
                        <span>Inscripción en el plan de salud de la provincia de destino (OHIP en Ontario, MSP en British Columbia, RAMQ en Quebec).</span>
                      </li>
                    </ul>
                  )}

                  {destinationCountry === "Irlanda" && (
                    <ul className="space-y-2 text-on-surface-variant dark:text-slate-300 leading-relaxed pl-1">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🏫 Educación Primaria/Secundaria:</span>
                        <span>Educación pública gratuita en <em>National Schools</em> para residentes con visado de trabajo o posgrado cualificado.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">⚠️ Visados con Familia:</span>
                        <span>Reagrupación familiar permitida principalmente con permisos de trabajo (Stamp 1 / Critical Skills) o programas de Maestría/PhD. En cursos de inglés (Stamp 2), los dependientes no pueden viajar como acompañantes.</span>
                      </li>
                    </ul>
                  )}

                  {destinationCountry !== "Alemania" && destinationCountry !== "España" && destinationCountry !== "Canadá" && destinationCountry !== "Irlanda" && (
                    <ul className="space-y-2 text-on-surface-variant dark:text-slate-300 leading-relaxed pl-1">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">🏫 Educación Pública:</span>
                        <span>Acceso garantizado a la educación obligatoria gratuita en escuelas públicas locales con tu registro de domicilio.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-secondary dark:text-teal-400">📋 Documentación:</span>
                        <span>Partidas de nacimiento apostilladas, traducción jurada al idioma oficial del país de destino y carné internacional de vacunación.</span>
                      </li>
                    </ul>
                  )}
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

          {/* Step 6: Mobility & Transport Requirement */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-lg font-bold border-b border-outline-variant/30 dark:border-slate-800 pb-2">
              <Train className="w-5 h-5 text-secondary dark:text-teal-400" />
              <span>6. Movilidad y Conectividad Urbana Requerida</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMobility("ave_tren")}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex items-center gap-2 cursor-pointer ${
                  mobility === "ave_tren"
                    ? "border-secondary bg-secondary/15 dark:bg-teal-950/40 text-primary dark:text-teal-300 font-bold shadow-xs"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant text-on-surface-variant dark:text-slate-300"
                }`}
              >
                <Train className="w-4 h-4 text-secondary shrink-0" />
                <div>
                  <div className="font-bold">🚆 Tren / AVE</div>
                  <div className="text-[10px] text-slate-500">Alta velocidad</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMobility("aeropuerto")}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex items-center gap-2 cursor-pointer ${
                  mobility === "aeropuerto"
                    ? "border-secondary bg-secondary/15 dark:bg-teal-950/40 text-primary dark:text-teal-300 font-bold shadow-xs"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant text-on-surface-variant dark:text-slate-300"
                }`}
              >
                <Plane className="w-4 h-4 text-secondary shrink-0" />
                <div>
                  <div className="font-bold">✈️ Aeropuerto</div>
                  <div className="text-[10px] text-slate-500">&lt; 45 minutos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMobility("bus_metro")}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex items-center gap-2 cursor-pointer ${
                  mobility === "bus_metro"
                    ? "border-secondary bg-secondary/15 dark:bg-teal-950/40 text-primary dark:text-teal-300 font-bold shadow-xs"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant text-on-surface-variant dark:text-slate-300"
                }`}
              >
                <Bus className="w-4 h-4 text-secondary shrink-0" />
                <div>
                  <div className="font-bold">🚌 Bus / Metro</div>
                  <div className="text-[10px] text-slate-500">Red integral</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMobility("bici_caminable")}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex items-center gap-2 cursor-pointer ${
                  mobility === "bici_caminable"
                    ? "border-secondary bg-secondary/15 dark:bg-teal-950/40 text-primary dark:text-teal-300 font-bold shadow-xs"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant text-on-surface-variant dark:text-slate-300"
                }`}
              >
                <Bike className="w-4 h-4 text-secondary shrink-0" />
                <div>
                  <div className="font-bold">🚲 Bici / Caminable</div>
                  <div className="text-[10px] text-slate-500">Carriles bici</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMobility("cualquiera")}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex items-center gap-2 col-span-2 sm:col-span-2 cursor-pointer ${
                  mobility === "cualquiera"
                    ? "border-secondary bg-secondary/15 dark:bg-teal-950/40 text-primary dark:text-teal-300 font-bold shadow-xs"
                    : "border-outline-variant/50 dark:border-slate-800 hover:border-outline-variant text-on-surface-variant dark:text-slate-300"
                }`}
              >
                <Compass className="w-4 h-4 text-secondary shrink-0" />
                <div>
                  <div className="font-bold">🌐 Cualquier Conectividad</div>
                  <div className="text-[10px] text-slate-500">Flexible / Sin preferencia</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-outline-variant/30 dark:border-slate-800">
            <button
              onClick={handleSavePlan}
              id="save-plan-btn"
              className="flex items-center gap-2 bg-secondary dark:bg-teal-500 text-white dark:text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{planSaved ? "¡Plan Guardado!" : "Guardar mi Plan"}</span>
            </button>

            <button
              onClick={handleConsultAI}
              id="ask-ai-plan-btn"
              className="flex items-center gap-2 bg-primary dark:bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Consultar Detalles a la IA</span>
            </button>
          </div>

        </div>

        {/* Right Column: Dynamic Plan Summary, Budget & Survival Guide (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Indicador de Progreso del Plan Migratorio (Circular Progress Meter) */}
          <div id="progreso-migracion-card" className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border-2 border-primary/20 dark:border-sky-500/30 p-6 shadow-md space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-base font-bold">
                <Target className="w-5 h-5 text-secondary dark:text-teal-400" />
                <span>Progreso de tu Ruta Migratoria</span>
              </div>
              <span className="text-[11px] font-bold bg-primary/10 dark:bg-sky-950/60 text-primary dark:text-sky-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                {destinationCountry}
              </span>
            </div>

            {/* Circular Progress Gauge & Summary */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-surface-container/60 dark:bg-slate-800/60 rounded-xl border border-outline-variant/40 dark:border-slate-700/60">
              <CircularProgressIndicator
                percentage={progressPercentage}
                completed={completedStepsCount}
                total={totalSteps}
                size={120}
                strokeWidth={10}
              />

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">
                  Estado del Plan:
                </div>
                <div className="text-sm font-bold text-on-surface dark:text-slate-100 leading-snug">
                  {progressPercentage === 100 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                      <Trophy className="w-4 h-4 text-amber-500" /> ¡Completaste todos los pasos preparatorios!
                    </span>
                  ) : progressPercentage >= 70 ? (
                    <span className="text-teal-600 dark:text-teal-400">
                      ¡Fase avanzada! Te encuentras listo para la logística de vuelo y asentamiento.
                    </span>
                  ) : progressPercentage >= 40 ? (
                    <span className="text-primary dark:text-sky-300">
                      ¡Buen ritmo! Avanzando con trámites consulares y seguro médico.
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300">
                      Fase inicial: Recopilando apostillas, certificados y solvencia económica.
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
                  {completedStepsCount} de {totalSteps} pasos completados
                </div>

                {/* Quick actions for steps */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  {progressPercentage < 100 ? (
                    <button
                      onClick={handleMarkAllSteps}
                      className="btn-tactile text-[11px] font-bold text-primary dark:text-sky-300 bg-primary/10 dark:bg-sky-950/60 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Marcar todos los pasos como completados"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar todos</span>
                    </button>
                  ) : null}

                  {completedStepsCount > 0 ? (
                    <button
                      onClick={handleResetSteps}
                      className="btn-tactile text-[11px] font-bold text-on-surface-variant dark:text-slate-400 hover:text-red-500 bg-surface-container dark:bg-slate-700/60 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Reiniciar los pasos completados"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reiniciar</span>
                    </button>
                  ) : null}

                  <a
                    href="#checklist-pasos-migracion"
                    className="btn-tactile text-[11px] font-bold text-secondary dark:text-teal-300 hover:underline px-2 py-1 flex items-center gap-1"
                  >
                    <span>Ver lista</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Presupuesto Realista Desglosado */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/50 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-lg font-bold">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span>Presupuesto Realista Estimado ({currency})</span>
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
                  ~{formatCurrency(budget.monthlyTotal, currency)} <span className="text-xs font-normal">/mes</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant dark:text-slate-400 font-medium">
                  Colchón de Llegada Sugerido:
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ~{formatCurrency(budget.initialSavings, currency)}
                </div>
              </div>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>🏠 Alojamiento (Habitación/Piso)</span>
                  <span className="font-bold">~{formatCurrency(budget.rentEstimate, currency)}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>🛒 Alimentación y Supermercado</span>
                  <span className="font-bold">~{formatCurrency(budget.foodEstimate, currency)}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '28%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>🚇 Transporte Público Local ({mobility === "ave_tren" ? "Tren/AVE" : mobility === "bici_caminable" ? "Bici/Caminata" : "Bus/Metro"})</span>
                  <span className="font-bold">~{formatCurrency(budget.transportEstimate, currency)}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>🏥 Seguro Médico, Telefonía y Servicios</span>
                  <span className="font-bold">~{formatCurrency(budget.utilitiesHealth, currency)}</span>
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
            <div className="flex items-center justify-between text-amber-950 dark:text-amber-300 font-headline-sm text-base font-bold">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>🚨 Guía de Llegada & Anti-Estafas</span>
              </div>
              <span className="text-[11px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md">
                {destinationCountry}
              </span>
            </div>

            <div className="space-y-3 text-xs text-amber-950/90 dark:text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cero transferencias previas:</strong> NUNCA envíes dinero por Western Union, MoneyGram o transferencias dudosas a supuestos arrendadores antes de ver el piso en persona o sin plataformas con retención de fianza (Spotahome, Uniplaces, Badi, WG-Gesucht).
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Hotel className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Alojamiento inicial temporal:</strong> Reserva 10 a 15 días en un hostal céntrico o Airbnb verificado. Ese tiempo te permitirá visitar habitaciones presencialmente y solicitar el <strong>contrato para empadronamiento/Anmeldung</strong>.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Train className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Transporte seguro desde el aeropuerto:</strong>{" "}
                  {destinationCountry === "Alemania" && "En Berlín usa FEX o S-Bahn S9; en Frankfurt S8/S9 Regionalbahnhof; en Múnich S1/S8. Descarga la app oficial DB Navigator o BVG y compra el Deutschlandticket (~49€/mes). Evita falsos taxis."}
                  {destinationCountry === "España" && "En Madrid usa Metro Línea 8 o Renfe Cercanías C1 (desde T4); en Barcelona Metro L9 Sud o Aerobús a Plaza Cataluña. Evita personas que ofrezcan taxis informales en el hall."}
                  {destinationCountry === "Canadá" && "En Toronto usa el tren UP Express a Union Station; en Vancouver el Skytrain Canada Line; en Montreal el Bus 747 Express. Utiliza taxis autorizados con taxímetro o Uber."}
                  {destinationCountry === "Irlanda" && "En Dublín usa Dublin Express (782/784) o el autobús 41. Compra la tarjeta de transporte Leap Card en los quioscos del aeropuerto."}
                  {destinationCountry === "Francia" && "En París CDG toma el RER B o el RoissyBus hacia Ópera. Descarga la app oficial de Île-de-France Mobilités para tu pase Navigo."}
                  {destinationCountry !== "Alemania" && destinationCountry !== "España" && destinationCountry !== "Canadá" && destinationCountry !== "Irlanda" && destinationCountry !== "Francia" && "Utiliza siempre el tren de cercanías, metro o autobuses oficiales express del aeropuerto. Evita abordajes informales en las salidas de llegadas."}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Trámites obligatorios inmediatos ({destinationCountry}):</strong>
                  {destinationCountry === "Alemania" && (
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>1. <strong>Anmeldung</strong> (Registro de domicilio en el Bürgeramt de tu distrito dentro de los 14 días).</li>
                      <li>2. <strong>Aufenthaltstitel</strong> (Cita en la oficina de extranjería Ausländerbehörde / LEA para tu tarjeta de residencia).</li>
                      <li>3. <strong>Cuenta bancaria & Seguro</strong> (Apertura de cuenta N26/Commerzbank y activación de TK/AOK).</li>
                    </ul>
                  )}
                  {destinationCountry === "España" && (
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>1. <strong>Padrón Municipal</strong> (Ayuntamiento de tu barrio con contrato de alquiler).</li>
                      <li>2. <strong>Cita TIE / Toma de huellas</strong> en Comisaría de Policía Nacional (dentro de los 30 días).</li>
                      <li>3. <strong>Cuenta bancaria & CAP</strong> (Apertura de cuenta BBVA/Santander/N26 y asignación de centro de salud).</li>
                    </ul>
                  )}
                  {destinationCountry === "Canadá" && (
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>1. <strong>Recepción de Study/Work Permit</strong> en el punto de control CBSA del aeropuerto.</li>
                      <li>2. <strong>Número SIN</strong> (Social Insurance Number en una oficina de Service Canada).</li>
                      <li>3. <strong>Cuenta bancaria & Salud Provincial</strong> (Apertura en RBC/TD/Scotiabank y registro MSP/OHIP).</li>
                    </ul>
                  )}
                  {destinationCountry === "Irlanda" && (
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>1. <strong>Registro IRP</strong> (Cita de Irish Residence Permit en Burgh Quay o comisaría de Garda).</li>
                      <li>2. <strong>Número PPS</strong> (Personal Public Service Number para trabajar legalmente).</li>
                      <li>3. <strong>Cuenta bancaria</strong> (AIB, Bank of Ireland o Revolut IE con prueba de dirección).</li>
                    </ul>
                  )}
                  {destinationCountry !== "Alemania" && destinationCountry !== "España" && destinationCountry !== "Canadá" && destinationCountry !== "Irlanda" && (
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>1. <strong>Registro de Residencia</strong> local en la alcaldía o prefectura correspondiente.</li>
                      <li>2. <strong>Permiso de Residencia / Huellas</strong> ante la autoridad migratoria competente.</li>
                      <li>3. <strong>Cuenta bancaria & Asistencia Sanitaria</strong> local.</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Interactive Migration Roadmap & Steps Checklist Section */}
      <div
        id="checklist-pasos-migracion"
        className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-outline-variant/60 dark:border-slate-800 p-6 md:p-8 shadow-md space-y-6"
      >
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-primary dark:text-sky-300 font-headline-sm text-xl font-bold">
              <ListChecks className="w-6 h-6 text-secondary dark:text-teal-400" />
              <span>Hoja de Ruta & Pasos Clave ({destinationCountry})</span>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant dark:text-slate-400 mt-1">
              Marca cada hito completado. El indicador circular se actualiza en tiempo real para reflejar tu avance hacia {destinationCountry}.
            </p>
          </div>

          {/* Filter Chips & Batch Action */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-surface-container dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-outline-variant/30 dark:border-slate-700/50">
              <button
                onClick={() => setStepsFilter("todos")}
                className={`btn-tactile px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stepsFilter === "todos"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-700"
                }`}
              >
                Todos ({totalSteps})
              </button>
              <button
                onClick={() => setStepsFilter("pendientes")}
                className={`btn-tactile px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stepsFilter === "pendientes"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-700"
                }`}
              >
                Pendientes ({totalSteps - completedStepsCount})
              </button>
              <button
                onClick={() => setStepsFilter("completados")}
                className={`btn-tactile px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stepsFilter === "completados"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-700"
                }`}
              >
                Completados ({completedStepsCount})
              </button>
            </div>

            {completedStepsCount > 0 && (
              <button
                onClick={handleResetSteps}
                className="btn-tactile text-xs font-bold text-on-surface-variant dark:text-slate-400 hover:text-red-500 bg-surface-container dark:bg-slate-800 px-3 py-2 rounded-xl border border-outline-variant/30 dark:border-slate-700/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Reiniciar lista de pasos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            )}
          </div>
        </div>

        {/* 100% Completion Celebration Banner */}
        {progressPercentage === 100 && (
          <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Trophy className="w-6 h-6 text-amber-300" />
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-base text-emerald-950 dark:text-emerald-300">
                ¡Enhorabuena! Has completado el 100% de los pasos de tu hoja de ruta
              </h4>
              <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 mt-0.5 leading-relaxed">
                Tienes toda la documentación, visado y logística preparados para iniciar tu nueva etapa en {destinationCountry}. Recuerda llevar copias impresas en tu equipaje de mano.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("comunidad")}
              className="btn-tactile px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
            >
              Conectar con la Comunidad
            </button>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-3.5">
          {filteredSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                onClick={() => handleToggleStep(step.id)}
                className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer select-none group flex items-start gap-4 ${
                  isCompleted
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-800/60"
                    : "bg-surface dark:bg-slate-800/70 border-outline-variant/40 dark:border-slate-700/60 hover:border-primary/40 hover:bg-surface-container/50"
                }`}
              >
                {/* Interactive Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStep(step.id);
                  }}
                  className={`btn-tactile w-11 h-11 sm:w-8 sm:h-8 mt-0.5 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border-2 border-outline dark:border-slate-600 hover:border-primary text-transparent bg-white dark:bg-slate-900"
                  }`}
                  aria-label={isCompleted ? "Marcar como pendiente" : "Marcar como completado"}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isCompleted ? "opacity-100" : "opacity-0"}`} />
                </button>

                {/* Step Details */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      step.category === "preparacion"
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                        : step.category === "visado"
                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300"
                        : step.category === "logistica"
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                        : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                    }`}>
                      {step.phaseTitle}
                    </span>

                    {isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completado
                      </span>
                    )}
                  </div>

                  <h3 className={`font-bold text-sm md:text-base leading-snug transition-colors ${
                    isCompleted
                      ? "text-on-surface/70 dark:text-slate-400 line-through decoration-emerald-500/60"
                      : "text-on-surface dark:text-slate-100 group-hover:text-primary dark:group-hover:text-sky-300"
                  }`}>
                    {step.title}
                  </h3>

                  <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>

                  {step.tip && (
                    <div className="mt-2 inline-flex items-start gap-1.5 p-2 bg-surface-container/60 dark:bg-slate-800/90 rounded-lg border border-outline-variant/30 dark:border-slate-700 text-[11px] text-on-surface-variant dark:text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Consejo clave:</strong> {step.tip}</span>
                    </div>
                  )}
                </div>

                {/* AI Prompt Shortcut Button */}
                <div className="shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAIWithCustomPrompt(`Hola LatinoMigra IA, estoy planificando mi migración desde ${originCountry} hacia ${destinationCountry} (vía ${pathway}). 
Quiero asesoría detallada y paso a paso sobre el siguiente requisito:
- "${step.title}"
- Detalle: ${step.description}

¿Cuáles son los plazos recomendados, costos oficiales, posibles errores que debo evitar y enlaces/portales gubernamentales donde debo realizar este trámite?`);
                    }}
                    className="btn-tactile tap-target p-2 rounded-xl text-primary dark:text-sky-300 hover:bg-primary/10 dark:hover:bg-sky-950/50 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold active:scale-95"
                    title="Preguntar a la IA sobre este paso específico"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="hidden lg:inline">Consultar IA</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSteps.length === 0 && (
            <div className="text-center py-8 bg-surface dark:bg-slate-800/40 rounded-2xl border border-outline-variant/30 dark:border-slate-800 text-on-surface-variant dark:text-slate-400 text-sm">
              No hay pasos en esta categoría ({stepsFilter}).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
