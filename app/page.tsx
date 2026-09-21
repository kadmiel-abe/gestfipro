"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
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
  Building2,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Plus,
  Quote,
  Menu,
  X,
  Mail,
  ShieldCheck,
  ExternalLink,
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
          isCritical ? "bg-[#EF4444]" : "bg-[#FAFAFA]"
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

// ── VARIANTES D'ANIMATION AU SCROLL PROFESSIONNELLES & FLUIDES (STYLE APPLE / LINEAR) ──
const smoothEase = [0.22, 1, 0.36, 1] as const;

// Conteneur en cascade pour déclencher les enfants au défilement
const scrollStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

// En-têtes de section (Badge -> Titre H2/H1 -> Sous-titre descriptif)
const scrollTextFadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: smoothEase,
    },
  },
};

// Cartes interactives au scroll avec micro-échelle fluide et rebond amorti
const scrollCardItem = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: smoothEase,
    },
  },
};

// Badge / Éléments flottants au scroll
const scrollBadgeItem = {
  hidden: { opacity: 0, scale: 0.9, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: smoothEase,
    },
  },
};

export default function GestFiProPanAfricanLanding() {
  const [lang, setLang] = useState<Language>("fr");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("XOF");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // ── MOBILE MENU: BODY SCROLL LOCK ─────────────────────────────────────────
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }
    return () => document.body.classList.remove("mobile-menu-open");
  }, [mobileMenuOpen]);

  // ── MOBILE MENU: FOCUS TRAP & KEYBOARD HANDLING ──────────────────────────
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        hamburgerBtnRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && mobileMenuRef.current) {
        const focusableElements = mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Auto-focus first link when menu opens
    requestAnimationFrame(() => {
      const firstLink = mobileMenuRef.current?.querySelector<HTMLElement>("a[href]");
      firstLink?.focus();
    });

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    hamburgerBtnRef.current?.focus();
  }, []);

  // Parallax global du Hero
  const { scrollY } = useScroll();
  const heroHaloY = useTransform(scrollY, [0, 800], [0, 140]);
  const heroTextY = useTransform(scrollY, [0, 600], [0, -20]);

  // ── SCROLL 3D PERSPECTIVE ANIMATION DU DASHBOARD MOCKUP ───────────────────
  const dashboardContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: dashboardScroll } = useScroll({
    target: dashboardContainerRef,
    offset: ["start end", "end start"],
  });

  const rotateXScroll = useTransform(dashboardScroll, [0, 0.45, 0.85, 1], [14, 0, 0, -6]);
  const scaleScroll = useTransform(dashboardScroll, [0, 0.45, 0.85, 1], [0.92, 1.0, 1.0, 0.96]);
  const opacityScroll = useTransform(dashboardScroll, [0, 1], [1.0, 1.0]); // 100% visible et opaque

  const smoothRotateX = useSpring(rotateXScroll, { stiffness: 110, damping: 24, restDelta: 0.001 });
  const smoothScale = useSpring(scaleScroll, { stiffness: 110, damping: 24, restDelta: 0.001 });
  const smoothOpacity = useSpring(opacityScroll, { stiffness: 110, damping: 24, restDelta: 0.001 });

  // Parallaxe des badges 3D flottants
  const badge1Y = useTransform(dashboardScroll, [0, 1], [40, -45]);
  const badge2Y = useTransform(dashboardScroll, [0, 1], [60, -35]);
  const badge3Y = useTransform(dashboardScroll, [0, 1], [-25, 35]);

  // ── SURVOL 3D INTERACTIF & SPOTLIGHT LUMINEUX (HOVER MOTION) ──────────────
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useMotionValue(200);
  const spotlightY = useMotionValue(150);
  const [isHovered, setIsHovered] = useState(false);

  const mouseSpringX = useSpring(mouseX, { stiffness: 140, damping: 20 });
  const mouseSpringY = useSpring(mouseY, { stiffness: 140, damping: 20 });

  const tiltRotateX = useTransform(mouseSpringY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const tiltRotateY = useTransform(mouseSpringX, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleDashboardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
    spotlightX.set(e.clientX - rect.left);
    spotlightY.set(e.clientY - rect.top);
    if (!isHovered) setIsHovered(true);
  };

  const handleDashboardMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  // Simulateur interactif
  const [simDays, setSimDays] = useState(12);
  const [simBalance, setSimBalance] = useState<number>(CURRENCIES["XOF"].defaultBalance);
  const [spentToday, setSpentToday] = useState<number>(4500);
  const [quickInput, setQuickInput] = useState<string>("");
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterToast, setNewsletterToast] = useState<string | null>(null);

  const handleCurrencyChange = (curr: Currency) => {
    setSelectedCurrency(curr);
    setSimBalance(CURRENCIES[curr].defaultBalance);
  };

  const dailyBudget = simDays > 0 ? Math.round(simBalance / simDays) : 0;
  const isBudgetCritical = simDays <= 4 || dailyBudget < 2000;

  const fmt = (n: number) => Math.round(n).toLocaleString(lang === "fr" ? "fr-FR" : "en-US");

  // Date dynamique
  const currentDateStr = "Lundi 14 Septembre";

  // Saisie rapide interactive
  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;

    const match = text.match(/\d+/);
    const amount = match ? parseInt(match[0], 10) : 3000;
    
    setSpentToday((prev) => prev + amount);
    setSimBalance((prev) => Math.max(0, prev - amount));
    setQuickInput("");
    setFeedbackToast(`+ ${fmt(amount)} ${selectedCurrency} ${lang === "fr" ? "enregistré !" : "logged!"}`);

    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) return;
    setNewsletterToast(
      lang === "fr"
        ? "Merci pour votre inscription ! À très bientôt."
        : "Thank you for subscribing! See you soon."
    );
    setNewsletterEmail("");
    setTimeout(() => {
      setNewsletterToast(null);
    }, 4000);
  };

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

  // ── TÉMOIGNAGES PANAFRICAINS AVEC AVATARS RÉELS & ANNEAUX COLORÉS ──────────
  const testimonialsRow1 = [
    {
      name: "Emmanuel Okafor",
      city: "Lagos, Nigeria",
      flag: "🇳🇬",
      avatar: "/avatars/avatar_emmanuel.jpg",
      ringColor: "#EF4444",
      role: lang === "fr" ? "Directeur Commercial" : "Senior Consultant",
      stars: 5,
      verified: true,
      text:
        lang === "fr"
          ? "Le calcul automatique de mon budget journalier a changé ma vie. Je sais exactement ce que je peux dépenser chaque jour sans me retrouver à sec avant la paie."
          : "The automatic daily budget calculation completely changed my life. I know exactly what I can spend daily without running dry before payday.",
    },
    {
      name: "Moussa Coulibaly",
      city: "Abidjan, Côte d'Ivoire",
      flag: "🇨🇮",
      avatar: "/avatars/avatar_moussa.jpg",
      ringColor: "#DC2626",
      role: lang === "fr" ? "Cadre Commercial" : "Sales Executive",
      stars: 5,
      verified: true,
      text:
        lang === "fr"
          ? "Avant, le 15 du mois j'étais déjà à découvert sans savoir pourquoi. Avec GestFiPro et mon budget/jour en direct, je termine le mois avec plus de 50 000 FCFA d'épargne."
          : "Before, by the 15th I was already overspent without knowing why. With GestFiPro and my live daily budget, I finish each month saving over 50,000 FCFA.",
    },
    {
      name: "Fatou Diallo",
      city: "Dakar, Sénégal",
      flag: "🇸🇳",
      avatar: "/avatars/avatar_fatou.jpg",
      ringColor: "#FAFAFA",
      role: lang === "fr" ? "Directrice Marketing" : "Marketing Director",
      stars: 5,
      verified: true,
      text:
        lang === "fr"
          ? "Je centralise Wave, Orange Money et mes espèces en 3 secondes après chaque achat. Zéro mot de passe bancaire requis, une confidentialité totale !"
          : "I log my Wave, Orange Money and cash in 3 seconds after every purchase. Zero bank passwords needed, total privacy!",
    },
    {
      name: "David Ochieng",
      city: "Nairobi, Kenya",
      flag: "🇰🇪",
      avatar: "/avatars/avatar_david.jpg",
      ringColor: "#EF4444",
      role: lang === "fr" ? "Développeur Logiciel" : "Software Engineer",
      stars: 5,
      verified: true,
      text:
        lang === "fr"
          ? "Je gère mon compte M-Pesa et mon compte bancaire KES en même temps. Le compte à rebours jusqu'au jour de paie a transformé ma gestion financière !"
          : "Managing my M-Pesa and local KES bank account together in one view is a game changer. The payday countdown completely transformed how I budget.",
    },
  ];

  const testimonialsRow2 = [
    {
      name: "Chidinma Nwosu",
      city: "Lagos, Nigeria",
      flag: "🇳🇬",
      avatar: "/avatars/avatar_chidinma.jpg",
      ringColor: "#EF4444",
      role: lang === "fr" ? "Comptable Senior" : "Senior Accountant",
      stars: 5,
      verified: true,
      text:
        lang === "fr"
          ? "Avec l'inflation et les fluctuations en Naira, savoir exactement combien je peux dépenser par jour est une bénédiction. 100% hors connexion bancaire."
          : "With Naira fluctuations, knowing exactly how much I can safely spend each day is a lifesaver. Zero bank login needed, 100% private.",
    },
    {
      name: "Kofi Mensah",
      city: "Accra, Ghana",
      flag: "🇬🇭",
      avatar: "/avatars/avatar_kofi.jpg",
      ringColor: "#DC2626",
      role: lang === "fr" ? "Entrepreneur Fintech" : "Fintech Founder",
      stars: 5,
      verified: true,
      text:
        lang === "fr"
          ? "L'interface est ultra-fluide et réactive. C'est le premier outil pensé spécifiquement pour les habitudes de paiement et cycles de paie en Afrique."
          : "The interface is ultra-slick and responsive. The first tool genuinely designed for African payment habits and pay cycles.",
    },
    {
      name: "Amina Sow",
      city: "Bamako, Mali",
      flag: "🇲🇱",
      avatar: "/avatars/avatar_fatou.jpg",
      ringColor: "#FAFAFA",
      role: lang === "fr" ? "Responsable RH" : "HR Manager",
      stars: 5,
      verified: true,
      text:
        lang === "fr"
          ? "J'ai recommandé GestFiPro à toute mon équipe. Plus aucun stress avant le virement de fin de mois grâce à la jauge de santé financière !"
          : "I recommended GestFiPro to my whole team. No more pre-payday anxiety thanks to the financial health gauge!",
    },
    {
      name: "Jean-Luc Bakayoko",
      city: "Yamoussoukro, CI",
      flag: "🇨🇮",
      avatar: "/avatars/avatar_emmanuel.jpg",
      ringColor: "#EF4444",
      role: lang === "fr" ? "Ingénieur Réseaux" : "Telecom Engineer",
      stars: 5,
      verified: true,
      text:
        lang === "fr"
          ? "Visualiser mes soldes Wave, Moov et Orange Money sur un seul tableau de bord me permet de planifier mes dépenses sans aucune mauvaise surprise."
          : "Viewing my Wave, Moov and Orange Money balances in one single dashboard helps me plan expenses with zero surprises.",
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
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-16 py-3 sm:py-4 border-b border-[#27272A]/70 backdrop-blur-xl bg-[#09090B]/85"
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
          className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0"
          title={lang === "fr" ? "Retour au début" : "Back to top"}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-[#18181B] border border-[#27272A] shadow-lg shadow-[#EF4444]/20 group-hover:border-[#EF4444]/60 transition-colors shrink-0 flex items-center justify-center"
          >
            <Image
              src="/logo.png"
              alt="GestFiPro"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </motion.div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-white group-hover:text-white transition-colors">
            GestFi<span className="text-[#EF4444]">Pro</span>
          </span>
        </Link>

        {/* Navigation desktop – visible uniquement au-dessus de lg (1024px) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm text-[#A1A1AA]">
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

        {/* Action Controls : Sélecteur Langue + Devises + Auth + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Sélecteur de Devises Panafricain – hidden below lg */}
          <div className="hidden lg:flex items-center bg-[#18181B] border border-[#27272A] rounded-xl px-2 py-1 text-xs">
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

          {/* Liens Auth – hidden below lg */}
          <Link
            href="/login"
            className="hidden lg:inline-block text-sm font-semibold text-[#A1A1AA] hover:text-white transition-colors px-2 py-1"
          >
            {lang === "fr" ? "Connexion" : "Sign In"}
          </Link>
          <motion.div
            whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(239, 68, 68, 0.55)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="hidden sm:inline-block rounded-xl"
          >
            <Link
              href="/onboarding"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#EF4444] text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:bg-[#DC2626] transition-colors flex items-center gap-1.5"
            >
              <span>{lang === "fr" ? "Commencer" : "Get Started"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* ── HAMBURGER BUTTON (mobile + tablet < 1024px) ── */}
          <button
            ref={hamburgerBtnRef}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`lg:hidden flex flex-col items-center justify-center gap-[5px] w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/50 transition-colors ${
              mobileMenuOpen ? "hamburger-open" : ""
            }`}
            aria-label={mobileMenuOpen ? (lang === "fr" ? "Fermer le menu" : "Close menu") : (lang === "fr" ? "Ouvrir le menu" : "Open menu")}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE NAVIGATION SLIDE-IN PANEL (< 1024px)
      ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mobile-nav-overlay lg:hidden"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />

            {/* Slide-in panel */}
            <motion.div
              ref={mobileMenuRef}
              id="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-label={lang === "fr" ? "Menu de navigation" : "Navigation menu"}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="mobile-nav-panel lg:hidden"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A]">
                <span className="text-lg font-bold text-white">
                  GestFi<span className="text-[#EF4444]">Pro</span>
                </span>
                <button
                  onClick={closeMobileMenu}
                  className="w-9 h-9 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/50 flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors"
                  aria-label={lang === "fr" ? "Fermer le menu" : "Close menu"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col px-5 py-6 gap-1">
                {[
                  { href: "#defis", label: lang === "fr" ? "Le Problème" : "The Problem" },
                  { href: "#features", label: lang === "fr" ? "Fonctionnalités" : "Features" },
                  { href: "#how", label: lang === "fr" ? "Comment ça marche" : "How it works" },
                  { href: "#testimonials", label: lang === "fr" ? "Témoignages" : "Reviews" },
                  { href: "#faq", label: "FAQ" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-[#A1A1AA] hover:text-white hover:bg-[#18181B] transition-all"
                  >
                    <ArrowRight className="w-4 h-4 text-[#EF4444]" />
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Currency selector (mobile) */}
              <div className="px-5 py-3 border-t border-[#27272A]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-2">
                  {lang === "fr" ? "Devise" : "Currency"}
                </p>
                <div className="flex items-center bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm">
                  <Coins className="w-4 h-4 text-[#EF4444] mr-2" />
                  <select
                    value={selectedCurrency}
                    onChange={(e) => { handleCurrencyChange(e.target.value as Currency); }}
                    className="bg-transparent text-white font-bold cursor-pointer outline-none text-sm flex-1"
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
              </div>

              {/* Auth actions (mobile) */}
              <div className="px-5 py-4 mt-auto border-t border-[#27272A] flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="w-full text-center px-4 py-3 rounded-xl text-sm font-semibold text-[#A1A1AA] hover:text-white bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-all"
                >
                  {lang === "fr" ? "Connexion" : "Sign In"}
                </Link>
                <Link
                  href="/onboarding"
                  onClick={closeMobileMenu}
                  className="w-full text-center px-4 py-3 rounded-xl bg-[#EF4444] text-white font-bold text-sm shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-2"
                >
                  <span>{lang === "fr" ? "Commencer" : "Get Started"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          2. HERO SECTION PANAFRICAINE & DYNAMIQUE AVEC MOTION DESIGN
      ════════════════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative pt-8 sm:pt-14 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto text-center scroll-mt-24">
        
        <motion.div
          style={{ y: heroTextY }}
          variants={scrollStaggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge supérieur Panafricain */}
          <motion.div
            variants={scrollBadgeItem}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181B] border border-[#27272A] text-xs font-semibold text-[#A1A1AA] mb-8 hover:border-[#EF4444]/40 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EF4444] animate-pulse" />
            <span>{t.badge}</span>
            <span className="text-sm">🌍</span>
          </motion.div>

          {/* Titre Principal */}
          <motion.h1
            variants={scrollTextFadeUp}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] mb-4 sm:mb-6 text-[#FAFAFA]"
          >
            {t.heroTitle1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EF4444] via-[#f87171] to-rose-400">
              {t.heroTitle2}
            </span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            variants={scrollTextFadeUp}
            className="text-sm sm:text-base md:text-xl text-[#A1A1AA] max-w-3xl mx-auto mb-6 sm:mb-10 leading-relaxed font-normal px-2 sm:px-0"
          >
            {t.heroSubtitle}
          </motion.p>

          {/* Double CTA avec micro-interactions hover / tap */}
          <motion.div
            variants={scrollTextFadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-14 px-2 sm:px-0"
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
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Micro-réassurance */}
          <motion.div
            variants={scrollTextFadeUp}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs text-[#A1A1AA] mb-8 sm:mb-14 px-2 sm:px-0"
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

        {/* ── MOCKUP DASHBOARD INTERACTIF AVEC ANIMATION AU SCROLL 3D & SURVOL GYROSCOPIQUE ── */}
        <div
          ref={dashboardContainerRef}
          onMouseMove={handleDashboardMouseMove}
          onMouseLeave={handleDashboardMouseLeave}
          style={{ perspective: 1400 }}
          className="relative mx-auto max-w-5xl mt-4 sm:mt-6 select-none"
        >
          {/* Halo d'ambiance rouge crimson éclatant pour faire ressortir le dashboard */}
          <div
            className={`absolute -inset-6 bg-gradient-to-r from-[#EF4444]/30 via-[#EF4444]/45 to-[#EF4444]/30 rounded-3xl blur-3xl transition-all duration-500 pointer-events-none ${
              isHovered ? "opacity-100 scale-105" : "opacity-85 scale-100"
            }`}
          />

          {/* ── BADGES FLOTTANTS EN PARALLAXE 3D (AVANT-PLAN) ── */}
          {/* Badge 1 : Flottant Haut-Gauche (Salaire) */}
          <motion.div
            style={{ y: badge1Y, zIndex: 30 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18181B] backdrop-blur-xl border border-[#3F3F46] shadow-2xl shadow-black/90 absolute -top-6 -left-6 text-xs text-white"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping" />
            <span className="font-bold text-white">+{fmt(CURRENCIES[selectedCurrency].defaultBalance * 2)} {selectedCurrency}</span>
            <span className="text-[#A1A1AA] text-[11px] font-medium">{lang === "fr" ? "Salaire reçu" : "Salary detected"}</span>
          </motion.div>

          {/* Badge 2 : Flottant Haut-Droite (Budget / Jour) */}
          <motion.div
            style={{ y: badge2Y, zIndex: 30 }}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18181B] backdrop-blur-xl border border-[#EF4444]/50 shadow-2xl shadow-[#EF4444]/20 absolute -top-5 -right-6 text-xs text-white"
          >
            <Zap className="w-4 h-4 text-[#EF4444]" />
            <span className="font-extrabold text-[#EF4444]">{fmt(dailyBudget)} {selectedCurrency}</span>
            <span className="text-[#A1A1AA] text-[11px] font-medium">/ {lang === "fr" ? "jour autorisé" : "safe day"}</span>
          </motion.div>

          {/* Badge 3 : Flottant Bas-Gauche (Confidentialité) */}
          <motion.div
            style={{ y: badge3Y, zIndex: 30 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18181B] backdrop-blur-xl border border-[#3F3F46] shadow-2xl shadow-black/90 absolute -bottom-5 -left-4 text-xs text-[#A1A1AA]"
          >
            <Shield className="w-3.5 h-3.5 text-[#EF4444]" />
            <span className="text-[11px] font-medium text-white">100% {lang === "fr" ? "Manuel & Privé" : "Manual & Private"}</span>
            <span className="text-[10px] text-[#71717A]">· {lang === "fr" ? "0 carte bancaire" : "0 bank link"}</span>
          </motion.div>

          {/* ── CADRE PRINCIPAL 3D DU DASHBOARD AVEC SCROLL PERSPECTIVE & SURVOL SOURIS ── */}
          <motion.div
            style={{
              rotateX: isHovered ? tiltRotateX : smoothRotateX,
              rotateY: isHovered ? tiltRotateY : 0,
              scale: smoothScale,
              opacity: 1, // 100% visible et opaque
              transformStyle: "preserve-3d",
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative rounded-2xl sm:rounded-3xl bg-[#09090B] border-2 border-[#3F3F46]/80 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.95),0_0_45px_rgba(239,68,68,0.2)] overflow-hidden text-left transition-all duration-300 hover:border-[#EF4444]"
          >
            {/* Effet Spotlight interactif suivant la souris */}
            {isHovered && (
              <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl sm:rounded-3xl opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(700px circle at ${spotlightX.get()}px ${spotlightY.get()}px, rgba(239, 68, 68, 0.2), transparent 60%)`,
                }}
              />
            )}

            {/* ══ TOP BAR DE TYPE APPLICATION SAAS / MACOS ════════════════════ */}
            <div className="h-10 bg-[#121216] border-b border-[#27272A] px-4 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-[#DC2626]/60 cursor-pointer" />
                <span className="w-3 h-3 rounded-full bg-[#3F3F46] border border-[#52525B]/60 cursor-pointer" />
                <span className="w-3 h-3 rounded-full bg-[#27272A] border border-[#3F3F46]/60 cursor-pointer" />
                <span className="ml-3 text-[11px] font-semibold text-[#71717A] tracking-wider uppercase hidden sm:inline-block">
                  GestFiPro · Cycle de Paie Panafricain v2.4
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                <span className="text-[11px] font-medium text-[#A1A1AA]">
                  {lang === "fr" ? "Données synchronisées en temps réel" : "Live real-time calculation"}
                </span>
              </div>
            </div>

            {/* ══ 1. HEADER DU DASHBOARD MOCKUP ══════════════════════════════ */}
            <div className="p-5 sm:p-6 pb-4 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-[#18181B]/70 to-transparent relative z-10">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
                  {lang === "fr" ? "Bonjour Kadmiel" : "Hello Kadmiel"}{" "}
                  <span className="inline-block animate-bounce">👋</span>
                </h3>
                <p className="text-xs font-medium text-[#A1A1AA] mt-1">
                  {currentDateStr} · {lang === "fr" ? "Suivi budgétaire en temps réel" : "Live pay cycle tracking"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Badge animé rouge "● Cycle actif (J-XX)" */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs font-semibold text-[#EF4444] shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                  <span>{lang === "fr" ? `Cycle actif (J-${simDays})` : `Active cycle (D-${simDays})`}</span>
                </div>

                {/* Bouton + Nouvelle dépense */}
                <button
                  type="button"
                  onClick={() => {
                    setQuickInput("Déjeuner 3500");
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-[#EF4444]/25 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === "fr" ? "Tester saisie" : "Quick log"}</span>
                </button>
              </div>
            </div>

            {/* ══ 2. GRILLE PRINCIPALE (CARTE CYCLE + KPIS + COURBE SVG) ═══════ */}
            <div className="p-5 sm:p-6 space-y-5 relative z-10">
              
              {/* Carte Phare : Cycle de Paie et Budget Journalier */}
              <div className="rounded-2xl bg-[#18181B] border border-[#EF4444]/35 p-5 relative overflow-hidden shadow-lg shadow-black/40">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#EF4444]/15 via-transparent to-transparent pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold tracking-tight text-[#FAFAFA]">
                        {lang === "fr" ? "Cycle de Paie Intelligent" : "Smart Pay Cycle"}
                      </h4>
                      <p className="text-[11px] font-medium text-[#A1A1AA]">
                        {lang === "fr" ? "Versement prévu le 28 du mois" : "Next payout scheduled on 28th"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] bg-[#09090B] px-2.5 py-1 rounded-md border border-[#27272A]">
                    {lang === "fr" ? "Septembre 2026" : "September 2026"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Compteur interactif jours restants */}
                  <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                        {t.mockDaysLeft}
                      </span>
                      <Clock className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={simDays}
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="text-4xl font-extrabold tracking-tight tabular-nums text-[#FAFAFA]"
                        >
                          {simDays}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-xs font-semibold text-[#A1A1AA]">
                        {t.mockDaysCount}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-medium text-[#71717A] mb-1.5">
                        <span>{lang === "fr" ? `Jour ${30 - simDays} sur 30` : `Day ${30 - simDays} of 30`}</span>
                        <span>{Math.round(((30 - simDays) / 30) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#27272A] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#EF4444] to-[#F87171]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${Math.round(((30 - simDays) / 30) * 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Budget quotidien autorisé */}
                  <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                        {t.mockDailyBudget}
                      </span>
                      <Zap className="w-3.5 h-3.5 text-[#EF4444]" />
                    </div>

                    <div className="mb-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums transition-colors duration-300 ${
                          isBudgetCritical ? "text-[#EF4444]" : "text-[#FAFAFA]"
                        }`}>
                          <AnimatedNumber value={dailyBudget} formatter={fmt} />
                        </span>
                        <span className="text-xs font-semibold text-[#A1A1AA]">
                          {selectedCurrency} / {lang === "fr" ? "jour" : "day"}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-[#A1A1AA] mt-1">
                        ({fmt(simBalance)} ÷ {simDays} {lang === "fr" ? "jours" : "days"})
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#27272A]">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors duration-300 ${
                        isBudgetCritical
                          ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                          : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isBudgetCritical ? (lang === "fr" ? "Rythme serré" : "Tight runway") : t.mockRhythm}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grille 3 Cartes KPIs avec élévation 3D au survol */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* KPI 1 : Dépenses du jour */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
                >
                  <p className="text-xs text-[#A1A1AA] mb-1 font-medium">{t.mockTodaySpent}</p>
                  <p className="text-2xl font-extrabold text-white">
                    <AnimatedNumber value={spentToday} formatter={fmt} /> {selectedCurrency}
                  </p>
                  <AnimatedGauge percentage={Math.min((spentToday / (dailyBudget || 1)) * 100, 100)} isCritical={spentToday > dailyBudget} className="mt-2.5" />
                  <span className="text-[10px] text-[#A1A1AA] font-semibold block mt-1.5">
                    <span className="text-[#EF4444] font-bold">✓</span> {lang === "fr" ? "Sous le quota journalier" : "Within safe daily limit"}
                  </span>
                </motion.div>

                {/* KPI 2 : Solde Total Consolidé */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
                >
                  <p className="text-xs text-[#A1A1AA] mb-1 font-medium">{t.mockTotalBalance}</p>
                  <p className="text-2xl font-extrabold text-white">
                    <AnimatedNumber value={simBalance} formatter={fmt} /> {selectedCurrency}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#27272A] text-[#A1A1AA] font-semibold">Wave</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#27272A] text-[#A1A1AA] font-semibold">OM</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#27272A] text-[#A1A1AA] font-semibold">Cash</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#27272A] text-[#A1A1AA] font-semibold">Banque</span>
                  </div>
                </motion.div>

                {/* KPI 3 : Santé Budgétaire */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 transition-colors"
                >
                  <p className="text-xs text-[#A1A1AA] mb-1 font-medium">{t.mockSavingsGoal}</p>
                  <p className={`text-2xl font-extrabold transition-colors duration-300 ${
                    isBudgetCritical ? "text-[#EF4444]" : "text-[#FAFAFA]"
                  }`}>
                    {isBudgetCritical ? "28%" : "82%"}
                  </p>
                  <AnimatedGauge percentage={isBudgetCritical ? 28 : 82} isCritical={isBudgetCritical} className="mt-2.5" />
                  <span className={`text-[10px] font-semibold block mt-1.5 transition-colors duration-300 ${
                    isBudgetCritical ? "text-[#EF4444]" : "text-[#A1A1AA]"
                  }`}>
                    {isBudgetCritical
                      ? (lang === "fr" ? "Alerte : Fin de mois tendue" : "Alert: Low runway")
                      : (lang === "fr" ? "Fin de mois sécurisée" : "Month-end runway secured")}
                  </span>
                </motion.div>

              </div>

              {/* ── COURBE SVG D'ÉVOLUTION DE LA TRÉSORERIE ── */}
              <div className="p-4 rounded-2xl bg-[#18181B] border border-[#27272A] relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#EF4444]" />
                    <span className="text-xs font-bold text-white">
                      {lang === "fr" ? "Projection de trésorerie sur le cycle" : "Cashflow forecast over pay cycle"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/30">
                    +15% {lang === "fr" ? "d'épargne projetée" : "projected savings"}
                  </span>
                </div>

                <div className="h-16 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 420 70" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroCashflowGradLanding" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                        <stop offset="80%" stopColor="#EF4444" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="18" x2="420" y2="18" stroke="#27272A" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
                    <line x1="0" y1="45" x2="420" y2="45" stroke="#27272A" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
                    <path d="M 0,35 Q 70,25 140,40 T 235,22 T 340,45 L 420,55 L 420,70 L 0,70 Z" fill="url(#heroCashflowGradLanding)" />
                    <path d="M 0,35 Q 70,25 140,40 T 235,22 T 340,45 L 420,55" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="235" cy="22" r="6" fill="#EF4444" opacity="0.3" className="animate-ping" />
                    <circle cx="235" cy="22" r="4" fill="#FFFFFF" stroke="#EF4444" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* ── SIMULATEUR EN DIRECT & TEST SAISIE RAPIDE ── */}
              <div className="bg-[#121216] border border-[#27272A] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Curseur jours */}
                <div className="flex items-center gap-3 w-full sm:w-auto text-xs text-[#A1A1AA]">
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#EF4444]" /> {t.mockSimulatorLabel}
                  </span>
                  <span>{t.mockAdjustDays}</span>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={simDays}
                    onChange={(e) => setSimDays(Number(e.target.value))}
                    className="accent-[#EF4444] cursor-pointer w-28"
                  />
                  <span className="font-bold text-[#EF4444] w-10 text-right">{simDays} j</span>
                </div>

                {/* Formulaire de saisie rapide interactif */}
                <form onSubmit={handleQuickSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder={lang === "fr" ? "ex: taxi 2000, riz 3500..." : "e.g. lunch 3500, fuel 5000..."}
                    className="bg-[#09090B] border border-[#27272A] focus:border-[#EF4444] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71717A] outline-none transition-colors w-full sm:w-48"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-[#EF4444]/20 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{lang === "fr" ? "Ajouter" : "Add"}</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>

              </div>

              {/* Toast interactif de confirmation */}
              <AnimatePresence>
                {feedbackToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#EF4444] bg-[#EF4444]/10 py-1.5 px-3 rounded-lg border border-[#EF4444]/30 mx-auto w-fit"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{feedbackToast}</span>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. SECTION "DES DÉFIS QUE VOUS CONNAISSEZ" (PANAFRICAIN)
      ════════════════════════════════════════════════════════════════════ */}
      <section id="defis" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto border-t border-[#27272A] scroll-mt-20">
        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <motion.span
            variants={scrollBadgeItem}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#EF4444] bg-[#EF4444]/10 px-3.5 py-1 rounded-full border border-[#EF4444]/20"
          >
            {t.defisBadge}
          </motion.span>
          <motion.h2
            variants={scrollTextFadeUp}
            className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mt-4 mb-4 text-[#FAFAFA]"
          >
            {t.defisTitle}
          </motion.h2>
          <motion.p
            variants={scrollTextFadeUp}
            className="text-sm sm:text-base md:text-lg text-[#A1A1AA]"
          >
            {t.defisSubtitle}
          </motion.p>
        </motion.div>

        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          
          {/* Défi 1 */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.015,
              boxShadow: "0 20px 40px -15px rgba(239, 68, 68, 0.22)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/60 transition-all flex flex-col justify-between h-full group cursor-default"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#EF4444] text-xl font-bold mb-4 sm:mb-5 group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                📱
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t.defi1Title}</h3>
              <p className="text-xs text-[#EF4444] font-semibold uppercase tracking-wider mb-2.5">
                {t.defi1Sub}
              </p>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {t.defi1Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#27272A]/60 flex items-center text-[11px] font-semibold text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">
              <span>Wave · Orange Money · M-Pesa · MTN · Cash</span>
            </div>
          </motion.div>

          {/* Défi 2 */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.015,
              boxShadow: "0 20px 40px -15px rgba(239, 68, 68, 0.22)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/60 transition-all flex flex-col justify-between h-full group cursor-default"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] text-xl font-bold mb-4 sm:mb-5 group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                💸
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t.defi2Title}</h3>
              <p className="text-xs text-[#EF4444] font-semibold uppercase tracking-wider mb-2.5">
                {t.defi2Sub}
              </p>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {t.defi2Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#27272A]/60 flex items-center text-[11px] font-semibold text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">
              <span>Micro-dépenses non tracées = découvert</span>
            </div>
          </motion.div>

          {/* Défi 3 */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.015,
              boxShadow: "0 20px 40px -15px rgba(220, 38, 38, 0.22)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] hover:border-[#DC2626]/60 transition-all flex flex-col justify-between h-full group sm:col-span-2 lg:col-span-1 cursor-default"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] text-xl font-bold mb-4 sm:mb-5 group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                📉
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t.defi3Title}</h3>
              <p className="text-xs text-[#DC2626] font-semibold uppercase tracking-wider mb-2.5">
                {t.defi3Sub}
              </p>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {t.defi3Desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#27272A]/60 flex items-center text-[11px] font-semibold text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">
              <span>Stress d'attente du virement de paie</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Bannière de transition */}
        <motion.div
          variants={scrollCardItem}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-8 sm:mt-12 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#EF4444]/15 via-[#18181B] to-[#18181B] border border-[#EF4444]/30 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-xl"
        >
          <div>
            <h4 className="text-base sm:text-lg font-bold text-white">
              {t.defisTransition}
            </h4>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
              {lang === "fr"
                ? "Wave, Orange Money, M-Pesa, MTN, Moov, Espèces, Banque : tout est agrégé simplement."
                : "Wave, Orange Money, M-Pesa, MTN, Moov, Cash, Bank: all aggregated in one safe view."}
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(239, 68, 68, 0.55)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="w-full sm:w-auto shrink-0"
          >
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#EF4444] text-white font-bold text-sm hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-2"
            >
              <span>{lang === "fr" ? "Démarrer maintenant" : "Start now"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. BENTO GRID DES 4 FONCTIONNALITÉS CLÉS DU MVP
      ════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-12 sm:py-24 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto border-t border-[#27272A] scroll-mt-20">
        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <motion.span
            variants={scrollBadgeItem}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#EF4444] bg-[#EF4444]/10 px-3.5 py-1 rounded-full border border-[#EF4444]/20"
          >
            {lang === "fr" ? "Fonctionnalités Panafricaines" : "Pan-African Features"}
          </motion.span>
          <motion.h2
            variants={scrollTextFadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-4 mb-3 text-white"
          >
            {t.bentoTitle}
          </motion.h2>
          <motion.p
            variants={scrollTextFadeUp}
            className="text-sm sm:text-base text-[#A1A1AA]"
          >
            {t.bentoSubtitle}
          </motion.p>
        </motion.div>

        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          
          {/* Bento 1 : Cycle de Paie Intelligent */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.015,
              boxShadow: "0 20px 40px -15px rgba(239, 68, 68, 0.25)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-[#EF4444]/60 transition-all group cursor-default"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-5 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-300">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t.bento1Title}</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {t.bento1Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-[#EF4444] font-semibold flex items-center gap-1.5">
              <span>✓ {lang === "fr" ? "Formule : Solde ÷ Jours restants" : "Formula: Balance ÷ Remaining days"}</span>
            </div>
          </motion.div>

          {/* Bento 2 : Saisie Rapide < 3s */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.015,
              boxShadow: "0 20px 40px -15px rgba(239, 68, 68, 0.25)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-[#EF4444]/60 transition-all group cursor-default"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-5 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-300">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t.bento2Title}</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {t.bento2Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-[#EF4444] font-semibold flex items-center gap-1.5">
              <span>⚡ {lang === "fr" ? "Sans prise de tête ni friction" : "Friction-free tracking"}</span>
            </div>
          </motion.div>

          {/* Bento 3 : Sécurité & Confidentialité */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.015,
              boxShadow: "0 20px 40px -15px rgba(255, 255, 255, 0.15)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-white/40 transition-all group cursor-default"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-5 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-300">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t.bento3Title}</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {t.bento3Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-white font-semibold flex items-center gap-1.5">
              <span>🔒 {lang === "fr" ? "0 identifiant ni mot de passe bancaire" : "0 bank credentials stored"}</span>
            </div>
          </motion.div>

          {/* Bento 4 : Visualisation & Santé */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.015,
              boxShadow: "0 20px 40px -15px rgba(220, 38, 38, 0.25)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between hover:border-[#DC2626]/60 transition-all group cursor-default"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] mb-5 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-300">
                <PieChart className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t.bento4Title}</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {t.bento4Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#27272A] text-xs text-[#DC2626] font-semibold flex items-center gap-1.5">
              <span>📊 {lang === "fr" ? "Alerte de rythme et répartition auto" : "Automatic pace alerts"}</span>
            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. SECTION "COMMENT ÇA MARCHE" (30 SECONDES CHRONO)
      ════════════════════════════════════════════════════════════════════ */}
      <section id="how" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto border-t border-[#27272A] bg-[#09090B]/60 scroll-mt-20">
        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <motion.span
            variants={scrollBadgeItem}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#EF4444] bg-[#EF4444]/10 px-3.5 py-1 rounded-full border border-[#EF4444]/20"
          >
            {t.howBadge}
          </motion.span>
          <motion.h2
            variants={scrollTextFadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-4 mb-3 text-white"
          >
            {t.howTitle}
          </motion.h2>
          <motion.p
            variants={scrollTextFadeUp}
            className="text-xs sm:text-sm text-[#A1A1AA]"
          >
            {lang === "fr" ? "Un parcours guidé ultra-rapide pour démarrer sans friction." : "A quick 4-step workflow to master your money."}
          </motion.p>
        </motion.div>

        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          
          {/* Étape 1 */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.02,
              boxShadow: "0 20px 40px -15px rgba(239, 68, 68, 0.25)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/60 transition-all flex flex-col justify-between h-full group cursor-default"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-0.5 rounded-full border border-[#EF4444]/20">
                  01
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">{t.step1Title}</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">{t.step1Desc}</p>
            </div>
          </motion.div>

          {/* Étape 2 */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.02,
              boxShadow: "0 20px 40px -15px rgba(239, 68, 68, 0.25)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/60 transition-all flex flex-col justify-between h-full group cursor-default"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-0.5 rounded-full border border-[#EF4444]/20">
                  02
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">{t.step2Title}</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">{t.step2Desc}</p>
            </div>
          </motion.div>

          {/* Étape 3 */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.02,
              boxShadow: "0 20px 40px -15px rgba(239, 68, 68, 0.25)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/60 transition-all flex flex-col justify-between h-full group cursor-default"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-0.5 rounded-full border border-[#EF4444]/20">
                  03
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">{t.step3Title}</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">{t.step3Desc}</p>
            </div>
          </motion.div>

          {/* Étape 4 */}
          <motion.div
            variants={scrollCardItem}
            whileHover={{
              y: -6,
              scale: 1.02,
              boxShadow: "0 20px 40px -15px rgba(239, 68, 68, 0.25)",
              transition: { duration: 0.3, ease: smoothEase },
            }}
            className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/60 transition-all flex flex-col justify-between h-full group cursor-default"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-0.5 rounded-full border border-[#EF4444]/20">
                  04
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">{t.step4Title}</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">{t.step4Desc}</p>
            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. TÉMOIGNAGES PANAFRICAINS AVEC AVATARS RÉELS & DÉFILEMENT INFINI
      ════════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-12 sm:py-24 max-w-full overflow-hidden border-t border-[#27272A] relative bg-[#09090B] scroll-mt-20">
        
        {/* En-tête de section */}
        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="text-center max-w-3xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16"
        >
          <motion.div
            variants={scrollBadgeItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs font-bold text-[#EF4444] mb-4"
          >
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#EF4444] text-[#EF4444]" />
              ))}
            </div>
            <span className="text-white ml-1 font-extrabold">4.9 / 5</span>
            <span className="text-[#A1A1AA]">· {lang === "fr" ? "+12 000 salariés actifs" : "+12,000 active users"}</span>
          </motion.div>
          <motion.h2
            variants={scrollTextFadeUp}
            className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white mb-4"
          >
            {t.testiTitle}
          </motion.h2>
          <motion.p
            variants={scrollTextFadeUp}
            className="text-[#A1A1AA] text-sm sm:text-base md:text-lg max-w-2xl mx-auto"
          >
            {t.testiSubtitle}
          </motion.p>
        </motion.div>

        {/* ── MASQUES DE DÉGRADÉ GAUCHE / DROITE POUR INFINITY EFFECT ── */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-36 md:w-48 bg-gradient-to-r from-[#09090B] via-[#09090B]/80 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-36 md:w-48 bg-gradient-to-l from-[#09090B] via-[#09090B]/80 to-transparent z-20" />

        {/* ── DUAL MARQUEE CONTAINER ── */}
        <div className="flex flex-col gap-5 sm:gap-6 w-full select-none pause-hover">
          
          {/* ══ LIGNE 1 : DÉFILEMENT DE DROITE VERS GAUCHE (LEFTWARD) ══ */}
          <div className="flex overflow-hidden relative w-full">
            <div className="animate-marquee-left flex gap-4 sm:gap-6">
              {[...testimonialsRow1, ...testimonialsRow1, ...testimonialsRow1, ...testimonialsRow1].map((item, idx) => (
                <div
                  key={`row1-${idx}`}
                  className="w-[280px] sm:w-[350px] md:w-[400px] shrink-0 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#18181B]/90 backdrop-blur-xl border border-[#27272A] hover:border-[#EF4444]/60 hover:shadow-2xl hover:shadow-[#EF4444]/15 transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Note étoiles + Badge vérifié */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-1">
                      {[...Array(item.stars)].map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-[#EF4444] text-[#EF4444]" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/25">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{lang === "fr" ? "Vérifié" : "Verified"}</span>
                    </span>
                  </div>

                  {/* Avis utilisateur */}
                  <p className="text-xs sm:text-sm text-[#FAFAFA] leading-relaxed mb-5 font-normal">
                    "{item.text}"
                  </p>

                  {/* Utilisateur : Avatar avec visage visible + Anneau coloré + Métadonnées */}
                  <div className="pt-3.5 border-t border-[#27272A] flex items-center gap-3">
                    <div
                      className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${item.ringColor}, ${item.ringColor}80)`,
                        boxShadow: `0 0 14px ${item.ringColor}30`,
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#18181B] relative">
                        <Image
                          src={item.avatar}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                        <span>{item.name}</span>
                        <span className="text-sm">{item.flag}</span>
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#A1A1AA] mt-0.5">
                        <span className="truncate">{item.city}</span>
                        <span>·</span>
                        <span className="text-[11px] font-medium text-[#EF4444] truncate">{item.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ LIGNE 2 : DÉFILEMENT DE GAUCHE VERS DROITE (RIGHTWARD) ══ */}
          <div className="flex overflow-hidden relative w-full">
            <div className="animate-marquee-right flex gap-4 sm:gap-6">
              {[...testimonialsRow2, ...testimonialsRow2, ...testimonialsRow2, ...testimonialsRow2].map((item, idx) => (
                <div
                  key={`row2-${idx}`}
                  className="w-[280px] sm:w-[350px] md:w-[400px] shrink-0 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#18181B]/90 backdrop-blur-xl border border-[#27272A] hover:border-[#EF4444]/60 hover:shadow-2xl hover:shadow-[#EF4444]/15 transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Note étoiles + Badge vérifié */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-1">
                      {[...Array(item.stars)].map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-[#EF4444] text-[#EF4444]" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/25">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{lang === "fr" ? "Vérifié" : "Verified"}</span>
                    </span>
                  </div>

                  {/* Avis utilisateur */}
                  <p className="text-xs sm:text-sm text-[#FAFAFA] leading-relaxed mb-5 font-normal">
                    "{item.text}"
                  </p>

                  {/* Utilisateur : Avatar avec visage visible + Anneau coloré + Métadonnées */}
                  <div className="pt-3.5 border-t border-[#27272A] flex items-center gap-3">
                    <div
                      className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${item.ringColor}, ${item.ringColor}80)`,
                        boxShadow: `0 0 14px ${item.ringColor}30`,
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#18181B] relative">
                        <Image
                          src={item.avatar}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                        <span>{item.name}</span>
                        <span className="text-sm">{item.flag}</span>
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#A1A1AA] mt-0.5">
                        <span className="truncate">{item.city}</span>
                        <span>·</span>
                        <span className="text-[11px] font-medium text-[#EF4444] truncate">{item.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          7. SÉCURITÉ & VIE PRIVÉE
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-16 max-w-5xl mx-auto">
        <motion.div
          variants={scrollCardItem}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#18181B] to-[#09090B] border border-[#27272A] p-5 sm:p-8 md:p-12 text-center shadow-2xl"
        >
          <motion.div
            variants={scrollBadgeItem}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center mx-auto mb-5 sm:mb-6 text-[#EF4444] shadow-lg shadow-[#EF4444]/20"
          >
            <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
          </motion.div>
          <motion.h2
            variants={scrollTextFadeUp}
            className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3"
          >
            {t.secTitle}
          </motion.h2>
          <motion.p
            variants={scrollTextFadeUp}
            className="text-xs sm:text-sm md:text-base text-[#A1A1AA] max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            {t.secDesc}
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs font-semibold text-white">
            <motion.div
              whileHover={{ scale: 1.03, borderColor: "rgba(239, 68, 68, 0.5)", transition: { duration: 0.2 } }}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#09090B] border border-[#27272A] flex items-center justify-center gap-2 cursor-default transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#EF4444]" />
              <span>100% Manuel & Privé</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, borderColor: "rgba(239, 68, 68, 0.5)", transition: { duration: 0.2 } }}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#09090B] border border-[#27272A] flex items-center justify-center gap-2 cursor-default transition-colors"
            >
              <Lock className="w-4 h-4 text-[#EF4444]" />
              <span>Chiffrement AES-256</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, borderColor: "rgba(239, 68, 68, 0.5)", transition: { duration: 0.2 } }}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#09090B] border border-[#27272A] flex items-center justify-center gap-2 cursor-default transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-[#EF4444]" />
              <span>Zéro carte bancaire requise</span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          8. FAQ INTERACTIVE AVEC ANIMATION D'ACCORDÉON
      ════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-16 max-w-4xl mx-auto border-t border-[#27272A] scroll-mt-20">
        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="text-center mb-10 sm:mb-14"
        >
          <motion.span
            variants={scrollBadgeItem}
            className="inline-block text-xs font-bold uppercase tracking-widest text-[#EF4444] bg-[#EF4444]/10 px-3.5 py-1 rounded-full border border-[#EF4444]/20"
          >
            FAQ
          </motion.span>
          <motion.h2
            variants={scrollTextFadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mt-4 mb-2"
          >
            {t.faqTitle}
          </motion.h2>
          <motion.p
            variants={scrollTextFadeUp}
            className="text-xs sm:text-sm text-[#A1A1AA]"
          >
            {t.faqSubtitle}
          </motion.p>
        </motion.div>

        <motion.div
          variants={scrollStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="space-y-3 sm:space-y-4"
        >
          {panAfricanFaqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <motion.div
                key={i}
                variants={scrollCardItem}
                className="rounded-xl sm:rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#EF4444]/40 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-[#EF4444] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ChevronDown className={`w-5 h-5 shrink-0 ${isOpen ? "text-[#EF4444]" : "text-[#A1A1AA]"}`} />
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
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed border-t border-[#27272A]/40">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          9. CTA FINAL (HIGH-CONVERSION) AVEC GLOW & MICRO-INTERACTIONS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-4 sm:px-6 lg:px-16 max-w-5xl mx-auto text-center relative">
        <div className="absolute left-1/2 -top-24 -translate-x-1/2 w-[600px] h-[350px] bg-[#EF4444]/20 blur-[130px] rounded-full pointer-events-none -z-10" />

        <motion.div
          variants={scrollCardItem}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#18181B] via-[#151518] to-[#09090B] border border-[#27272A] p-6 sm:p-10 md:p-16 relative overflow-hidden shadow-2xl"
        >
          <motion.h2
            variants={scrollTextFadeUp}
            className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white mb-4 sm:mb-6"
          >
            {t.ctaFinalTitle}
          </motion.h2>
          <motion.p
            variants={scrollTextFadeUp}
            className="text-sm sm:text-base md:text-lg text-[#A1A1AA] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            {t.ctaFinalSubtitle}
          </motion.p>

          <motion.div
            variants={scrollTextFadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
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
                className="w-full sm:w-auto px-8 sm:px-9 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold text-white bg-[#EF4444] hover:bg-[#dc2626] shadow-xl shadow-[#EF4444]/30 transition-colors flex items-center justify-center gap-2 group"
              >
                <span>{t.ctaFinalBtn}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform" />
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
                className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-semibold text-white bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] transition-all flex items-center justify-center"
              >
                {t.ctaFinalDemo}
              </Link>
            </motion.div>
          </motion.div>

          <p className="text-[11px] sm:text-xs text-[#71717A] mt-6">
            ✓ 100% {lang === "fr" ? "Gratuit" : "Free"} · {lang === "fr" ? "Zéro carte bancaire" : "No credit card"} · {lang === "fr" ? "Prêt en 30 secondes" : "Ready in 30 seconds"}
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          10. FOOTER PANAFRICAIN OPTIMISÉ, RESPONSIVE & MULTI-COLONNES
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#27272A] bg-gradient-to-b from-[#09090B] to-[#040405] pt-12 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-16 text-xs text-[#A1A1AA]">
        <div className="max-w-7xl mx-auto">
          
          {/* ── BANNIÈRE NEWSLETTER / COMMUNAUTÉ ── */}
          <motion.div
            variants={scrollCardItem}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#18181B] via-[#1f1616] to-[#18181B] border border-[#EF4444]/25 shadow-xl mb-12 sm:mb-16 flex flex-col lg:flex-row items-center justify-between gap-6"
          >
            <div className="text-center lg:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 text-[11px] font-bold text-[#EF4444] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === "fr" ? "Communauté GestFiPro" : "GestFiPro Community"}</span>
              </span>
              <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                {lang === "fr" ? "Recevez nos conseils de paie chaque mois" : "Get smart pay-cycle tips every month"}
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5 leading-relaxed">
                {lang === "fr"
                  ? "Rejoignez plus de 12 000 salariés africains qui maîtrisent leur budget sans stress de fin de mois."
                  : "Join 12,000+ African workers mastering their budget with zero end-of-month stress."}
              </p>
            </div>

            <div className="w-full lg:w-auto">
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full sm:w-auto">
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={lang === "fr" ? "Votre adresse email..." : "Your email address..."}
                    className="w-full sm:w-72 pl-10 pr-4 py-3 rounded-xl bg-[#09090B] border border-[#27272A] focus:border-[#EF4444] text-white text-xs placeholder-[#71717A] outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-lg shadow-[#EF4444]/25 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{lang === "fr" ? "S'inscrire" : "Subscribe"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {newsletterToast && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-semibold text-[#FAFAFA] mt-2 text-center lg:text-left flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>{newsletterToast}</span>
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* ── GRILLE PRINCIPALE DU FOOTER (5 COLONNES) ── */}
          <motion.div
            variants={scrollStaggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 pb-12"
          >
            
            {/* Col 1 : Branding & Statut */}
            <motion.div variants={scrollTextFadeUp} className="sm:col-span-2 md:col-span-3 lg:col-span-1">
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
                className="flex items-center gap-2.5 group cursor-pointer"
                title={lang === "fr" ? "Retour au début" : "Back to top"}
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#18181B] border border-[#27272A] shadow-sm flex items-center justify-center shrink-0 group-hover:border-[#EF4444]/60 transition-colors">
                  <Image
                    src="/logo.png"
                    alt="GestFiPro"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-base font-bold text-white group-hover:text-white transition-colors">
                  GestFi<span className="text-[#EF4444]">Pro</span>
                </span>
              </Link>

              <p className="text-xs text-[#71717A] mt-3 leading-relaxed">
                {lang === "fr"
                  ? "La 1ère plateforme panafricaine de gestion financière par cycle de paie. 100% manuelle, confidentielle et sans liaison bancaire."
                  : "The #1 Pan-African pay-cycle financial platform. 100% manual, confidential with zero banking connection."}
              </p>

              {/* Indicateur Statut système en direct */}
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181B] border border-[#27272A] text-[11px] text-[#A1A1AA]">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                <span>{lang === "fr" ? "Systèmes 100% opérationnels" : "All systems operational"}</span>
              </div>
            </motion.div>

            {/* Col 2 : Produit */}
            <motion.div variants={scrollTextFadeUp}>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                {lang === "fr" ? "Fonctionnalités" : "Product"}
              </p>
              <ul className="space-y-2.5 text-xs text-[#A1A1AA]">
                <li>
                  <a href="#features" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Cycle de paie intelligent" : "Smart pay cycle"}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Saisie rapide < 3s" : "Quick expense log"}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Suivi multi-comptes" : "Multi-account tracking"}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Jauge de santé budgétaire" : "Budget health score"}
                  </a>
                </li>
                <li>
                  <a href="#hero" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Simulateur de budget" : "Live simulator"}
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* Col 3 : Ressources */}
            <motion.div variants={scrollTextFadeUp}>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                {lang === "fr" ? "Ressources" : "Resources"}
              </p>
              <ul className="space-y-2.5 text-xs text-[#A1A1AA]">
                <li>
                  <Link href="/guide" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Guide du salarié" : "User guide"}
                  </Link>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Questions fréquentes (FAQ)" : "FAQ & Help"}
                  </a>
                </li>
                <li>
                  <a href="#defis" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Pourquoi GestFiPro ?" : "Why GestFiPro?"}
                  </a>
                </li>
                <li>
                  <a href="#how" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Comment ça marche" : "How it works"}
                  </a>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Démo interactive" : "Interactive demo"}
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Col 4 : Couverture Panafricaine & Devises */}
            <motion.div variants={scrollTextFadeUp}>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                {lang === "fr" ? "Couverture Afrique" : "Coverage"}
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-[#A1A1AA] mb-4">
                <span className="flex items-center gap-1.5">🇨🇮 Côte d'Ivoire</span>
                <span className="flex items-center gap-1.5">🇸🇳 Sénégal</span>
                <span className="flex items-center gap-1.5">🇳🇬 Nigeria</span>
                <span className="flex items-center gap-1.5">🇰🇪 Kenya</span>
                <span className="flex items-center gap-1.5">🇿🇦 Afrique du Sud</span>
                <span className="flex items-center gap-1.5">🇨🇲 Cameroun</span>
                <span className="flex items-center gap-1.5">🇬🇭 Ghana</span>
                <span className="flex items-center gap-1.5">🇲🇱 Mali</span>
              </div>
              <p className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-1.5">
                {lang === "fr" ? "Devises" : "Currencies"}
              </p>
              <div className="flex flex-wrap gap-1">
                {["XOF", "XAF", "NGN", "KES", "ZAR", "USD"].map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[10px] font-bold text-[#A1A1AA]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Col 5 : Légal & Accès Rapide */}
            <motion.div variants={scrollTextFadeUp}>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                {lang === "fr" ? "Accès & Légal" : "Access & Legal"}
              </p>
              <ul className="space-y-2.5 text-xs text-[#A1A1AA]">
                <li>
                  <Link href="/login" className="hover:text-white hover:translate-x-0.5 inline-block transition-all font-semibold text-[#EF4444]">
                    {lang === "fr" ? "Se connecter" : "Sign In"} →
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {lang === "fr" ? "Créer un compte gratuit" : "Create free account"}
                  </Link>
                </li>
                <li>
                  <span className="text-[#71717A] block">
                    {lang === "fr" ? "Confidentialité souveraine" : "Sovereign privacy"}
                  </span>
                </li>
                <li>
                  <span className="text-[#71717A] block">
                    {lang === "fr" ? "Conditions d'utilisation" : "Terms of service"}
                  </span>
                </li>
                <li>
                  <span className="text-[#71717A] block">
                    {lang === "fr" ? "Sécurité AES-256" : "AES-256 Security"}
                  </span>
                </li>
              </ul>
            </motion.div>

          </motion.div>

          {/* ── BARRE INFÉRIEURE DU FOOTER (SUB-FOOTER) ── */}
          <div className="mt-8 pt-6 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71717A]">
            <p>
              © 2026 GestFiPro. {lang === "fr" ? "Tous droits réservés. Développé pour la liberté financière en Afrique." : "All rights reserved. Designed for financial peace of mind in Africa."}
            </p>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                title={lang === "fr" ? "Remonter en haut" : "Scroll to top"}
              >
                <span>{lang === "fr" ? "Haut de page" : "Back to top"}</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}