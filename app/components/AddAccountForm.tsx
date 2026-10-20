"use client";

import React, { useState, useId, type FormEvent } from "react";
import { PlusCircle, Wallet, Check, AlertCircle } from "lucide-react";
import { AccountLogo } from "./AccountLogo";
import {
  QUICK_CHOICES,
  detectProviderFromText,
  isKnownDefaultName,
  type QuickChoice,
} from "@/lib/account-choices";

export { QUICK_CHOICES, type QuickChoice };

export interface AddAccountFormData {
  name: string;
  provider: string;
  type: string;
  balance: number;
}

export interface AddAccountFormProps {
  /** Callback déclenché à la validation du formulaire */
  onSubmit?: (data: AddAccountFormData) => void | Promise<void>;
  /** Callback optionnel pour annuler / fermer */
  onCancel?: () => void;
  /** Classes CSS supplémentaires pour le conteneur */
  className?: string;
  /** Devise affichée pour le solde initial (défaut : "FCFA") */
  currencySymbol?: string;
}

/* ══════════════════════════════════════════════════════════════════════════
 * COMPOSANT AddAccountForm
 * ══════════════════════════════════════════════════════════════════════════ */

export default function AddAccountForm({
  onSubmit,
  onCancel,
  className = "",
  currencySymbol = "FCFA",
}: AddAccountFormProps) {
  const inputId = useId();
  const balanceId = useId();

  // 1. États pour le nom du compte et le provider sélectionné
  const [accountName, setAccountName] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [initialBalance, setInitialBalance] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // 2. Auto-détection (Sens inverse) :
  // Si le champ texte contient "nsia", "bni", "wave", etc., ce provider s'allume en priorité.
  const detectedProvider = detectProviderFromText(accountName);
  const activeProvider = detectedProvider || selectedProvider;

  // 3. Gestion de la saisie dans le champ texte
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setAccountName(nextVal);
    setError(null);
    setIsSuccess(false);

    // Auto-détection dynamique
    const auto = detectProviderFromText(nextVal);
    if (auto) {
      setSelectedProvider(auto);
    }
  };

  // 4. Logique "Smart Default" au clic sur une pilule
  const handlePillClick = (choice: QuickChoice) => {
    setSelectedProvider(choice.provider);
    setError(null);
    setIsSuccess(false);

    // Si le champ texte était vide (ou contenait un précédent nom par défaut),
    // on le pré-remplit automatiquement (ex: "Compte BNI", "Compte NSIA", etc.)
    if (!accountName.trim() || isKnownDefaultName(accountName)) {
      setAccountName(choice.defaultName);
    }
  };

  // 5. Validation et soumission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = accountName.trim();
    if (!trimmed) {
      setError("Veuillez saisir un nom pour ce compte.");
      return;
    }

    const providerKey = activeProvider || "custom";
    const matchedChoice = QUICK_CHOICES.find((c) => c.provider === providerKey);
    const resolvedType = matchedChoice ? matchedChoice.type : "bank";

    const parsedBalance = parseFloat(initialBalance.replace(/\s/g, "").replace(",", "."));
    const finalBalance = isNaN(parsedBalance) ? 0 : parsedBalance;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          name: trimmed,
          provider: providerKey,
          type: resolvedType,
          balance: finalBalance,
        });
      }
      setIsSuccess(true);
      // Réinitialisation après succès si aucun callback de redirection/fermeture
      setTimeout(() => {
        setIsSuccess(false);
      }, 2500);
    } catch (err) {
      console.error("[AddAccountForm] submit error", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout du compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`relative w-full rounded-3xl border border-[#27272A] bg-[#18181B] p-5 sm:p-6 text-[#FAFAFA] shadow-2xl shadow-black/50 ${className}`}
    >
      {/* ── En-tête Mobile-First ── */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#27272A]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#FAFAFA]">
            Ajouter un compte
          </h3>
          <p className="text-xs text-[#A1A1AA] truncate">
            Associez vos portefeuilles Mobile Money, banques ou espèces
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── 1. Champ Nom du compte ── */}
        <div className="space-y-1.5">
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]"
          >
            Nom du compte <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <input
              id={inputId}
              type="text"
              value={accountName}
              onChange={handleNameChange}
              placeholder="Ex : Mon salaire, Épargne, Orange perso…"
              autoComplete="off"
              className="w-full min-h-12 rounded-2xl border border-[#27272A] bg-[#09090B] px-4 py-3 text-base sm:text-sm font-semibold text-[#FAFAFA] placeholder-[#52525B] outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
            {activeProvider && (
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <AccountLogo provider={activeProvider} size={22} />
              </div>
            )}
          </div>
        </div>

        {/* ── 2 & 3. Choix rapide avec défilement horizontal ── */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
              Choix rapide :
            </span>
            {activeProvider && (
              <span className="text-[11px] font-medium text-blue-400">
                Opérateur détecté :{" "}
                <span className="font-bold">
                  {QUICK_CHOICES.find((c) => c.provider === activeProvider)?.name || activeProvider}
                </span>
              </span>
            )}
          </div>

          {/* Conteneur avec scroll horizontal (hide-scrollbar) */}
          <div
            role="radiogroup"
            aria-label="Choix rapide de l'opérateur"
            className="flex items-center gap-3 overflow-x-auto py-1.5 -mx-1 px-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {QUICK_CHOICES.map((choice) => {
              const isActive = activeProvider === choice.provider;

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handlePillClick(choice)}
                  role="radio"
                  aria-checked={isActive}
                  className={`group inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                    isActive
                      ? "ring-2 ring-blue-500 bg-blue-500/15 border border-blue-500/60 text-[#FAFAFA] shadow-md shadow-blue-500/20"
                      : "border border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#18181B]"
                  }`}
                >
                  {/* 4. Réutilisation du composant AccountLogo */}
                  <AccountLogo
                    provider={choice.provider}
                    size={22}
                    className="transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="whitespace-nowrap">{choice.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Solde initial optionnel ── */}
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor={balanceId}
            className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]"
          >
            Solde initial disponible (optionnel)
          </label>
          <div className="relative">
            <input
              id={balanceId}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0"
              className="w-full min-h-12 rounded-2xl border border-[#27272A] bg-[#09090B] pl-4 pr-16 py-3 text-base sm:text-sm font-semibold text-[#FAFAFA] placeholder-[#52525B] outline-none transition-all duration-200 tabular-nums focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#71717A]">
              {currencySymbol}
            </span>
          </div>
        </div>
      </div>

      {/* ── Message d'erreur ── */}
      {error && (
        <p
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs font-medium text-[#FCA5A5]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-[#EF4444]" />
          <span>{error}</span>
        </p>
      )}

      {/* ── Message de succès ── */}
      {isSuccess && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-300"
        >
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Compte ajouté avec succès !</span>
        </p>
      )}

      {/* ── 7. Gros bouton "Ajouter ce compte" ── */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-1/3 min-h-12 rounded-2xl border border-[#27272A] bg-[#09090B] px-4 py-3 text-sm font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-all cursor-pointer"
          >
            Annuler
          </button>
        )}
        <button
          id="btn-add-account-submit"
          type="submit"
          disabled={isSubmitting || !accountName.trim()}
          className="w-full min-h-12 flex-1 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#27272A] disabled:text-[#71717A] disabled:shadow-none cursor-pointer"
        >
          <PlusCircle className="h-5 w-5 shrink-0" />
          <span>{isSubmitting ? "Ajout en cours…" : "Ajouter ce compte"}</span>
        </button>
      </div>
    </form>
  );
}
