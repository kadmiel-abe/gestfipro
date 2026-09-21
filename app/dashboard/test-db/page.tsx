"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  User,
  Wallet,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  PlusCircle,
  Receipt,
  ShieldAlert,
} from "lucide-react";

interface ProfileData {
  id: string;
  full_name: string | null;
  net_salary: number;
  payday_with_month: number;
  created_at?: string;
}

interface AccountData {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface TransactionData {
  id: string;
  title: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  transaction_date: string;
}

export default function TestDbPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  // Errors per table
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const runDatabaseTests = async () => {
    setLoading(true);
    setSessionError(null);
    setProfileError(null);
    setAccountsError(null);
    setTransactionsError(null);
    setActionSuccess(null);

    try {
      // 1. Récupération de la session utilisateur
      const {
        data: { session },
        error: sError,
      } = await supabase.auth.getSession();

      if (sError) {
        setSessionError(`Erreur Session Supabase : ${sError.message}`);
        setSessionUser(null);
        setLoading(false);
        return;
      }

      if (!session?.user) {
        setSessionError("Aucune session active. Veuillez vous connecter pour tester les tables sécurisées par RLS.");
        setSessionUser(null);
        setLoading(false);
        return;
      }

      setSessionUser(session.user);
      const userId = session.user.id;

      // 2. Test Table `profiles`
      const { data: pData, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (pError) {
        setProfileError(`Erreur lecture 'profiles' : ${pError.message} (Code: ${pError.code || "RLS"})`);
      } else {
        setProfile(pData);
      }

      // 3. Test Table `accounts`
      const { data: aData, error: aError } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (aError) {
        setAccountsError(`Erreur lecture 'accounts' : ${aError.message}`);
      } else {
        setAccounts(aData || []);
      }

      // 4. Test Table `transactions`
      const { data: tData, error: tError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false })
        .limit(10);

      if (tError) {
        setTransactionsError(`Erreur lecture 'transactions' : ${tError.message}`);
      } else {
        setTransactions(tData || []);
      }
    } catch (err: any) {
      setSessionError(`Exception inattendue : ${err?.message || "Erreur inconnue"}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    runDatabaseTests();
  }, []);

  // Test d'écriture : Ajout d'une transaction test pour valider les politiques RLS INSERT
  const handleAddTestExpense = async () => {
    if (!sessionUser) return;
    setActionSuccess(null);

    const firstAccountId = accounts.length > 0 ? accounts[0].id : null;

    try {
      const { error: insError } = await supabase.from("transactions").insert({
        user_id: sessionUser.id,
        account_id: firstAccountId,
        title: "Dépense Test BDD (Diagnostic)",
        amount: 2500,
        type: "expense",
        category: "Test",
        note: "Créé automatiquement depuis la page test-db",
      });

      if (insError) {
        setTransactionsError(`Échec écriture transaction : ${insError.message}`);
      } else {
        setActionSuccess("✓ Transaction test ajoutée avec succès dans la base de données !");
        runDatabaseTests();
      }
    } catch (err: any) {
      setTransactionsError(`Erreur lors de l'insertion : ${err?.message}`);
    }
  };

  const formatCFA = (val: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.round(val || 0)) + " FCFA";
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#09090B] text-[#FAFAFA] gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-[#EF4444]" />
        <p className="text-xs text-[#A1A1AA] font-medium tracking-wide">
          Interrogation des tables Supabase (profiles, accounts, transactions)...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] p-4 sm:p-8 text-[#FAFAFA] font-sans selection:bg-[#EF4444] selection:text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        
        {/* ── EN-TÊTE ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 flex items-center justify-center text-[#EF4444]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Vérification Backend & Base de Données
              </h1>
              <p className="text-xs text-[#A1A1AA]">
                Diagnostic de lecture / écriture sur Supabase PostgreSQL & Row Level Security (RLS)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setRefreshing(true);
              runDatabaseTests();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-white transition-colors cursor-pointer w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#EF4444]" : ""}`} />
            <span>Actualiser les tests</span>
          </button>
        </div>

        {/* Message de succès après action */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* ── 1. ÉTAT DE SESSION ── */}
        <div className="rounded-2xl bg-[#18181B] border border-[#27272A] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#09090B] border border-[#27272A]">
                <User className="w-4 h-4 text-[#A1A1AA]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Session Authentifiée (Auth.users)</p>
                <p className="text-xs text-[#A1A1AA]">
                  {sessionUser ? sessionUser.email : "Aucune session utilisateur active"}
                </p>
              </div>
            </div>
            {sessionUser ? (
              <CheckCircle2 className="w-6 h-6 text-[#EF4444] shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-[#EF4444] shrink-0" />
            )}
          </div>

          {sessionError && (
            <div className="mt-4 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{sessionError}</span>
            </div>
          )}
        </div>

        {/* ── 2. TABLE PROFILES ── */}
        <div className="rounded-2xl bg-[#18181B] border border-[#27272A] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                1. Table `profiles`
              </h2>
            </div>
            {profile ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4444]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lecture OK</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4444]">
                <XCircle className="w-4 h-4" />
                <span>Profil non trouvé</span>
              </div>
            )}
          </div>

          {profile ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#09090B] border border-[#27272A]">
                <span className="text-[10px] uppercase font-bold text-[#71717A] block mb-1">Nom complet</span>
                <span className="text-xs font-bold text-white">{profile.full_name || "Non défini"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#09090B] border border-[#27272A]">
                <span className="text-[10px] uppercase font-bold text-[#71717A] block mb-1">Salaire Net</span>
                <span className="text-xs font-bold text-[#FAFAFA]">{formatCFA(profile.net_salary)}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#09090B] border border-[#27272A]">
                <span className="text-[10px] uppercase font-bold text-[#71717A] block mb-1">Jour de paie</span>
                <span className="text-xs font-bold text-[#FAFAFA]">
                  {profile.payday_with_month ? `Le ${profile.payday_with_month} du mois` : "Non configuré"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#A1A1AA] mt-1">
              Aucun profil créé pour cet utilisateur. Passez par le processus d'onboarding pour initialiser votre salaire et cycle de paie.
            </p>
          )}

          {profileError && (
            <div className="mt-3 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {profileError}
            </div>
          )}
        </div>

        {/* ── 3. TABLE ACCOUNTS ── */}
        <div className="rounded-2xl bg-[#18181B] border border-[#27272A] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                2. Table `accounts` (Comptes manuels)
              </h2>
            </div>
            {accounts.length > 0 ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4444]">
                <CheckCircle2 className="w-4 h-4" />
                <span>{accounts.length} compte(s)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4444]">
                <XCircle className="w-4 h-4" />
                <span>0 compte trouvé</span>
              </div>
            )}
          </div>

          {accounts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-3 rounded-xl bg-[#09090B] border border-[#27272A]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate">{acc.name}</span>
                    <span className="text-[10px] uppercase font-bold text-[#71717A]">{acc.type}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#FAFAFA]">{formatCFA(acc.balance)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#A1A1AA] mt-1">
              Aucun compte initialisé (ex: Wave, Orange Money, Espèces, Banque). L'onboarding configure automatiquement vos comptes.
            </p>
          )}

          {accountsError && (
            <div className="mt-3 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {accountsError}
            </div>
          )}
        </div>

        {/* ── 4. TABLE TRANSACTIONS ── */}
        <div className="rounded-2xl bg-[#18181B] border border-[#27272A] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                3. Table `transactions`
              </h2>
            </div>
            {transactions.length > 0 ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4444]">
                <CheckCircle2 className="w-4 h-4" />
                <span>{transactions.length} transaction(s)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#A1A1AA]">
                <CheckCircle2 className="w-4 h-4 text-[#A1A1AA]" />
                <span>0 transaction (Table accessible)</span>
              </div>
            )}
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-2 pt-2">
              {transactions.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    <span className="font-semibold text-white">{t.title}</span>
                    <span className="text-[10px] text-[#71717A]">({t.category})</span>
                  </div>
                  <span
                    className={`font-bold ${
                      t.type === "income" ? "text-[#FAFAFA]" : "text-[#EF4444]"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCFA(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#A1A1AA] mt-1">
              Aucune transaction enregistrée pour le moment.
            </p>
          )}

          {/* Bouton de test d'écriture */}
          {sessionUser && (
            <div className="mt-4 pt-3 border-t border-[#27272A] flex justify-end">
              <button
                type="button"
                onClick={handleAddTestExpense}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#EF4444] hover:text-[#DC2626] transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tester l'écriture (Ajouter dépense test de 2 500 FCFA)</span>
              </button>
            </div>
          )}

          {transactionsError && (
            <div className="mt-3 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {transactionsError}
            </div>
          )}
        </div>

        {/* ── ACTIONS & NAVIGATION ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#27272A]">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#A1A1AA] hover:text-white underline transition-colors"
          >
            ← Retour au Tableau de bord
          </Link>

          <Link
            href="/onboarding"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs shadow-lg shadow-[#EF4444]/25 transition-colors"
          >
            <span>Lancer l'Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
