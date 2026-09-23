"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Category {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions?: any[];
  currency?: string;
}

const SIZE = 140;
const STROKE = 20;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const defaultColorMap: Record<string, string> = {
  "Nourriture": "#EF4444",
  "Transport": "#DC2626",
  "Logement": "#B91C1C",
  "Loisirs": "#F87171",
  "Santé": "#FAFAFA",
  "Éducation": "#E4E4E7",
  "Vêtements": "#A1A1AA",
  "Divers": "#71717A",
  "Autres": "#71717A",
};

export default function DonutChart({ transactions = [], currency = "XOF" }: DonutChartProps) {
  const { isEn } = useLanguage();
  const expenseList = transactions.filter((t) => t.type === "expense" || t.amount < 0);
  const totalExpense = expenseList.reduce((acc, t) => acc + Math.abs(t.amount), 0);

  if (totalExpense === 0) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 140,
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
          {isEn ? "No expenses recorded" : "Aucune dépense enregistrée"}
        </p>
        <p style={{ fontSize: 11, color: "#71717A", margin: 0, maxWidth: 280 }}>
          {isEn ? "The category breakdown will appear automatically as soon as you add your first purchase." : "La répartition par catégorie se calculera automatiquement dès votre premier achat."}
        </p>
      </div>
    );
  }

  const catTotals: Record<string, number> = {};
  for (const t of expenseList) {
    const c = t.category || "Divers";
    catTotals[c] = (catTotals[c] || 0) + Math.abs(t.amount);
  }

  const categories: Category[] = Object.entries(catTotals).map(([label, val]) => ({
    label,
    value: Math.max(1, Math.round((val / totalExpense) * 100)),
    color: defaultColorMap[label] || "#a1a1aa",
  }));

  let accumulated = 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      {/* SVG Donut */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Background track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#09090B"
            strokeWidth={STROKE}
          />
          {categories.map((cat) => {
            const dash = (cat.value / 100) * CIRC;
            const gap = CIRC - dash;
            const offset = CIRC - accumulated * (CIRC / 100);
            accumulated += cat.value;

            return (
              <circle
                key={cat.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={cat.color}
                strokeWidth={STROKE - 2}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            );
          })}
          {/* Center text */}
          <text
            x={SIZE / 2}
            y={SIZE / 2 - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FAFAFA"
            fontSize="15"
            fontWeight="800"
          >
            {totalExpense >= 1000000 ? `${(totalExpense / 1000000).toFixed(1)}M` : totalExpense.toLocaleString("fr-FR")}
          </text>
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#A1A1AA"
            fontSize="9"
            fontWeight="600"
          >
            {currency === "USD" ? (isEn ? "spent" : "dép.") : currency === "EUR" ? (isEn ? "spent" : "dép.") : currency === "NGN" || currency === "KES" || currency === "ZAR" ? (isEn ? "spent" : "dép.") : (isEn ? "spent" : "dép.")}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {categories.map((cat) => (
          <div
            key={cat.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: cat.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: "#A1A1AA" }}>{cat.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FAFAFA" }}>
              {cat.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
