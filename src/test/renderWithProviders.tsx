import React from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { LanguageProvider } from "../lib/i18n";
import { CurrencyProvider } from "../lib/CurrencyContext";
import { PreferencesProvider } from "../lib/PreferencesContext";

interface ProviderOptions {
  initialOriginCountry?: string;
  initialDestinationCountry?: string;
}

/**
 * Mirrors the provider stack from main.tsx.
 *
 * Components read the shared language, currency and country selections from
 * context, so rendering them bare makes those hooks fall back to inert
 * defaults and interactions silently do nothing.
 */
export const AppProviders: React.FC<{ children: React.ReactNode } & ProviderOptions> = ({
  children,
  initialOriginCountry,
  initialDestinationCountry,
}) => (
  <LanguageProvider>
    <CurrencyProvider>
      <PreferencesProvider
        initialOriginCountry={initialOriginCountry}
        initialDestinationCountry={initialDestinationCountry}
      >
        {children}
      </PreferencesProvider>
    </CurrencyProvider>
  </LanguageProvider>
);

export const renderWithProviders = (
  ui: React.ReactElement,
  options: Omit<RenderOptions, "wrapper"> & ProviderOptions = {}
): RenderResult => {
  const { initialOriginCountry, initialDestinationCountry, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AppProviders
        initialOriginCountry={initialOriginCountry}
        initialDestinationCountry={initialDestinationCountry}
      >
        {children}
      </AppProviders>
    ),
    ...renderOptions,
  });
};
