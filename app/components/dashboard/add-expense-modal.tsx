"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Wallet,
  Tag,
  CalendarDays,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Account } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AddExpenseModalProps {
  /** Contrôle l'ouverture de la modal */
  isOpen: boolean;
  /** Ferme la modal */
  onClose: () => void;
  /** Liste des comptes utilisateur */
  accounts: Account[];
  /** ID de l'utilisateur courant (Supabase auth) */
  userId: string | null;
  /** Callback après insertion réussie — permet au parent de rafraîchir son state */
  onTransactionAdded?: (transaction: {
    id: string;
    title: string;
    category: string;
    amount: number;
    type: "expense" | "income";
    transaction_date: string;
    account_id: string | null;
    account_name: string;
    note: string;
  }) => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

// ─── Composant AddExpenseModal ───────────────────────────────────────────────

export default function AddExpenseModal({
  isOpen,
  onClose,
  accounts,
  userId,
  onTransactionAdded,
}: AddExpenseModalProps) {
  const supabase = createClient();
  const { t, isEn } = useLanguage();

  const categoriesList = [
    { key: "food", label: t.dashboard.transactionModal.categories.food, emoji: "🍽️" },
    { key: "transport", label: t.dashboard.transactionModal.categories.transport, emoji: "🚕" },
    { key: "housing", label: t.dashboard.transactionModal.categories.housing, emoji: "🏠" },
    { key: "utilities", label: t.dashboard.transactionModal.categories.utilities, emoji: "📄" },
    { key: "leisure", label: t.dashboard.transactionModal.categories.leisure, emoji: "🎮" },
    { key: "health", label: t.dashboard.transactionModal.categories.health, emoji: "💊" },
    { key: "education", label: t.dashboard.transactionModal.categories.education, emoji: "📚" },
    { key: "shopping", label: t.dashboard.transactionModal.categories.shopping, emoji: "👕" },
    { key: "other", label: t.dashboard.transactionModal.categories.other, emoji: "📦" },
  ];

  // ── Form state ──
  const [type, setType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categoriesList[0].label);
  const [accountId, setAccountId] = useState<string>("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser le compte sélectionné quand les comptes changent
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(String(accounts[0].id));
    }
  }, [accounts, accountId]);

  // Reset le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setType("expense");
      setTitle("");
      setAmount("");
      setCategory(categoriesList[0].label);
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
      setError(null);
      setSuccess(false);
      if (accounts.length > 0) {
        setAccountId(String(accounts[0].id));
      }
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => String(a.id) === accountId);

  // ── Soumission avec insertion Supabase ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const parsedAmount = Number(amount);
    if (!title.trim()) {
      setError(isEn ? "Please enter a description." : "Veuillez saisir un libellé.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError(isEn ? "Please enter a valid amount." : "Veuillez saisir un montant valide.");
      return;
    }
    if (!accountId) {
      setError(isEn ? "Please select an account." : "Veuillez sélectionner un compte (ou créer un premier compte dans l'onglet Comptes).");
      return;
    }

    setLoading(true);

    try {
      const isUuid =
        typeof accountId === "string" && accountId.length > 10;
      const txDate = date
        ? new Date(date).toISOString()
        : new Date().toISOString();

      // 1. Insérer la transaction dans Supabase
      if (userId) {
        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            account_id: isUuid ? accountId : null,
            title: title.trim(),
            category,
            amount: parsedAmount,
            type,
            transaction_date: txDate,
            note: note.trim() || null,
          })
          .select()
          .single();

        if (txError) {
          console.error("Erreur insertion transaction :", txError);
          setError(
            txError.message || (isEn ? "Failed to save transaction." : "Impossible d'enregistrer la transaction.")
          );
          setLoading(false);
          return;
        }

        // 2. Mettre à jour le solde du compte
        if (isUuid && selectedAccount) {
          const balanceDelta =
            type === "expense" ? -parsedAmount : parsedAmount;
          const newBalance = (selectedAccount.balance || 0) + balanceDelta;

          const { error: accError } = await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", accountId);

          if (accError) {
            console.error("Erreur mise à jour solde :", accError);
          }
        }

        // 3. Notifier le parent
        if (onTransactionAdded && txData) {
          onTransactionAdded({
            id: txData.id,
            title: txData.title,
            category: txData.category,
            amount: txData.amount,
            type: txData.type,
            transaction_date: txData.transaction_date,
            account_id: txData.account_id,
            account_name: selectedAccount?.name || (isEn ? "Account" : "Compte"),
            note: txData.note || "",
          });
        }
      } else {
        // Mode hors-ligne : callback direct sans Supabase
        if (onTransactionAdded) {
          onTransactionAdded({
            id: String(Date.now()),
            title: title.trim(),
            category,
            amount: parsedAmount,
            type,
            transaction_date: txDate,
            account_id: isUuid ? accountId : null,
            account_name: selectedAccount?.name || (isEn ? "Account" : "Compte"),
            note: note.trim(),
          });
        }
      }

      // Succès !
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err?.message || (isEn ? "An unexpected error occurred." : "Une erreur inattendue est survenue."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(6px)",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#18181B",
          border: "1px solid #27272A",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
          position: "relative",
          animation: "fadeInUp 0.25s ease-out",
        }}
      >
        {/* Ligne lumineuse accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #EF4444, transparent)",
          }}
        />

        {/* ── Header ── */}
        <div
          style={{
            padding: "20px 24px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#FAFAFA",
                letterSpacing: "-0.02em",
              }}
            >
              {type === "expense"
                ? t.dashboard.transactionModal.titleExpense
                : t.dashboard.transactionModal.titleIncome}
            </h3>
            <p style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>
              {isEn ? "Log an expense or income entry" : "Enregistrez une dépense ou un revenu"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#09090B",
              border: "1px solid #27272A",
              borderRadius: 10,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#A1A1AA",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#EF4444";
              e.currentTarget.style.color = "#FAFAFA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#27272A";
              e.currentTarget.style.color = "#A1A1AA";
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ padding: "18px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* ── Toggle Dépense / Revenu ── */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setType("expense")}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 10,
                border:
                  type === "expense"
                    ? "1px solid rgba(239,68,68,0.5)"
                    : "1px solid #27272A",
                background:
                  type === "expense" ? "rgba(239,68,68,0.1)" : "#09090B",
                color: type === "expense" ? "#F87171" : "#A1A1AA",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <ArrowUpCircle size={14} />
              {t.dashboard.transactionModal.typeExpense}
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 10,
                border:
                  type === "income"
                    ? "1px solid rgba(255,255,255,0.3)"
                    : "1px solid #27272A",
                background:
                  type === "income" ? "rgba(255,255,255,0.08)" : "#09090B",
                color: type === "income" ? "#FAFAFA" : "#A1A1AA",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <ArrowDownCircle size={14} />
              {t.dashboard.transactionModal.typeIncome}
            </button>
          </div>

          {/* ── Libellé ── */}
          <div>
            <label style={labelStyle}>{t.dashboard.transactionModal.descriptionLabel}</label>
            <div style={{ position: "relative" }}>
              <FileText
                size={14}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#52525B",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder={t.dashboard.transactionModal.descriptionPlaceholder}
                required
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* ── Montant ── */}
          <div>
            <label style={labelStyle}>{t.dashboard.transactionModal.amountLabel}</label>
            <div style={{ position: "relative" }}>
              <Wallet
                size={14}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#52525B",
                  pointerEvents: "none",
                }}
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: 2 500"
                min="1"
                required
                style={{
                  ...inputStyle,
                  paddingLeft: 36,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#EF4444",
                  pointerEvents: "none",
                }}
              >
                FCFA
              </span>
            </div>
          </div>

          {/* ── Grille 2 colonnes : Catégorie + Compte ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Catégorie */}
            <div>
              <label style={labelStyle}>
                <Tag size={10} style={{ display: "inline", marginRight: 4 }} />
                {t.dashboard.transactionModal.categoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={selectStyle}
              >
                {categoriesList.map((cat) => (
                  <option key={cat.key} value={cat.label}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Compte source */}
            <div>
              <label style={labelStyle}>
                <Wallet size={10} style={{ display: "inline", marginRight: 4 }} />
                {t.dashboard.transactionModal.accountLabel}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                style={selectStyle}
              >
                {accounts.length === 0 ? (
                  <option value="">{isEn ? "No account configured" : "Aucun compte configuré"}</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={String(acc.id)} value={String(acc.id)}>
                      {acc.name} ({fmt(acc.balance)})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* ── Grille 2 colonnes : Date + Note ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Date */}
            <div>
              <label style={labelStyle}>
                <CalendarDays size={10} style={{ display: "inline", marginRight: 4 }} />
                {t.dashboard.transactionModal.dateLabel}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Note */}
            <div>
              <label style={labelStyle}>Note ({isEn ? "optional" : "optionnel"})</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isEn ? "Details..." : "Détail..."}
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── Alerte erreur ── */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                fontSize: 12,
                color: "#F87171",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* ── Bouton de soumission ── */}
          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background: success
                ? "#EF4444"
                : type === "expense"
                ? "#EF4444"
                : "#DC2626",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || success ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                {t.dashboard.transactionModal.submitting}
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={16} />
                {isEn ? "Saved!" : "Enregistré !"}
              </>
            ) : (
              <>
                {type === "expense" ? (
                  <ArrowUpCircle size={16} />
                ) : (
                  <ArrowDownCircle size={16} />
                )}
                {type === "expense"
                  ? (isEn ? "Save expense" : "Enregistrer la dépense")
                  : (isEn ? "Save income" : "Enregistrer le revenu")}
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Keyframe animation ── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: 11,
  fontWeight: 600,
  color: "#A1A1AA",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#09090B",
  border: "1px solid #27272A",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  color: "#FAFAFA",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "#09090B",
  border: "1px solid #27272A",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  color: "#FAFAFA",
  outline: "none",
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "border-color 0.15s",
};
