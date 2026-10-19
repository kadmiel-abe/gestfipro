"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected || new Date()
  );

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

  return (
    <div className={cn("p-3 w-64 select-none bg-[#18181B] text-[#FAFAFA]", className)}>
      {/* En-tête mois + flèches navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold capitalize text-[#FAFAFA]">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors cursor-pointer"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors cursor-pointer"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-[10px] font-semibold text-[#71717A] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                "h-7 w-7 text-xs rounded-lg flex items-center justify-center transition-all cursor-pointer font-medium",
                !isCurrentMonth && "text-[#52525B] opacity-40",
                isCurrentMonth && !isSelected && "text-[#FAFAFA] hover:bg-[#27272A]",
                isSelected &&
                  "bg-[#EF4444] text-white font-bold shadow-md shadow-[#EF4444]/25 hover:bg-[#DC2626]",
                isCurrentDay && !isSelected && "border border-[#EF4444]/50 text-[#EF4444] font-semibold"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
