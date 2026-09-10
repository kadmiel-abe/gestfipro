"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  LayoutDashboard,
  Wallet,
  BarChart3,
  Settings,
  Plus,
  Send,
  Mic,
  Search,
  Bell,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Zap,
  Clock,
  CircleDollarSign,
  BadgeCheck,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  X,
  PiggyBank,
  Menu,
  Briefcase,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import MiniCalendar from "./components/MiniCalendar";
import { SidebarLogoFull, SidebarLogoIcon } from "./components/Logo";
import { AccountIcon, getAccountColor } from "./components/AccountIcon";

// Dynamic imports for chart components (client-only)
const CashflowChart = dynamic(() => import("./components/CashflowChart"), {
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

const DonutChart = dynamic(() => import("./components/DonutChart"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#52525B", fontSize: 12 }}>…</span>
    </div>
  ),
});

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = "accueil" | "comptes" | "historique" | "statistiques" | "objectifs" | "reglages" | "business" | "guide";

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  colorClass: string;
  icon: string;
}

interface Transaction {
  id: number;
  label: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  account: string;
  icon: string;
}

interface Objective {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function formatDateFr(d: Date): string {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Modal Component ─────────────────────────────────────────────────────────

interface AddTransactionModalProps {
  accounts: Account[];
  onClose: () => void;
  onAdd: (tx: Omit<Transaction, "id">) => void;
}

function AddTransactionModal({ accounts, onClose, onAdd }: AddTransactionModalProps) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Nourriture");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [account, setAccount] = useState(accounts[0]?.name ?? "Espèces");

  const categories = ["Nourriture", "Transport", "Logement", "Loisirs", "Santé", "Éducation", "Vêtements", "Divers"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !amount) return;
    onAdd({
      label,
      category,
      amount: type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
      type,
      date: "À l'instant",
      account,
      icon: type === "income" ? "⬇" : "⬆",
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card animate-fade-in-up"
        style={{ width: "100%", maxWidth: 440, padding: 24, margin: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FAFAFA" }}>Nouvelle saisie</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#A1A1AA", cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Type toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setType("expense")}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 10,
                border: type === "expense" ? "1px solid rgba(239,68,68,0.5)" : "1px solid #27272A",
                background: type === "expense" ? "rgba(239,68,68,0.1)" : "#09090B",
                color: type === "expense" ? "#f87171" : "#A1A1AA",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Dépense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 10,
                border: type === "income" ? "1px solid rgba(34,197,94,0.4)" : "1px solid #27272A",
                background: type === "income" ? "rgba(34,197,94,0.08)" : "#09090B",
                color: type === "income" ? "#4ade80" : "#A1A1AA",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Entrée d'argent
            </button>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#A1A1AA", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Libellé</label>
            <input className="input-field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Supermarché Hayat..." required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#A1A1AA", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Montant (FCFA)</label>
            <input className="input-field" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 35000" required min={1} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#A1A1AA", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Catégorie</label>
              <select
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ appearance: "none" }}
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#A1A1AA", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Compte</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Prévisualisation icône opérateur sélectionné */}
                <AccountIcon name={account} size={32} radius={8} />
                <select
                  className="input-field"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  style={{ appearance: "none", flex: 1 }}
                >
                  {accounts.map((a) => <option key={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ justifyContent: "center", marginTop: 4 }}>
            <Plus size={14} />
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function GestFiProDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("accueil");
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);          // point rouge cloche
  const [activeNotif, setActiveNotif] = useState<null | { icon: string; title: string; desc: string; detail: string; time: string; color: string }>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [userName, setUserName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [paydayDate, setPaydayDate] = useState(28);

  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, name: "Espèces",      type: "Espèces",      balance: 0, colorClass: getAccountColor("Espèces"),      icon: "💵" },
    { id: 2, name: "Wave",         type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Wave"),         icon: "🌊" },
    { id: 3, name: "Orange Money", type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Orange Money"), icon: "🟠" },
    { id: 4, name: "Banque",       type: "Banque",        balance: 0, colorClass: getAccountColor("Banque"),       icon: "🏦" },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [objectives, setObjectives] = useState<Objective[]>([]);

  const [quickInputText, setQuickInputText] = useState("");

  // ─── Computed values ──────────────────────────────────────────────────────
  const now = new Date();
  const todayNum = now.getDate();
  const dateStr = formatDateFr(now);

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  let daysRemaining = paydayDate - todayNum;
  if (daysRemaining <= 0) daysRemaining += 30;

  const dailyBudget = daysRemaining > 0 ? Math.round(totalBalance / daysRemaining) : 0;

  const todayExpenses = transactions
    .filter((t) => t.type === "expense" && t.date.startsWith("Auj"))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const isBudgetCritical = dailyBudget < 10000;
  const rhythmAlert = todayExpenses > dailyBudget;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAddTransaction = (tx: Omit<Transaction, "id">) => {
    const newTx = { ...tx, id: Date.now() };
    setTransactions((prev) => [newTx, ...prev]);
    if (tx.type === "expense") {
      setAccounts((prev) =>
        prev.map((a) => (a.name === tx.account ? { ...a, balance: a.balance + tx.amount } : a))
      );
    } else {
      setAccounts((prev) =>
        prev.map((a) => (a.name === tx.account ? { ...a, balance: a.balance + tx.amount } : a))
      );
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInputText.trim()) return;
    handleAddTransaction({
      label: quickInputText,
      category: "Divers",
      amount: -5000,
      type: "expense",
      date: "À l'instant",
      account: "Wave",
      icon: "📝",
    });
    setQuickInputText("");
  };

  // ─── Nav items — NAVIGATION section ──────────────────────────────────────
  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "accueil",      label: "Accueil",      icon: <LayoutDashboard size={15} /> },
    { key: "comptes",      label: "Comptes",      icon: <Wallet size={15} /> },
    { key: "historique",   label: "Historique",   icon: <Clock size={15} /> },
    { key: "statistiques", label: "Statistiques", icon: <BarChart3 size={15} /> },
    { key: "business",     label: "Business",     icon: <Briefcase size={15} /> },
    { key: "reglages",     label: "Réglages",     icon: <Settings size={15} /> },
  ];

  // ─── Tool items — OUTILS section (Guide uniquement) ───────────────────────
  const toolItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "guide", label: "Guide", icon: <HelpCircle size={15} /> },
  ];

  // ─── Shared styles ────────────────────────────────────────────────────────
  const s = {
    flex: { display: "flex" } as React.CSSProperties,
    flexCol: { display: "flex", flexDirection: "column" as const },
    gap4: { gap: 4 } as React.CSSProperties,
    gap8: { gap: 8 } as React.CSSProperties,
    gap12: { gap: 12 } as React.CSSProperties,
    gap16: { gap: 16 } as React.CSSProperties,
    gap20: { gap: 20 } as React.CSSProperties,
    gap24: { gap: 24 } as React.CSSProperties,
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#09090B",
        color: "#FAFAFA",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ══════════════════════ MOBILE DRAWER OVERLAY ═══════════════════════ */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        className={sidebarOpen ? "sidebar sidebar-open" : "sidebar"}
      >
        {/* ══ SIDEBAR CONTENT ══════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* ── Logo + sous-titre + bouton fermeture ──────────────────────── */}
          <div
            style={{
              position: "relative",
              padding: "4px 4px 16px 4px",
            }}
          >
            {/* Logo — mix-blend-mode:screen, fond transparent */}
            <SidebarLogoFull onClick={() => setActiveTab("accueil")} />

            {/* Sous-titre discret */}
            <p
              style={{
                fontSize: 10,
                color: "#52525B",
                fontWeight: 500,
                letterSpacing: "0.02em",
                marginTop: 2,
                paddingLeft: 2,
              }}
            >
              Suivi financier intelligent
            </p>

            {/* ✕ fermeture mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              title="Fermer"
              aria-label="Fermer le menu"
              style={{
                position: "absolute",
                top: 4,
                right: 0,
                background: "none",
                border: "none",
                color: "#52525B",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                lineHeight: 0,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A1A1AA")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
            >
              <X size={14} />
            </button>
          </div>

          {/* ── NAVIGATION ────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 8 }}>
            <p className="section-label" style={{ paddingLeft: 12, marginBottom: 6 }}>Navigation</p>
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item${activeTab === item.key ? " active" : ""}`}
                onClick={() => {
                  setActiveTab(item.key);
                  setSidebarOpen(false);
                }}
              >
                <span style={{ color: activeTab === item.key ? "#EF4444" : "#52525B", display: "flex", alignItems: "center" }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>

          {/* ── Séparateur ───────────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid #27272A", margin: "8px 0" }} />

          {/* ── OUTILS (Guide uniquement) ─────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <p className="section-label" style={{ paddingLeft: 12, marginBottom: 6 }}>Outils</p>
            {toolItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item-tool${activeTab === item.key ? " active" : ""}`}
                onClick={() => {
                  setActiveTab(item.key);
                  setSidebarOpen(false);
                }}
                style={{
                  background: activeTab === item.key ? "rgba(239,68,68,0.08)" : undefined,
                  color: activeTab === item.key ? "#FAFAFA" : undefined,
                }}
              >
                <span style={{ color: activeTab === item.key ? "#EF4444" : "#52525B", display: "flex", alignItems: "center" }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>

        </div>

        {/* ── Profil utilisateur compact ───────────────────────────────── */}
        <div
          style={{
            padding: "10px 8px",
            borderTop: "1px solid #27272A",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 8,
          }}
        >
          {/* Avatar initiales */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #EF4444, #f97316)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: "white",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
            }}
          >
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#FAFAFA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName} ABE
            </p>
            <p style={{ fontSize: 9, color: "#52525B", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>Salarié · Côte d'Ivoire</p>
          </div>
          <button
            onClick={() => setActiveTab("reglages")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#52525B", padding: 2, display: "flex", transition: "color 0.15s" }}
            title="Paramètres"
            onMouseEnter={(e) => (e.currentTarget.style.color = "#A1A1AA")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
          >
            <Settings size={13} />
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════ MAIN AREA ════════════════════════════ */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
        <header
          style={{
            height: 60,
            borderBottom: "1px solid #27272A",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(9,9,11,0.9)",
            backdropFilter: "blur(12px)",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* ── Hamburger mobile (caché sur desktop) ── */}
            <button
              onClick={() => setSidebarOpen(true)}
              title="Ouvrir le menu"
              className="hamburger-btn"
              style={{
                background: "#18181B",
                border: "1px solid #27272A",
                borderRadius: 8,
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#A1A1AA",
              }}
            >
              <Menu size={16} />
            </button>

            {/* ── Logo icon dans le header (caché sur desktop) ── */}
            <span className="header-logo-icon">
              <SidebarLogoIcon size={32} onClick={() => setActiveTab("accueil")} />
            </span>

            <span
              className="badge badge-success"
              style={{ gap: 6 }}
            >
              <span
                className="pulse-dot"
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}
              />
              Cycle de paie actif (J-{daysRemaining})
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 10, color: "#A1A1AA", fontWeight: 500 }}>Solde Consolidé</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#FAFAFA" }}>{fmt(totalBalance)} FCFA</p>
            </div>
            <div style={{ width: 1, height: 32, background: "#27272A" }} />
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ padding: "7px 14px" }}
            >
              <Plus size={14} />
              Saisie rapide
            </button>
            <div style={{ position: "relative" }}>
              {/* ─── Bouton cloche ─── */}
              <button
                onClick={() => setShowNotifications((v) => !v)}
                title="Notifications"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: showNotifications ? "rgba(239,68,68,0.1)" : "#18181B",
                  border: showNotifications ? "1px solid rgba(239,68,68,0.3)" : "1px solid #27272A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: showNotifications ? "#EF4444" : "#A1A1AA",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.15s",
                }}
              >
                <Bell size={15} />
                {/* Point rouge — disparaît après «Tout marquer comme lu» */}
                {hasUnread && (
                  <span
                    style={{
                      position: "absolute",
                      top: 7,
                      right: 7,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#EF4444",
                      border: "1px solid #09090B",
                    }}
                  />
                )}
              </button>

              {/* ─── Panneau liste notifications ─── */}
              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
                    width: 310,
                    background: "#18181B",
                    border: "1px solid #27272A",
                    borderRadius: 14,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {/* En-tête */}
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #27272A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>Notifications</p>
                    {hasUnread
                      ? <span className="badge badge-danger" style={{ fontSize: 9 }}>2 nouvelles</span>
                      : <span className="badge" style={{ fontSize: 9 }}>Tout lu</span>
                    }
                  </div>

                  {/* Liste */}
                  {([
                    {
                      icon: "⚠️",
                      title: "Budget journalier serré",
                      desc: `Vous avez dépensé ${fmt(todayExpenses)} FCFA aujourd'hui.`,
                      detail: `Votre budget journalier est de ${fmt(dailyBudget)} FCFA.\n\nAujourd'hui vous avez déjà dépensé ${fmt(todayExpenses)} FCFA, ce qui représente ${dailyBudget > 0 ? Math.round((todayExpenses / dailyBudget) * 100) : 0}% de votre enveloppe du jour.\n\n👉 Conseil : Évitez les achats non essentiels pour le reste de la journée afin de rester dans les clous jusqu'à votre prochaine paie (J-${daysRemaining}).`,
                      time: "Il y a 2h",
                      color: "#EF4444",
                    },
                    {
                      icon: "📅",
                      title: `Paie dans ${daysRemaining} jours`,
                      desc: "Pensez à préparer vos provisions.",
                      detail: `Votre prochaine paie est prévue le ${paydayDate} du mois, soit dans ${daysRemaining} jours.\n\nSolde disponible actuel : ${fmt(totalBalance)} FCFA\nBudget restant par jour : ${fmt(dailyBudget)} FCFA\n\n👉 Conseil : Faites vos courses de la semaine maintenant pour éviter les dépenses d'urgence en fin de cycle.`,
                      time: "Aujourd'hui",
                      color: "#818cf8",
                    },
                    {
                      icon: "✅",
                      title: "Salaire enregistré",
                      desc: `${fmt(monthlySalary)} FCFA crédité sur Banque.`,
                      detail: `Votre salaire net de ${fmt(monthlySalary)} FCFA a bien été enregistré sur votre compte Banque au début du cycle.\n\nCe montant sert de référence pour calculer votre taux de consommation mensuel (actuellement ${Math.round(((monthlySalary - totalBalance) / monthlySalary) * 100)}% consommé).\n\n✅ Aucune action requise.`,
                      time: "1er du mois",
                      color: "#4ade80",
                    },
                  ] as const).map((n, i) => (
                    <div
                      key={i}
                      onClick={() => { setActiveNotif(n); setShowNotifications(false); }}
                      style={{
                        padding: "12px 16px",
                        borderBottom: i < 2 ? "1px solid #27272A" : "none",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#FAFAFA", marginBottom: 2 }}>{n.title}</p>
                        <p style={{ fontSize: 11, color: "#A1A1AA", lineHeight: 1.4 }}>{n.desc}</p>
                      </div>
                      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <p style={{ fontSize: 9, color: "#52525B", whiteSpace: "nowrap" }}>{n.time}</p>
                        <span style={{ fontSize: 9, color: n.color, fontWeight: 600 }}>Voir →</span>
                      </div>
                    </div>
                  ))}

                  {/* Pied — Tout marquer comme lu */}
                  <div style={{ padding: "10px 16px" }}>
                    <button
                      onClick={() => {
                        setHasUnread(false);     // supprime le point rouge
                        setShowNotifications(false);
                      }}
                      style={{ width: "100%", background: "none", border: "1px solid #27272A", borderRadius: 8, padding: "7px 0", fontSize: 12, color: "#A1A1AA", cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#52525B")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#27272A")}
                    >
                      ✓ Tout marquer comme lu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px 0" }}>

          {/* ════════════ TAB: ACCUEIL ════════════ */}
          {activeTab === "accueil" && (
            <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

              {/* ── HERO BANNER ── */}
              <div
                className="card animate-fade-in-up"
                style={{
                  padding: "22px 28px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                {/* Radial glow BG */}
                <div
                  style={{
                    position: "absolute",
                    right: -40,
                    top: -40,
                    width: 220,
                    height: 220,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div>
                  <p style={{ fontSize: 11, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                    {dateStr}
                  </p>
                  <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "#FAFAFA", lineHeight: 1.1, marginBottom: 6 }}>
                    Bonjour {userName} 👋
                  </h1>
                  <p style={{ fontSize: 13, color: "#A1A1AA", maxWidth: 400 }}>
                    {isBudgetCritical
                      ? "⚠️ Attention : votre budget quotidien est serré. Réduisez vos dépenses."
                      : "Vos finances sont stables. Votre rythme de dépense est optimal pour tenir jusqu'à la paie."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      background: "#09090B",
                      border: "1px solid #27272A",
                      borderRadius: 12,
                      padding: "12px 20px",
                      textAlign: "right",
                    }}
                  >
                    <p style={{ fontSize: 10, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      Salaire net déclaré
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>{fmt(monthlySalary)} FCFA</p>
                  </div>
                  <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus size={14} />
                    Nouvelle saisie
                  </button>
                </div>
              </div>

              {/* ── 4 KPI CARDS ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                {/* Solde total */}
                <div className="card animate-fade-in-up-1" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Solde total</span>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircleDollarSign size={14} color="#EF4444" />
                    </div>
                  </div>
                  <p className="kpi-value">{fmt(totalBalance)}</p>
                  <p style={{ fontSize: 10, color: "#A1A1AA", marginTop: 2 }}>FCFA • {accounts.length} comptes</p>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={11} color="#52525B" />
                    <span style={{ fontSize: 10, color: "#52525B", fontWeight: 600 }}>Aucune donnée comparative</span>
                  </div>
                </div>

                {/* Jours avant paie */}
                <div className="card animate-fade-in-up-2" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Avant la paie</span>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock size={14} color="#818cf8" />
                    </div>
                  </div>
                  <p className="kpi-value">{daysRemaining}<span style={{ fontSize: 12, fontWeight: 400, color: "#A1A1AA" }}> j</span></p>
                  <p style={{ fontSize: 10, color: "#A1A1AA", marginTop: 2 }}>Versement le {paydayDate} du mois</p>
                  <div style={{ marginTop: 10 }}>
                    <span className="badge badge-success" style={{ fontSize: 9 }}>
                      <CheckCircle2 size={9} />
                      Cycle actif
                    </span>
                  </div>
                </div>

                {/* Budget / jour */}
                <div
                  className={`card animate-fade-in-up-3${isBudgetCritical ? " card-accent" : ""}`}
                  style={{ padding: "18px 20px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: isBudgetCritical ? "#f87171" : "#A1A1AA",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Budget / jour
                    </span>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: isBudgetCritical ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Zap size={14} color="#EF4444" />
                    </div>
                  </div>
                  <p className="kpi-value" style={{ color: isBudgetCritical ? "#f87171" : "#FAFAFA" }}>
                    {fmt(dailyBudget)}
                  </p>
                  <p style={{ fontSize: 10, color: "#A1A1AA", marginTop: 2 }}>FCFA max autorisé</p>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    {isBudgetCritical ? (
                      <><AlertTriangle size={11} color="#f87171" /><span style={{ fontSize: 10, color: "#f87171", fontWeight: 600 }}>Rythme critique !</span></>
                    ) : (
                      <><CheckCircle2 size={11} color="#4ade80" /><span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600 }}>Rythme sain</span></>
                    )}
                  </div>
                </div>

                {/* Dépenses du jour */}
                <div className="card animate-fade-in-up-4" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dép. aujourd'hui</span>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(251,191,36,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TrendingDown size={14} color="#fbbf24" />
                    </div>
                  </div>
                  <p className="kpi-value">{fmt(todayExpenses)}</p>
                  <p style={{ fontSize: 10, color: "#A1A1AA", marginTop: 2 }}>FCFA • {transactions.filter((t) => t.date.startsWith("Auj")).length} transaction(s)</p>
                  <div style={{ marginTop: 10 }}>
                    <span className={`badge ${rhythmAlert ? "badge-danger" : "badge-warning"}`} style={{ fontSize: 9 }}>
                      {rhythmAlert ? "⚠ Dépasse le budget" : dailyBudget > 0 ? `${Math.round((todayExpenses / dailyBudget) * 100)}% du budget` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── MAIN BENTO GRID ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 320px",
                  gridTemplateRows: "auto auto",
                  gap: 14,
                }}
              >
                {/* Cashflow Chart — wide left */}
                <div
                  className="card animate-fade-in-up-5"
                  style={{ gridColumn: "1 / 3", padding: "22px 24px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA", marginBottom: 3 }}>Évolution du Solde & Flux</h3>
                      <p style={{ fontSize: 11, color: "#A1A1AA" }}>Trésorerie sur le cycle en cours — Septembre 2026</p>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 10, height: 2, background: "#EF4444", display: "inline-block", borderRadius: 2 }} />
                        <span style={{ fontSize: 10, color: "#A1A1AA" }}>Solde</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 10, height: 2, background: "#6366f1", display: "inline-block", borderRadius: 2 }} />
                        <span style={{ fontSize: 10, color: "#A1A1AA" }}>Dépenses</span>
                      </div>
                      <span className="badge" style={{ fontSize: 10 }}>XOF</span>
                    </div>
                  </div>
                  <CashflowChart />
                </div>

                {/* Mini Calendar — right col, row 1 */}
                <div
                  className="card animate-fade-in-up-5"
                  style={{ padding: "20px 20px", gridColumn: "3", gridRow: "1" }}
                >
                  <p className="section-label" style={{ marginBottom: 14 }}>Calendrier du cycle</p>
                  <MiniCalendar today={todayNum} paydayDate={paydayDate} />
                </div>

                {/* Donut Category — bottom left */}
                <div
                  className="card animate-fade-in-up-6"
                  style={{ padding: "22px 24px", gridColumn: "1" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA", marginBottom: 3 }}>Répartition par Catégorie</h3>
                      <p style={{ fontSize: 11, color: "#A1A1AA" }}>Dépenses du mois en cours</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("statistiques")}
                      style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3 }}
                    >
                      Détails <ChevronRight size={12} />
                    </button>
                  </div>
                  <DonutChart />
                </div>

                {/* Alerts — bottom center */}
                <div
                  className="card animate-fade-in-up-6"
                  style={{ padding: "22px 24px", gridColumn: "2" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>Alertes & Rythme</h3>
                    {transactions.length > 0 && <span className="badge badge-danger" style={{ fontSize: 9 }}>Voir les alertes</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Alert 1 */}
                    <div
                      style={{
                        background: "#09090B",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <ShieldAlert size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#FAFAFA", marginBottom: 3 }}>Analyse budgétaire</p>
                        <p style={{ fontSize: 11, color: "#A1A1AA", lineHeight: 1.5 }}>
                          {transactions.length === 0
                            ? "Aucune transaction enregistrée. Ajoutez vos dépenses pour voir les alertes."
                            : "Surveillez vos dépenses par catégorie pour optimiser votre budget mensuel."
                          }
                        </p>
                      </div>
                    </div>

                    {/* Info bar — rythme */}
                    <div
                      style={{
                        background: "#09090B",
                        border: "1px solid #27272A",
                        borderRadius: 12,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "#A1A1AA" }}>Consommation budgétaire</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#FAFAFA" }}>
                          {Math.round(((monthlySalary - totalBalance) / monthlySalary) * 100)}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(Math.round(((monthlySalary - totalBalance) / monthlySalary) * 100), 100)}%`,
                            background: "linear-gradient(90deg, #EF4444, #f97316)",
                          }}
                        />
                      </div>
                      <p style={{ fontSize: 10, color: "#52525B", marginTop: 6 }}>
                        {fmt(monthlySalary - totalBalance)} FCFA dépensés sur {fmt(monthlySalary)} FCFA (salaire)
                      </p>
                    </div>

                    {/* OK status */}
                    <div
                      style={{
                        background: "rgba(34,197,94,0.04)",
                        border: "1px solid rgba(34,197,94,0.15)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <BadgeCheck size={14} color="#4ade80" style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: "#A1A1AA" }}>
                        <span style={{ color: "#4ade80", fontWeight: 700 }}>Objectif fin de mois</span> :{" "}
                        {totalBalance > 0
                          ? `Vous êtes sur la bonne trajectoire pour conserver ${fmt(Math.round(totalBalance * 0.15))} FCFA d'épargne résiduelle.`
                          : "Configurez votre solde et salaire dans Réglages pour voir votre projection."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions — right col, row 2 */}
                <div
                  className="card animate-fade-in-up-7"
                  style={{ padding: "22px 20px", gridColumn: "3", gridRow: "2" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>Transactions</h3>
                    <button
                      onClick={() => setActiveTab("historique")}
                      style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3 }}
                    >
                      Tout voir <ChevronRight size={12} />
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="tx-item" style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              background: tx.type === "income" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {tx.icon}
                          </div>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "#FAFAFA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>{tx.label}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <AccountIcon name={tx.account} size={12} radius={3} />
                              <p style={{ fontSize: 9, color: "#A1A1AA" }}>{tx.date} · {tx.account}</p>
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: tx.type === "income" ? "#4ade80" : "#FAFAFA",
                            flexShrink: 0,
                          }}
                        >
                          {tx.type === "income" ? "+" : ""}{fmt(tx.amount)} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ TAB: COMPTES ════════════ */}
          {activeTab === "comptes" && (
            <div style={{ padding: "24px 28px", maxWidth: 900 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Comptes Financiers</h2>
                  <p style={{ fontSize: 13, color: "#A1A1AA" }}>Gérez vos supports manuels (Espèces, Wave, Orange Money, Banque).</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const name = prompt("Nom du compte :");
                    const bal = prompt("Solde initial (FCFA) :");
                    if (name && bal) {
                      setAccounts((prev) => [
                        ...prev,
                        { id: Date.now(), name, type: "Manuel", balance: Number(bal) || 0, colorClass: "#6366f1", icon: "💳" },
                      ]);
                    }
                  }}
                >
                  <Plus size={14} /> Ajouter un compte
                </button>
              </div>

              {/* Total balance bar */}
              <div
                className="card"
                style={{
                  padding: "20px 24px",
                  marginBottom: 16,
                  background: "linear-gradient(135deg, #18181B 0%, #1c1c1f 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <p className="section-label" style={{ marginBottom: 6 }}>Solde total consolidé</p>
                  <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#FAFAFA" }}>{fmt(totalBalance)} <span style={{ fontSize: 14, fontWeight: 500, color: "#A1A1AA" }}>FCFA</span></p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {accounts.map((a) => (
                    <div key={a.id} style={{ textAlign: "right", background: "#09090B", border: "1px solid #27272A", borderRadius: 10, padding: "8px 14px" }}>
                      <p style={{ fontSize: 9, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase" }}>{a.name}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: a.colorClass }}>{fmt(a.balance)} FCFA</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {accounts.map((acc) => (
                  <div key={acc.id} className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                       {/* ── Icône opérateur brandée ── */}
                      <AccountIcon name={acc.name} type={acc.type} size={46} radius={13} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{acc.name}</p>
                        <p style={{ fontSize: 11, color: "#A1A1AA" }}>{acc.type}</p>
                        <div style={{ marginTop: 4 }}>
                          <span className="badge" style={{ fontSize: 9 }}>Manuel</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#FAFAFA" }}>{fmt(acc.balance)}</p>
                        <p style={{ fontSize: 10, color: "#A1A1AA" }}>FCFA</p>
                      </div>
                      {/* Bouton éditer solde */}
                      <button
                        title="Modifier le solde"
                        onClick={() => {
                          const val = prompt(`Nouveau solde pour "${acc.name}" (FCFA) :`, String(acc.balance));
                          if (val !== null && !isNaN(Number(val)) && Number(val) >= 0) {
                            setAccounts((prev) => prev.map((a) => a.id === acc.id ? { ...a, balance: Number(val) } : a));
                          }
                        }}
                        style={{ background: "#27272A", border: "none", borderRadius: 8, color: "#A1A1AA", cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#EF4444"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#27272A"; e.currentTarget.style.color = "#A1A1AA"; }}
                      >
                        ✏️
                      </button>
                      {/* Bouton supprimer */}
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer le compte "${acc.name}" ?`)) {
                            setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
                          }
                        }}
                        style={{ background: "none", border: "none", color: "#52525B", cursor: "pointer", padding: 4, display: "flex", transition: "color 0.15s" }}
                        title="Supprimer ce compte"
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ TAB: HISTORIQUE ════════════ */}
          {activeTab === "historique" && (
            <div style={{ padding: "24px 28px", maxWidth: 900 }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Historique des Transactions</h2>
                <p style={{ fontSize: 13, color: "#A1A1AA" }}>Retrouvez l'ensemble de vos mouvements financiers.</p>
              </div>

              <div className="card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#09090B", border: "1px solid #27272A", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                  <Search size={14} color="#52525B" />
                  <input
                    className="input-field"
                    style={{ border: "none", padding: 0, background: "transparent" }}
                    placeholder="Rechercher une transaction..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                  {historySearch && (
                    <button
                      onClick={() => setHistorySearch("")}
                      style={{ background: "none", border: "none", color: "#52525B", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {transactions
                    .filter((tx) =>
                      historySearch === "" ||
                      tx.label.toLowerCase().includes(historySearch.toLowerCase()) ||
                      tx.category.toLowerCase().includes(historySearch.toLowerCase()) ||
                      tx.account.toLowerCase().includes(historySearch.toLowerCase())
                    )
                    .map((tx) => (
                    <div key={tx.id} className="tx-item">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Icône transaction (catégorie) */}
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: tx.type === "income" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          {tx.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA" }}>{tx.label}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            {/* Micro-icône opérateur */}
                            <AccountIcon name={tx.account} size={14} radius={3} />
                            <p style={{ fontSize: 11, color: "#A1A1AA" }}>
                              {tx.date} · <span style={{ color: "#FAFAFA", fontWeight: 500 }}>{tx.account}</span> · {tx.category}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: tx.type === "income" ? "#4ade80" : "#FAFAFA" }}>
                        {tx.type === "income" ? "+" : ""}{fmt(tx.amount)} FCFA
                      </span>
                    </div>
                    ))
                  }
                  {transactions.filter((tx) =>
                    historySearch === "" ||
                    tx.label.toLowerCase().includes(historySearch.toLowerCase()) ||
                    tx.category.toLowerCase().includes(historySearch.toLowerCase()) ||
                    tx.account.toLowerCase().includes(historySearch.toLowerCase())
                  ).length === 0 && (
                    <div style={{ textAlign: "center", padding: "28px 0", color: "#52525B", fontSize: 13 }}>
                      Aucune transaction pour « {historySearch} »
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════ TAB: STATISTIQUES ════════════ */}
          {activeTab === "statistiques" && (
            <div style={{ padding: "24px 28px", maxWidth: 1000 }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Statistiques Avancées</h2>
                <p style={{ fontSize: 13, color: "#A1A1AA" }}>Analysez vos habitudes de dépenses par catégorie ce mois-ci.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="card" style={{ padding: "22px 24px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Répartition par Poste</h3>
                  <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 18 }}>Dépenses en FCFA — Septembre 2026</p>
                  <DonutChart />
                </div>

                <div className="card" style={{ padding: "22px 24px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Détail par catégorie</h3>
                  <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 18 }}>Budget mensuel vs réel</p>
                  {[
                    { cat: "Nourriture & Marché",   pct: 0, amount: 0, color: "#EF4444",  budget: 0 },
                    { cat: "Transport",              pct: 0, amount: 0, color: "#6366f1",  budget: 0 },
                    { cat: "Logement & Factures",   pct: 0, amount: 0, color: "#8b5cf6",  budget: 0 },
                    { cat: "Loisirs",                pct: 0, amount: 0, color: "#f59e0b",  budget: 0 },
                    { cat: "Autres",                 pct: 0, amount: 0, color: "#10b981",  budget: 0 },
                  ].map((item) => (
                    <div key={item.cat} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0, display: "inline-block" }} />
                          <span style={{ fontSize: 12, color: "#FAFAFA" }}>{item.cat}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#A1A1AA" }}>{fmt(item.amount)} FCFA</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: item.amount > item.budget ? "#f87171" : "#4ade80" }}>{item.pct}%</span>
                        </div>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${item.pct}%`, background: item.color, opacity: 0.85 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: "22px 24px", gridColumn: "1 / 3" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Évolution du Solde — Mois en cours</h3>
                  <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 16 }}>Tendance de votre trésorerie depuis le 1er Septembre</p>
                  <CashflowChart />
                </div>
              </div>
            </div>
          )}

          {/* ════════════ TAB: OBJECTIFS ════════════ */}
          {activeTab === "objectifs" && (
            <div style={{ padding: "24px 28px", maxWidth: 900 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Objectifs Financiers</h2>
                  <p style={{ fontSize: 13, color: "#A1A1AA" }}>Définissez vos cibles d'épargne et suivez votre progression.</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const title = prompt("Titre de l'objectif :");
                    const target = prompt("Montant cible (FCFA) :");
                    if (title && target) {
                      setObjectives((prev) => [
                        ...prev,
                        { id: Date.now(), title, targetAmount: Number(target), currentAmount: 0, deadline: "31 Déc. 2026", icon: "🎯" },
                      ]);
                    }
                  }}
                >
                  <Plus size={14} /> Nouvel objectif
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {objectives.map((obj) => {
                  const pct = Math.min(Math.round((obj.currentAmount / obj.targetAmount) * 100), 100);
                  const remaining = obj.targetAmount - obj.currentAmount;
                  return (
                    <div key={obj.id} className="card" style={{ padding: "22px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontSize: 24 }}>{obj.icon}</span>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{obj.title}</p>
                            <p style={{ fontSize: 11, color: "#A1A1AA" }}>Échéance : {obj.deadline}</p>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: 99,
                            background: pct >= 100 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                            border: `1px solid ${pct >= 100 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`,
                            color: pct >= 100 ? "#4ade80" : "#f87171",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "#A1A1AA" }}>Progression</span>
                          <span style={{ fontSize: 11, fontWeight: 700 }}>
                            {fmt(obj.currentAmount)} / {fmt(obj.targetAmount)} FCFA
                          </span>
                        </div>
                        <div className="progress-track" style={{ height: 8 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 100 ? "#4ade80" : "linear-gradient(90deg, #EF4444, #f97316)",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#A1A1AA" }}>
                          Reste : <strong style={{ color: "#FAFAFA" }}>{fmt(remaining)} FCFA</strong>
                        </span>
                        <button
                          className="btn-primary"
                          style={{ padding: "5px 12px", fontSize: 11 }}
                          onClick={() => {
                            const amount = prompt(`Alimenter "${obj.title}" de combien ? (FCFA)`);
                            if (amount && Number(amount) > 0) {
                              setObjectives((prev) =>
                                prev.map((o) =>
                                  o.id === obj.id
                                    ? { ...o, currentAmount: Math.min(o.currentAmount + Number(amount), o.targetAmount) }
                                    : o
                                )
                              );
                            }
                          }}
                        >
                          <PiggyBank size={11} /> Alimenter
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════ TAB: RÉGLAGES ════════════ */}
          {activeTab === "reglages" && (
            <div style={{ padding: "24px 28px", maxWidth: 560 }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Paramètres</h2>
                <p style={{ fontSize: 13, color: "#A1A1AA" }}>Configurez votre profil et votre cycle de paie.</p>
              </div>

              <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    Nom d'utilisateur
                  </label>
                  <input className="input-field" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    Salaire Net Mensuel (FCFA)
                  </label>
                  <input className="input-field" type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    Jour de versement de la paie
                  </label>
                  <input className="input-field" type="number" value={paydayDate} onChange={(e) => setPaydayDate(Number(e.target.value))} min={1} max={31} />
                  <p style={{ fontSize: 10, color: "#52525B", marginTop: 5 }}>La date de versement sert à calculer le budget quotidien et le compte à rebours.</p>
                </div>

                <div style={{ borderTop: "1px solid #27272A", paddingTop: 18 }}>
                  <p className="section-label" style={{ marginBottom: 12 }}>Informations calculées</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 10, color: "#A1A1AA" }}>Budget / jour actuel</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#EF4444" }}>{fmt(dailyBudget)} FCFA</p>
                    </div>
                    <div style={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 10, color: "#A1A1AA" }}>Jours avant paie</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#818cf8" }}>{daysRemaining} jours</p>
                    </div>
                  </div>
                </div>

                {/* Bannière succès enregistrement */}
                {settingsSaved && (
                  <div
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#4ade80",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    Paramètres enregistrés avec succès !
                  </div>
                )}

                <button
                  className="btn-primary"
                  style={{ justifyContent: "center" }}
                  onClick={() => {
                    setSettingsSaved(true);
                    setTimeout(() => setSettingsSaved(false), 3000);
                  }}
                >
                  <CheckCircle2 size={14} />
                  Enregistrer les paramètres
                </button>
              </div>
            </div>
          )}

          {/* ════════════ TAB: BUSINESS ════════════ */}
          {activeTab === "business" && (
            <div style={{ padding: "24px 28px", maxWidth: 900 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>💼</span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
                    Business & Revenus Complémentaires
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: "#A1A1AA" }}>
                  Suivez vos activités parallèles, freelance ou petits commerces en dehors de votre salaire principal.
                </p>
              </div>

              {/* Bannière MVP */}
              <div
                className="card"
                style={{
                  padding: "20px 24px",
                  borderColor: "rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.06)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>🚀</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", marginBottom: 4 }}>
                    Fonctionnalité en cours de développement
                  </p>
                  <p style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.6 }}>
                    Le suivi des revenus Business (freelance, petit commerce, tontines) sera disponible dans la prochaine
                    version. En attendant, vous pouvez enregistrer ces revenus comme transactions de type{" "}
                    <strong style={{ color: "#EF4444" }}>Revenu</strong> dans vos comptes manuels.
                  </p>
                </div>
              </div>

              {/* Astuce MVP */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { icon: "💵", title: "Freelance & Prestations", tip: "Saisissez chaque paiement client comme un revenu dans votre compte Wave ou Espèces.", color: "#6366f1" },
                  { icon: "🛍️", title: "Petit Commerce", tip: "Notez le bénéfice net quotidien comme revenu. Tracez vos entrées de caisse séparément.", color: "#f59e0b" },
                  { icon: "🤝", title: "Tontines & Épargne", tip: "Enregistrez les cotisations reçues comme revenus et les versements comme dépenses.", color: "#10b981" },
                  { icon: "📊", title: "Suivi Statistiques", tip: "Utilisez l'onglet Statistiques pour visualiser la part de vos revenus complémentaires.", color: "#8b5cf6" },
                ].map((item) => (
                  <div key={item.title} className="card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: `${item.color}20`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18, flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>{item.title}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.6 }}>{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ TAB: GUIDE ════════════ */}
          {activeTab === "guide" && (
            <div style={{ padding: "24px 28px", maxWidth: 780 }}>

              {/* En-tête */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <BookOpen size={20} color="#EF4444" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>Guide d'utilisation</h2>
                    <p style={{ fontSize: 12, color: "#A1A1AA" }}>GestFiPro · Gestion financière de A à Z</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.7 }}>
                  Suivez ces 4 étapes pour configurer votre tableau de bord et commencer à suivre vos finances en temps réel.
                </p>
              </div>

              {/* Étapes */}
              {[
                {
                  step: "01",
                  icon: "🏦",
                  title: "Configurer vos comptes manuels",
                  color: "#6366f1",
                  content: [
                    "Rendez-vous dans l'onglet **Comptes** via la barre latérale.",
                    "GestFiPro supporte 4 types de comptes : **Espèces**, **Wave**, **Orange Money** et **Banque**.",
                    "Pour chaque compte, saisissez le **solde actuel** tel qu'il apparaît sur votre téléphone ou carnet.",
                    "Le solde **consolidé** (somme de tous vos comptes) s'affiche en permanence dans l'en-tête du tableau de bord.",
                    "Vous pouvez modifier un solde à tout moment depuis l'onglet Comptes → icône stylo.",
                  ],
                  tip: "💡 Astuce : Commencez par saisir votre solde Wave car c'est souvent le plus utilisé en Côte d'Ivoire.",
                },
                {
                  step: "02",
                  icon: "💰",
                  title: "Définir votre salaire et cycle de paie",
                  color: "#f59e0b",
                  content: [
                    "Allez dans **Réglages** (icône engrenage en bas de la sidebar).",
                    "Saisissez votre **salaire net mensuel** en FCFA — celui que vous recevez réellement.",
                    "Indiquez le **jour de versement** (ex: le 28 de chaque mois pour les fonctionnaires).",
                    "GestFiPro calcule automatiquement le nombre de jours restants avant votre prochaine paie.",
                    "Ces paramètres servent à calculer votre **budget journalier** = Solde ÷ Jours restants.",
                  ],
                  tip: "💡 Si vous êtes payé le dernier jour ouvrable, choisissez le 28 pour avoir une marge de sécurité.",
                },
                {
                  step: "03",
                  icon: "📅",
                  title: "Comprendre le compteur \"Jours avant la paie\"",
                  color: "#EF4444",
                  content: [
                    "Le **badge vert** dans l'en-tête affiche le nombre de jours restants jusqu'au prochain versement.",
                    "La carte **Budget/Jour** sur l'accueil indique combien vous pouvez dépenser par jour sans dépasser votre solde.",
                    "Si ce budget journalier passe sous **10 000 FCFA**, la carte vire au rouge — signe de vigilance.",
                    "Le graphique **Cashflow** vous montre l'évolution de votre solde sur 7 jours.",
                    "L'indicateur de **Rythme de dépense** compare vos dépenses du jour au budget journalier recommandé.",
                  ],
                  tip: "🎯 Objectif : dépenser chaque jour strictement moins que votre Budget/Jour pour finir le mois sereinement.",
                },
                {
                  step: "04",
                  icon: "⚡",
                  title: "Saisir vos dépenses et revenus",
                  color: "#10b981",
                  content: [
                    "Cliquez sur **Saisie rapide** (bouton rouge dans l'en-tête) ou sur le champ en bas de l'écran.",
                    "Pour chaque transaction, renseignez : **libellé**, **montant**, **catégorie** (Nourriture, Transport, etc.) et **compte débité**.",
                    "Les dépenses s'affichent instantanément dans la liste **Transactions récentes** sur l'accueil.",
                    "Consultez l'onglet **Historique** pour voir toutes vos transactions triées par date.",
                    "L'onglet **Statistiques** génère des graphiques de répartition par catégorie pour analyser vos habitudes.",
                  ],
                  tip: "⚡ Bonne pratique : saisissez chaque dépense immédiatement après l'avoir faite — 10 secondes suffisent !",
                },
              ].map((item, idx) => (
                <div key={item.step} style={{ marginBottom: idx < 3 ? 24 : 0 }}>
                  <div className="card" style={{ padding: "22px 24px", borderColor: `${item.color}22` }}>
                    {/* Numéro d'étape + titre */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: `${item.color}18`,
                          border: `1px solid ${item.color}40`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          Étape {item.step}
                        </span>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#FAFAFA" }}>{item.title}</h3>
                      </div>
                    </div>

                    {/* Liste des instructions */}
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {item.content.map((line, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span
                            style={{
                              width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                              background: `${item.color}20`,
                              border: `1px solid ${item.color}40`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontWeight: 800, color: item.color,
                            }}
                          >
                            {i + 1}
                          </span>
                          <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.65 }}>
                            {line.split(/\*\*(.*?)\*\*/g).map((part, pi) =>
                              pi % 2 === 1
                                ? <strong key={pi} style={{ color: "#FAFAFA", fontWeight: 700 }}>{part}</strong>
                                : part
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>

                    {/* Astuce */}
                    <div
                      style={{
                        background: `${item.color}0D`,
                        border: `1px solid ${item.color}25`,
                        borderRadius: 8,
                        padding: "10px 14px",
                      }}
                    >
                      <p style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.6 }}>
                        {item.tip.split(/\*\*(.*?)\*\*/g).map((part, pi) =>
                          pi % 2 === 1
                            ? <strong key={pi} style={{ color: "#FAFAFA" }}>{part}</strong>
                            : part
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* CTA retour accueil */}
              <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
                <button
                  className="btn-primary"
                  style={{ padding: "11px 28px" }}
                  onClick={() => setActiveTab("accueil")}
                >
                  <LayoutDashboard size={14} />
                  Commencer avec le tableau de bord
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── FLOATING QUICK INPUT ─────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 560,
            padding: "0 20px",
            zIndex: 30,
          }}
        >
          <form
            onSubmit={handleQuickSubmit}
            style={{
              background: "#18181B",
              border: "1px solid #27272A",
              borderRadius: 99,
              padding: "6px 6px 6px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#27272A",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FAFAFA",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Plus size={13} />
              </button>
              <input
                type="text"
                value={quickInputText}
                onChange={(e) => setQuickInputText(e.target.value)}
                placeholder="Saisie rapide : taxi 5000, riz 3000..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: "#FAFAFA",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                title="Saisie vocale (bientôt disponible)"
                onClick={() => alert("🎙️ La saisie vocale sera disponible dans une prochaine version de GestFiPro.")}
                style={{ background: "none", border: "none", color: "#52525B", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" }}
              >
                <Mic size={14} />
              </button>
              <button
                type="submit"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "#EF4444",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(239,68,68,0.35)",
                }}
              >
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {showModal && (
        <AddTransactionModal
          accounts={accounts}
          onClose={() => setShowModal(false)}
          onAdd={handleAddTransaction}
        />
      )}

      {/* ── MODAL DÉTAIL NOTIFICATION ──────────────────────────────────────── */}
      {activeNotif && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(4px)",
            padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setActiveNotif(null)}
        >
          <div
            className="card animate-fade-in-up"
            style={{ width: "100%", maxWidth: 420, padding: 0, overflow: "hidden" }}
          >
            {/* Header coloré selon la notif */}
            <div
              style={{
                padding: "18px 20px",
                background: `${activeNotif.color}10`,
                borderBottom: `1px solid ${activeNotif.color}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{activeNotif.icon}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.02em" }}>
                    {activeNotif.title}
                  </p>
                  <p style={{ fontSize: 10, color: "#52525B", marginTop: 2 }}>{activeNotif.time}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveNotif(null)}
                style={{ background: "none", border: "none", color: "#A1A1AA", cursor: "pointer", padding: 4, display: "flex" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Corps — détail contextuel */}
            <div style={{ padding: "20px 20px" }}>
              {activeNotif.detail.split("\n").map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: line.startsWith("👉") || line.startsWith("✅") ? 12 : 13,
                    color: line.startsWith("👉") ? activeNotif.color : line === "" ? "transparent" : "#A1A1AA",
                    fontWeight: line.startsWith("👉") || line.startsWith("✅") ? 600 : 400,
                    lineHeight: 1.65,
                    marginBottom: line === "" ? 8 : 4,
                  }}
                >
                  {line || "\u00a0"}
                </p>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "0 20px 18px", display: "flex", gap: 8 }}>
              <button
                onClick={() => setActiveNotif(null)}
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center", padding: "9px 0" }}
              >
                Compris
              </button>
              <button
                onClick={() => { setActiveNotif(null); setHasUnread(false); }}
                style={{
                  flex: 1,
                  background: "none",
                  border: "1px solid #27272A",
                  borderRadius: 10,
                  color: "#A1A1AA",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: "9px 0",
                }}
              >
                Marquer comme lu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}