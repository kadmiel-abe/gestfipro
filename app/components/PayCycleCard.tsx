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

export function computePayCycle(paydayWithMonth: number, totalBalance: number) {
  const now = new Date();
  const todayNum = now.getDate();
  const safePayday = paydayWithMonth > 0 && paydayWithMonth <= 31 ? paydayWithMonth : 28;

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
  };
}

export default function PayCycleCard({
  netSalary,
  paydayWithMonth,
  totalBalance,
  todayExpenses,
  accountsCount = 4,
  todayTransactionsCount = 0,
}: PayCycleCardProps) {
  const { daysRemaining, dailyBudget, isBudgetCritical, safePayday, todayNum } = computePayCycle(
    paydayWithMonth,
    totalBalance
  );

  const rhythmAlert = dailyBudget > 0 && todayExpenses > dailyBudget;
  const budgetRatio = dailyBudget > 0 ? Math.round((todayExpenses / dailyBudget) * 100) : 0;
  const cycleProgress = Math.min(100, Math.max(4, Math.round(((30 - daysRemaining) / 30) * 100)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
      {/* ═══════════════════ CARTE PRINCIPALE : CYCLE DE PAIE ═══════════════════ */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: "24px 26px",
          background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, #18181B 50%, #18181B 100%)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* En-tête de la carte */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={20} color="#EF4444" />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.02em", margin: 0 }}>
                Cycle de Paie
              </h3>
              <p style={{ fontSize: 12, color: "#A1A1AA", margin: "2px 0 0 0" }}>
                Versement prévu le {safePayday} du mois · Jour {todayNum} en cours
              </p>
            </div>
          </div>

          <span className="badge badge-success" style={{ gap: 6, padding: "5px 12px", fontSize: 11 }}>
            <span
              className="pulse-dot"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}
            />
            Cycle actif (J-{daysRemaining})
          </span>
        </div>

        {/* Les deux métriques affichées EN GROS côte à côte */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {/* Métrique 1 : Jours restants avant la paie */}
          <div
            style={{
              background: "#09090B",
              border: "1px solid #27272A",
              borderRadius: 14,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#A1A1AA",
                }}
              >
                Jours restants avant la paie
              </span>
              <Clock size={16} color="#A1A1AA" />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: "3rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  color: "#FAFAFA",
                }}
              >
                {daysRemaining}
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#A1A1AA" }}>
                {daysRemaining > 1 ? "jours restants" : "jour restant"}
              </span>
            </div>

            {/* Barre d'avancement du cycle */}
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#71717A", marginBottom: 4 }}>
                <span>Cycle en cours</span>
                <span>Prochaine paie : le {safePayday}</span>
              </div>
              <div style={{ height: 6, width: "100%", background: "#18181B", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${cycleProgress}%`,
                    background: "linear-gradient(90deg, #EF4444, #f87171)",
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Métrique 2 : Budget journalier autorisé */}
          <div
            style={{
              background: "#09090B",
              border: isBudgetCritical ? "1px solid rgba(239,68,68,0.45)" : "1px solid #27272A",
              borderRadius: 14,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: isBudgetCritical ? "0 0 24px rgba(239,68,68,0.12)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: isBudgetCritical ? "#f87171" : "#A1A1AA",
                }}
              >
                Budget journalier autorisé
              </span>
              <Zap size={16} color="#EF4444" />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: "3rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  color: "#EF4444",
                }}
              >
                {fmt(dailyBudget)}
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#A1A1AA" }}>
                FCFA / jour
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              <p style={{ fontSize: 11, color: "#A1A1AA", margin: "0 0 6px 0", lineHeight: 1.4 }}>
                Solde total disponible ({fmt(totalBalance)} FCFA) ÷ {daysRemaining} {daysRemaining > 1 ? "jours" : "jour"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {isBudgetCritical ? (
                  <span className="badge badge-danger" style={{ fontSize: 10 }}>
                    <AlertTriangle size={10} />
                    Vigilance : budget sous 10 000 FCFA/j
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: 10 }}>
                    <CheckCircle2 size={10} />
                    Rythme conseillé équilibré
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ KPIs SECONDAIRES ═══════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {/* Solde total disponible */}
        <div className="card animate-fade-in-up-2" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Solde total disponible
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircleDollarSign size={14} color="#EF4444" />
            </div>
          </div>
          <p className="kpi-value">{fmt(totalBalance)} <span style={{ fontSize: 13, fontWeight: 500, color: "#A1A1AA" }}>FCFA</span></p>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#71717A" }}>
              Consolidé sur {accountsCount} compte{accountsCount > 1 ? "s" : ""}
            </span>
            {netSalary > 0 && (
              <span style={{ fontSize: 11, color: "#52525B" }}>
                · Salaire : {fmt(netSalary)} FCFA
              </span>
            )}
          </div>
        </div>

        {/* Dépenses du jour */}
        <div className="card animate-fade-in-up-3" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Dépenses aujourd'hui
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(251,191,36,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingDown size={14} color="#fbbf24" />
            </div>
          </div>
          <p className="kpi-value">{fmt(todayExpenses)} <span style={{ fontSize: 13, fontWeight: 500, color: "#A1A1AA" }}>FCFA</span></p>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span className={`badge ${rhythmAlert ? "badge-danger" : "badge-warning"}`} style={{ fontSize: 10 }}>
              {rhythmAlert ? "⚠ Dépasse le budget journalier" : dailyBudget > 0 ? `${budgetRatio}% du budget journalier` : "Aucune dépense"}
            </span>
            <span style={{ fontSize: 11, color: "#71717A" }}>
              ({todayTransactionsCount} transaction{todayTransactionsCount > 1 ? "s" : ""})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
