"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DashboardCalendarProps {
  payDay?: number; // Jour de paie, par défaut 25, défini lors de l'onboarding
}

export default function DashboardCalendar({ payDay = 25 }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    // new Date() s'ajuste automatiquement au mois actuel et au fuseau horaire de l'utilisateur
    setCurrentDate(new Date());
  }, []);

  if (!currentDate) {
    return <div className="h-[320px] w-full bg-[#18181B] border border-[#27272A] rounded-xl animate-pulse"></div>;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayDay = currentDate.getDate();

  // Calcul du nombre de jours dans le mois et du premier jour de la semaine
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Ajustement pour commencer par Lundi

  // Nom du mois en français
  const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(currentDate);

  const calendarCells = [];

  // Cases vides pour l'alignement du premier jour
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="p-2"></div>);
  }

  // Génération des jours du mois
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === todayDay;
    const isPayDay = i === payDay;

    calendarCells.push(
      <div
        key={i}
        className={cn(
          "flex flex-col items-center justify-center p-2 text-sm rounded-lg cursor-pointer transition-all duration-200 h-10 w-10 mx-auto",
          isToday ? "bg-[#EF4444] text-[#FAFAFA] font-bold shadow-lg shadow-[#EF4444]/20" : "text-[#FAFAFA] hover:bg-[#27272A]",
          isPayDay && !isToday ? "border border-[#27272A] bg-[#27272A]/50 text-[#A1A1AA]" : ""
        )}
      >
        <span>{i}</span>
        {/* Point indicateur pour le jour de paie (MVP) */}
        {isPayDay && !isToday && (
          <div className="w-1 h-1 bg-[#A1A1AA] rounded-full mt-0.5"></div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 w-full max-w-md">
      {/* En-tête : Mois/Année et Boutons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] capitalize">
          {monthName} {year}
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs font-semibold text-[#EF4444] border border-[#EF4444]/30 bg-[#EF4444]/10 rounded-md transition-colors hover:bg-[#EF4444]/20">
            Auj.
          </button>
          <button className="px-3 py-1 text-xs font-semibold text-[#A1A1AA] border border-[#27272A] rounded-md transition-colors hover:text-[#FAFAFA] hover:bg-[#27272A]">
            Paie
          </button>
        </div>
      </div>

      {/* Jours de la semaine */}
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
