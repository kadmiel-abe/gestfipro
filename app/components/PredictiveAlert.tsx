"use client";

import React, { useMemo } from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PredictiveAlertProps {
  currentBalance: number;
  daysUntilPayday: number;
  spentThisCycle: number;
  daysPassedInCycle: number;
  /** Devise d'affichage (optionnel, défaut: "FCFA") */
  currency?: string;
}

export default function PredictiveAlert({
  currentBalance,
  daysUntilPayday,
  spentThisCycle,
  daysPassedInCycle,
  currency = "FCFA",
}: PredictiveAlertProps) {
  const calculation = useMemo(() => {
    // Garde-fous pour éviter division par zéro ou valeurs négatives
    if (daysUntilPayday <= 0 || daysPassedInCycle <= 0 || currentBalance <= 0) {
      return { isAtRisk: false, reductionNecessaire: 0, budgetTheoriqueParJour: 0, depenseMoyenneReelleParJour: 0 };
    }

    // 1. Budget théorique par jour
    const budgetTheoriqueParJour = currentBalance / daysUntilPayday;

    // 2. Dépense moyenne réelle par jour
    const depenseMoyenneReelleParJour = spentThisCycle / daysPassedInCycle;

    // 3. Condition : dépassement du budget théorique de plus de 10%
    const isAtRisk = depenseMoyenneReelleParJour > budgetTheoriqueParJour * 1.1;

    // Montant de réduction quotidienne nécessaire pour tenir jusqu'à la paie
    const reductionNecessaire = Math.max(
      0,
      Math.round(depenseMoyenneReelleParJour - budgetTheoriqueParJour)
    );

    return {
      isAtRisk,
      reductionNecessaire,
      budgetTheoriqueParJour,
      depenseMoyenneReelleParJour,
    };
  }, [currentBalance, daysUntilPayday, spentThisCycle, daysPassedInCycle]);

  // Si pas de risque, le composant est strictement invisible (retourne null)
  if (!calculation.isAtRisk) {
    return null;
  }

  const reductionFormatted = calculation.reductionNecessaire.toLocaleString("fr-FR");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full"
      >
        {/* Card Shadcn / Dark Mode Premium */}
        <div className="relative overflow-hidden rounded-2xl bg-[#18181B] border border-[#27272A] p-4 sm:p-5 shadow-xl shadow-black/40">
          {/* Lueur rouge d'accentuation en arrière-plan */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#EF4444]/10 blur-2xl" />

          <div className="relative flex items-start gap-3 sm:gap-4">
            {/* Icône AlertTriangle avec halo d'accentuation */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>

            {/* Contenu textuel */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#EF4444]">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Rythme critique
                </span>
              </div>

              {/* Texte exact demandé */}
              <p className="text-sm sm:text-base font-medium text-[#FAFAFA] leading-relaxed">
                <span className="font-bold text-[#FAFAFA]">Alerte de rythme :</span>{" "}
                À ce rythme, votre solde sera épuisé avant la prochaine paie. Réduisez vos dépenses de{" "}
                <span className="font-extrabold text-[#EF4444] underline decoration-[#EF4444]/40 underline-offset-4">
                  {reductionFormatted} {currency}
                </span>{" "}
                par jour.
              </p>

              {/* Sous-texte / Détails de cadence */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#A1A1AA]">
                <span>
                  Budget visé :{" "}
                  <strong className="text-[#FAFAFA] font-semibold">
                    {Math.round(calculation.budgetTheoriqueParJour).toLocaleString("fr-FR")} {currency}/j
                  </strong>
                </span>
                <span className="text-[#27272A]">•</span>
                <span>
                  Rythme actuel :{" "}
                  <strong className="text-[#EF4444] font-semibold">
                    {Math.round(calculation.depenseMoyenneReelleParJour).toLocaleString("fr-FR")} {currency}/j
                  </strong>
                </span>
                <span className="text-[#27272A]">•</span>
                <span>
                  Jours restants :{" "}
                  <strong className="text-[#FAFAFA] font-semibold">{daysUntilPayday} j</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
