"use client";

import React from "react";
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
import MiniCalendar from "./MiniCalendar";
import { AccountIcon } from "./AccountIcon";
import { Profile, Account, Transaction } from "@/lib/types";

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
  isLoading?: boolean;
  onOpenModal: () => void;
  onNavigate: (tab: string) => void;
  onQuickSubmit: (e: React.FormEvent) => void;
  quickInputText: string;
  setQuickInputText: (text: string) => void;
  todayExpenses: number;
  totalBalance: number;
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
  isLoading = false,
  onOpenModal,
  onNavigate,
  onQuickSubmit,
  quickInputText,
  setQuickInputText,
  todayExpenses,
  totalBalance,
}: DashboardViewProps) {
  const now = new Date();
  const todayNum = now.getDate();
  const dateStr = formatDateFr(now);

  const netSalary = profile?.net_salary ?? 0;
  const paydayWithMonth = profile?.payday_with_month ?? 28;
  const rawName = profile?.full_name?.trim() || "";
  const displayGreeting = rawName && rawName.toLowerCase() !== "utilisateur"
    ? `Bonjour, ${rawName} 👋`
    : "Bienvenue sur GestFiPro 👋";

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 1400, margin: "0 auto" }}>
      {/* ── BANNIÈRE SALUTATION + SALAIRE ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.03em" }}>
              {displayGreeting}
            </h2>
            {isLoading && (
              <span style={{ fontSize: 10, color: "#EF4444", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 12 }}>
                Synchronisation Supabase…
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "#A1A1AA" }}>
            {dateStr} · Suivi budgétaire en temps réel
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              textAlign: "right",
              background: "#18181B",
              border: "1px solid #27272A",
              borderRadius: 12,
              padding: "8px 16px",
            }}
          >
            <p style={{ fontSize: 10, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Salaire net mensuel
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#FAFAFA" }}>
              {fmt(netSalary)} FCFA
            </p>
          </div>
          <button onClick={onOpenModal} className="btn-primary">
            <Plus size={14} />
            Nouvelle dépense
          </button>
        </div>
      </div>

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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {/* Cashflow Chart */}
        <div className="card animate-fade-in-up-5" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA", marginBottom: 3 }}>
                Évolution du Solde & Flux
              </h3>
              <p style={{ fontSize: 11, color: "#A1A1AA" }}>Trésorerie sur le cycle de paie en cours</p>
            </div>
            <span className="badge" style={{ fontSize: 10 }}>XOF (FCFA)</span>
          </div>
          <CashflowChart transactions={transactions} totalBalance={totalBalance} />
        </div>

        {/* Mini Calendrier du cycle */}
        <div className="card animate-fade-in-up-5" style={{ padding: "20px 20px" }}>
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
        <div className="card animate-fade-in-up-6" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA", marginBottom: 3 }}>
                Répartition des Dépenses
              </h3>
              <p style={{ fontSize: 11, color: "#A1A1AA" }}>Par catégorie</p>
            </div>
            <button
              onClick={() => onNavigate("statistiques")}
              style={{
                fontSize: 11,
                color: "#EF4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              Détails <ChevronRight size={12} />
            </button>
          </div>
          <DonutChart transactions={transactions} />
        </div>
      </div>

      {/* ── SECTION COMPTES D'AFRIQUE DE L'OUEST ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA" }}>
            Mes Comptes de Trésorerie
          </h3>
          <button
            onClick={() => onNavigate("comptes")}
            style={{
              fontSize: 12,
              color: "#EF4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Gérer les comptes <ArrowRight size={13} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="card"
              style={{
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                transition: "transform 0.2s, border-color 0.2s",
              }}
              onClick={() => onNavigate("comptes")}
            >
              <AccountIcon name={acc.name} size={42} radius={10} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {acc.name}
                </p>
                <p style={{ fontSize: 11, color: "#A1A1AA" }}>{acc.type}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#FAFAFA", marginTop: 4 }}>
                  {fmt(acc.balance)} <span style={{ fontSize: 10, color: "#A1A1AA", fontWeight: 500 }}>FCFA</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION SAISIE RAPIDE ── */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: 24,
          background: "linear-gradient(135deg, rgba(24,24,27,0.9), rgba(39,39,42,0.6))",
          border: "1px solid #3F3F46",
        }}
      >
        <form onSubmit={onQuickSubmit} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            className="input-field"
            value={quickInputText}
            onChange={(e) => setQuickInputText(e.target.value)}
            placeholder="⚡ Saisie rapide : ex. 'Déjeuner 3000 Espèces' ou 'Essence 10000 Wave'..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" style={{ flexShrink: 0, padding: "10px 18px" }}>
            <Send size={14} />
            Ajouter
          </button>
        </form>
      </div>

      {/* ── SECTION DERNIÈRES TRANSACTIONS ── */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>
            Dernières Opérations Enregistrées
          </h3>
          <button
            onClick={() => onNavigate("historique")}
            style={{
              fontSize: 11,
              color: "#EF4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            Tout l'historique <ChevronRight size={12} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#71717A" }}>
            <Clock size={32} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
            <p style={{ fontSize: 13, fontWeight: 500 }}>Aucune transaction enregistrée pour l'instant</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Cliquez sur « Nouvelle dépense » pour enregistrer votre premier mouvement.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {transactions.slice(0, 5).map((tx) => {
              const isExpense = tx.type === "expense" || tx.amount < 0;
              const absAmount = Math.abs(tx.amount);
              return (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#09090B",
                    border: "1px solid #27272A",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: isExpense ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                        color: isExpense ? "#EF4444" : "#4ade80",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {isExpense ? "↑" : "↓"}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA" }}>
                        {tx.title || (tx as any).label}
                      </p>
                      <p style={{ fontSize: 11, color: "#71717A" }}>
                        {tx.category} • {tx.account || "Compte principal"} • {tx.date || new Date(tx.transaction_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isExpense ? "#EF4444" : "#4ade80",
                      }}
                    >
                      {isExpense ? "-" : "+"} {fmt(absAmount)} FCFA
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
