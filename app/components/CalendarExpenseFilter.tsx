"use client";

import React, { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  Receipt,
  RotateCcw,
  Wallet,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
export interface CalendarTransaction {
  id: string;
  label: string;
  category: string;
  icon: string;
  amount: number; // en FCFA
  date: string; // format ISO "yyyy-MM-dd"
}

interface AppliedRange {
  start: string;
  end: string;
}

interface CalendarExpenseFilterProps {
  transactions?: CalendarTransaction[];
  className?: string;
}

// ── Utilitaires ─────────────────────────────────────────────────────────────
/** Date du jour décalée de `n` jours, au format "yyyy-MM-dd" (heure locale). */
const isoDaysAgo = (n: number) => format(subDays(new Date(), n), "yyyy-MM-dd");

/** "2026-10-20" → "20 oct. 2026" */
const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), "d MMM yyyy", { locale: fr });

const formatFCFA = (amount: number) =>
  `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

// ── Fausses transactions (relatives à aujourd'hui) ──────────────────────────
export const mockCalendarTransactions: CalendarTransaction[] = [
  { id: "tx-1", label: "Garba au maquis", category: "Nourriture", icon: "🍛", amount: 1500, date: isoDaysAgo(0) },
  { id: "tx-2", label: "Woro-woro Adjamé → Plateau", category: "Transport", icon: "🚕", amount: 500, date: isoDaysAgo(0) },
  { id: "tx-3", label: "Crédit Orange Money", category: "Télécom", icon: "📱", amount: 2000, date: isoDaysAgo(1) },
  { id: "tx-4", label: "Marché de Cocody", category: "Courses", icon: "🛒", amount: 12500, date: isoDaysAgo(2) },
  { id: "tx-5", label: "Facture CIE (électricité)", category: "Factures", icon: "⚡", amount: 18000, date: isoDaysAgo(4) },
  { id: "tx-6", label: "Pharmacie de garde", category: "Santé", icon: "💊", amount: 6500, date: isoDaysAgo(6) },
  { id: "tx-7", label: "Carburant station Total", category: "Transport", icon: "⛽", amount: 10000, date: isoDaysAgo(9) },
  { id: "tx-8", label: "Tontine du quartier", category: "Épargne", icon: "🤝", amount: 25000, date: isoDaysAgo(13) },
  { id: "tx-9", label: "Facture SODECI (eau)", category: "Factures", icon: "💧", amount: 7500, date: isoDaysAgo(18) },
  { id: "tx-10", label: "Sortie cinéma Majestic", category: "Loisirs", icon: "🎬", amount: 5000, date: isoDaysAgo(24) },
];

// ── Styles partagés des inputs natifs ───────────────────────────────────────
// - text-base (16px) évite le zoom automatique d'iOS Safari au focus.
// - L'indicateur natif (Chrome/Edge) est étiré et rendu invisible : un tap
//   n'importe où dans le champ ouvre le calendrier, et notre icône Lucide
//   prend sa place visuellement.
const dateInputClass = [
  "peer relative w-full min-h-12 appearance-none rounded-2xl",
  "border border-gray-200 bg-gray-100 pl-4 pr-11 py-3",
  "text-base font-semibold text-gray-900 tabular-nums",
  "outline-none transition-all duration-200",
  "hover:bg-gray-50 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15",
  "[&::-webkit-date-and-time-value]:text-left",
  "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0",
  "[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full",
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
].join(" ");

// ── Composant ───────────────────────────────────────────────────────────────
export default function CalendarExpenseFilter({
  transactions = mockCalendarTransactions,
  className = "",
}: CalendarExpenseFilterProps) {
  const today = isoDaysAgo(0);

  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => isoDaysAgo(7));
  const [endDate, setEndDate] = useState<string>(today);
  const [applied, setApplied] = useState<AppliedRange | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Validation (comparaison de chaînes ISO "yyyy-MM-dd" = ordre chronologique)
  const isMissing = !startDate || !endDate;
  const isRangeInvalid = !isMissing && endDate < startDate;
  const errorMessage = isRangeInvalid
    ? "La date de fin ne peut pas être antérieure à la date de début."
    : submitted && isMissing
      ? "Veuillez choisir une date de début et une date de fin."
      : null;

  // Transactions affichées : filtrées si un filtre est appliqué, sinon toutes
  const visibleTransactions = useMemo(() => {
    const list = applied
      ? transactions.filter((tx) => tx.date >= applied.start && tx.date <= applied.end)
      : transactions;
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, applied]);

  const total = useMemo(
    () => visibleTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [visibleTransactions]
  );

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (isMissing || isRangeInvalid) return;
    setApplied({ start: startDate, end: endDate });
    setIsOpen(false);
  };

  const handleReset = () => {
    setApplied(null);
    setSubmitted(false);
    setStartDate(isoDaysAgo(7));
    setEndDate(today);
  };

  return (
    <section
      aria-labelledby="calendar-filter-title"
      className={`w-full rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}
    >
      {/* ── En-tête ── */}
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="calendar-filter-title" className="text-lg font-bold tracking-tight text-gray-900">
            Mes dépenses
          </h2>
          <p className="text-xs text-gray-500">
            {applied ? "Filtre personnalisé actif" : "Toutes les transactions récentes"}
          </p>
        </div>

        {applied && (
          <button
            id="calendar-filter-reset"
            type="button"
            onClick={handleReset}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </header>

      {/* ── 1. Bouton principal ── */}
      <button
        id="calendar-filter-toggle"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="calendar-filter-panel"
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-3.5 text-left text-sm font-semibold text-white shadow-lg shadow-gray-900/10 transition-all duration-200 hover:bg-gray-800 active:scale-[0.98]"
      >
        <span className="flex items-center gap-2.5">
          <span aria-hidden>📅</span>
          Filtrer par calendrier
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── 2 & 3. Panneau avec les champs date natifs ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="calendar-filter-panel"
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleApply}
              noValidate
              className="mt-3 space-y-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Date de début */}
                <div className="space-y-1.5">
                  <label htmlFor="calendar-filter-start" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Date de début
                  </label>
                  <div className="relative">
                    <input
                      id="calendar-filter-start"
                      type="date"
                      value={startDate}
                      max={today}
                      onChange={(e) => setStartDate(e.target.value)}
                      aria-invalid={isRangeInvalid}
                      className={`${dateInputClass} ${isRangeInvalid ? "border-red-400 bg-red-50" : ""}`}
                    />
                    <Calendar className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 peer-focus:text-emerald-600" />
                  </div>
                </div>

                {/* Date de fin */}
                <div className="space-y-1.5">
                  <label htmlFor="calendar-filter-end" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Date de fin
                  </label>
                  <div className="relative">
                    <input
                      id="calendar-filter-end"
                      type="date"
                      value={endDate}
                      max={today}
                      onChange={(e) => setEndDate(e.target.value)}
                      aria-invalid={isRangeInvalid}
                      aria-describedby={errorMessage ? "calendar-filter-error" : undefined}
                      className={`${dateInputClass} ${isRangeInvalid ? "border-red-400 bg-red-50" : ""}`}
                    />
                    <Calendar className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 peer-focus:text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Message d'erreur */}
              {errorMessage && (
                <p
                  id="calendar-filter-error"
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {errorMessage}
                </p>
              )}

              {/* Bouton Appliquer */}
              <button
                id="calendar-filter-apply"
                type="submit"
                disabled={isRangeInvalid}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
              >
                <Check className="h-4 w-4" />
                Appliquer le filtre
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. Bandeau de résumé ── */}
      <AnimatePresence>
        {applied && (
          <motion.div
            key={`${applied.start}-${applied.end}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="relative mt-4 overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-xl shadow-emerald-700/20"
          >
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald-50/90">
              <CalendarDays className="h-4 w-4" />
              Période du {formatDisplayDate(applied.start)} au {formatDisplayDate(applied.end)}
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-100/80">
              Total dépensé
            </p>
            <p className="mt-0.5 flex items-baseline gap-2 text-3xl font-black tracking-tight tabular-nums sm:text-4xl">
              <Wallet className="h-6 w-6 shrink-0 self-center opacity-80" />
              {formatFCFA(total)}
            </p>
            <p className="mt-2 text-xs text-emerald-50/80">
              {visibleTransactions.length} transaction{visibleTransactions.length > 1 ? "s" : ""}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. Liste des transactions ── */}
      <div className="mt-5">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          Transactions
        </h3>

        {visibleTransactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center">
            <Receipt className="h-6 w-6 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Aucune dépense sur cette période</p>
            <p className="text-xs text-gray-500">Essayez d&apos;élargir les dates du filtre.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visibleTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 transition-colors hover:border-gray-200 hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
                    {tx.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{tx.label}</p>
                    <p className="truncate text-xs text-gray-500">
                      {tx.category} · {formatDisplayDate(tx.date)}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-red-500">
                  -{formatFCFA(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
