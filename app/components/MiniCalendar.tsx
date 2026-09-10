"use client";

import React from "react";

interface MiniCalendarProps {
  today: number;
  paydayDate: number;
  expenseDays?: number[];
}

const DAYS_OF_WEEK = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export default function MiniCalendar({
  today,
  paydayDate,
  expenseDays = [2, 4, 5, 7, 9, 10],
}: MiniCalendarProps) {
  // September 2026: 1st is a Tuesday (index 1 in Mon-first week)
  const firstDayOffset = 1; // 0=Mon, 1=Tue, ...
  const daysInMonth = 30;
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const day = i - firstDayOffset + 1;
    cells.push(day >= 1 && day <= daysInMonth ? day : null);
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#FAFAFA" }}>
          Septembre 2026
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {/* mini legend */}
          <span
            style={{
              fontSize: 9,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 4,
              padding: "1px 5px",
              color: "#f87171",
            }}
          >
            Auj.
          </span>
          <span
            style={{
              fontSize: 9,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 4,
              padding: "1px 5px",
              color: "#4ade80",
            }}
          >
            Paie
          </span>
        </div>
      </div>

      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 9,
              fontWeight: 600,
              color: "#52525B",
              padding: "2px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const isToday = day === today;
          const isPayday = day === paydayDate;
          const hasExpense = expenseDays.includes(day);

          let extraStyle: React.CSSProperties = {};
          let cls = "cal-day";

          if (isToday) {
            extraStyle = { background: "#EF4444", color: "white", fontWeight: 700 };
          } else if (isPayday) {
            extraStyle = {
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#4ade80",
            };
          } else if (hasExpense) {
            extraStyle = { color: "#FAFAFA" };
          }

          return (
            <div
              key={idx}
              className={cls}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 500,
                color: "#A1A1AA",
                position: "relative",
                ...extraStyle,
              }}
            >
              {day}
              {hasExpense && !isToday && !isPayday && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "#EF4444",
                    opacity: 0.6,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
