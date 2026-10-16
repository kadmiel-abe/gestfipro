"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Repeat,
  Search,
  X,
  FileText,
  FileDown,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RecurringExpensesManager from "@/app/components/RecurringExpensesManager";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types & Mock Transactions ────────────────────────────────────────────────
interface TransactionItem {
  id: string | number;
  label: string;
  category: string;
  amount: number;
  type: "expense" | "income";
  date: string;
  account: string;
  icon: string;
}

const DEFAULT_MOCK_TRANSACTIONS: TransactionItem[] = [
  {
    id: "tx-1",
    label: "Courses Alimentation",
    category: "Nourriture",
    amount: -18500,
    type: "expense",
    date: "14 Oct 2026",
    account: "Wave",
    icon: "🍔",
  },
  {
    id: "tx-2",
    label: "Carburant Station Total",
    category: "Transport",
    amount: -15000,
    type: "expense",
    date: "12 Oct 2026",
    account: "Espèces",
    icon: "🚕",
  },
  {
    id: "tx-3",
    label: "Virement Salaire Mensuel",
    category: "Revenu",
    amount: 450000,
    type: "income",
    date: "10 Oct 2026",
    account: "Banque",
    icon: "💼",
  },
  {
    id: "tx-4",
    label: "Facture CIE Électricité",
    category: "Factures",
    amount: -22500,
    type: "expense",
    date: "08 Oct 2026",
    account: "Orange Money",
    icon: "⚡",
  },
  {
    id: "tx-5",
    label: "Pharmacie Centrale",
    category: "Santé",
    amount: -9400,
    type: "expense",
    date: "05 Oct 2026",
    account: "Wave",
    icon: "💊",
  },
];

export default function HistoriquePage() {
  const { currency, formatCurrency } = useCurrency();
  const { isEn } = useLanguage();

  const [transactions] = useState<TransactionItem[]>(DEFAULT_MOCK_TRANSACTIONS);
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | "expense" | "income">("all");

  // Filtrage dynamique des transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filtre Type
      if (historyTypeFilter === "expense" && tx.type !== "expense") return false;
      if (historyTypeFilter === "income" && tx.type !== "income") return false;

      // Filtre Recherche
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchLabel = tx.label.toLowerCase().includes(q);
        const matchCat = tx.category.toLowerCase().includes(q);
        const matchAcc = tx.account.toLowerCase().includes(q);
        if (!matchLabel && !matchCat && !matchAcc) return false;
      }

      return true;
    });
  }, [transactions, historyTypeFilter, historySearch]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Aucune transaction à exporter.");
      return;
    }

    const headers = ["Date", "Description", "Catégorie", "Compte", `Montant (${currency})`, "Type"];
    const rows = filteredTransactions.map((tx) => [
      `"${tx.date}"`,
      `"${tx.label.replace(/"/g, '""')}"`,
      `"${tx.category}"`,
      `"${tx.account}"`,
      `"${tx.type === "income" ? "+" : "-"}${Math.abs(tx.amount)}"`,
      `"${tx.type === "income" ? "Revenu" : "Dépense"}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "gestfipro_historique.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      alert("Aucune transaction à exporter.");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.text("Relevé des transactions GestFiPro", 14, 15);

      const tableRows = filteredTransactions.map((tx) => [
        tx.date,
        tx.label,
        tx.category,
        `${tx.type === "income" ? "+" : "-"}${formatCurrency(Math.abs(tx.amount), currency, true)}`,
      ]);

      autoTable(doc, {
        head: [["Date", "Description", "Catégorie", "Montant"]],
        body: tableRows,
        startY: 22,
      });

      doc.save("gestfipro_historique.pdf");
    } catch (err) {
      console.error("[Export PDF Error]", err);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Lien de retour au Dashboard ── */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard?tab=historique"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au Dashboard</span>
          </Link>
          <span className="text-xs text-[#71717A]">GestFiPro V2</span>
        </div>

        {/* ── En-tête de la page ── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tracking-tight">
            Historique & Dépenses récurrentes
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Consultez le relevé détaillé de vos transactions ou gérez vos charges récurrentes.
          </p>
        </div>

        {/* ── Composant Tabs de Shadcn UI (Strict Dark Mode) ── */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="bg-[#18181B] border border-[#27272A] p-1 mb-6">
            <TabsTrigger value="transactions" className="gap-2">
              <Clock className="w-4 h-4 text-[#EF4444]" />
              <span>Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="recurrences" className="gap-2">
              <Repeat className="w-4 h-4 text-[#EF4444]" />
              <span>Récurrences</span>
            </TabsTrigger>
          </TabsList>

          {/* ════════════ 1. Onglet "Transactions" ════════════ */}
          <TabsContent value="transactions">
            <div className="rounded-2xl bg-[#18181B] border border-[#27272A] p-5 sm:p-6 shadow-xl shadow-black/40">
              {/* Barre de recherche */}
              <div className="flex items-center gap-2.5 bg-[#09090B] border border-[#27272A] rounded-xl px-3.5 py-2.5 mb-4">
                <Search className="w-4 h-4 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Rechercher une transaction (libellé, catégorie, compte)…"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none"
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch("")}
                    className="text-[#71717A] hover:text-[#FAFAFA]"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtres et Exports */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                {/* Filtres par type */}
                <div className="flex items-center gap-1.5 bg-[#09090B] p-1 rounded-xl border border-[#27272A]">
                  {(
                    [
                      { key: "all", label: "Tout" },
                      { key: "expense", label: "Dépenses" },
                      { key: "income", label: "Revenus" },
                    ] as const
                  ).map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setHistoryTypeFilter(filter.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        historyTypeFilter === filter.key
                          ? "bg-[#27272A] text-[#FAFAFA]"
                          : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Boutons Export CSV & PDF */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-[#EF4444] text-[#A1A1AA] hover:text-[#FAFAFA] text-xs font-semibold transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-[#EF4444] text-[#A1A1AA] hover:text-[#FAFAFA] text-xs font-semibold transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Liste des transactions */}
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#27272A] bg-[#09090B]/30">
                  <Clock className="w-8 h-8 text-[#52525B] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-[#FAFAFA]">Aucune transaction trouvée</p>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    Essayez de modifier votre recherche ou le filtre sélectionné.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === "income";
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#09090B]/60 border border-[#27272A] hover:border-[#3F3F46] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                              isIncome ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#EF4444]/10 border border-[#EF4444]/20"
                            }`}
                          >
                            {tx.icon}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-[#FAFAFA]">{tx.label}</p>
                            <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                              {tx.date} · <span className="text-[#FAFAFA] font-medium">{tx.account}</span> · {tx.category}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-xs sm:text-sm font-black tabular-nums ${
                            isIncome ? "text-emerald-400" : "text-[#FAFAFA]"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(Math.abs(tx.amount), currency, true)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ════════════ 2. Onglet "Récurrences" ════════════ */}
          <TabsContent value="recurrences">
            <RecurringExpensesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
