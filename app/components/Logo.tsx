"use client";

import Image from "next/image";
import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Principe mix-blend-mode: screen
// ─────────────────────────────────────────────────────────────────────────────
// logo.png  → fond #09090B (noir quasi-pur).
//   screen(black, dest) = dest  →  les pixels noirs deviennent transparents.
//   Les pixels colorés du logo restent visibles. Pas de conteneur ni de fond requis.
//
// logo-icon.png → fond BLANC.
//   screen(white, dest) = white  →  l'image deviendrait entièrement blanche.
//   On utilise à la place un conteneur clip + mix-blend-mode: multiply sur fond blanc,
//   ou un simple clip circulaire sur fond #09090B (solution retenue ici).
// ─────────────────────────────────────────────────────────────────────────────

// ── SidebarLogoFull ───────────────────────────────────────────────────────────
// Même traitement que la page login :
//   div fixe (carré) + overflow:hidden + borderRadius → coins arrondis nets.
//   Logo carré 1:1, l'artwork (icône + texte) est centré dedans.
export function SidebarLogoFull({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="GestFiPro — Retour à l'accueil"
      style={{
        background: "none",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        display: "flex",
        lineHeight: 0,
      }}
    >
      {/*
       * Même pattern que login/page.tsx :
       *   width + height fixes   → overflow:hidden clippe exactement ici
       *   overflow: hidden       → découpe les 4 coins net
       *   borderRadius: 20       → arrondi genereux (rounded-2xl ≈ 16-20px)
       * Le fond sombre du logo.png s'affiche comme une carte arrondie —
       * rendu identique à la partie connexion.
       */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          overflow: "hidden",
          flexShrink: 0,
          lineHeight: 0,
        }}
      >
        <Image
          src="/logo.png"
          alt="GestFiPro"
          width={72}
          height={72}
          style={{
            objectFit: "contain",
            width: 72,
            height: 72,
            display: "block",
          }}
          priority
          quality={95}
        />
      </div>
    </button>
  );
}


// ── SidebarLogoIcon ───────────────────────────────────────────────────────────
// Pictogramme seul pour le header mobile et le drawer fermé.
// logo-icon.png a un fond BLANC → on le clip dans un conteneur sombre arrondi.
export function SidebarLogoIcon({
  size = 36,
  onClick,
}: {
  size?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="GestFiPro — Accueil"
      aria-label="GestFiPro — Accueil"
      style={{
        background: "none",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
      }}
    >
      {/*
       * Conteneur clip : masque le fond blanc de logo-icon.png.
       * overflow:hidden + borderRadius + background:#09090B = recadrage propre.
       * On ajoute un anneau rouge subtil pour la lisibilité sur fond sombre.
       */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: "28%",
          overflow: "hidden",
          // Bordure accent crimson, pas de fond — le clip suffit
          boxShadow: "0 0 0 1.5px rgba(239,68,68,0.55), 0 4px 14px rgba(239,68,68,0.18)",
          flexShrink: 0,
        }}
      >
        <Image
          src="/logo-icon.png"
          alt="GestFiPro"
          width={size}
          height={size}
          style={{
            objectFit: "cover",
            objectPosition: "center",
            width: "100%",
            height: "100%",
            display: "block",
          }}
          priority
          quality={90}
        />
      </span>
    </button>
  );
}

// ── Default export (composant générique) ─────────────────────────────────────
interface LogoProps {
  variant?: "full" | "icon" | "auto";
  fullHeight?: number;
  iconSize?: number;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Logo({
  variant = "full",
  fullHeight = 72,
  iconSize = 36,
  clickable = true,
  onClick,
  className = "",
}: LogoProps) {
  if (variant === "icon") {
    return <SidebarLogoIcon size={iconSize} onClick={clickable ? onClick : undefined} />;
  }

  if (variant === "auto") {
    return (
      <span className={className} style={{ lineHeight: 0 }}>
        <span className="hidden-mobile">
          <SidebarLogoFull onClick={clickable ? onClick : undefined} />
        </span>
        <span className="visible-mobile">
          <SidebarLogoIcon size={iconSize} onClick={clickable ? onClick : undefined} />
        </span>
      </span>
    );
  }

  // "full" (default)
  return (
    <span className={className} style={{ lineHeight: 0 }}>
      <SidebarLogoFull onClick={clickable ? onClick : undefined} />
    </span>
  );
}
