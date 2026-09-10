import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Wallet,
  Settings,
  Zap,
  CalendarDays,
  LayoutDashboard,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Guide d'utilisation | GestFiPro",
  description:
    "Apprenez à utiliser GestFiPro de A à Z : configuration des comptes manuels, cycle de paie, budget journalier et saisie des dépenses.",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    icon: <Wallet size={22} color="#6366f1" />,
    iconBg: "#6366f118",
    iconBorder: "#6366f140",
    accentColor: "#6366f1",
    title: "Configurer vos comptes manuels",
    description:
      "GestFiPro fonctionne sans connexion bancaire. Vous saisissez vos soldes manuellement pour garder le contrôle total de vos données.",
    steps: [
      {
        label: "Accéder à l'onglet Comptes",
        detail:
          "Cliquez sur « Comptes » dans la barre latérale. Vous verrez la liste de vos 4 comptes disponibles.",
      },
      {
        label: "Types de comptes supportés",
        detail:
          "Espèces (argent liquide), Wave (mobile money), Orange Money et Banque (compte bancaire classique).",
      },
      {
        label: "Saisir votre solde initial",
        detail:
          "Consultez votre téléphone ou carnet de caisse, puis entrez le montant exact pour chaque compte en FCFA.",
      },
      {
        label: "Solde consolidé automatique",
        detail:
          "La somme de tous vos comptes s'affiche dans l'en-tête du tableau de bord — c'est votre solde total disponible.",
      },
      {
        label: "Mettre à jour un solde",
        detail:
          "À tout moment, cliquez sur l'icône stylo dans l'onglet Comptes pour corriger un solde après un retrait ou dépôt.",
      },
    ],
    tip: {
      icon: "💡",
      text: "Commencez par Wave ou Orange Money — ce sont généralement les comptes les plus actifs pour les transactions quotidiennes en Côte d'Ivoire.",
    },
  },
  {
    number: "02",
    icon: <Settings size={22} color="#f59e0b" />,
    iconBg: "#f59e0b18",
    iconBorder: "#f59e0b40",
    accentColor: "#f59e0b",
    title: "Définir votre salaire et cycle de paie",
    description:
      "La fonctionnalité clé de GestFiPro repose sur votre cycle de paie. Ces paramètres permettent le calcul automatique de votre budget journalier.",
    steps: [
      {
        label: "Aller dans Réglages",
        detail:
          "Cliquez sur « Réglages » (icône engrenage) en bas de la barre latérale pour accéder à vos paramètres.",
      },
      {
        label: "Saisir votre salaire net mensuel",
        detail:
          "Entrez uniquement le montant net réellement perçu chaque mois — pas le salaire brut ni les primes variables.",
      },
      {
        label: "Définir le jour de versement",
        detail:
          "Indiquez le jour du mois où votre salaire est versé (ex: 28 pour les fonctionnaires ivoiriens). Saisissez un chiffre entre 1 et 31.",
      },
      {
        label: "Calcul automatique activé",
        detail:
          "GestFiPro calcule instantanément le nombre de jours restants avant votre prochaine paie et met à jour votre budget journalier.",
      },
    ],
    tip: {
      icon: "⚠️",
      text: "Si vous êtes payé le dernier jour ouvrable du mois, configurez le jour 28 pour avoir une marge de sécurité de 2-3 jours supplémentaires.",
    },
  },
  {
    number: "03",
    icon: <CalendarDays size={22} color="#EF4444" />,
    iconBg: "#EF444418",
    iconBorder: "#EF444440",
    accentColor: "#EF4444",
    title: "Comprendre le compteur « Jours avant la paie »",
    description:
      "C'est le cœur de GestFiPro. Ce compteur vous donne une conscience financière en temps réel de votre situation jusqu'au prochain versement.",
    steps: [
      {
        label: "Badge « Cycle de paie actif »",
        detail:
          "Le badge vert dans l'en-tête du tableau de bord affiche le nombre de jours restants avant votre prochaine paie (ex: J-18).",
      },
      {
        label: "Carte Budget/Jour",
        detail:
          "Cette KPI calculée automatiquement = Solde total disponible ÷ Jours restants. C'est le maximum à dépenser chaque jour.",
      },
      {
        label: "Alerte Budget Critique",
        detail:
          "Si votre budget journalier descend sous 10 000 FCFA, la carte vire au rouge pour vous alerter d'un rythme trop élevé.",
      },
      {
        label: "Graphique Cashflow",
        detail:
          "Le graphique de tendance montre l'évolution de votre solde sur 7 jours pour détecter les pics de dépenses inhabituels.",
      },
      {
        label: "Indicateur de Rythme",
        detail:
          "Compare vos dépenses du jour à votre budget journalier. En rouge si vous avez dépassé, en vert si vous êtes dans les clous.",
      },
    ],
    tip: {
      icon: "🎯",
      text: "Objectif : dépenser chaque jour strictement moins que votre Budget/Jour. Si vous êtes en dessous 5 jours de suite, vous aurez une réserve confortable en fin de mois.",
    },
  },
  {
    number: "04",
    icon: <Zap size={22} color="#10b981" />,
    iconBg: "#10b98118",
    iconBorder: "#10b98140",
    accentColor: "#10b981",
    title: "Saisir vos dépenses et revenus rapidement",
    description:
      "GestFiPro est conçu pour une saisie ultra-rapide. Chaque transaction prend moins de 10 secondes à enregistrer.",
    steps: [
      {
        label: "Bouton Saisie Rapide",
        detail:
          "Cliquez sur le bouton rouge « Saisie rapide » dans l'en-tête du dashboard pour ouvrir le formulaire de transaction.",
      },
      {
        label: "Renseigner la transaction",
        detail:
          "Saisissez : le libellé (ex: « Supermarché Hayat »), le montant en FCFA, la catégorie et le compte débité (Wave, Espèces, etc.).",
      },
      {
        label: "Catégories disponibles",
        detail:
          "Nourriture & Marché, Transport, Logement & Factures, Loisirs, Santé, Éducation, Habillement, Autres.",
      },
      {
        label: "Mise à jour instantanée",
        detail:
          "La transaction apparaît immédiatement dans « Transactions Récentes » et les KPI (solde, dépenses du jour) se recalculent en temps réel.",
      },
      {
        label: "Consulter l'historique complet",
        detail:
          "Onglet Historique → toutes vos transactions chronologiques avec filtres. Onglet Statistiques → graphiques de répartition par catégorie.",
      },
    ],
    tip: {
      icon: "⚡",
      text: "Bonne pratique : saisissez chaque dépense dans les 2 minutes qui suivent le paiement. Un carnet de notes vocal ou un screenshot vous aide à ne rien oublier.",
    },
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090B",
        color: "#FAFAFA",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Header barre ────────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid #27272A",
          background: "rgba(9,9,11,0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              color: "#A1A1AA",
              fontSize: 13,
              fontWeight: 500,
              transition: "color 0.15s",
            }}
          >
            <ArrowLeft size={14} />
            Retour
          </Link>
          <span style={{ color: "#27272A" }}>·</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={13} color="#EF4444" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>Guide d'utilisation</span>
          </div>
        </div>

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="GestFiPro"
          width={120}
          height={36}
          style={{ mixBlendMode: "screen", objectFit: "contain", height: 36, width: "auto" }}
          priority
        />
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 840,
          margin: "0 auto",
          padding: "52px 24px 40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 99,
            padding: "4px 12px",
            marginBottom: 20,
          }}
        >
          <BookOpen size={11} color="#EF4444" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Documentation MVP
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            marginBottom: 16,
            background: "linear-gradient(135deg, #FAFAFA 0%, #A1A1AA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Maîtrisez GestFiPro
          <br />
          en 4 étapes simples
        </h1>

        <p style={{ fontSize: 16, color: "#A1A1AA", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.7 }}>
          Configurez vos comptes, définissez votre cycle de paie et commencez à suivre vos finances
          en moins de 5 minutes.
        </p>

        {/* Progress pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {steps.map((s, i) => (
            <div
              key={s.number}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 99,
                background: `${s.accentColor}12`,
                border: `1px solid ${s.accentColor}30`,
                fontSize: 12,
                fontWeight: 600,
                color: s.accentColor,
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.7 }}>Étape {s.number}</span>
              <span style={{ color: "#FAFAFA", fontWeight: 700 }}>{s.title.split(" ").slice(0, 3).join(" ")}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Steps ───────────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 840,
          margin: "0 auto",
          padding: "0 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {steps.map((step, stepIdx) => (
          <article
            key={step.number}
            style={{
              background: "#18181B",
              border: `1px solid ${step.accentColor}20`,
              borderRadius: 20,
              padding: "28px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Numéro flottant décoratif */}
            <span
              style={{
                position: "absolute",
                top: 20,
                right: 24,
                fontSize: 56,
                fontWeight: 900,
                color: `${step.accentColor}08`,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {step.number}
            </span>

            {/* En-tête */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: step.iconBg,
                  border: `1px solid ${step.iconBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: step.accentColor,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Étape {step.number} / {steps.length}
                </p>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {step.title}
                </h2>
                <p style={{ fontSize: 13, color: "#A1A1AA", marginTop: 6, lineHeight: 1.6 }}>
                  {step.description}
                </p>
              </div>
            </div>

            {/* Séparateur */}
            <div style={{ borderTop: "1px solid #27272A", marginBottom: 20 }} />

            {/* Liste numérotée */}
            <ol style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {step.steps.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: `${step.accentColor}18`,
                      border: `1px solid ${step.accentColor}35`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                      fontSize: 10,
                      fontWeight: 800,
                      color: step.accentColor,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA", marginBottom: 2 }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.65 }}>
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Tip */}
            <div
              style={{
                background: `${step.accentColor}0A`,
                border: `1px solid ${step.accentColor}22`,
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{step.tip.icon}</span>
              <p style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.65 }}>{step.tip.text}</p>
            </div>

            {/* Connecteur vers étape suivante */}
            {stepIdx < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: -24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              >
                <div style={{ width: 1, height: 16, background: "#27272A" }} />
                <ChevronRight
                  size={14}
                  color="#52525B"
                  style={{ transform: "rotate(90deg)" }}
                />
              </div>
            )}
          </article>
        ))}

        {/* ── CTA final ─────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 20,
            padding: "32px 28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
            Vous êtes prêt !
          </h3>
          <p style={{ fontSize: 13, color: "#A1A1AA", maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.65 }}>
            Votre tableau de bord GestFiPro est configuré. Commencez maintenant par saisir vos soldes
            et votre première dépense du jour.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#EF4444",
                color: "white",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
            >
              <LayoutDashboard size={14} />
              Accéder au tableau de bord
            </Link>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#18181B",
                border: "1px solid #27272A",
                color: "#A1A1AA",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Wallet size={14} />
              Configurer mes comptes
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
