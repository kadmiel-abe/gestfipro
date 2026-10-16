"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";

// ─── Données factices (Mock Data par défaut : 6 derniers mois en FCFA) ────────
export interface MonthExpenseItem {
  month: string;
  amount: number;
}

export const mockMonthlyExpenses: MonthExpenseItem[] = [
  { month: "Jan", amount: 185000 },
  { month: "Fév", amount: 142000 },
  { month: "Mar", amount: 235000 },
  { month: "Avr", amount: 178000 },
  { month: "Mai", amount: 210000 },
  { month: "Juin", amount: 165000 },
];

export interface MonthlyComparisonChartProps {
  /** Données personnalisées optionnelles (mois et montant) */
  data?: MonthExpenseItem[];
  /** Transactions réelles optionnelles pour calcul dynamique automatique */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions?: any[];
  /** Devise d'affichage (défaut : "FCFA") */
  currency?: string;
}

// ─── Tooltip personnalisé Dark Mode Premium ─────────────────────────────────
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload?: MonthExpenseItem }>;
  label?: string;
  currency: string;
}

function CustomChartTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0].value ?? 0;

  return (
    <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-3 shadow-2xl min-w-[140px]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
        {label || payload[0].payload?.month}
      </p>
      <p className="text-sm font-extrabold text-[#FAFAFA]">
        {value.toLocaleString("fr-FR")} {currency}
      </p>
    </div>
  );
}

// ─── Composant principal MonthlyComparisonChart ──────────────────────────────
export default function MonthlyComparisonChart({
  data,
  transactions,
  currency = "FCFA",
}: MonthlyComparisonChartProps) {
  // Garde-fou d'hydratation côté client pour Next.js App Router (Recharts)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Détermination des données à afficher :
  // 1. data explicite si fournie
  // 2. agrégation dynamique si transactions fournies
  // 3. sinon mockData par défaut (6 mois)
  const chartData = useMemo<MonthExpenseItem[]>(() => {
    if (data && data.length > 0) return data;

    if (transactions && transactions.length > 0) {
      const expenses = transactions.filter(
        (t) => t.type === "expense" || Number(t.amount) < 0
      );

      if (expenses.length > 0) {
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        const now = new Date();
        const map: Record<string, number> = {};
        const keys: { key: string; label: string }[] = [];

        // Préparer les 6 derniers mois
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          map[key] = 0;
          keys.push({ key, label: monthNames[d.getMonth()] });
        }

        // Cumuler les montants
        for (const t of expenses) {
          const rawDate = t.transaction_date || t.created_at || t.date;
          const d = new Date(rawDate);
          if (isNaN(d.getTime())) continue;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (key in map) {
            map[key] += Math.abs(Number(t.amount));
          }
        }

        return keys.map((k) => ({
          month: k.label,
          amount: Math.round(map[k.key]),
        }));
      }
    }

    return mockMonthlyExpenses;
  }, [data, transactions]);

  // Calcul de la tendance entre le dernier mois et le mois précédent
  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const current = chartData[chartData.length - 1].amount;
    const prev = chartData[chartData.length - 2].amount;
    if (prev <= 0) return null;
    const pct = ((current - prev) / prev) * 100;
    return {
      percent: Math.abs(Math.round(pct)),
      isIncrease: pct > 0,
    };
  }, [chartData]);

  // Total des 6 mois
  const totalAmount = useMemo(() => {
    return chartData.reduce((acc, item) => acc + item.amount, 0);
  }, [chartData]);

  return (
    <div className="w-full">
      {/* ── Card Shadcn UI Dark Mode Premium ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#18181B] border border-[#27272A] p-5 sm:p-6 shadow-xl shadow-black/40">
        {/* Halo discret en arrière-plan */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#EF4444]/5 blur-3xl" />

        {/* ── En-tête de la Card ───────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Icône BarChart3 stylisée */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FAFAFA] tracking-tight">
                Évolution des dépenses
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Comparaison mois par mois
              </p>
            </div>
          </div>

          {/* Badge tendance dynamique */}
          {trend && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                trend.isIncrease
                  ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {trend.isIncrease ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{trend.percent}% vs mois préc.</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-{trend.percent}% vs mois préc.</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Graphique Recharts BarChart ─────────────────────────────────── */}
        <div className="w-full h-64 sm:h-72">
          {!isMounted ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#71717A]">
              Chargement du graphique…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barCategoryGap="25%"
              >
                {/* Grille discrète */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272A"
                  vertical={false}
                />

                {/* Axe X (Mois) */}
                <XAxis
                  dataKey="month"
                  stroke="#A1A1AA"
                  tick={{ fill: "#A1A1AA", fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: "#27272A" }}
                />

                {/* Axe Y (Montants abrégés) */}
                <YAxis
                  stroke="#A1A1AA"
                  tick={{ fill: "#A1A1AA", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${Math.round(val / 1000)}k`;
                    return `${val}`;
                  }}
                  width={42}
                />

                {/* Tooltip personnalisé */}
                <Tooltip
                  content={<CustomChartTooltip currency={currency} />}
                  cursor={{ fill: "rgba(239, 68, 68, 0.06)", radius: 6 }}
                />

                {/* Barres de dépenses avec radius [4, 4, 0, 0] */}
                <Bar
                  dataKey="amount"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Pied de carte : Total cumulé ───────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-[#27272A] flex items-center justify-between text-xs">
          <span className="text-[#A1A1AA]">Total sur la période (6 mois)</span>
          <span className="text-sm font-extrabold text-[#FAFAFA]">
            {totalAmount.toLocaleString("fr-FR")} {currency}
          </span>
        </div>
      </div>
    </div>
  );
}
