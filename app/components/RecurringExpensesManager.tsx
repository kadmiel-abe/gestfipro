"use client";

import React, { useState, useEffect } from "react";
import {
  Repeat,
  Plus,
  Trash2,
  X,
  Calendar,
  Tag,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useCurrency } from "@/lib/context/CurrencyContext";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number;
}

const CATEGORIES = [
  "Logement",
  "Factures",
  "Abonnements",
  "Transport",
  "Santé",
  "Éducation",
  "Nourriture",
  "Autre",
];

const CATEGORY_COLORS: Record<string, string> = {
  Logement: "#3B82F6",
  Factures: "#EAB308",
  Abonnements: "#EC4899",
  Transport: "#F97316",
  Santé: "#10B981",
  Éducation: "#8B5CF6",
  Nourriture: "#EF4444",
  Autre: "#71717A",
};

export default function RecurringExpensesManager() {
  const { currency, formatCurrency } = useCurrency();

  // État local des charges fixes avec persistance localStorage — vide par défaut
  const [expenses, setExpenses] = useState<RecurringExpense[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("gestfipro_recurring_expenses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Sauvegarde automatique lors des modifications
  useEffect(() => {
    try {
      localStorage.setItem("gestfipro_recurring_expenses", JSON.stringify(expenses));
    } catch {}
  }, [expenses]);

  // État de la modale Dialog
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Formulaire d'ajout
  const [name, setName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Logement");
  const [dayOfMonth, setDayOfMonth] = useState<string>("5");
  const [formError, setFormError] = useState<string | null>(null);

  // Total mensuel des charges fixes
  const totalMonthlyAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setName("");
    setAmount("");
    setCategory("Logement");
    setDayOfMonth("5");
    setFormError(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(dayOfMonth, 10);

    // Validations
    if (!trimmedName) {
      setFormError("Veuillez saisir un nom pour la dépense.");
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Le montant doit être un nombre supérieur à 0.");
      return;
    }

    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setFormError("Le jour de prélèvement doit être compris entre 1 et 31.");
      return;
    }

    const newExpense: RecurringExpense = {
      id: `rec-${Date.now()}`,
      name: trimmedName,
      amount: parsedAmount,
      category,
      dayOfMonth: parsedDay,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full">
      {/* ── Card Shadcn UI / Dark Mode Premium ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#18181B] border border-[#27272A] p-5 sm:p-6 shadow-xl shadow-black/40">
        {/* Halo d'ambiance discret */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#EF4444]/5 blur-3xl" />

        {/* ── En-tête de la Card ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#27272A]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight">
                  Charges fixes & Abonnements
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25">
                  {expenses.length} active{expenses.length > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Prélèvements automatiques et abonnements mensuels récurrents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenDialog}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#EF4444]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une charge fixe</span>
            </button>
          </div>
        </div>

        {/* ── Récapitulatif Total Mensuel ─────────────────────────────────── */}
        <div className="my-5 p-3.5 rounded-xl bg-[#09090B]/60 border border-[#27272A] flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-[#A1A1AA] font-medium flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#EF4444]" />
            Total mensuel engagé :
          </span>
          <span className="text-sm sm:text-base font-black text-[#FAFAFA] tabular-nums">
            {formatCurrency(totalMonthlyAmount, currency, true)}
          </span>
        </div>

        {/* ── Liste des charges fixes ─────────────────────────────────────── */}
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-[#27272A] bg-[#09090B]/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#27272A]/60 mb-4">
              <Repeat className="w-7 h-7 text-[#52525B]" />
            </div>
            <p className="text-sm font-semibold text-[#FAFAFA]">
              Aucune charge fixe enregistrée.
            </p>
            <p className="text-xs text-[#A1A1AA] mt-2 max-w-xs leading-relaxed">
              Automatisez la saisie de votre loyer et de vos abonnements en les ajoutant ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#27272A] text-[#A1A1AA] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Nom de la dépense</th>
                  <th className="pb-3 px-3">Catégorie</th>
                  <th className="pb-3 px-3">Jour du mois</th>
                  <th className="pb-3 px-3 text-right">Montant</th>
                  <th className="pb-3 pr-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/60">
                {expenses.map((expense) => {
                  const catColor = CATEGORY_COLORS[expense.category] || "#EF4444";
                  return (
                    <tr
                      key={expense.id}
                      className="group hover:bg-[#27272A]/20 transition-colors"
                    >
                      {/* Nom */}
                      <td className="py-3.5 pl-2">
                        <span className="font-bold text-[#FAFAFA]">
                          {expense.name}
                        </span>
                      </td>

                      {/* Catégorie */}
                      <td className="py-3.5 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{
                            background: `${catColor}15`,
                            color: catColor,
                            border: `1px solid ${catColor}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: catColor }}
                          />
                          {expense.category}
                        </span>
                      </td>

                      {/* Jour du prélèvement */}
                      <td className="py-3.5 px-3 text-[#A1A1AA]">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#27272A]/60 text-xs font-semibold text-[#E4E4E7]">
                          <Calendar className="w-3 h-3 text-[#EF4444]" />
                          Le {expense.dayOfMonth} du mois
                        </span>
                      </td>

                      {/* Montant formaté */}
                      <td className="py-3.5 px-3 text-right font-extrabold text-[#FAFAFA] tabular-nums">
                        {formatCurrency(expense.amount, currency, true)}
                      </td>

                      {/* Action Supprimer */}
                      <td className="py-3.5 pr-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 rounded-lg text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                          title="Supprimer cette charge fixe"
                          aria-label={`Supprimer ${expense.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modale d'ajout (Dialog Shadcn UI Dark Mode) ───────────────────── */}
      {isDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseDialog}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#18181B] border border-[#27272A] p-6 shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermeture X */}
            <button
              type="button"
              onClick={handleCloseDialog}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* En-tête Dialog */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#FAFAFA]">
                  Ajouter une charge fixe
                </h4>
                <p className="text-xs text-[#A1A1AA]">
                  Définissez vos abonnements et dépenses récurrentes
                </p>
              </div>
            </div>

            {/* Message d'erreur validation */}
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleAdd} className="space-y-4">
              {/* 1. Nom de la dépense */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5 uppercase tracking-wider">
                  Nom de la dépense
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Loyer Appartement, Netflix, Fibre..."
                  className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3.5 py-2.5 text-sm font-medium text-[#FAFAFA] placeholder-[#52525B] focus:border-[#EF4444] focus:outline-none transition-colors"
                />
              </div>

              {/* 2. Montant en FCFA */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5 uppercase tracking-wider">
                  Montant (en FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 50000"
                    className="w-full rounded-xl bg-[#09090B] border border-[#27272A] pl-3.5 pr-14 py-2.5 text-sm font-bold text-[#FAFAFA] placeholder-[#52525B] focus:border-[#EF4444] focus:outline-none transition-colors tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#EF4444]">
                    FCFA
                  </span>
                </div>
              </div>

              {/* 3. Catégorie */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5 uppercase tracking-wider">
                  Catégorie
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3.5 py-2.5 text-sm font-medium text-[#FAFAFA] focus:border-[#EF4444] focus:outline-none transition-colors cursor-pointer appearance-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#18181B] text-[#FAFAFA]">
                        {cat}
                      </option>
                    ))}
                  </select>
                  <Tag className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                </div>
              </div>

              {/* 4. Jour du prélèvement (1 à 31) */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5 uppercase tracking-wider">
                  Jour du prélèvement (1 à 31)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full rounded-xl bg-[#09090B] border border-[#27272A] pl-3.5 pr-10 py-2.5 text-sm font-bold text-[#FAFAFA] placeholder-[#52525B] focus:border-[#EF4444] focus:outline-none transition-colors tabular-nums"
                  />
                  <Calendar className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                </div>
                <p className="text-[11px] text-[#71717A] mt-1">
                  Jour calendaire auquel la dépense est automatiquement décomptée chaque mois.
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-[#FAFAFA] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold shadow-lg shadow-[#EF4444]/20 transition-all cursor-pointer"
                >
                  Enregistrer la charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
