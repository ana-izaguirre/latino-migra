import React, { createContext, useContext, useState, useEffect } from "react";
import {
  SUPPORTED_CURRENCIES,
  CurrencyInfo,
  convertCurrency,
  formatCurrencyAmount,
} from "./currency";

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  currencyInfo: CurrencyInfo;
  formatFromEur: (eurAmount: number) => string;
  convertFromEur: (eurAmount: number) => number;
  availableCurrencies: CurrencyInfo[];
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "EUR",
  setCurrency: () => {},
  currencyInfo: SUPPORTED_CURRENCIES.EUR,
  formatFromEur: (amount: number) => formatCurrencyAmount(amount, "EUR"),
  convertFromEur: (amount: number) => amount,
  availableCurrencies: Object.values(SUPPORTED_CURRENCIES),
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In-memory only: the app deliberately persists no preferences to storage.
  const [currency, setCurrencyState] = useState<string>("EUR");

  const setCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
    }
  };

  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.EUR;

  const convertFromEur = (eurAmount: number): number => {
    return convertCurrency(eurAmount, "EUR", currency);
  };

  const formatFromEur = (eurAmount: number): string => {
    const converted = convertCurrency(eurAmount, "EUR", currency);
    return formatCurrencyAmount(converted, currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyInfo,
        formatFromEur,
        convertFromEur,
        availableCurrencies: Object.values(SUPPORTED_CURRENCIES),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
