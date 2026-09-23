"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Language, Translations } from "./types";
import { fr } from "./dictionaries/fr";
import { en } from "./dictionaries/en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
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
  t: fr,
  isFr: true,
  isEn: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gestfipro_lang") as Language | null;
      if (stored === "fr" || stored === "en") {
        setLanguageState(stored);
        document.documentElement.lang = stored;
        document.documentElement.setAttribute("data-lang", stored);
        return;
      }

      const match = document.cookie.match(/gestfipro_lang=([a-z]{2})/);
      if (match && (match[1] === "fr" || match[1] === "en")) {
        const cLang = match[1] as Language;
        setLanguageState(cLang);
        document.documentElement.lang = cLang;
        document.documentElement.setAttribute("data-lang", cLang);
        return;
      }

      const navLang = navigator.language?.slice(0, 2);
      const nextLang = navLang === "en" ? "en" : "fr";
      setLanguageState(nextLang);
      document.documentElement.lang = nextLang;
      document.documentElement.setAttribute("data-lang", nextLang);
    } catch {
      setLanguageState("fr");
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

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("gestfipro_lang", lang);
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
      t: dictionaries[language] || fr,
      isFr: language === "fr",
      isEn: language === "en",
    };
  }, [language]);

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
