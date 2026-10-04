"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/useToday";
import {
  formatMonthYear,
  getDaysInMonth,
  getStartDayOfWeek,
  isSameDay,
} from "@/lib/date-utils";

interface DashboardCalendarProps {
  payDay?: number; // Jour de paie, par défaut 25
  transactions?: { transaction_date?: string; created_at?: string; type?: string; amount?: number }[];
  onSelectDate?: (date: Date) => void;
}

export default function DashboardCalendar({
  payDay = 25,
  transactions = [],
  onSelectDate,
}: DashboardCalendarProps) {
  const today = useToday();
  const [viewDate, setViewDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  // Synchronisation avec aujourd'hui lors des mises à jour automatiques (minuit, etc.)
  useEffect(() => {
    setViewDate((prev) => {
      if (prev.getMonth() === today.getMonth() && prev.getFullYear() === today.getFullYear()) {
        return today;
      }
      return prev;
    });
  }, [today]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month); // 0 = Lundi, 6 = Dimanche

  // Filtrage des jours avec transactions pour le mois affiché
  const expenseDays = useMemo(() => {
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
  }, [transactions, year, month]);

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

  const handleGoPayDay = () => {
    const payDayDate = new Date(year, month, payDay);
    setSelectedDate(payDayDate);
    if (onSelectDate) onSelectDate(payDayDate);
  };

  const calendarCells = [];

  // Cases vides pour l'alignement du 1er du mois (Lundi = index 0)
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="p-2" />);
  }

  // Génération des cellules pour chaque jour du mois
  for (let i = 1; i <= daysInMonth; i++) {
    const cellDate = new Date(year, month, i);
    const isToday = isSameDay(cellDate, today);
    const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;
    const isPayDay = i === payDay;
    const hasExpense = expenseDays.includes(i);

    calendarCells.push(
      <button
        key={i}
        type="button"
        onClick={() => {
          setSelectedDate(cellDate);
          if (onSelectDate) onSelectDate(cellDate);
        }}
        className={cn(
          "flex flex-col items-center justify-center p-2 text-sm rounded-lg cursor-pointer transition-all duration-200 h-10 w-10 mx-auto relative",
          isToday
            ? "bg-[#EF4444] text-[#FAFAFA] font-bold shadow-lg shadow-[#EF4444]/30 ring-2 ring-[#EF4444]"
            : isSelected
            ? "bg-[#27272A] border border-[#EF4444] text-[#FAFAFA] font-bold shadow-md"
            : "text-[#FAFAFA] hover:bg-[#27272A]",
          isPayDay && !isToday && !isSelected
            ? "border border-[#27272A] bg-[#27272A]/40 text-[#FAFAFA]"
            : ""
        )}
      >
        <span>{i}</span>

        {/* Indicateur de jour de paie */}
        {isPayDay && !isToday && (
          <div className="w-1.5 h-1.5 bg-[#EF4444] rounded-full absolute bottom-1 shadow-sm" />
        )}

        {/* Indicateur de dépense si distinct de la paie */}
        {hasExpense && !isPayDay && !isToday && (
          <div className="w-1 h-1 bg-[#A1A1AA] rounded-full absolute bottom-1" />
        )}
      </button>
    );
  }

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 w-full max-w-md">
      {/* En-tête : Mois/Année et Boutons de Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            {formatMonthYear(viewDate)}
          </h2>
          <div className="flex gap-1 ml-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-md transition-colors"
              title="Mois précédent"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-md transition-colors"
              title="Mois suivant"
              type="button"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGoToday}
            type="button"
            className="px-3 py-1 text-xs font-semibold text-[#EF4444] border border-[#EF4444]/30 bg-[#EF4444]/10 rounded-md transition-colors hover:bg-[#EF4444]/20"
          >
            Auj.
          </button>
          <button
            onClick={handleGoPayDay}
            type="button"
            className="px-3 py-1 text-xs font-semibold text-[#A1A1AA] border border-[#27272A] rounded-md transition-colors hover:text-[#FAFAFA] hover:bg-[#27272A]"
          >
            Paie
          </button>
        </div>
      </div>

      {/* Jours de la semaine (Lundi -> Dimanche) */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
          <div key={day} className="text-[#A1A1AA] text-xs font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Grille dynamique des dates */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {calendarCells}
      </div>
    </div>
  );
}
