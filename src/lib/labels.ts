import { useLanguage } from "./i18n";

/**
 * Human labels for the values the catalogues store.
 *
 * A filter's value is data: `item.country === "España"` is how the list is
 * narrowed, so the value cannot be translated. Only what the reader sees can
 * be. Those two were the same string everywhere, which is why an English
 * interface still offered "Cursos", "En línea" and "Requisito de un visado".
 *
 * One definition, used by every screen that shows these values — the filter
 * chips, the card badges and the detail panels all read from here, so a label
 * cannot say one thing in the sidebar and another on the card.
 */

/** `value` → translation key, per dimension. */
const KEYS: Record<string, Record<string, string>> = {
  country: {
    Todos: "label.country.all",
    España: "label.country.es",
    Portugal: "label.country.pt",
    Alemania: "label.country.de",
    Francia: "label.country.fr",
    Italia: "label.country.it",
    "Países Bajos": "label.country.nl",
    Suiza: "label.country.ch",
    Suecia: "label.country.se",
    "Reino Unido": "label.country.uk",
    "Estados Unidos": "label.country.us",
    Canadá: "label.country.ca",
    Australia: "label.country.au",
    Irlanda: "label.country.ie",
    "Unión Europea": "label.country.eu",
  },
  area: {
    Todas: "label.area.all",
    STEM: "label.area.stem",
    "Artes y Humanidades": "label.area.arts",
    Salud: "label.area.health",
    Negocios: "label.area.business",
    "Todas las áreas": "label.area.any",
  },
  supportType: {
    Todos: "label.support.all",
    "Beca Completa": "label.support.full",
    "Beca Parcial": "label.support.partial",
    Manutención: "label.support.stipend",
  },
  institutionType: {
    Todas: "label.institution.all",
    "Universidad Directa": "label.institution.university",
    Gubernamental: "label.institution.government",
    "Organismo Internacional": "label.institution.international",
    Fundación: "label.institution.foundation",
  },
  educationLevel: {
    todos: "label.level.all",
    pregrado: "label.level.undergraduate",
    postgrado: "label.level.postgraduate",
    doctorado: "label.level.doctorate",
    postdoctorado: "label.level.postdoctorate",
  },
  dateRange: {
    Todas: "label.deadline.all",
    urgent: "label.deadline.30",
    semester: "label.deadline.90",
    later: "label.deadline.later",
  },
  sort: {
    "deadline-asc": "label.sort.deadlineAsc",
    "deadline-desc": "label.sort.deadlineDesc",
    "support-first": "label.sort.supportFirst",
    "title-asc": "label.sort.titleAsc",
  },
  /** Plural, for the filter chips. */
  programmeKind: {
    curso: "label.kind.course",
    certificado: "label.kind.certificate",
    fp: "label.kind.vet",
  },
  /** Singular, for the badge on a card. */
  programmeKindBadge: {
    curso: "label.kindBadge.course",
    certificado: "label.kindBadge.certificate",
    fp: "label.kindBadge.vet",
  },
  modality: {
    Todas: "label.modality.all",
    "En línea": "label.modality.online",
    Mixta: "label.modality.blended",
    Presencial: "label.modality.inPerson",
  },
  migrationRoute: {
    directa: "label.route.direct",
    requisito: "label.route.requirement",
    ninguna: "label.route.none",
    "sin-verificar": "label.route.unverified",
  },
  migrationRouteBadge: {
    directa: "label.routeBadge.direct",
    requisito: "label.routeBadge.requirement",
    ninguna: "label.routeBadge.none",
  },
};

export type LabelDimension = keyof typeof KEYS;

/**
 * Resolves a stored value to the reader's language.
 *
 * A value with no key falls back to the value itself rather than to a bare
 * key, so a catalogue entry with a new country still reads as that country.
 */
export const useLabels = () => {
  const { t } = useLanguage();

  return (dimension: LabelDimension, value: string): string => {
    const key = KEYS[dimension]?.[value];
    return key ? t(key, value) : value;
  };
};

/** The keys this module expects, for the test that guards the dictionary. */
export const LABEL_KEYS = Object.values(KEYS).flatMap((group) => Object.values(group));
