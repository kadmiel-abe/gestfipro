"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Mic,
  MicOff,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { ISpeechRecognition } from "@/hooks/useSpeechRecognition";

// ─── Types ──────────────────────────────────────────────────────────────────
interface ParsedTransaction {
  amount: number;
  category: string;
  note: string;
}

interface SmartInputBarProps {
  /** Callback déclenché quand de nouvelles transactions sont insérées avec succès */
  onSuccess?: (transactions: ParsedTransaction[]) => void;
  /** Callback pour ouvrir le modal classique d'ajout de dépense */
  onOpenManualEntry?: () => void;
}

type ToastType = "success" | "error";

interface Toast {
  message: string;
  type: ToastType;
}

export default function SmartInputBar({
  onSuccess,
  onOpenManualEntry,
}: SmartInputBarProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // ── Toast helper ────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: ToastType) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Nettoyage lors du démontage ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // ── Gestion de la reconnaissance vocale Web Speech API ───────────────────
  const toggleListening = () => {
    // Si l'enregistrement est déjà en cours, on l'arrête
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;

    // Support standard ou préfixé webkit (Chrome, Edge, Safari)
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast(
        "La reconnaissance vocale n'est pas supportée par ce navigateur (utilisez Chrome, Edge ou Safari).",
        "error"
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "fr-FR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed}, ${transcript}` : transcript;
          });
        }
        setIsListening(false);
        inputRef.current?.focus();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn("[SpeechRecognition Error]", event.error);
        setIsListening(false);

        if (event.error === "not-allowed") {
          showToast(
            "Accès au microphone refusé. Veuillez autoriser le micro dans votre navigateur.",
            "error"
          );
        } else if (event.error !== "no-speech") {
          showToast("Erreur lors de la capture vocale.", "error");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("[SpeechRecognition Init Error]", err);
      setIsListening(false);
      showToast("Impossible de démarrer la saisie vocale.", "error");
    }
  };

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Arrêt de la reconnaissance si soumission en cours
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du traitement");
      }

      const count = data.transactions?.length ?? 0;
      showToast(
        `✅ ${count} dépense${count > 1 ? "s" : ""} ajoutée${count > 1 ? "s" : ""} avec succès !`,
        "success"
      );
      setText("");
      onSuccess?.(data.transactions);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue";
      showToast(`❌ ${message}`, "error");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const canSubmit = text.trim().length > 0 && !isLoading;

  return (
    <>
      {/* ── Toast Notification ─────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-28 left-1/2 z-[60] -translate-x-1/2 max-w-sm w-[90vw]"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="text-white/40 hover:text-white/80 transition"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Smart Input Bar (Fixed Bottom) ────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
        {/* Gradient de fondu discret au-dessus de la barre */}
        <div className="h-6 bg-gradient-to-t from-[#09090B] to-transparent" />

        <div className="bg-[#09090B] pb-[env(safe-area-inset-bottom)] pointer-events-auto">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-2xl px-3 pb-3"
          >
            {/* ── AI / Voice Badge ──────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {isListening ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 text-[10px] font-bold uppercase tracking-wider text-[#EF4444] animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] animate-ping" />
                  Écoute en cours...
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-[#EF4444]" />
                  </motion.div>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[#A1A1AA]">
                    Saisie IA & Vocale
                  </span>
                </div>
              )}
            </div>

            {/* ── Main Bar ───────────────────────────────────────────── */}
            <div
              className={`
                flex items-center gap-2
                bg-[#18181B] border border-[#27272A]
                rounded-2xl px-2 py-1.5
                shadow-xl shadow-black/40
                transition-all duration-300
                ${isLoading ? "opacity-80" : ""}
                ${
                  isListening
                    ? "border-[#EF4444] shadow-[0_0_25px_rgba(239,68,68,0.20)]"
                    : "focus-within:border-[#EF4444]/60 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.10)]"
                }
              `}
            >
              {/* Bouton + (saisie manuelle) */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={onOpenManualEntry}
                disabled={isLoading}
                className="
                  flex items-center justify-center
                  w-9 h-9 rounded-xl shrink-0
                  bg-[#27272A]/50 text-[#A1A1AA]
                  hover:bg-[#27272A] hover:text-[#FAFAFA]
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-40
                "
                aria-label="Ajouter manuellement"
              >
                <Plus className="w-5 h-5" />
              </motion.button>

              {/* Bouton Micro (Reconnaissance Vocale Native) */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                disabled={isLoading}
                className={`
                  flex items-center justify-center
                  w-9 h-9 rounded-xl shrink-0
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-40
                  ${
                    isListening
                      ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 animate-pulse shadow-md shadow-red-500/20"
                      : "text-[#A1A1AA] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                  }
                `}
                aria-label={isListening ? "Arrêter l'écoute" : "Démarrer la saisie vocale"}
                title={isListening ? "Arrêter l'écoute" : "Démarrer la saisie vocale"}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-[#EF4444]" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>

              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
                placeholder={
                  isListening
                    ? "Parlez maintenant... (ex: taxi 5000, riz 3000)"
                    : "Ex: taxi 5000, riz 3000..."
                }
                className="
                  flex-1 min-w-0
                  bg-transparent border-none outline-none
                  text-[#FAFAFA] text-sm
                  placeholder:text-[#A1A1AA]
                  disabled:opacity-50
                  py-2
                "
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              {/* Bouton Send / Loader */}
              <motion.button
                type="submit"
                disabled={!canSubmit}
                whileTap={canSubmit ? { scale: 0.9 } : {}}
                className={`
                  flex items-center justify-center
                  w-9 h-9 rounded-xl shrink-0
                  transition-all duration-300
                  ${
                    canSubmit
                      ? "bg-[#EF4444] text-[#FAFAFA] shadow-lg shadow-red-500/25 hover:bg-red-600"
                      : "bg-[#27272A]/50 text-[#71717A]"
                  }
                `}
                aria-label={isLoading ? "Traitement en cours" : "Envoyer"}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Send className="w-4.5 h-4.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
