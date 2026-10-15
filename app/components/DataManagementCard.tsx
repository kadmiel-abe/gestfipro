"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Trash2,
  AlertTriangle,
  FileJson,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────
interface DataManagementCardProps {
  /** ID optionnel de l'utilisateur Supabase */
  userId?: string | null;
  /** Nom optionnel de l'utilisateur pour l'export JSON */
  userName?: string;
  className?: string;
}

export default function DataManagementCard({
  userId,
  userName = "Utilisateur",
  className = "",
}: DataManagementCardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── 1. Exportation des données complètes au format JSON ────────────────────
  const handleExportData = async () => {
    try {
      setIsExporting(true);

      // Simulation ou extraction des données utilisateur (profil, comptes, transactions)
      const exportPayload = {
        app: "GestFiPro V2",
        export_date: new Date().toISOString(),
        user: {
          id: userId || "mock-user-001",
          name: userName,
          export_version: "2.0",
        },
        profile: {
          currency: "XOF",
          salary_day: 28,
          created_at: "2026-01-15T10:00:00Z",
        },
        accounts: [
          { id: "acc-1", name: "Wave Principal", type: "wave", balance: 250000 },
          { id: "acc-2", name: "Compte Épargne Banque", type: "bank", balance: 1200000 },
          { id: "acc-3", name: "Espèces Portefeuille", type: "cash", balance: 45000 },
        ],
        transactions: [
          { id: "tx-1", date: "2026-10-14", category: "Nourriture", amount: 18500, type: "expense", note: "Courses supermarché" },
          { id: "tx-2", date: "2026-10-12", category: "Transport", amount: 15000, type: "expense", note: "Carburant Total" },
          { id: "tx-3", date: "2026-10-10", category: "Revenu", amount: 500000, type: "income", note: "Salaire mensuel" },
          { id: "tx-4", date: "2026-10-08", category: "Logement", amount: 22500, type: "expense", note: "Facture électricité" },
          { id: "tx-5", date: "2026-10-05", category: "Santé", amount: 9400, type: "expense", note: "Pharmacie" },
        ],
        goals: [
          { id: "goal-1", title: "Fonds d'urgence 3 mois", target_amount: 1500000, current_amount: 850000 },
        ],
      };

      // Conversion en JSON formaté avec indentation
      const jsonString = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "gestfipro_userdata.json");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Vos données personnelles ont été exportées avec succès !");
    } catch (err) {
      console.error("[Export Data Error]", err);
      showToast("Échec lors de l'exportation des données.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // ── 2. Suppression définitive du compte ────────────────────────────────────
  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // Simulation d'appel API / Supabase pour supprimer le compte
      await new Promise((resolve) => setTimeout(resolve, 1400));

      // Nettoyage de la session Supabase et stockage local
      await supabase.auth.signOut();
      localStorage.removeItem("gestfipro_profile");
      localStorage.removeItem("gestfipro_theme");

      setIsDialogOpen(false);
      router.push("/login?deleted=true");
    } catch (err) {
      console.error("[Delete Account Error]", err);
      showToast("Une erreur est survenue lors de la suppression.", "error");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={`w-full ${className}`}>
        {/* ── Card Shadcn UI / Dark Mode Premium ─────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#18181B] border border-[#27272A] p-5 sm:p-6 shadow-xl shadow-black/40">
          
          {/* ── Feedback Notification ────────────────────────────────────── */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-5 flex items-center justify-between gap-3 rounded-xl border p-3 text-xs sm:text-sm font-medium ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{feedback.message}</span>
                </div>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-white/40 hover:text-white transition"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SECTION 1 : Portabilité des données ──────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-[#FAFAFA]" />
                  <h3 className="text-base sm:text-lg font-bold text-[#FAFAFA]">
                    Portabilité des données
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-xl">
                  Téléchargez une copie complète de vos données personnelles (profil, comptes, transactions) au format JSON.
                </p>
              </div>

              {/* Bouton Outline Exporter */}
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-xl border border-[#27272A] bg-transparent
                  px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#FAFAFA]
                  transition-all duration-200
                  hover:border-[#EF4444] hover:bg-[#EF4444]/5
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shrink-0
                "
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#EF4444]" />
                ) : (
                  <Download className="h-4 w-4 text-[#A1A1AA] transition-colors duration-200 group-hover:text-[#EF4444]" />
                )}
                <span>Exporter mes données</span>
              </button>
            </div>
          </div>

          {/* ── Séparateur Visuel ────────────────────────────────────────── */}
          <div className="my-6 h-px w-full bg-[#27272A]" />

          {/* ── SECTION 2 : Zone de Danger (Danger Zone) ─────────────────── */}
          <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/[0.03] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#EF4444]" />
                  <h4 className="text-sm sm:text-base font-bold text-[#EF4444]">
                    Suppression du compte
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-xl">
                  Cette action est irréversible. Toutes vos données financières seront définitivement effacées de nos serveurs.
                </p>
              </div>

              {/* Bouton Supprimer mon compte */}
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl bg-[#EF4444] px-4 py-2.5
                  text-xs sm:text-sm font-semibold text-[#FAFAFA]
                  transition-all duration-200
                  hover:bg-red-600 active:scale-[0.98]
                  shadow-lg shadow-red-500/20
                  shrink-0
                "
              >
                <Trash2 className="h-4 w-4 text-[#FAFAFA]" />
                <span>Supprimer mon compte</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── AlertDialog : Double confirmation de suppression ─────────────── */}
      <AnimatePresence>
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop sombre avec flou */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsDialogOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#18181B] border border-[#27272A] p-6 shadow-2xl z-10"
            >
              {/* En-tête de la modale */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#FAFAFA]">
                    Êtes-vous absolument sûr ?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                    Cette action ne peut pas être annulée. Toutes vos données financières, vos comptes et vos historiques de transactions seront définitivement effacés de nos serveurs.
                  </p>
                </div>
              </div>

              {/* Boutons d'action de l'AlertDialog */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
                {/* Bouton Annuler */}
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDialogOpen(false)}
                  className="
                    w-full sm:w-auto rounded-xl px-4 py-2.5
                    border border-[#27272A] bg-transparent
                    text-xs sm:text-sm font-semibold text-[#FAFAFA]
                    hover:bg-white/5 active:scale-[0.98]
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Annuler
                </button>

                {/* Bouton Confirmation irréversible */}
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  className="
                    w-full sm:w-auto inline-flex items-center justify-center gap-2
                    rounded-xl bg-[#EF4444] px-4 py-2.5
                    text-xs sm:text-sm font-semibold text-[#FAFAFA]
                    hover:bg-red-600 active:scale-[0.98]
                    shadow-lg shadow-red-500/25
                    transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#FAFAFA]" />
                      <span>Suppression en cours...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 text-[#FAFAFA]" />
                      <span>Oui, supprimer définitivement</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
