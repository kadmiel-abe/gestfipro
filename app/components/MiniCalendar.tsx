"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

  /**
   * viewDate = 1er du mois affiché — source de vérité unique.
   * Initialisé à null pour éviter toute désynchronisation SSR/CSR (Next.js).
   * Le useEffect ci-dessous le positionne côté client uniquement.
   */
  const [viewDate, setViewDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Traque si l'utilisateur a navigué manuellement (pour ne pas écraser sa vue à minuit)
  const userNavigatedRef = useRef(false);

  /**
   * Initialisation client-side + rafraîchissement automatique (minuit, visibilitychange…).
   * On ne réinitialise viewDate que si l'utilisateur n'a pas navigué manuellement.
   */
  useEffect(() => {
    setViewDate((prev) => {
      // Premier mount : on positionne sur le mois courant
      if (prev === null) {
        userNavigatedRef.current = false;
        return new Date(today.getFullYear(), today.getMonth(), 1);
      }
      // Rafraîchissement automatique : seulement si pas de navigation manuelle
      if (!userNavigatedRef.current) {
        return new Date(today.getFullYear(), today.getMonth(), 1);
      }
      return prev;
    });
    setSelectedDate((prev) => (prev === null ? today : prev));
  }, [today]);

  // On dérive année et mois depuis viewDate ; avant le mount client, on prend today
  const year = viewDate ? viewDate.getFullYear() : today.getFullYear();
  const month = viewDate ? viewDate.getMonth() : today.getMonth();

  const firstDayOffset = getStartDayOfWeek(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

  /**
   * Index (Set) des jours avec dépenses pour le mois/année AFFICHÉ uniquement.
   * On parse la date locale (YYYY-MM-DD) sans passer par toISOString() pour éviter
   * le décalage UTC qui ferait glisser la date d'un jour.
   */
  const activeExpenseDays = useMemo<Set<number>>(() => {
    if (transactions.length > 0) {
      const days = new Set<number>();
      for (const t of transactions) {
        const dStr = t.transaction_date || t.created_at;
        if (!dStr) continue;
        const datePart = dStr.split("T")[0]; // "YYYY-MM-DD"
        const parts = datePart.split("-");
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1; // Convertit en index JS 0-11
        const d = Number(parts[2]);
        if (y === year && m === month) {
          if (t.type === "expense" || (t.amount !== undefined && t.amount < 0)) {
            if (d > 0) days.add(d);
          }
        }
      }
      return days;
    }
    // Repli sur prop legacy expenseDays (numéros de jours sans filtre mois)
    if (expenseDays && expenseDays.length > 0) return new Set(expenseDays);
    return new Set<number>();
  }, [transactions, expenseDays, year, month]);

  const handlePrevMonth = useCallback(() => {
    userNavigatedRef.current = true;
    setViewDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    userNavigatedRef.current = true;
    setViewDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const handleGoToday = useCallback(() => {
    userNavigatedRef.current = false;
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
    if (onSelectDate) onSelectDate(today);
  }, [today, onSelectDate]);

  // Mémoïsation de la grille — recalculée seulement si mois ou offset changent
  const cells = useMemo<(number | null)[]>(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDayOffset + 1;
      result.push(day >= 1 && day <= daysInMonth ? day : null);
    }
    return result;
  }, [totalCells, firstDayOffset, daysInMonth]);

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
              onClick={handlePrevMonth}
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
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="aspect-square" role="gridcell" aria-hidden="true" />;

          const cellDate = new Date(year, month, day);
          // Clé stable basée sur la date locale YYYY-MM-DD (pas toISOString() — décalage UTC)
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
