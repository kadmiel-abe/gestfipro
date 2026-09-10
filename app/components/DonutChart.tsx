"use client";

import React from "react";

interface Category {
  label: string;
  value: number;
  color: string;
}

const categories: Category[] = [
  { label: "Nourriture", value: 0, color: "#EF4444" },
  { label: "Transport",  value: 0, color: "#6366f1" },
  { label: "Logement",   value: 0, color: "#8b5cf6" },
  { label: "Loisirs",    value: 0, color: "#f59e0b" },
  { label: "Autres",     value: 0, color: "#10b981" },
];

const SIZE = 140;
const STROKE = 20;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function DonutChart() {
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
          {categories.map((cat, i) => {
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
            fontSize="18"
            fontWeight="800"
          >
            0 FCFA
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
