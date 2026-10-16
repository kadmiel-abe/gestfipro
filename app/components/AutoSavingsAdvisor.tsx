"use client";

import React, { useState, useMemo } from "react";
import {
  PiggyBank,
  Sparkles,
  Target,
  Check,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AutoSavingsAdvisorProps {
  /** Salaire net mensuel de l'utilisateur en FCFA */
  salaireMensuel: number;
  /** Montant total des dépenses réelles du mois précédent */
  depensesMoisPrecedent: number;
  /** Devise monétaire (par défaut "FCFA") */
  currency?: string;
  /** Callback optionnel déclenché lors de la création de l'objectif */
  onCreateGoal?: (amount: number, percentage: number) => void;
  /** Classe CSS additionnelle */
  className?: string;
}

export interface SuggestedSavingsResult {
  percentage: number;
  montant: number;
  explanation: string;
  badgeLabel: string;
  ratio: number;
  status: "prudent" | "equilibre" | "optimal";
}

// ─── Algorithme de Calcul d'Épargne Suggérée ─────────────────────────────────
export function calculateSuggestedSavings(
  salaireMensuel: number,
  depensesMoisPrecedent: number
): SuggestedSavingsResult {
  const salaire = Math.max(0, salaireMensuel || 0);
  const depenses = Math.max(0, depensesMoisPrecedent || 0);

  if (salaire <= 0) {
    return {
      percentage: 0,
      montant: 0,
      explanation:
        "Renseignez votre salaire net mensuel dans vos réglages pour permettre à l'algorithme d'évaluer votre capacité d'épargne optimale.",
      badgeLabel: "En attente de revenus",
      ratio: 0,
      status: "prudent",
    };
  }

  const ratio = depenses / salaire;

  // Cas 1 : Dépenses > 80% du salaire => Suggérer 5% (mode prudence)
  if (ratio > 0.8) {
    const percentage = 5;
    const montant = Math.round((salaire * percentage) / 100);
    return {
      percentage,
      montant,
      explanation:
        "Vos dépenses récentes absorbent plus de 80% de vos revenus. L'algorithme préconise un palier de démarrage prudent de 5% afin de préserver votre trésorerie tout en amorçant un fonds de sécurité.",
      badgeLabel: "Palier Prudence (5%)",
      ratio,
      status: "prudent",
    };
  }

  // Cas 2 : Dépenses entre 60% et 80% du salaire => Suggérer 10% (mode équilibré)
  if (ratio >= 0.6) {
    const percentage = 10;
    const montant = Math.round((salaire * percentage) / 100);
    return {
      percentage,
      montant,
      explanation:
        "Vos dépenses se situent entre 60% et 80% de vos rentrées financières. Épargner 10% vous permet de consolider progressivement votre réserve d'urgence sans peser sur votre quotidien.",
      badgeLabel: "Objectif Équilibré (10%)",
      ratio,
      status: "equilibre",
    };
  }

  // Cas 3 : Dépenses < 60% du salaire => Suggérer 20% (idéal 50/30/20)
  const percentage = 20;
  const montant = Math.round((salaire * percentage) / 100);
  return {
    percentage,
    montant,
    explanation:
      "Basé sur vos dépenses moyennes inférieures à 60%, épargner 20% de votre salaire respecte la règle des 50/30/20 tout en vous laissant un reste à vivre confortable.",
    badgeLabel: "Règle 50/30/20 (Idéal)",
    ratio,
    status: "optimal",
  };
}

// ─── Composant AutoSavingsAdvisor ────────────────────────────────────────────
export default function AutoSavingsAdvisor({
  salaireMensuel,
  depensesMoisPrecedent,
  currency = "FCFA",
  onCreateGoal,
  className = "",
}: AutoSavingsAdvisorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasCreatedGoal, setHasCreatedGoal] = useState(false);

  // Exécution mémorisée de l'algorithme
  const advice = useMemo(
    () => calculateSuggestedSavings(salaireMensuel, depensesMoisPrecedent),
    [salaireMensuel, depensesMoisPrecedent]
  );

  // Formatage des montants
  const formattedMontant = advice.montant.toLocaleString("fr-FR");
  const formattedSalaire = Math.max(0, salaireMensuel || 0).toLocaleString("fr-FR");
  const formattedDepenses = Math.max(0, depensesMoisPrecedent || 0).toLocaleString("fr-FR");
  const depensesRatioPercent = Math.round(advice.ratio * 100);

  // Action : simulation de création de l'objectif
  const handleCreateGoal = async () => {
    if (advice.montant <= 0 || isSimulating) return;

    setIsSimulating(true);
    // Simulation d'une action asynchrone (1s)
    await new Promise((resolve) => setTimeout(resolve, 600));

    onCreateGoal?.(advice.montant, advice.percentage);
    setIsSimulating(false);
    setHasCreatedGoal(true);

    // Réinitialisation du statut de succès après 4 secondes
    setTimeout(() => {
      setHasCreatedGoal(false);
    }, 4000);
  };

  return (
    <Card
      className={`relative overflow-hidden bg-[#18181B] border-[#27272A] text-[#FAFAFA] shadow-xl ${className}`}
    >
      {/* Halo lumineux décoratif en arrière-plan (Accent #EF4444) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#EF4444]/10 blur-3xl"
      />

      {/* ── En-tête : Titre & Icône ── */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/25 text-[#EF4444] shadow-inner shadow-[#EF4444]/20">
              <PiggyBank className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
                <span>Conseil d&apos;épargne intelligent</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA] mt-0.5">
                Recommandation automatisée basée sur vos flux réels
              </CardDescription>
            </div>
          </div>

          {/* Badge statut de l'algorithme */}
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 px-3 py-1 text-xs font-semibold text-[#EF4444]">
            <Sparkles className="h-3 w-3" />
            <span>{advice.badgeLabel}</span>
          </span>
        </div>
      </CardHeader>

      {/* ── Contenu Principal ── */}
      <CardContent className="space-y-4">
        {/* Encadré d'affichage du pourcentage et du montant calculé */}
        <div className="rounded-2xl bg-[#09090B] border border-[#27272A] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Taux recommandé par l&apos;algorithme
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-[#EF4444]">
                  {advice.percentage}%
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#A1A1AA]">
                  du salaire mensuel
                </span>
              </div>
            </div>

            {/* Badge mobile */}
            <div className="sm:hidden">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#EF4444]">
                <Sparkles className="h-2.5 w-2.5" />
                <span>{advice.badgeLabel}</span>
              </span>
            </div>
          </div>

          {/* Montant exact en FCFA */}
          <div className="mt-4 pt-3.5 border-t border-[#27272A]/80">
            <p className="text-sm sm:text-base font-bold text-[#FAFAFA]">
              Soit{" "}
              <span className="text-[#EF4444] font-extrabold">
                {formattedMontant} {currency}
              </span>{" "}
              à mettre de côté ce mois-ci
            </p>
          </div>
        </div>

        {/* Court texte explicatif généré par l'algorithme */}
        <div className="p-3.5 rounded-xl bg-[#27272A]/30 border border-[#27272A]/60 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
            {advice.explanation}
          </p>
        </div>

        {/* Indicateurs synthétiques : Salaire vs Dépenses */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-[#09090B]/60 border border-[#27272A]">
            <p className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider">
              Salaire de référence
            </p>
            <p className="font-bold text-[#FAFAFA] mt-0.5">
              {formattedSalaire} {currency}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#09090B]/60 border border-[#27272A]">
            <p className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider flex items-center justify-between">
              <span>Dépenses passées</span>
              <span className="text-[#EF4444] font-semibold">
                {depensesRatioPercent}%
              </span>
            </p>
            <p className="font-bold text-[#FAFAFA] mt-0.5 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-[#A1A1AA]" />
              <span>
                {formattedDepenses} {currency}
              </span>
            </p>
          </div>
        </div>
      </CardContent>

      {/* ── Action : Bouton Créer cet objectif ── */}
      <CardFooter className="pt-2">
        <button
          type="button"
          onClick={handleCreateGoal}
          disabled={advice.montant <= 0 || isSimulating}
          className="
            w-full flex items-center justify-center gap-2.5
            py-3 px-4 rounded-xl
            bg-[#EF4444] text-[#FAFAFA] font-bold text-xs sm:text-sm
            shadow-lg shadow-[#EF4444]/25
            transition-all duration-200
            hover:bg-[#DC2626]
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#EF4444]
            cursor-pointer
          "
        >
          {isSimulating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Création de l&apos;objectif en cours...</span>
            </>
          ) : hasCreatedGoal ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Objectif de {formattedMontant} {currency} créé avec succès !</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>Créer cet objectif</span>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </>
          )}
        </button>
      </CardFooter>
    </Card>
  );
}
