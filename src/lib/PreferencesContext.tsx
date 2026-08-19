import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { LATIN_AMERICAN_COUNTRIES, DESTINATION_COUNTRIES } from "../data/countriesData";
import { getPreferences, setPreference, subscribeToPreferences } from "./preferencesStore";

/**
 * Single source of truth for the two country choices the whole app reasons
 * about: where the user is coming from, and where they want to go.
 *
 * Every screen used to keep its own copy, so picking "Alemania" in the
 * planner left the scholarship filter, the consular map and the alerts modal
 * showing something else. Reading and writing through this context keeps them
 * in step.
 *
 * Choices persist through `preferencesStore`: Firestore for a signed-in user,
 * the `lm_prefs` cookie for an anonymous visitor. Never localStorage or
 * sessionStorage.
 */

/** Sentinel used by screens whose selects offer an "all countries" option. */
export const ANY_COUNTRY = "";

const nameByCode = new Map<string, string>();
const codeByName = new Map<string, string>();

for (const c of [...LATIN_AMERICAN_COUNTRIES, ...DESTINATION_COUNTRIES]) {
  nameByCode.set(c.code, c.name);
  codeByName.set(c.name.toLowerCase(), c.code);
}

export const countryNameFromCode = (code: string): string => nameByCode.get(code) || "";

export const countryCodeFromName = (name: string): string =>
  codeByName.get((name || "").toLowerCase()) || "";

interface PreferencesContextType {
  /** Display name of the user's country of origin, or ANY_COUNTRY. */
  originCountry: string;
  setOriginCountry: (country: string) => void;
  /** Display name of the destination country, or ANY_COUNTRY. */
  destinationCountry: string;
  setDestinationCountry: (country: string) => void;
  /** ISO-ish code for the destination ("ES", "DE", …), or "". */
  destinationCountryCode: string;
  /** Set the destination from a guide/dataset code rather than a name. */
  setDestinationCountryByCode: (code: string) => void;
}

const defaultValue: PreferencesContextType = {
  originCountry: ANY_COUNTRY,
  setOriginCountry: () => {},
  destinationCountry: ANY_COUNTRY,
  setDestinationCountry: () => {},
  destinationCountryCode: "",
  setDestinationCountryByCode: () => {},
};

const PreferencesContext = createContext<PreferencesContextType>(defaultValue);

interface PreferencesProviderProps {
  children: React.ReactNode;
  initialOriginCountry?: string;
  initialDestinationCountry?: string;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({
  children,
  initialOriginCountry = ANY_COUNTRY,
  // Starts empty on purpose: an empty value means "the user has not chosen
  // yet", so each screen falls back to its own sensible default instead of the
  // catalogue silently opening pre-filtered to a single country.
  initialDestinationCountry = ANY_COUNTRY,
}) => {
  const [originCountry, setOriginCountryState] = useState<string>(
    () => getPreferences().originCountry ?? initialOriginCountry
  );
  const [destinationCountry, setDestinationCountryState] = useState<string>(
    () => getPreferences().destinationCountry ?? initialDestinationCountry
  );

  useEffect(
    () =>
      subscribeToPreferences((prefs) => {
        setOriginCountryState(prefs.originCountry ?? initialOriginCountry);
        setDestinationCountryState(prefs.destinationCountry ?? initialDestinationCountry);
      }),
    [initialOriginCountry, initialDestinationCountry]
  );

  const setOriginCountry = (country: string) => {
    setOriginCountryState(country);
    setPreference("originCountry", country);
  };

  const setDestinationCountry = (country: string) => {
    setDestinationCountryState(country);
    setPreference("destinationCountry", country);
  };

  const value = useMemo<PreferencesContextType>(
    () => ({
      originCountry,
      setOriginCountry,
      destinationCountry,
      setDestinationCountry,
      destinationCountryCode: countryCodeFromName(destinationCountry),
      setDestinationCountryByCode: (code: string) => {
        const name = countryNameFromCode(code);
        if (name) setDestinationCountry(name);
      },
    }),
    [originCountry, destinationCountry]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext);
