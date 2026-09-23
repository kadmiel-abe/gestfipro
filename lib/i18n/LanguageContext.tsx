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

export function getCurrencyMeta(currency: Currency = "XOF") {
  return CURRENCY_OPTIONS[currency] ?? CURRENCY_OPTIONS.XOF;
}

export function formatCurrencyValue(value: number, currency: Currency = "XOF", locale: string = "fr-FR") {
  const meta = getCurrencyMeta(currency);
  if (currency === "XOF" || currency === "XAF") {
    return `${Math.round(value).toLocaleString(locale)} ${meta.symbol}`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: meta.digits,
    maximumFractionDigits: meta.digits,
  }).format(value);

  return formatted;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
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
