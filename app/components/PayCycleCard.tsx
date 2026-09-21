"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Zap,
  CircleDollarSign,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface PayCycleCardProps {
  netSalary: number;
  paydayWithMonth: number;
  totalBalance: number;
  todayExpenses: number;
  accountsCount?: number;
  todayTransactionsCount?: number;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

export function computePayCycle(paydayWithMonth: number | null | undefined, totalBalance: number) {
  const now = new Date();
  const todayNum = now.getDate();
  const isConfigured = Boolean(paydayWithMonth && paydayWithMonth > 0 && paydayWithMonth <= 31);

  if (!isConfigured || !paydayWithMonth) {
    return {
      daysRemaining: 0,
      dailyBudget: 0,
      isBudgetCritical: false,
      safePayday: null,
      todayNum,
      isConfigured: false,
    };
  }

  const safePayday = paydayWithMonth;
  let daysRemaining = safePayday - todayNum;
  if (daysRemaining <= 0) {
    // Nombre de jours restants jusqu'au prochain mois
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    daysRemaining += daysInMonth;
  }

  const dailyBudget = daysRemaining > 0 ? Math.round(totalBalance / daysRemaining) : 0;
  const isBudgetCritical = dailyBudget < 10000 && totalBalance > 0;

  return {
    daysRemaining,
    dailyBudget,
    isBudgetCritical,
    safePayday,
    todayNum,
    isConfigured: true,
  };
}

export default function PayCycleCard({
  netSalary,
  paydayWithMonth,
  totalBalance,
  todayExpenses,
  accountsCount = 0,
  todayTransactionsCount = 0,
}: PayCycleCardProps) {
  const { daysRemaining, dailyBudget, isBudgetCritical, safePayday, todayNum, isConfigured } = computePayCycle(
    paydayWithMonth,
    totalBalance
  );

  const rhythmAlert = isConfigured && dailyBudget > 0 && todayExpenses > dailyBudget;
  const budgetRatio = dailyBudget > 0 ? Math.round((todayExpenses / dailyBudget) * 100) : 0;
  const cycleProgress = isConfigured ? Math.min(100, Math.max(4, Math.round(((30 - daysRemaining) / 30) * 100))) : 0;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* ═══════════════════ CARTE PRINCIPALE : CYCLE DE PAIE ═══════════════════ */}
      <div className="card animate-fade-in-up p-4 sm:p-6 bg-gradient-to-br from-[#EF4444]/10 via-[#18181B] to-[#18181B] border border-[#EF4444]/30 rounded-2xl sm:rounded-3xl shadow-2xl">
        {/* En-tête de la carte */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444] shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#FAFAFA] tracking-tight">
                Cycle de Paie
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                {isConfigured
                  ? `Versement prévu le ${safePayday} du mois · Jour ${todayNum} en cours`
                  : "Aucun jour de paie configuré"}
              </p>
            </div>
          </div>

          {isConfigured ? (
            <span className="badge badge-success inline-flex items-center gap-1.5 px-3 py-1 text-xs self-start sm:self-auto">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#EF4444] inline-block" />
              Cycle actif (J-{daysRemaining})
            </span>
          ) : (
            <span className="badge inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-[#27272A] text-[#A1A1AA] border border-[#3F3F46] self-start sm:self-auto">
              Jour non défini
            </span>
          )}
        </div>

        {/* Les deux métriques affichées côte à côte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Métrique 1 : Jours restants avant la paie */}
          <div className="bg-[#09090B] border border-[#27272A] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                Jours restants avant la paie
              </span>
              <Clock className="w-4 h-4 text-[#A1A1AA]" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl sm:text-5xl font-extrabold tracking-tight tabular-nums ${
                isConfigured ? "text-[#FAFAFA]" : "text-[#71717A]"
              }`}>
                {isConfigured ? daysRemaining : "Non défini"}
              </span>
              {isConfigured && (
                <span className="text-xs sm:text-sm font-semibold text-[#A1A1AA]">
                  {daysRemaining > 1 ? "jours restants" : "jour restant"}
                </span>
              )}
            </div>

            {/* Barre d'avancement du cycle */}
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-[#71717A] mb-1">
                <span>Cycle en cours</span>
                <span>{isConfigured ? `Prochaine paie : le ${safePayday}` : "Jour de paie requis"}</span>
              </div>
              <div className="h-1.5 w-full bg-[#18181B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#EF4444] to-[#f87171] rounded-full transition-all duration-400"
                  style={{ width: `${cycleProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Métrique 2 : Budget journalier autorisé */}
          <div className={`bg-[#09090B] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between border ${
            isBudgetCritical ? "border-[#EF4444]/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "border-[#27272A]"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                isBudgetCritical ? "text-[#f87171]" : "text-[#A1A1AA]"
              }`}>
                Budget journalier autorisé
              </span>
              <Zap className="w-4 h-4 text-[#EF4444]" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-5xl font-extrabold tracking-tight tabular-nums text-[#EF4444]">
                {fmt(dailyBudget)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#A1A1AA]">
                FCFA / jour
              </span>
            </div>

            <div className="mt-2">
              <p className="text-[11px] font-medium text-[#A1A1AA] mb-1.5">
                Solde ({fmt(totalBalance)} FCFA) ÷ {daysRemaining} {daysRemaining > 1 ? "jours" : "jour"}
              </p>
              <div className="flex items-center gap-1.5">
                {isBudgetCritical ? (
                  <span className="badge badge-danger text-[10px] px-2 py-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    Vigilance : budget sous 10 000 FCFA/j
                  </span>
                ) : (
                  <span className="badge badge-success text-[10px] px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Rythme conseillé équilibré
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ KPIs SECONDAIRES ═══════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Solde total disponible */}
        <div className="card animate-fade-in-up-2 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#A1A1AA] font-bold uppercase tracking-wider">
              Solde total disponible
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {fmt(totalBalance)} <span className="text-xs font-semibold text-[#A1A1AA]">FCFA</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#71717A]">
            <span>Consolidé sur {accountsCount} compte{accountsCount > 1 ? "s" : ""}</span>
            {netSalary > 0 && (
              <span>· Salaire : {fmt(netSalary)} FCFA</span>
            )}
          </div>
        </div>

        {/* Dépenses du jour */}
        <div className="card animate-fade-in-up-3 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#A1A1AA] font-bold uppercase tracking-wider">
              Dépenses aujourd'hui
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {fmt(todayExpenses)} <span className="text-xs font-semibold text-[#A1A1AA]">FCFA</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`badge ${rhythmAlert ? "badge-danger" : "badge-warning"} text-[10px] px-2 py-0.5`}>
              {rhythmAlert ? "⚠ Dépasse le budget journalier" : dailyBudget > 0 ? `${budgetRatio}% du budget/j` : "Aucune dépense"}
            </span>
            <span className="text-[11px] text-[#71717A]">
              ({todayTransactionsCount} transaction{todayTransactionsCount > 1 ? "s" : ""})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
