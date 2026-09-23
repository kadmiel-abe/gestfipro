"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isFr } = useLanguage();
  const isLandingLikePage = pathname === "/" || pathname === "/guide";

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        setScrollProgress(progress);
      }

      if (isLandingLikePage) {
        setIsVisible(scrollY > 80);
        return;
      }

      setIsVisible(scrollY > 280);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Vérification initiale

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (isLandingLikePage) {
      const hero = document.getElementById("hero");
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

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
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className={
            isLandingLikePage
              ? "fixed bottom-5 right-3 sm:bottom-6 sm:right-5 z-50 select-none"
              : "fixed bottom-5 right-3 sm:bottom-6 sm:right-5 z-50 select-none"
          }
        >
          <button
            type="button"
            onClick={scrollToTop}
            aria-label={isFr ? "Remonter en haut de page" : "Scroll back to top"}
            title={isFr ? `Remonter en haut (${Math.round(scrollProgress)}%)` : `Back to top (${Math.round(scrollProgress)}%)`}
            className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#050505] border-[2.5px] border-[#ff2f2f] shadow-[0_0_16px_rgba(255,47,47,0.9),0_0_28px_rgba(255,47,47,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff2f2f] focus:ring-offset-2 focus:ring-offset-[#09090B]"
          >
            <span className="absolute inset-1.5 rounded-full bg-[#ff2f2f]/8 blur-sm" />

            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 56 56"
            >
              <circle
                cx="28"
                cy="28"
                r={24}
                className="stroke-[#ff2f2f]/50"
                strokeWidth="1.4"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r={24}
                className="stroke-[#ff2f2f] transition-[stroke-dashoffset] duration-150 ease-out"
                strokeWidth="1.8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <ChevronUp className="relative w-5 h-5 sm:w-6 sm:h-6 text-[#ff2f2f] drop-shadow-[0_0_10px_rgba(255,47,47,0.9)]" strokeWidth={2.6} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
