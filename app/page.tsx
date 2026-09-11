"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  animate,
  AnimatePresence,
} from "framer-motion";
import {
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PieChart,
  Wallet,
  Smartphone,
  Lock,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Globe,
  Star,
  Users,
  Check,
  Coins,
} from "lucide-react";

type Language = "fr" | "en";
type Currency = "XOF" | "XAF" | "NGN" | "KES" | "ZAR" | "USD";

interface CurrencyConfig {
  code: Currency;
  label: string;
  defaultBalance: number;
  flag: string;
}

const CURRENCIES: Record<Currency, CurrencyConfig> = {
  XOF: { code: "XOF", label: "FCFA (UEMOA)", defaultBalance: 174000, flag: "🌍" },
  XAF: { code: "XAF", label: "FCFA (CEMAC)", defaultBalance: 174000, flag: "🌍" },
  NGN: { code: "NGN", label: "Naira ₦", defaultBalance: 420000, flag: "🇳🇬" },
  KES: { code: "KES", label: "KSh", defaultBalance: 38000, flag: "🇰🇪" },
  ZAR: { code: "ZAR", label: "Rand R", defaultBalance: 5200, flag: "🇿🇦" },
  USD: { code: "USD", label: "USD $", defaultBalance: 320, flag: "💵" },
};

// ── COMPOSANT D'ANIMATION COUNT-UP POUR CHIFFRES ET MONTANTS ───────────────
function AnimatedNumber({
  value,
  formatter,
}: {
  value: number;
  formatter?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionVal, value, {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = formatter
              ? formatter(latest)
              : Math.round(latest).toLocaleString();
          }
        },
      });
      return () => controls.stop();
    } else if (ref.current) {
      ref.current.textContent = formatter
        ? formatter(value)
        : Math.round(value).toLocaleString();
    }
  }, [isInView, value, formatter, motionVal]);

  return (
    <span ref={ref}>
      {formatter ? formatter(value) : Math.round(value).toLocaleString()}
    </span>
  );
}

// ── COMPOSANT JAUGE DE PROGRESSION AVEC SCALE-X & TRANSITION CRITIQUE ───────
function AnimatedGauge({
  percentage,
  isCritical = false,
  className = "",
}: {
  percentage: number;
  isCritical?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full h-1.5 rounded-full bg-[#27272A] overflow-hidden ${className}`}>
      <motion.div
        className={`h-full rounded-full transition-colors duration-300 ${
          isCritical ? "bg-[#EF4444]" : "bg-[#10b981]"
        }`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: Math.min(Math.max(percentage / 100, 0), 1) }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left" }}
      />
    </div>
  );
}

export default function GestFiProPanAfricanLanding() {
  const [lang, setLang] = useState<Language>("fr");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("XOF");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Parallax global du Hero
  const { scrollY } = useScroll();
  const heroHaloY = useTransform(scrollY, [0, 800], [0, 140]);
  const heroTextY = useTransform(scrollY, [0, 600], [0, -20]);

  // Simulateur interactif
  const [simDays, setSimDays] = useState(12);
  const [simBalance, setSimBalance] = useState<number>(CURRENCIES["XOF"].defaultBalance);

  const handleCurrencyChange = (curr: Currency) => {
    setSelectedCurrency(curr);
    setSimBalance(CURRENCIES[curr].defaultBalance);
  };

  const dailyBudget = simDays > 0 ? Math.round(simBalance / simDays) : 0;
  const isBudgetCritical = simDays <= 4 || dailyBudget < 2000;

  const fmt = (n: number) => Math.round(n).toLocaleString(lang === "fr" ? "fr-FR" : "en-US");

  // Dictionnaire de traduction FR / EN
  const t = {
    fr: {
      badge: "La 1ère plateforme panafricaine de gestion par cycle de paie",
      heroTitle1: "Maîtrisez votre argent",
      heroTitle2: "jusqu'au prochain salaire.",
      heroSubtitle:
        "Suivi en temps réel de votre trésorerie et calcul automatique de votre budget journalier disponible (Solde ÷ Jours restants). 0 connexion bancaire requise.",
      ctaPrimary: "Créer mon compte gratuit",
      ctaSecondary: "Voir la démo en direct",
      microTrust1: "100% Manuel & Confidentiel",
      microTrust2: "Zéro carte bancaire",
      microTrust3: "Multi-devises africaines",

      // Dashboard Mockup
      mockDaysLeft: "Jours avant la paie",
      mockDaysCount: "jours",
      mockRhythm: "Rythme optimal",
      mockDailyBudget: "Budget conseillé / jour",
      mockTodaySpent: "Dépenses aujourd'hui",
      mockTotalBalance: "Solde Total Agrégé",
      mockAccounts: "Espèces · Mobile Money · Banque",
      mockSavingsGoal: "Santé Budgétaire",
      mockSimulatorLabel: "Simulateur en direct :",
      mockAdjustDays: "Jours restants :",

      // Defis
      defisBadge: "La réalité du salarié africain",
      defisTitle: "Des défis que vous vivez chaque mois",
      defisSubtitle:
        "Comptes dispersés, Mobile Money d'un côté, cash de l'autre : impossible de savoir ce qu'il vous reste pour finir le mois.",
      defi1Title: "Comptes Dispersés",
      defi1Sub: "Mobile Money + Cash + Banque = ?",
      defi1Desc:
        "Votre argent est éparpillé entre Wave, Orange Money, M-Pesa, MTN, cash et banques locales. Vous n'avez jamais une vision consolidée.",
      defi2Title: "Dépenses Inattendues",
      defi2Sub: "Où s'évapore le salaire ?",
      defi2Desc:
        "Au 15 du mois, la moitié du salaire a disparu dans des micro-dépenses du quotidien sans qu'aucun suivi clair ne vous alerte.",
      defi3Title: "L'Angoisse de la Fin de Mois",
      defi3Sub: "Toujours à sec avant la paie",
      defi3Desc:
        "Même avec un salaire régulier, la dernière semaine avant le virement devient stressante, forçant à emprunter ou serrer la ceinture.",
      defisTransition: "GestFiPro unifie tous vos comptes et calcule votre budget quotidien de sécurité.",

      // Bento Grid
      bentoTitle: "Conçu pour ceux qui vivent de salaire en salaire",
      bentoSubtitle: "Une approche radicalement simple adaptée à l'Afrique entière.",
      bento1Title: "Cycle de Paie Intelligent",
      bento1Desc:
        "Le compteur se synchronise automatiquement avec votre date de paie pour calculer ce que vous pouvez dépenser chaque jour sans risque de découvert.",
      bento2Title: "Saisie Rapide < 3s",
      bento2Desc:
        "Enregistrez vos achats du quotidien en 3 secondes chrono. Une interface ultra-épurée pour un suivi sans friction.",
      bento3Title: "Confidentialité Totale",
      bento3Desc:
        "Zéro liaison bancaire requise. Vos comptes manuels restent sous votre contrôle exclusif et chiffré.",
      bento4Title: "Santé Financière & Alertes",
      bento4Desc:
        "Une jauge dynamique vous prévient immédiatement si votre rythme de dépense met en danger votre fin de mois.",

      // How it works
      howBadge: "Prêt en 30 secondes",
      howTitle: "Comment fonctionne GestFiPro ?",
      step1Title: "1. Déclarez votre cycle",
      step1Desc: "Renseignez votre salaire net et votre date de paie habituelle. 0 carte bancaire requise.",
      step2Title: "2. Ajoutez vos soldes",
      step2Desc: "Indiquez ce que vous avez : Mobile Money, espèces en poche, compte bancaire.",
      step3Title: "3. Notez en 3 secondes",
      step3Desc: "Enregistrez chaque dépense. Le solde et le budget quotidien se recalculent immédiatement.",
      step4Title: "4. Finissez serein",
      step4Desc: "Terminez chaque mois sans découvert et observez votre capacité d'épargne grandir.",

      // Testimonials
      testiTitle: "Adopté par les salariés à travers toute l'Afrique",
      testiSubtitle: "D'Abidjan à Nairobi, de Dakar à Johannesburg.",

      // Security
      secTitle: "Vos données, votre souveraineté",
      secDesc:
        "GestFiPro ne se connecte jamais à vos comptes bancaires et ne stocke aucun identifiant bancaire. Vos données financières sont strictement confidentielles, chiffrées de bout en bout et protégées.",

      // FAQ
      faqTitle: "Questions fréquentes",
      faqSubtitle: "Tout ce que vous devez savoir pour démarrer.",

      // CTA
      ctaFinalTitle: "Prêt à reprendre le contrôle de votre paie ?",
      ctaFinalSubtitle:
        "Rejoignez des milliers de salariés africains qui ne redoutent plus la fin du mois. Prêt en 30 secondes chrono.",
      ctaFinalBtn: "Créer mon compte gratuit",
      ctaFinalDemo: "Ouvrir l'application",
    },
    en: {
      badge: "The #1 Pan-African Pay-Cycle Financial Platform",
      heroTitle1: "Master your money",
      heroTitle2: "until your next payday.",
      heroSubtitle:
        "Real-time cashflow tracking and automatic daily budget calculation (Balance ÷ Remaining Days). 0 bank integration required.",
      ctaPrimary: "Create free account",
      ctaSecondary: "Live Interactive Demo",
      microTrust1: "100% Manual & Private",
      microTrust2: "No credit card needed",
      microTrust3: "Pan-African Multi-Currency",

      // Dashboard Mockup
      mockDaysLeft: "Days before payday",
      mockDaysCount: "days",
      mockRhythm: "Optimal rhythm",
      mockDailyBudget: "Recommended / day",
      mockTodaySpent: "Spent today",
      mockTotalBalance: "Total Consolidated Balance",
      mockAccounts: "Cash · Mobile Money · Bank",
      mockSavingsGoal: "Budget Health",
      mockSimulatorLabel: "Live Simulator :",
      mockAdjustDays: "Remaining days :",

      // Defis
      defisBadge: "The African Employee Reality",
      defisTitle: "Challenges you face every month",
      defisSubtitle:
        "Scattered accounts, Mobile Money here, cash there: impossible to know what you can safely spend.",
      defi1Title: "Fragmented Accounts",
      defi1Sub: "Mobile Money + Cash + Bank = ?",
      defi1Desc:
        "Your money is spread across Wave, Orange Money, M-Pesa, MTN, cash and local banks. You never have a single source of truth.",
      defi2Title: "Hidden Spending Leaks",
      defi2Sub: "Where did the salary go?",
      defi2Desc:
        "By the 15th of the month, half the salary has vanished into micro-expenses without any visual warning.",
      defi3Title: "End-of-Month Stress",
      defi3Sub: "Always broke before payday",
      defi3Desc:
        "Even with a steady job, the last week before salary feels like an uphill battle, forcing loans or extreme frugality.",
      defisTransition: "GestFiPro unifies all your accounts and computes your safe daily budget.",

      // Bento Grid
      bentoTitle: "Built for those living from paycheck to paycheck",
      bentoSubtitle: "A radically simple approach crafted for all of Africa.",
      bento1Title: "Intelligent Pay Cycle",
      bento1Desc:
        "The countdown automatically synchronizes with your salary date to calculate what you can spend each day without overdraft risk.",
      bento2Title: "Ultra-Fast Entry < 3s",
      bento2Desc:
        "Log everyday expenses in under 3 seconds. An ultra-minimal interface for zero-friction tracking.",
      bento3Title: "Total Privacy",
      bento3Desc:
        "Zero bank link required. Your manual accounts remain under your exclusive, encrypted control.",
      bento4Title: "Financial Health & Alerts",
      bento4Desc:
        "A reactive gauge warns you immediately if your spending pace threatens your month-end runway.",

      // How it works
      howBadge: "Ready in 30 seconds",
      howTitle: "How does GestFiPro work?",
      step1Title: "1. Set your cycle",
      step1Desc: "Enter your net salary and typical payday. No credit card required.",
      step2Title: "2. Add your balances",
      step2Desc: "Input what you have: Mobile Money, cash in pocket, bank account.",
      step3Title: "3. Log in 3 seconds",
      step3Desc: "Track each transaction. Balance and daily allowance recalculate instantly.",
      step4Title: "4. Finish stress-free",
      step4Desc: "End each month without overdrafts and watch your savings grow.",

      // Testimonials
      testiTitle: "Trusted by workers across the entire continent",
      testiSubtitle: "From Abidjan to Nairobi, Dakar to Johannesburg.",

      // Security
      secTitle: "Your data, your sovereignty",
      secDesc:
        "GestFiPro never connects to your bank accounts and never asks for banking credentials. Your financial data is strictly confidential, encrypted end-to-end.",

      // FAQ
      faqTitle: "Frequently Asked Questions",
      faqSubtitle: "Everything you need to know to get started.",

      // CTA
      ctaFinalTitle: "Ready to take control of your payday?",
      ctaFinalSubtitle:
        "Join thousands of African employees who no longer fear the end of the month. Ready in 30 seconds.",
      ctaFinalBtn: "Create free account",
      ctaFinalDemo: "Open Application",
    },
  }[lang];

  const panAfricanTestimonials = [
    {
      name: "Moussa Coulibaly",
      city: "Abidjan, Côte d'Ivoire",
      flag: "🇨🇮",
      role: lang === "fr" ? "Cadre commercial" : "Sales Executive",
      text:
        lang === "fr"
          ? "Avant, le 15 du mois j'étais déjà à découvert sans savoir pourquoi. Avec GestFiPro et mon budget/jour calculé en direct, je termine le mois avec plus de 50 000 FCFA d'épargne."
          : "Before, by the 15th I was already overspent without knowing why. With GestFiPro and my live daily budget, I finish each month saving over 50,000 FCFA.",
    },
    {
      name: "David Ochieng",
      city: "Nairobi, Kenya",
      flag: "🇰🇪",
      role: lang === "fr" ? "Développeur logiciel" : "Software Engineer",
      text:
        lang === "fr"
          ? "Je gère mon compte M-Pesa et mon compte bancaire KES en même temps. Le compte à rebours jusqu'au jour de paie a transformé ma gestion financière !"
          : "Managing my M-Pesa and local KES bank account together in one view is a game changer. The payday countdown completely transformed how I budget.",
    },
    {
      name: "Chidinma Nwosu",
      city: "Lagos, Nigeria",
      flag: "🇳🇬",
      role: lang === "fr" ? "Comptable" : "Accountant",
      text:
        lang === "fr"
          ? "Avec l'inflation en Naira, savoir exactement combien je peux dépenser par jour est une bénédiction. Zéro connexion bancaire, 100% sécurisé."
          : "With Naira fluctuations, knowing exactly how much I can safely spend each day is a lifesaver. Zero bank login needed, 100% private.",
    },
  ];

  const panAfricanFaqs = [
    {
      q:
        lang === "fr"
          ? "Est-ce que GestFiPro a accès à mes comptes bancaires ou Mobile Money ?"
          : "Does GestFiPro connect to my bank or Mobile Money accounts?",
      a:
        lang === "fr"
          ? "Non, jamais. GestFiPro fonctionne selon un principe 100% manuel et souverain. Vous n'avez aucun identifiant bancaire ni mot de passe à renseigner. Vos données restent strictement entre vos mains."
          : "No, never. GestFiPro is 100% manual and sovereign. You never provide bank logins or passwords. Your financial data stays strictly under your control.",
    },
    {
      q:
        lang === "fr"
          ? "Quels pays et devises sont pris en charge ?"
          : "Which countries and currencies are supported?",
      a:
        lang === "fr"
          ? "Toute l'Afrique : Afrique de l'Ouest (XOF), Afrique Centrale (XAF), Nigeria (NGN), Kenya (KES), Afrique du Sud (ZAR), ainsi que les devises internationales (USD)."
          : "All of Africa: West Africa (XOF), Central Africa (XAF), Nigeria (NGN), Kenya (KES), South Africa (ZAR), and international currencies (USD).",
    },
    {
      q:
        lang === "fr"
          ? "Comment est calculé le budget journalier ?"
          : "How is the daily budget calculated?",
      a:
        lang === "fr"
          ? "La formule est simple et infaillible : Budget quotidien = (Somme de vos soldes réels) ÷ (Nombre de jours restants jusqu'au prochain salaire). Il se met à jour à chaque dépense notée."
          : "The formula is simple and foolproof: Daily budget = (Sum of real balances) ÷ (Days remaining until next payday). It updates with every logged expense.",
    },
    {
      q:
        lang === "fr"
          ? "Puis-je l'utiliser si ma date de salaire varie ?"
          : "Can I use it if my payday fluctuates?",
      a:
        lang === "fr"
          ? "Oui. Vous pouvez modifier votre jour de paie à tout moment ou réajuster vos comptes d'un simple clic."
          : "Yes. You can edit your payday date or adjust your balances at any time with a single click.",
    },
    {
      q:
        lang === "fr"
          ? "Est-ce gratuit ?"
          : "Is it free to use?",
      a:
        lang === "fr"
          ? "Oui, la création de compte et le suivi de base de votre cycle de paie sont 100% gratuits et sans carte bancaire."
          : "Yes, account creation and essential pay-cycle tracking are 100% free with no credit card required.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] selection:bg-[#EF4444] selection:text-white font-['Inter',sans-serif] overflow-x-hidden">
      
      {/* ── ANIMATED BACKGROUND MESH & HALOS (STYLE LINEAR / MOLTRACK) AVEC PARALLAX ── */}
      <motion.div
        style={{ y: heroHaloY }}
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#EF4444]/18 via-[#EF4444]/5 to-transparent blur-[140px] rounded-full animate-pulse" />
        <div className="absolute top-[35%] -left-60 w-[550px] h-[550px] bg-[#EF4444]/8 blur-[180px] rounded-full" />
        <div className="absolute top-[65%] -right-60 w-[650px] h-[650px] bg-[#EF4444]/8 blur-[180px] rounded-full" />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER NAVBAR (STICKY, LOGO OFFICIEL & SÉLECTEURS)
      ════════════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16 py-4 border-b border-[#27272A]/70 backdrop-blur-xl bg-[#09090B]/85"
      >
        {/* Logo Officiel logo.png - Redirection vers la section Hero */}
        <Link
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            const heroEl = document.getElementById("hero");
            if (heroEl) {
              heroEl.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-3 group cursor-pointer"
          title={lang === "fr" ? "Retour au début" : "Back to top"}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-10 h-10 rounded-xl overflow-hidden bg-[#18181B] border border-[#27272A] shadow-lg shadow-[#EF4444]/20 group-hover:border-[#EF4444]/60 transition-colors shrink-0 flex items-center justify-center"
          >
            <Image
              src="/icons/logo.png"
              alt="GestFiPro"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </motion.div>
          <span className="text-xl font-black tracking-tight text-white group-hover:text-white transition-colors">
            GestFi<span className="text-[#EF4444]">Pro</span>
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-[#A1A1AA]">
          <a href="#defis" className="hover:text-white transition-colors">
            {lang === "fr" ? "Le Problème" : "The Problem"}
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            {lang === "fr" ? "Fonctionnalités" : "Features"}
          </a>
          <a href="#how" className="hover:text-white transition-colors">
            {lang === "fr" ? "Comment ça marche" : "How it works"}
          </a>
          <a href="#testimonials" className="hover:text-white transition-colors">
            {lang === "fr" ? "Témoignages" : "Reviews"}
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        {/* Action Controls : Sélecteur Langue + Devises + Auth */}
        <div className="flex items-center gap-3">
          
          {/* Sélecteur de Devises Panafricain */}
          <div className="hidden sm:flex items-center bg-[#18181B] border border-[#27272A] rounded-xl px-2 py-1 text-xs">
            <Coins className="w-3.5 h-3.5 text-[#EF4444] mr-1.5" />
            <select
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
              className="bg-transparent text-white font-bold cursor-pointer outline-none text-xs"
              aria-label="Currency selector"
            >
              <option value="XOF" className="bg-[#18181B]">XOF (CFA Ouest)</option>
              <option value="XAF" className="bg-[#18181B]">XAF (CFA Centre)</option>
              <option value="NGN" className="bg-[#18181B]">NGN (₦ Nigeria)</option>
              <option value="KES" className="bg-[#18181B]">KES (KSh Kenya)</option>
              <option value="ZAR" className="bg-[#18181B]">ZAR (R Afrique du Sud)</option>
              <option value="USD" className="bg-[#18181B]">USD ($)</option>
            </select>
          </div>

          {/* Sélecteur de Langue FR | EN */}
          <div className="flex items-center bg-[#18181B] border border-[#27272A] rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setLang("fr")}
              className={`px-2 py-1 rounded-lg transition-all ${
                lang === "fr"
                  ? "bg-[#EF4444] text-white shadow-sm"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded-lg transition-all ${
                lang === "en"
                  ? "bg-[#EF4444] text-white shadow-sm"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          {/* Liens Auth */}
          <Link
            href="/login"
            className="hidden sm:inline-block text-sm font-semibold text-[#A1A1AA] hover:text-white transition-colors px-2 py-1"
          >
            {lang === "fr" ? "Connexion" : "Sign In"}
          </Link>
          <motion.div
            whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(239, 68, 68, 0.55)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="inline-block rounded-xl"
          >
            <Link
              href="/onboarding"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#EF4444] text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:bg-[#DC2626] transition-colors flex items-center gap-1.5"
            >
              <span>{lang === "fr" ? "Commencer" : "Get Started"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════════
          2. HERO SECTION PANAFRICAINE & DYNAMIQUE AVEC MOTION DESIGN
      ════════════════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative pt-14 pb-20 px-6 lg:px-16 max-w-7xl mx-auto text-center scroll-mt-24">
        
        <motion.div style={{ y: heroTextY }}>
          {/* Badge supérieur Panafricain */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181B] border border-[#27272A] text-xs font-semibold text-[#A1A1AA] mb-8 hover:border-[#EF4444]/40 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EF4444] animate-pulse" />
            <span>{t.badge}</span>
            <span className="text-sm">🌍</span>
          </motion.div>

          {/* Titre Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6 text-[#FAFAFA]"
          >
            {t.heroTitle1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EF4444] via-[#f87171] to-rose-400">
              {t.heroTitle2}
            </span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-xl text-[#A1A1AA] max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
          >
            {t.heroSubtitle}
          </motion.p>

          {/* Double CTA avec micro-interactions hover / tap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <motion.div
              whileHover={{
                scale: 1.03,
                boxShadow: "0 0 28px rgba(239, 68, 68, 0.6)",
                transition: { duration: 0.2, ease: "easeOut" },
              }}
              whileTap={{ scale: 0.97, transition: { duration: 0.15 } }}
              className="w-full sm:w-auto rounded-xl"
            >
              <Link
                href="/onboarding"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#EF4444] text-white font-bold shadow-xl shadow-[#EF4444]/30 hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-2 text-base"
              >
                <span>{t.ctaPrimary}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.02,
                borderColor: "rgba(239, 68, 68, 0.5)",
                boxShadow: "0 0 16px rgba(239, 68, 68, 0.2)",
                transition: { duration: 0.2, ease: "easeOut" },
              }}
              whileTap={{ scale: 0.97, transition: { duration: 0.15 } }}
              className="w-full sm:w-auto rounded-xl"
            >
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#18181B] border border-[#27272A] text-white font-semibold hover:bg-[#27272A]/80 transition-all text-base flex items-center justify-center gap-2.5"
              >
                <span>{t.ctaSecondary}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Micro-réassurance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#A1A1AA] mb-14"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#EF4444]" /> {t.microTrust1}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#EF4444]" /> {t.microTrust2}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#EF4444]" /> {t.microTrust3}
            </span>
          </motion.div>
        </motion.div>

        {/* ── MOCKUP DASHBOARD INTERACTIF EN DIRECT AVEC FLOTTEMENT & JAUGES DYNAMIQUES ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-5xl"
        >
          {/* Flottement infini et subtil */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            className="rounded-2xl p-2 bg-gradient-to-b from-[#27272A] to-[#18181B] shadow-2xl shadow-black/90 border border-[#27272A]"
          >
            <div className="bg-[#09090B] rounded-xl p-6 lg:p-8 text-left overflow-hidden relative">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#EF4444]/10 rounded-full blur-3xl pointer-events-none" />

              {/* En-tête Mockup */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-[#27272A]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                    {t.mockDaysLeft}
                  </p>
                  <h3 className="text-3xl font-black text-white flex items-center gap-3 mt-1">
                    {/* Compteur interactif avec transition flip/fade */}
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={simDays}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="inline-block"
                      >
                        {simDays}
                      </motion.span>
                    </AnimatePresence>{" "}
                    {t.mockDaysCount}{" "}
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#10b981]/15 text-[#4ade80] font-bold border border-[#10b981]/30">
                      ✓ {t.mockRhythm}
                    </span>
                  </h3>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                    {t.mockDailyBudget}
                  </p>
                  <p className="text-3xl font-black text-[#4ade80] mt-1">
                    <AnimatedNumber value={dailyBudget} formatter={fmt} /> {selectedCurrency}
                  </p>
                </div>
              </div>

              {/* 3 Cartes Principales de suivi avec stagger, hover lift et jauges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                
                {/* Carte 1 : Dépenses aujourd'hui */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                    boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
                    transition: { duration: 0.25, ease: "easeOut" },
                  }}
                  className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
                >
                  <p className="text-xs text-[#A1A1AA] mb-1 font-medium">{t.mockTodaySpent}</p>
                  <p className="text-2xl font-extrabold text-white">
                    <AnimatedNumber value={dailyBudget * 0.3} formatter={fmt} /> {selectedCurrency}
                  </p>
                  <AnimatedGauge percentage={30} isCritical={false} className="mt-2.5" />
                  <span className="text-[10px] text-[#4ade80] font-semibold block mt-1.5">
                    ✓ {lang === "fr" ? "Sous le quota journalier" : "Well below daily limit"}
                  </span>
                </motion.div>

                {/* Carte 2 : Solde Total */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                    boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
                    transition: { duration: 0.25, ease: "easeOut" },
                  }}
                  className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
                >
                  <p className="text-xs text-[#A1A1AA] mb-1 font-medium">{t.mockTotalBalance}</p>
                  <p className="text-2xl font-extrabold text-white">
                    <AnimatedNumber value={simBalance} formatter={fmt} /> {selectedCurrency}
                  </p>
                  <AnimatedGauge percentage={68} isCritical={false} className="mt-2.5" />
                  <span className="text-[10px] text-[#A1A1AA] block mt-1.5">
                    {t.mockAccounts}
                  </span>
                </motion.div>

                {/* Carte 3 : Santé Budgétaire avec transition critique de couleur */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                    boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
                    transition: { duration: 0.25, ease: "easeOut" },
                  }}
                  className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
                >
                  <p className="text-xs text-[#A1A1AA] mb-1 font-medium">{t.mockSavingsGoal}</p>
                  <p className={`text-2xl font-extrabold transition-colors duration-300 ${
                    isBudgetCritical ? "text-[#EF4444]" : "text-[#10b981]"
                  }`}>
                    {isBudgetCritical ? "28%" : "82%"}
                  </p>
                  <AnimatedGauge
                    percentage={isBudgetCritical ? 28 : 82}
                    isCritical={isBudgetCritical}
                    className="mt-2.5"
                  />
                  <span className={`text-[10px] font-semibold block mt-1.5 transition-colors duration-300 ${
                    isBudgetCritical ? "text-[#EF4444]" : "text-[#10b981]"
                  }`}>
                    {isBudgetCritical
                      ? lang === "fr" ? "Alerte : Risque de fin de mois tendue" : "Alert: Month-end runway at risk"
                      : lang === "fr" ? "Fin de mois sécurisée" : "Month-end runway secured"}
                  </span>
                </motion.div>

              </div>

              {/* Simulateur interactif */}
              <div className="bg-[#18181B]/70 border border-[#27272A] rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A1A1AA]">
                <span className="flex items-center gap-1.5 font-semibold text-[#FAFAFA]">
                  <Sparkles className="w-3.5 h-3.5 text-[#EF4444]" /> {t.mockSimulatorLabel}
                </span>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span>{t.mockAdjustDays}</span>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={simDays}
                    onChange={(e) => setSimDays(Number(e.target.value))}
                    className="accent-[#EF4444] cursor-pointer w-32"
                  />
                  <span className="font-bold text-[#EF4444] w-12 text-right">{simDays} j</span>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. SECTION "DES DÉFIS QUE VOUS CONNAISSEZ" (PANAFRICAIN)
      ════════════════════════════════════════════════════════════════════ */}
      <section id="defis" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto border-t border-[#27272A]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#EF4444] bg-[#EF4444]/10 px-3 py-1 rounded-full border border-[#EF4444]/20">
            {t.defisBadge}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-4 mb-4 text-[#FAFAFA]">
            {t.defisTitle}
          </h2>
          <p className="text-base sm:text-lg text-[#A1A1AA]">
            {t.defisSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Défi 1 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-7 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#EF4444] text-xl font-bold mb-5">
                📱
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.defi1Title}</h3>
              <p className="text-xs text-[#EF4444] font-semibold uppercase tracking-wider mb-3">
                {t.defi1Sub}
              </p>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {t.defi1Desc}
              </p>
            </div>
          </motion.div>

          {/* Défi 2 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-7 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#f59e0b] text-xl font-bold mb-5">
                💸
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.defi2Title}</h3>
              <p className="text-xs text-[#f59e0b] font-semibold uppercase tracking-wider mb-3">
                {t.defi2Sub}
              </p>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {t.defi2Desc}
              </p>
            </div>
          </motion.div>

          {/* Défi 3 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-7 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl font-bold mb-5">
                📉
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.defi3Title}</h3>
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">
                {t.defi3Sub}
              </p>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {t.defi3Desc}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bannière de transition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#EF4444]/15 via-[#18181B] to-[#18181B] border border-[#EF4444]/30 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <h4 className="text-lg font-bold text-white">
              {t.defisTransition}
            </h4>
            <p className="text-xs text-[#A1A1AA] mt-1">
              {lang === "fr"
                ? "Wave, Orange Money, M-Pesa, MTN, Moov, Espèces, Banque : tout est agrégé simplement."
                : "Wave, Orange Money, M-Pesa, MTN, Moov, Cash, Bank: all aggregated in one safe view."}
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href="/onboarding"
              className="px-6 py-3 rounded-xl bg-[#EF4444] text-white font-bold text-sm hover:bg-[#DC2626] transition-colors shrink-0 flex items-center gap-2"
            >
              {lang === "fr" ? "Démarrer maintenant" : "Start now"} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. BENTO GRID DES 4 FONCTIONNALITÉS CLÉS DU MVP
      ════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-[#27272A]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
            {t.bentoTitle}
          </h2>
          <p className="text-[#A1A1AA] text-base">
            {t.bentoSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Bento 1 : Cycle de Paie Intelligent */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.18)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-8 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-[#EF4444]/50 transition-colors group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.bento1Title}</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {t.bento1Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-[#EF4444] font-semibold flex items-center gap-1.5">
              <span>✓ {lang === "fr" ? "Formule : Solde ÷ Jours restants" : "Formula: Balance ÷ Remaining days"}</span>
            </div>
          </motion.div>

          {/* Bento 2 : Saisie Rapide < 3s */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.18)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-8 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-[#EF4444]/50 transition-colors group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.bento2Title}</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {t.bento2Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-[#4ade80] font-semibold flex items-center gap-1.5">
              <span>⚡ {lang === "fr" ? "Sans prise de tête" : "Friction-free tracking"}</span>
            </div>
          </motion.div>

          {/* Bento 3 : Sécurité & Confidentialité */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.18)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-8 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-[#EF4444]/50 transition-colors group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.bento3Title}</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {t.bento3Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-[#38bdf8] font-semibold flex items-center gap-1.5">
              <span>🔒 {lang === "fr" ? "0 identifiant bancaire stocké" : "0 bank credentials stored"}</span>
            </div>
          </motion.div>

          {/* Bento 4 : Visualisation & Santé */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.18)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-8 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-[#EF4444]/50 transition-colors group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-6 group-hover:scale-110 transition-transform">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.bento4Title}</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {t.bento4Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-[#f59e0b] font-semibold flex items-center gap-1.5">
              <span>📊 {lang === "fr" ? "Répartition par catégorie automatique" : "Automatic category breakdown"}</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. SECTION "COMMENT ÇA MARCHE" (30 SECONDES CHRONO)
      ════════════════════════════════════════════════════════════════════ */}
      <section id="how" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto border-t border-[#27272A] bg-[#09090B]/60">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#EF4444] bg-[#EF4444]/10 px-3 py-1 rounded-full border border-[#EF4444]/20">
            {t.howBadge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-4 mb-4 text-white">
            {t.howTitle}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Étape 1 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
          >
            {/* Icône animée à l'entrée (scale, rotate, fade-in) */}
            <motion.div
              initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
              whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-4"
            >
              <Users className="w-5 h-5" />
            </motion.div>
            <h3 className="text-lg font-bold text-white mb-2">{t.step1Title}</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">{t.step1Desc}</p>
          </motion.div>

          {/* Étape 2 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
              whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-4"
            >
              <Wallet className="w-5 h-5" />
            </motion.div>
            <h3 className="text-lg font-bold text-white mb-2">{t.step2Title}</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">{t.step2Desc}</p>
          </motion.div>

          {/* Étape 3 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
              whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-4"
            >
              <Zap className="w-5 h-5" />
            </motion.div>
            <h3 className="text-lg font-bold text-white mb-2">{t.step3Title}</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">{t.step3Desc}</p>
          </motion.div>

          {/* Étape 4 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              y: -4,
              scale: 1.02,
              boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
              whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-4"
            >
              <TrendingUp className="w-5 h-5" />
            </motion.div>
            <h3 className="text-lg font-bold text-white mb-2">{t.step4Title}</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">{t.step4Desc}</p>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. TÉMOIGNAGES PANAFRICAINS GÉOLOCALISÉS
      ════════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto border-t border-[#27272A]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#f59e0b] mb-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-white ml-1">4.9 / 5</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
            {t.testiTitle}
          </h2>
          <p className="text-[#A1A1AA] text-base">{t.testiSubtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {panAfricanTestimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{
                y: -4,
                scale: 1.02,
                boxShadow: "0 12px 30px -10px rgba(239, 68, 68, 0.15)",
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className="p-7 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-[#EF4444]/40 transition-colors"
            >
              <p className="text-sm text-[#FAFAFA] leading-relaxed mb-6 italic">
                "{item.text}"
              </p>
              <div className="pt-4 border-t border-[#27272A] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {item.name} <span>{item.flag}</span>
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">{item.city}</p>
                </div>
                <span className="text-[11px] font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-full">
                  {item.role}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          7. SÉCURITÉ & VIE PRIVÉE
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 lg:px-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-gradient-to-b from-[#18181B] to-[#09090B] border border-[#27272A] p-8 sm:p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-14 h-14 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center mx-auto mb-6 text-[#10b981]"
          >
            <Lock className="w-7 h-7" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            {t.secTitle}
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] max-w-2xl mx-auto mb-8 leading-relaxed">
            {t.secDesc}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-white">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-xl bg-[#09090B] border border-[#27272A]"
            >
              🔒 100% Manuel & Privé
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-xl bg-[#09090B] border border-[#27272A]"
            >
              🛡️ Chiffrement AES-256
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="p-3 rounded-xl bg-[#09090B] border border-[#27272A]"
            >
              💳 Zéro carte bancaire demandée
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          8. FAQ INTERACTIVE AVEC ANIMATION D'ACCORDÉON
      ════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 px-6 lg:px-16 max-w-4xl mx-auto border-t border-[#27272A]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#EF4444] bg-[#EF4444]/10 px-3 py-1 rounded-full border border-[#EF4444]/20">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-4 mb-2">
            {t.faqTitle}
          </h2>
          <p className="text-sm text-[#A1A1AA]">{t.faqSubtitle}</p>
        </motion.div>

        <div className="space-y-4">
          {panAfricanFaqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl bg-[#18181B] border border-[#27272A] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-[#EF4444] transition-colors"
                >
                  <span>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ChevronDown className={`w-5 h-5 ${isOpen ? "text-[#EF4444]" : "text-[#A1A1AA]"}`} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed border-t border-[#27272A]/40">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          9. CTA FINAL (HIGH-CONVERSION) AVEC GLOW & MICRO-INTERACTIONS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-16 max-w-5xl mx-auto text-center relative">
        <div className="absolute left-1/2 -top-24 -translate-x-1/2 w-[600px] h-[350px] bg-[#EF4444]/20 blur-[130px] rounded-full pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-gradient-to-b from-[#18181B] to-[#09090B] border border-[#27272A] p-10 sm:p-16 relative overflow-hidden shadow-2xl"
        >
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6">
            {t.ctaFinalTitle}
          </h2>
          <p className="text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.ctaFinalSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div
              whileHover={{
                scale: 1.03,
                boxShadow: "0 0 28px rgba(239, 68, 68, 0.6)",
                transition: { duration: 0.2, ease: "easeOut" },
              }}
              whileTap={{ scale: 0.97, transition: { duration: 0.15 } }}
              className="w-full sm:w-auto rounded-xl"
            >
              <Link
                href="/onboarding"
                className="w-full sm:w-auto px-9 py-4 rounded-xl text-base font-bold text-white bg-[#EF4444] hover:bg-[#dc2626] shadow-xl shadow-[#EF4444]/30 transition-colors flex items-center justify-center gap-2 group"
              >
                <span>{t.ctaFinalBtn}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.02,
                borderColor: "rgba(239, 68, 68, 0.5)",
                boxShadow: "0 0 16px rgba(239, 68, 68, 0.2)",
                transition: { duration: 0.2, ease: "easeOut" },
              }}
              whileTap={{ scale: 0.97, transition: { duration: 0.15 } }}
              className="w-full sm:w-auto rounded-xl"
            >
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] transition-all flex items-center justify-center"
              >
                {t.ctaFinalDemo}
              </Link>
            </motion.div>
          </div>

          <p className="text-xs text-[#71717A] mt-6">
            ✓ 100% {lang === "fr" ? "Gratuit" : "Free"} · {lang === "fr" ? "Zéro carte bancaire" : "No credit card"} · {lang === "fr" ? "Prêt en 30 secondes" : "Ready in 30 seconds"}
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          10. FOOTER PANAFRICAIN
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#27272A] py-12 px-6 lg:px-16 text-xs text-[#A1A1AA]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo Footer redirigeant vers la section Hero */}
          <Link
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              const heroEl = document.getElementById("hero");
              if (heroEl) {
                heroEl.scrollIntoView({ behavior: "smooth" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center gap-3 group cursor-pointer"
            title={lang === "fr" ? "Retour au début" : "Back to top"}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="w-8 h-8 rounded-lg overflow-hidden bg-[#18181B] border border-[#27272A] shadow-sm flex items-center justify-center shrink-0 group-hover:border-[#EF4444]/60 transition-colors"
            >
              <Image
                src="/icons/logo.png"
                alt="GestFiPro"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </motion.div>
            <div>
              <span className="text-sm font-bold text-white group-hover:text-white transition-colors">
                GestFi<span className="text-[#EF4444]">Pro</span>
              </span>
              <p className="text-[11px] text-[#71717A]">
                {lang === "fr"
                  ? "Gestion financière par cycle de paie en Afrique"
                  : "Pay-cycle financial management across Africa"}
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">
              {lang === "fr" ? "Fonctionnalités" : "Features"}
            </a>
            <a href="#defis" className="hover:text-white transition-colors">
              {lang === "fr" ? "Le Problème" : "The Problem"}
            </a>
            <a href="#how" className="hover:text-white transition-colors">
              {lang === "fr" ? "Comment ça marche" : "How it works"}
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <Link href="/guide" className="hover:text-white transition-colors">
              Guide
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              {lang === "fr" ? "Connexion" : "Login"}
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              {lang === "fr" ? "Application" : "Dashboard"}
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#27272A]/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71717A]">
          <p>© 2026 GestFiPro. {lang === "fr" ? "Tous droits réservés. Pensé pour une liberté financière universelle." : "All rights reserved. Designed for financial peace of mind."}</p>
          <p>
            🇨🇮 Côte d'Ivoire · 🇸🇳 Sénégal · 🇳🇬 Nigeria · 🇰🇪 Kenya · 🇿🇦 South Africa · 🇨🇲 Cameroun · 🇬🇭 Ghana · 🇲🇱 Mali
          </p>
        </div>
      </footer>
    </div>
  );
}