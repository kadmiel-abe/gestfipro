import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090B",
};

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
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
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

import { ThemeProvider } from "./components/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import ScrollToTop from "./components/ScrollToTop";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${poppins.variable} font-sans antialiased dark h-full`} suppressHydrationWarning>
      <head>
        {/* Anti-flash script pour le thème et la langue */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('gestfipro_theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
                const l = localStorage.getItem('gestfipro_lang');
                if (l === 'en' || l === 'fr') {
                  document.documentElement.lang = l;
                }
              } catch (e) {}
            `,
          }}
        />
        {/* Favicon inline en fallback SVG */}
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#09090B" />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <LanguageProvider>
          <ThemeProvider>
            {children}
            <ScrollToTop />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
