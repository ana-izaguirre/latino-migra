export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  ratePerEur: number; // Base currency: EUR
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  EUR: {
    code: "EUR",
    name: "Euro (€)",
    symbol: "€",
    flag: "🇪🇺",
    ratePerEur: 1.0,
  },
  USD: {
    code: "USD",
    name: "Dólar Estadounidense ($)",
    symbol: "$",
    flag: "🇺🇸",
    ratePerEur: 1.09,
  },
  CAD: {
    code: "CAD",
    name: "Dólar Canadiense ($)",
    symbol: "C$",
    flag: "🇨🇦",
    ratePerEur: 1.48,
  },
  GBP: {
    code: "GBP",
    name: "Libra Esterlina (£)",
    symbol: "£",
    flag: "🇬🇧",
    ratePerEur: 0.86,
  },
  COP: {
    code: "COP",
    name: "Peso Colombiano (COP)",
    symbol: "$",
    flag: "🇨🇴",
    ratePerEur: 4400.0,
  },
  MXN: {
    code: "MXN",
    name: "Peso Mexicano (MXN)",
    symbol: "$",
    flag: "🇲🇽",
    ratePerEur: 21.5,
  },
  ARS: {
    code: "ARS",
    name: "Peso Argentino (ARS)",
    symbol: "$",
    flag: "🇦🇷",
    ratePerEur: 1050.0,
  },
  PEN: {
    code: "PEN",
    name: "Sol Peruano (PEN)",
    symbol: "S/",
    flag: "🇵🇪",
    ratePerEur: 4.1,
  },
  HNL: {
    code: "HNL",
    name: "Lempira Hondureño (HNL)",
    symbol: "L",
    flag: "🇭🇳",
    ratePerEur: 27.2,
  },
  CLP: {
    code: "CLP",
    name: "Peso Chileno (CLP)",
    symbol: "$",
    flag: "🇨🇱",
    ratePerEur: 1020.0,
  },
  BRL: {
    code: "BRL",
    name: "Real Brasileño (BRL)",
    symbol: "R$",
    flag: "🇧🇷",
    ratePerEur: 5.9,
  },
  GTQ: {
    code: "GTQ",
    name: "Quetzal Guatemalteco (GTQ)",
    symbol: "Q",
    flag: "🇬🇹",
    ratePerEur: 8.5,
  },
  BOB: {
    code: "BOB",
    name: "Boliviano (BOB)",
    symbol: "Bs",
    flag: "🇧🇴",
    ratePerEur: 7.5,
  },
  CRC: {
    code: "CRC",
    name: "Colón Costarricense (CRC)",
    symbol: "₡",
    flag: "🇨🇷",
    ratePerEur: 560.0,
  },
  DOP: {
    code: "DOP",
    name: "Peso Dominicano (DOP)",
    symbol: "RD$",
    flag: "🇩🇴",
    ratePerEur: 65.0,
  },
  UYU: {
    code: "UYU",
    name: "Peso Uruguayo (UYU)",
    symbol: "$U",
    flag: "🇺🇾",
    ratePerEur: 43.5,
  },
};

/**
 * Converts an amount from one currency to another using the EUR base rate.
 */
export function convertCurrency(amount: number, fromCode: string, toCode: string): number {
  if (isNaN(amount) || amount <= 0) return 0;
  if (fromCode === toCode) return amount;

  const fromCurr = SUPPORTED_CURRENCIES[fromCode] || SUPPORTED_CURRENCIES.EUR;
  const toCurr = SUPPORTED_CURRENCIES[toCode] || SUPPORTED_CURRENCIES.COP;

  // Convert from origin to EUR, then from EUR to destination
  const amountInEur = amount / fromCurr.ratePerEur;
  const converted = amountInEur * toCurr.ratePerEur;

  return converted;
}

/**
 * Formats a currency amount with appropriate localization and symbol.
 */
export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const curr = SUPPORTED_CURRENCIES[currencyCode] || { symbol: currencyCode };
  if (isNaN(amount)) return `${curr.symbol} 0`;

  // Formatting decimals: no decimals for currencies with large numbers (COP, ARS, CLP)
  const isLargeUnit = ["COP", "ARS", "CLP", "CRC"].includes(currencyCode);

  const formattedNumber = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: isLargeUnit ? 0 : 2,
    maximumFractionDigits: isLargeUnit ? 0 : 2,
  }).format(amount);

  return `${curr.symbol} ${formattedNumber}`;
}

/**
 * Converts a base EUR amount to the target currency and formats it.
 */
export function formatCurrency(amountInEur: number, targetCurrencyCode: string): string {
  const converted = convertCurrency(amountInEur, "EUR", targetCurrencyCode);
  return formatCurrencyAmount(converted, targetCurrencyCode);
}
