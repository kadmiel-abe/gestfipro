"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Mic,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

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

// ─── Composant ──────────────────────────────────────────────────────────────
export default function SmartInputBar({
  onSuccess,
  onOpenManualEntry,
}: SmartInputBarProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast helper ────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: ToastType) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

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

      {/* ── Floating Smart Input Bar ───────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
        {/* Gradient de fondu entre le contenu et la barre */}
        <div className="h-6 bg-gradient-to-t from-[var(--bg-root)] to-transparent" />

        <div className="bg-[var(--bg-root)] pb-[env(safe-area-inset-bottom)] pointer-events-auto">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-2xl px-3 pb-3"
          >
            {/* ── AI Badge ───────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              </motion.div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
                Saisie IA
              </span>
            </div>

            {/* ── Main Bar ───────────────────────────────────────────── */}
            <div
              className={`
                flex items-center gap-2
                bg-[var(--bg-card)] border border-[var(--border)]
                rounded-2xl px-2 py-1.5
                shadow-lg shadow-black/20
                transition-all duration-300
                ${isLoading ? "opacity-80" : ""}
                focus-within:border-[var(--accent)]/50
                focus-within:shadow-[0_0_20px_rgba(239,68,68,0.08)]
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
                  bg-[var(--border)]/50 text-[var(--text-muted)]
                  hover:bg-[var(--border)] hover:text-[var(--text-primary)]
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-40
                "
                aria-label="Ajouter manuellement"
              >
                <Plus className="w-5 h-5" />
              </motion.button>

              {/* Bouton Micro */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                disabled={isLoading}
                className="
                  flex items-center justify-center
                  w-9 h-9 rounded-xl shrink-0
                  text-[var(--text-muted)]
                  hover:text-[var(--accent)] hover:bg-[var(--accent)]/10
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-40
                "
                aria-label="Saisie vocale"
              >
                <Mic className="w-5 h-5" />
              </motion.button>

              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: taxi 5000, riz 3000..."
                className="
                  flex-1 min-w-0
                  bg-transparent border-none outline-none
                  text-[var(--text-primary)] text-sm
                  placeholder:text-[var(--text-muted)]
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
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25 hover:brightness-110"
                      : "bg-[var(--border)]/50 text-[var(--text-subtle)]"
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
