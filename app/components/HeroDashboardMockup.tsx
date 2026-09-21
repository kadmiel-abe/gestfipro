"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Zap,
  Plus,
  Send,
  CheckCircle2,
  Wallet,
  Building2,
  Banknote,
  Smartphone,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Shield,
} from "lucide-react";

interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  type: "expense" | "income";
  account: string;
  category: string;
  time: string;
}

export default function HeroDashboardMockup() {
  // ── Tilt 3D au survol avec Framer Motion ─────────────────────────────────
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 120, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 120, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["4deg", "-4deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-4deg", "4deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // ── Données et état interactif du Mockup ──────────────────────────────────
  const [daysRemaining, setDaysRemaining] = useState<number>(16);
  const [totalBalance, setTotalBalance] = useState<number>(360000);
  const [spentToday, setSpentToday] = useState<number>(4500);
  const [transactionCount, setTransactionCount] = useState<number>(2);
  const [quickInput, setQuickInput] = useState<string>("");
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: "tx-1",
      title: "Taxi Abidjan",
      amount: -2000,
      type: "expense",
      account: "Espèces",
      category: "Transport",
      time: "11:30",
    },
    {
      id: "tx-2",
      title: "Déjeuner d'équipe",
      amount: -2500,
      type: "expense",
      account: "Wave",
      category: "Alimentation",
      time: "13:15",
    },
    {
      id: "tx-3",
      title: "Virement Salaire",
      amount: 350000,
      type: "income",
      account: "Banque",
      category: "Revenu",
      time: "01 Sept",
    },
  ]);

  // Comptes manuels définis (Total = 360 000 FCFA)
  const accounts = [
    { name: "Wave", type: "Mobile Money", balance: 120000, color: "#EF4444", icon: Smartphone, share: "33%" },
    { name: "Banque", type: "Compte courant", balance: 100000, color: "#FAFAFA", icon: Building2, share: "28%" },
    { name: "Orange Money", type: "Mobile Money", balance: 95000, color: "#DC2626", icon: Smartphone, share: "26%" },
    { name: "Espèces", type: "Cash physique", balance: 45000, color: "#F87171", icon: Banknote, share: "13%" },
  ];

  // Calcul dynamique du budget journalier
  const dailyBudget = daysRemaining > 0 ? Math.round(totalBalance / daysRemaining) : 0;

  // Formatage monétaire
  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

  // Date du jour formatée
  const [dateFormatted, setDateFormatted] = useState("Lundi 14 Septembre 2026");
  useEffect(() => {
    try {
      const now = new Date();
      const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      setDateFormatted(`${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    } catch (e) {}
  }, []);

  // Gestion de la saisie rapide
  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;

    // Détection d'un montant dans le texte (ex: "riz 3000" ou "essence 5000")
    const match = text.match(/\d+/);
    const amount = match ? parseInt(match[0], 10) : 3000;
    const cleanTitle = text.replace(/\d+/, "").trim() || "Dépense rapide";

    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      amount: -amount,
      type: "expense",
      account: "Wave",
      category: "Dépense",
      time: "À l'instant",
    };

    setTransactions((prev) => [newTx, ...prev.slice(0, 2)]);
    setSpentToday((prev) => prev + amount);
    setTotalBalance((prev) => Math.max(0, prev - amount));
    setTransactionCount((prev) => prev + 1);
    setQuickInput("");
    setFeedbackToast(`+ ${fmt(amount)} FCFA enregistré !`);

    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200 }}
      className="relative w-full max-w-5xl mx-auto select-none font-sans"
    >
      {/* ── HALO LUMINEUX ROUGE D'ARRIÈRE-PLAN (#EF4444) ── */}
      <div className="absolute -inset-2 bg-gradient-to-r from-[#EF4444]/25 via-[#EF4444]/15 to-[#EF4444]/25 rounded-3xl blur-3xl opacity-75 pointer-events-none" />

      {/* ── CONTENEUR 3D / TILT DU MOCKUP ── */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl sm:rounded-3xl bg-[#09090B] border border-[#27272A] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden text-left"
      >
        {/* ══ TOP BAR DE TYPE APPLICATION SAAS / MACOS ════════════════════ */}
        <div className="h-10 bg-[#121216] border-b border-[#27272A] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-[#DC2626]" />
            <span className="w-3 h-3 rounded-full bg-[#3F3F46] border border-[#52525B]" />
            <span className="w-3 h-3 rounded-full bg-[#27272A] border border-[#3F3F46]" />
            <span className="ml-3 text-[11px] font-semibold text-[#71717A] tracking-wider uppercase hidden sm:inline-block">
              GestFiPro · Dashboard v2.4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-[11px] font-medium text-[#A1A1AA]">
              Données synchronisées en temps réel
            </span>
          </div>
        </div>

        {/* ══ 1. TOP BAR DU MOCKUP (Greeting + Cycle Actif + CTA) ════════════ */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-[#18181B]/70 to-transparent">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
              Bonjour Kadmiel <span className="animate-wave inline-block">👋</span>
            </h3>
            <p className="text-xs font-medium text-[#A1A1AA] mt-1">
              {dateFormatted} · Suivi budgétaire en temps réel
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Badge animé rouge "● Cycle actif (J-16)" */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs font-semibold text-[#EF4444] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
              <span>Cycle actif (J-{daysRemaining})</span>
            </div>

            {/* Bouton + Nouvelle dépense */}
            <button
              onClick={() => {
                setQuickInput("Déjeuner 3500");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-[#EF4444]/25 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle dépense</span>
            </button>
          </div>
        </div>

        {/* ══ 2. GRILLE PRINCIPALE (SPLIT 8/12 À GAUCHE, 4/12 À DROITE) ══════ */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ══════════════ COLONNE GAUCHE (8/12) - CŒUR DU SAAS ══════════════ */}
          <div className="lg:col-span-8 flex flex-col gap-4">

            {/* ── CARTE PHARE : CYCLE DE PAIE (Bordure #EF4444 subtile) ── */}
            <div className="rounded-2xl bg-[#18181B] border border-[#EF4444]/35 p-5 relative overflow-hidden shadow-lg shadow-black/40">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#EF4444]/15 via-transparent to-transparent pointer-events-none" />

              {/* En-tête de la carte */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-tight text-[#FAFAFA]">Cycle de Paie</h4>
                    <p className="text-[11px] font-medium text-[#A1A1AA]">
                      Versement prévu le 28 du mois · Jour 12 en cours
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] bg-[#09090B] px-2.5 py-1 rounded-md border border-[#27272A]">
                  Septembre 2026
                </span>
              </div>

              {/* Grille intérieure : Gauche (Chiffre géant + Jauge) | Droite (Budget journalier) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* GAUCHE : Compteur Jours Restants */}
                <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                      Jours restants
                    </span>
                    <Clock className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-extrabold tracking-tight tabular-nums text-[#FAFAFA]">
                      {daysRemaining}
                    </span>
                    <span className="text-xs font-semibold text-[#A1A1AA]">
                      jours restants
                    </span>
                  </div>

                  {/* Jauge de progression rouge (#EF4444) du mois */}
                  <div>
                    <div className="flex justify-between text-[10px] font-medium text-[#71717A] mb-1.5">
                      <span>Cycle en cours (Jour 12)</span>
                      <span>Prochaine paie : le 28</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#27272A] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#EF4444] to-[#F87171]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.round(((30 - daysRemaining) / 30) * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                {/* DROITE : Widget "BUDGET JOURNALIER AUTORISÉ" */}
                <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                      Budget journalier autorisé
                    </span>
                    <Zap className="w-3.5 h-3.5 text-[#EF4444]" />
                  </div>

                  <div className="mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-[#EF4444]">
                        {fmt(dailyBudget)}
                      </span>
                      <span className="text-xs font-semibold text-[#A1A1AA]">
                        FCFA / jour
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-[#A1A1AA] mt-1">
                      (Solde dispo ÷ {daysRemaining} jours)
                    </p>
                  </div>

                  {/* Badge "Rythme équilibré" */}
                  <div className="pt-2 border-t border-[#27272A]">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Rythme équilibré</span>
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* ── SUB-CARDS RAPIDES (Solde dispo & Dépenses du jour) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Sub-card 1 : Solde total disponible */}
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] block mb-1">
                    Solde total disponible
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight tabular-nums text-[#FAFAFA]">
                    {fmt(totalBalance)}{" "}
                    <span className="text-xs font-medium text-[#A1A1AA]">FCFA</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#71717A] mt-1 block">
                    Consolidé sur 4 comptes
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-center text-[#FAFAFA]">
                  <Wallet className="w-5 h-5 text-[#EF4444]" />
                </div>
              </div>

              {/* Sub-card 2 : Dépenses aujourd'hui */}
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] block mb-1">
                    Dépenses aujourd'hui
                  </span>
                  <div className="text-2xl font-extrabold tracking-tight tabular-nums text-[#FAFAFA]">
                    {fmt(spentToday)}{" "}
                    <span className="text-xs font-medium text-[#A1A1AA]">FCFA</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#A1A1AA] mt-1 flex items-center gap-1">
                    <span className="text-[#EF4444] font-semibold">✓</span> {transactionCount} transactions enregistrées
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-center text-[#EF4444]">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* ── NOUVELLE CARTE : ÉVOLUTION DE TRÉSORERIE & FLUX (COURBE SVG) ── */}
            <div className="p-4 rounded-2xl bg-[#18181B] border border-[#27272A] relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#FAFAFA] tracking-tight">
                      Évolution de la Trésorerie
                    </h5>
                    <p className="text-[10px] font-medium text-[#71717A]">
                      Flux et projection sur le cycle en cours
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 text-[10px] font-bold text-[#EF4444]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Trésorerie saine (+10k)</span>
                </div>
              </div>

              {/* Graphique SVG avec dégradé crimson et courbe lissée */}
              <div className="h-20 w-full relative">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 420 85"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="heroCashflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.38" />
                      <stop offset="70%" stopColor="#EF4444" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Lignes de repères subtiles */}
                  <line x1="0" y1="20" x2="420" y2="20" stroke="#27272A" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
                  <line x1="0" y1="55" x2="420" y2="55" stroke="#27272A" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />

                  {/* Surface dégradée */}
                  <path
                    d="M 0,42 Q 70,30 140,50 T 235,28 T 340,55 L 420,65 L 420,85 L 0,85 Z"
                    fill="url(#heroCashflowGrad)"
                  />

                  {/* Courbe principale rouge */}
                  <path
                    d="M 0,42 Q 70,30 140,50 T 235,28 T 340,55 L 420,65"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Point de départ (Paie) */}
                  <circle cx="0" cy="42" r="3.5" fill="#EF4444" />

                  {/* Point Aujourd'hui (J-16) interactif avec halo et pulsation */}
                  <circle cx="235" cy="28" r="7" fill="#EF4444" opacity="0.25" className="animate-ping" />
                  <circle cx="235" cy="28" r="4.5" fill="#FAFAFA" stroke="#EF4444" strokeWidth="2.5" />

                  {/* Point de projection fin de mois */}
                  <circle cx="420" cy="65" r="3.5" fill="#71717A" />
                </svg>
              </div>

              {/* Jalons sous la courbe */}
              <div className="flex justify-between items-center text-[10px] text-[#71717A] mt-2 font-medium">
                <span>J-30 (Paie : 350k)</span>
                <span className="text-[#EF4444] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] inline-block" />
                  Aujourd'hui (J-16 : {fmt(totalBalance)} FCFA)
                </span>
                <span>J-0 (Prochaine paie : 28)</span>
              </div>
            </div>

          </div>

          {/* ══════════════ COLONNE DROITE (4/12) - INSPECTEUR DE COMPTES ══════════════ */}
          <div className="lg:col-span-4">
            <div className="h-full rounded-2xl bg-[#18181B] border border-[#27272A] p-5 flex flex-col justify-between shadow-lg">
              
              <div>
                {/* En-tête Inspecteur de comptes */}
                <div className="flex items-center justify-between pb-3 border-b border-[#27272A] mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#EF4444]" />
                    <h4 className="text-sm font-bold tracking-tight text-[#FAFAFA]">Mes Comptes</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#27272A] text-[#A1A1AA]">
                    4 manuels
                  </span>
                </div>

                {/* Solde consolidé en haut */}
                <div className="p-3.5 rounded-xl bg-[#09090B] border border-[#27272A] mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block mb-0.5">
                    Solde total consolidé
                  </span>
                  <div className="text-xl font-extrabold tracking-tight tabular-nums text-[#FAFAFA]">
                    {fmt(totalBalance)} <span className="text-xs font-medium text-[#A1A1AA]">FCFA</span>
                  </div>
                </div>

                {/* Liste des comptes manuels */}
                <div className="space-y-2.5">
                  {accounts.map((acc) => {
                    const Icon = acc.icon;
                    return (
                      <div
                        key={acc.name}
                        className="p-2.5 rounded-xl bg-[#09090B]/70 border border-[#27272A]/70 hover:border-[#3F3F46] transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: `${acc.color}20`, border: `1px solid ${acc.color}40` }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: acc.color }} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#FAFAFA] leading-none">{acc.name}</p>
                            <span className="text-[10px] font-medium text-[#71717A]">{acc.type}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold tabular-nums text-[#FAFAFA]">{fmt(acc.balance)} FCFA</p>
                          <span className="text-[9px] font-semibold text-[#A1A1AA]">{acc.share}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Note de bas d'inspecteur */}
              <div className="pt-4 border-t border-[#27272A] mt-4 flex items-center justify-between text-[11px] text-[#71717A]">
                <span>Mise à jour manuelle</span>
                <span className="text-[#EF4444] font-semibold flex items-center gap-0.5">
                  100% Privé & Sans API
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* ══ 3. RANGÉE INFÉRIEURE - TRANSACTIONS RÉCENTES ═══════════════════ */}
        <div className="px-5 sm:px-6 pb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
              Transactions Récentes (Aujourd'hui)
            </h4>
            <span className="text-xs font-semibold text-[#EF4444] flex items-center gap-1 cursor-pointer hover:underline">
              Historique complet <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {transactions.map((tx) => {
              const isIncome = tx.type === "income";
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isIncome ? "bg-white/10 text-white" : "bg-[#EF4444]/15 text-[#EF4444]"
                      }`}
                    >
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#FAFAFA] truncate max-w-[130px]">
                        {tx.title}
                      </p>
                      <p className="text-[10px] font-medium text-[#71717A]">
                        {tx.account} · {tx.time}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold tracking-tight tabular-nums ${
                        isIncome ? "text-white" : "text-[#FAFAFA]"
                      }`}
                    >
                      {isIncome ? "+" : ""}{fmt(tx.amount)} FCFA
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ 4. BARRE DE SAISIE RAPIDE (ANCRÉE EN BAS DU MOCKUP) ════════════ */}
        <div className="p-4 sm:p-5 bg-[#121216] border-t border-[#27272A]">
          <form onSubmit={handleQuickSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Saisie rapide : taxi 2000, riz 3000..."
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#EF4444] rounded-xl py-2.5 pl-4 pr-10 text-xs font-medium text-[#FAFAFA] placeholder-[#71717A] outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-[#EF4444]/20 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Enregistrer</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toast de confirmation interactif */}
          <AnimatePresence>
            {feedbackToast && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-[#EF4444]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{feedbackToast}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
