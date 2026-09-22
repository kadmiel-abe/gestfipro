"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Send,
  ChevronRight,
  ShieldAlert,
  Clock,
  ArrowRight,
} from "lucide-react";
import PayCycleCard from "./PayCycleCard";
import PaydayCard from "./dashboard/payday-card";
import AddExpenseModal from "./dashboard/add-expense-modal";
import GoalsCard from "./dashboard/goals-card";
import MiniCalendar from "./MiniCalendar";
import { AccountIcon } from "./AccountIcon";
import { Profile, Account, Transaction, Goal } from "@/lib/types";

// Dynamic imports for chart components
const CashflowChart = dynamic(() => import("./CashflowChart"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 200,
        background: "#09090B",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "#52525B", fontSize: 12 }}>Chargement du graphique…</span>
    </div>
  ),
});

const DonutChart = dynamic(() => import("./DonutChart"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#52525B", fontSize: 12 }}>…</span>
    </div>
  ),
});

interface DashboardViewProps {
  profile: Profile | null;
  accounts: Account[];
  transactions: Transaction[];
  goals?: Goal[];
  isLoading?: boolean;
  onOpenModal: () => void;
  onNavigate: (tab: string) => void;
  onQuickSubmit: (e: React.FormEvent) => void;
  quickInputText: string;
  setQuickInputText: (text: string) => void;
  todayExpenses: number;
  totalBalance: number;
  /** ID de l'utilisateur Supabase Auth — nécessaire pour l'insertion directe */
  userId?: string | null;
  /** Callback après ajout d'une transaction (permet au parent de rafraîchir) */
  onTransactionAdded?: () => void;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function formatDateFr(d: Date): string {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DashboardView({
  profile,
  accounts,
  transactions,
  goals = [],
  isLoading = false,
  onOpenModal,
  onNavigate,
  onQuickSubmit,
  quickInputText,
  setQuickInputText,
  todayExpenses,
  totalBalance,
  userId = null,
  onTransactionAdded,
}: DashboardViewProps) {
  const now = new Date();
  const todayNum = now.getDate();
  const dateStr = formatDateFr(now);

  // ── État interne de la modal de saisie rapide ──
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const netSalary = profile?.net_salary ?? 0;
  const paydayWithMonth = profile?.payday_with_month ?? 0;
  const rawName = profile?.full_name?.trim() || "";
  const firstName = rawName.split(" ")[0] || "";
  const displayGreeting = firstName && firstName.toLowerCase() !== "utilisateur"
    ? `Bonjour ${firstName} 👋`
    : "Bonjour 👋";

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-5 px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
      {/* ── BANNIÈRE SALUTATION + SALAIRE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {isLoading ? (
            <div className="flex flex-col gap-2 min-h-[48px]">
              <div className="w-48 sm:w-56 h-6 bg-[#27272A] rounded-lg animate-pulse" />
              <div className="w-36 sm:w-44 h-4 bg-[#1F1F23] rounded-md animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
                  {displayGreeting}
                </h2>
              </div>
              <p className="text-xs text-[#A1A1AA]">
                {dateStr} · Suivi budgétaire en temps réel
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-3.5 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2">
            <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">
              Salaire net mensuel
            </p>
            <p className="text-base sm:text-lg font-extrabold text-[#FAFAFA] tabular-nums">
              {fmt(netSalary)} FCFA
            </p>
          </div>
          <button onClick={() => setShowExpenseModal(true)} className="btn-primary py-2.5 px-4 text-xs shrink-0">
            <Plus className="w-4 h-4" />
            <span>Nouvelle dépense</span>
          </button>
        </div>
      </div>

      {/* ── COMPOSANT PHARE : PAYDAY CARD (Hero Card) ── */}
      <PaydayCard
        paydayDate={paydayWithMonth}
        totalBalance={totalBalance}
        currency="FCFA"
        onNavigate={onNavigate}
      />

      {/* ── COMPOSANT CLE : PAYCYCLECARD ── */}
      <PayCycleCard
        netSalary={netSalary}
        paydayWithMonth={paydayWithMonth}
        totalBalance={totalBalance}
        todayExpenses={todayExpenses}
        accountsCount={accounts.length}
        todayTransactionsCount={transactions.filter((t) => t.date?.startsWith("Auj") || t.date?.includes("instant")).length}
      />

      {/* ── BENTO GRID ANALYTICS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Cashflow Chart */}
        <div className="card animate-fade-in-up-5 p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA]">
                Évolution du Solde & Flux
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">Trésorerie sur le cycle en cours</p>
            </div>
            <span className="badge text-[10px] px-2 py-0.5">XOF (FCFA)</span>
          </div>
          <CashflowChart transactions={transactions} totalBalance={totalBalance} />
        </div>

        {/* Mini Calendrier du cycle */}
        <div className="card animate-fade-in-up-5 p-4 sm:p-5 flex flex-col justify-between">
          <MiniCalendar
            today={todayNum}
            paydayDate={paydayWithMonth}
            expenseDays={transactions
              .filter((t) => t.type === "expense" || t.amount < 0)
              .map((t) => {
                if (t.transaction_date) return new Date(t.transaction_date).getDate();
                return 0;
              })
              .filter((d) => d > 0)}
          />
        </div>

        {/* Donut Catégories */}
        <div className="card animate-fade-in-up-6 p-4 sm:p-5 flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA]">
                Répartition des Dépenses
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">Par catégorie</p>
            </div>
            <button
              onClick={() => onNavigate("statistiques")}
              className="text-[11px] text-[#EF4444] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>Détails</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <DonutChart transactions={transactions} />
        </div>
      </div>

      {/* ── SECTION COMPTES D'AFRIQUE DE L'OUEST ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-[#FAFAFA]">
            Mes Comptes de Trésorerie
          </h3>
          <button
            onClick={() => onNavigate("comptes")}
            className="text-xs text-[#EF4444] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Gérer les comptes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="card p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 bg-[#18181B]/50 border-dashed border-[#3F3F46] rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA] mb-1">
                Aucun compte enregistré
              </p>
              <p className="text-xs text-[#A1A1AA] max-w-sm">
                Ajoutez vos supports de trésorerie (Espèces, Wave, Orange Money, Banque...) pour suivre vos soldes au même endroit.
              </p>
            </div>
            <button
              onClick={() => onNavigate("comptes")}
              className="btn-primary py-2 px-4 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter mon premier compte</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="card p-4 rounded-xl sm:rounded-2xl flex items-center gap-3.5 cursor-pointer hover:border-[#EF4444]/50 transition-all hover:scale-[1.01]"
                onClick={() => onNavigate("comptes")}
              >
                <AccountIcon name={acc.name} size={40} radius={10} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-[#FAFAFA] truncate">
                    {acc.name}
                  </p>
                  <p className="text-[11px] text-[#A1A1AA]">{acc.type}</p>
                  <p className="text-sm sm:text-base font-extrabold text-[#FAFAFA] mt-1 tabular-nums">
                    {fmt(acc.balance)} <span className="text-[10px] text-[#A1A1AA] font-semibold">FCFA</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION SAISIE RAPIDE ── */}
      <div className="card p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#18181B] via-[#221c1c] to-[#18181B] border border-[#3F3F46]">
        <form onSubmit={onQuickSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">
          <input
            type="text"
            className="input-field flex-1 text-xs sm:text-sm"
            value={quickInputText}
            onChange={(e) => setQuickInputText(e.target.value)}
            placeholder="⚡ Saisie rapide : ex. 'Déjeuner 3000 Espèces' ou 'Essence 10000 Wave'..."
          />
          <button type="submit" className="btn-primary py-2.5 px-5 text-xs font-bold shrink-0 justify-center">
            <Send className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </form>
      </div>

      {/* ── SECTION OBJECTIFS D'ÉPARGNE ── */}
      <div>
        <GoalsCard
          goals={goals}
          userId={userId}
          onGoalChanged={onTransactionAdded}
          onNavigate={onNavigate}
        />
      </div>

      {/* ── SECTION HISTORIQUE RÉCENT + RÉPARTITION PAR CATÉGORIE (Grid 2 colonnes) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* ════════ COLONNE 1 : HISTORIQUE RÉCENT ════════ */}
        <div className="card p-4 sm:p-6 rounded-2xl flex flex-col justify-between">
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Clock size={14} color="#EF4444" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#FAFAFA",
                    lineHeight: 1.2,
                  }}
                >
                  Historique Récent
                </h3>
                <p style={{ fontSize: 10, color: "#71717A", marginTop: 1 }}>
                  5 dernières opérations
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("historique")}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#EF4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "4px 8px",
                borderRadius: 6,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "rgba(239,68,68,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Voir tout <ChevronRight size={12} />
            </button>
          </div>

          {/* Liste des transactions */}
          {transactions.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 0",
                color: "#71717A",
              }}
            >
              <Clock
                size={32}
                style={{ margin: "0 auto 10px", opacity: 0.4 }}
              />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#A1A1AA" }}>
                Aucune transaction
              </p>
              <p style={{ fontSize: 11, marginTop: 4, textAlign: "center" }}>
                Cliquez sur « Nouvelle dépense » pour
                <br />
                enregistrer votre premier mouvement.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                flex: 1,
              }}
            >
              {transactions.slice(0, 5).map((tx) => {
                const isExpense =
                  tx.type === "expense" || tx.amount < 0;
                const absAmount = Math.abs(tx.amount);

                // Date relative
                let relativeDate = tx.date || "";
                if (tx.transaction_date) {
                  const txD = new Date(tx.transaction_date);
                  const diffMs = now.getTime() - txD.getTime();
                  const diffDays = Math.floor(
                    diffMs / (1000 * 60 * 60 * 24)
                  );
                  if (diffDays === 0) relativeDate = "Aujourd'hui";
                  else if (diffDays === 1) relativeDate = "Hier";
                  else if (diffDays < 7)
                    relativeDate = `Il y a ${diffDays} jours`;
                  else
                    relativeDate = txD.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    });
                }

                return (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#09090B",
                      border: "1px solid #27272A",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor =
                        "#3F3F46")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        "#27272A")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {/* Icône type */}
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: isExpense
                            ? "rgba(239,68,68,0.1)"
                            : "rgba(255,255,255,0.08)",
                          color: isExpense
                            ? "#EF4444"
                            : "#FAFAFA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {isExpense ? "↑" : "↓"}
                      </div>
                      {/* Détails */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#FAFAFA",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {tx.title || (tx as any).label}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          {/* Badge catégorie */}
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background:
                                "rgba(239,68,68,0.08)",
                              color: "#A1A1AA",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {tx.category}
                          </span>
                          {/* Compte source */}
                          <span
                            style={{
                              fontSize: 10,
                              color: "#52525B",
                            }}
                          >
                            {tx.account ||
                              "Compte principal"}
                          </span>
                          {/* Séparateur */}
                          <span
                            style={{
                              fontSize: 10,
                              color: "#3F3F46",
                            }}
                          >
                            •
                          </span>
                          {/* Date relative */}
                          <span
                            style={{
                              fontSize: 10,
                              color: "#52525B",
                            }}
                          >
                            {relativeDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Montant */}
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isExpense
                          ? "#EF4444"
                          : "#FAFAFA",
                        whiteSpace: "nowrap",
                        marginLeft: 12,
                      }}
                    >
                      {isExpense ? "-" : "+"} {fmt(absAmount)}{" "}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: "#71717A",
                        }}
                      >
                        FCFA
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════ COLONNE 2 : RÉPARTITION PAR CATÉGORIE ════════ */}
        <div
          className="card"
          style={{
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={14} color="#EF4444" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#FAFAFA",
                    lineHeight: 1.2,
                  }}
                >
                  Répartition des Dépenses
                </h3>
                <p style={{ fontSize: 10, color: "#71717A", marginTop: 1 }}>
                  Mois en cours par catégorie
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("statistiques")}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#EF4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "4px 8px",
                borderRadius: 6,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "rgba(239,68,68,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Détails <ChevronRight size={12} />
            </button>
          </div>

          {/* Donut Chart + Légende détaillée */}
          {(() => {
            // Filtrer les dépenses du mois en cours
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const monthExpenses = transactions.filter((t) => {
              const isExp = t.type === "expense" || t.amount < 0;
              if (!isExp) return false;
              if (t.transaction_date) {
                const d = new Date(t.transaction_date);
                return (
                  d.getMonth() === currentMonth &&
                  d.getFullYear() === currentYear
                );
              }
              return true; // inclure les transactions sans date parsée
            });

            const categoryColorMap: Record<string, string> = {
              Nourriture: "#EF4444",
              Transport: "#DC2626",
              Logement: "#B91C1C",
              Factures: "#F87171",
              Loisirs: "#F87171",
              Santé: "#FAFAFA",
              Éducation: "#E4E4E7",
              Vêtements: "#A1A1AA",
              Divers: "#71717A",
              Autres: "#71717A",
            };

            // Agréger par catégorie
            const categoryMap = new Map<
              string,
              { total: number; color: string }
            >();
            monthExpenses.forEach((t) => {
              const cat = t.category || "Divers";
              const existing = categoryMap.get(cat) || {
                total: 0,
                color:
                  categoryColorMap[cat] || "#71717A",
              };
              existing.total += Math.abs(t.amount);
              categoryMap.set(cat, existing);
            });

            const categories = Array.from(
              categoryMap.entries()
            )
              .map(([label, data]) => ({
                label,
                value: data.total,
                color: data.color,
              }))
              .sort((a, b) => b.value - a.value);

            const grandTotal = categories.reduce(
              (acc, c) => acc + c.value,
              0
            );

            if (grandTotal === 0) {
              return (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "32px 0",
                    color: "#71717A",
                  }}
                >
                  <ShieldAlert
                    size={32}
                    style={{
                      margin: "0 auto 10px",
                      opacity: 0.4,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#A1A1AA",
                    }}
                  >
                    Aucune dépense ce mois
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    Les données de répartition
                    <br />
                    apparaîtront avec vos premières dépenses.
                  </p>
                </div>
              );
            }

            // SVG Donut dimensions
            const svgSize = 130;
            const strokeW = 18;
            const radius =
              (svgSize - strokeW) / 2;
            const circumference =
              2 * Math.PI * radius;

            let cumulativeOffset = 0;

            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  flex: 1,
                }}
              >
                {/* Donut SVG centré */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  <svg
                    width={svgSize}
                    height={svgSize}
                    viewBox={`0 0 ${svgSize} ${svgSize}`}
                  >
                    {/* Fond gris */}
                    <circle
                      cx={svgSize / 2}
                      cy={svgSize / 2}
                      r={radius}
                      fill="none"
                      stroke="#27272A"
                      strokeWidth={strokeW}
                    />
                    {/* Segments colorés */}
                    {categories.map((cat) => {
                      const pct =
                        cat.value / grandTotal;
                      const dashLen =
                        pct * circumference;
                      const gapLen =
                        circumference - dashLen;
                      const offset =
                        cumulativeOffset;
                      cumulativeOffset +=
                        dashLen;

                      return (
                        <circle
                          key={cat.label}
                          cx={svgSize / 2}
                          cy={svgSize / 2}
                          r={radius}
                          fill="none"
                          stroke={cat.color}
                          strokeWidth={strokeW}
                          strokeDasharray={`${dashLen} ${gapLen}`}
                          strokeDashoffset={-offset}
                          strokeLinecap="butt"
                          style={{
                            transform:
                              "rotate(-90deg)",
                            transformOrigin:
                              "50% 50%",
                            transition:
                              "stroke-dasharray 0.6s ease",
                          }}
                        />
                      );
                    })}
                  </svg>
                  {/* Total au centre */}
                  <div
                    style={{
                      position: "absolute",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#FAFAFA",
                        lineHeight: 1,
                      }}
                    >
                      {fmt(grandTotal)}
                    </p>
                    <p
                      style={{
                        fontSize: 9,
                        color: "#71717A",
                        fontWeight: 500,
                        marginTop: 2,
                      }}
                    >
                      FCFA ce mois
                    </p>
                  </div>
                </div>

                {/* Légende détaillée */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {categories.map((cat) => {
                    const pct =
                      grandTotal > 0
                        ? Math.round(
                            (cat.value /
                              grandTotal) *
                              100
                          )
                        : 0;
                    return (
                      <div
                        key={cat.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "#09090B",
                          border:
                            "1px solid #27272A",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 3,
                              background:
                                cat.color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#FAFAFA",
                            }}
                          >
                            {cat.label}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#FAFAFA",
                            }}
                          >
                            {fmt(cat.value)}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "#71717A",
                              background:
                                "rgba(255,255,255,0.04)",
                              padding: "2px 6px",
                              borderRadius: 4,
                              minWidth: 36,
                              textAlign: "center",
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>


      {/* ── MODAL DE SAISIE RAPIDE (AddExpenseModal) ── */}
      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        accounts={accounts}
        userId={userId}
        onTransactionAdded={() => {
          // Fermer la modal et notifier le parent pour rafraîchir les données
          setShowExpenseModal(false);
          if (onTransactionAdded) {
            onTransactionAdded();
          }
        }}
      />
    </div>
  );
}
