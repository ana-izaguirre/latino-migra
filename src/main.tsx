import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import { LanguageProvider } from "./lib/i18n.tsx";
import { CurrencyProvider } from "./lib/CurrencyContext.tsx";
import { PreferencesProvider } from "./lib/PreferencesContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <CurrencyProvider>
        <PreferencesProvider>
          <App />
        </PreferencesProvider>
      </CurrencyProvider>
    </LanguageProvider>
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);
