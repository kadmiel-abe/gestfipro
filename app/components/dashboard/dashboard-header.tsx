"use client";

import { Calendar } from "lucide-react";
import { useToday } from "@/hooks/useToday";

interface DashboardHeaderProps {
  userName?: string;
  timeZone?: string;
}

export default function DashboardHeader({
  userName = "Kadmiel",
  timeZone = "Africa/Abidjan",
}: DashboardHeaderProps = {}) {
  const currentDate = useToday();

  // Formatage sur le fuseau horaire d'Abidjan
  const fullDate = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(currentDate);

  const currentMonth = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    month: "long",
  }).format(currentDate);

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <p className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">
          {fullDate}
        </p>
        <h1 className="text-2xl font-bold text-[#FAFAFA]">
          Bonjour {userName}
        </h1>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-[#18181B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA]">
        <Calendar className="w-4 h-4 text-[#EF4444]" />
        <span className="capitalize">Ce mois ({currentMonth})</span>
      </div>
    </header>
  );
}
