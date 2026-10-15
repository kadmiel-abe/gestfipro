"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import {
  useLanguage,
  formatCurrencyValue,
  convertFromBase,
  Currency,
  getCurrencyMeta,
} from "@/lib/i18n/LanguageContext";

// ─── Types ──────────────────────────────────────────────────────────────────
interface MonthData {
  month: string;
  amount: number;
}

interface MonthlyComparisonChartProps {
  /** Transactions brutes de Supabase — si fournies, le graphique les agrège automatiquement */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions?: any[];
  /** Devise utilisée (par défaut XOF / FCFA) */
  currency?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload?: MonthData }>;
  label?: string;
  currency: string;
}

// ─── Mois français / anglais ────────────────────────────────────────────────
const MONTH_LABELS_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];
const MONTH_LABELS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ─── Mock data (utilisé si aucune transaction n'est passée) ─────────────────
const MOCK_DATA: MonthData[] = [
  { month: "Jan", amount: 185000 },
  { month: "Fév", amount: 142000 },
  { month: "Mar", amount: 235000 },
  { month: "Avr", amount: 178000 },
  { month: "Mai", amount: 210000 },
  { month: "Juin", amount: 165000 },
];

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  const monthLabel = payload[0].payload?.month ?? "";
  const isEn =
    typeof document !== "undefined" && document.documentElement.lang === "en";
  const locale = isEn ? "en-US" : "fr-FR";

  return (
    <div
      style={{
        background: "#18181B",
        border: "1px solid #27272A",
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 12,
        boxShadow: "0 12px 30px -8px rgba(0,0,0,0.6)",
        minWidth: 140,
      }}
    >
      <p
        style={{
          color: "#A1A1AA",
          marginBottom: 6,
          fontWeight: 600,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {monthLabel}
      </p>
      <p
        style={{
          color: "#FAFAFA",
          fontWeight: 800,
          fontSize: 16,
          margin: 0,
        }}
      >
        {formatCurrencyValue(
          Number(value),
          currency as Currency,
          locale,
          true
        )}
      </p>
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────
export default function MonthlyComparisonChart({
  transactions = [],
  currency = "XOF",
}: MonthlyComparisonChartProps) {
  const { isEn } = useLanguage();
  const currencyMeta = getCurrencyMeta(currency as Currency);

  // Agréger les dépenses par mois sur les 6 derniers mois, ou utiliser le mock
  const chartData = useMemo<MonthData[]>(() => {
    const expenseList = transactions.filter(
      (t) => t.type === "expense" || Number(t.amount) < 0
    );

    if (expenseList.length === 0) return MOCK_DATA;

    const labels = isEn ? MONTH_LABELS_EN : MONTH_LABELS_FR;
    const now = new Date();
    const monthlyMap: Record<string, number> = {};
    const monthKeys: string[] = [];

    // Préparer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = 0;
      monthKeys.push(key);
    }

    // Cumuler les dépenses
    for (const t of expenseList) {
      const date = new Date(t.transaction_date || t.created_at);
      if (isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyMap) {
        monthlyMap[key] += Math.abs(Number(t.amount));
      }
    }

    return monthKeys.map((key) => {
      const monthIndex = parseInt(key.split("-")[1], 10) - 1;
      return {
        month: labels[monthIndex],
        amount: monthlyMap[key],
      };
    });
  }, [transactions, isEn]);

  // Calculer la tendance (variation mois courant vs mois précédent)
  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const current = chartData[chartData.length - 1].amount;
    const previous = chartData[chartData.length - 2].amount;
    if (previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    return { value: Math.abs(pct), isUp: pct > 0 };
  }, [chartData]);

  // Trouver le mois avec le plus de dépenses pour le mettre en surbrillance
  const maxAmount = useMemo(
    () => Math.max(...chartData.map((d) => d.amount)),
    [chartData]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        background: "var(--bg-card, #18181B)",
        border: "1px solid var(--border, #27272A)",
        borderRadius: 16,
        padding: "20px 20px 12px",
        width: "100%",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icône avec fond accent */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--accent-muted, rgba(239, 68, 68, 0.12))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart3
              style={{ width: 18, height: 18, color: "var(--accent, #EF4444)" }}
            />
          </div>
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary, #FAFAFA)",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {isEn ? "Spending Evolution" : "Évolution des dépenses"}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted, #A1A1AA)",
                margin: 0,
                marginTop: 2,
              }}
            >
              {isEn
                ? "Month-by-month comparison"
                : "Comparaison mois par mois"}
            </p>
          </div>
        </div>

        {/* Badge tendance */}
        {trend && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: trend.isUp
                ? "rgba(239, 68, 68, 0.12)"
                : "rgba(34, 197, 94, 0.12)",
              color: trend.isUp ? "#EF4444" : "#22C55E",
            }}
          >
            {trend.isUp ? (
              <TrendingUp style={{ width: 14, height: 14 }} />
            ) : (
              <TrendingDown style={{ width: 14, height: 14 }} />
            )}
            {trend.value.toFixed(1)}%
          </div>
        )}
      </div>

      {/* ── Bar Chart ──────────────────────────────────────────────────── */}
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient
                id="barGradientMuted"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.25} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--border, #27272A)"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{
                fill: "var(--text-muted, #A1A1AA)",
                fontSize: 11,
                fontWeight: 600,
              }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tick={{
                fill: "var(--text-muted, #A1A1AA)",
                fontSize: 10,
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const cv = convertFromBase(Number(v), currency as Currency);
                return cv >= 1000000
                  ? `${(cv / 1000000).toFixed(1)}M`
                  : cv >= 1000
                    ? `${(cv / 1000).toFixed(0)}k`
                    : String(Math.round(cv));
              }}
              width={42}
            />

            <Tooltip
              content={<ChartTooltip currency={currency} />}
              cursor={{
                fill: "rgba(239, 68, 68, 0.06)",
                radius: 8,
              }}
            />

            <Bar
              dataKey="amount"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.amount === maxAmount
                      ? "url(#barGradient)"
                      : "url(#barGradientMuted)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Footer (total) ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--border, #27272A)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted, #A1A1AA)",
            fontWeight: 600,
          }}
        >
          {isEn ? "6-month total" : "Total 6 mois"}
        </span>
        <span
          style={{
            fontSize: 14,
            color: "var(--text-primary, #FAFAFA)",
            fontWeight: 800,
          }}
        >
          {formatCurrencyValue(
            chartData.reduce((s, d) => s + d.amount, 0),
            currency as Currency,
            isEn ? "en-US" : "fr-FR",
            true
          )}
        </span>
      </div>
    </motion.div>
  );
}
