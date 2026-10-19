"use client";

import React, { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Receipt,
  Wallet,
  ArrowDownRight,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: Date;
  icon: string;
}

// ── 1. Jeu de données fictives (mockExpenses) ───────────────────────────────
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const twoDaysAgo = new Date(now);
twoDaysAgo.setDate(now.getDate() - 2);
const threeDaysAgo = new Date(now);
threeDaysAgo.setDate(now.getDate() - 3);

export const mockExpenses: ExpenseItem[] = [
  {
    id: "exp-1",
    amount: 3500,
    category: "Nourriture",
    note: "Déjeuner restaurant Le Gourmet",
    date: now,
    icon: "🍔",
  },
  {
    id: "exp-2",
    amount: 2000,
    category: "Transport",
    note: "Course Taxi Yango Plateau → Cocody",
    date: now,
    icon: "🚕",
  },
  {
    id: "exp-3",
    amount: 15000,
    category: "Factures",
    note: "Recharge abonnement Fibre Orange",
    date: now,
    icon: "⚡",
  },
  {
    id: "exp-4",
    amount: 1200,
    category: "Nourriture",
    note: "Café & viennoiserie matin",
    date: now,
    icon: "☕",
  },
  {
    id: "exp-5",
    amount: 4500,
    category: "Santé",
    note: "Pharmacie - Vitamines & paracétamol",
    date: yesterday,
    icon: "💊",
  },
  {
    id: "exp-6",
    amount: 12000,
    category: "Loisirs",
    note: "Sortie cinéma & popcorn",
    date: yesterday,
    icon: "🎉",
  },
  {
    id: "exp-7",
    amount: 25000,
    category: "Logement",
    note: "Maintenance climatiseur chambre",
    date: twoDaysAgo,
    icon: "🏠",
  },
  {
    id: "exp-8",
    amount: 8000,
    category: "Transport",
    note: "Carburant Station Total",
    date: threeDaysAgo,
    icon: "⛽",
  },
];

interface DailyExpensesFilterProps {
  expenses?: ExpenseItem[];
  className?: string;
}

export default function DailyExpensesFilter({
  expenses = mockExpenses,
  className,
}: DailyExpensesFilterProps) {
  // Date sélectionnée (par défaut : date du jour)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  // Filtrage des dépenses du jour sélectionné via isSameDay de date-fns
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => isSameDay(new Date(exp.date), selectedDate));
  }, [expenses, selectedDate]);

  // Calcul du montant total cumulé pour le jour sélectionné
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  // Formatage monétaire en FCFA
  const formatFCFA = (amount: number) => {
    return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
  };

  const isTodaySelected = isSameDay(selectedDate, new Date());

  return (
    <Card
      className={cn(
        "bg-[#18181B] border border-[#27272A] rounded-2xl shadow-xl overflow-hidden transition-all text-[#FAFAFA]",
        className
      )}
    >
      {/* ── 1. EN-TÊTE : Titre et DatePicker Shadcn UI ── */}
      <CardHeader className="p-4 sm:p-6 pb-4 border-b border-[#27272A]/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight">
                Dépenses du jour
              </CardTitle>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Filtrage chronologique pour la section Historique
              </p>
            </div>
          </div>

          {/* DatePicker Shadcn UI : Popover + Calendar */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!isTodaySelected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="h-9 px-2.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] flex items-center gap-1.5"
                title="Revenir à aujourd'hui"
              >
                <RotateCcw className="w-3 h-3 text-[#EF4444]" />
                <span className="hidden sm:inline">Aujourd&apos;hui</span>
              </Button>
            )}

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 px-3 text-xs sm:text-sm font-semibold border-[#27272A] bg-[#09090B] hover:bg-[#27272A] hover:text-[#FAFAFA] text-[#FAFAFA] rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  )}
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>
                    {format(selectedDate, "d MMMM yyyy", { locale: fr })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={6}
                className="w-auto p-0 border border-[#27272A] bg-[#18181B] shadow-2xl rounded-2xl overflow-hidden"
              >
                <Calendar
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsPopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* ── 2. RÉSUMÉ : Total des dépenses du jour sélectionné ── */}
        <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#27272A]/60 border border-[#27272A] flex items-center justify-center text-[#EF4444]">
              <Wallet className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                Total dépensé le {format(selectedDate, "d MMMM", { locale: fr })}
              </span>
              <p className="text-xl sm:text-2xl font-black text-[#EF4444] tabular-nums tracking-tight mt-0.5">
                {formatFCFA(totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center sm:self-center">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
              {filteredExpenses.length}{" "}
              {filteredExpenses.length > 1 ? "dépenses enregistrées" : "dépense enregistrée"}
            </span>
          </div>
        </div>

        {/* ── 3. LISTE DES DÉPENSES OU ÉTAT VIDE ── */}
        {filteredExpenses.length === 0 ? (
          /* ── 5. État vide : centré en gris ── */
          <div className="py-12 px-4 text-center text-[#71717A] flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-[#27272A] bg-[#09090B]/30">
            <div className="w-11 h-11 rounded-2xl bg-[#09090B] border border-[#27272A] flex items-center justify-center text-[#52525B]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#A1A1AA]">
                Aucune dépense enregistrée pour cette date
              </p>
              <p className="text-xs text-[#71717A] mt-0.5 max-w-sm">
                Aucun mouvement financier n&apos;a été effectué le{" "}
                <span className="text-[#A1A1AA] font-medium">
                  {format(selectedDate, "d MMMM yyyy", { locale: fr })}
                </span>
                .
              </p>
            </div>
            {!isTodaySelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="mt-1 border-[#27272A] bg-[#09090B] text-xs font-semibold text-[#FAFAFA] hover:bg-[#27272A] rounded-lg"
              >
                Voir les dépenses d&apos;aujourd&apos;hui
              </Button>
            )}
          </div>
        ) : (
          /* ── 4. Liste : Dépenses filtrées (icône, catégorie, note, montant en FCFA) ── */
          <div className="space-y-2">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="p-3.5 rounded-xl bg-[#09090B]/70 border border-[#27272A] hover:border-[#3F3F46] transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icône de la catégorie */}
                  <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center text-lg shrink-0 group-hover:border-[#EF4444]/40 transition-colors">
                    {expense.icon}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#FAFAFA] truncate">
                      {expense.category}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
                      {expense.note}
                    </p>
                  </div>
                </div>

                {/* Montant avec accent text-[#EF4444] */}
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold text-[#EF4444] tabular-nums tracking-tight flex items-center justify-end gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    -{formatFCFA(expense.amount)}
                  </span>
                  <span className="text-[10px] text-[#71717A] block mt-0.5">
                    {format(new Date(expense.date), "HH:mm", { locale: fr })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
