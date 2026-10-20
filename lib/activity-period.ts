/**
 * Logique « Activité par période » (Historique) — module pur, sans dépendance.
 *
 * Agrège toutes les actions de l'utilisateur (dépenses, revenus, objectifs créés,
 * comptes ajoutés, charges récurrentes) dans une chronologie unique, filtrable
 * par une plage de dates civiles locales (bornes incluses, format YYYY-MM-DD).
 *
 * Volontairement sans import : testable directement avec `node --test`.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type ActivityKind = "expense" | "income" | "goal" | "account" | "recurring";

export type AmountTone = "positive" | "negative" | "neutral";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  icon: string;
  /** Montant en devise de base (XOF), toujours positif ; `null` si non pertinent. */
  amount: number | null;
  amountTone: AmountTone;
  /** Suffixe affiché après le montant (ex: "/ mois"). */
  amountSuffix?: string;
  /** Horodatage ISO d'origine (sert au tri et à l'affichage de l'heure). */
  occurredAt: string;
  /** Date civile locale YYYY-MM-DD (sert au filtrage et au regroupement). */
  dateKey: string;
  /** Vrai si `occurredAt` porte une heure significative. */
  hasTime: boolean;
}

/** Plage de dates civiles, bornes incluses, au format YYYY-MM-DD. */
export interface DateRange {
  start: string;
  end: string;
}

export type PresetId = "today" | "last7" | "thisMonth" | "lastMonth" | "custom";

export interface ActivitySummary {
  income: number;
  expense: number;
  net: number;
  count: number;
  byKind: Record<ActivityKind, number>;
}

export interface DayGroup {
  dateKey: string;
  items: ActivityItem[];
  /** Revenus − dépenses du jour. */
  net: number;
}

export const ACTIVITY_KIND_META: Record<ActivityKind, { label: string; plural: string; icon: string }> = {
  expense: { label: "Dépense", plural: "Dépenses", icon: "💸" },
  income: { label: "Revenu", plural: "Revenus", icon: "💰" },
  goal: { label: "Objectif", plural: "Objectifs", icon: "🎯" },
  account: { label: "Compte", plural: "Comptes", icon: "🏦" },
  recurring: { label: "Charge récurrente", plural: "Récurrences", icon: "🔁" },
};

export const PRESETS: ReadonlyArray<{ id: PresetId; label: string }> = [
  { id: "today", label: "Aujourd'hui" },
  { id: "last7", label: "7 derniers jours" },
  { id: "thisMonth", label: "Ce mois-ci" },
  { id: "lastMonth", label: "Mois dernier" },
  { id: "custom", label: "Personnalisé" },
];

// ── Dates ───────────────────────────────────────────────────────────────────

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Date → "YYYY-MM-DD" selon le calendrier local. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → Date locale à minuit (ou `null` si invalide, ex: 2026-02-30). */
export function parseDateKey(key: string): Date | null {
  const match = DATE_KEY_RE.exec(key);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  const date = new Date(y, m, d);
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d ? date : null;
}

/**
 * Date civile locale d'une valeur Supabase :
 * - "YYYY-MM-DD" (colonne DATE) est conservée telle quelle ;
 * - un horodatage ISO est converti dans le fuseau local.
 */
export function valueToDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  if (DATE_KEY_RE.test(value)) return parseDateKey(value) ? value : null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : toDateKey(parsed);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Nombre de jours couverts par la plage (bornes incluses). */
export function countDays(range: DateRange): number {
  const start = parseDateKey(range.start);
  const end = parseDateKey(range.end);
  if (!start || !end) return 0;
  const ms = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round(ms / 86_400_000) + 1;
}

/** Plage correspondant à un raccourci, calculée par rapport à `today`. */
export function getPresetRange(preset: Exclude<PresetId, "custom">, today: Date): DateRange {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  switch (preset) {
    case "today":
      return { start: toDateKey(t), end: toDateKey(t) };
    case "last7":
      return { start: toDateKey(addDays(t, -6)), end: toDateKey(t) };
    case "thisMonth":
      return { start: toDateKey(new Date(t.getFullYear(), t.getMonth(), 1)), end: toDateKey(t) };
    case "lastMonth":
      return {
        start: toDateKey(new Date(t.getFullYear(), t.getMonth() - 1, 1)),
        end: toDateKey(new Date(t.getFullYear(), t.getMonth(), 0)),
      };
  }
}

/** Retourne un message d'erreur lisible, ou `null` si la plage est valide. */
export function validateRange(range: DateRange): string | null {
  if (!range.start || !range.end) {
    return "Veuillez choisir une date de début et une date de fin.";
  }
  if (!parseDateKey(range.start) || !parseDateKey(range.end)) {
    return "Une des dates saisies est invalide.";
  }
  if (range.end < range.start) {
    return "La date de fin ne peut pas être antérieure à la date de début.";
  }
  return null;
}

/**
 * Bornes UTC pour une requête Supabase sur une colonne TIMESTAMPTZ :
 * `from` = minuit local du jour de début (inclus), `to` = minuit local du
 * lendemain du jour de fin (exclu) → `.gte(col, from).lt(col, to)`.
 */
export function rangeToUtcBounds(range: DateRange): { from: string; to: string } {
  const start = parseDateKey(range.start);
  const end = parseDateKey(range.end);
  if (!start || !end) throw new Error(`Plage invalide : ${range.start} → ${range.end}`);
  return { from: start.toISOString(), to: addDays(end, 1).toISOString() };
}

export function isInRange(dateKey: string, range: DateRange): boolean {
  return dateKey >= range.start && dateKey <= range.end;
}

// ── Normalisation des sources ───────────────────────────────────────────────

export interface TransactionRow {
  id: string | number;
  title?: string | null;
  note?: string | null;
  category?: string | null;
  amount: number | string | null;
  type?: string | null;
  transaction_date?: string | null;
  created_at?: string | null;
  account_id?: string | number | null;
}

export interface GoalRow {
  id: string | number;
  title?: string | null;
  target_amount?: number | string | null;
  target_date?: string | null;
  created_at?: string | null;
}

export interface AccountRow {
  id: string | number;
  name?: string | null;
  type?: string | null;
  created_at?: string | null;
}

export interface RecurringRow {
  id: string;
  name?: string;
  amount?: number;
  category?: string;
  dayOfMonth?: number;
  createdAt?: string;
}

function hasMeaningfulTime(value: string): boolean {
  return !DATE_KEY_RE.test(value);
}

function toAmount(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

export function normalizeTransactions(
  rows: TransactionRow[],
  accountNames: Map<string, string> = new Map()
): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const row of rows) {
    const occurredAt = row.transaction_date || row.created_at || "";
    const dateKey = valueToDateKey(occurredAt);
    if (!dateKey) continue;

    // Le champ `type` fait foi ; à défaut, un montant positif est un revenu.
    const isIncome = row.type ? row.type === "income" : Number(row.amount) > 0;
    const kind: ActivityKind = isIncome ? "income" : "expense";
    const account = row.account_id != null ? accountNames.get(String(row.account_id)) : undefined;
    const category = row.category?.trim() || "Divers";

    items.push({
      id: `tx-${row.id}`,
      kind,
      title: row.title?.trim() || row.note?.trim() || (isIncome ? "Revenu" : "Dépense"),
      subtitle: [category, account].filter(Boolean).join(" · "),
      icon: ACTIVITY_KIND_META[kind].icon,
      amount: toAmount(row.amount),
      amountTone: isIncome ? "positive" : "negative",
      occurredAt,
      dateKey,
      hasTime: hasMeaningfulTime(occurredAt),
    });
  }
  return items;
}

export function normalizeGoals(rows: GoalRow[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const row of rows) {
    const occurredAt = row.created_at || "";
    const dateKey = valueToDateKey(occurredAt);
    if (!dateKey) continue;
    const deadline = valueToDateKey(row.target_date ?? null);
    items.push({
      id: `goal-${row.id}`,
      kind: "goal",
      title: `Objectif créé : ${row.title?.trim() || "Sans titre"}`,
      subtitle: deadline ? `Échéance le ${deadline.split("-").reverse().join("/")}` : "Objectif d'épargne",
      icon: ACTIVITY_KIND_META.goal.icon,
      amount: toAmount(row.target_amount),
      amountTone: "neutral",
      amountSuffix: "visés",
      occurredAt,
      dateKey,
      hasTime: hasMeaningfulTime(occurredAt),
    });
  }
  return items;
}

export function normalizeAccounts(rows: AccountRow[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const row of rows) {
    const occurredAt = row.created_at || "";
    const dateKey = valueToDateKey(occurredAt);
    if (!dateKey) continue;
    items.push({
      id: `acc-${row.id}`,
      kind: "account",
      title: `Compte ajouté : ${row.name?.trim() || "Compte"}`,
      subtitle: row.type ? `Type : ${row.type}` : "Nouveau compte",
      icon: ACTIVITY_KIND_META.account.icon,
      amount: null,
      amountTone: "neutral",
      occurredAt,
      dateKey,
      hasTime: hasMeaningfulTime(occurredAt),
    });
  }
  return items;
}

/**
 * Charges récurrentes (stockées en localStorage). La date de création provient
 * de `createdAt` si présent, sinon de l'identifiant `rec-<timestamp>`.
 */
export function normalizeRecurring(rows: RecurringRow[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const row of rows) {
    let occurredAt = row.createdAt || "";
    if (!occurredAt) {
      const ts = /^rec-(\d{12,})$/.exec(row.id ?? "");
      if (ts) occurredAt = new Date(Number(ts[1])).toISOString();
    }
    const dateKey = valueToDateKey(occurredAt);
    if (!dateKey) continue;
    items.push({
      id: `rec-item-${row.id}`,
      kind: "recurring",
      title: `Charge récurrente ajoutée : ${row.name?.trim() || "Sans nom"}`,
      subtitle: [row.category, row.dayOfMonth ? `prélevée le ${row.dayOfMonth} du mois` : null]
        .filter(Boolean)
        .join(" · "),
      icon: ACTIVITY_KIND_META.recurring.icon,
      amount: toAmount(row.amount),
      amountTone: "neutral",
      amountSuffix: "/ mois",
      occurredAt,
      dateKey,
      hasTime: true,
    });
  }
  return items;
}

// ── Agrégation ──────────────────────────────────────────────────────────────

/** Tri antichronologique (plus récent d'abord), stable sur l'identifiant. */
export function sortActivities(items: ActivityItem[]): ActivityItem[] {
  return [...items].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? 1 : -1;
    const ta = new Date(a.occurredAt).getTime() || 0;
    const tb = new Date(b.occurredAt).getTime() || 0;
    if (ta !== tb) return tb - ta;
    return a.id.localeCompare(b.id);
  });
}

export function filterActivities(
  items: ActivityItem[],
  range: DateRange,
  kind: ActivityKind | "all" = "all"
): ActivityItem[] {
  return items.filter((it) => isInRange(it.dateKey, range) && (kind === "all" || it.kind === kind));
}

export function summarize(items: ActivityItem[]): ActivitySummary {
  const byKind: Record<ActivityKind, number> = { expense: 0, income: 0, goal: 0, account: 0, recurring: 0 };
  let income = 0;
  let expense = 0;
  for (const it of items) {
    byKind[it.kind] += 1;
    if (it.kind === "income") income += it.amount ?? 0;
    if (it.kind === "expense") expense += it.amount ?? 0;
  }
  return { income, expense, net: income - expense, count: items.length, byKind };
}

export function groupByDay(items: ActivityItem[]): DayGroup[] {
  const groups = new Map<string, ActivityItem[]>();
  for (const it of sortActivities(items)) {
    const list = groups.get(it.dateKey);
    if (list) list.push(it);
    else groups.set(it.dateKey, [it]);
  }
  return [...groups.entries()].map(([dateKey, list]) => ({
    dateKey,
    items: list,
    net: list.reduce(
      (sum, it) => sum + (it.kind === "income" ? it.amount ?? 0 : it.kind === "expense" ? -(it.amount ?? 0) : 0),
      0
    ),
  }));
}

/** Export CSV (séparateur « ; », BOM UTF-8 pour Excel). Montants en devise de base. */
export function buildActivitiesCsv(items: ActivityItem[]): string {
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '""';
    const str = String(v);
    if (str.length === 0) return '""';
    const trimmed = str.trimStart();
    const isPureNumber = /^[+-]?\d+(\.\d+)?$/.test(trimmed);
    const DANGEROUS = ["=", "+", "-", "@", "\t", "\r", ";"];
    const safeStr = !isPureNumber && DANGEROUS.some((c) => trimmed.startsWith(c)) ? "'" + str : str;
    return `"${safeStr.replace(/"/g, '""')}"`;
  };
  const header = ["Date", "Heure", "Type", "Libellé", "Détails", "Montant (FCFA)"];
  const rows = sortActivities(items).map((it) => {
    const time = it.hasTime ? new Date(it.occurredAt).toTimeString().slice(0, 5) : "";
    const sign = it.amountTone === "positive" ? "+" : it.amountTone === "negative" ? "-" : "";
    return [
      it.dateKey,
      time,
      ACTIVITY_KIND_META[it.kind].label,
      it.title,
      it.subtitle,
      it.amount == null ? "" : `${sign}${it.amount}`,
    ].map(escape).join(";");
  });
  return "\uFEFF" + [header.map(escape).join(";"), ...rows].join("\r\n");
}
