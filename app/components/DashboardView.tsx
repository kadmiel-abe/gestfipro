"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  Zap,
  Clock,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CheckCircle2,
  Search,
  Calendar as CalendarIcon,
  Filter,
  DollarSign,
  ArrowRight,
  Tag,
  AlertCircle,
} from "lucide-react";
import GoalsCard from "./dashboard/goals-card";
import MiniCalendar from "./MiniCalendar";
import { useToday } from "@/hooks/useToday";
import { isSameDay, getDateKey } from "@/lib/date-utils";
import { AccountIcon } from "./AccountIcon";
import { useLanguage, formatCurrencyValue } from "@/lib/i18n/LanguageContext";
import { Profile, Account, Transaction, Goal } from "@/lib/types";

interface DashboardViewProps {
  profile: Profile | null;
  accounts: Account[];
  transactions: Transaction[];
  goals?: Goal[];
  isLoading?: boolean;
  onOpenModal: () => void;
  onNavigate: (tab: string) => void;
  onQuickSubmit?: (e: React.FormEvent) => void;
  onAddTransaction?: (tx: any) => Promise<void> | void;
  quickInputText?: string;
  setQuickInputText?: (text: string) => void;
  todayExpenses?: number;
  totalBalance: number;
  currency?: string;
  userId?: string | null;
  onTransactionAdded?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Nourriture: "🍔",
  Transport: "🚕",
  Logement: "🏠",
  Loisirs: "🎉",
  Factures: "⚡",
  Santé: "💊",
  Autre: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  Nourriture: "#EF4444",
  Transport: "#F97316",
  Logement: "#3B82F6",
  Loisirs: "#EC4899",
  Factures: "#EAB308",
  Santé: "#10B981",
  Autre: "#8B5CF6",
};

export default function DashboardView({
  profile,
  accounts,
  transactions,
  goals = [],
  isLoading = false,
  onOpenModal,
  onNavigate,
  onAddTransaction,
  todayExpenses: propTodayExpenses,
  totalBalance: propTotalBalance,
  currency = "XOF",
  userId = null,
  onTransactionAdded,
}: DashboardViewProps) {
  const { t, isEn, language, currency: globalCurrency } = useLanguage();
  const displayCurrency = currency || globalCurrency || "XOF";
  const locale = language === "en" ? "en-US" : "fr-FR";
  const now = useToday();

  // ── 1. État Mode Discret (Eye / EyeOff) ────────────────────────────────────
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);

  // ── 2. État optimiste local pour mise à jour synchrone instantanée ──────────
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);

  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  // ── 3. États pour le formulaire de saisie rapide ───────────────────────────
  const [quickAmount, setQuickAmount] = useState<string>("");
  const [quickCategory, setQuickCategory] = useState<string>("Nourriture");
  const [quickAccount, setQuickAccount] = useState<string>(() => accounts[0]?.name || "Espèces");
  const [quickNote, setQuickNote] = useState<string>("");
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState<boolean>(false);

  useEffect(() => {
    if (accounts.length > 0 && !accounts.some((a) => a.name === quickAccount)) {
      setQuickAccount(accounts[0].name);
    }
  }, [accounts, quickAccount]);

  // ── 4. Filtres de transactions récentes ────────────────────────────────────
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [txSearch, setTxSearch] = useState<string>("");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);

  // ── 5. Calculs des KPIs et Cycle de paie ───────────────────────────────────
  const netSalary = profile?.net_salary ?? 0;
  const paydayWithMonth = profile?.payday_with_month ?? 25;
  const safePayday = paydayWithMonth > 0 && paydayWithMonth <= 31 ? paydayWithMonth : 25;

  const todayNum = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  let daysRemaining = safePayday - todayNum;
  if (daysRemaining <= 0) {
    daysRemaining += daysInMonth;
  }

  // Solde total consolidé (à partir des comptes locaux pour réactivité instantanée)
  const currentTotalBalance = useMemo(() => {
    if (localAccounts.length > 0) {
      return localAccounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    }
    return propTotalBalance;
  }, [localAccounts, propTotalBalance]);

  // Budget restant par jour = Solde Total Disponible / Jours restants avant paie
  const dailyBudget = useMemo(() => {
    if (daysRemaining <= 0) return currentTotalBalance;
    return Math.max(0, Math.round(currentTotalBalance / daysRemaining));
  }, [currentTotalBalance, daysRemaining]);

  // Dépenses aujourd'hui
  const calculatedTodayExpenses = useMemo(() => {
    return localTransactions
      .filter((t) => {
        const d = t.transaction_date || t.created_at;
        if (d && isSameDay(d, now)) {
          return t.type === "expense" || (t.amount !== undefined && t.amount < 0);
        }
        return Boolean(t.date && (t.date.startsWith("Auj") || t.date.toLowerCase().includes("instant")));
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [localTransactions, now]);

  const todayExpenseTotal = propTodayExpenses ?? calculatedTodayExpenses;

  // Progression du budget consommé aujourd'hui (% du budget/j)
  const todayBudgetPercent = useMemo(() => {
    if (dailyBudget <= 0) return todayExpenseTotal > 0 ? 100 : 0;
    return Math.min(100, Math.round((todayExpenseTotal / dailyBudget) * 100));
  }, [dailyBudget, todayExpenseTotal]);

  // Mini-résumé Entrées / Sorties du mois courant
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let inc = 0;
    let exp = 0;
    for (const t of localTransactions) {
      const dStr = t.transaction_date || t.created_at || "";
      const key = dStr.split("T")[0] || "";
      if (!key.startsWith(monthPrefix)) continue;
      if (t.type === "income" || (t.amount > 0 && t.type !== "expense")) {
        inc += Math.abs(t.amount);
      } else {
        exp += Math.abs(t.amount);
      }
    }
    return { monthlyIncome: inc, monthlyExpense: exp };
  }, [localTransactions, now]);

  // Formatage sécurisé avec mode discret
  const formatAmount = (val: number, isPositive = false) => {
    if (hideAmounts) return "••••••";
    const formatted = formatCurrencyValue(Math.abs(val), displayCurrency as any, locale, true);
    if (isPositive) return `+${formatted}`;
    return formatted;
  };

  // Date du jour exacte en français (ex: "Lundi 12 Octobre 2026")
  const formattedFullDate = useMemo(() => {
    const raw = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
    // Première lettre de chaque mot capitalisée
    return raw
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [now]);

  // Salutation dynamique
  const rawName = profile?.full_name?.trim() || "";
  const firstName = rawName.split(" ")[0] || "";
  const hour = now.getHours();
  const greetingPrefix = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const displayGreeting = firstName && !["utilisateur", "user"].includes(firstName.toLowerCase())
    ? `${greetingPrefix} ${firstName} 👋`
    : `${greetingPrefix} 👋`;

  // ── 6. Soumission Manuelle Rapide (Zéro friction, sans vocal/IA) ─────────────
  const handleManualQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(quickAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (localAccounts.length === 0) {
      alert("Veuillez d'abord créer un compte financier dans l'onglet Comptes.");
      onNavigate("comptes");
      return;
    }

    const targetAccountName = quickAccount || localAccounts[0].name;
    const targetCategory = quickCategory || "Nourriture";
    const noteText = quickNote.trim();

    setIsSubmittingQuick(true);

    const newTx: Transaction = {
      id: `temp-${Date.now()}`,
      title: noteText || targetCategory,
      category: targetCategory,
      amount: -Math.abs(amountNum),
      type: "expense",
      date: "À l'instant",
      account: targetAccountName,
      transaction_date: now.toISOString(),
      created_at: now.toISOString(),
      icon: CATEGORY_ICONS[targetCategory] || "⚡",
    };

    // 1. Décrémenter immédiatement le solde du compte et mettre à jour l'historique local
    setLocalAccounts((prev) =>
      prev.map((acc) =>
        acc.name === targetAccountName
          ? { ...acc, balance: (Number(acc.balance) || 0) - amountNum }
          : acc
      )
    );
    setLocalTransactions((prev) => [newTx, ...prev]);

    // 2. Persister via le callback parent
    try {
      if (onAddTransaction) {
        await onAddTransaction({
          label: noteText || targetCategory,
          category: targetCategory,
          amount: -Math.abs(amountNum),
          type: "expense",
          date: "À l'instant",
          account: targetAccountName,
          icon: CATEGORY_ICONS[targetCategory] || "⚡",
          note: noteText,
        });
      }
      setQuickAmount("");
      setQuickNote("");
      setQuickSuccess(`Dépense de ${formatCurrencyValue(amountNum, displayCurrency as any, locale, true)} enregistrée !`);
      setTimeout(() => setQuickSuccess(null), 3000);
      onTransactionAdded?.();
    } catch (err) {
      console.error("Erreur ajout dépense rapide:", err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // ── 7. Répartition des dépenses par catégorie (Mois en cours) ───────────────
  const categoryBreakdown = useMemo(() => {
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const map = new Map<string, number>();

    for (const t of localTransactions) {
      const dStr = t.transaction_date || t.created_at || "";
      const key = dStr.split("T")[0] || "";
      if (!key.startsWith(currentMonthPrefix)) continue;
      if (t.type === "expense" || (t.amount !== undefined && t.amount < 0)) {
        const cat = t.category || "Autre";
        const amt = Math.abs(t.amount);
        map.set(cat, (map.get(cat) || 0) + amt);
      }
    }

    const totalExp = Array.from(map.values()).reduce((a, b) => a + b, 0);
    const list = Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
        color: CATEGORY_COLORS[name] || "#EF4444",
        icon: CATEGORY_ICONS[name] || "📦",
      }))
      .sort((a, b) => b.amount - a.amount);

    return { list, totalExp };
  }, [localTransactions, now]);

  // ── 8. Transactions filtrées pour la colonne gauche ────────────────────────
  const filteredTransactions = useMemo(() => {
    return localTransactions.filter((tx) => {
      // Filtre Type
      const isExpense = tx.type === "expense" || (tx.amount !== undefined && tx.amount < 0);
      if (txTypeFilter === "expense" && !isExpense) return false;
      if (txTypeFilter === "income" && isExpense) return false;

      // Filtre Compte sélectionné
      if (selectedAccountFilter && tx.account !== selectedAccountFilter) return false;

      // Filtre Recherche
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase();
        const matchTitle = (tx.title || (tx as any).label || "").toLowerCase().includes(q);
        const matchCat = (tx.category || "").toLowerCase().includes(q);
        const matchAcc = (tx.account || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchAcc) return false;
      }

      return true;
    });
  }, [localTransactions, txTypeFilter, selectedAccountFilter, txSearch]);

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-5 px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden text-[#FAFAFA]">
      {/* ══════════════════════════════════════════════════════════════════════════
          1. HEADER DYNAMIQUE
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#27272A]/50">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
              {displayGreeting}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] -ml-3" />
              En direct
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA]">
            {formattedFullDate} · Suivi budgétaire interactif
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start md:self-auto flex-wrap">
          {/* Bouton Masquer / Afficher les montants sensibles */}
          <button
            type="button"
            onClick={() => setHideAmounts((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all text-xs font-semibold cursor-pointer shadow-sm"
            title={hideAmounts ? "Afficher les montants" : "Masquer les montants (mode discret en public)"}
            aria-label={hideAmounts ? "Afficher les montants" : "Masquer les montants"}
          >
            {hideAmounts ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="text-[#EF4444]">Montants masqués</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>Mode discret</span>
              </>
            )}
          </button>

          {/* Bouton Ajouter Transaction Modal */}
          <button
            type="button"
            onClick={onOpenModal}
            className="btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#EF4444]/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t.dashboard.addTransaction}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          2. BENTO GRID SUPÉRIEURE (4 KPIS TEMPS RÉEL)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* CARTE 1 (Mise en avant avec halo #EF4444) : Budget Restant / Jour */}
        <div className="bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-[#EF4444]/50 shadow-lg shadow-[#EF4444]/10 bg-gradient-to-br from-[#EF4444]/15 via-[#18181B] to-[#18181B] flex flex-col justify-between transition-all hover:border-[#EF4444]/80">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#EF4444] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#EF4444]" />
                Budget Restant / Jour
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                Rythme
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tabular-nums tracking-tight">
                {formatAmount(dailyBudget)}
              </span>
              {!hideAmounts && (
                <span className="text-xs font-bold text-[#A1A1AA]">
                  {displayCurrency === "XOF" || displayCurrency === "XAF" ? "FCFA / j" : "/ j"}
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#A1A1AA] mt-1">
              Solde ({formatAmount(currentTotalBalance)}) ÷ {daysRemaining} jours restants
            </p>
          </div>

          {/* Barre de progression budget consommé aujourd'hui */}
          <div className="mt-4 pt-3 border-t border-[#27272A]/80">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
              <span className="text-[#A1A1AA]">Consommé aujourd'hui</span>
              <span className={todayBudgetPercent > 90 ? "text-[#EF4444] font-bold" : "text-[#FAFAFA]"}>
                {todayBudgetPercent}% ({formatAmount(todayExpenseTotal)})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#27272A] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  todayBudgetPercent > 100
                    ? "bg-[#EF4444]"
                    : todayBudgetPercent > 75
                    ? "bg-gradient-to-r from-[#F97316] to-[#EF4444]"
                    : "bg-gradient-to-r from-[#22c55e] to-[#3B82F6]"
                }`}
                style={{ width: `${Math.min(100, Math.max(3, todayBudgetPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* CARTE 2 : Prochaine Paie */}
        <div className="bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-[#27272A] shadow-md flex flex-col justify-between hover:border-[#3F3F46] transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#A1A1AA]" />
                Prochaine Paie
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#27272A] text-[#FAFAFA]">
                Le {safePayday}
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tabular-nums tracking-tight">
                J-{daysRemaining}
              </span>
              <span className="text-xs font-semibold text-[#A1A1AA]">
                avant le {safePayday}
              </span>
            </div>

            <p className="text-[11px] text-[#A1A1AA] mt-1">
              Salaire net déclaré : <strong className="text-[#FAFAFA] font-bold">{formatAmount(netSalary)}</strong>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#27272A]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#71717A]">Statut du cycle :</span>
              <span className="text-[#22c55e] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#22c55e]" /> Cycle actif
              </span>
            </div>
          </div>
        </div>

        {/* CARTE 3 : Dépenses Aujourd'hui + Résumé Entrées/Sorties */}
        <div className="bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-[#27272A] shadow-md flex flex-col justify-between hover:border-[#3F3F46] transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />
                Dépenses Aujourd'hui
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EF4444]/10 text-[#EF4444]">
                Journalier
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tabular-nums tracking-tight">
                {formatAmount(todayExpenseTotal)}
              </span>
            </div>

            <p className="text-[11px] text-[#71717A] mt-1">
              Total débité aujourd'hui
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#27272A] grid grid-cols-2 gap-2 text-[10px] font-semibold">
            <div className="bg-[#09090B]/60 p-1.5 rounded-lg border border-[#27272A]">
              <div className="flex items-center gap-1 text-[#22c55e]">
                <ArrowUpRight className="w-3 h-3" /> Entrées mois
              </div>
              <p className="text-xs font-bold text-[#FAFAFA] mt-0.5 tabular-nums">
                {formatAmount(monthlyIncome, true)}
              </p>
            </div>
            <div className="bg-[#09090B]/60 p-1.5 rounded-lg border border-[#27272A]">
              <div className="flex items-center gap-1 text-[#EF4444]">
                <ArrowDownRight className="w-3 h-3" /> Sorties mois
              </div>
              <p className="text-xs font-bold text-[#FAFAFA] mt-0.5 tabular-nums">
                -{formatAmount(monthlyExpense)}
              </p>
            </div>
          </div>
        </div>

        {/* CARTE 4 : Solde Total Agrégé */}
        <div className="bg-[#18181B] rounded-2xl p-4 sm:p-5 border border-[#27272A] shadow-md flex flex-col justify-between hover:border-[#3F3F46] transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#A1A1AA]" />
                Solde Total Agrégé
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#27272A] text-[#FAFAFA]">
                Consolidé
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tabular-nums tracking-tight">
                {formatAmount(currentTotalBalance)}
              </span>
            </div>

            <p className="text-[11px] text-[#A1A1AA] mt-1">
              {localAccounts.length} compte{localAccounts.length > 1 ? "s" : ""} actif{localAccounts.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between">
            <span className="text-[11px] text-[#71717A]">Trésorerie globale</span>
            <button
              type="button"
              onClick={() => onNavigate("comptes")}
              className="text-[11px] text-[#EF4444] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Gérer <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          3. BARRE DE SAISIE RAPIDE MANUELLE (AU CENTRE, ZÉRO FRICTION, SCOPE MVP)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-[#FAFAFA]">
              Saisie Rapide de Dépense
            </h2>
            <span className="text-[11px] text-[#71717A] hidden sm:inline">
              · Zéro friction, décrémentation immédiate
            </span>
          </div>

          {quickSuccess && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{quickSuccess}</span>
            </div>
          )}
        </div>

        <form
          onSubmit={handleManualQuickSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 items-center"
        >
          {/* 1. Montant (FCFA) - 3 cols */}
          <div className="lg:col-span-3 relative">
            <input
              type="number"
              min="1"
              step="any"
              required
              placeholder="Montant (FCFA)..."
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              className="input-field text-xs sm:text-sm w-full font-bold tabular-nums pl-8 bg-[#09090B] border-[#27272A] focus:border-[#EF4444] rounded-xl py-2.5"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#A1A1AA] font-bold">
              {displayCurrency === "XOF" || displayCurrency === "XAF" ? "F" : "$"}
            </span>
          </div>

          {/* 2. Sélecteur Catégorie - 3 cols */}
          <div className="lg:col-span-3">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="input-field text-xs sm:text-sm w-full bg-[#09090B] border-[#27272A] font-semibold text-[#FAFAFA] cursor-pointer rounded-xl py-2.5"
            >
              <option value="Nourriture">🍔 Nourriture</option>
              <option value="Transport">🚕 Transport</option>
              <option value="Logement">🏠 Logement</option>
              <option value="Loisirs">🎉 Loisirs</option>
              <option value="Factures">⚡ Factures</option>
              <option value="Santé">💊 Santé</option>
              <option value="Autre">📦 Autre</option>
            </select>
          </div>

          {/* 3. Sélecteur Compte - 3 cols */}
          <div className="lg:col-span-3">
            <select
              value={quickAccount}
              onChange={(e) => setQuickAccount(e.target.value)}
              className="input-field text-xs sm:text-sm w-full bg-[#09090B] border-[#27272A] font-semibold text-[#FAFAFA] cursor-pointer rounded-xl py-2.5"
            >
              {localAccounts.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({formatAmount(a.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Note optionnelle - 2 cols */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Note (ex: Déjeuner)..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="input-field text-xs sm:text-sm w-full bg-[#09090B] border-[#27272A] focus:border-[#EF4444] rounded-xl py-2.5"
            />
          </div>

          {/* 5. Bouton CTA Ajouter - 1 col */}
          <div className="lg:col-span-1">
            <button
              type="submit"
              disabled={isSubmittingQuick}
              className="btn-primary w-full py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#EF4444]/25 rounded-xl disabled:opacity-50"
              title="Ajouter la dépense immédiatement"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="lg:hidden">Ajouter</span>
            </button>
          </div>
        </form>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          4. GRILLE PRINCIPALE (2 COLONNES SUR DESKTOP : 8 COLS / 4 COLS)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* ─────────────────────────────────────────────────────────────────────
            COLONNE GAUCHE (8 COLONNES) : RÉPARTITION & TRANSACTIONS
        ───────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* a) Graphique de répartition des dépenses par catégorie */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#FAFAFA] flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#EF4444]" />
                  Répartition des Dépenses par Catégorie
                </h3>
                <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                  Analyse des dépenses du mois en cours
                </p>
              </div>
              <span className="text-xs font-bold text-[#A1A1AA] bg-[#27272A] px-2.5 py-1 rounded-lg">
                Total : {formatAmount(categoryBreakdown.totalExp)}
              </span>
            </div>

            {categoryBreakdown.list.length === 0 ? (
              <div className="py-8 text-center text-[#71717A] text-xs">
                Aucune dépense enregistrée ce mois-ci.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.list.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.icon}</span>
                        <span className="font-semibold text-[#FAFAFA]">{item.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#27272A] text-[#A1A1AA]">
                          {item.percentage}%
                        </span>
                      </div>
                      <span className="font-bold text-[#FAFAFA] tabular-nums">
                        {formatAmount(item.amount)}
                      </span>
                    </div>

                    {/* Barre horizontale de progression */}
                    <div className="w-full h-2 rounded-full bg-[#27272A] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* b) Liste des Transactions Récentes avec filtre et recherche */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#FAFAFA] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#EF4444]" />
                  Transactions Récentes
                </h3>
                <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                  Historique instantané de vos mouvements financiers
                </p>
              </div>

              {/* Filtres Type pills */}
              <div className="flex items-center gap-1.5 bg-[#09090B] p-1 rounded-xl border border-[#27272A] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    txTypeFilter === "all"
                      ? "bg-[#EF4444] text-white shadow-sm"
                      : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                  }`}
                >
                  Tout
                </button>
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("expense")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    txTypeFilter === "expense"
                      ? "bg-[#EF4444] text-white shadow-sm"
                      : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                  }`}
                >
                  Dépenses
                </button>
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("income")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    txTypeFilter === "income"
                      ? "bg-[#22c55e] text-white shadow-sm"
                      : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                  }`}
                >
                  Entrées
                </button>
              </div>
            </div>

            {/* Barre de recherche + badge filtre compte */}
            <div className="flex items-center gap-2 mb-3.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, catégorie ou compte..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="input-field text-xs w-full pl-9 py-2 bg-[#09090B] border-[#27272A] rounded-xl"
                />
              </div>

              {selectedAccountFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedAccountFilter(null)}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center gap-1.5 cursor-pointer hover:bg-[#EF4444]/25 shrink-0"
                  title="Réinitialiser le filtre par compte"
                >
                  <span>Compte : {selectedAccountFilter}</span>
                  <span className="font-bold">✕</span>
                </button>
              )}
            </div>

            {/* Liste */}
            {filteredTransactions.length === 0 ? (
              <div className="py-10 text-center text-[#71717A] text-xs flex flex-col items-center justify-center gap-2">
                <Clock className="w-7 h-7 text-[#3F3F46]" />
                <p className="font-semibold text-[#A1A1AA]">Aucune transaction correspondante.</p>
                <p className="text-[11px]">Enregistrez votre première dépense via la barre ci-dessus.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.slice(0, 8).map((tx) => {
                  const isExpense = tx.type === "expense" || (tx.amount !== undefined && tx.amount < 0);
                  const absAmount = Math.abs(tx.amount);
                  const title = tx.title || (tx as any).label || tx.category || "Dépense";
                  const dateStr = tx.date || (tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString("fr-FR") : "Aujourd'hui");

                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-[#09090B]/60 border border-[#27272A] hover:border-[#3F3F46] transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icône du compte associé */}
                        <AccountIcon name={tx.account} size={34} radius={8} />

                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#FAFAFA] truncate">
                            {title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#A1A1AA] mt-0.5">
                            <span>{tx.category || "Divers"}</span>
                            <span>·</span>
                            <span className="text-[#71717A]">{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs sm:text-sm font-extrabold tabular-nums ${
                            isExpense ? "text-[#FAFAFA]" : "text-[#22c55e]"
                          }`}
                        >
                          {hideAmounts ? "••••••" : isExpense ? `-${formatAmount(absAmount)}` : `+${formatAmount(absAmount)}`}
                        </p>
                        <span className="text-[10px] text-[#71717A] font-medium block mt-0.5">
                          {tx.account}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pied de liste : lien vers tout l'historique */}
            <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between">
              <span className="text-xs text-[#71717A]">
                Affichage de {Math.min(8, filteredTransactions.length)} sur {localTransactions.length} transaction{localTransactions.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => onNavigate("historique")}
                className="text-xs text-[#EF4444] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Voir tout l'historique <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            COLONNE DROITE (4 COLONNES) : COMPTES & CALENDRIER DU CYCLE
        ───────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          {/* a) Panneau "Mes Comptes" */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#EF4444]" />
                <h3 className="text-sm font-bold text-[#FAFAFA]">Mes Comptes</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("comptes")}
                className="text-xs text-[#EF4444] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Gérer <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-[#71717A] mb-3">
              Cliquez sur un compte pour filtrer l'historique instantanément :
            </p>

            {localAccounts.length === 0 ? (
              <div className="p-4 text-center text-[#71717A] text-xs border border-dashed border-[#27272A] rounded-xl">
                Aucun compte configuré.
                <button
                  type="button"
                  onClick={() => onNavigate("comptes")}
                  className="block mx-auto mt-2 text-[#EF4444] font-bold underline"
                >
                  Ajouter un compte
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {localAccounts.map((acc) => {
                  const isFiltered = selectedAccountFilter === acc.name;
                  return (
                    <div
                      key={acc.id}
                      onClick={() =>
                        setSelectedAccountFilter((prev) => (prev === acc.name ? null : acc.name))
                      }
                      className={`p-3 rounded-xl bg-[#09090B]/60 border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isFiltered
                          ? "border-[#EF4444] bg-[#EF4444]/10 shadow-md shadow-[#EF4444]/10"
                          : "border-[#27272A] hover:border-[#3F3F46]"
                      }`}
                      title={`Filtrer par ${acc.name}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AccountIcon name={acc.name} type={acc.type} size={36} radius={9} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#FAFAFA] truncate">
                            {acc.name}
                          </p>
                          <p className="text-[10px] text-[#71717A]">{acc.type}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-[#FAFAFA] tabular-nums">
                          {formatAmount(acc.balance)}
                        </p>
                        {isFiltered && (
                          <span className="text-[9px] font-bold text-[#EF4444] block">
                            Filtre actif ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate("comptes")}
              className="mt-3.5 w-full py-2 px-3 rounded-xl border border-[#27272A] bg-[#09090B] hover:bg-[#27272A]/50 text-xs font-bold text-[#A1A1AA] hover:text-[#FAFAFA] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau compte</span>
            </button>
          </div>

          {/* b) Composant Calendrier du cycle de paie */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#EF4444]" />
                Calendrier du Cycle
              </h3>
              <span className="text-[10px] font-bold bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] px-2 py-0.5 rounded">
                Paie : le {safePayday}
              </span>
            </div>

            <MiniCalendar
              paydayDate={safePayday}
              transactions={localTransactions}
            />

            {/* Légende du calendrier */}
            <div className="mt-3 pt-3 border-t border-[#27272A] flex items-center justify-between text-[10px] text-[#71717A]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-[#EF4444]" />
                <span>Aujourd'hui</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-white/20 border border-white/40" />
                <span>Paie</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span>Dépense</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          5. SECTION OBJECTIFS D'ÉPARGNE
      ══════════════════════════════════════════════════════════════════════════ */}
      <div>
        <GoalsCard
          goals={goals}
          userId={userId}
          onGoalChanged={onTransactionAdded}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
