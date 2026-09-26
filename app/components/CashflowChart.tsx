"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage, formatCurrencyValue, convertFromBase, Currency } from "@/lib/i18n/LanguageContext";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; payload?: any }>;
  label?: string;
  currency?: string;
}

function CustomTooltip({ active, payload, label, currency = "XOF" }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const isEn = typeof document !== "undefined" && document.documentElement.lang === "en";
    const locale = isEn ? "en-US" : "fr-FR";
    const fullDate = payload[0]?.payload?.fullDate;

    return (
      <div
        style={{
          background: "#18181B",
          border: "1px solid #27272A",
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 12,
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
        }}
      >
        <p style={{ color: "#A1A1AA", marginBottom: 6, fontWeight: 600 }}>
          {fullDate || (isEn ? `Day ${label}` : `Jour ${label}`)}
        </p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color, fontWeight: 700, marginBottom: 2 }}>
            {p.name === "solde"
              ? isEn
                ? "Solde"
                : "Solde"
              : isEn
              ? "Expenses"
              : "Dépenses"}{" "}
            : {formatCurrencyValue(Number(p.value), currency as Currency, locale, true)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

interface CashflowChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions?: any[];
  totalBalance?: number;
  currency?: string;
}

export default function CashflowChart({
  transactions = [],
  totalBalance = 0,
  currency = "XOF",
}: CashflowChartProps) {
  const { isEn } = useLanguage();

  const chartData = useMemo(() => {
    const daysCount = 10;
    const today = new Date();

    // Regrouper les transactions par date YYYY-MM-DD
    const dailyMap: Record<string, { expenses: number; incomes: number }> = {};

    (transactions || []).forEach((t) => {
      let rawDate: Date | null = null;
      if (t.transaction_date) {
        rawDate = new Date(t.transaction_date);
      } else if (t.created_at) {
        rawDate = new Date(t.created_at);
      }

      if (rawDate && !isNaN(rawDate.getTime())) {
        const key = rawDate.toISOString().split("T")[0]; // YYYY-MM-DD
        if (!dailyMap[key]) dailyMap[key] = { expenses: 0, incomes: 0 };
        const amt = Math.abs(Number(t.amount) || 0);
        if (t.type === "expense" || Number(t.amount) < 0) {
          dailyMap[key].expenses += amt;
        } else {
          dailyMap[key].incomes += amt;
        }
      }
    });

    // Générer la liste des 10 derniers jours jusqu'à aujourd'hui
    const daysList: { key: string; dayLabel: string; fullDate: string }[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayLabel = String(d.getDate());
      const fullDate = d.toLocaleDateString(isEn ? "en-US" : "fr-FR", {
        day: "numeric",
        month: "short",
      });
      daysList.push({ key, dayLabel, fullDate });
    }

    // Calculer le solde historique en remontant le temps depuis totalBalance aujourd'hui
    let runningBalance = Number(totalBalance) || 0;
    const balancesPerDay: number[] = new Array(daysCount);

    for (let i = daysCount - 1; i >= 0; i--) {
      balancesPerDay[i] = runningBalance;
      const dayKey = daysList[i].key;
      const dayData = dailyMap[dayKey] || { expenses: 0, incomes: 0 };
      // Solde en fin de journée précédente = Solde aujourd'hui - entrées + dépenses
      runningBalance = runningBalance - dayData.incomes + dayData.expenses;
    }

    // Construire le tableau final pour Recharts
    return daysList.map((d, i) => {
      const dayData = dailyMap[d.key] || { expenses: 0, incomes: 0 };
      return {
        day: d.dayLabel,
        fullDate: d.fullDate,
        solde: Math.max(0, balancesPerDay[i]),
        depenses: dayData.expenses,
      };
    });
  }, [transactions, totalBalance, isEn]);

  if (transactions.length === 0 && totalBalance === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: 200,
          background: "#09090B",
          borderRadius: 12,
          border: "1px dashed #27272A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: 16,
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>
          {isEn ? "No transactions for this cycle" : "Aucune transaction pour ce cycle"}
        </p>
        <p style={{ fontSize: 11, color: "#71717A", margin: 0, maxWidth: 300 }}>
          {isEn
            ? "Your balance and cash flow history will appear as soon as you log your first transactions."
            : "L'évolution de votre solde et de vos flux financiers s'affichera dès vos premières opérations enregistrées."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="soldeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="depensesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FAFAFA" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#FAFAFA" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#52525B", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (isEn ? `D${v}` : `J${v}`)}
          />
          <YAxis
            tick={{ fill: "#52525B", fontSize: 10 }}
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
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="solde"
            stroke="#EF4444"
            strokeWidth={2.5}
            fill="url(#soldeGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#EF4444", stroke: "#18181B", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="depenses"
            stroke="#A1A1AA"
            strokeWidth={2}
            fill="url(#depensesGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#FAFAFA", stroke: "#18181B", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
