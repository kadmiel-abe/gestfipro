"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

// ─── 1. Types & Constantes ───────────────────────────────────────────────────
export type Currency = "XOF" | "EUR" | "USD";

export interface CurrencyOption {
  code: Currency;
  label: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "XOF", label: "XOF (FCFA)", symbol: "FCFA" },
  { code: "EUR", label: "EUR (€)", symbol: "€" },
  { code: "USD", label: "USD ($)", symbol: "$" },
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  XOF: "FCFA",
  EUR: "€",
  USD: "$",
};

/**
 * Taux de conversion par rapport au Franc CFA (XOF), devise de base du système.
 * - 1 EUR = 655.957 FCFA (Taux officiel fixe BCEAO)
 * - 1 USD = 600 FCFA (Taux de référence)
 */
export const EXCHANGE_RATES: Record<Currency, number> = {
  XOF: 1,
  EUR: 1 / 655.957,
  USD: 1 / 600,
};

// ─── 2. Fonction Utilitaire Dynamique de Formatage ────────────────────────────
/**
 * Formate un montant selon la devise sélectionnée avec conversion automatique depuis le FCFA (XOF).
 * - Si 'XOF' : formate avec "FCFA" (ex: "150 000 FCFA")
 * - Si 'EUR' : formate avec "€" (ex: "228,67 €")
 * - Si 'USD' : formate avec "$" (ex: "250.00 $")
 *
 * @param amount - Le montant (par défaut en Francs CFA / XOF)
 * @param currency - La devise cible ("XOF" | "EUR" | "USD")
 * @param shouldConvert - Si vrai (défaut), applique le taux de change
 */
export function formatCurrency(
  amount: number,
  currency: Currency = "XOF",
  shouldConvert: boolean = true
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `0 ${CURRENCY_SYMBOLS[currency] || "FCFA"}`;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Conversion si demandé
  const rate = EXCHANGE_RATES[currency] ?? 1;
  const converted = shouldConvert ? absAmount * rate : absAmount;

  let formatted = "";

  switch (currency) {
    case "EUR": {
      formatted = `${converted.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`;
      break;
    }
    case "USD": {
      formatted = `${converted.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} $`;
      break;
    }
    case "XOF":
    default: {
      formatted = `${Math.round(converted).toLocaleString("fr-FR")} FCFA`;
      break;
    }
  }

  return isNegative ? `-${formatted}` : formatted;
}

// ─── 3. Contexte React ───────────────────────────────────────────────────────
interface CurrencyContextType {
  /** Devise actuellement sélectionnée (XOF | EUR | USD) */
  currency: Currency;
  /** Symbole associé ("FCFA" | "€" | "$") */
  symbol: string;
  /** Met à jour la devise globale et la persiste */
  setCurrency: (currency: Currency) => void;
  /** Fonction dynamique de formatage liée à la devise active ou spécifiée */
  formatCurrency: (amount: number, overrideCurrency?: Currency, shouldConvert?: boolean) => string;
  /** Convertit un montant entre deux devises */
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
  /** Liste des options disponibles pour les menus déroulants */
  options: CurrencyOption[];
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "XOF";
    try {
      const stored = localStorage.getItem("gestfipro_currency") as Currency | null;
      if (stored && (stored === "XOF" || stored === "EUR" || stored === "USD")) {
        return stored;
      }
    } catch {}
    return "XOF";
  });

  const setCurrency = useCallback((nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    try {
      localStorage.setItem("gestfipro_currency", nextCurrency);
      document.cookie = `gestfipro_currency=${nextCurrency}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignorer les erreurs d'écriture
    }
  }, []);

  const convertAmount = useCallback(
    (amount: number, from: Currency = "XOF", to: Currency = currency): number => {
      if (!amount || isNaN(amount)) return 0;
      if (from === to) return amount;
      // Convertir vers la base (XOF)
      const baseAmount = amount / (EXCHANGE_RATES[from] ?? 1);
      // Convertir vers la devise cible
      return baseAmount * (EXCHANGE_RATES[to] ?? 1);
    },
    [currency]
  );

  const contextFormatCurrency = useCallback(
    (amount: number, overrideCurrency?: Currency, shouldConvert: boolean = true) => {
      const target = overrideCurrency || currency;
      return formatCurrency(amount, target, shouldConvert);
    },
    [currency]
  );

  const value = useMemo<CurrencyContextType>(() => {
    return {
      currency,
      symbol: CURRENCY_SYMBOLS[currency] || "FCFA",
      setCurrency,
      formatCurrency: contextFormatCurrency,
      convertAmount,
      options: CURRENCY_OPTIONS,
    };
  }, [currency, setCurrency, contextFormatCurrency, convertAmount]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

// ─── 4. Hook d'accès ─────────────────────────────────────────────────────────
export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback gracieux si utilisé hors du Provider
    return {
      currency: "XOF",
      symbol: "FCFA",
      setCurrency: () => {},
      formatCurrency: (amount: number, overrideCurrency?: Currency, shouldConvert: boolean = true) =>
        formatCurrency(amount, overrideCurrency || "XOF", shouldConvert),
      convertAmount: (amount: number) => amount,
      options: CURRENCY_OPTIONS,
    };
  }
  return context;
}
