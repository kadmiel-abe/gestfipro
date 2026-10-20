// Tests unitaires — « Activité par période » (Historique)
// Lancement : npm test   (Node ≥ 22.18 / 23.6 : import direct des fichiers .ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
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
  sortActivities,
  summarize,
  validateRange,
  valueToDateKey,
} from "../lib/activity-period.ts";

/** Horodatage ISO correspondant à une heure LOCALE donnée (indépendant du fuseau de la machine). */
const localIso = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

// ── Jeu de données représentatif ────────────────────────────────────────────
const accountNames = new Map([["acc-wave", "Wave"]]);

const transactions = normalizeTransactions(
  [
    { id: 1, title: "Garba", category: "Nourriture", amount: 1500, type: "expense", transaction_date: localIso(2026, 10, 14, 13, 5), account_id: "acc-wave" },
    { id: 2, title: "Salaire", category: "Salaire", amount: 350000, type: "income", transaction_date: localIso(2026, 10, 15, 9) },
    { id: 3, title: "Taxi", category: "Transport", amount: "2000", type: "expense", transaction_date: localIso(2026, 10, 15, 18, 30) },
    { id: 4, title: "Ancienne dépense", amount: 9000, type: "expense", transaction_date: localIso(2026, 9, 30) },
    { id: 5, note: "Dépense en négatif", amount: -500, type: "expense", transaction_date: "2026-10-20" },
    { id: 6, title: "Sans date", amount: 100, type: "expense", transaction_date: null },
  ],
  accountNames
);
const goals = normalizeGoals([{ id: "g1", title: "Moto", target_amount: 600000, target_date: "2026-12-31", created_at: localIso(2026, 10, 15, 10) }]);
const accounts = normalizeAccounts([{ id: "a1", name: "Orange Money", type: "mobile_money", created_at: localIso(2026, 10, 1, 8) }]);
const recurring = normalizeRecurring([
  { id: `rec-${new Date(2026, 9, 16, 11).getTime()}`, name: "Loyer", amount: 75000, category: "Logement", dayOfMonth: 5 },
  { id: "rec-invalide", name: "Ignorée" },
]);
const all = [...transactions, ...goals, ...accounts, ...recurring];

// ── Dates ───────────────────────────────────────────────────────────────────
test("parseDateKey rejette les dates impossibles", () => {
  assert.ok(parseDateKey("2026-10-20"));
  assert.equal(parseDateKey("2026-02-30"), null);
  assert.equal(parseDateKey("20/10/2026"), null);
});

test("valueToDateKey conserve les colonnes DATE et convertit les horodatages en jour local", () => {
  assert.equal(valueToDateKey("2026-10-20"), "2026-10-20");
  assert.equal(valueToDateKey(localIso(2026, 10, 20, 23, 59)), "2026-10-20");
  assert.equal(valueToDateKey(localIso(2026, 10, 20, 0, 1)), "2026-10-20");
  assert.equal(valueToDateKey(null), null);
  assert.equal(valueToDateKey("pas une date"), null);
});

test("getPresetRange calcule les raccourcis par rapport à aujourd'hui", () => {
  const today = new Date(2026, 9, 20, 15, 0); // 20 oct. 2026
  assert.deepEqual(getPresetRange("today", today), { start: "2026-10-20", end: "2026-10-20" });
  assert.deepEqual(getPresetRange("last7", today), { start: "2026-10-14", end: "2026-10-20" });
  assert.deepEqual(getPresetRange("thisMonth", today), { start: "2026-10-01", end: "2026-10-20" });
  assert.deepEqual(getPresetRange("lastMonth", today), { start: "2026-09-01", end: "2026-09-30" });
  // Passage d'année
  assert.deepEqual(getPresetRange("lastMonth", new Date(2027, 0, 10)), { start: "2026-12-01", end: "2026-12-31" });
});

test("validateRange signale clairement une date de fin antérieure au début", () => {
  assert.equal(validateRange({ start: "2026-10-01", end: "2026-10-20" }), null);
  assert.equal(validateRange({ start: "2026-10-20", end: "2026-10-20" }), null);
  assert.match(validateRange({ start: "2026-10-20", end: "2026-10-01" }), /antérieure/);
  assert.match(validateRange({ start: "", end: "2026-10-01" }), /choisir/);
  assert.match(validateRange({ start: "2026-02-30", end: "2026-03-01" }), /invalide/);
});

test("rangeToUtcBounds couvre la journée locale entière (fin exclue au lendemain)", () => {
  const { from, to } = rangeToUtcBounds({ start: "2026-10-14", end: "2026-10-20" });
  assert.equal(from, new Date(2026, 9, 14).toISOString());
  assert.equal(to, new Date(2026, 9, 21).toISOString());
});

test("countDays inclut les deux bornes", () => {
  assert.equal(countDays({ start: "2026-10-14", end: "2026-10-20" }), 7);
  assert.equal(countDays({ start: "2026-10-20", end: "2026-10-20" }), 1);
});

// ── Normalisation ───────────────────────────────────────────────────────────
test("normalizeTransactions : type, montant absolu, compte et lignes sans date ignorées", () => {
  assert.equal(transactions.length, 5);
  const garba = transactions.find((t) => t.id === "tx-1");
  assert.equal(garba.kind, "expense");
  assert.equal(garba.amountTone, "negative");
  assert.equal(garba.subtitle, "Nourriture · Wave");
  const taxi = transactions.find((t) => t.id === "tx-3");
  assert.equal(taxi.amount, 2000); // NUMERIC renvoyé en string
  const neg = transactions.find((t) => t.id === "tx-5");
  assert.equal(neg.amount, 500);
  assert.equal(neg.title, "Dépense en négatif");
  assert.equal(neg.hasTime, false);
});

test("normalizeRecurring lit la date de création depuis l'identifiant rec-<timestamp>", () => {
  assert.equal(recurring.length, 1);
  assert.equal(recurring[0].dateKey, "2026-10-16");
  assert.equal(recurring[0].amountSuffix, "/ mois");
});

// ── Filtrage & agrégation ───────────────────────────────────────────────────
test("filterActivities garde uniquement la période, tous types confondus", () => {
  const range = { start: "2026-10-14", end: "2026-10-20" };
  const inRange = filterActivities(all, range);
  assert.deepEqual(
    sortActivities(inRange).map((i) => i.id),
    ["tx-5", recurring[0].id, "tx-3", "goal-g1", "tx-2", "tx-1"]
  );
  // Exclus : dépense du 30/09 et compte créé le 01/10
  assert.ok(!inRange.some((i) => i.id === "tx-4" || i.id === "acc-a1"));
});

test("filterActivities par type", () => {
  const range = { start: "2026-10-01", end: "2026-10-31" };
  assert.equal(filterActivities(all, range, "expense").length, 3);
  assert.equal(filterActivities(all, range, "income").length, 1);
  assert.equal(filterActivities(all, range, "account").length, 1);
});

test("summarize : totaux revenus/dépenses/solde et compteurs par type", () => {
  const s = summarize(filterActivities(all, { start: "2026-10-14", end: "2026-10-20" }));
  assert.equal(s.income, 350000);
  assert.equal(s.expense, 1500 + 2000 + 500);
  assert.equal(s.net, 350000 - 4000);
  assert.equal(s.count, 6);
  assert.deepEqual(s.byKind, { expense: 3, income: 1, goal: 1, account: 0, recurring: 1 });
});

test("groupByDay regroupe par jour (plus récent d'abord) avec le solde du jour", () => {
  const groups = groupByDay(filterActivities(all, { start: "2026-10-14", end: "2026-10-20" }));
  assert.deepEqual(groups.map((g) => g.dateKey), ["2026-10-20", "2026-10-16", "2026-10-15", "2026-10-14"]);
  const oct15 = groups.find((g) => g.dateKey === "2026-10-15");
  assert.equal(oct15.items.length, 3); // salaire, objectif, taxi
  assert.equal(oct15.net, 350000 - 2000); // l'objectif n'impacte pas le solde
  assert.deepEqual(oct15.items.map((i) => i.id), ["tx-3", "goal-g1", "tx-2"]); // 18:30, 10:00, 09:00
});

test("buildActivitiesCsv produit un CSV Excel-compatible avec signes", () => {
  const csv = buildActivitiesCsv(filterActivities(all, { start: "2026-10-15", end: "2026-10-15" }));
  assert.ok(csv.startsWith("\uFEFF"));
  const lines = csv.slice(1).split("\r\n");
  assert.equal(lines.length, 4);
  assert.match(lines[0], /"Date";"Heure";"Type"/);
  assert.ok(lines.some((l) => l.includes('"Revenu"') && l.includes('"+350000"')));
  assert.ok(lines.some((l) => l.includes('"Dépense"') && l.includes('"-2000"')));
});
