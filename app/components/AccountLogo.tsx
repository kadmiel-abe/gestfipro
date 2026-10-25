"use client";

import React from "react";
import Image from "next/image";

export interface AccountLogoProps {
  /** Identifiant ou nom du provider (ex: "wave", "orange", "m-pesa", "mtn", "cash", "bni", "nsia", "ecobank") */
  provider: string;
  /** Taille en pixels (largeur et hauteur), par défaut 26px */
  size?: number;
  /** Classes CSS supplémentaires pour le conteneur */
  className?: string;
  /** Texte alternatif pour l'image */
  alt?: string;
}

interface ProviderMeta {
  src: string;
  label: string;
  fit: "cover" | "contain";
  bg?: string;
  padding?: number;
}

const PROVIDER_MAP: Record<string, ProviderMeta> = {
  wave: {
    src: "/icons/wave.jpg",
    label: "Wave",
    fit: "cover",
  },
  orange: {
    src: "/icons/orange.jpg",
    label: "Orange Money",
    fit: "cover",
  },
  "m-pesa": {
    src: "/icons/M%20PESA.jfif",
    label: "M-Pesa",
    fit: "cover",
  },
  mtn: {
    src: "/icons/mtn.jpg",
    label: "MTN Money",
    fit: "cover",
  },
  cash: {
    src: "/icons/cash.svg",
    label: "Espèces",
    fit: "contain",
    bg: "#10B98115",
    padding: 2,
  },
  bni: {
    src: "/icons/bni.jpg",
    label: "BNI",
    fit: "contain",
    bg: "#FFFFFF",
    padding: 1,
  },
  nsia: {
    src: "/icons/nsia.png",
    label: "NSIA",
    fit: "contain",
    bg: "#FFFFFF",
    padding: 1,
  },
  ecobank: {
    src: "/icons/ecobank.jpg",
    label: "Ecobank",
    fit: "contain",
    bg: "#FFFFFF",
    padding: 1,
  },
  moov: {
    src: "/icons/moov.png",
    label: "Moov Money",
    fit: "contain",
    bg: "#FFFFFF",
  },
  boa: {
    src: "/icons/Bank_of_africa-logo.png",
    label: "Bank of Africa",
    fit: "contain",
    bg: "#FFFFFF",
    padding: 2,
  },
  bank: {
    src: "/icons/banque.jpg",
    label: "Banque",
    fit: "cover",
    bg: "#FFFFFF",
  },
};

/**
 * Normalise un nom ou code en clé de provider connue
 */
export function normalizeProviderKey(provider = ""): string {
  const p = provider.toLowerCase().trim();
  if (p.includes("bni")) return "bni";
  if (p.includes("nsia")) return "nsia";
  if (p.includes("ecobank")) return "ecobank";
  if (p.includes("wave")) return "wave";
  if (p.includes("orange")) return "orange";
  if (p.includes("m-pesa") || p.includes("mpesa") || p.includes("m pesa")) return "m-pesa";
  if (p.includes("mtn")) return "mtn";
  if (p.includes("moov")) return "moov";
  if (p.includes("boa") || p.includes("africa")) return "boa";
  if (p.includes("cash") || p.includes("esp") || p.includes("billet")) return "cash";
  if (p.includes("banque") || p.includes("bank")) return "bank";
  return p;
}

export function AccountLogo({
  provider,
  size = 26,
  className = "",
  alt,
}: AccountLogoProps) {
  const key = normalizeProviderKey(provider);
  const meta = PROVIDER_MAP[key];

  if (meta) {
    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-xs ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: meta.bg ?? "transparent",
        }}
      >
        <Image
          src={meta.src}
          alt={alt ?? meta.label}
          fill
          sizes={`${size}px`}
          style={{
            objectFit: meta.fit,
            padding: meta.padding ?? 0,
          }}
        />
      </span>
    );
  }

  // Fallback élégant si le provider n'a pas d'icône connue
  const letter = (provider || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-blue-500/15 border border-blue-500/30 font-bold text-blue-400 text-xs ${className}`}
      style={{ width: size, height: size }}
      title={provider}
    >
      {letter}
    </span>
  );
}

export default AccountLogo;
