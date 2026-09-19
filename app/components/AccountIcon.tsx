"use client";

/**
 * AccountIcon — Affiche directement l'image PNG/JPG de l'opérateur
 * avec arrondi appliqué sur l'image elle-même, sans conteneur,
 * sans fond, sans padding parasite.
 *
 * Fichiers dans /public/icons/ :
 *   wave.jpg · orange.jpg · mtn.jpg · moov.png · banque.png · cash.svg
 */

import React from "react";
import Image from "next/image";

// ─── Mapping opérateur → fichier ──────────────────────────────────────────────

type ResolvedType = "wave" | "orange" | "mtn" | "moov" | "cash" | "bank" | "custom";

const ICON_MAP: Record<Exclude<ResolvedType, "custom">, { src: string; label: string; fit: "cover" | "contain"; bg?: string }> = {
  wave:   { src: "/icons/wave.jpg",   label: "Wave",         fit: "cover"   },
  orange: { src: "/icons/orange.jpg", label: "Orange Money", fit: "cover"   },
  mtn:    { src: "/icons/mtn.jpg",    label: "MTN Money",    fit: "cover"   },
  moov:   { src: "/icons/moov.png",   label: "Moov Money",   fit: "cover"   },
  cash:   { src: "/icons/cash.svg",   label: "Espèces",      fit: "contain" },
  bank:   { src: "/icons/banque.jpg", label: "Banque",       fit: "cover",  bg: "#ffffff" },
};

// ─── Résolution du type ────────────────────────────────────────────────────────

export function resolveAccountType(name = "", type = ""): ResolvedType {
  const k = `${name} ${type}`.toLowerCase();
  if (k.includes("wave"))                                                         return "wave";
  if (k.includes("orange"))                                                       return "orange";
  if (k.includes("mtn"))                                                          return "mtn";
  if (k.includes("moov"))                                                         return "moov";
  if (k.includes("espèce") || k.includes("espece") || k.includes("cash"))        return "cash";
  if (k.includes("banque") || k.includes("bank") || k.includes("ecobank"))       return "bank";
  return "custom";
}

// ─── Composant ────────────────────────────────────────────────────────────────

interface AccountIconProps {
  name?: string;
  type?: string;
  /** Taille carrée en px (défaut : 46) */
  size?: number;
  /** Border-radius en px (défaut : 12) */
  radius?: number;
}

export function AccountIcon({ name, type, size = 46, radius = 12 }: AccountIconProps) {
  const resolved = resolveAccountType(name, type);

  // ── Image directe sans wrapper coloré ────────────────────────────────────
  if (resolved !== "custom") {
    const { src, label, fit, bg } = ICON_MAP[resolved];
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          overflow: "hidden",
          flexShrink: 0,
          display: "block",
          position: "relative",
          background: bg ?? "transparent",
        }}
      >
        <Image
          src={src}
          alt={label}
          fill
          sizes={`${size}px`}
          style={{ objectFit: fit }}
        />
      </div>
    );
  }

  // ── Fallback initiale pour comptes personnalisés ──────────────────────────
  const initial = (name ?? type ?? "?")[0]?.toUpperCase() ?? "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "rgba(99,102,241,0.15)",
        border: "1px solid rgba(99,102,241,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: Math.round(size * 0.4),
        fontWeight: 800,
        color: "#818cf8",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {initial}
    </div>
  );
}

// ─── Helpers couleur ─────────────────────────────────────────────────────────

const COLORS: Record<Exclude<ResolvedType, "custom">, string> = {
  wave:   "#0BBFD6",
  orange: "#FF7A00",
  mtn:    "#FFCC00",
  moov:   "#0066CC",
  cash:   "#1A9E6A",
  bank:   "#6D52E8",
};

export function getAccountColor(name: string, type = ""): string {
  const r = resolveAccountType(name, type);
  return r !== "custom" ? COLORS[r] : "#6366f1";
}

export function getAccountBg(name: string, type = ""): string {
  const r = resolveAccountType(name, type);
  return r !== "custom" ? `${COLORS[r]}18` : "rgba(99,102,241,0.12)";
}
