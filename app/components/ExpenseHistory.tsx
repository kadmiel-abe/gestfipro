"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDaysInMonth,
  isSameYear,
  min as minDate,
  setDate,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowDownRight,
  CalendarDays,
  CalendarRange,
  CircleAlert,
  Receipt,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatLocalDateKey, parseLocalDateKey } from "@/lib/date-utils";
import { useToday } from "@/hooks/useToday";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
 * TYPES
 * ══════════════════════════════════════════════════════════════════════════ */

export interface Expense {
  id: string | number;
  amount: number;
  label: string;
  expense_date: string;
}

export type PeriodPreset = "cycle" | "last7" | "last30" | "custom";

/** Période de requête, bornes incluses, au format YYYY-MM-DD (calendrier local). */
export interface PeriodRange {
  startDate: string;
  endDate: string;
}

/** Ligne brute renvoyée par Supabase (NUMERIC peut arriver en string selon la config). */
interface ExpenseRow {
  id: string | number;
  amount: number | string | null;
  label: string | null;
  expense_date: string;
}

type PeriodResolution =
  | { status: "ready"; range: PeriodRange }
  | { status: "pending" }
  | { status: "invalid"; message: string };

interface FetchState {
  /** Clé de la requête ayant produit ce résultat (évite d'afficher des données périmées). */
  key: string;
  expenses: Expense[];
  error: string | null;
}

export interface ExpenseHistoryProps {
  /**
   * Jour de paie (1-31).
   * - `undefined` : lu automatiquement depuis `profiles.payday_with_month`.
   * - `null` : aucun jour de paie → le « cycle » correspond au mois civil.
   */
  paydayWithMonth?: number | null;
  className?: string;
}

/* ══════════════════════════════════════════════════════════════════════════
 * CONSTANTES
 * ══════════════════════════════════════════════════════════════════════════ */

const PERIOD_PRESETS: ReadonlyArray<{ id: PeriodPreset; label: string }> = [
  { id: "cycle", label: "Ce cycle de paie" },
  { id: "last7", label: "7 derniers jours" },
  { id: "last30", label: "30 derniers jours" },
  { id: "custom", label: "Personnalisé" },
];

const SKELETON_ROWS = 5;

const amountFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/* ══════════════════════════════════════════════════════════════════════════
 * HELPERS — DATES & FORMATAGE
 * ══════════════════════════════════════════════════════════════════════════ */

function formatAmount(value: number): string {
  return `${amountFormatter.format(value)}\u00A0F`;
}

function normalizePayday(value: unknown): number | null {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}

/** Jour de paie dans le mois de `reference`, ramené au dernier jour si le mois est plus court (31 → 28 févr.). */
function getPaydayInMonth(reference: Date, payday: number): Date {
  return startOfDay(setDate(reference, Math.min(payday, getDaysInMonth(reference))));
}

/**
 * Cycle de paie courant : du dernier jour de paie (inclus) à la veille du prochain.
 * Sans jour de paie configuré, on retombe sur le mois civil.
 */
export function getPayCycleRange(today: Date, payday: number | null): { start: Date; end: Date } {
  const todayStart = startOfDay(today);

  if (!payday) {
    return { start: startOfMonth(todayStart), end: startOfDay(endOfMonth(todayStart)) };
  }

  const paydayThisMonth = getPaydayInMonth(todayStart, payday);
  const start =
    todayStart.getTime() >= paydayThisMonth.getTime()
      ? paydayThisMonth
      : getPaydayInMonth(subMonths(todayStart, 1), payday);
  const nextPayday = getPaydayInMonth(addMonths(start, 1), payday);

  return { start, end: subDays(nextPayday, 1) };
}

function toRange(start: Date, end: Date): PeriodResolution {
  return {
    status: "ready",
    range: { startDate: formatLocalDateKey(start), endDate: formatLocalDateKey(end) },
  };
}

function resolvePeriod(
  preset: PeriodPreset,
  today: Date,
  payday: number | null,
  isPaydayReady: boolean,
  custom: PeriodRange
): PeriodResolution {
  const todayStart = startOfDay(today);

  switch (preset) {
    case "cycle": {
      if (!isPaydayReady) return { status: "pending" };
      const { start, end } = getPayCycleRange(todayStart, payday);
      return toRange(start, end);
    }
    case "last7":
      return toRange(subDays(todayStart, 6), todayStart);
    case "last30":
      return toRange(subDays(todayStart, 29), todayStart);
    case "custom": {
      const start = parseLocalDateKey(custom.startDate);
      const end = parseLocalDateKey(custom.endDate);
      if (!start || !end) {
        return { status: "invalid", message: "Choisissez une date de début et une date de fin." };
      }
      if (start.getTime() > end.getTime()) {
        return { status: "invalid", message: "La date de début doit précéder la date de fin." };
      }
      return toRange(start, end);
    }
  }
}

function formatPeriodLabel({ startDate, endDate }: PeriodRange): string {
  const start = parseLocalDateKey(startDate);
  const end = parseLocalDateKey(endDate);
  if (!start || !end) return "";

  if (startDate === endDate) return format(start, "EEEE d MMMM yyyy", { locale: fr });

  const startPattern = isSameYear(start, end) ? "d MMM" : "d MMM yyyy";
  return `Du ${format(start, startPattern, { locale: fr })} au ${format(end, "d MMM yyyy", { locale: fr })}`;
}

/** `expense_date` peut être un DATE (YYYY-MM-DD) ou un TIMESTAMPTZ : on évite le décalage UTC sur les DATE. */
function parseExpenseDate(value: string): Date | null {
  const localDate = parseLocalDateKey(value);
  if (localDate) return localDate;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/* ══════════════════════════════════════════════════════════════════════════
 * SUPABASE
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * Récupère les dépenses comprises entre `startDate` et `endDate` (bornes incluses).
 * La sécurité par utilisateur est assurée par la RLS de la table `expenses`.
 */
export async function fetchExpenses(
  { startDate, endDate }: PeriodRange,
  signal?: AbortSignal
): Promise<Expense[]> {
  const supabase = createClient();

  let query = supabase
    .from("expenses")
    .select("id, amount, label, expense_date")
    .gte("expense_date", startDate)
    // Borne haute « fin de journée » : inclusive que la colonne soit DATE ou TIMESTAMPTZ
    // (sans fuseau explicite, Postgres utilise UTC = heure d'Abidjan).
    .lte("expense_date", `${endDate}T23:59:59.999`)
    .order("expense_date", { ascending: false });

  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as ExpenseRow[]).map((row) => ({
    id: row.id,
    amount: Math.abs(Number(row.amount) || 0),
    label: row.label?.trim() || "Dépense sans libellé",
    expense_date: row.expense_date,
  }));
}

/** Jour de paie : prop prioritaire, sinon lecture du profil connecté. */
function usePayday(override: number | null | undefined): { payday: number | null; isReady: boolean } {
  const shouldFetch = override === undefined;
  const [fetched, setFetched] = useState<{ value: number | null } | null>(null);

  useEffect(() => {
    if (!shouldFetch) return;
    let cancelled = false;

    const loadPayday = async (): Promise<number | null> => {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const userId: string | undefined = authData.user?.id;
        if (!userId) return null;
        const { data } = await supabase
          .from("profiles")
          .select("payday_with_month")
          .eq("id", userId)
          .maybeSingle();
        return normalizePayday((data as { payday_with_month?: unknown } | null)?.payday_with_month);
      } catch {
        return null;
      }
    };

    loadPayday().then((value: number | null) => {
      if (!cancelled) setFetched({ value });
    });

    return () => {
      cancelled = true;
    };
  }, [shouldFetch]);

  if (!shouldFetch) return { payday: normalizePayday(override), isReady: true };
  return { payday: fetched?.value ?? null, isReady: fetched !== null };
}

/* ══════════════════════════════════════════════════════════════════════════
 * COMPOSANT
 * ══════════════════════════════════════════════════════════════════════════ */

export default function ExpenseHistory({ paydayWithMonth, className }: ExpenseHistoryProps) {
  const today = useToday();
  const { payday, isReady: isPaydayReady } = usePayday(paydayWithMonth);

  const [preset, setPreset] = useState<PeriodPreset>("cycle");
  const [custom, setCustom] = useState<PeriodRange>({ startDate: "", endDate: "" });
  const [reloadToken, setReloadToken] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState | null>(null);

  const resolution = useMemo(
    () => resolvePeriod(preset, today, payday, isPaydayReady, custom),
    [preset, today, payday, isPaydayReady, custom]
  );

  const range = resolution.status === "ready" ? resolution.range : null;
  const startDate = range?.startDate ?? null;
  const endDate = range?.endDate ?? null;
  const requestKey = startDate && endDate ? `${startDate}|${endDate}|${reloadToken}` : null;

  // Re-fetch à chaque changement de période (ou « Réessayer »). La requête précédente est annulée.
  useEffect(() => {
    if (!startDate || !endDate || !requestKey) return;
    const controller = new AbortController();

    fetchExpenses({ startDate, endDate }, controller.signal)
      .then((expenses) => {
        if (!controller.signal.aborted) setFetchState({ key: requestKey, expenses, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("[ExpenseHistory] Erreur Supabase :", err);
        setFetchState({
          key: requestKey,
          expenses: [],
          error: "Impossible de charger vos dépenses. Vérifiez votre connexion puis réessayez.",
        });
      });

    return () => controller.abort();
  }, [startDate, endDate, requestKey]);

  // Chargement dérivé : aucune donnée encore reçue pour la période affichée.
  const isLoading =
    resolution.status === "pending" || (requestKey !== null && fetchState?.key !== requestKey);
  const currentData = !isLoading && fetchState?.key === requestKey ? fetchState : null;
  const expenses = useMemo(() => currentData?.expenses ?? [], [currentData]);
  const error = currentData?.error ?? null;

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const dailyAverage = useMemo(() => {
    const start = range ? parseLocalDateKey(range.startDate) : null;
    const end = range ? parseLocalDateKey(range.endDate) : null;
    if (!start || !end) return 0;
    // Pour un cycle en cours, on moyenne sur les jours déjà écoulés.
    const elapsedDays = Math.max(1, differenceInCalendarDays(minDate([end, today]), start) + 1);
    return Math.round(total / elapsedDays);
  }, [range, today, total]);

  const handlePresetChange = (next: PeriodPreset) => {
    // Pré-remplit « Personnalisé » avec la période actuellement affichée.
    if (next === "custom" && !custom.startDate && !custom.endDate) {
      const fallback = range ?? resolvePeriod("last30", today, null, true, custom);
      if ("range" in fallback) setCustom(fallback.range);
    }
    setPreset(next);
  };

  const periodLabel = range ? formatPeriodLabel(range) : "Sélection de la période…";
  const showPaydayHint = preset === "cycle" && isPaydayReady && payday === null;

  return (
    <section
      aria-labelledby="expense-history-title"
      className={cn(
        "w-full rounded-3xl border border-[#27272A] bg-[#18181B] p-4 text-[#FAFAFA] shadow-xl shadow-black/40 sm:p-6",
        className
      )}
    >
      {/* ── En-tête ── */}
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/15 text-[#EF4444]">
          <Receipt className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 id="expense-history-title" className="text-base font-extrabold tracking-tight sm:text-lg">
            Historique des dépenses
          </h2>
          <p className="truncate text-xs text-[#A1A1AA] first-letter:uppercase">{periodLabel}</p>
        </div>
      </header>

      {/* ── Pilules de période (défilement horizontal sur mobile) ── */}
      <div
        role="group"
        aria-label="Filtrer par période"
        className="-mx-4 mb-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {PERIOD_PRESETS.map(({ id, label }) => {
          const isActive = preset === id;
          return (
            <button
              key={id}
              id={`expense-period-${id}`}
              type="button"
              aria-pressed={isActive}
              onClick={() => handlePresetChange(id)}
              className={cn(
                "inline-flex h-10 shrink-0 snap-start cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-xs font-semibold transition-all duration-200 active:scale-95 sm:text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181B]",
                isActive
                  ? "border-[#EF4444] bg-[#EF4444] text-white shadow-[0_0_20px_rgba(239,68,68,0.35)]"
                  : "border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:border-[#3F3F46] hover:text-[#FAFAFA]"
              )}
            >
              {id === "custom" && <CalendarRange className="h-3.5 w-3.5" aria-hidden />}
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Plage personnalisée ── */}
      {preset === "custom" && (
        <fieldset className="animate-fade-in-up mb-4 rounded-2xl border border-[#27272A] bg-[#09090B] p-3 sm:p-4">
          <legend className="sr-only">Période personnalisée</legend>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "startDate", label: "Début", min: undefined, max: custom.endDate || undefined },
                { key: "endDate", label: "Fin", min: custom.startDate || undefined, max: undefined },
              ] as const
            ).map((field) => (
              <label key={field.key} htmlFor={`expense-custom-${field.key}`} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                  {field.label}
                </span>
                <input
                  id={`expense-custom-${field.key}`}
                  type="date"
                  value={custom[field.key]}
                  min={field.min}
                  max={field.max}
                  onChange={(e) => setCustom((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#27272A] bg-[#18181B] px-3 text-sm font-medium text-[#FAFAFA] [color-scheme:dark] transition-colors focus:border-[#EF4444]/60 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30"
                />
              </label>
            ))}
          </div>
          {resolution.status === "invalid" && (
            <p role="alert" className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-[#FBBF24]">
              <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {resolution.message}
            </p>
          )}
        </fieldset>
      )}

      {/* ── Carte récapitulative ── */}
      <div
        aria-live="polite"
        aria-busy={isLoading}
        className="relative mb-5 overflow-hidden rounded-2xl border border-[#EF4444]/30 bg-linear-to-br from-[#EF4444]/15 via-[#18181B] to-[#09090B] p-4 sm:p-5"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#EF4444]/20 blur-3xl"
        />
        <div className="relative flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">Total dépensé</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/15 text-[#EF4444]">
            <Wallet className="h-4 w-4" aria-hidden />
          </span>
        </div>

        {isLoading ? (
          <div className="relative mt-2 space-y-3">
            <div className="h-9 w-44 animate-pulse rounded-lg bg-[#27272A]" />
            <div className="h-5 w-56 animate-pulse rounded-md bg-[#27272A]/70" />
          </div>
        ) : (
          <div className="relative">
            <p className="mt-1 text-3xl font-black tracking-tight tabular-nums sm:text-4xl">
              {range ? formatAmount(total) : "—"}
            </p>
            {range && !error && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-lg border border-[#27272A] bg-[#09090B]/80 px-2.5 py-1 text-[#A1A1AA]">
                  {expenses.length} dépense{expenses.length > 1 ? "s" : ""}
                </span>
                <span className="rounded-lg border border-[#27272A] bg-[#09090B]/80 px-2.5 py-1 text-[#A1A1AA]">
                  Moy. {formatAmount(dailyAverage)} / jour
                </span>
              </div>
            )}
          </div>
        )}

        {showPaydayHint && (
          <p className="relative mt-3 text-[11px] text-[#71717A]">
            Jour de paie non configuré : le mois civil en cours est affiché.
          </p>
        )}
      </div>

      {/* ── Liste des dépenses ── */}
      <div aria-busy={isLoading}>
        {isLoading ? (
          <ul className="space-y-2" aria-label="Chargement des dépenses">
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-[#27272A] bg-[#09090B]/70 p-3"
              >
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-[#27272A]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/5 animate-pulse rounded bg-[#27272A]" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-[#27272A]/70" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-[#27272A]" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-10 text-center"
          >
            <CircleAlert className="h-8 w-8 text-[#EF4444]" aria-hidden />
            <p className="max-w-xs text-sm font-medium text-[#FAFAFA]">{error}</p>
            <button
              id="expense-history-retry"
              type="button"
              onClick={() => setReloadToken((t) => t + 1)}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#27272A] bg-[#09090B] px-4 text-xs font-bold text-[#FAFAFA] transition-colors hover:border-[#EF4444] active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#EF4444]" aria-hidden />
              Réessayer
            </button>
          </div>
        ) : !range ? null : expenses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#27272A] bg-[#09090B]/40 px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#27272A] bg-[#09090B] text-[#52525B]">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#A1A1AA]">Aucune dépense sur cette période</p>
              <p className="mt-1 text-xs text-[#71717A]">Essayez une autre période ou ajoutez une dépense.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense, index) => {
              const date = parseExpenseDate(expense.expense_date);
              return (
                <li
                  key={expense.id}
                  className="animate-fade-in-up flex items-center gap-3 rounded-2xl border border-[#27272A] bg-[#09090B]/70 p-3 transition-colors hover:border-[#3F3F46]"
                  style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
                >
                  {/* Pastille date */}
                  <div
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-[#27272A] bg-[#18181B] leading-none"
                  >
                    <span className="text-base font-black tabular-nums">{date ? format(date, "dd") : "--"}</span>
                    <span className="mt-1 text-[10px] font-bold uppercase text-[#EF4444]">
                      {date ? format(date, "MMM", { locale: fr }).replace(".", "") : ""}
                    </span>
                  </div>

                  {/* Libellé + date complète */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{expense.label}</p>
                    <p className="mt-0.5 truncate text-xs text-[#71717A] first-letter:uppercase">
                      <time dateTime={expense.expense_date}>
                        {date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : "Date inconnue"}
                      </time>
                    </p>
                  </div>

                  {/* Montant */}
                  <p className="flex shrink-0 items-center gap-0.5 text-sm font-extrabold tabular-nums text-[#EF4444] sm:text-base">
                    <ArrowDownRight className="h-4 w-4" aria-hidden />
                    <span>-{formatAmount(expense.amount)}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
