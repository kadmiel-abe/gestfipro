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

interface DataPoint {
  day: string;
  solde: number;
  depenses: number;
}

const data: DataPoint[] = [
  { day: "1",  solde: 0, depenses: 0 },
  { day: "2",  solde: 0, depenses: 0 },
  { day: "3",  solde: 0, depenses: 0 },
  { day: "4",  solde: 0, depenses: 0 },
  { day: "5",  solde: 0, depenses: 0 },
  { day: "6",  solde: 0, depenses: 0 },
  { day: "7",  solde: 0, depenses: 0 },
  { day: "8",  solde: 0, depenses: 0 },
  { day: "9",  solde: 0, depenses: 0 },
  { day: "10", solde: 0, depenses: 0 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#18181B",
          border: "1px solid #27272A",
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 12,
        }}
      >
        <p style={{ color: "#A1A1AA", marginBottom: 6, fontWeight: 600 }}>
          Jour {label}
        </p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color, fontWeight: 700, marginBottom: 2 }}>
            {p.name === "solde" ? "Solde" : "Dépenses"} :{" "}
            {p.value.toLocaleString("fr-FR")} FCFA
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function CashflowChart() {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="soldeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="depensesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272A"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fill: "#52525B", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `J${v}`}
          />
          <YAxis
            tick={{ fill: "#52525B", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              v >= 1000000
                ? `${(v / 1000000).toFixed(1)}M`
                : v >= 1000
                ? `${(v / 1000).toFixed(0)}k`
                : String(v)
            }
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
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
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#depensesGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#6366f1", stroke: "#18181B", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
