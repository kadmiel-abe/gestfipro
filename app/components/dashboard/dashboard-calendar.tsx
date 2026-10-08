"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/hooks/useCalendar";
import { formatLocalDateKey, formatMonthYear, isSameDay } from "@/lib/date-utils";

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
  const calendar = useCalendar(transactions);
  const { year, month } = calendar;
  const expenseDays = useMemo(() => {
    const days = new Set<number>();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    for (const [key, events] of calendar.eventsByDate) {
      if (!key.startsWith(monthPrefix)) continue;
      if (events.some((event) => event.type === "expense" || (event.amount ?? 0) < 0)) {
        days.add(Number(key.slice(-2)));
      }
    }
    return days;
  }, [calendar.eventsByDate, month, year]);

  const handleGoToday = () => {
    calendar.goToToday();
    onSelectDate?.(calendar.today);
  };

  const handleGoPayDay = () => {
    const payday = new Date(calendar.year, calendar.month, payDay);
    calendar.selectDate(payday);
    onSelectDate?.(payday);
  };

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            {formatMonthYear(calendar.viewDate)}
          </h2>
          <div className="flex gap-1 ml-1">
            <button
              onClick={calendar.goToPreviousMonth}
              className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-md transition-colors"
              title="Mois précédent"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={calendar.goToNextMonth}
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

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
          <div key={day} className="text-[#A1A1AA] text-xs font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {calendar.grid.map((cellDate, index) => {
          if (!cellDate) return <div key={`empty-${index}`} className="p-2" />;

          const day = cellDate.getDate();
          const isToday = isSameDay(cellDate, calendar.today);
          const isSelected = calendar.selectedDate
            ? isSameDay(cellDate, calendar.selectedDate)
            : false;
          const isPayDay = day === payDay;
          const hasExpense = expenseDays.has(day);

          return (
            <button
              key={formatLocalDateKey(cellDate)}
              type="button"
              onClick={() => {
                calendar.selectDate(cellDate);
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
