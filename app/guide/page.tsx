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
  Bell,
  TrendingUp,
  CircleDollarSign,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Guide beta testeurs | GestFiPro",
  description:
    "Guide de prise en main de GestFiPro pour beta testeurs : vue d'ensemble, comptes, cycle de paie, budget, historique, objectifs et réglages.",
};

const featureSections = [
  {
    number: "01",
    icon: <LayoutDashboard size={22} color="#EF4444" />,
    iconBg: "rgba(239,68,68,0.12)",
    iconBorder: "rgba(239,68,68,0.25)",
    accentColor: "#EF4444",
    title: "Vue d’ensemble du dashboard",
    description:
      "La page d’accueil centralise votre situation financière : solde, paie, budget du jour, transactions récentes et indicateurs clés.",
    bullets: [
      "Le header affiche le solde global, le cycle de paie actif et le bouton d’ajout rapide.",
      "Les cartes en haut donnent un aperçu instantané de votre situation avant la prochaine paie.",
      "Le dashboard est pensé pour une lecture ultra rapide, sans besoin d’ouvrir plusieurs écrans.",
    ],
    tip: "Le dashboard est la page d’entrée. Si vous voulez savoir rapidement où vous en êtes, c’est la page à regarder en premier.",
  },
  {
    number: "02",
    icon: <Wallet size={22} color="#FAFAFA" />,
    iconBg: "rgba(255,255,255,0.08)",
    iconBorder: "rgba(255,255,255,0.15)",
    accentColor: "#FAFAFA",
    title: "Comptes et soldes",
    description:
      "La section Comptes sert à enregistrer vos comptes de manière simple et à garder un solde consolidé en temps réel.",
    bullets: [
      "Vous pouvez créer plusieurs comptes : Espèces, Wave, Orange Money, Banque ou un autre type libre.",
      "Chaque compte a son propre solde, mais la somme totale apparait automatiquement dans le dashboard.",
      "Le solde peut être mis à jour à tout moment si un dépôt ou un retrait a été effectué hors app.",
      "Le badge de total est utile pour avoir une vue en un coup d’œil de votre vrai niveau d’argent disponible.",
    ],
    tip: "Commencez par renseigner vos comptes que vous utilisez le plus souvent pour que le solde reflecte votre vie quotidienne.",
  },
  {
    number: "03",
    icon: <Settings size={22} color="#EF4444" />,
    iconBg: "rgba(239,68,68,0.12)",
    iconBorder: "rgba(239,68,68,0.25)",
    accentColor: "#EF4444",
    title: "Salaire net et cycle de paie",
    description:
      "C’est la base du système de budget. En indiquant votre salaire net et votre date de paie, GestFiPro calcule votre budget journalier.",
    bullets: [
      "Saisissez votre salaire net mensuel dans les réglages du profil.",
      "Indiquez le jour de versement (par exemple 28 du mois).",
      "Le système calcule le nombre de jours restants avant la prochaine paie.",
      "La carte Budget/Jour se met à jour automatiquement pour vous aider à dépenser dans la bonne plage.",
    ],
    tip: "Le but n’est pas de calculer un budget parfait, mais de prévenir les dépassements avant qu’ils ne deviennent critiques.",
  },
  {
    number: "04",
    icon: <Zap size={22} color="#DC2626" />,
    iconBg: "rgba(220,38,38,0.12)",
    iconBorder: "rgba(220,38,38,0.25)",
    accentColor: "#DC2626",
    title: "Saisie rapide des revenus et dépenses",
    description:
      "Le bouton de saisie rapide est conçu pour enregistrer un mouvement en quelques secondes, sans friction.",
    bullets: [
      "Cliquez sur le bouton rouge dans l’en-tête pour ouvrir la modal d’ajout.",
      "Ajoutez un libellé, un montant, une catégorie et le compte concerné.",
      "Une dépense est enregistrée comme négative; un revenu comme positif.",
      "Les montants s’actualisent immédiatement dans les KPI et les historiques.",
    ],
    tip: "La clé pour un bon usage est la régularité : renseigner les transactions dès qu’elles arrivent évite les oublis.",
  },
  {
    number: "05",
    icon: <CalendarDays size={22} color="#EF4444" />,
    iconBg: "rgba(239,68,68,0.12)",
    iconBorder: "rgba(239,68,68,0.25)",
    accentColor: "#EF4444",
    title: "Jours avant la paie et budget journalier",
    description:
      "C’est probablement la fonctionnalité la plus utile pour garder le contrôle sur les dépenses quotidiennes.",
    bullets: [
      "Le compteur J- indique le nombre de jours restants avant votre prochaine paie.",
      "Le budget journalier est calculé automatiquement à partir du solde total et du nombre de jours disponibles.",
      "Un budget trop bas déclenche une alerte visuelle claire et immédiate.",
      "Cela aide à adapter les achats du jour et à éviter un coup de pompe financier.",
    ],
    tip: "Un bon usage consiste à comparer les dépenses du jour au budget journalier plutôt que seulement au solde total.",
  },
  {
    number: "06",
    icon: <TrendingUp size={22} color="#EF4444" />,
    iconBg: "rgba(239,68,68,0.12)",
    iconBorder: "rgba(239,68,68,0.25)",
    accentColor: "#EF4444",
    title: "Graphiques et suivi des tendances",
    description:
      "Les graphes permettent de voir si votre comportement de dépense est stable, explosif ou maîtrisé.",
    bullets: [
      "Le graphique de cashflow montre l’évolution du solde sur les jours récents.",
      "La répartition par catégorie permet de comprendre d’où viennent les dépenses les plus élevées.",
      "Les éléments visuels aident à détecter des habitudes, pas seulement des montants.",
    ],
    tip: "Les graphiques ne remplacent pas le bon sens, mais ils permettent de repérer rapidement un déséquilibre.",
  },
  {
    number: "07",
    icon: <CircleDollarSign size={22} color="#EF4444" />,
    iconBg: "rgba(239,68,68,0.12)",
    iconBorder: "rgba(239,68,68,0.25)",
    accentColor: "#EF4444",
    title: "Historique et statistiques",
    description:
      "L’historique et les statistiques sont là pour donner du sens à la donnée. Vous pouvez analyser vos habitudes sans le stress.",
    bullets: [
      "L’historique regroupe vos mouvements dans le temps, triés chronologiquement.",
      "Les statistiques résument vos dépenses par catégorie pour repérer les postes les plus lourds.",
      "Cela permet de réagir avant qu’une dépense répétée ne pèse trop sur le mois.",
    ],
    tip: "À la fin du mois, l’historique devient le meilleur outil pour faire un vrai retour sur votre consommation.",
  },
  {
    number: "08",
    icon: <Bell size={22} color="#FAFAFA" />,
    iconBg: "rgba(255,255,255,0.08)",
    iconBorder: "rgba(255,255,255,0.15)",
    accentColor: "#FAFAFA",
    title: "Notifications, thème et personnalisation",
    description:
      "GestFiPro propose aussi des éléments de confort pour un usage quotidien plus fluide et plus agréable.",
    bullets: [
      "Vous pouvez changer le thème sombre ou clair selon vos préférences.",
      "La langue du produit peut être modifiée pour un usage FR/EN.",
      "Le sélecteur de devise permet d’afficher les montants dans une devise différente selon votre contexte.",
      "Les notifications servent à rappeler les points importants ou les actions à faire.",
    ],
    tip: "Les détails de personnalisation ne sont pas accessoires : ils rendent l’outil plus naturel à utiliser chaque jour.",
  },
  {
    number: "09",
    icon: <ShieldCheck size={22} color="#EF4444" />,
    iconBg: "rgba(239,68,68,0.12)",
    iconBorder: "rgba(239,68,68,0.25)",
    accentColor: "#EF4444",
    title: "Points de vigilance pour les beta testeurs",
    description:
      "Ce guide n’est pas seulement un manuel ; c’est aussi un checklist pour tester la valeur du produit avec les vrais usages de terrain.",
    bullets: [
      "Testez la saisie de plusieurs comptes et comparez avec le solde total.",
      "Vérifiez que le budget journalier change bien selon le salaire et la date de paie.",
      "Ajoutez une dépense, puis vérifiez qu’elle apparaît dans l’historique et les stats.",
      "Essayez le changement de devise et de langue pour confirmer que l’expérience reste cohérente.",
      "Notez les retours sur les éléments qui semblent compliqués, lents ou peu clairs.",
    ],
    tip: "Le meilleur test utilisateur n’est pas “ça marche”, c’est “ça est compréhensible en moins d’une minute”.",
  },
];

export default function GuidePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090B",
        color: "#FAFAFA",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
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
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "#A1A1AA", fontSize: 13, fontWeight: 500 }}>
            <ArrowLeft size={14} />
            Retour
          </Link>
          <span style={{ color: "#27272A" }}>·</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={13} color="#EF4444" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>Guide beta testeurs</span>
          </div>
        </div>

        <Image
          src="/logo.png"
          alt="GestFiPro"
          width={120}
          height={36}
          style={{ mixBlendMode: "screen", objectFit: "contain", height: 36, width: "auto" }}
          priority
        />
      </header>

      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "52px 24px 36px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 99, padding: "4px 12px", marginBottom: 18 }}>
          <BookOpen size={11} color="#EF4444" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Beta Guide
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 16, background: "linear-gradient(135deg, #FAFAFA 0%, #A1A1AA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Tout comprendre sur GestFiPro
        </h1>

        <p style={{ fontSize: 16, color: "#A1A1AA", maxWidth: 700, margin: "0 auto 28px", lineHeight: 1.7 }}>
          Ce guide explique chaque fonctionnalité du produit pour que tes beta testeurs ou futurs utilisateurs puissent prendre en main le tableau de bord sans aide extérieure.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          {featureSections.map((section) => (
            <span key={section.number} style={{ background: `${section.accentColor}15`, border: `1px solid ${section.accentColor}25`, color: section.accentColor, borderRadius: 999, padding: "6px 12px", fontWeight: 700, fontSize: 12 }}>
              {section.number}
            </span>
          ))}
        </div>
      </section>

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "0 24px 80px", display: "flex", flexDirection: "column", gap: 24 }}>
        {featureSections.map((section, index) => (
          <article key={section.number} style={{ background: "#18181B", border: `1px solid ${section.accentColor}20`, borderRadius: 20, padding: "28px 28px", position: "relative", overflow: "hidden" }}>
            <span style={{ position: "absolute", top: 18, right: 20, fontSize: 56, fontWeight: 900, color: `${section.accentColor}08`, letterSpacing: "-0.05em", userSelect: "none" }}>{section.number}</span>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: section.iconBg, border: `1px solid ${section.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {section.icon}
              </div>

              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: section.accentColor, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                  Fonctionnalité {section.number}
                </p>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.03em" }}>{section.title}</h2>
                <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.7, marginTop: 8 }}>{section.description}</p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #27272A", marginBottom: 20 }} />

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {section.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${section.accentColor}18`, border: `1px solid ${section.accentColor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: section.accentColor, flexShrink: 0, marginTop: 1 }}>
                    {bulletIndex + 1}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.7, color: "#D4D4D8" }}>{bullet}</span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 20, background: `${section.accentColor}0A`, border: `1px solid ${section.accentColor}22`, borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.7 }}>
                <strong style={{ color: "#FAFAFA" }}>Astuce :</strong> {section.tip}
              </p>
            </div>

            {index < featureSections.length - 1 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                <ChevronRight size={14} color="#52525B" style={{ transform: "rotate(90deg)" }} />
              </div>
            )}
          </article>
        ))}

        <div style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 20, padding: "32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 38, marginBottom: 14 }}>🎯</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Prêt à tester ?</h3>
          <p style={{ fontSize: 13, color: "#A1A1AA", maxWidth: 540, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Demandez à tes beta testeurs de suivre ce parcours : créer un compte, saisir un solde, ajouter une dépense, vérifier le budget journalier et regarder l’historique.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EF4444", color: "white", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              <LayoutDashboard size={14} />
              Ouvrir le dashboard
            </Link>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#18181B", border: "1px solid #27272A", color: "#A1A1AA", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              <Settings size={14} />
              Tester la connexion
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
