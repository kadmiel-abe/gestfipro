"use client";

import React, { useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  // 1. Initialise l'état du calendrier dynamiquement sur la date système actuelle avec new Date() (aucune date codée en dur)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 2. Affichage direct du mois et de l'année via Intl.DateTimeFormat avec première lettre en majuscule
  const formattedTitle = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(currentDate);
  const monthTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1);

  // Calcul du nombre de jours dans le mois et du décalage initial (lundi = 0)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = (firstDayIndex + 6) % 7;
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

  // 4. Changement de mois via new Date(year, month - 1, 1) et new Date(year, month + 1, 1)
  const handlePreviousMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  // 3. Bouton "Auj." réinitialise currentDate sur new Date()
  const handleGoToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    if (onSelectDate) onSelectDate(today);
  }, [onSelectDate]);

  const grid = useMemo<(Date | null)[]>(() => {
    const dates: (Date | null)[] = [];
    for (let index = 0; index < totalCells; index++) {
      const day = index - startDay + 1;
      dates.push(day >= 1 && day <= daysInMonth ? new Date(year, month, day) : null);
    }
    return dates;
  }, [daysInMonth, month, startDay, totalCells, year]);

  const activeExpenseDays = useMemo(() => {
    const days = new Set<number>();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    for (const t of transactions) {
      const dStr = t.transaction_date || t.created_at;
      if (!dStr) continue;
      const key = dStr.split("T")[0];
      if (key.startsWith(monthPrefix)) {
        if (t.type === "expense" || (t.amount !== undefined && t.amount < 0)) {
          days.add(Number(key.slice(-2)));
        }
      }
    }
    if (transactions.length === 0 && expenseDays?.length) {
      return new Set(expenseDays);
    }
    return days;
  }, [expenseDays, month, transactions, year]);

  return (
    <div className="w-full">
      {/* Header avec Navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-bold text-[#FAFAFA]">
            {monthTitle}
          </span>
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={handlePreviousMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded transition-colors"
              title="Mois précédent"
              type="button"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            <button
              onClick={handleNextMonth}
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
          const dateKey = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const today = new Date();
          const isToday =
            cellDate.getDate() === today.getDate() &&
            cellDate.getMonth() === today.getMonth() &&
            cellDate.getFullYear() === today.getFullYear();
          const isSelected = selectedDate
            ? cellDate.getDate() === selectedDate.getDate() &&
              cellDate.getMonth() === selectedDate.getMonth() &&
              cellDate.getFullYear() === selectedDate.getFullYear()
            : false;
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
              aria-label={`${day} ${monthTitle}${isToday ? " — aujourd'hui" : ""}`}
              aria-current={isToday ? "date" : undefined}
              onClick={() => {
                setSelectedDate(cellDate);
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
