"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Language } from "@/lib/i18n/types";
import { ChevronDown, Check } from "lucide-react";

interface LanguageSelectorProps {
  className?: string;
  align?: "left" | "right";
}

const LANGUAGES: { code: Language; label: string; flag: string; nativeName: string }[] = [
  { code: "fr", label: "FR", flag: "🇫🇷", nativeName: "Français" },
  { code: "en", label: "EN", flag: "🇬🇧", nativeName: "English" },
];

export default function LanguageSelector({ className = "", align = "right" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Bouton sélecteur Dark Mode Premium */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/50 hover:bg-[#202024] text-xs font-semibold text-[#FAFAFA] transition-all cursor-pointer shadow-sm active:scale-95"
        title="Changer de langue / Change language"
      >
        <span className="text-sm leading-none select-none">{currentLang.flag}</span>
        <span className="tracking-wide text-xs font-bold text-[#E4E4E7]">{currentLang.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#A1A1AA] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#EF4444]" : ""
          }`}
        />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 mt-2 w-36 rounded-2xl bg-[#141417] border border-[#27272A] shadow-2xl shadow-black/80 py-1.5 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {LANGUAGES.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                role="option"
                aria-selected={isSelected}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-[#EF4444]/10 text-white font-semibold"
                    : "text-[#A1A1AA] hover:bg-[#1C1C21] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{item.flag}</span>
                  <span className="font-medium text-[#FAFAFA]">{item.nativeName}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#EF4444]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
