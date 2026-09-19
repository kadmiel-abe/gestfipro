"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isFr } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        setScrollProgress(progress);
      }

      // Apparaît dès que l'utilisateur a scrollé plus de 280px
      setIsVisible(scrollY > 280);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Vérification initiale

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Rayon et circonférence du cercle SVG de progression
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2 group select-none"
        >
          {/* ── TOOLTIP FLOTTANT SURVOL (DESKTOP) ── */}
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#18181B]/95 border border-[#EF4444]/40 shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap"
          >
            <span>{isFr ? "Haut de page" : "Back to top"}</span>
            <span className="text-[#EF4444] font-mono text-[11px] font-bold">
              {Math.round(scrollProgress)}%
            </span>
          </span>

          {/* ── BOUTON PRINCIPAL CIRCULAIRE AVEC GLOW & PROGRESSION SVG ── */}
          <div className="relative flex items-center justify-center">
            {/* Halo lumineux pulsant */}
            <div className="absolute -inset-1.5 bg-[#EF4444]/40 rounded-full blur-md group-hover:bg-[#EF4444]/65 group-hover:blur-lg transition-all duration-300 animate-pulse pointer-events-none" />

            {/* Bouton cliquable */}
            <button
              type="button"
              onClick={scrollToTop}
              aria-label={isFr ? "Remonter en haut de page" : "Scroll back to top"}
              title={isFr ? `Remonter en haut (${Math.round(scrollProgress)}%)` : `Back to top (${Math.round(scrollProgress)}%)`}
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#121215]/95 hover:bg-[#1C1C22] backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-[0_10px_35px_rgba(239,68,68,0.45)] hover:shadow-[0_15px_45px_rgba(239,68,68,0.7)] group-hover:border-[#EF4444]/80 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EF4444] focus:ring-offset-2 focus:ring-offset-[#09090B]"
            >
              {/* Cercle SVG de progression dynamique */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 56 56"
              >
                {/* Anneau de fond */}
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-[#27272A]/70"
                  strokeWidth="3"
                  fill="transparent"
                />
                {/* Anneau de progression actif néon */}
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-[#EF4444] transition-[stroke-dashoffset] duration-150 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Icône Chevron avec rebond au survol */}
              <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-[#EF4444] group-hover:-translate-y-1 transition-all duration-300 stroke-[2.75]" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
