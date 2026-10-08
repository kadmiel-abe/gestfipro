"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/hooks/useCalendar";
import { formatMonthYear, formatLocalDateKey, isSameDay } from "@/lib/date-utils";

interface MiniCalendarProps {
  paydayDate?: number;
  transactions?: { transaction_date?: string; created_at?: string; type?: string; amount?: number }[];
  expenseDays?: number[]; // Pour rétrocompatibilité
  onSelectDate?: (date: Date) => void;
}

const DAYS_OF_WEEK = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export default function MiniCalendar({
  paydayDate = 25,
  transactions = [],
  expenseDays,
  onSelectDate,
}: MiniCalendarProps) {
  const {
    today,
    selectedDate,
    year,
    month,
    eventsByDate,
    grid,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
  } = useCalendar(transactions);

  const activeExpenseDays = useMemo(() => {
    const days = new Set<number>();
    for (const [key, dayEvents] of eventsByDate) {
      if (!key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)) continue;
      if (dayEvents.some((event) => event.type === "expense" || (event.amount ?? 0) < 0)) {
        days.add(Number(key.slice(-2)));
      }
    }
    if (transactions.length === 0 && expenseDays?.length) {
      return new Set(expenseDays);
    }
    return days;
  }, [eventsByDate, expenseDays, month, transactions.length, year]);

  const handleGoToday = () => {
    goToToday();
    if (onSelectDate) onSelectDate(today);
  };

  return (
    <div className="w-full">
      {/* Header avec Navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-bold text-[#FAFAFA]">
            {formatMonthYear(new Date(year, month, 1))}
          </span>
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={goToPreviousMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded transition-colors"
              title="Mois précédent"
              type="button"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded transition-colors"
              title="Mois suivant"
              type="button"
              aria-label="Mois suivant"
            >
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleGoToday}
            className="text-[10px] font-bold bg-[#EF4444]/15 border border-[#EF4444]/30 rounded px-2 py-0.5 text-[#f87171] hover:bg-[#EF4444]/25 transition-colors"
            type="button"
            aria-label="Revenir au mois actuel"
          >
            Auj.
          </button>
          {paydayDate > 0 && (
            <span className="text-[9px] font-bold bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-[#FAFAFA]">
              Paie ({paydayDate})
            </span>
          )}
        </div>
      </div>

      {/* Jours de la semaine (Lundi -> Dimanche) */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-[10px] font-bold text-[#71717A] py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-1" role="grid">
        {grid.map((cellDate, idx) => {
          if (!cellDate) return <div key={`empty-${idx}`} className="aspect-square" role="gridcell" aria-hidden="true" />;

          const day = cellDate.getDate();
          const dateKey = formatLocalDateKey(cellDate);
          const isToday = isSameDay(cellDate, today);
          const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;
          const isPayday = paydayDate > 0 && day === paydayDate;
          const hasExpense = activeExpenseDays.has(day);

          let cellClass = "bg-transparent text-[#A1A1AA] hover:bg-[#27272A]/50";

          if (isToday) {
            cellClass = "bg-[#EF4444] text-white font-extrabold shadow-sm shadow-[#EF4444]/40 ring-1 ring-[#EF4444]";
          } else if (isSelected) {
            cellClass = "bg-[#27272A] border border-[#EF4444]/60 text-[#FAFAFA] font-bold";
          } else if (isPayday) {
            cellClass = "bg-white/10 border border-white/25 text-[#FAFAFA] font-bold";
          } else if (hasExpense) {
            cellClass = "text-[#FAFAFA] font-semibold bg-[#18181B]";
          }

          return (
            <button
              key={dateKey}
              type="button"
              role="gridcell"
              aria-label={`${day} ${formatMonthYear(new Date(year, month, 1))}${isToday ? " — aujourd'hui" : ""}`}
              aria-current={isToday ? "date" : undefined}
              onClick={() => {
                selectDate(cellDate);
                if (onSelectDate) onSelectDate(cellDate);
              }}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium relative transition-colors ${cellClass}`}
            >
              <span>{day}</span>
              {hasExpense && !isToday && !isPayday && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#EF4444] opacity-80" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
