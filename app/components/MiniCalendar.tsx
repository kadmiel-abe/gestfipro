"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToday } from "@/hooks/useToday";
import {
  formatMonthYear,
  getDaysInMonth,
  getStartDayOfWeek,
  isSameDay,
} from "@/lib/date-utils";

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
  const today = useToday();
  const [viewDate, setViewDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  // Synchronise le mois d'affichage si aujourd'hui change (ex. au passage de minuit)
  useEffect(() => {
    setViewDate((prev) => {
      // Conserve le mois de l'utilisateur si une navigation explicite a eu lieu
      if (prev.getMonth() === today.getMonth() && prev.getFullYear() === today.getFullYear()) {
        return today;
      }
      return prev;
    });
  }, [today]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOffset = getStartDayOfWeek(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

  // Filtrer les jours de dépense pour le mois/année affiché uniquement
  const activeExpenseDays = React.useMemo(() => {
    if (expenseDays && expenseDays.length > 0) return expenseDays;

    return transactions
      .filter((t) => {
        const dStr = t.transaction_date || t.created_at;
        if (!dStr) return false;
        const txDate = new Date(dStr);
        return (
          !isNaN(txDate.getTime()) &&
          txDate.getFullYear() === year &&
          txDate.getMonth() === month &&
          (t.type === "expense" || (t.amount !== undefined && t.amount < 0))
        );
      })
      .map((t) => new Date(t.transaction_date || t.created_at!).getDate());
  }, [transactions, expenseDays, year, month]);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    setViewDate(today);
    setSelectedDate(today);
    if (onSelectDate) onSelectDate(today);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const day = i - firstDayOffset + 1;
    cells.push(day >= 1 && day <= daysInMonth ? day : null);
  }

  return (
    <div className="w-full">
      {/* Header avec Navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-bold text-[#FAFAFA]">
            {formatMonthYear(viewDate)}
          </span>
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded transition-colors"
              title="Mois précédent"
              type="button"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded transition-colors"
              title="Mois suivant"
              type="button"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleGoToday}
            className="text-[10px] font-bold bg-[#EF4444]/15 border border-[#EF4444]/30 rounded px-2 py-0.5 text-[#f87171] hover:bg-[#EF4444]/25 transition-colors"
            type="button"
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
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="aspect-square" />;

          const cellDate = new Date(year, month, day);
          const isToday = isSameDay(cellDate, today);
          const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;
          const isPayday = paydayDate > 0 && day === paydayDate;
          const hasExpense = activeExpenseDays.includes(day);

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
              key={idx}
              type="button"
              onClick={() => {
                setSelectedDate(cellDate);
                if (onSelectDate) onSelectDate(cellDate);
              }}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium relative transition-colors ${cellClass}`}
            >
              <span>{day}</span>
              {hasExpense && !isToday && !isPayday && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#EF4444] opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
