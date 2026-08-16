import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Info,
  Building,
  Utensils,
  Train,
  Check
} from "lucide-react";
import {
  SUPPORTED_CURRENCIES,
  convertCurrency,
  formatCurrencyAmount,
  CurrencyInfo
} from "../lib/currency";
import { GoogleUser } from "../types";

interface ConversorMonedasProps {
  currentUser?: GoogleUser | null;
  initialAmount?: number;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  compact?: boolean;
}

export const ConversorMonedas: React.FC<ConversorMonedasProps> = ({
  currentUser,
  initialAmount = 500,
  initialFromCurrency = "EUR",
  initialToCurrency = "COP",
  compact = false,
}) => {
  // Infer default origin currency from user's origin country if available
  const getDefaultOriginCurrency = () => {
    if (currentUser?.countryOfOrigin) {
      const map: Record<string, string> = {
        Colombia: "COP",
        México: "MXN",
        Argentina: "ARS",
        Perú: "PEN",
        Honduras: "HNL",
        Chile: "CLP",
        Brasil: "BRL",
        Guatemala: "GTQ",
      };
      if (map[currentUser.countryOfOrigin]) {
        return map[currentUser.countryOfOrigin];
      }
    }
    return initialToCurrency;
  };

  const [amount, setAmount] = useState<number>(initialAmount);
  const [fromCurrency, setFromCurrency] = useState<string>(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState<string>(getDefaultOriginCurrency());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.countryOfOrigin) {
      setToCurrency(getDefaultOriginCurrency());
    }
  }, [currentUser?.countryOfOrigin]);

  const convertedValue = convertCurrency(amount, fromCurrency, toCurrency);
  const rate1FromTo = convertCurrency(1, fromCurrency, toCurrency);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleCopy = () => {
    const text = `${formatCurrencyAmount(amount, fromCurrency)} = ${formatCurrencyAmount(convertedValue, toCurrency)}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const sampleBudgetItems = [
    { label: "Habitación Universitaria (Mes)", amountEur: 450, icon: <Building className="w-4 h-4 text-primary" /> },
    { label: "Supermercado Básico (Mes)", amountEur: 220, icon: <Utensils className="w-4 h-4 text-secondary" /> },
    { label: "Abono Transporte Joven (Mes)", amountEur: 20, icon: <Train className="w-4 h-4 text-sky-500" /> },
    { label: "Fondo Exigido Visado España (IPREM/Mes)", amountEur: 600, icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
  ];

  return (
    <div className={`bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-outline-variant/40 dark:border-slate-800 shadow-sm ${compact ? "p-4 space-y-4" : "p-6 md:p-8 space-y-6"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-secondary dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Conversor de Monedas en Vivo para Migrantes</span>
          </div>
          <h3 className="font-headline-md text-xl md:text-2xl font-extrabold text-primary dark:text-sky-300">
            Calcula tus Gastos en Moneda Local
          </h3>
          <p className="text-xs text-on-surface-variant dark:text-slate-400">
            Tasas interbancarias actualizadas (BCE) para calcular con exactitud el costo de vida y ahorro requerido.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold px-3 py-1.5 rounded-full self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tipo de cambio oficial</span>
        </div>
      </div>

      {/* Main Conversion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
        {/* From Amount & Currency */}
        <div className="md:col-span-5 bg-surface dark:bg-slate-800/80 p-4 rounded-2xl border border-outline-variant/40 dark:border-slate-700 space-y-2">
          <label className="text-[11px] font-bold text-on-surface-variant dark:text-slate-400 block uppercase">
            Tengo / Cantidad a Convertir
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              id="currency-converter-input-amount"
              className="w-full bg-transparent font-headline-md text-2xl md:text-3xl font-extrabold text-primary dark:text-sky-200 outline-none"
              placeholder="0"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              id="currency-from-select"
              className="p-2.5 bg-surface-container dark:bg-slate-700 rounded-xl border border-outline-variant/40 dark:border-slate-600 text-xs font-bold text-on-surface dark:text-slate-100 cursor-pointer"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-on-surface-variant dark:text-slate-400 block">
            {SUPPORTED_CURRENCIES[fromCurrency]?.name}
          </span>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={handleSwap}
            aria-label="Invertir monedas"
            className="p-3 rounded-2xl bg-secondary/10 dark:bg-teal-950/60 text-secondary dark:text-teal-300 hover:bg-secondary hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* To Amount & Result */}
        <div className="md:col-span-5 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-sky-950/40 dark:to-teal-950/40 p-4 rounded-2xl border border-secondary/30 dark:border-teal-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-secondary dark:text-teal-300 block uppercase">
              Equivalente en Destino / Origen
            </label>
            <button
              onClick={handleCopy}
              className="text-[10px] text-primary dark:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : null}
              <span>{isCopied ? "¡Copiado!" : "Copiar"}</span>
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-headline-lg text-2xl md:text-3xl font-black text-secondary dark:text-teal-300 truncate">
              {formatCurrencyAmount(convertedValue, toCurrency)}
            </span>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              id="currency-to-select"
              className="p-2.5 bg-surface-container dark:bg-slate-700 rounded-xl border border-outline-variant/40 dark:border-slate-600 text-xs font-bold text-on-surface dark:text-slate-100 cursor-pointer"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-on-surface-variant dark:text-slate-400 block">
            1 {fromCurrency} = {formatCurrencyAmount(rate1FromTo, toCurrency)}
          </span>
        </div>
      </div>

      {/* Quick Reference Table of Sample Living Costs */}
      {!compact && (
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-xs text-primary dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span>Equivalencias Rápidas de Gastos Frecuentes en tu Moneda</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sampleBudgetItems.map((item, idx) => {
              const convertedSample = convertCurrency(item.amountEur, "EUR", toCurrency);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setFromCurrency("EUR");
                    setAmount(item.amountEur);
                  }}
                  className="bg-surface dark:bg-slate-800/60 p-3.5 rounded-2xl border border-outline-variant/30 dark:border-slate-700 hover:border-secondary transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs font-semibold text-on-surface dark:text-slate-200 line-clamp-1">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs font-bold text-primary dark:text-sky-300">
                      €{item.amountEur}
                    </span>
                    <span className="text-xs font-extrabold text-secondary dark:text-teal-300">
                      ≈ {formatCurrencyAmount(convertedSample, toCurrency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
