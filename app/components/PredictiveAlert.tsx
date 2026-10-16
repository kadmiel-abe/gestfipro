"use client";

import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

export interface PredictiveAlertProps {
  /** Solde financier actuellement disponible */
  soldeDisponible?: number;
  /** Nombre de jours restants jusqu'à la prochaine paie */
  joursRestants?: number;
  /** Total des dépenses cumulées sur la période/mois en cours */
  depensesMois?: number;
  /** Nombre de jours déjà écoulés dans le cycle en cours */
  joursEcoules?: number;
  /** Alias pour compatibilité */
  currentBalance?: number;
  daysUntilPayday?: number;
  spentThisCycle?: number;
  daysPassedInCycle?: number;
  /** Devise d'affichage (défaut: "FCFA") */
  currency?: string;
}

/**
 * Composant client PredictiveAlert - Moteur d'alertes prédictives GestFiPro.
 * Compare la dépense moyenne réelle par jour au budget théorique quotidien disponible.
 * Si le rythme de dépense met en péril le solde avant la paie, l'alerte s'affiche.
 * Sinon, le composant retourne null (invisible).
 */
export default function PredictiveAlert({
  soldeDisponible,
  joursRestants,
  depensesMois,
  joursEcoules,
  currentBalance,
  daysUntilPayday,
  spentThisCycle,
  daysPassedInCycle,
  currency = "FCFA",
}: PredictiveAlertProps) {
  // Récupération des valeurs avec support des alias
  const solde = soldeDisponible ?? currentBalance ?? 0;
  const restants = joursRestants ?? daysUntilPayday ?? 0;
  const depenses = depensesMois ?? spentThisCycle ?? 0;
  const ecoules = joursEcoules ?? daysPassedInCycle ?? 0;

  const calculation = useMemo(() => {
    // Garde-fous mathématiques pour éviter division par zéro ou valeurs négatives
    if (restants <= 0 || ecoules <= 0 || solde <= 0) {
      return { isAtRisk: false, budgetTheoriqueParJour: 0, depenseMoyenneReelleParJour: 0 };
    }

    // 1. Budget théorique par jour = soldeDisponible / joursRestants
    const budgetTheoriqueParJour = solde / restants;

    // 2. Dépense moyenne réelle par jour = depensesMois / joursEcoules
    const depenseMoyenneReelleParJour = depenses / ecoules;

    // 3. Condition de risque : dépassement du rythme théorique
    const isAtRisk = depenseMoyenneReelleParJour > budgetTheoriqueParJour;

    return {
      isAtRisk,
      budgetTheoriqueParJour: Math.round(budgetTheoriqueParJour),
      depenseMoyenneReelleParJour: Math.round(depenseMoyenneReelleParJour),
    };
  }, [solde, restants, depenses, ecoules]);

  // Si pas de risque, le composant reste strictement invisible
  if (!calculation.isAtRisk) {
    return null;
  }

  const moyenneFormattee = calculation.depenseMoyenneReelleParJour.toLocaleString("fr-FR");
  const budgetFormatte = calculation.budgetTheoriqueParJour.toLocaleString("fr-FR");

  return (
    <div
      role="alert"
      className="w-full relative overflow-hidden rounded-2xl bg-[#18181B] border border-[#EF4444] p-4 sm:p-5 shadow-xl shadow-red-500/10 mb-6"
    >
      {/* Halo rouge discret d'accentuation en arrière-plan */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#EF4444]/10 blur-2xl" />

      <div className="relative flex items-start gap-3.5 sm:gap-4">
        {/* Icône AlertTriangle avec halo d'accentuation */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
          <AlertTriangle className="h-5 w-5 animate-pulse text-[#EF4444]" />
        </div>

        {/* Contenu textuel conforme au design system */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-[#FAFAFA] tracking-tight">
            Alerte de rythme de dépense
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
            À ce rythme, votre solde sera épuisé avant la prochaine paie. Votre moyenne est de{" "}
            <span className="font-bold text-[#EF4444]">
              {moyenneFormattee} {currency}/jour
            </span>
            , mais votre budget restant est de{" "}
            <span className="font-bold text-[#FAFAFA]">
              {budgetFormatte} {currency}/jour
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
