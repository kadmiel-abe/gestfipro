"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  AlertCircle,
  CalendarRange,
  Check,
  Download,
  RefreshCw,
  Scale,
  SearchX,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useToday } from "@/hooks/useToday";
import {
  ACTIVITY_KIND_META,
  PRESETS,
  buildActivitiesCsv,
  countDays,
  filterActivities,
  getPresetRange,
  groupByDay,
  normalizeAccounts,
  normalizeGoals,
  normalizeRecurring,
  normalizeTransactions,
  parseDateKey,
  rangeToUtcBounds,
  summarize,
  toDateKey,
  validateRange,
  type AccountRow,
  type ActivityItem,
  type ActivityKind,
  type DateRange,
  type GoalRow,
  type PresetId,
  type RecurringRow,
  type TransactionRow,
} from "@/lib/activity-period";

/* ══════════════════════════════════════════════════════════════════════════
 * TYPES & CONSTANTES
 * ══════════════════════════════════════════════════════════════════════════ */

type KindFilter = ActivityKind | "all";

interface FetchState {
  /** Clé de la requête ayant produit ce résultat (évite d'afficher des données périmées). */
  key: string;
  items: ActivityItem[];
  error: string | null;
  warnings: string[];
}

const RECURRING_STORAGE_KEY = "gestfipro_recurring_expenses";
const DEFAULT_PRESET: Exclude<PresetId, "custom"> = "last7";
const SKELETON_ROWS = 4;

const KIND_FILTERS: ReadonlyArray<KindFilter> = ["all", "expense", "income", "goal", "account", "recurring"];

/** Classes Tailwind statiques par type d'action (pas de classes dynamiques). */
const KIND_STYLES: Record<ActivityKind, { box: string; dot: string; chip: string }> = {
  expense: {
    box: "bg-[#EF4444]/10 border-[#EF4444]/25",
    dot: "bg-[#EF4444]",
    chip: "data-[active=true]:bg-[#EF4444]/15 data-[active=true]:border-[#EF4444]/50 data-[active=true]:text-[#FCA5A5]",
  },
  income: {
    box: "bg-emerald-500/10 border-emerald-500/25",
    dot: "bg-emerald-400",
    chip: "data-[active=true]:bg-emerald-500/15 data-[active=true]:border-emerald-500/50 data-[active=true]:text-emerald-300",
  },
  goal: {
    box: "bg-amber-500/10 border-amber-500/25",
    dot: "bg-amber-400",
    chip: "data-[active=true]:bg-amber-500/15 data-[active=true]:border-amber-500/50 data-[active=true]:text-amber-300",
  },
  account: {
    box: "bg-sky-500/10 border-sky-500/25",
    dot: "bg-sky-400",
    chip: "data-[active=true]:bg-sky-500/15 data-[active=true]:border-sky-500/50 data-[active=true]:text-sky-300",
  },
  recurring: {
    box: "bg-violet-500/10 border-violet-500/25",
    dot: "bg-violet-400",
    chip: "data-[active=true]:bg-violet-500/15 data-[active=true]:border-violet-500/50 data-[active=true]:text-violet-300",
  },
};

const dateInputClass = [
  "w-full min-h-11 rounded-xl border bg-[#09090B] px-3.5 py-2.5",
  "text-base sm:text-sm font-semibold text-[#FAFAFA] tabular-nums [color-scheme:dark]",
  "outline-none transition-all duration-200",
  "focus:border-[#EF4444]/60 focus:ring-4 focus:ring-[#EF4444]/10",
].join(" ");

/* ══════════════════════════════════════════════════════════════════════════
 * HELPERS
 * ══════════════════════════════════════════════════════════════════════════ */

function formatKey(key: string, pattern: string): string {
  const date = parseDateKey(key);
  return date ? format(date, pattern, { locale: fr }) : key;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function readRecurringFromStorage(): RecurringRow[] {
  try {
    const raw = localStorage.getItem(RECURRING_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecurringRow[]) : [];
  } catch {
    return [];
  }
}

/**
 * Récupère toutes les actions de l'utilisateur sur la période :
 * transactions (filtrées côté Supabase), objectifs créés, comptes ajoutés
 * et charges récurrentes (localStorage).
 */
async function fetchActivities(range: DateRange): Promise<{ items: ActivityItem[]; warnings: string[] }> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Connectez-vous pour consulter votre activité.");
  }

  const { from, to } = rangeToUtcBounds(range);

  const [txRes, goalsRes, accountsRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("transaction_date", from)
      .lt("transaction_date", to)
      .order("transaction_date", { ascending: false }),
    supabase.from("goals").select("*").eq("user_id", user.id).gte("created_at", from).lt("created_at", to),
    // Tous les comptes : nécessaires pour afficher le nom du compte de chaque transaction.
    supabase.from("accounts").select("*").eq("user_id", user.id),
  ]);

  if (txRes.error) {
    throw new Error(`Impossible de charger vos transactions (${txRes.error.message}).`);
  }

  const warnings: string[] = [];
  if (goalsRes.error) warnings.push("objectifs");
  if (accountsRes.error) warnings.push("comptes");

  const accountRows = (accountsRes.data ?? []) as AccountRow[];
  const accountNames = new Map(accountRows.map((a) => [String(a.id), a.name?.trim() || "Compte"]));

  const items = [
    ...normalizeTransactions((txRes.data ?? []) as TransactionRow[], accountNames),
    ...normalizeGoals((goalsRes.data ?? []) as GoalRow[]),
    ...normalizeAccounts(accountRows),
    ...normalizeRecurring(readRecurringFromStorage()),
  ];

  // Filtrage final par jour civil local (comptes & récurrences ne sont pas filtrés côté serveur).
  return { items: filterActivities(items, range), warnings };
}

/* ══════════════════════════════════════════════════════════════════════════
 * COMPOSANT
 * ══════════════════════════════════════════════════════════════════════════ */

export interface PeriodActivityFilterProps {
  className?: string;
}

export default function PeriodActivityFilter({ className = "" }: PeriodActivityFilterProps) {
  const today = useToday();
  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  const { currency, formatCurrency } = useCurrency();
  const fmt = (n: number) => formatCurrency(n, currency, true);

  const [preset, setPreset] = useState<PresetId>(DEFAULT_PRESET);
  const [range, setRange] = useState<DateRange>(() => getPresetRange(DEFAULT_PRESET, new Date()));
  const [draft, setDraft] = useState<DateRange>(() => getPresetRange(DEFAULT_PRESET, new Date()));
  const [submitted, setSubmitted] = useState(false);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [reloadTick, setReloadTick] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState | null>(null);
  const startInputRef = useRef<HTMLInputElement>(null);

  // ── Chargement des données ────────────────────────────────────────────────
  const requestKey = `${range.start}|${range.end}|${reloadTick}`;
  const isLoading = fetchState?.key !== requestKey;

  useEffect(() => {
    let cancelled = false;
    fetchActivities(range).then(
      ({ items, warnings }) => {
        if (!cancelled) setFetchState({ key: requestKey, items, error: null, warnings });
      },
      (err: unknown) => {
        if (cancelled) return;
        console.warn("[PeriodActivityFilter] fetch error", err);
        const message = err instanceof Error ? err.message : "Une erreur est survenue lors du chargement.";
        setFetchState({ key: requestKey, items: [], error: message, warnings: [] });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [range, requestKey]);

  // ── Validation du formulaire ──────────────────────────────────────────────
  const isRangeReversed = Boolean(draft.start && draft.end && draft.end < draft.start);
  const formError = isRangeReversed
    ? "La date de fin ne peut pas être antérieure à la date de début."
    : submitted
      ? validateRange(draft)
      : null;
  const isDirty = draft.start !== range.start || draft.end !== range.end;

  // ── Données dérivées ──────────────────────────────────────────────────────
  const items = useMemo(
    () => (fetchState && fetchState.key === requestKey ? fetchState.items : []),
    [fetchState, requestKey]
  );
  const summary = useMemo(() => summarize(items), [items]);
  const visibleItems = useMemo(
    () => (kindFilter === "all" ? items : items.filter((it) => it.kind === kindFilter)),
    [items, kindFilter]
  );
  const dayGroups = useMemo(() => groupByDay(visibleItems), [visibleItems]);
  const daysCount = countDays(range);
  const loadError = !isLoading ? fetchState?.error ?? null : null;
  const warnings = !isLoading ? fetchState?.warnings ?? [] : [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePreset = (id: PresetId) => {
    setSubmitted(false);
    if (id === "custom") {
      setPreset("custom");
      startInputRef.current?.focus();
      return;
    }
    const next = getPresetRange(id, today);
    setPreset(id);
    setDraft(next);
    setRange(next);
  };

  const handleDraftChange = (field: keyof DateRange, value: string) => {
    setPreset("custom");
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (validateRange(draft)) return;
    setSubmitted(false);
    setRange({ ...draft });
  };

  const handleExportCsv = () => {
    if (visibleItems.length === 0) return;
    const blob = new Blob([buildActivitiesCsv(visibleItems)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gestfipro_activite_${range.start}_au_${range.end}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const dayLabel = (key: string) => {
    if (key === todayKey) return "Aujourd'hui";
    if (key === yesterdayKey) return "Hier";
    return capitalize(formatKey(key, "EEEE d MMMM yyyy"));
  };

  /* ════════════════════════════════════════════════════════════════════════
   * RENDU
   * ════════════════════════════════════════════════════════════════════════ */
  return (
    <section
      id="period-activity"
      aria-labelledby="period-activity-title"
      className={`relative overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B] p-4 text-[#FAFAFA] shadow-xl shadow-black/40 sm:p-6 ${className}`}
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#EF4444]/10 blur-3xl" />

      {/* ── 1. En-tête ── */}
      <header className="relative flex flex-col gap-3 border-b border-[#27272A] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/15 text-[#EF4444]">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h3 id="period-activity-title" className="text-base font-bold tracking-tight sm:text-lg">
              Activité par période
            </h3>
            <p className="text-xs text-[#A1A1AA]">
              Tout ce que vous avez fait : dépenses, revenus, objectifs, comptes et charges récurrentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="period-activity-refresh"
            type="button"
            onClick={() => setReloadTick((n) => n + 1)}
            disabled={isLoading}
            title="Actualiser"
            aria-label="Actualiser"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#27272A] bg-[#09090B] text-[#A1A1AA] transition-all hover:border-[#3F3F46] hover:text-[#FAFAFA] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            id="period-activity-export"
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || visibleItems.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#27272A] bg-[#09090B] px-3 text-xs font-semibold text-[#A1A1AA] transition-all hover:border-[#EF4444] hover:text-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </header>

      {/* ── 2. Raccourcis de période ── */}
      <div className="relative -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            id={`period-preset-${p.id}`}
            type="button"
            onClick={() => handlePreset(p.id)}
            data-active={preset === p.id}
            className="shrink-0 rounded-full border border-[#27272A] bg-[#09090B] px-3.5 py-1.5 text-xs font-semibold text-[#A1A1AA] transition-all hover:border-[#3F3F46] hover:text-[#FAFAFA] data-[active=true]:border-[#EF4444]/60 data-[active=true]:bg-[#EF4444]/15 data-[active=true]:text-[#FAFAFA]"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── 3. Calendrier (champs date natifs) ── */}
      <form onSubmit={handleApply} noValidate className="relative mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor="period-activity-start" className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
              Date de début
            </label>
            <input
              ref={startInputRef}
              id="period-activity-start"
              type="date"
              value={draft.start}
              max={todayKey}
              onChange={(e) => handleDraftChange("start", e.target.value)}
              aria-invalid={isRangeReversed}
              className={`${dateInputClass} ${isRangeReversed ? "border-[#EF4444]/70 bg-[#EF4444]/5" : "border-[#27272A]"}`}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="period-activity-end" className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
              Date de fin
            </label>
            <input
              id="period-activity-end"
              type="date"
              value={draft.end}
              max={todayKey}
              onChange={(e) => handleDraftChange("end", e.target.value)}
              aria-invalid={isRangeReversed}
              aria-describedby={formError ? "period-activity-error" : undefined}
              className={`${dateInputClass} ${isRangeReversed ? "border-[#EF4444]/70 bg-[#EF4444]/5" : "border-[#27272A]"}`}
            />
          </div>
          <button
            id="period-activity-apply"
            type="submit"
            disabled={isRangeReversed}
            className={`col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#27272A] disabled:text-[#71717A] disabled:shadow-none sm:col-span-1 ${
              isDirty
                ? "bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/25 hover:bg-[#DC2626]"
                : "border border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
          >
            <Check className="h-4 w-4" />
            Appliquer le filtre
          </button>
        </div>

        {formError && (
          <p
            id="period-activity-error"
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2.5 text-sm font-medium text-[#FCA5A5]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
            {formError}
          </p>
        )}
      </form>

      {/* ── 4. Bandeau période + résumé ── */}
      <div className="relative mt-5 rounded-2xl border border-[#27272A] bg-[#09090B] p-4">
        <p id="period-activity-range-label" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#A1A1AA]">
          <CalendarRange className="h-3.5 w-3.5 text-[#EF4444]" />
          <span>
            Période du <span className="text-[#FAFAFA]">{formatKey(range.start, "d MMM yyyy")}</span> au{" "}
            <span className="text-[#FAFAFA]">{formatKey(range.end, "d MMM yyyy")}</span>
          </span>
          <span className="rounded-md bg-[#18181B] px-1.5 py-0.5 text-[10px] text-[#71717A]">
            {daysCount} jour{daysCount > 1 ? "s" : ""}
          </span>
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <SummaryCard
            id="period-summary-income"
            label="Revenus"
            icon={<TrendingUp className="h-4 w-4" />}
            iconClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
            value={isLoading ? null : `+${fmt(summary.income)}`}
            valueClass="text-emerald-400"
          />
          <SummaryCard
            id="period-summary-expense"
            label="Dépenses"
            icon={<TrendingDown className="h-4 w-4" />}
            iconClass="text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25"
            value={isLoading ? null : `-${fmt(summary.expense)}`}
            valueClass="text-[#EF4444]"
          />
          <SummaryCard
            id="period-summary-net"
            label="Solde net"
            icon={<Scale className="h-4 w-4" />}
            iconClass="text-[#FAFAFA] bg-[#27272A] border-[#3F3F46]"
            value={isLoading ? null : `${summary.net >= 0 ? "+" : "-"}${fmt(Math.abs(summary.net))}`}
            valueClass={summary.net >= 0 ? "text-[#FAFAFA]" : "text-[#FCA5A5]"}
          />
          <SummaryCard
            id="period-summary-count"
            label="Actions"
            icon={<Activity className="h-4 w-4" />}
            iconClass="text-sky-400 bg-sky-500/10 border-sky-500/25"
            value={isLoading ? null : String(summary.count)}
            valueClass="text-[#FAFAFA]"
          />
        </div>
      </div>

      {/* ── 5. Filtre par type d'action ── */}
      <div
        role="group"
        aria-label="Filtrer par type d'action"
        className="relative -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
      >
        {KIND_FILTERS.map((k) => {
          const count = k === "all" ? summary.count : summary.byKind[k];
          const label = k === "all" ? "Tout" : ACTIVITY_KIND_META[k].plural;
          const chipClass =
            k === "all"
              ? "data-[active=true]:bg-[#27272A] data-[active=true]:border-[#3F3F46] data-[active=true]:text-[#FAFAFA]"
              : KIND_STYLES[k].chip;
          return (
            <button
              key={k}
              id={`period-kind-${k}`}
              type="button"
              onClick={() => setKindFilter(k)}
              data-active={kindFilter === k}
              aria-pressed={kindFilter === k}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-1.5 text-xs font-semibold text-[#A1A1AA] transition-all hover:text-[#FAFAFA] ${chipClass} ${
                count === 0 && kindFilter !== k ? "opacity-50" : ""
              }`}
            >
              {k !== "all" && <span className={`h-1.5 w-1.5 rounded-full ${KIND_STYLES[k].dot}`} />}
              {label}
              <span className="rounded-md bg-black/30 px-1.5 text-[10px] tabular-nums">{isLoading ? "…" : count}</span>
            </button>
          );
        })}
      </div>

      {warnings.length > 0 && (
        <p className="relative mt-3 text-[11px] text-amber-400/90">
          Certaines données n&apos;ont pas pu être chargées ({warnings.join(", ")}). Les autres actions restent affichées.
        </p>
      )}

      {/* ── 6. Chronologie ── */}
      <div id="period-activity-list" className="relative mt-4" aria-live="polite" aria-busy={isLoading}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-[#27272A] bg-[#09090B]/60 p-3.5">
                <div className="h-10 w-10 rounded-xl bg-[#27272A]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-[#27272A]" />
                  <div className="h-2.5 w-1/3 rounded bg-[#27272A]/70" />
                </div>
                <div className="h-3 w-16 rounded bg-[#27272A]" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-10 text-center">
            <AlertCircle className="h-7 w-7 text-[#EF4444]" />
            <p className="text-sm font-semibold text-[#FCA5A5]">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadTick((n) => n + 1)}
              className="rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-1.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#27272A]"
            >
              Réessayer
            </button>
          </div>
        ) : dayGroups.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-[#27272A] bg-[#09090B]/30 px-4 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#27272A] bg-[#09090B] text-[#52525B]">
              <SearchX className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[#A1A1AA]">
              {kindFilter === "all"
                ? "Aucune activité sur cette période"
                : `Aucun(e) ${ACTIVITY_KIND_META[kindFilter].label.toLowerCase()} sur cette période`}
            </p>
            <p className="max-w-sm text-xs text-[#71717A]">
              Essayez d&apos;élargir les dates ou choisissez un autre raccourci (ex. « Ce mois-ci »).
            </p>
          </div>
        ) : (
          <ol className="space-y-5">
            {dayGroups.map((group) => (
              <li key={group.dateKey}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-[#FAFAFA]">{dayLabel(group.dateKey)}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#71717A]">
                    <span>
                      {group.items.length} action{group.items.length > 1 ? "s" : ""}
                    </span>
                    {group.net !== 0 && (
                      <span className={`font-bold tabular-nums ${group.net > 0 ? "text-emerald-400" : "text-[#FCA5A5]"}`}>
                        {group.net > 0 ? "+" : "-"}
                        {fmt(Math.abs(group.net))}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 border-l border-[#27272A] pl-3 sm:pl-4">
                  {group.items.map((it) => (
                    <ActivityRow key={it.id} item={it} fmt={fmt} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * SOUS-COMPOSANTS
 * ══════════════════════════════════════════════════════════════════════════ */

function SummaryCard({
  id,
  label,
  icon,
  iconClass,
  value,
  valueClass,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  iconClass: string;
  value: string | null;
  valueClass: string;
}) {
  return (
    <div id={id} className="rounded-xl border border-[#27272A] bg-[#18181B] p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${iconClass}`}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">{label}</span>
      </div>
      {value === null ? (
        <div className="mt-2.5 h-5 w-3/4 animate-pulse rounded bg-[#27272A]" />
      ) : (
        <p className={`mt-2 truncate text-base font-black tracking-tight tabular-nums sm:text-lg ${valueClass}`} title={value}>
          {value}
        </p>
      )}
    </div>
  );
}

function ActivityRow({ item, fmt }: { item: ActivityItem; fmt: (n: number) => string }) {
  const style = KIND_STYLES[item.kind];
  const time = item.hasTime ? format(new Date(item.occurredAt), "HH:mm") : null;
  const amountClass =
    item.amountTone === "positive"
      ? "text-emerald-400"
      : item.amountTone === "negative"
        ? "text-[#FAFAFA]"
        : "text-[#A1A1AA]";
  const sign = item.amountTone === "positive" ? "+" : item.amountTone === "negative" ? "-" : "";

  return (
    <li
      data-kind={item.kind}
      className="group relative flex items-center justify-between gap-3 rounded-xl border border-[#27272A] bg-[#09090B]/70 p-3 transition-all hover:border-[#3F3F46]"
    >
      <span aria-hidden className={`absolute -left-[17px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ring-4 ring-[#18181B] sm:-left-[21px] ${style.dot}`} />
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${style.box}`}>
          {item.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-[#FAFAFA] sm:text-sm">{item.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#A1A1AA]">
            <span className="font-semibold text-[#D4D4D8]">{ACTIVITY_KIND_META[item.kind].label}</span>
            {item.subtitle ? ` · ${item.subtitle}` : ""}
            {time ? ` · ${time}` : ""}
          </p>
        </div>
      </div>
      {item.amount !== null && (
        <div className="shrink-0 text-right">
          <span className={`block text-xs font-black tabular-nums sm:text-sm ${amountClass}`}>
            {sign}
            {fmt(item.amount)}
          </span>
          {item.amountSuffix && <span className="block text-[10px] text-[#71717A]">{item.amountSuffix}</span>}
        </div>
      )}
    </li>
  );
}
