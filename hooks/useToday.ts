"use client";

import { useState, useEffect } from "react";
import { getTodayInAbidjan, getMsUntilNextMidnight } from "@/lib/date-utils";

/**
 * Hook personnalisé qui fournit la date du jour (aujourd'hui) mise à jour automatiquement :
 * 1. À minuit (reprogrammé quotidiennement)
 * 2. Lors de la reprise de visibilité de la page (visibilitychange)
 * 3. Lors de la reprise du focus de la fenêtre (focus)
 * Nettoie tous les timers et event listeners au démontage.
 */
export function useToday(): Date {
  const [today, setToday] = useState<Date>(() => getTodayInAbidjan());

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const updateToday = () => {
      setToday(getTodayInAbidjan());
    };

    const scheduleMidnightUpdate = () => {
      const msUntilMidnight = getMsUntilNextMidnight();
      timerId = setTimeout(() => {
        updateToday();
        scheduleMidnightUpdate(); // Reprogrammation pour le minuit suivant
      }, msUntilMidnight);
    };

    // Initialisation et abonnement minuit
    updateToday();
    scheduleMidnightUpdate();

    // Gestionnaire visibilitychange
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateToday();
      }
    };

    // Gestionnaire focus
    const handleFocus = () => {
      updateToday();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return today;
}
