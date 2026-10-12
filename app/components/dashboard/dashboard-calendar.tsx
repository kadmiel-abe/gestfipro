"use client";

import { useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCalendarProps {
  payDay?: number;
  transactions?: { transaction_date?: string; created_at?: string; type?: string; amount?: number }[];
  onSelectDate?: (date: Date) => void;
}

export default function DashboardCalendar({
  payDay = 25,
  transactions = [],
  onSelectDate,
}: DashboardCalendarProps) {
  // 1. Initialise l'état du calendrier dynamiquement sur la date système actuelle avec new Date() (aucune date codée en dur)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 2. Affichage dynamique du mois et de l'année avec Intl.DateTimeFormat et première lettre en majuscule
  const formattedTitle = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(currentDate);
  const monthTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1);

  // Calcul du nombre de jours dans le mois et du premier jour
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = (firstDayIndex + 6) % 7; // Lundi = 0, Mardi = 1, ..., Dimanche = 6
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
    onSelectDate?.(today);
  }, [onSelectDate]);

  const handleGoPayDay = useCallback(() => {
    const payday = new Date(year, month, payDay);
    setSelectedDate(payday);
    onSelectDate?.(payday);
  }, [month, payDay, year, onSelectDate]);

  const grid = useMemo<(Date | null)[]>(() => {
    const dates: (Date | null)[] = [];
    for (let index = 0; index < totalCells; index++) {
      const day = index - startDay + 1;
      dates.push(day >= 1 && day <= daysInMonth ? new Date(year, month, day) : null);
    }
    return dates;
  }, [daysInMonth, month, startDay, totalCells, year]);

  const expenseDays = useMemo(() => {
    const days = new Set<number>();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    for (const event of transactions) {
      const rawDate = event.transaction_date || event.created_at;
      if (!rawDate) continue;
      const key = rawDate.split("T")[0];
      if (!key.startsWith(monthPrefix)) continue;
      if (event.type === "expense" || (event.amount ?? 0) < 0) {
        days.add(Number(key.slice(-2)));
      }
    }
    return days;
  }, [month, transactions, year]);

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            {monthTitle}
          </h2>
          <div className="flex gap-1 ml-1">
            <button
              onClick={handlePreviousMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-md transition-colors"
              title="Mois précédent"
              aria-label="Mois précédent"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-md transition-colors"
              title="Mois suivant"
              aria-label="Mois suivant"
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

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
          <div key={day} className="text-[#A1A1AA] text-xs font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {grid.map((cellDate, index) => {
          if (!cellDate) return <div key={`empty-${index}`} className="p-2" />;

          const day = cellDate.getDate();
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
          const isPayDay = day === payDay;
          const hasExpense = expenseDays.has(day);

          return (
            <button
              key={`${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`}
              type="button"
              onClick={() => {
                setSelectedDate(cellDate);
                onSelectDate?.(cellDate);
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
              <span>{day}</span>
              {isPayDay && !isToday && (
                <div className="w-1.5 h-1.5 bg-[#EF4444] rounded-full absolute bottom-1 shadow-sm" />
              )}
              {hasExpense && !isPayDay && !isToday && (
                <div className="w-1 h-1 bg-[#A1A1AA] rounded-full absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
