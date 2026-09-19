"use client";

import React from "react";
import type { Transaction } from "@/lib/types";

interface Category {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions?: any[];
}

const SIZE = 140;
const STROKE = 20;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const defaultColorMap: Record<string, string> = {
  "Nourriture": "#EF4444",
  "Transport": "#6366f1",
  "Logement": "#8b5cf6",
  "Loisirs": "#f59e0b",
  "Santé": "#ec4899",
  "Éducation": "#14b8a6",
  "Vêtements": "#3b82f6",
  "Divers": "#10b981",
  "Autres": "#10b981",
};

export default function DonutChart({ transactions = [] }: DonutChartProps) {
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
          Aucune dépense enregistrée
        </p>
        <p style={{ fontSize: 11, color: "#71717A", margin: 0, maxWidth: 280 }}>
          La répartition par catégorie se calculera automatiquement dès votre premier achat.
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
            FCFA dép.
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
