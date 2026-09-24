"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Language, Translations } from "./types";
import { fr } from "./dictionaries/fr";
import { en } from "./dictionaries/en";

export type Currency = "XOF" | "XAF" | "NGN" | "KES" | "ZAR" | "USD" | "EUR";

export const CURRENCY_OPTIONS: Record<Currency, { label: string; shortLabel: string; symbol: string; digits: number }> = {
  XOF: { label: "XOF (CFA Ouest)", shortLabel: "XOF", symbol: "XOF", digits: 0 },
  XAF: { label: "XAF (CFA Centre)", shortLabel: "XAF", symbol: "XAF", digits: 0 },
  NGN: { label: "NGN (₦ Nigeria)", shortLabel: "NGN", symbol: "₦", digits: 0 },
  KES: { label: "KES (KSh Kenya)", shortLabel: "KES", symbol: "KSh", digits: 0 },
  ZAR: { label: "ZAR (R Afrique du Sud)", shortLabel: "ZAR", symbol: "R", digits: 2 },
  USD: { label: "USD ($)", shortLabel: "USD", symbol: "$", digits: 2 },
  EUR: { label: "EUR (€)", shortLabel: "EUR", symbol: "€", digits: 2 },
};

/**
 * Taux de change avec le Franc CFA (XOF) comme devise de référence (Base = 1 XOF)
 */
export const EXCHANGE_RATES: Record<Currency, number> = {
  XOF: 1,
  XAF: 1,                // Parité 1:1 exacte avec le XOF
  EUR: 1 / 655.957,      // 1 EUR = 655.957 XOF (Taux fixe officiel)
  USD: 1 / 600,          // 1 USD = 600 XOF (Taux de référence)
  NGN: 2.5,              // 1 XOF = 2.5 NGN
  KES: 0.215,            // 1 XOF = 0.215 KES
  ZAR: 0.030,            // 1 XOF = 0.030 ZAR
};

export function getCurrencyMeta(currency: Currency = "XOF") {
  return CURRENCY_OPTIONS[currency] ?? CURRENCY_OPTIONS.XOF;
}

/**
 * Convertit un montant stocké en devise de base (XOF) vers la devise cible.
 */
export function convertFromBase(amountInXOF: number, targetCurrency: Currency = "XOF"): number {
  if (amountInXOF === 0 || !amountInXOF || isNaN(amountInXOF)) return 0;
  const rate = EXCHANGE_RATES[targetCurrency] ?? 1;
  return amountInXOF * rate;
}

/**
 * Convertit un montant saisi dans une devise vers la devise de base (XOF).
 */
export function convertToBase(amountInTargetCurrency: number, fromCurrency: Currency = "XOF"): number {
  if (amountInTargetCurrency === 0 || !amountInTargetCurrency || isNaN(amountInTargetCurrency)) return 0;
  const rate = EXCHANGE_RATES[fromCurrency] ?? 1;
  return amountInTargetCurrency / rate;
}

/**
 * Convertit entre deux devises quelconques.
 */
export function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
  if (amount === 0 || !amount || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;
  const inBase = convertToBase(amount, fromCurrency);
  return convertFromBase(inBase, toCurrency);
}

/**
 * Formate un montant en effectuant la conversion automatique depuis la devise de base (XOF).
 */
export function formatCurrencyValue(
  value: number,
  currency: Currency = "XOF",
  locale: string = "fr-FR",
  shouldConvert: boolean = true
) {
  const meta = getCurrencyMeta(currency);
  const converted = shouldConvert ? convertFromBase(value, currency) : value;

  if (currency === "XOF" || currency === "XAF") {
    return `${Math.round(converted).toLocaleString(locale)} ${meta.symbol}`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: meta.digits,
    maximumFractionDigits: meta.digits,
  }).format(converted);

  return formatted;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertFromBase: (amountInXOF: number, targetCurrency?: Currency) => number;
  convertToBase: (amountInTargetCurrency: number, fromCurrency?: Currency) => number;
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
  formatMoney: (amountInXOF: number, targetCurrency?: Currency, customLocale?: string, shouldConvert?: boolean) => string;
  t: Translations;
  isFr: boolean;
  isEn: boolean;
}

const dictionaries: Record<Language, Translations> = {
  fr,
  en,
};

const LanguageContext = createContext<LanguageContextType>({
  language: "fr",
  setLanguage: () => {},
  toggleLanguage: () => {},
  currency: "XOF",
  setCurrency: () => {},
  convertFromBase: (amount) => amount,
  convertToBase: (amount) => amount,
  convertCurrency: (amount) => amount,
  formatMoney: (amount) => String(amount),
  t: fr,
  isFr: true,
  isEn: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [currency, setCurrencyState] = useState<Currency>("XOF");

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem("gestfipro_lang") as Language | null;
      if (storedLang === "fr" || storedLang === "en") {
        setLanguageState(storedLang);
        document.documentElement.lang = storedLang;
        document.documentElement.setAttribute("data-lang", storedLang);
      } else {
        const match = document.cookie.match(/gestfipro_lang=([a-z]{2})/);
        if (match && (match[1] === "fr" || match[1] === "en")) {
          const cLang = match[1] as Language;
          setLanguageState(cLang);
          document.documentElement.lang = cLang;
          document.documentElement.setAttribute("data-lang", cLang);
        } else {
          const navLang = navigator.language?.slice(0, 2);
          const nextLang = navLang === "en" ? "en" : "fr";
          setLanguageState(nextLang);
          document.documentElement.lang = nextLang;
          document.documentElement.setAttribute("data-lang", nextLang);
        }
      }

      const storedCurrency = localStorage.getItem("gestfipro_currency") as Currency | null;
      if (storedCurrency && (storedCurrency === "XOF" || storedCurrency === "XAF" || storedCurrency === "NGN" || storedCurrency === "KES" || storedCurrency === "ZAR" || storedCurrency === "USD" || storedCurrency === "EUR")) {
        setCurrencyState(storedCurrency);
      }
    } catch {
      setLanguageState("fr");
      setCurrencyState("XOF");
      if (typeof document !== "undefined") {
        document.documentElement.lang = "fr";
        document.documentElement.setAttribute("data-lang", "fr");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.setAttribute("data-lang", language);
      document.cookie = `gestfipro_lang=${language}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [language]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.cookie = `gestfipro_currency=${currency}; path=/; max-age=31536000; SameSite=Lax`;
    }
    try {
      localStorage.setItem("gestfipro_currency", currency);
    } catch {}
  }, [currency]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("gestfipro_lang", lang);
    } catch {}
  };

  const setCurrency = (nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    try {
      localStorage.setItem("gestfipro_currency", nextCurrency);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === "fr" ? "en" : "fr");
  };

  const value = useMemo(() => {
    return {
      language,
      setLanguage,
      toggleLanguage,
      currency,
      setCurrency,
      convertFromBase: (amountInXOF: number, targetCurrency: Currency = currency) =>
        convertFromBase(amountInXOF, targetCurrency),
      convertToBase: (amountInTarget: number, fromCurrency: Currency = currency) =>
        convertToBase(amountInTarget, fromCurrency),
      convertCurrency: (amount: number, from: Currency, to: Currency) =>
        convertCurrency(amount, from, to),
      formatMoney: (amountInXOF: number, targetCurrency: Currency = currency, customLocale?: string, shouldConvert: boolean = true) =>
        formatCurrencyValue(amountInXOF, targetCurrency, customLocale || (language === "en" ? "en-US" : "fr-FR"), shouldConvert),
      t: dictionaries[language] || fr,
      isFr: language === "fr",
      isEn: language === "en",
    };
  }, [language, currency]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export const useTranslation = useLanguage;
