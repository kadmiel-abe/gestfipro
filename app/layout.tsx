import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GestFiPro — Gestion Financière Personnelle",
    template: "%s | GestFiPro",
  },
  description:
    "Tableau de bord de gestion financière personnelle pour salariés et fonctionnaires en Afrique de l'Ouest. Suivez vos comptes manuels, budget quotidien et dépenses par catégorie.",
  keywords: ["gestion financière", "budget", "Afrique de l'Ouest", "salaire", "FCFA", "Wave", "Orange Money"],
  authors: [{ name: "GestFiPro" }],
  creator: "GestFiPro",
  metadataBase: new URL("https://gestfipro.app"),

  // ── Favicon & App Icons ───────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/logo-icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/logo-icon.png",
    apple: "/logo-icon.png",
  },

  // ── OpenGraph ─────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "GestFiPro — Gestion Financière Personnelle",
    description:
      "Suivez vos comptes manuels, votre budget quotidien et vos dépenses par catégorie. Conçu pour les salariés et fonctionnaires en Afrique de l'Ouest.",
    siteName: "GestFiPro",
    images: [
      {
        url: "/logo.png",
        width: 1080,
        height: 1080,
        alt: "GestFiPro — Tableau de bord financier",
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "GestFiPro — Gestion Financière Personnelle",
    description: "Gérez votre budget et vos comptes manuels depuis un tableau de bord premium.",
    images: ["/logo.png"],
  },

  // ── App Web manifest ─────────────────────────────────────────────────────
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <head>
        {/* Favicon inline en fallback SVG */}
        <link rel="icon" href="/logo-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-icon.png" />
        <meta name="theme-color" content="#09090B" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
