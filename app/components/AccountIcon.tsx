"use client";

/**
 * AccountIcon — Affiche directement l'image PNG/JPG de l'opérateur
 * avec arrondi appliqué sur l'image elle-même, sans conteneur,
 * sans fond, sans padding parasite.
 *
 * Fichiers dans /public/icons/ :
 *   Bank_of_africa-logo.png · wave.jpg · orange.jpg · mtn.jpg · moov.png · banque.jpg · cash.svg
 */

import React from "react";
import Image from "next/image";

// ─── Mapping opérateur → fichier ──────────────────────────────────────────────

type ResolvedType = "boa" | "wave" | "orange" | "mtn" | "moov" | "cash" | "bni" | "nsia" | "ecobank" | "bank" | "custom";

const ICON_MAP: Record<Exclude<ResolvedType, "custom">, { src: string; label: string; fit: "cover" | "contain"; bg?: string; padding?: number }> = {
  boa:     { src: "/icons/Bank_of_africa-logo.png", label: "Bank of Africa (BOA)", fit: "contain", bg: "#ffffff", padding: 3 },
  wave:    { src: "/icons/wave.jpg",   label: "Wave",         fit: "cover"   },
  orange:  { src: "/icons/orange.jpg", label: "Orange Money", fit: "cover"   },
  mtn:     { src: "/icons/mtn.jpg",    label: "MTN Money",    fit: "cover"   },
  moov:    { src: "/icons/moov.png",   label: "Moov Money",   fit: "cover"   },
  cash:    { src: "/icons/cash.svg",   label: "Espèces",      fit: "contain" },
  bni:     { src: "/icons/bni.jpg",    label: "BNI",          fit: "contain", bg: "#ffffff", padding: 2 },
  nsia:    { src: "/icons/nsia.png",   label: "NSIA",         fit: "contain", bg: "#ffffff", padding: 2 },
  ecobank: { src: "/icons/ecobank.jpg",label: "Ecobank",      fit: "contain", bg: "#ffffff", padding: 2 },
  bank:    { src: "/icons/banque.jpg", label: "Banque",       fit: "cover",  bg: "#ffffff" },
};

// ─── Résolution du type ────────────────────────────────────────────────────────

export function resolveAccountType(name = "", type = ""): ResolvedType {
  const k = `${name} ${type}`.toLowerCase();
  if (k.includes("boa") || k.includes("bank of africa") || k.includes("b.o.a") || k.includes("bank_of_africa")) return "boa";
  if (k.includes("bni"))                                                          return "bni";
  if (k.includes("nsia"))                                                         return "nsia";
  if (k.includes("ecobank"))                                                      return "ecobank";
  if (k.includes("wave"))                                                         return "wave";
  if (k.includes("orange"))                                                       return "orange";
  if (k.includes("mtn"))                                                          return "mtn";
  if (k.includes("moov"))                                                         return "moov";
  if (k.includes("espèce") || k.includes("espece") || k.includes("cash"))        return "cash";
  if (k.includes("banque") || k.includes("bank"))                                return "bank";
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
    const { src, label, fit, bg, padding } = ICON_MAP[resolved];
    const pad = padding ? Math.round(size * (padding / 46)) : 0;
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
          style={{ objectFit: fit, padding: pad }}
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
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: Math.round(size * 0.4),
        fontWeight: 800,
        color: "#EF4444",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {initial}
    </div>
  );
}

// ─── Helpers couleur ─────────────────────────────────────────────────────────

const COLORS: Record<Exclude<ResolvedType, "custom">, string> = {
  boa:     "#00558F",
  wave:    "#0BBFD6",
  orange:  "#FF7A00",
  mtn:     "#FFCC00",
  moov:    "#0066CC",
  cash:    "#EF4444",
  bni:     "#006837",
  nsia:    "#003366",
  ecobank: "#005B94",
  bank:    "#FAFAFA",
};

export function getAccountColor(name: string, type = ""): string {
  const r = resolveAccountType(name, type);
  return r !== "custom" ? COLORS[r] : "#EF4444";
}

export function getAccountBg(name: string, type = ""): string {
  const r = resolveAccountType(name, type);
  return r !== "custom" ? `${COLORS[r]}18` : "rgba(239,68,68,0.12)";
}

export { AccountLogo } from "./AccountLogo";

