"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ChevronLeft,
  PiggyBank,
  Menu,
  Briefcase,
  HelpCircle,
  BookOpen,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import MiniCalendar from "../components/MiniCalendar";
import { SidebarLogoFull, SidebarLogoIcon } from "../components/Logo";
import { AccountIcon, getAccountColor } from "../components/AccountIcon";
import DashboardView from "../components/DashboardView";
import PayCycleCard from "../components/PayCycleCard";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { useTheme } from "../components/ThemeProvider";

// Dynamic imports for chart components (client-only)
const CashflowChart = dynamic(() => import("../components/CashflowChart"), {
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

const DonutChart = dynamic(() => import("../components/DonutChart"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#52525B", fontSize: 12 }}>…</span>
    </div>
  ),
});

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = "accueil" | "comptes" | "historique" | "statistiques" | "objectifs" | "reglages" | "guide";

interface Account {
  id: string | number;
  name: string;
  type: string;
  balance: number;
  colorClass: string;
  icon: string;
}

interface Transaction {
  id: string | number;
  label: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  account: string;
  icon: string;
}

interface Objective {
  id: string | number;
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
  const supabase = createClient();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>("accueil");
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<{ icon: string; title: string; desc: string; detail: string; time: string; color: string }[]>([]);
  const [activeNotif, setActiveNotif] = useState<null | { icon: string; title: string; desc: string; detail: string; time: string; color: string }>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Profile fields (from Supabase profiles)
  const [userName, setUserName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [paydayDate, setPaydayDate] = useState(28);

  // Accounts (from Supabase accounts)
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, name: "Espèces",      type: "Espèces",      balance: 0, colorClass: getAccountColor("Espèces"),      icon: "💵" },
    { id: 2, name: "Wave",         type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Wave"),         icon: "🌊" },
    { id: 3, name: "Orange Money", type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Orange Money"), icon: "🟠" },
    { id: 4, name: "Banque",       type: "Banque",        balance: 0, colorClass: getAccountColor("Banque"),       icon: "🏦" },
  ]);

  // Transactions (from Supabase transactions)
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Goals (from Supabase goals)
  const [objectives, setObjectives] = useState<Objective[]>([]);

  const [quickInputText, setQuickInputText] = useState("");

  // ─── Data Loading from Supabase ───────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      let isNewUserPurge = false;
      // Nettoyage automatique absolu pour repartir à 100% comme un nouvel utilisateur
      if (typeof window !== "undefined") {
        const hasCleanSlate = localStorage.getItem("gestfipro_clean_new_user_v5");
        if (!hasCleanSlate) {
          localStorage.removeItem("gestfipro_profile");
          localStorage.removeItem("gestfipro_transactions");
          localStorage.removeItem("gestfipro_accounts");
          localStorage.removeItem("gestfipro_objectifs");
          localStorage.setItem("gestfipro_clean_new_user_v5", "true");
          isNewUserPurge = true;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        if (isNewUserPurge) {
          // Remise à zéro complète en base Supabase pour repartir totalement à neuf
          try {
            await supabase.from("transactions").delete().eq("user_id", user.id);
            await supabase.from("goals").delete().eq("user_id", user.id);
            await supabase.from("accounts").update({ balance: 0 }).eq("user_id", user.id);
            await supabase.from("profiles").upsert({
              id: user.id,
              full_name: "",
              net_salary: 0,
              payday_with_month: 28,
            });
          } catch (e) {
            console.warn("Purge user error:", e);
          }
        }

        // 1. SELECT profiles
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (prof && !isNewUserPurge) {
          if (prof.full_name && !prof.full_name.includes("Kadmiel") && prof.full_name !== "Utilisateur") {
            setUserName(prof.full_name);
          } else {
            setUserName("");
          }
          setMonthlySalary(Number(prof.net_salary) || 0);
          setPaydayDate(prof.payday_with_month || (prof as any).pay_day || 28);
        } else {
          setUserName("");
          setMonthlySalary(0);
          setPaydayDate(28);
        }

        // 2. SELECT accounts
        const { data: accs } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id);

        if (accs && accs.length > 0 && !isNewUserPurge) {
          setAccounts(accs.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            balance: Number(a.balance) || 0,
            colorClass: getAccountColor(a.name),
            icon: a.name.includes("Wave") ? "🌊" : a.name.includes("Orange") ? "🟠" : a.name.includes("Banque") ? "🏦" : "💵",
          })));
        } else {
          // Créer ou réinitialiser les 4 comptes initiaux avec solde à 0
          const initialAccs = [
            { user_id: user.id, name: "Espèces", type: "Espèces", balance: 0 },
            { user_id: user.id, name: "Wave", type: "Mobile Money", balance: 0 },
            { user_id: user.id, name: "Orange Money", type: "Mobile Money", balance: 0 },
            { user_id: user.id, name: "Banque", type: "Banque", balance: 0 },
          ];
          if (!accs || accs.length === 0) {
            await supabase.from("accounts").insert(initialAccs);
          } else {
            await supabase.from("accounts").update({ balance: 0 }).eq("user_id", user.id);
          }
          setAccounts([
            { id: 1, name: "Espèces",      type: "Espèces",      balance: 0, colorClass: getAccountColor("Espèces"),      icon: "💵" },
            { id: 2, name: "Wave",         type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Wave"),         icon: "🌊" },
            { id: 3, name: "Orange Money", type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Orange Money"), icon: "🟠" },
            { id: 4, name: "Banque",       type: "Banque",        balance: 0, colorClass: getAccountColor("Banque"),       icon: "🏦" },
          ]);
        }

        // 3. SELECT transactions
        if (!isNewUserPurge) {
          const { data: txs } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("transaction_date", { ascending: false });

          if (txs) {
            setTransactions(txs.map((t) => ({
              id: t.id,
              label: t.title || t.note || "Opération",
              category: t.category || "Divers",
              amount: Number(t.amount) || 0,
              type: t.type,
              date: t.transaction_date ? new Date(t.transaction_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "À l'instant",
              account: t.note || "Compte",
              icon: t.type === "income" ? "⬇" : "⬆",
            })));
          } else {
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }

        // 4. SELECT goals
        if (!isNewUserPurge) {
          const { data: gls } = await supabase.from("goals").select("*").eq("user_id", user.id);
          if (gls && gls.length > 0) {
            setObjectives(gls.map((g) => ({
              id: g.id,
              title: g.title,
              targetAmount: Number(g.target_amount),
              currentAmount: Number(g.current_amount),
              deadline: g.target_date || "31 Déc. 2026",
              icon: "🎯",
            })));
          } else {
            setObjectives([]);
          }
        } else {
          setObjectives([]);
        }
      } else {
        // Fallback local pour persistance hors connexion / non connecté
        if (isNewUserPurge) {
          setUserName("");
          setMonthlySalary(0);
          setPaydayDate(28);
          setTransactions([]);
          setObjectives([]);
          setAccounts([
            { id: 1, name: "Espèces",      type: "Espèces",      balance: 0, colorClass: getAccountColor("Espèces"),      icon: "💵" },
            { id: 2, name: "Wave",         type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Wave"),         icon: "🌊" },
            { id: 3, name: "Orange Money", type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Orange Money"), icon: "🟠" },
            { id: 4, name: "Banque",       type: "Banque",        balance: 0, colorClass: getAccountColor("Banque"),       icon: "🏦" },
          ]);
        } else {
          const savedProf = localStorage.getItem("gestfipro_profile");
          if (savedProf) {
            try {
              const p = JSON.parse(savedProf);
              if (p.userName) setUserName(p.userName);
              if (p.monthlySalary !== undefined) setMonthlySalary(Number(p.monthlySalary));
              if (p.paydayDate !== undefined) setPaydayDate(Number(p.paydayDate));
            } catch (e) {}
          }
          const savedAccs = localStorage.getItem("gestfipro_accounts");
          if (savedAccs) {
            try {
              const a = JSON.parse(savedAccs);
              if (Array.isArray(a) && a.length > 0) setAccounts(a);
            } catch (e) {}
          }
          const savedTxs = localStorage.getItem("gestfipro_transactions");
          if (savedTxs) {
            try {
              const t = JSON.parse(savedTxs);
              if (Array.isArray(t)) setTransactions(t);
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Erreur chargement données Supabase :", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Computed values ──────────────────────────────────────────────────────
  const now = new Date();
  const todayNum = now.getDate();
  const dateStr = formatDateFr(now);

  const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

  let daysRemaining = paydayDate - todayNum;
  if (daysRemaining <= 0) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    daysRemaining += daysInMonth;
  }

  const dailyBudget = daysRemaining > 0 ? Math.round(totalBalance / daysRemaining) : 0;

  const todayExpenses = transactions
    .filter((t) => (t.type === "expense" || t.amount < 0) && (t.date?.startsWith("Auj") || t.date?.includes("instant")))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const isBudgetCritical = dailyBudget < 10000;
  const rhythmAlert = todayExpenses > dailyBudget;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAddTransaction = async (tx: Omit<Transaction, "id">) => {
    const tempId = Date.now();
    const newTx = { ...tx, id: tempId };

    // Mise à jour immédiate de l'interface
    setTransactions((prev) => [newTx, ...prev]);

    const targetAccount = accounts.find((a) => a.name === tx.account) || accounts[0];
    const newBalance = (targetAccount?.balance || 0) + tx.amount;

    setAccounts((prev) =>
      prev.map((a) => (a.name === tx.account ? { ...a, balance: a.balance + tx.amount } : a))
    );

    // Sauvegarde en base Supabase
    if (currentUser) {
      try {
        const isUuid = targetAccount && typeof targetAccount.id === "string" && targetAccount.id.length > 10;
        await supabase.from("transactions").insert({
          user_id: currentUser.id,
          account_id: isUuid ? targetAccount.id : null,
          title: tx.label,
          category: tx.category,
          amount: Math.abs(tx.amount),
          type: tx.type,
          transaction_date: new Date().toISOString(),
          note: tx.account,
        });

        if (isUuid) {
          await supabase.from("accounts").update({ balance: newBalance }).eq("id", targetAccount.id);
        }
      } catch (err) {
        console.error("Erreur insertion transaction Supabase :", err);
      }
    } else {
      // Persistance locale
      const updatedTxs = [newTx, ...transactions];
      const updatedAccs = accounts.map((a) => (a.name === tx.account ? { ...a, balance: a.balance + tx.amount } : a));
      localStorage.setItem("gestfipro_transactions", JSON.stringify(updatedTxs));
      localStorage.setItem("gestfipro_accounts", JSON.stringify(updatedAccs));
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInputText.trim()) return;

    // Analyse sommaire du texte saisi : ex "Déjeuner 3000 Wave"
    const words = quickInputText.trim().split(" ");
    let parsedAmount = 5000;
    let parsedCategory = "Nourriture";
    let parsedAccount = "Wave";
    let parsedLabel = quickInputText;

    const numMatch = quickInputText.match(/\b\d+\b/);
    if (numMatch) {
      parsedAmount = parseInt(numMatch[0], 10);
    }

    if (quickInputText.toLowerCase().includes("esp")) parsedAccount = "Espèces";
    else if (quickInputText.toLowerCase().includes("wave")) parsedAccount = "Wave";
    else if (quickInputText.toLowerCase().includes("orange")) parsedAccount = "Orange Money";
    else if (quickInputText.toLowerCase().includes("banque")) parsedAccount = "Banque";

    handleAddTransaction({
      label: parsedLabel,
      category: parsedCategory,
      amount: -Math.abs(parsedAmount),
      type: "expense",
      date: "À l'instant",
      account: parsedAccount,
      icon: "⚡",
    });
    setQuickInputText("");
  };

  const handleSaveSettings = async () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);

    if (currentUser) {
      try {
        await supabase.from("profiles").upsert({
          id: currentUser.id,
          full_name: userName,
          net_salary: monthlySalary,
          payday_with_month: paydayDate,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Erreur sauvegarde profil Supabase :", err);
      }
    }

    localStorage.setItem(
      "gestfipro_profile",
      JSON.stringify({ userName, monthlySalary, paydayDate })
    );
  };

  const handleAddAccount = async (name: string, balance: number, type: string = "Manuel") => {
    if (!name.trim()) return;
    const initialBal = Number(balance) || 0;

    if (currentUser) {
      try {
        const { data } = await supabase
          .from("accounts")
          .insert({
            user_id: currentUser.id,
            name: name.trim(),
            type: type,
            balance: initialBal,
          })
          .select()
          .single();

        if (data) {
          setAccounts((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              type: data.type,
              balance: Number(data.balance) || 0,
              colorClass: getAccountColor(data.name),
              icon: "💳",
            },
          ]);
          return;
        }
      } catch (err) {
        console.error("Erreur création compte Supabase :", err);
      }
    }

    const newAcc: Account = {
      id: Date.now() as any,
      name: name.trim(),
      type: type as any,
      balance: initialBal,
      colorClass: getAccountColor(name.trim()),
      icon: "💳",
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    localStorage.setItem("gestfipro_accounts", JSON.stringify(updated));
  };

  const handleAddGoal = async (title: string, targetAmount: number) => {
    if (!title.trim() || !targetAmount) return;
    const target = Number(targetAmount);

    if (currentUser) {
      try {
        const { data } = await supabase
          .from("goals")
          .insert({
            user_id: currentUser.id,
            title: title.trim(),
            target_amount: target,
            current_amount: 0,
            target_date: "2026-12-31",
          })
          .select()
          .single();

        if (data) {
          setObjectives((prev) => [
            ...prev,
            {
              id: data.id,
              title: data.title,
              targetAmount: Number(data.target_amount),
              currentAmount: Number(data.current_amount) || 0,
              deadline: "31 Déc. 2026",
              icon: "🎯",
            },
          ]);
          return;
        }
      } catch (err) {
        console.error("Erreur création objectif Supabase :", err);
      }
    }

    const newObj: Objective = {
      id: Date.now() as any,
      title: title.trim(),
      targetAmount: target,
      currentAmount: 0,
      deadline: "31 Déc. 2026",
      icon: "🎯",
    };
    const updated = [...objectives, newObj];
    setObjectives(updated);
    localStorage.setItem("gestfipro_objectifs", JSON.stringify(updated));
  };

  const handleFeedGoal = async (goalId: any, amount: number) => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    setObjectives((prev) =>
      prev.map((o) =>
        o.id === goalId
          ? { ...o, currentAmount: Math.min(o.currentAmount + amt, o.targetAmount) }
          : o
      )
    );

    if (currentUser && typeof goalId === "string" && goalId.length > 10) {
      try {
        const currentObj = objectives.find((o) => o.id === goalId);
        const newTotal = Math.min((currentObj?.currentAmount || 0) + amt, currentObj?.targetAmount || amt);
        await supabase.from("goals").update({ current_amount: newTotal }).eq("id", goalId);
      } catch (err) {
        console.error("Erreur mise à jour objectif Supabase :", err);
      }
    }
  };

  const handleResetAllData = async () => {
    if (!confirm("Voulez-vous supprimer toutes les données et repartir à zéro comme un nouvel utilisateur ?")) {
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("gestfipro_profile");
      localStorage.removeItem("gestfipro_transactions");
      localStorage.removeItem("gestfipro_accounts");
      localStorage.removeItem("gestfipro_objectifs");
      localStorage.setItem("gestfipro_clean_new_user_v5", "true");
    }
    setUserName("");
    setMonthlySalary(0);
    setPaydayDate(28);
    setTransactions([]);
    setObjectives([]);
    setAccounts([
      { id: 1, name: "Espèces",      type: "Espèces",      balance: 0, colorClass: getAccountColor("Espèces"),      icon: "💵" },
      { id: 2, name: "Wave",         type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Wave"),         icon: "🌊" },
      { id: 3, name: "Orange Money", type: "Mobile Money",  balance: 0, colorClass: getAccountColor("Orange Money"), icon: "🟠" },
      { id: 4, name: "Banque",       type: "Banque",        balance: 0, colorClass: getAccountColor("Banque"),       icon: "🏦" },
    ]);
    if (currentUser) {
      try {
        await supabase.from("transactions").delete().eq("user_id", currentUser.id);
        await supabase.from("goals").delete().eq("user_id", currentUser.id);
        await supabase.from("accounts").update({ balance: 0 }).eq("user_id", currentUser.id);
        await supabase.from("profiles").upsert({
          id: currentUser.id,
          full_name: "",
          net_salary: 0,
          payday_with_month: 28,
        });
      } catch (err) {
        console.error("Erreur réinitialisation Supabase :", err);
      }
    }
    alert("Toutes les données ont été supprimées. L'application est maintenant vierge comme pour un nouvel utilisateur.");
  };

  // ─── Nav items — NAVIGATION section ──────────────────────────────────────
  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "accueil",      label: "Accueil",      icon: <LayoutDashboard size={15} /> },
    { key: "comptes",      label: "Comptes",      icon: <Wallet size={15} /> },
    { key: "historique",   label: "Historique",   icon: <Clock size={15} /> },
    { key: "statistiques", label: "Statistiques", icon: <BarChart3 size={15} /> },
    { key: "objectifs",    label: "Objectifs",    icon: <PiggyBank size={15} /> },
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
        background: "var(--bg-root)",
        color: "var(--text-primary)",
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
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        {/* ══ SIDEBAR CONTENT ══════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* ── Logo + sous-titre + bouton toggle ouverture/fermeture ──────── */}
          {!sidebarCollapsed ? (
            <div
              style={{
                position: "relative",
                padding: "4px 4px 16px 4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                {/* Logo GestFiPro — mix-blend-mode:screen, fond transparent */}
                <SidebarLogoFull onClick={() => setActiveTab("accueil")} />

                {/* Bouton toggle collapse/expand avec icône flèche/croix */}
                <button
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                      setSidebarOpen(false);
                    } else {
                      setSidebarCollapsed(true);
                    }
                  }}
                  title="Réduire le menu"
                  aria-label="Réduire la barre latérale"
                  style={{
                    background: "#18181B",
                    border: "1px solid #27272A",
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    color: "#A1A1AA",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                    marginTop: 4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#EF4444";
                    e.currentTarget.style.color = "#EF4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#27272A";
                    e.currentTarget.style.color = "#A1A1AA";
                  }}
                >
                  {/* Croix sur mobile, Flèche gauche sur desktop */}
                  <span className="visible-mobile" style={{ display: "flex" }}>
                    <X size={15} />
                  </span>
                  <span className="hidden-mobile" style={{ display: "flex" }}>
                    <ChevronLeft size={15} />
                  </span>
                </button>
              </div>

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
            </div>
          ) : (
            <div
              style={{
                padding: "4px 0 16px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <SidebarLogoIcon size={34} onClick={() => setActiveTab("accueil")} />

              {/* Bouton d'agrandissement (flèche droite) */}
              <button
                onClick={() => setSidebarCollapsed(false)}
                title="Agrandir le menu"
                aria-label="Agrandir la barre latérale"
                style={{
                  background: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  color: "#A1A1AA",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#EF4444";
                  e.currentTarget.style.color = "#EF4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#27272A";
                  e.currentTarget.style.color = "#A1A1AA";
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* ── NAVIGATION ────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 8 }}>
            {!sidebarCollapsed && (
              <p className="section-label" style={{ paddingLeft: 12, marginBottom: 6 }}>Navigation</p>
            )}
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item${activeTab === item.key ? " active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => {
                  setActiveTab(item.key);
                  setSidebarOpen(false);
                }}
              >
                <span style={{ color: activeTab === item.key ? "#EF4444" : "#52525B", display: "flex", alignItems: "center" }}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && item.label}
              </button>
            ))}
          </div>

          {/* ── Séparateur ───────────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid #27272A", margin: "8px 0" }} />

          {/* ── OUTILS (Guide uniquement) ─────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {!sidebarCollapsed && (
              <p className="section-label" style={{ paddingLeft: 12, marginBottom: 6 }}>Outils</p>
            )}
            {toolItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item-tool${activeTab === item.key ? " active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
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
                {!sidebarCollapsed && item.label}
              </button>
            ))}
          </div>

          {/* ── Bascule Thème Dark / Light ── */}
          <div style={{ marginTop: "auto", paddingTop: 10, paddingBottom: 4 }}>
            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
                aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.borderColor = "#EF4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {theme === "dark" ? <Moon size={14} color="#EF4444" /> : <Sun size={14} color="#EF4444" />}
                  <span>{theme === "dark" ? "Mode Sombre" : "Mode Clair"}</span>
                </span>
                <span
                  style={{
                    width: 30,
                    height: 16,
                    borderRadius: 99,
                    background: theme === "dark" ? "rgba(239,68,68,0.2)" : "#E4E4E7",
                    border: theme === "dark" ? "1px solid rgba(239,68,68,0.4)" : "1px solid #D4D4D8",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 2px",
                    justifyContent: theme === "dark" ? "flex-end" : "flex-start",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#EF4444",
                    }}
                  />
                </span>
              </button>
            ) : (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
                  aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    color: "#EF4444",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#EF4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ── Profil utilisateur compact ───────────────────────────────── */}
        <div
          style={{
            padding: sidebarCollapsed ? "10px 4px" : "10px 8px",
            borderTop: "1px solid #27272A",
            display: "flex",
            flexDirection: sidebarCollapsed ? "column" : "row",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
            gap: sidebarCollapsed ? 8 : 10,
            marginTop: 8,
          }}
        >
          {/* Avatar initiales */}
          <div
            title={userName || "Utilisateur"}
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
            {(userName || "U").substring(0, 2).toUpperCase()}
          </div>
          {!sidebarCollapsed ? (
            <>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#FAFAFA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userName || "Nouvel Utilisateur"}
                </p>
                <p style={{ fontSize: 9, color: "#52525B", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>Compte personnel</p>
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
              {currentUser && (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/login";
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#52525B", padding: 2, display: "flex", transition: "color 0.15s" }}
                  title="Déconnexion"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
                >
                  <LogOut size={13} />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab("reglages")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#52525B", padding: 4, display: "flex", transition: "color 0.15s" }}
                title="Paramètres"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#A1A1AA")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
              >
                <Settings size={14} />
              </button>
              {currentUser && (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/login";
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#52525B", padding: 4, display: "flex", transition: "color 0.15s" }}
                  title="Déconnexion"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
                >
                  <LogOut size={14} />
                </button>
              )}
            </>
          )}
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
            {/* ── Bouton menu (Mobile: ouvre drawer / Desktop: toggle collapse) ── */}
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setSidebarOpen(true);
                } else {
                  setSidebarCollapsed((prev) => !prev);
                }
              }}
              title="Basculer la barre latérale"
              aria-label="Basculer la barre latérale"
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
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}
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
                    {hasUnread && notifications.length > 0 ? (
                      <span className="badge badge-danger" style={{ fontSize: 9 }}>{notifications.length} nouvelle{notifications.length > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="badge" style={{ fontSize: 9 }}>0 notification</span>
                    )}
                  </div>

                  {/* Liste */}
                  {notifications.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center", color: "#71717A" }}>
                      <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#FAFAFA" }}>Aucune notification</p>
                      <p style={{ fontSize: 11, color: "#52525B", marginTop: 2 }}>Vos alertes budgétaires s'afficheront ici.</p>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={i}
                        onClick={() => { setActiveNotif(n); setShowNotifications(false); }}
                        style={{
                          padding: "12px 16px",
                          borderBottom: i < notifications.length - 1 ? "1px solid #27272A" : "none",
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
                    ))
                  )}

                  {/* Pied — Tout marquer comme lu */}
                  {notifications.length > 0 && (
                    <div style={{ padding: "10px 16px" }}>
                      <button
                        onClick={() => {
                          setHasUnread(false);
                          setShowNotifications(false);
                        }}
                        style={{ width: "100%", background: "none", border: "1px solid #27272A", borderRadius: 8, padding: "7px 0", fontSize: 12, color: "#A1A1AA", cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#52525B")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#27272A")}
                      >
                        ✓ Tout marquer comme lu
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 80px 0" }}>

          {/* ════════════ TAB: ACCUEIL ════════════ */}
          {activeTab === "accueil" && (
            <DashboardView
              profile={{
                id: currentUser?.id || "local",
                full_name: userName,
                net_salary: monthlySalary,
                payday_with_month: paydayDate,
              }}
              accounts={accounts as any}
              transactions={transactions as any}
              isLoading={isLoadingData}
              onOpenModal={() => setShowModal(true)}
              onNavigate={(tab) => setActiveTab(tab as TabKey)}
              onQuickSubmit={handleQuickSubmit}
              quickInputText={quickInputText}
              setQuickInputText={setQuickInputText}
              todayExpenses={todayExpenses}
              totalBalance={totalBalance}
            />
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
                      handleAddAccount(name, Number(bal));
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

                {transactions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 20px", color: "#71717A" }}>
                    <Clock size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>Aucune transaction enregistrée</p>
                    <p style={{ fontSize: 12, color: "#71717A", marginTop: 4, marginBottom: 18, maxWidth: 360, margin: "6px auto 18px" }}>
                      Vos dépenses et rentrées apparaîtront ici dès votre première saisie.
                    </p>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ margin: "0 auto" }}>
                      <Plus size={14} /> Enregistrer une opération
                    </button>
                  </div>
                ) : (
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
                )}
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

              {transactions.filter((t) => t.type === "expense" || t.amount < 0).length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "56px 24px", color: "#71717A" }}>
                  <BarChart3 size={44} style={{ margin: "0 auto 12px", opacity: 0.35, color: "#EF4444" }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA" }}>Aucune statistique pour le moment</p>
                  <p style={{ fontSize: 12, color: "#71717A", marginTop: 4, maxWidth: 460, margin: "8px auto 20px", lineHeight: 1.6 }}>
                    Votre tableau de bord est prêt pour un nouvel utilisateur. Dès l'enregistrement de vos premières dépenses, vos graphiques et répartitions par catégorie s'afficheront ici automatiquement.
                  </p>
                  <button onClick={() => setShowModal(true)} className="btn-primary" style={{ margin: "0 auto" }}>
                    <Plus size={14} /> Enregistrer une première dépense
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="card" style={{ padding: "22px 24px" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Répartition par Poste</h3>
                    <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 18 }}>Dépenses en FCFA — Cycle en cours</p>
                    <DonutChart transactions={transactions} />
                  </div>

                  <div className="card" style={{ padding: "22px 24px" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Détail par catégorie</h3>
                    <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 18 }}>Dépenses réelles calculées</p>
                    {(() => {
                      const expList = transactions.filter((t) => t.type === "expense" || t.amount < 0);
                      const totalExp = expList.reduce((acc, t) => acc + Math.abs(t.amount), 0);
                      const catTotals: Record<string, number> = {};
                      for (const t of expList) {
                        const c = t.category || "Divers";
                        catTotals[c] = (catTotals[c] || 0) + Math.abs(t.amount);
                      }
                      const colorMap: Record<string, string> = {
                        "Nourriture": "#EF4444",
                        "Transport": "#6366f1",
                        "Logement": "#8b5cf6",
                        "Loisirs": "#f59e0b",
                        "Santé": "#ec4899",
                        "Éducation": "#14b8a6",
                        "Vêtements": "#3b82f6",
                        "Divers": "#10b981",
                      };
                      return Object.entries(catTotals).map(([cat, amount]) => {
                        const pct = totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0;
                        const color = colorMap[cat] || "#A1A1AA";
                        return (
                          <div key={cat} style={{ marginBottom: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                                <span style={{ fontSize: 12, color: "#FAFAFA" }}>{cat}</span>
                              </div>
                              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <span style={{ fontSize: 11, color: "#A1A1AA" }}>{fmt(amount)} FCFA</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>{pct}%</span>
                              </div>
                            </div>
                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{ width: `${pct}%`, background: color, opacity: 0.85 }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="card" style={{ padding: "22px 24px", gridColumn: "1 / 3" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Évolution du Solde — Cycle en cours</h3>
                    <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 16 }}>Tendance de votre trésorerie</p>
                    <CashflowChart transactions={transactions} totalBalance={totalBalance} />
                  </div>
                </div>
              )}
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
                      handleAddGoal(title, Number(target));
                    }
                  }}
                >
                  <Plus size={14} /> Nouvel objectif
                </button>
              </div>

              {objectives.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "48px 24px", color: "#71717A" }}>
                  <PiggyBank size={40} style={{ margin: "0 auto 12px", opacity: 0.4, color: "#EF4444" }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>Aucun objectif d'épargne pour l'instant</p>
                  <p style={{ fontSize: 12, color: "#71717A", marginTop: 4, maxWidth: 420, margin: "6px auto 18px" }}>
                    Définissez vos projets financiers (Fonds de prévoyance, Matériel, Voyage, Équipement...) et suivez vos paliers de progression.
                  </p>
                  <button
                    className="btn-primary"
                    style={{ margin: "0 auto" }}
                    onClick={() => {
                      const title = prompt("Titre de l'objectif :");
                      const target = prompt("Montant cible (FCFA) :");
                      if (title && target) {
                        handleAddGoal(title, Number(target));
                      }
                    }}
                  >
                    <Plus size={14} /> Créer mon premier objectif
                  </button>
                </div>
              ) : (
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
                                handleFeedGoal(obj.id, Number(amount));
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
              )}
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

                {/* ── Section Thème (Dark / Light) ── */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
                  <p className="section-label" style={{ marginBottom: 6 }}>Apparence & Thème</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>
                    Sélectionnez le mode d'affichage de GestFiPro (géré via la classe <code>dark</code> sur <code>&lt;html&gt;</code>).
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: theme === "dark" ? "rgba(239,68,68,0.08)" : "var(--bg-root)",
                        border: theme === "dark" ? "1.5px solid #EF4444" : "1px solid var(--border)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: theme === "dark" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Moon size={16} color={theme === "dark" ? "#EF4444" : "var(--text-muted)"} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Sombre</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Thème dark</p>
                        </div>
                      </div>
                      {theme === "dark" && (
                        <span className="badge badge-success" style={{ fontSize: 9, padding: "2px 8px" }}>Actif</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: theme === "light" ? "rgba(239,68,68,0.08)" : "var(--bg-root)",
                        border: theme === "light" ? "1.5px solid #EF4444" : "1px solid var(--border)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: theme === "light" ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Sun size={16} color={theme === "light" ? "#EF4444" : "var(--text-muted)"} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Clair</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Thème light</p>
                        </div>
                      </div>
                      {theme === "light" && (
                        <span className="badge badge-success" style={{ fontSize: 9, padding: "2px 8px" }}>Actif</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bannière succès enregistrement */}
                {settingsSaved && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#EF4444",
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
                  onClick={handleSaveSettings}
                >
                  <CheckCircle2 size={14} />
                  Enregistrer les paramètres
                </button>

                {/* ── Zone de Danger : Remise à zéro (Nouvel Utilisateur) ── */}
                <div style={{ borderTop: "1px solid #27272A", paddingTop: 18, marginTop: 4 }}>
                  <p className="section-label" style={{ color: "#EF4444", marginBottom: 6 }}>Zone de Réinitialisation</p>
                  <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 12 }}>
                    Efface toutes les transactions, soldes, objectifs et profil pour repartir totalement à zéro comme un nouvel utilisateur.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetAllData}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 10,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#EF4444",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#EF4444";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                      e.currentTarget.style.color = "#EF4444";
                    }}
                  >
                    <Trash2 size={14} />
                    Réinitialiser toutes les données (Remise à zéro)
                  </button>
                </div>
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
                    "Le **badge** dans l'en-tête affiche le nombre de jours restants jusqu'au prochain versement.",
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