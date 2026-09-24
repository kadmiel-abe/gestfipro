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
  Loader2,
} from "lucide-react";
import MiniCalendar from "../components/MiniCalendar";
import { SidebarLogoFull, SidebarLogoIcon } from "../components/Logo";
import { AccountIcon, getAccountColor } from "../components/AccountIcon";
import DashboardView from "../components/DashboardView";
import PayCycleCard from "../components/PayCycleCard";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { useTheme } from "../components/ThemeProvider";
import LanguageSelector from "../components/LanguageSelector";
import { getCurrencyMeta, useLanguage } from "@/lib/i18n/LanguageContext";

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
type Currency = "XOF" | "XAF" | "NGN" | "KES" | "ZAR" | "USD" | "EUR";

const CURRENCY_OPTIONS: Record<Currency, { label: string; shortLabel: string; symbol: string; digits: number }> = {
  XOF: { label: "XOF (CFA Ouest)", shortLabel: "XOF", symbol: "XOF", digits: 0 },
  XAF: { label: "XAF (CFA Centre)", shortLabel: "XAF", symbol: "XAF", digits: 0 },
  NGN: { label: "NGN (₦ Nigeria)", shortLabel: "NGN", symbol: "₦", digits: 0 },
  KES: { label: "KES (KSh Kenya)", shortLabel: "KES", symbol: "KSh", digits: 0 },
  ZAR: { label: "ZAR (R Afrique du Sud)", shortLabel: "ZAR", symbol: "R", digits: 2 },
  USD: { label: "USD ($)", shortLabel: "USD", symbol: "$", digits: 2 },
  EUR: { label: "EUR (€)", shortLabel: "EUR", symbol: "€", digits: 2 },
};

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
  const locale = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en-US" : "fr-FR";
  return n.toLocaleString(locale);
}

function formatMoney(n: number, currency: Currency) {
  const locale = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en-US" : "fr-FR";
  const meta = CURRENCY_OPTIONS[currency] ?? CURRENCY_OPTIONS.XOF;

  if (currency === "XOF" || currency === "XAF") {
    return `${Math.round(n).toLocaleString(locale)} ${meta.symbol}`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency === "USD" ? "USD" : currency === "EUR" ? "EUR" : currency === "NGN" ? "NGN" : currency === "KES" ? "KES" : currency === "ZAR" ? "ZAR" : "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: meta.digits,
    maximumFractionDigits: meta.digits,
  }).format(n);
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
  const { currency, isEn } = useLanguage();
  const currencySymbol = getCurrencyMeta(currency).symbol;
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Nourriture");
  const [customCategory, setCustomCategory] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [account, setAccount] = useState(accounts[0]?.name ?? "");

  const categories = ["Nourriture", "Transport", "Logement", "Factures", "Loisirs", "Santé", "Éducation", "Vêtements", "Autre"];

  const isOther = category === "Autre" || category === "Divers";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !amount) return;
    const selectedAcc = account || accounts[0]?.name;
    if (!selectedAcc) {
      alert("Veuillez d'abord ajouter un compte financier dans l'onglet Comptes avant d'enregistrer une opération.");
      return;
    }
    const resolvedCategory = (isOther && customCategory.trim()) ? customCategory.trim() : category;
    onAdd({
      label,
      category: resolvedCategory,
      amount: type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
      type,
      date: "À l'instant",
      account: selectedAcc,
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
                border: type === "income" ? "1px solid rgba(255,255,255,0.3)" : "1px solid #27272A",
                background: type === "income" ? "rgba(255,255,255,0.08)" : "#09090B",
                color: type === "income" ? "#FAFAFA" : "#A1A1AA",
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
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#A1A1AA", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{isEn ? `Amount (${currencySymbol})` : `Montant (${currencySymbol})`}</label>
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
                  {accounts.length === 0 ? (
                    <option value="">Aucun compte configuré</option>
                  ) : (
                    accounts.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)
                  )}
                </select>
              </div>
            </div>
          </div>

          {isOther && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#EF4444", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Préciser la catégorie
              </label>
              <input
                className="input-field"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ex: Cadeau, Abonnement, Tontine..."
                style={{ borderColor: "rgba(239,68,68,0.4)" }}
                autoFocus
              />
            </div>
          )}

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

// Stable Supabase client — created once at module level via singleton
const supabase = createClient();

export default function GestFiProDashboard() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { language, setLanguage, t, isEn, currency, setCurrency } = useLanguage();
  const currencySymbol = getCurrencyMeta(currency).symbol;
  const [activeTab, setActiveTab] = useState<TabKey>("accueil");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<{ icon: string; title: string; desc: string; detail: string; time: string; color: string }[]>([]);
  const [activeNotif, setActiveNotif] = useState<null | { icon: string; title: string; desc: string; detail: string; time: string; color: string }>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // Profile fields (from Supabase profiles)
  const [userName, setUserName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [paydayDate, setPaydayDate] = useState(0);

  // Accounts (from Supabase accounts)
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Transactions (from Supabase transactions)
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Goals (from Supabase goals)
  const [objectives, setObjectives] = useState<Objective[]>([]);

  const [quickInputText, setQuickInputText] = useState("");

  // Extraire le prénom dynamiquement pour l'affichage
  const firstName = React.useMemo(() => {
    if (userName && userName.trim()) {
      return userName.trim().split(" ")[0];
    }
    const meta = currentUser?.user_metadata;
    const metaName = meta?.full_name || meta?.name || meta?.first_name || meta?.given_name;
    if (metaName && typeof metaName === "string" && metaName.trim()) {
      return metaName.trim().split(" ")[0];
    }
    if (currentUser?.email) {
      const prefix = currentUser.email.split("@")[0].replace(/[._-]/g, " ").trim();
      const first = prefix.split(" ")[0];
      return first.charAt(0).toUpperCase() + first.slice(1);
    }
    return "";
  }, [userName, currentUser]);

  const initials = React.useMemo(() => {
    const target = userName || firstName || "U";
    const parts = target.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.substring(0, 2).toUpperCase();
  }, [userName, firstName]);

  // ─── Data Loading from Supabase ───────────────────────────────────────────
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  const handleCurrencyChange = (nextCurrency: Currency) => {
    setCurrency(nextCurrency);
    setSelectedCurrency(nextCurrency);
  };

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    setDataLoadError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setCurrentUser(user);

      if (user) {
        // Extraire le nom depuis user_metadata (Google OAuth)
        const meta = user.user_metadata;
        const oAuthFullName = meta?.full_name || meta?.name || meta?.user_name || "";

        // 1. SELECT profiles
        const { data: prof, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        if (prof) {
          const resolvedName = prof.full_name?.trim() || oAuthFullName || "";
          setUserName(resolvedName);
          setMonthlySalary(Number(prof.net_salary) || 0);
          setPaydayDate(prof.payday_with_month || (prof as any).pay_day || 0);

          // Synchroniser si le nom était vide en base mais disponible via OAuth
          if (!prof.full_name && oAuthFullName) {
            try {
              await supabase.from("profiles").update({ full_name: oAuthFullName }).eq("id", user.id);
            } catch (e) {
              console.warn("Sync profile name error:", e);
            }
          }
        } else {
          const initialName = oAuthFullName || (user.email ? user.email.split("@")[0] : "");
          setUserName(initialName);
          setMonthlySalary(0);
          setPaydayDate(0);

          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              full_name: initialName,
              net_salary: 0,
              payday_with_month: null,
            });
          } catch (e) {
            console.warn("Create profile error:", e);
          }
        }

        // 2. SELECT accounts
        const { data: accs, error: accountsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id);
        if (accountsError) {
          console.warn("Erreur chargement comptes Supabase :", accountsError);
          setAccounts([]);
        }

        const accountRows = accs ?? [];
        const accountNames = new Map(accountRows.map((a: any) => [a.id, a.name]));

        if (!accountsError && accountRows.length > 0) {
          setAccounts(accountRows.map((a: any) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            balance: Number(a.balance) || 0,
            colorClass: getAccountColor(a.name),
            icon: a.name.includes("Wave") ? "🌊" : a.name.includes("Orange") ? "🟠" : a.name.includes("Banque") ? "🏦" : "💵",
          })));
        } else {
          setAccounts([]);
        }

        // 3. SELECT transactions
        const { data: txs, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false });
        if (transactionsError) {
          console.warn("Erreur chargement transactions Supabase :", transactionsError);
          setTransactions([]);
        }

        if (!transactionsError && txs) {
          setTransactions(txs.map((t: any) => ({
            id: t.id,
            label: t.title || t.note || "Opération",
            category: t.category || "Divers",
            amount: Number(t.amount) || 0,
            type: t.type,
            date: t.transaction_date ? new Date(t.transaction_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "À l'instant",
            account: accountNames.get(t.account_id) || t.note || "Compte",
            icon: t.type === "income" ? "⬇" : "⬆",
          })));
        } else {
          setTransactions([]);
        }

        // 4. SELECT goals
        const { data: gls, error: goalsError } = await supabase.from("goals").select("*").eq("user_id", user.id);
        if (goalsError) {
          console.warn("Erreur chargement objectifs Supabase :", goalsError);
          setObjectives([]);
        }
        if (!goalsError && gls && gls.length > 0) {
          setObjectives(gls.map((g: any) => ({
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
        // Fallback local pour persistance hors connexion
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
    } catch (err) {
      console.error("Erreur chargement données Supabase :", err);
      const message = err && typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message)
        : err instanceof Error
          ? err.message
          : "Impossible de charger les données du compte.";
      setDataLoadError(message);
    } finally {
      setIsLoadingData(false);
    }
  // supabase is a stable singleton — no need to include it as a dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabKey | null;
      const validTabs: TabKey[] = ["accueil", "comptes", "historique", "statistiques", "objectifs", "reglages", "guide"];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
      if (params.get("action") === "new_expense" || params.get("modal") === "expense") {
        setShowModal(true);
      }
    }

    // Écouter les changements d'état d'authentification Supabase (session hydratée, token rafraîchi, login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const meta = session.user.user_metadata;
        const metaName = meta?.full_name || meta?.name || "";
        if (metaName) {
          setUserName((prev) => prev || metaName);
        }
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          loadData();
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // loadData is stable (deps: []), supabase is a singleton — run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  // ─── Computed values ──────────────────────────────────────────────────────
  const now = new Date();
  const todayNum = now.getDate();
  const dateStr = formatDateFr(now);

  const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

  const isPaydayConfigured = Boolean(paydayDate && paydayDate > 0 && paydayDate <= 31);

  let daysRemaining = 0;
  if (isPaydayConfigured) {
    daysRemaining = paydayDate - todayNum;
    if (daysRemaining <= 0) {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      daysRemaining += daysInMonth;
    }
  }

  const effectiveBalance = totalBalance > 0 ? totalBalance : (monthlySalary > 0 ? monthlySalary : 0);
  const dailyBudget = isPaydayConfigured && daysRemaining > 0 ? Math.round(effectiveBalance / daysRemaining) : 0;

  const todayExpenses = transactions
    .filter((t) => (t.type === "expense" || t.amount < 0) && (t.date?.startsWith("Auj") || t.date?.includes("instant")))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const isBudgetCritical = isPaydayConfigured && dailyBudget < 10000 && effectiveBalance > 0;
  const rhythmAlert = isPaydayConfigured && dailyBudget > 0 && todayExpenses > dailyBudget;

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
        const insertPayload: Record<string, any> = {
          user_id: currentUser.id,
          account_id: isUuid ? targetAccount.id : null,
          title: tx.label,
          category: tx.category || "Divers",
          amount: tx.amount,
          type: tx.type,
          transaction_date: new Date().toISOString(),
          note: tx.account,
        };

        let { error: transactionError } = await supabase.from("transactions").insert(insertPayload);
        if (transactionError && (transactionError as any).code === "PGRST204") {
          const fallbackPayload = {
            user_id: currentUser.id,
            account_id: isUuid ? targetAccount.id : null,
            title: tx.label,
            amount: tx.amount,
            type: tx.type,
            transaction_date: new Date().toISOString(),
          };
          const retry = await supabase.from("transactions").insert(fallbackPayload);
          transactionError = retry.error;
        }
        if (transactionError) throw transactionError;

        if (isUuid) {
          const { error: accountError } = await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", targetAccount.id)
            .eq("user_id", currentUser.id);
          if (accountError) throw accountError;
        }
        await loadData();
      } catch (err) {
        console.error("Erreur insertion transaction Supabase :", err);
        setTransactions((prev) => prev.filter((item) => item.id !== tempId));
        setAccounts(accounts);
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

    if (accounts.length === 0) {
      alert("Veuillez d'abord ajouter un compte financier dans l'onglet Comptes avant d'enregistrer une dépense.");
      setActiveTab("comptes");
      return;
    }

    // Analyse sommaire du texte saisi : ex "Déjeuner 3000"
    let parsedAmount = 5000;
    let parsedCategory = "Nourriture";
    let parsedAccount = accounts[0].name;
    let parsedLabel = quickInputText;

    const numMatch = quickInputText.match(/\b\d+\b/);
    if (numMatch) {
      parsedAmount = parseInt(numMatch[0], 10);
    }

    // Détecter si l'utilisateur a mentionné un de ses propres comptes
    const matchedAcc = accounts.find((a) => quickInputText.toLowerCase().includes(a.name.toLowerCase()));
    if (matchedAcc) {
      parsedAccount = matchedAcc.name;
    }

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
    setSettingsError(null);
    const cleanPayday = paydayDate > 0 && paydayDate <= 31 ? paydayDate : null;
    const cleanSalary = Math.max(0, Number(monthlySalary) || 0);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Session Supabase introuvable. Veuillez vous reconnecter.");

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: userName.trim(),
        net_salary: cleanSalary,
        payday_with_month: cleanPayday,
      }, { onConflict: "id" });
      if (profileError) throw profileError;

      setCurrentUser(user);
    } catch (err: any) {
      console.error("Erreur sauvegarde profil Supabase :", err);
      const detail = [err?.message, err?.code ? `Code: ${err.code}` : "", err?.details, err?.hint]
        .filter(Boolean)
        .join(" - ");
      setSettingsError(detail || "Impossible d'enregistrer les paramètres.");
      return;
    }

    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
    localStorage.setItem(
      "gestfipro_profile",
      JSON.stringify({ userName, monthlySalary: cleanSalary, paydayDate: cleanPayday || 0 })
    );
  };

  const handleAddAccount = async (name: string, balance: number, type: string = "Manuel") => {
    if (!name.trim()) return;
    const initialBal = Number(balance) || 0;

    let detectedType = type;
    const lower = name.toLowerCase();
    if (lower.includes("wave")) detectedType = "wave";
    else if (lower.includes("orange") || lower.includes("mtn") || lower.includes("moov") || lower.includes("mobile")) detectedType = "mobile_money";
    else if (lower.includes("banque") || lower.includes("bank")) detectedType = "bank";
    else if (lower.includes("espèce") || lower.includes("espece") || lower.includes("cash")) detectedType = "cash";

    if (currentUser) {
      try {
        const { data, error } = await supabase
          .from("accounts")
          .insert({
            user_id: currentUser.id,
            name: name.trim(),
            type: detectedType,
            balance: initialBal,
          })
          .select()
          .single();

        if (error) throw error;
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
      type: detectedType as any,
      balance: initialBal,
      colorClass: getAccountColor(name.trim()),
      icon: "💳",
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    localStorage.setItem("gestfipro_accounts", JSON.stringify(updated));
  };

  const handleDeleteAccount = async (accId: string | number, accName: string) => {
    if (!confirm(`Supprimer définitivement le compte "${accName}" ?`)) return;
    const updated = accounts.filter((a) => a.id !== accId);
    setAccounts(updated);
    localStorage.setItem("gestfipro_accounts", JSON.stringify(updated));

    if (currentUser) {
      try {
        const { error } = await supabase.from("accounts").delete().eq("id", accId).eq("user_id", currentUser.id);
        if (error) throw error;
      } catch (err) {
        console.error("Erreur suppression compte Supabase :", err);
      }
    }
  };

  const handleEditAccountBalance = async (accId: string | number, accName: string, currentBal: number) => {
    const val = prompt(`Nouveau solde pour "${accName}" (${getCurrencyMeta(currency).symbol}) :`, String(currentBal));
    if (val === null || isNaN(Number(val)) || Number(val) < 0) return;
    const newBal = Number(val);
    const updated = accounts.map((a) => (a.id === accId ? { ...a, balance: newBal } : a));
    setAccounts(updated);
    localStorage.setItem("gestfipro_accounts", JSON.stringify(updated));

    if (currentUser) {
      try {
        const { error } = await supabase.from("accounts").update({ balance: newBal }).eq("id", accId).eq("user_id", currentUser.id);
        if (error) throw error;
      } catch (err) {
        console.error("Erreur mise à jour solde compte Supabase :", err);
      }
    }
  };

  const handleDeleteAllAccounts = async () => {
    if (!confirm("Voulez-vous supprimer TOUS vos comptes ? Vous repartirez avec une liste de comptes totalement vide.")) return;
    setAccounts([]);
    localStorage.setItem("gestfipro_accounts", JSON.stringify([]));

    if (currentUser) {
      try {
        const { error } = await supabase.from("accounts").delete().eq("user_id", currentUser.id);
        if (error) throw error;
      } catch (err) {
        console.error("Erreur suppression tous les comptes Supabase :", err);
      }
    }
  };

  const handleDeduplicateAccounts = async () => {
    if (!confirm("Voulez-vous fusionner et supprimer les comptes en double ?")) return;
    const seen = new Set<string>();
    const toKeep: Account[] = [];
    const toDeleteIds: (string | number)[] = [];

    for (const acc of accounts) {
      const key = acc.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        toKeep.push(acc);
      } else {
        toDeleteIds.push(acc.id);
      }
    }

    setAccounts(toKeep);
    localStorage.setItem("gestfipro_accounts", JSON.stringify(toKeep));

    if (currentUser && toDeleteIds.length > 0) {
      try {
        for (const id of toDeleteIds) {
          await supabase.from("accounts").delete().eq("id", id);
        }
      } catch (err) {
        console.error("Erreur déduplication Supabase :", err);
      }
    }
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
      localStorage.removeItem("gestfipro_goals");
    }
    setUserName("");
    setMonthlySalary(0);
    setPaydayDate(0);
    setTransactions([]);
    setObjectives([]);
    setAccounts([]);

    if (currentUser) {
      try {
        await supabase.from("transactions").delete().eq("user_id", currentUser.id);
        await supabase.from("goals").delete().eq("user_id", currentUser.id);
        await supabase.from("accounts").delete().eq("user_id", currentUser.id);
        await supabase.from("profiles").upsert({
          id: currentUser.id,
          full_name: "",
          net_salary: 0,
          payday_with_month: null,
        });
      } catch (err) {
        console.error("Erreur réinitialisation Supabase :", err);
      }
    }
    alert("Toutes les données ont été supprimées. L'application est maintenant vierge comme pour un nouvel utilisateur.");
  };

  // ─── Nav items — NAVIGATION section ──────────────────────────────────────
  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "accueil",      label: t.dashboard.tabs.accueil,      icon: <LayoutDashboard size={15} /> },
    { key: "comptes",      label: t.dashboard.tabs.comptes,      icon: <Wallet size={15} /> },
    { key: "historique",   label: t.dashboard.tabs.historique,   icon: <Clock size={15} /> },
    { key: "statistiques", label: t.dashboard.tabs.statistiques, icon: <BarChart3 size={15} /> },
    { key: "objectifs",    label: t.dashboard.tabs.objectifs,    icon: <PiggyBank size={15} /> },
    { key: "reglages",     label: t.dashboard.tabs.reglages,     icon: <Settings size={15} /> },
  ];

  // ─── Tool items — OUTILS section (Guide uniquement) ───────────────────────
  const toolItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "guide", label: t.dashboard.tabs.guide, icon: <HelpCircle size={15} /> },
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
        fontFamily: "var(--font-sans), system-ui, sans-serif",
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
                  title={t.dashboard.collapseSidebar}
                  aria-label={t.dashboard.collapseSidebar}
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
                {t.dashboard.smartFinanceSubtitle}
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
                title={t.dashboard.expandSidebar}
                aria-label={t.dashboard.expandSidebar}
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
              <p className="section-label" style={{ paddingLeft: 12, marginBottom: 6 }}>{t.dashboard.navSection}</p>
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
              <p className="section-label" style={{ paddingLeft: 12, marginBottom: 6 }}>{t.dashboard.toolsSection}</p>
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
                title={theme === "dark" ? t.dashboard.switchToLight : t.dashboard.switchToDark}
                aria-label={theme === "dark" ? t.dashboard.switchToLight : t.dashboard.switchToDark}
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
                  <span>{theme === "dark" ? t.dashboard.darkMode : t.dashboard.lightMode}</span>
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
                  title={theme === "dark" ? t.dashboard.switchToLight : t.dashboard.switchToDark}
                  aria-label={theme === "dark" ? t.dashboard.switchToLight : t.dashboard.switchToDark}
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
          {isLoadingData ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "2px 4px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#27272A",
                  flexShrink: 0,
                }}
                className="animate-pulse"
              />
              {!sidebarCollapsed && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <div style={{ width: "70%", height: 11, background: "#27272A", borderRadius: 4 }} className="animate-pulse" />
                  <div style={{ width: "45%", height: 8, background: "#1F1F23", borderRadius: 4 }} className="animate-pulse" />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Avatar initiales */}
              <div
                title={userName || firstName || "Utilisateur"}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #EF4444, #DC2626)",
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
                {initials}
              </div>
              {!sidebarCollapsed ? (
                <>
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#FAFAFA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {userName || firstName || "Utilisateur"}
                    </p>
                    <p style={{ fontSize: 9, color: "#52525B", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{t.dashboard.personalAccount}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("reglages")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#52525B", padding: 2, display: "flex", transition: "color 0.15s" }}
                    title={t.dashboard.settings}
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
                      title={t.dashboard.logout}
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
                    title={t.dashboard.settings}
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
                      title={t.dashboard.logout}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
                    >
                      <LogOut size={14} />
                    </button>
                  )}
                </>
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
          className="h-[60px] border-b border-[#27272A] px-3 sm:px-6 flex items-center justify-between bg-[#09090B]/90 backdrop-blur-md shrink-0 sticky top-0 z-20 w-full"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* ── Bouton menu (Mobile: ouvre drawer / Desktop: toggle collapse) ── */}
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setSidebarOpen(true);
                } else {
                  setSidebarCollapsed((prev) => !prev);
                }
              }}
              title={t.dashboard.toggleSidebar}
              aria-label={t.dashboard.toggleSidebar}
              className="hamburger-btn shrink-0"
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
            <span className="header-logo-icon shrink-0">
              <SidebarLogoIcon size={30} onClick={() => setActiveTab("accueil")} />
            </span>

            <span
              className="badge badge-success shrink-0 text-[11px] sm:text-xs py-1 px-2.5 flex items-center gap-1.5"
            >
              <span
                className="pulse-dot shrink-0"
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}
              />
              <span className="hidden sm:inline">{t.dashboard.activeCycle} </span>
              <span>({isEn ? "D-" : "J-"}{daysRemaining})</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center bg-[#18181B] border border-[#27272A] rounded-xl px-1.5 py-1 text-xs shrink-0">
              <span className="mr-1 text-[#EF4444] text-[10px] sm:text-xs">💱</span>
              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                className="bg-transparent text-white font-bold cursor-pointer outline-none text-[10px] sm:text-xs max-w-[82px] sm:max-w-[120px]"
                aria-label="Currency selector"
              >
                {Object.entries(CURRENCY_OPTIONS).map(([code, config]) => (
                  <option key={code} value={code} className="bg-[#18181B]">
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <LanguageSelector align="right" />
            <div className="hidden md:block text-right">
              <p style={{ fontSize: 10, color: "#A1A1AA", fontWeight: 500 }}>{t.dashboard.balance}</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#FAFAFA" }}>{formatMoney(totalBalance, selectedCurrency)}</p>
            </div>
            <div className="hidden md:block w-px h-7 bg-[#27272A]" />
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary py-1.5 px-2.5 sm:px-3.5 text-xs shrink-0 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">{t.dashboard.addTransaction}</span>
            </button>
            <div style={{ position: "relative" }}>
              {/* ─── Bouton cloche ─── */}
              <button
                onClick={() => setShowNotifications((v) => !v)}
                title={t.dashboard.notificationsTitle}
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
                  className="w-[min(320px,calc(100vw-24px))]"
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
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
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>{t.dashboard.notificationsTitle}</p>
                    {hasUnread && notifications.length > 0 ? (
                      <span className="badge badge-danger" style={{ fontSize: 9 }}>
                        {notifications.length} {isEn ? "new" : "nouvelle"}{notifications.length > 1 && !isEn ? "s" : ""}
                      </span>
                    ) : (
                      <span className="badge" style={{ fontSize: 9 }}>
                        0 {isEn ? "notification" : "notification"}
                      </span>
                    )}
                  </div>

                  {/* Liste */}
                  {notifications.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center", color: "#71717A" }}>
                      <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#FAFAFA" }}>{t.dashboard.noNotifications}</p>
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
                          <span style={{ fontSize: 9, color: n.color, fontWeight: 600 }}>{t.dashboard.seeMore}</span>
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
                        ✓ {t.dashboard.markAllRead}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 w-full" style={{ position: "relative" }}>
          {isLoadingData && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                background: "rgba(9,9,11,0.94)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
              }}
            >
              <div style={{ textAlign: "center", maxWidth: 320 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "#EF4444", margin: "0 auto 12px" }} />
                <p style={{ color: "#FAFAFA", fontSize: 14, fontWeight: 700 }}>{isEn ? "Loading your financial data..." : "Chargement de vos données financières..."}</p>
              </div>
            </div>
          )}
          {dataLoadError && !isLoadingData && (
            <div style={{ margin: 24, padding: 16, border: "1px solid rgba(239,68,68,0.35)", borderRadius: 12, background: "rgba(239,68,68,0.08)" }} role="alert">
              <p style={{ color: "#FCA5A5", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{isEn ? "Unable to load your data" : "Impossible de charger vos données"}</p>
              <p style={{ color: "#A1A1AA", fontSize: 12, marginBottom: 10 }}>{dataLoadError}</p>
              <button type="button" className="btn-primary" onClick={loadData}>{isEn ? "Retry" : "Réessayer"}</button>
            </div>
          )}

          {/* ════════════ TAB: ACCUEIL ════════════ */}
          {activeTab === "accueil" && (
            <DashboardView
              profile={{
                id: currentUser?.id || "local",
                full_name: userName,
                net_salary: monthlySalary,
                payday_with_month: paydayDate,
              }}
              currency={selectedCurrency}
              accounts={accounts as any}
              transactions={transactions as any}
              goals={objectives.map((o) => ({
                id: String(o.id),
                title: o.title,
                target_amount: o.targetAmount,
                current_amount: o.currentAmount,
                target_date: o.deadline || null,
              }))}
              isLoading={isLoadingData}
              onOpenModal={() => setShowModal(true)}
              onNavigate={(tab) => setActiveTab(tab as TabKey)}
              onQuickSubmit={handleQuickSubmit}
              quickInputText={quickInputText}
              setQuickInputText={setQuickInputText}
              todayExpenses={todayExpenses}
              totalBalance={totalBalance}
              userId={currentUser?.id || null}
              onTransactionAdded={() => loadData()}
            />
          )}

          {/* ════════════ TAB: COMPTES ════════════ */}
          {activeTab === "comptes" && (
            <div className="p-3 sm:p-6 max-w-4xl w-full mx-auto space-y-5">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>{t.dashboard.accountsPage.title}</h2>
                  <p style={{ fontSize: 13, color: "#A1A1AA" }}>{t.dashboard.accountsPage.subtitle}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {accounts.length > 0 && (
                    <>
                      {new Set(accounts.map((a) => a.name.trim().toLowerCase())).size !== accounts.length && (
                        <button
                          onClick={handleDeduplicateAccounts}
                          style={{
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#EF4444",
                            borderRadius: 10,
                            padding: "8px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {t.dashboard.accountsPage.cleanDuplicates}
                        </button>
                      )}
                      <button
                        onClick={handleDeleteAllAccounts}
                        style={{
                          background: "#27272A",
                          border: "1px solid #3F3F46",
                          color: "#A1A1AA",
                          borderRadius: 10,
                          padding: "8px 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                        title={isEn ? "Clear all accounts" : "Vider tous les comptes"}
                      >
                        <Trash2 size={13} /> {isEn ? "Clear all" : "Tout effacer"}
                      </button>
                    </>
                  )}
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const name = prompt(isEn ? "Account name (e.g. Cash, Wave, Orange Money, Bank...):" : "Nom du compte (ex: Espèces, Wave, Orange Money, BOA, Ecobank...) :");
                      if (!name || !name.trim()) return;
                      const bal = prompt(isEn ? `Initial balance (${getCurrencyMeta(currency).symbol}):` : `Solde initial (${getCurrencyMeta(currency).symbol}) :`, "0");
                      if (bal !== null && !isNaN(Number(bal))) {
                        handleAddAccount(name.trim(), Number(bal));
                      }
                    }}
                  >
                    <Plus size={14} /> {t.dashboard.accountsPage.addAccountBtn}
                  </button>
                </div>
              </div>

              {/* Alerte si doublons détectés */}
              {accounts.length > 0 && new Set(accounts.map((a) => a.name.trim().toLowerCase())).size !== accounts.length && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <p style={{ fontSize: 12, color: "#FAFAFA", margin: 0 }}>
                    ⚠️ <strong>{isEn ? "Duplicates detected:" : "Doublons détectés :"}</strong> {isEn ? "Multiple accounts have the same name. You can merge them in 1 click." : "Plusieurs comptes portent le même nom. Vous pouvez les fusionner automatiquement en 1 clic."}
                  </p>
                  <button
                    onClick={handleDeduplicateAccounts}
                    style={{
                      background: "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isEn ? "Clean now" : "Nettoyer maintenant"}
                  </button>
                </div>
              )}

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
                  <p className="section-label" style={{ marginBottom: 6 }}>{t.dashboard.accountsPage.totalBalance}</p>
                  <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#FAFAFA" }}>{formatMoney(totalBalance, selectedCurrency)}</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {accounts.map((a) => (
                    <div key={a.id} style={{ textAlign: "right", background: "#09090B", border: "1px solid #27272A", borderRadius: 10, padding: "8px 14px" }}>
                      <p style={{ fontSize: 9, color: "#A1A1AA", fontWeight: 600, textTransform: "uppercase" }}>{a.name}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: a.colorClass }}>{formatMoney(a.balance, selectedCurrency)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {accounts.length === 0 ? (
                <div
                  className="card"
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                    background: "#18181B",
                    border: "1px dashed #3F3F46",
                    borderRadius: 16,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#EF4444",
                    }}
                  >
                    <Wallet size={26} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#FAFAFA", margin: "0 0 6px" }}>
                      {t.dashboard.accountsPage.emptyAccounts}
                    </h3>
                    <p style={{ fontSize: 13, color: "#A1A1AA", margin: 0, maxWidth: 420 }}>
                      {t.dashboard.accountsPage.subtitle}
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ padding: "10px 20px" }}
                    onClick={() => {
                      const name = prompt(isEn ? "Account name (e.g. Cash, Wave, Orange Money, Bank...):" : "Nom du compte (ex: Espèces, Wave, Orange Money, Banque...) :");
                      if (!name || !name.trim()) return;
                      const bal = prompt(isEn ? `Initial balance (${getCurrencyMeta(currency).symbol}):` : `Solde initial (${getCurrencyMeta(currency).symbol}) :`, "0");
                      if (bal !== null && !isNaN(Number(bal))) {
                        handleAddAccount(name.trim(), Number(bal));
                      }
                    }}
                  >
                    <Plus size={15} /> {t.dashboard.accountsPage.addAccountBtn}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                         {/* ── Icône opérateur brandée ── */}
                        <AccountIcon name={acc.name} type={acc.type} size={46} radius={13} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{acc.name}</p>
                          <p style={{ fontSize: 11, color: "#A1A1AA" }}>{acc.type}</p>
                          <div style={{ marginTop: 4 }}>
                            <span className="badge" style={{ fontSize: 9 }}>{isEn ? "Manual" : "Manuel"}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 16, fontWeight: 800, color: "#FAFAFA" }}>{formatMoney(acc.balance, selectedCurrency)}</p>
                        </div>
                        {/* Bouton éditer solde */}
                        <button
                          title={isEn ? "Edit balance" : "Modifier le solde"}
                          onClick={() => handleEditAccountBalance(acc.id, acc.name, acc.balance)}
                          style={{ background: "#27272A", border: "none", borderRadius: 8, color: "#A1A1AA", cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#EF4444"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#27272A"; e.currentTarget.style.color = "#A1A1AA"; }}
                        >
                          ✏️
                        </button>
                        {/* Bouton supprimer */}
                        <button
                          onClick={() => handleDeleteAccount(acc.id, acc.name)}
                          style={{ background: "none", border: "none", color: "#52525B", cursor: "pointer", padding: 4, display: "flex", transition: "color 0.15s" }}
                          title={t.dashboard.accountsPage.deleteBtn}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#52525B")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════ TAB: HISTORIQUE ════════════ */}
          {activeTab === "historique" && (
            <div className="p-3 sm:p-6 max-w-4xl w-full mx-auto space-y-5">
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>{t.dashboard.historyPage.title}</h2>
                <p style={{ fontSize: 13, color: "#A1A1AA" }}>{t.dashboard.historyPage.subtitle}</p>
              </div>

              <div className="card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#09090B", border: "1px solid #27272A", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                  <Search size={14} color="#52525B" />
                  <input
                    className="input-field"
                    style={{ border: "none", padding: 0, background: "transparent" }}
                    placeholder={t.dashboard.historyPage.searchPlaceholder}
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
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{t.dashboard.home.noTransactions}</p>
                    <p style={{ fontSize: 12, color: "#71717A", marginTop: 4, marginBottom: 18, maxWidth: 360, margin: "6px auto 18px" }}>
                      {t.dashboard.home.addFirstExpense}
                    </p>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ margin: "0 auto" }}>
                      <Plus size={14} /> {t.dashboard.addTransaction}
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
                              background: tx.type === "income" ? "rgba(255,255,255,0.08)" : "rgba(239,68,68,0.08)",
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
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#FAFAFA" }}>
                          {tx.type === "income" ? "+" : ""}{formatMoney(Math.abs(tx.amount), selectedCurrency)}
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
                        {isEn ? `No transactions for "${historySearch}"` : `Aucune transaction pour « ${historySearch} »`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════ TAB: STATISTIQUES ════════════ */}
          {activeTab === "statistiques" && (
            <div className="p-3 sm:p-6 max-w-5xl w-full mx-auto space-y-5">
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>{t.dashboard.statsPage.title}</h2>
                <p style={{ fontSize: 13, color: "#A1A1AA" }}>{t.dashboard.statsPage.subtitle}</p>
              </div>

              {transactions.filter((t) => t.type === "expense" || t.amount < 0).length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "56px 24px", color: "#71717A" }}>
                  <BarChart3 size={44} style={{ margin: "0 auto 12px", opacity: 0.35, color: "#EF4444" }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA" }}>{t.dashboard.statsPage.noDataForPeriod}</p>
                  <p style={{ fontSize: 12, color: "#71717A", marginTop: 4, maxWidth: 460, margin: "8px auto 20px", lineHeight: 1.6 }}>
                    {t.dashboard.home.addFirstExpense}
                  </p>
                  <button onClick={() => setShowModal(true)} className="btn-primary" style={{ margin: "0 auto" }}>
                    <Plus size={14} /> {t.dashboard.addTransaction}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="card" style={{ padding: "22px 24px" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{t.dashboard.statsPage.expensesByCategory}</h3>
                    <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 18 }}>{t.dashboard.statsPage.currentMonth}</p>
                    <DonutChart transactions={transactions} />
                  </div>

                  <div className="card" style={{ padding: "22px 24px" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{t.dashboard.home.categoryDistribution}</h3>
                    <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 18 }}>{t.dashboard.statsPage.currentMonth}</p>
                    {(() => {
                      const expList = transactions.filter((t) => t.type === "expense" || t.amount < 0);
                      const totalExp = expList.reduce((acc, t) => acc + Math.abs(t.amount), 0);
                      const catTotals: Record<string, number> = {};
                      for (const t of expList) {
                        const c = t.category || (isEn ? "Other" : "Divers");
                        catTotals[c] = (catTotals[c] || 0) + Math.abs(t.amount);
                      }
                      const colorMap: Record<string, string> = {
                        "Nourriture": "#EF4444",
                        "Food & Groceries": "#EF4444",
                        "Transport": "#DC2626",
                        "Transport & Fuel": "#DC2626",
                        "Logement": "#B91C1C",
                        "Housing & Rent": "#B91C1C",
                        "Factures": "#F87171",
                        "Bills (Water, Power, Internet)": "#F87171",
                        "Loisirs": "#F87171",
                        "Leisure & Dining Out": "#F87171",
                        "Santé": "#FAFAFA",
                        "Health & Pharmacy": "#FAFAFA",
                        "Éducation": "#E4E4E7",
                        "Education & Courses": "#E4E4E7",
                        "Vêtements": "#A1A1AA",
                        "Shopping & Clothes": "#A1A1AA",
                        "Divers": "#71717A",
                        "Other": "#71717A",
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
                                <span style={{ fontSize: 11, color: "#A1A1AA" }}>{formatMoney(amount, selectedCurrency)}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>{pct}%</span>
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

                  <div className="card p-4 sm:p-6 lg:col-span-2">
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{t.dashboard.home.cashflowTitle}</h3>
                    <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 16 }}>{t.dashboard.home.cashflowSubtitle}</p>
                    <CashflowChart transactions={transactions} totalBalance={totalBalance} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════ TAB: OBJECTIFS ════════════ */}
          {activeTab === "objectifs" && (
            <div className="p-3 sm:p-6 max-w-4xl w-full mx-auto space-y-5">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>{t.dashboard.goalsPage.title}</h2>
                  <p style={{ fontSize: 13, color: "#A1A1AA" }}>{t.dashboard.goalsPage.subtitle}</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const title = prompt(isEn ? "Goal project title:" : "Titre de l'objectif :");
                    const target = prompt(isEn ? `Target amount (${getCurrencyMeta(currency).symbol}):` : `Montant cible (${getCurrencyMeta(currency).symbol}) :`);
                    if (title && target) {
                      handleAddGoal(title, Number(target));
                    }
                  }}
                >
                  <Plus size={14} /> {t.dashboard.goalsPage.addGoalBtn}
                </button>
              </div>

              {objectives.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "48px 24px", color: "#71717A" }}>
                  <PiggyBank size={40} style={{ margin: "0 auto 12px", opacity: 0.4, color: "#EF4444" }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{t.dashboard.goalsPage.emptyGoals}</p>
                  <button
                    className="btn-primary"
                    style={{ margin: "16px auto 0" }}
                    onClick={() => {
                      const title = prompt(isEn ? "Goal project title:" : "Titre de l'objectif :");
                      const target = prompt(isEn ? `Target amount (${getCurrencyMeta(currency).symbol}):` : `Montant cible (${getCurrencyMeta(currency).symbol}) :`);
                      if (title && target) {
                        handleAddGoal(title, Number(target));
                      }
                    }}
                  >
                    <Plus size={14} /> {t.dashboard.goalsPage.addFirstGoal}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                              {obj.deadline && <p style={{ fontSize: 11, color: "#A1A1AA" }}>{isEn ? "Target:" : "Échéance :"} {obj.deadline}</p>}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "4px 10px",
                              borderRadius: 99,
                              background: pct >= 100 ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.08)",
                              border: `1px solid ${pct >= 100 ? "rgba(255,255,255,0.25)" : "rgba(239,68,68,0.2)"}`,
                              color: pct >= 100 ? "#FAFAFA" : "#f87171",
                            }}
                          >
                            {pct}%
                          </span>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: "#A1A1AA" }}>{isEn ? "Progress" : "Progression"}</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>
                              {formatMoney(obj.currentAmount, selectedCurrency)} / {formatMoney(obj.targetAmount, selectedCurrency)}
                            </span>
                          </div>
                          <div className="progress-track" style={{ height: 8 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${pct}%`,
                                background: pct >= 100 ? "#FAFAFA" : "linear-gradient(90deg, #EF4444, #DC2626)",
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#A1A1AA" }}>
                            {isEn ? "Remaining:" : "Reste :"} <strong style={{ color: "#FAFAFA" }}>{formatMoney(remaining, selectedCurrency)}</strong>
                          </span>
                          <button
                            className="btn-primary"
                            style={{ padding: "5px 12px", fontSize: 11 }}
                            onClick={() => {
                              const amount = prompt(isEn ? `Fund "${obj.title}" with amount (${getCurrencyMeta(currency).symbol}):` : `Alimenter "${obj.title}" de combien ? (${getCurrencyMeta(currency).symbol})`);
                              if (amount && Number(amount) > 0) {
                                handleFeedGoal(obj.id, Number(amount));
                              }
                            }}
                          >
                            <PiggyBank size={11} /> {isEn ? "Fund" : "Alimenter"}
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
            <div className="p-3 sm:p-6 max-w-xl w-full mx-auto space-y-5">
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>{t.dashboard.settingsPage.title}</h2>
                <p style={{ fontSize: 13, color: "#A1A1AA" }}>{t.dashboard.settingsPage.subtitle}</p>
              </div>

              <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {t.dashboard.settingsPage.fullNameLabel}
                  </label>
                  <input className="input-field" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t.dashboard.settingsPage.fullNamePlaceholder} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {t.dashboard.settingsPage.monthlySalaryLabel}
                  </label>
                  <input className="input-field" type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(Number(e.target.value))} placeholder={t.dashboard.settingsPage.monthlySalaryPlaceholder} />
                  <p style={{ fontSize: 10, color: "#52525B", marginTop: 5 }}>{t.dashboard.settingsPage.monthlySalaryHint}</p>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {t.dashboard.settingsPage.paydayLabel}
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    value={paydayDate || ""}
                    onChange={(e) => setPaydayDate(Math.max(0, Math.min(31, Number(e.target.value))))}
                    placeholder="Ex. 28 (1 à 31)"
                    min={1}
                    max={31}
                  />
                  <p style={{ fontSize: 10, color: "#52525B", marginTop: 5 }}>{t.dashboard.settingsPage.paydayHint}</p>
                </div>

                <div style={{ borderTop: "1px solid #27272A", paddingTop: 18 }}>
                  <p className="section-label" style={{ marginBottom: 12 }}>{isEn ? "Calculated Metrics" : "Informations calculées"}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div style={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 10, color: "#A1A1AA" }}>{t.dashboard.paydayCard.dailyBudgetLabel}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: isPaydayConfigured ? "#EF4444" : "#71717A" }}>
                        {isPaydayConfigured ? formatMoney(dailyBudget, selectedCurrency) : "--"}
                      </p>
                    </div>
                    <div style={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 10, color: "#A1A1AA" }}>{t.dashboard.paydayCard.daysRemainingLabel}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: isPaydayConfigured ? "#818cf8" : "#71717A" }}>
                        {isPaydayConfigured ? `${daysRemaining} ${isEn ? (daysRemaining > 1 ? "days" : "day") : (daysRemaining > 1 ? "jours" : "jour")}` : (isEn ? "Not set" : "Non défini")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Section Thème (Dark / Light) ── */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
                  <p className="section-label" style={{ marginBottom: 6 }}>{t.dashboard.settingsPage.themeLabel}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{t.dashboard.darkMode}</p>
                        </div>
                      </div>
                      {theme === "dark" && (
                        <span className="badge badge-success" style={{ fontSize: 9, padding: "2px 8px" }}>{isEn ? "Active" : "Actif"}</span>
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
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{t.dashboard.lightMode}</p>
                        </div>
                      </div>
                      {theme === "light" && (
                        <span className="badge badge-success" style={{ fontSize: 9, padding: "2px 8px" }}>{isEn ? "Active" : "Actif"}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Section Langue (Français / English) ── */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
                  <p className="section-label" style={{ marginBottom: 6 }}>
                    {t.dashboard.settingsPage.languageLabel}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-root)", border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 16 }}>💱</span>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="dashboard-currency-setting" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#A1A1AA", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {isEn ? "Currency" : "Devise"}
                        </label>
                        <select
                          id="dashboard-currency-setting"
                          value={selectedCurrency}
                          onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                          style={{ width: "100%", borderRadius: 10, background: "#09090B", border: "1px solid var(--border)", color: "#FAFAFA", padding: "8px 10px", fontSize: 12, fontWeight: 700, fontFamily: "inherit", outline: "none" }}
                        >
                          {Object.entries(CURRENCY_OPTIONS).map(([code, config]) => (
                            <option key={code} value={code} style={{ background: "#09090B" }}>
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLanguage("fr")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: language === "fr" ? "rgba(239,68,68,0.08)" : "var(--bg-root)",
                        border: language === "fr" ? "1.5px solid #EF4444" : "1px solid var(--border)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>🇫🇷</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Français</p>
                        </div>
                      </div>
                      {language === "fr" && (
                        <span className="badge badge-success" style={{ fontSize: 9, padding: "2px 8px" }}>{isEn ? "Active" : "Actif"}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: language === "en" ? "rgba(239,68,68,0.08)" : "var(--bg-root)",
                        border: language === "en" ? "1.5px solid #EF4444" : "1px solid var(--border)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>🇬🇧</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>English</p>
                        </div>
                      </div>
                      {language === "en" && (
                        <span className="badge badge-success" style={{ fontSize: 9, padding: "2px 8px" }}>{isEn ? "Active" : "Actif"}</span>
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
                    {t.dashboard.settingsPage.savedSuccess}
                  </div>
                )}

                {settingsError && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#FCA5A5",
                      fontWeight: 600,
                    }}
                    role="alert"
                  >
                    {settingsError}
                  </div>
                )}

                <button
                  className="btn-primary"
                  style={{ justifyContent: "center" }}
                  onClick={handleSaveSettings}
                >
                  <CheckCircle2 size={14} />
                  {t.dashboard.settingsPage.saveChangesBtn}
                </button>

                {/* ── Zone de Danger : Remise à zéro ── */}
                <div style={{ borderTop: "1px solid #27272A", paddingTop: 18, marginTop: 4 }}>
                  <p className="section-label" style={{ color: "#EF4444", marginBottom: 6 }}>{isEn ? "Reset Zone" : "Zone de Réinitialisation"}</p>
                  <p style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 12 }}>
                    {isEn ? "Clears all transactions, balances, goals and settings to start fresh." : "Efface toutes les transactions, soldes, objectifs et profil pour repartir totalement à zéro comme un nouvel utilisateur."}
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
                    {isEn ? "Reset all application data" : "Réinitialiser toutes les données (Remise à zéro)"}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* ════════════ TAB: GUIDE ════════════ */}
          {activeTab === "guide" && (
            <div className="p-3 sm:p-6 max-w-3xl w-full mx-auto space-y-5">

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
                    <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>{t.dashboard?.guidePage?.title || (isEn ? "User Guide" : "Guide d'utilisation")}</h2>
                    <p style={{ fontSize: 12, color: "#A1A1AA" }}>GestFiPro · {t.dashboard?.guidePage?.subtitle || (isEn ? "Complete Financial Management" : "Gestion financière de A à Z")}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.7 }}>
                  {((t.dashboard as any)?.guidePage?.description) || (isEn ? "Follow these 4 steps to configure your dashboard and track your finances in real time." : "Suivez ces 4 étapes pour configurer votre tableau de bord et commencer à suivre vos finances en temps réel.")}
                </p>
              </div>

              {/* Étapes */}
              {(isEn ? [
                {
                  step: "01",
                  icon: "🏦",
                  title: "Set up your manual accounts",
                  color: "#EF4444",
                  content: [
                    "Go to the **Accounts** tab via the sidebar.",
                    "GestFiPro supports 4 account types: **Cash**, **Wave**, **Orange Money**, and **Bank**.",
                    "For each account, enter your **current balance** as shown on your phone or statement.",
                    "The **consolidated** balance (sum of all accounts) is permanently displayed in the dashboard header.",
                    "You can update any balance anytime from Accounts → pencil icon.",
                  ],
                  tip: "💡 Tip: Start with your most used Mobile Money account to immediately reflect your everyday spending.",
                },
                {
                  step: "02",
                  icon: "💰",
                  title: "Set your net salary & pay cycle",
                  color: "#FAFAFA",
                  content: [
                    "Go to **Settings** (gear icon in the sidebar).",
                    `Enter your **monthly net salary** in ${currencySymbol} — the actual amount you receive.`,
                    "Set your **payday date** (e.g., 28th of every month).",
                    "GestFiPro automatically calculates the days remaining until your next paycheck.",
                    "These parameters calculate your **daily budget** = Balance ÷ Days remaining.",
                  ],
                  tip: "💡 If you are paid on the last business day, pick the 28th to give yourself a safety cushion.",
                },
                {
                  step: "03",
                  icon: "📅",
                  title: "Understand the \"Days until payday\" counter",
                  color: "#EF4444",
                  content: [
                    "The header **badge** displays the number of days until your next income.",
                    "The **Daily Budget** card shows how much you can spend per day without running out of money.",
                    `If the daily budget drops below **10,000 ${currencySymbol}**, the card turns red — time to be cautious.`,
                    "The **Cashflow** chart tracks your balance progression over the last 7 days.",
                    "The **Spending Pace** indicator compares today's spending to your recommended daily pace.",
                  ],
                  tip: "🎯 Goal: keep daily expenses strictly below your Daily Budget to finish the month stress-free.",
                },
                {
                  step: "04",
                  icon: "⚡",
                  title: "Record expenses and income",
                  color: "#DC2626",
                  content: [
                    "Click **Quick Add** (red button in header) or use the quick input at the bottom of the screen.",
                    "For each transaction, provide: **title**, **amount**, **category** (Food, Transport, etc.), and **debited account**.",
                    "Expenses immediately appear in the **Recent Transactions** feed on home.",
                    "Visit the **History** tab to see all your transactions filtered and sorted by date.",
                    "The **Statistics** tab visualizes category breakdowns to help you optimize habits.",
                  ],
                  tip: "⚡ Best practice: log each expense right away after paying — it only takes 10 seconds!",
                },
              ] : [
                {
                  step: "01",
                  icon: "🏦",
                  title: "Configurer vos comptes manuels",
                  color: "#EF4444",
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
                  color: "#FAFAFA",
                  content: [
                    "Allez dans **Réglages** (icône engrenage en bas de la sidebar).",
                    `Saisissez votre **salaire net mensuel** en ${currencySymbol} — celui que vous recevez réellement.`,
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
                    `Si ce budget journalier passe sous **10 000 ${currencySymbol}**, la carte vire au rouge — signe de vigilance.`,
                    "Le graphique **Cashflow** vous montre l'évolution de votre solde sur 7 jours.",
                    "L'indicateur de **Rythme de dépense** compare vos dépenses du jour au budget journalier recommandé.",
                  ],
                  tip: "🎯 Objectif : dépenser chaque jour strictement moins que votre Budget/Jour pour finir le mois sereinement.",
                },
                {
                  step: "04",
                  icon: "⚡",
                  title: "Saisir vos dépenses et revenus",
                  color: "#DC2626",
                  content: [
                    "Cliquez sur **Saisie rapide** (bouton rouge dans l'en-tête) ou sur le champ en bas de l'écran.",
                    "Pour chaque transaction, renseignez : **libellé**, **montant**, **catégorie** (Nourriture, Transport, etc.) et **compte débité**.",
                    "Les dépenses s'affichent instantanément dans la liste **Transactions récentes** sur l'accueil.",
                    "Consultez l'onglet **Historique** pour voir toutes vos transactions triées par date.",
                    "L'onglet **Statistiques** génère des graphiques de répartition par catégorie pour analyser vos habitudes.",
                  ],
                  tip: "⚡ Bonne pratique : saisissez chaque dépense immédiatement après l'avoir faite — 10 secondes suffisent !",
                },
              ]).map((item, idx) => (
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
                          {isEn ? `Step ${item.step}` : `Étape ${item.step}`}
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
                  {isEn ? "Go to Dashboard Home" : "Commencer avec le tableau de bord"}
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
                placeholder={t.dashboard?.home?.quickAddPlaceholder || (isEn ? "Quick entry: taxi 5000, groceries 3000..." : "Saisie rapide : taxi 5000, riz 3000...")}
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
                title={isEn ? "Voice input (coming soon)" : "Saisie vocale (bientôt disponible)"}
                onClick={() => alert(isEn ? "🎙️ Voice input will be available in an upcoming version of GestFiPro." : "🎙️ La saisie vocale sera disponible dans une prochaine version de GestFiPro.")}
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
                {isEn ? "Got it" : "Compris"}
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
                {isEn ? "Mark as read" : "Marquer comme lu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
