"use client";

import React, { useState } from "react";
import { PiggyBank, Target, Sparkles, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AutoSavingsSuggestionCardProps {
  /** Salaire net mensuel en FCFA ou devise locale */
  salaireMensuel: number;
  /** Devise d'affichage (défaut : "FCFA") */
  currency?: string;
  /** Callback optionnel déclenché au clic sur "Créer cet objectif" */
  onCreateGoal?: (amount: number) => void;
  /** Classe CSS additionnelle */
  className?: string;
}

export default function AutoSavingsSuggestionCard({
  salaireMensuel,
  currency = "FCFA",
  onCreateGoal,
  className = "",
}: AutoSavingsSuggestionCardProps) {
  const [isCreated, setIsCreated] = useState(false);

  // ── Logique 50/30/20 : 20% du salaire mensuel dédié à l'épargne ───────────
  const safeSalary = Math.max(0, salaireMensuel || 0);
  const montantEpargne = Math.round(safeSalary * 0.2);

  const formattedAmount = montantEpargne.toLocaleString("fr-FR");
  const formattedSalary = safeSalary.toLocaleString("fr-FR");

  const handleCreate = () => {
    setIsCreated(true);
    onCreateGoal?.(montantEpargne);
    setTimeout(() => setIsCreated(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`w-full ${className}`}
    >
      {/* ── Card Shadcn UI / Dark Mode Premium ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#18181B] border border-[#27272A] p-5 sm:p-6 shadow-xl shadow-black/40">
        {/* Glow discret d'ambiance en coin supérieur droit */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#EF4444]/10 blur-3xl" />

        {/* ── En-tête de la Card ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            {/* Icône PiggyBank avec conteneur d'accentuation */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]">
              <PiggyBank className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#FAFAFA]">
                  Épargne automatique suggérée
                </h3>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Basée sur la méthode éprouvée du 50/30/20
              </p>
            </div>
          </div>

          {/* Badge 20% */}
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EF4444]/15 px-2.5 py-1 text-xs font-bold text-[#EF4444] border border-[#EF4444]/20">
            <Sparkles className="h-3 w-3" />
            20%
          </span>
        </div>

        {/* ── Contenu principal : Montant en grand ──────────────────────── */}
        <div className="my-5 rounded-xl bg-[#09090B]/60 border border-[#27272A]/70 p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
            Montant mensuel recommandé
          </span>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#EF4444]">
              {formattedAmount}
            </span>
            <span className="text-lg sm:text-xl font-bold text-[#FAFAFA]">
              {currency}
            </span>
            <span className="text-xs text-[#A1A1AA]">/ mois</span>
          </div>

          {/* Répartition visuelle 50/30/20 */}
          <div className="mt-4 pt-3 border-t border-[#27272A]/60 flex items-center justify-between text-xs text-[#A1A1AA]">
            <span>
              Salaire de référence :{" "}
              <strong className="text-[#FAFAFA] font-medium">
                {formattedSalary} {currency}
              </strong>
            </span>
            <span className="text-[#EF4444] font-semibold">Épargne de sécurité</span>
          </div>
        </div>

        {/* ── Texte explicatif ───────────────────────────────────────────── */}
        <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed mb-6">
          <strong className="text-[#FAFAFA] font-semibold">Recommandation :</strong>{" "}
          Sécurisez 20% de votre salaire dès réception pour bâtir votre filet de sécurité.
        </p>

        {/* ── Action : Bouton Créer cet objectif ─────────────────────────── */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={safeSalary <= 0}
          className="
            group flex w-full items-center justify-center gap-2.5
            rounded-xl px-5 py-3.5
            bg-[#EF4444] text-[#FAFAFA] text-sm font-semibold
            transition-all duration-200
            hover:bg-red-500
            active:scale-[0.98]
            shadow-lg shadow-red-500/20
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#EF4444]
          "
        >
          <AnimatePresence mode="wait">
            {isCreated ? (
              <motion.span
                key="created"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Objectif suggéré appliqué !
              </motion.span>
            ) : (
              <motion.span
                key="create"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Créer cet objectif</span>
                <ArrowRight className="h-4 w-4 opacity-70 transition-transform duration-200 group-hover:translate-x-1" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
