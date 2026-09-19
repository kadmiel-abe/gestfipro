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
  expenseDays = [],
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
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm font-bold text-[#FAFAFA]">
          Septembre 2026
        </span>
        <div className="flex items-center gap-1.5">
          {/* mini legend */}
          <span className="text-[9px] font-bold bg-[#EF4444]/15 border border-[#EF4444]/30 rounded px-1.5 py-0.5 text-[#f87171]">
            Auj.
          </span>
          {paydayDate > 0 && (
            <span className="text-[9px] font-bold bg-[#10b981]/15 border border-[#10b981]/30 rounded px-1.5 py-0.5 text-[#4ade80]">
              Paie
            </span>
          )}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            className="text-[10px] font-bold text-[#71717A] py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="aspect-square" />;
          const isToday = day === today;
          const isPayday = paydayDate > 0 && day === paydayDate;
          const hasExpense = expenseDays.includes(day);

          let cellClass = "bg-transparent text-[#A1A1AA] hover:bg-[#27272A]/50";
          if (isToday) {
            cellClass = "bg-[#EF4444] text-white font-extrabold shadow-sm shadow-[#EF4444]/40";
          } else if (isPayday) {
            cellClass = "bg-[#10b981]/15 border border-[#10b981]/35 text-[#4ade80] font-bold";
          } else if (hasExpense) {
            cellClass = "text-[#FAFAFA] font-semibold bg-[#18181B]";
          }

          return (
            <div
              key={idx}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium relative transition-colors ${cellClass}`}
            >
              <span>{day}</span>
              {hasExpense && !isToday && !isPayday && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#EF4444] opacity-80" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
