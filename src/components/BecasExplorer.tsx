import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Heart,
  Calendar as CalendarIcon,
  ExternalLink,
  MapPin,
  Sparkles,
  Bot,
  X,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Building2,
  GraduationCap,
  Globe2,
  Award,
  PlusCircle,
  Send,
  ArrowDownCircle,
  SlidersHorizontal,
  RefreshCw,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Scholarship, NavigationTab, GoogleUser } from "../types";
import { Breadcrumbs } from "./Breadcrumbs";
import { isAdmin } from "../lib/authUtils";
import { SCHOLARSHIPS_DATA } from "../data/scholarships";
import { STUDY_PROGRAMMES_DATA } from "../data/studyProgrammes";
import { validateStudyProgrammes } from "../lib/studyProgrammes";
import { generateGoogleCalendarUrl } from "../lib/googleCalendar";
import {
  fetchUserBookmarks,
  toggleBookmarkScholarship,
  fetchScholarshipsFromDB,
  seedScholarshipsToDB,
  triggerScholarshipSync,
  getUserAlertPreferences,
  getUserMigrationPlan,
} from "../lib/firebase";
import { usePreferences } from "../lib/PreferencesContext";
import { useLanguage } from "../lib/i18n";
import { FilterChipGroup } from "./ui/FilterChipGroup";
import { Modal } from "./ui/Modal";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { Disclosure } from "./ui/Disclosure";
import { EstudiosSection } from "./EstudiosSection";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface BecasExplorerProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setActiveTab: (tab: NavigationTab) => void;
  onAskAIAboutScholarship: (scholarship: Scholarship) => void;
  currentUser?: GoogleUser | null;
  onOpenAuthModal?: () => void;
}

/**
 * Days from today to a deadline, or null when the date cannot be read.
 *
 * The dataset carries `deadlineDate` and never `daysLeft`, which the filters
 * had been reading — so the deadline options silently matched everything.
 */
function daysUntil(deadline: string): number | null {
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * The assistant cannot yet answer usefully about one specific call, so the
 * button is hidden rather than removed: the handler, the prop and the path
 * through `App` stay wired, and restoring it is this one word.
 */
const SHOW_ASK_AI_ABOUT_SCHOLARSHIP = false;

/** How many convocatorias each "Cargar más" adds. */
const LOAD_BATCH_SIZE = 6;

/** Long enough for a slow connection, short enough to not look frozen. */
const CATALOGUE_FETCH_TIMEOUT_MS = 8000;

type SortOption = "deadline-asc" | "deadline-desc" | "title-asc" | "support-first";

type ViewModeTab = "all" | "favorites" | "profile" | "estudios";

/** Display names for the stored `educationLevel` values. */
const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  pregrado: "Pregrado",
  postgrado: "Postgrado / Máster",
  doctorado: "Doctorado / PhD",
  postdoctorado: "Post Doctorado",
};

/**
 * Hoisted out of the markup so the trigger and the list cannot drift apart:
 * `SelectValue` renders the label of whichever item matches `sortBy`, so a
 * label that exists in only one of the two would render blank.
 */
const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "deadline-asc", label: "⏱️ Cierre más próximo (Inminente)" },
  { id: "deadline-desc", label: "⏳ Más tiempo para postular" },
  { id: "support-first", label: "💰 Beca Completa primero" },
  { id: "title-asc", label: "🔤 Nombre (A-Z)" },
];

export const BecasExplorer: React.FC<BecasExplorerProps> = ({
  searchQuery,
  setSearchQuery,
  setActiveTab,
  onAskAIAboutScholarship,
  currentUser,
}) => {
  // Dynamic scholarships state loaded from Firestore with fallback to static dataset
  const [scholarshipsList, setScholarshipsList] = useState<Scholarship[]>(SCHOLARSHIPS_DATA);
  const [isSyncingAI, setIsSyncingAI] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // The country filter starts on the destination chosen elsewhere in the app
  // (planner, guides, consular map). Narrowing to a specific country updates
  // that shared choice; widening back to "Todos" only relaxes this filter and
  // deliberately leaves the app-wide destination alone.
  const { destinationCountry, setDestinationCountry } = usePreferences();
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountryState] = useState<string>(
    () => destinationCountry || "Todos"
  );
  const setSelectedCountry = (country: string) => {
    setSelectedCountryState(country);
    if (country && country !== "Todos") setDestinationCountry(country);
  };

  // Follow the shared destination when another screen changes it.
  useEffect(() => {
    if (destinationCountry) setSelectedCountryState(destinationCountry);
  }, [destinationCountry]);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>("todos");
  const [selectedArea, setSelectedArea] = useState<string>("Todas");
  const [selectedSupportType, setSelectedSupportType] = useState<string>("Todos");
  const [selectedInstitutionType, setSelectedInstitutionType] = useState<string>("Todas");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("Todas");
  const [sortBy, setSortBy] = useState<SortOption>("deadline-asc");
  // Favorites live in Firestore for signed-in users and in component state for
  // guests. Nothing is written to browser storage.
  const [favorites, setFavorites] = useState<string[]>([]);

  /**
   * How the Firestore catalogue load is going.
   *
   * The list starts populated with the bundled dataset, so there is never a
   * blank screen to fill with a skeleton — the problem was the opposite. Cards
   * were silently replaced when Firestore answered, and a failure showed
   * nothing at all: the bundled data stood in for the live catalogue with no
   * way to tell the difference.
   */
  const [catalogueStatus, setCatalogueStatus] = useState<"loading" | "live" | "bundled">("loading");

  // Load scholarships from Firestore on mount
  useEffect(() => {
    let isMounted = true;

    /**
     * Firestore can hang rather than fail — an unreachable backend leaves the
     * promise pending forever, and "Actualizando convocatorias…" would sit on
     * screen for the rest of the session. On a phone with a dead connection
     * that is the common case, not the rare one.
     */
    const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("scholarship fetch timed out")), ms)
        ),
      ]);

    async function loadDB() {
      try {
        const dbItems = await withTimeout(fetchScholarshipsFromDB(), CATALOGUE_FETCH_TIMEOUT_MS);
        if (!isMounted) return;
        if (dbItems && dbItems.length > 0) {
          setScholarshipsList(dbItems as Scholarship[]);
          setCatalogueStatus("live");
        } else {
          // An empty collection is not an error, but it does mean what is on
          // screen is the bundled copy rather than the live catalogue.
          setCatalogueStatus("bundled");
        }
      } catch (e) {
        console.warn("Using fallback scholarship dataset:", e);
        if (isMounted) setCatalogueStatus("bundled");
      }
    }
    loadDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch favorites and profile settings from Firestore when user logs in or changes
  const [userProfileFilters, setUserProfileFilters] = useState<{
    destinationCountry?: string;
    preferredArea?: string;
    educationLevel?: string;
  } | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserBookmarks(currentUser.id)
        .then((bookmarks) => {
          if (bookmarks && bookmarks.length > 0) {
            setFavorites(bookmarks);
          }
        })
        .catch((e) => console.info("Error loading bookmarks from Firestore:", e));

      Promise.all([
        getUserAlertPreferences(currentUser.id).catch(() => null),
        getUserMigrationPlan(currentUser.id).catch(() => null),
      ]).then(([alertPrefs, migrationPlan]) => {
        const dest = migrationPlan?.destinationCountry || alertPrefs?.destinationCountry;
        const area =
          alertPrefs?.preferredArea &&
          alertPrefs.preferredArea !== "Todas las áreas" &&
          alertPrefs.preferredArea !== "Todas"
            ? alertPrefs.preferredArea
            : undefined;
        const edu = migrationPlan?.migrationPathway === "estudios" ? "postgrado" : undefined;
        if (dest || area || edu) {
          setUserProfileFilters({
            destinationCountry: dest,
            preferredArea: area,
            educationLevel: edu,
          });
        }
      });
    }
  }, [currentUser?.id]);

  const [viewModeTab, setViewModeTab] = useState<ViewModeTab>("all");

  /**
   * Selecting "Para mi Perfil" also seeds the filters from the saved plan, so
   * the tab change and those writes have to happen together — Radix reports
   * the change once, through `onValueChange`.
   */
  const handleViewModeChange = (value: string) => {
    const tab = value as ViewModeTab;
    setViewModeTab(tab);
    if (tab !== "profile" || !userProfileFilters) return;
    if (userProfileFilters.destinationCountry) {
      setSelectedCountry(userProfileFilters.destinationCountry);
    }
    if (userProfileFilters.preferredArea) {
      setSelectedArea(userProfileFilters.preferredArea);
    }
    if (userProfileFilters.educationLevel) {
      setSelectedEducationLevel(userProfileFilters.educationLevel);
    }
  };
  /**
   * The Estudios half of the screen (#56) is a different catalogue, so the
   * scholarship chrome — search, sort, the filter sidebar and the mobile quick
   * filters — is hidden while it is open. A sort control that sorts nothing on
   * screen is an interface lying about its own behaviour.
   */
  const showingStudies = viewModeTab === "estudios";

  /**
   * What the Estudios tab will actually show — not `STUDY_PROGRAMMES_DATA.length`.
   * An entry without an official source does not render, and a badge counting
   * the entries rather than the results is the "counted the whole catalogue
   * while the list was filtered" defect this screen already had.
   */
  const studyProgrammeCount = useMemo(
    () => validateStudyProgrammes(STUDY_PROGRAMMES_DATA).valid.length,
    []
  );

  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState<boolean>(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  const [suggestForm, setSuggestForm] = useState({
    university: "",
    country: "España",
    scholarshipName: "",
    officialUrl: "",
    notes: "",
  });
  const [suggestSuccess, setSuggestSuccess] = useState<boolean>(false);

  /**
   * How many convocatorias are on screen. The list loads more on request and
   * never paginates: one way through the catalogue, not two behind a switch.
   */
  const [visibleCount, setVisibleCount] = useState<number>(LOAD_BATCH_SIZE);
  const mainListRef = useRef<HTMLDivElement>(null);

  const countries = [
    "Todos",
    "España",
    "Portugal",
    "Alemania",
    "Francia",
    "Italia",
    "Países Bajos",
    "Suiza",
    "Suecia",
    "Reino Unido",
    "Estados Unidos",
    "Canadá",
    "Australia",
  ];

  // Labels are short because they are read on a phone, inside a chip.
  const educationLevels = [
    { id: "todos", label: "🎓 Todos" },
    { id: "pregrado", label: "📚 Pregrado" },
    { id: "postgrado", label: "🎯 Postgrado / Máster" },
    { id: "doctorado", label: "🔬 Doctorado" },
    { id: "postdoctorado", label: "🏛️ Postdoctorado" },
  ];
  const areas = ["Todas", "STEM", "Artes y Humanidades", "Salud", "Negocios", "Todas las áreas"];
  // "Todas" clears the area filter; "Todas las áreas" is a value scholarships
  // actually carry, meaning the call is open to any field. Two options reading
  // "Todas las áreas" were indistinguishable, so the labels say which is which.
  const areaLabels: Record<string, string> = {
    Todas: "✨ Todas",
    "Todas las áreas": "Abierta a cualquier área",
  };
  const supportTypes = ["Todos", "Beca Completa", "Beca Parcial", "Manutención"];
  const institutionTypes = [
    "Todas",
    "Universidad Directa",
    "Gubernamental",
    "Organismo Internacional",
    "Fundación",
  ];
  const dateRanges = [
    { id: "Todas", label: "📆 Todas" },
    { id: "urgent", label: "⚡ Cierra en 30 días" },
    { id: "semester", label: "📅 Cierra en 90 días" },
    { id: "later", label: "⏳ Más de 90 días" },
  ];

  const handleSyncScholarships = async () => {
    setIsSyncingAI(true);
    setSyncFeedback(null);
    try {
      const result = await triggerScholarshipSync("2026-2027");
      if (result.success && result.data && result.data.length > 0) {
        setScholarshipsList(result.data as Scholarship[]);
        await seedScholarshipsToDB(result.data);
        setSyncFeedback(`✓ ${result.message}`);
      } else {
        // Seed current static list into DB as default if server response was empty
        await seedScholarshipsToDB(SCHOLARSHIPS_DATA);
        setSyncFeedback("✓ Base de datos Firestore sincronizada con las convocatorias oficiales.");
      }
    } catch (err: any) {
      console.error("Error en sincronización:", err);
      setSyncFeedback("Aviso: Sincronizado localmente con el catálogo oficial.");
    } finally {
      setIsSyncingAI(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const toggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const scholarship = scholarshipsList.find((s) => s.id === id);
    const title = scholarship?.title || id;
    const country = scholarship?.country || "Europa";

    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );

    if (currentUser?.id) {
      try {
        await toggleBookmarkScholarship(currentUser.id, id, title, country);
      } catch (err) {
        console.error("Error guardando favorito en Firestore:", err);
      }
    }
  };

  const clearFilters = () => {
    setSelectedCountry("Todos");
    setSelectedEducationLevel("todos");
    setSelectedArea("Todas");
    setSelectedSupportType("Todos");
    setSelectedInstitutionType("Todas");
    setSelectedDateRange("Todas");
    setSortBy("deadline-asc");
    setSearchQuery("");
    setVisibleCount(LOAD_BATCH_SIZE);
  };

  /**
   * One definition of "does this scholarship match the filters", shared by the
   * list and by the counts beside each option.
   *
   * They used to be written twice: the list filtered on every active filter
   * while the counts were computed against the whole catalogue. So "Alemania"
   * showed 1 result and "Doctorado" still advertised 4, and picking both
   * returned nothing. With 22 scholarships across 12 countries, 30 of the 48
   * country x level combinations are empty — the filters worked, and the
   * interface walked people into dead ends without warning.
   *
   * `overrides` lets a count ask "how many would there be if this one option
   * changed", which is what makes the numbers cascade.
   */
  const matchesFilters = useCallback(
    (
      item: Scholarship,
      overrides: Partial<{
        country: string;
        educationLevel: string;
        area: string;
        supportType: string;
        institutionType: string;
        dateRange: string;
      }> = {}
    ) => {
      const country = overrides.country ?? selectedCountry;
      const educationLevel = overrides.educationLevel ?? selectedEducationLevel;
      const area = overrides.area ?? selectedArea;
      const supportType = overrides.supportType ?? selectedSupportType;
      const institutionType = overrides.institutionType ?? selectedInstitutionType;
      const dateRange = overrides.dateRange ?? selectedDateRange;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.institution.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        (item.officialPortalName ?? "").toLowerCase().includes(q);

      const matchesCountry = country === "Todos" || item.country === country;
      const matchesEducation =
        educationLevel === "todos" ||
        item.educationLevel === educationLevel ||
        (educationLevel === "postgrado" && !item.educationLevel);
      const matchesArea = area === "Todas" || item.area === area || item.area === "Todas las áreas";
      const matchesSupport = supportType === "Todos" || item.supportType === supportType;
      const matchesInstType =
        institutionType === "Todas" || item.institutionType === institutionType;

      // `daysLeft` is absent from every scholarship in the dataset, so the
      // deadline is read from `deadlineDate` instead. Reading `daysLeft` made
      // "this semester" and "later" return the entire catalogue: two of the
      // three options did nothing at all.
      //
      // The `isUrgent` flag is not consulted: it is written once when a record
      // is created and never recomputed, so it says a call is closing soon long
      // after it has closed. The deadline itself is the only thing that stays
      // true, and an already-closed call is not "closing in 30 days".
      let matchesDate = true;
      if (dateRange !== "Todas") {
        const days = daysUntil(item.deadlineDate);
        if (days === null) matchesDate = false;
        else if (dateRange === "urgent") matchesDate = days >= 0 && days <= 30;
        else if (dateRange === "semester") matchesDate = days >= 0 && days <= 90;
        else if (dateRange === "later") matchesDate = days > 90;
      }

      return (
        matchesSearch &&
        matchesCountry &&
        matchesEducation &&
        matchesArea &&
        matchesSupport &&
        matchesInstType &&
        matchesDate
      );
    },
    [
      searchQuery,
      selectedCountry,
      selectedEducationLevel,
      selectedArea,
      selectedSupportType,
      selectedInstitutionType,
      selectedDateRange,
    ]
  );

  /**
   * How many results an option would give, with every other filter left as it
   * is. A zero here means the option is a dead end, and the interface says so
   * instead of letting someone walk into an empty list.
   */
  const countWith = useCallback(
    (overrides: Parameters<typeof matchesFilters>[1]) =>
      scholarshipsList.filter(
        (item) =>
          (viewModeTab !== "favorites" || favorites.includes(item.id)) &&
          matchesFilters(item, overrides)
      ).length,
    [scholarshipsList, matchesFilters, viewModeTab, favorites]
  );

  /**
   * Every filter option with the number of results it would give, with the
   * other filters left as they are. Built from `countWith`, so the numbers
   * cascade: narrowing the country immediately re-counts the levels, the
   * areas and the rest.
   */
  const countryOptions = useMemo(
    () =>
      countries.map((c) => ({
        id: c,
        label: c === "Todos" ? "🌍 Todos" : c,
        count: countWith({ country: c }),
      })),
    // `countries` is a constant list defined in this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countWith]
  );

  const educationOptions = useMemo(
    () => educationLevels.map((l) => ({ ...l, count: countWith({ educationLevel: l.id }) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countWith]
  );

  const areaOptions = useMemo(
    () => areas.map((a) => ({ id: a, label: areaLabels[a] ?? a, count: countWith({ area: a }) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countWith]
  );

  const supportOptions = useMemo(
    () =>
      supportTypes.map((t) => ({
        id: t,
        label: t === "Todos" ? "🏆 Todos" : t,
        count: countWith({ supportType: t }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countWith]
  );

  const institutionOptions = useMemo(
    () =>
      institutionTypes.map((t) => ({
        id: t,
        label: t === "Todas" ? "🏛️ Todas" : t,
        count: countWith({ institutionType: t }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countWith]
  );

  const dateOptions = useMemo(
    () => dateRanges.map((r) => ({ ...r, count: countWith({ dateRange: r.id }) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countWith]
  );

  /** Filters that are not on their default, for the "Limpiar" affordances. */
  const advancedFilterCount =
    (selectedArea !== "Todas" ? 1 : 0) +
    (selectedSupportType !== "Todos" ? 1 : 0) +
    (selectedInstitutionType !== "Todas" ? 1 : 0) +
    (selectedDateRange !== "Todas" ? 1 : 0) +
    (viewModeTab === "favorites" ? 1 : 0);

  const activeFilterCount =
    advancedFilterCount +
    (selectedCountry !== "Todos" ? 1 : 0) +
    (selectedEducationLevel !== "todos" ? 1 : 0);

  /**
   * The whole filter set, rendered identically in the desktop sidebar and the
   * mobile sheet. Both can be in the DOM at once, so each copy scopes its
   * element ids.
   */
  /**
   * The six advanced filters, in the sidebar and in the mobile sheet.
   *
   * The layout differs because the surfaces do. On the desktop sidebar there is
   * vertical room, so `wrap` shows every option at once. In the sheet `wrap`
   * turned each group into a block — the country group alone was 356px — and
   * the six of them ran to 1435px inside a 716px dialog, so reaching the last
   * filter meant scrolling past five others and the apply button went with
   * them. One swipeable row per group is also what the quick filters directly
   * above the sheet already do; the sheet was the odd one out.
   */
  const renderFilterGroups = (scope: "sidebar" | "sheet") => (
    <>
      <FilterChipGroup
        label={t("becas.countryLabel", "País Destino")}
        icon={<Globe2 className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={countryOptions}
        value={selectedCountry}
        onChange={setSelectedCountry}
        idPrefix={`${scope}-country`}
        layout={scope === "sidebar" ? "wrap" : "scroll"}
      />
      <FilterChipGroup
        label={t("becas.levelLabel", "Nivel Educativo")}
        icon={<GraduationCap className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={educationOptions}
        value={selectedEducationLevel}
        onChange={setSelectedEducationLevel}
        idPrefix={`${scope}-education`}
        layout={scope === "sidebar" ? "wrap" : "scroll"}
      />
      <FilterChipGroup
        label={t("becas.areaLabel", "Área de Estudio")}
        icon={<BookOpen className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={areaOptions}
        value={selectedArea}
        onChange={setSelectedArea}
        idPrefix={`${scope}-area`}
        layout={scope === "sidebar" ? "wrap" : "scroll"}
      />
      <FilterChipGroup
        label={t("becas.supportLabel", "Tipo de Apoyo")}
        icon={<Award className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={supportOptions}
        value={selectedSupportType}
        onChange={setSelectedSupportType}
        idPrefix={`${scope}-support`}
        layout={scope === "sidebar" ? "wrap" : "scroll"}
      />
      <FilterChipGroup
        label={t("becas.institutionLabel", "Tipo de Entidad")}
        icon={<Building2 className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={institutionOptions}
        value={selectedInstitutionType}
        onChange={setSelectedInstitutionType}
        idPrefix={`${scope}-institution`}
        layout={scope === "sidebar" ? "wrap" : "scroll"}
      />
      <FilterChipGroup
        label={t("becas.deadlineLabel", "Fecha de Cierre")}
        icon={<CalendarIcon className="w-3.5 h-3.5 text-secondary dark:text-teal-400" />}
        options={dateOptions}
        value={selectedDateRange}
        onChange={setSelectedDateRange}
        idPrefix={`${scope}-deadline`}
        layout={scope === "sidebar" ? "wrap" : "scroll"}
      />
    </>
  );

  const filteredScholarships = useMemo(() => {
    return scholarshipsList
      .filter((item) => {
        if (viewModeTab === "favorites" && !favorites.includes(item.id)) return false;
        return matchesFilters(item);
      })
      .sort((a, b) => {
        if (sortBy === "deadline-asc") {
          return a.deadlineDate.localeCompare(b.deadlineDate);
        }
        if (sortBy === "deadline-desc") {
          return b.deadlineDate.localeCompare(a.deadlineDate);
        }
        if (sortBy === "support-first") {
          const supportOrder = { "Beca Completa": 3, Manutención: 2, "Beca Parcial": 1 };
          const orderA = supportOrder[a.supportType] || 0;
          const orderB = supportOrder[b.supportType] || 0;
          return orderB - orderA;
        }
        return a.title.localeCompare(b.title);
      });
    // `matchesFilters` already closes over every filter, so listing them here
    // as well only risks the two lists drifting apart.
  }, [scholarshipsList, viewModeTab, favorites, matchesFilters, sortBy]);

  // Start from the top of the catalogue whenever the filters change: what was
  // loaded before the change says nothing about what matches after it.
  useEffect(() => {
    setVisibleCount(LOAD_BATCH_SIZE);
  }, [
    viewModeTab,
    searchQuery,
    selectedCountry,
    selectedEducationLevel,
    selectedArea,
    selectedSupportType,
    selectedInstitutionType,
    selectedDateRange,
    sortBy,
  ]);

  const displayedScholarships = useMemo(
    () => filteredScholarships.slice(0, visibleCount),
    [filteredScholarships, visibleCount]
  );

  /** How many the next tap would add — the button says so rather than guessing. */
  const nextBatchSize = Math.min(
    LOAD_BATCH_SIZE,
    filteredScholarships.length - displayedScholarships.length
  );

  // An empty catalogue is fully loaded, not 0% loaded: dividing by zero here
  // put NaN in the progress readout and in the bar's width.
  const loadedPercentage =
    filteredScholarships.length === 0
      ? 100
      : Math.round((displayedScholarships.length / filteredScholarships.length) * 100);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_BATCH_SIZE, filteredScholarships.length));
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestSuccess(true);
    setTimeout(() => {
      setSuggestSuccess(false);
      setShowSuggestModal(false);
      setSuggestForm({
        university: "",
        country: "España",
        scholarshipName: "",
        officialUrl: "",
        notes: "",
      });
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs activeTab="becas" setActiveTab={setActiveTab} />

      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {t("becas.eyebrow", "Convocatorias y Portales Oficiales Verificados 2026-2027")}
            </span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary dark:text-sky-300">
            {t("becas.title", "Directorio Oficial de Becas")}
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-sm md:text-base mt-1">
            {t(
              "becas.subtitle",
              "Encuentra becas directas de universidades internacionales, convenios gubernamentales y organismos iberoamericanos."
            )}
          </p>
        </div>

        {/* Suggest & Search Header Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin-only Database Dynamic Sync Button */}
          {isAdmin(currentUser) && (
            <button
              type="button"
              onClick={handleSyncScholarships}
              disabled={isSyncingAI}
              id="sync-scholarships-btn"
              title="Sincronizar convocatorias oficiales con IA"
              className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncingAI ? "animate-spin text-emerald-600" : "text-emerald-500"}`}
              />
              <span>{isSyncingAI ? "Sincronizando IA..." : "Sincronizar DB Anual"}</span>
            </button>
          )}

          <button
            onClick={() => setShowSuggestModal(true)}
            id="suggest-scholarship-btn"
            className="inline-flex items-center gap-2 bg-secondary/10 dark:bg-teal-500/20 text-secondary dark:text-teal-300 hover:bg-secondary hover:text-white dark:hover:bg-teal-600 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-secondary/30 dark:border-teal-500/30 transition-colors shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("becas.suggest", "Sugerir Beca Oficial")}</span>
          </button>

          {!showingStudies && (
            <div className="relative flex-1 min-w-[200px] md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, país, área o universidad..."
                id="becas-search-input"
                aria-label="Buscar convocatorias"
                className="pl-9"
              />
            </div>
          )}

          {!showingStudies && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
                {t("becas.sortBy", "Ordenar por:")}
              </span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger
                  id="becas-sort-select"
                  aria-label="Ordenar convocatorias"
                  className="w-auto min-w-[13rem]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout (Sidebar + Grid) */}
      <Tabs value={viewModeTab} onValueChange={handleViewModeChange} className="space-y-6">
        {syncFeedback && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs: Todas vs Mis Favoritas - Responsive and flex-wrap for mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 dark:border-slate-800 pb-4">
          <TabsList>
            <TabsTrigger
              value="all"
              id="tab-all-scholarships"
              className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:bg-sky-600"
            >
              <Globe2 className="w-4 h-4" />
              <span>{t("becas.tabAll", "Todas las Convocatorias")}</span>
              <Badge
                variant={viewModeTab === "all" ? "count" : "neutral"}
                size="sm"
                className="ml-1"
              >
                {scholarshipsList.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="estudios"
              id="tab-estudios"
              className="data-[state=active]:bg-secondary data-[state=active]:text-white dark:data-[state=active]:bg-teal-600"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t("becas.tabStudies", "Cursos, Certificados y FP")}</span>
              <Badge
                variant={viewModeTab === "estudios" ? "count" : "neutral"}
                size="sm"
                className="ml-1"
              >
                {studyProgrammeCount}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="favorites"
              id="tab-favorite-scholarships"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              <Heart
                className={`w-4 h-4 ${viewModeTab === "favorites" ? "fill-white" : "text-red-500"}`}
              />
              <span>{t("becas.tabFavorites", "Mis Becas Favoritas")}</span>
              <Badge
                variant={viewModeTab === "favorites" ? "count" : "neutral"}
                size="sm"
                className={`ml-1 ${
                  viewModeTab === "favorites"
                    ? ""
                    : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                }`}
              >
                {favorites.length}
              </Badge>
            </TabsTrigger>

            {userProfileFilters && (
              <TabsTrigger
                value="profile"
                id="tab-profile-scholarships"
                className="data-[state=active]:bg-secondary data-[state=active]:text-white dark:data-[state=active]:bg-teal-600"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>🎯 Para mi Perfil</span>
                {userProfileFilters.destinationCountry && (
                  <Badge variant="neutral" size="sm">
                    {userProfileFilters.destinationCountry}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {viewModeTab === "favorites" && favorites.length > 0 && (
            <button
              type="button"
              onClick={() => setFavorites([])}
              id="clear-all-favorites-btn"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Vaciar mis favoritas</span>
            </button>
          )}
        </div>

        {/* Favorites Header Banner when tab is active */}
        {viewModeTab === "favorites" && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
              <div className="p-3 bg-red-500 text-white rounded-xl shadow-xs shrink-0">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900 dark:text-red-200">
                  Sección: Mis Becas Guardadas ({favorites.length})
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                  Tus becas de interés están sincronizadas para que puedas consultarlas, agendarlas
                  y comparar requisitos en cualquier momento.
                </p>
              </div>
            </div>
            {favorites.length > 0 && (
              <button
                type="button"
                onClick={() => setViewModeTab("all")}
                className="text-xs font-bold text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 px-4 py-2 rounded-xl hover:bg-red-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap self-start md:self-auto"
              >
                + Explorar más becas
              </button>
            )}
          </div>
        )}

        {/* Profile Filter Banner when active */}
        {viewModeTab === "profile" && userProfileFilters && (
          <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start md:items-center gap-3">
              <div className="p-3 bg-secondary text-white rounded-xl shadow-xs shrink-0">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-teal-950 dark:text-teal-200">
                  Filtro Inteligente según tu Perfil
                </h3>
                <p className="text-xs text-teal-800 dark:text-teal-300 mt-0.5">
                  Mostrando automáticamente las convocatorias adaptadas a tu destino (
                  {userProfileFilters.destinationCountry || "General"}) y área preferida (
                  {userProfileFilters.preferredArea || "Todas las áreas"}).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setViewModeTab("all");
              }}
              className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 px-4 py-2 rounded-xl hover:bg-teal-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap self-start md:self-auto"
            >
              Ver todas las becas
            </button>
          </div>
        )}

        {/* Mobile quick filters. Country comes before education level: the
            destination is the decision people arrive with, and fixing it first
            is what makes the level counts mean anything. */}
        {!showingStudies && (
          <div className="lg:hidden bg-surface-container-lowest dark:bg-slate-800 p-3.5 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-primary dark:text-sky-300">
                <SlidersHorizontal className="w-4 h-4 text-secondary dark:text-teal-400" />
                <span>{t("becas.quickFilters", "Filtros Rápidos")}</span>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-secondary dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  id="btn-open-mobile-filters"
                  className="inline-flex items-center gap-1.5 min-h-[44px] bg-primary dark:bg-sky-600 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{t("becas.moreFilters", "Más Filtros")}</span>
                  {advancedFilterCount > 0 && (
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {advancedFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <FilterChipGroup
              label={t("becas.countryLabel", "País Destino")}
              icon={<Globe2 className="w-4 h-4 text-secondary dark:text-teal-400" />}
              options={countryOptions}
              value={selectedCountry}
              onChange={setSelectedCountry}
              idPrefix="country-chip"
              onClear={selectedCountry !== "Todos" ? () => setSelectedCountry("Todos") : undefined}
            />

            <FilterChipGroup
              label={t("becas.levelLabel", "Nivel Educativo")}
              icon={<GraduationCap className="w-4 h-4 text-secondary dark:text-teal-400" />}
              options={educationOptions}
              value={selectedEducationLevel}
              onChange={setSelectedEducationLevel}
              idPrefix="edu-level-chip"
              onClear={
                selectedEducationLevel !== "todos"
                  ? () => setSelectedEducationLevel("todos")
                  : undefined
              }
            />
          </div>
        )}

        {/* Mobile Filters Slide-over / Bottom Sheet Modal */}
        {mobileFiltersOpen && (
          <Modal
            open={mobileFiltersOpen}
            onOpenChange={setMobileFiltersOpen}
            title={t("becas.searchFilters", "Filtros de Búsqueda")}
            size="md"
            id="mobile-filters-sheet"
            header={
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-base text-primary dark:text-sky-300">
                  <Filter className="w-5 h-5 shrink-0 text-secondary dark:text-teal-400" />
                  <span className="truncate">
                    {t("becas.searchFilters", "Filtros de Búsqueda")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 text-xs font-semibold text-secondary dark:text-teal-400 hover:underline px-2 py-1 active:scale-95"
                >
                  {t("becas.clearAll", "Limpiar todo")}
                </button>
              </div>
            }
          >
            {/* Mobile Filter Controls */}
            <div className="space-y-4">
              {/* Favoritas Toggle */}
              <div className="p-3 bg-surface dark:bg-slate-800/80 rounded-xl border border-outline-variant/40 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart
                    className={`w-4 h-4 ${viewModeTab === "favorites" ? "fill-red-500 text-red-500" : "text-on-surface-variant"}`}
                  />
                  <span className="text-xs font-bold text-on-surface dark:text-slate-200">
                    {t("becas.onlyFavorites", "Ver solo mis favoritas")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewModeTab(viewModeTab === "favorites" ? "all" : "favorites")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    viewModeTab === "favorites"
                      ? "bg-red-500 text-white shadow-xs"
                      : "bg-surface-container dark:bg-slate-700 text-on-surface-variant dark:text-slate-300"
                  }`}
                >
                  {viewModeTab === "favorites" ? "Activado" : "Desactivado"} ({favorites.length})
                </button>
              </div>

              {renderFilterGroups("sheet")}
            </div>

            {/* Bottom Apply Action */}
            <div className="pt-3 border-t border-outline-variant/30 dark:border-slate-800 sticky bottom-0 bg-surface-container-lowest dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setMobileFiltersOpen(false);
                  if (mainListRef.current) {
                    mainListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="w-full py-3.5 bg-primary dark:bg-sky-600 hover:bg-primary-container text-white font-bold text-sm rounded-xl shadow-md cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ver {filteredScholarships.length} Convocatorias</span>
              </button>
            </div>
          </Modal>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Filters (Desktop Only: hidden on mobile to avoid 500px dead scroll) */}
          {!showingStudies && (
            <aside className="hidden lg:block lg:col-span-3 bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-6 sticky top-24">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-primary dark:text-sky-300">
                  <Filter className="w-5 h-5 text-secondary dark:text-teal-400" />
                  <span>{t("becas.advancedFilters", "Filtros Avanzados")}</span>
                </div>
                <button
                  onClick={clearFilters}
                  id="clear-filters-btn"
                  className="text-xs font-semibold text-secondary dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              </div>

              {/* Quick Filter for Favorites inside sidebar */}
              <div className="p-3 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/40 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider block">
                  {t("becas.quickView", "Vista Rápida")}
                </label>
                <button
                  type="button"
                  onClick={() => setViewModeTab(viewModeTab === "favorites" ? "all" : "favorites")}
                  id="sidebar-favorites-toggle"
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                    viewModeTab === "favorites"
                      ? "bg-red-500 text-white shadow-xs"
                      : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart
                      className={`w-3.5 h-3.5 ${viewModeTab === "favorites" ? "fill-white" : "fill-red-500"}`}
                    />
                    <span>{t("becas.onlyMine", "Solo mis favoritas")}</span>
                  </div>
                  <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full font-mono">
                    {favorites.length}
                  </span>
                </button>
              </div>

              {renderFilterGroups("sidebar")}
            </aside>
          )}

          {/* Scholarships Grid & Pagination Container */}
          {/* The panel sits inside <main> rather than replacing it: Radix puts
              `role="tabpanel"` on whatever element it renders, and putting that
              on <main> would strip the page of its only main landmark. */}
          <main
            ref={mainListRef}
            id="scholarships-main-section"
            className={showingStudies ? "lg:col-span-12" : "lg:col-span-9"}
            aria-busy={!showingStudies && catalogueStatus === "loading"}
          >
            <TabsContent value={viewModeTab} className="space-y-6">
              {showingStudies ? (
                <EstudiosSection
                  scholarships={scholarshipsList}
                  onOpenScholarship={(scholarship) => setSelectedScholarship(scholarship)}
                />
              ) : (
                <>
                  {/* Where the list on screen came from. The bundled dataset renders
                immediately, so without this the live catalogue arrives and
                silently swaps the cards, and a failed load looks identical to a
                successful one. */}
                  <div role="status" aria-live="polite" className="min-h-[1.5rem]">
                    {catalogueStatus === "loading" && (
                      <p
                        id="catalogue-loading-status"
                        className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400"
                      >
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        {t("becas.updating", "Actualizando convocatorias…")}
                      </p>
                    )}
                    {catalogueStatus === "bundled" && (
                      <p
                        id="catalogue-bundled-status"
                        className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {t(
                          "becas.bundledNotice",
                          "No pudimos cargar las convocatorias más recientes. Estás viendo la lista incluida en la aplicación, que puede estar desactualizada."
                        )}
                      </p>
                    )}
                  </div>

                  {/* List Toolbar: how much of the catalogue is on screen. */}
                  <div className="bg-surface-container-lowest dark:bg-slate-800 p-4 rounded-2xl border border-outline-variant/40 dark:border-slate-700 flex flex-wrap items-center gap-3">
                    <span className="text-xs md:text-sm text-on-surface-variant dark:text-slate-300">
                      {filteredScholarships.length === 0 ? (
                        "0 convocatorias encontradas"
                      ) : (
                        <>
                          Mostrando <strong>{displayedScholarships.length}</strong> de{" "}
                          <strong>{filteredScholarships.length}</strong> convocatorias
                        </>
                      )}
                    </span>
                    {favorites.length > 0 && (
                      <span className="text-secondary dark:text-teal-300 font-semibold bg-secondary/10 dark:bg-teal-900/30 px-2 py-0.5 rounded-full text-xs">
                        ♥ {favorites.length} guardadas
                      </span>
                    )}
                  </div>

                  {filteredScholarships.length === 0 ? (
                    <div className="bg-surface-container-lowest dark:bg-slate-800 rounded-2xl p-12 text-center space-y-4 border border-outline-variant/40 dark:border-slate-700">
                      {viewModeTab === "favorites" ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center mx-auto text-red-500">
                            <Heart className="w-8 h-8" />
                          </div>
                          <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                            {t("becas.emptyFavoritesTitle", "Aún no tienes becas en favoritos")}
                          </h3>
                          <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-md mx-auto">
                            {t(
                              "becas.emptyFavoritesBody",
                              "Haz clic en el icono de corazón (♥) en cualquier convocatoria para guardarla y acceder a ella rápidamente aquí."
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => setViewModeTab("all")}
                            id="empty-fav-explore-btn"
                            className="bg-primary dark:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-container"
                          >
                            {t("becas.seeAllCalls", "Ver Todas las Convocatorias")}
                          </button>
                        </>
                      ) : (
                        <>
                          <Search className="w-12 h-12 text-on-surface-variant mx-auto opacity-50" />
                          <h3 className="font-headline-sm text-lg font-bold text-primary dark:text-sky-300">
                            {t(
                              "becas.emptyFilteredTitle",
                              "No encontramos becas con los filtros seleccionados"
                            )}
                          </h3>
                          <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-md mx-auto">
                            {t(
                              "becas.emptyFilteredBody",
                              "Prueba ajustando los términos de búsqueda, o limpia los filtros para ver el catálogo completo."
                            )}
                          </p>
                          <button
                            onClick={clearFilters}
                            className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary-container"
                          >
                            {t("becas.clearFilters", "Limpiar Filtros")}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {displayedScholarships.map((beca) => {
                          const isFav = favorites.includes(beca.id);
                          return (
                            <Card key={beca.id} className="hover:shadow-xl transition-all group">
                              <div>
                                <CardHeader className="h-44 overflow-hidden">
                                  <ImageWithFallback
                                    id={`beca-image-${beca.id}`}
                                    src={beca.imageUrl}
                                    alt={beca.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                  {/* Top Badges */}
                                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold">
                                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                                      <span>{beca.country}</span>
                                    </div>

                                    <button
                                      onClick={(e) => toggleFavorite(beca.id, e)}
                                      className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                                        isFav
                                          ? "bg-red-500 text-white"
                                          : "bg-black/40 text-white hover:bg-black/60"
                                      }`}
                                      title={isFav ? "Quitar de favoritos" : "Guardar beca"}
                                    >
                                      <Heart className={`w-4 h-4 ${isFav ? "fill-white" : ""}`} />
                                    </button>
                                  </div>

                                  {/* Deadline Alert Banner */}
                                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-amber-500/90 text-amber-950 font-bold px-3 py-1 rounded-lg text-xs backdrop-blur-xs">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{beca.deadline}</span>
                                  </div>

                                  {/* Verified Portal Indicator */}
                                  {beca.officialPortalName && (
                                    <Badge
                                      variant="official"
                                      size="sm"
                                      className="absolute bottom-3 right-3 rounded backdrop-blur-xs"
                                    >
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                      <span>{t("becas.official", "Oficial")}</span>
                                    </Badge>
                                  )}
                                </CardHeader>

                                <CardContent>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {beca.educationLevel && (
                                      <Badge variant="level" className="capitalize">
                                        {EDUCATION_LEVEL_LABELS[beca.educationLevel] ??
                                          beca.educationLevel}
                                      </Badge>
                                    )}
                                    <Badge variant="support">{beca.supportType}</Badge>
                                    {beca.institutionType && (
                                      <Badge variant="institution">{beca.institutionType}</Badge>
                                    )}
                                    <span className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">
                                      • {beca.area}
                                    </span>
                                  </div>

                                  <CardTitle className="group-hover:text-secondary transition-colors">
                                    {beca.title}
                                  </CardTitle>

                                  <p className="text-xs font-semibold text-on-surface-variant dark:text-slate-300 line-clamp-1">
                                    {beca.institution}
                                  </p>

                                  <p className="text-sm text-on-surface-variant dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {beca.description}
                                  </p>
                                </CardContent>
                              </div>

                              <CardFooter>
                                <Button
                                  variant="soft"
                                  size="sm"
                                  onClick={() => setSelectedScholarship(beca)}
                                  className="flex-1"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>{t("becas.viewDetails", "Ver Detalles")}</span>
                                </Button>

                                <Button variant="success" size="sm" asChild>
                                  <a
                                    href={generateGoogleCalendarUrl({
                                      title: `Límite Postulación Beca: ${beca.title}`,
                                      details: `Fecha límite de la convocatoria para ${beca.title} de ${beca.institution}. Enlace oficial: ${beca.link}`,
                                      startDate: beca.deadlineDate,
                                      location: beca.country,
                                    })}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Añadir fecha límite a Google Calendar"
                                  >
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Calendar</span>
                                  </a>
                                </Button>
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>

                      {/*
                    One way to page through the list, not two.

                    The screen used to carry a numbered pager and a "load more"
                    button behind a mode switch, plus a page-size selector — three
                    controls doing one job, and on a phone the numbered pager was
                    a row of tap targets nobody asked for. Lazy loading is what a
                    catalogue on a phone wants: keep reading, or stop.
                  */}
                      <div className="pt-2">
                        <div className="bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-2xl border border-outline-variant/40 dark:border-slate-700 text-center space-y-4">
                          {/* Progress Bar */}
                          <div className="max-w-md mx-auto space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-on-surface-variant dark:text-slate-400 font-medium">
                              <span id="load-progress-label">
                                {t("becas.loadProgress", "Progreso de carga")}
                              </span>
                              <span>
                                {displayedScholarships.length} de {filteredScholarships.length} (
                                {loadedPercentage}%)
                              </span>
                            </div>
                            <div
                              role="progressbar"
                              aria-labelledby="load-progress-label"
                              aria-valuemin={0}
                              aria-valuemax={filteredScholarships.length}
                              aria-valuenow={displayedScholarships.length}
                              className="w-full bg-surface-container dark:bg-slate-700 h-2 rounded-full overflow-hidden"
                            >
                              <div
                                className="bg-secondary dark:bg-teal-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${loadedPercentage}%` }}
                              />
                            </div>
                          </div>

                          {displayedScholarships.length < filteredScholarships.length ? (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={handleLoadMore}
                                id="btn-load-more-scholarships"
                                className="btn-tactile inline-flex items-center gap-2 bg-secondary dark:bg-teal-600 hover:bg-secondary/90 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                              >
                                <ArrowDownCircle className="w-4 h-4" aria-hidden="true" />
                                <span>
                                  {t("becas.loadMore", "Cargar Más Convocatorias")} (+
                                  {nextBatchSize})
                                </span>
                              </button>
                              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                                Quedan {filteredScholarships.length - displayedScholarships.length}{" "}
                                {t("becas.remaining", "becas por mostrar")}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                                <span>
                                  {t("becas.reachedEnd", "Has llegado al final de las")}{" "}
                                  {filteredScholarships.length} {t("becas.calls", "convocatorias")}
                                </span>
                              </p>
                              <button
                                type="button"
                                id="btn-back-to-list-top"
                                onClick={() => {
                                  if (mainListRef.current) {
                                    mainListRef.current.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    });
                                  }
                                }}
                                className="btn-tactile text-xs font-semibold text-secondary dark:text-teal-300 hover:underline inline-block py-1 px-2"
                              >
                                {t("becas.backToTop", "Volver arriba del listado ↑")}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </main>
        </div>
      </Tabs>

      {/* Suggest Official Scholarship Modal */}
      {showSuggestModal && (
        <Modal
          open={showSuggestModal}
          onOpenChange={(next) => {
            if (!next) setShowSuggestModal(false);
          }}
          title="Sugerir una convocatoria oficial"
          size="md"
          id="suggest-scholarship-modal"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verificación de Fuentes Oficiales</span>
            </div>
            <h2 className="font-headline-md text-2xl font-extrabold text-primary dark:text-sky-300">
              Sugerir Beca Universitaria
            </h2>
            <p className="text-xs text-on-surface-variant dark:text-slate-300">
              Agrega becas y ayudas publicadas directamente en portales universitarios (.edu, .es,
              .de, etc.) para que nuestro equipo y la IA las verifiquen e incorporen al directorio.
            </p>
          </div>

          {suggestSuccess ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-sm">¡Beca enviada para verificación!</h4>
              <p className="text-xs">
                Revisaremos el enlace institucional para integrarla al catálogo oficial de
                LatinoMigra.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSuggestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                  Universidad o Institución *
                </label>
                <input
                  type="text"
                  required
                  value={suggestForm.university}
                  onChange={(e) => setSuggestForm({ ...suggestForm, university: e.target.value })}
                  placeholder="Ej. Universidad Autónoma de Madrid, Sorbonne..."
                  className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                    País Destino *
                  </label>
                  <select
                    value={suggestForm.country}
                    onChange={(e) => setSuggestForm({ ...suggestForm, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                  >
                    {countries
                      .filter((c) => c !== "Todos")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                    Nombre de la Beca *
                  </label>
                  <input
                    type="text"
                    required
                    value={suggestForm.scholarshipName}
                    onChange={(e) =>
                      setSuggestForm({ ...suggestForm, scholarshipName: e.target.value })
                    }
                    placeholder="Ej. Ayuda de Matrícula Máster..."
                    className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                  Enlace de la Página Oficial (.edu, .es, .org, .de, .ca) *
                </label>
                <input
                  type="url"
                  required
                  value={suggestForm.officialUrl}
                  onChange={(e) => setSuggestForm({ ...suggestForm, officialUrl: e.target.value })}
                  placeholder="https://www.universidad.es/becas/internacional..."
                  className="w-full px-3.5 py-2.5 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                  Notas o Requisitos Relevantes
                </label>
                <textarea
                  rows={2}
                  value={suggestForm.notes}
                  onChange={(e) => setSuggestForm({ ...suggestForm, notes: e.target.value })}
                  placeholder="Fechas de cierre, si cubre manutención o exención..."
                  className="w-full px-3.5 py-2 bg-surface dark:bg-slate-900 rounded-xl border border-outline-variant/60 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="btn-tactile px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-sky-600 hover:bg-primary-container text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Convocatoria</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Scholarship Details Modal */}
      {selectedScholarship && (
        <Modal
          open={selectedScholarship !== null}
          onOpenChange={(next) => {
            if (!next) setSelectedScholarship(null);
          }}
          title={selectedScholarship?.title ?? "Detalle de la convocatoria"}
          size="lg"
          id="scholarship-detail-modal"
        >
          <div className="space-y-2 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-secondary-container/40 dark:bg-teal-500/20 text-secondary dark:text-teal-300 text-xs px-3 py-1 rounded-full font-bold">
                {selectedScholarship.supportType}
              </span>
              <span className="bg-primary/10 dark:bg-sky-900/40 text-primary dark:text-sky-300 text-xs px-3 py-1 rounded-full font-bold">
                {selectedScholarship.country}
              </span>
              {selectedScholarship.institutionType && (
                <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {selectedScholarship.institutionType}
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleFavorite(selectedScholarship.id)}
                id="modal-toggle-favorite-btn"
                className={`btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ml-auto shadow-xs ${
                  favorites.includes(selectedScholarship.id)
                    ? "bg-red-500 text-white"
                    : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-300 dark:border-red-800"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${favorites.includes(selectedScholarship.id) ? "fill-white" : ""}`}
                />
                <span>
                  {favorites.includes(selectedScholarship.id) ? "Guardada" : "Guardar Beca"}
                </span>
              </button>
            </div>

            <h2 className="font-headline-md text-2xl font-extrabold text-primary dark:text-sky-300">
              {selectedScholarship.title}
            </h2>
            <p className="text-sm font-semibold text-on-surface-variant dark:text-slate-300">
              {selectedScholarship.institution}
            </p>
            {selectedScholarship.officialPortalName && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Portal Oficial Verificado: {selectedScholarship.officialPortalName}</span>
                </p>
              </div>
            )}
          </div>

          <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed">
            {selectedScholarship.description}
          </p>

          {/* Requisitos and beneficios collapse on a phone: together they are
              the bulk of the panel, and they arrived as one wall of text. */}
          <Disclosure
            id="beca-requisitos"
            label={t("becas.showRequirements", "Ver requisitos principales")}
            labelWhenOpen={t("becas.hideRequirements", "Ocultar requisitos")}
          >
            <div className="space-y-3 bg-surface dark:bg-slate-900 p-4 rounded-2xl border border-outline-variant/30 dark:border-slate-800">
              <h4 className="font-bold text-sm text-primary dark:text-sky-300 uppercase tracking-wider">
                {t("becas.requirements", "Requisitos Principales")}
              </h4>
              <ul className="space-y-2">
                {selectedScholarship.requirements.map((req, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-on-surface-variant dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Disclosure>

          <Disclosure
            id="beca-beneficios"
            label={t("becas.showBenefits", "Ver beneficios incluidos")}
            labelWhenOpen={t("becas.hideBenefits", "Ocultar beneficios")}
          >
            <div className="space-y-3 bg-surface dark:bg-slate-900 p-4 rounded-2xl border border-outline-variant/30 dark:border-slate-800">
              <h4 className="font-bold text-sm text-primary dark:text-sky-300 uppercase tracking-wider">
                {t("becas.benefits", "Beneficios Incluidos")}
              </h4>
              <ul className="space-y-2">
                {selectedScholarship.benefits.map((ben, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-on-surface-variant dark:text-slate-300"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{ben}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Disclosure>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-4 border-t border-outline-variant/30 dark:border-slate-700">
            <a
              id="beca-official-link"
              href={selectedScholarship.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary dark:bg-sky-600 px-4 text-xs font-bold text-white transition-all hover:bg-primary-container"
            >
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("becas.officialCall", "Convocatoria oficial")}</span>
            </a>

            <a
              id="beca-calendar-reminder"
              href={generateGoogleCalendarUrl({
                // Says what it is. "Agendar" read as booking an appointment
                // with somebody; nothing is booked with anyone — this puts a
                // reminder in the reader's own calendar.
                title: `Recordatorio: cierra la beca ${selectedScholarship.title}`,
                details: `Último día para enviar tu expediente a ${selectedScholarship.title}.\n\nRequisitos: ${selectedScholarship.requirements.join(", ")}\n\nConvocatoria oficial: ${selectedScholarship.link}`,
                startDate: selectedScholarship.deadlineDate,
                location: selectedScholarship.country,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition-all hover:bg-emerald-700"
            >
              <CalendarIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("becas.remindMe", "Recordarme la fecha límite")}</span>
            </a>

            {SHOW_ASK_AI_ABOUT_SCHOLARSHIP && (
              <button
                type="button"
                id="beca-ask-ai"
                onClick={() => {
                  const scholarshipToAsk = selectedScholarship;
                  setSelectedScholarship(null);
                  onAskAIAboutScholarship(scholarshipToAsk);
                }}
                className="btn-tactile inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-secondary dark:bg-teal-600 px-4 text-xs font-bold text-white transition-all hover:bg-secondary-container"
              >
                <Bot className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Consultar IA</span>
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
