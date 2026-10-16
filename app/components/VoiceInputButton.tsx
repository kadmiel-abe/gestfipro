"use client";

import React, { useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export interface VoiceInputButtonProps {
  /** Callback recevant le texte reconnu */
  onTranscript?: (text: string) => void;
  /** Si fourni, le texte reconnu sera ajouté/concaténé avec cette valeur */
  value?: string;
  /** Setter pour mettre à jour directement le champ de saisie */
  onChangeValue?: (newValue: string) => void;
  /** Langue de reconnaissance (par défaut "fr-FR") */
  lang?: string;
  /** Callback optionnel en cas d'erreur */
  onError?: (errorMessage: string) => void;
  /** Taille de l'icône en pixels (défaut: 14) */
  size?: number;
  /** Style inline additionnel */
  style?: React.CSSProperties;
  /** Classes Tailwind ou CSS */
  className?: string;
  /** Infobulle personnalisée */
  title?: string;
  /** Mode continu (écoute prolongée) */
  continuous?: boolean;
}

/**
 * Bouton de saisie vocale réutilisable pour inputs et textareas.
 * Intègre nativement la Web Speech API avec feedback visuel animé (pulse/couleur)
 * et gestion élégante des erreurs (permission micro, non-support navigateur, etc.).
 */
export default function VoiceInputButton({
  onTranscript,
  value,
  onChangeValue,
  lang = "fr-FR",
  onError,
  size = 14,
  style,
  className = "",
  title,
  continuous = false,
}: VoiceInputButtonProps) {
  const baseTextRef = useRef<string>("");

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    lang,
    continuous,
    interimResults: false,
    onResult: (transcript) => {
      if (!transcript) return;

      if (onChangeValue) {
        const base = baseTextRef.current;
        const updated = base ? `${base} ${transcript}` : transcript;
        onChangeValue(updated);
        baseTextRef.current = updated;
      }

      onTranscript?.(transcript);
    },
    onError: (errMsg) => {
      onError?.(errMsg);
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      onError?.("La reconnaissance vocale n'est pas supportée par votre navigateur (essayez Chrome, Edge ou Safari).");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      baseTextRef.current = (value || "").trim();
      startListening();
    }
  };

  const defaultTitle = isListening
    ? "Écoute en cours... Cliquez pour arrêter"
    : isSupported
    ? "Démarrer la saisie vocale (Web Speech API)"
    : "Reconnaissance vocale non disponible sur ce navigateur";

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title || defaultTitle}
      aria-label={defaultTitle}
      className={`relative inline-flex items-center justify-center rounded-full transition-all duration-200 ${
        isListening
          ? "bg-red-500/20 text-[#EF4444] border border-red-500/50 shadow-sm shadow-red-500/30"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      } ${className}`}
      style={{
        width: size + 16,
        height: size + 16,
        cursor: "pointer",
        ...style,
      }}
    >
      {isListening ? (
        <>
          <span className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-75" />
          <MicOff size={size} className="relative z-10 text-[#EF4444]" />
        </>
      ) : (
        <Mic size={size} />
      )}
    </button>
  );
}
