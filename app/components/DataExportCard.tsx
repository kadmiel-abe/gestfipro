"use client";

import React, { useState } from "react";
import { FileText, FileDown, Download, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface TransactionExportItem {
  date: string;
  description: string;
  montant: number;
  type: "Dépense" | "Revenu";
  compte: string;
}

interface DataExportCardProps {
  /** Liste optionnelle de transactions réelles à exporter (fallback sur mock de 5 transactions) */
  transactions?: TransactionExportItem[];
}

// ─── 5 transactions factices (Mock data) ────────────────────────────────────
const MOCK_TRANSACTIONS: TransactionExportItem[] = [
  {
    date: "2026-10-14",
    description: "Courses Alimentation",
    montant: 18500,
    type: "Dépense",
    compte: "Wave",
  },
  {
    date: "2026-10-12",
    description: "Carburant Station Total",
    montant: 15000,
    type: "Dépense",
    compte: "Espèces",
  },
  {
    date: "2026-10-10",
    description: "Virement Salaire Mensuel",
    montant: 450000,
    type: "Revenu",
    compte: "Banque",
  },
  {
    date: "2026-10-08",
    description: "Facture CIE Électricité",
    montant: 22500,
    type: "Dépense",
    compte: "Orange Money",
  },
  {
    date: "2026-10-05",
    description: "Achat Pharmacie Centrale",
    montant: 9400,
    type: "Dépense",
    compte: "Wave",
  },
];

export default function DataExportCard({
  transactions = MOCK_TRANSACTIONS,
}: DataExportCardProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // ── 1. Export CSV ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    try {
      setIsExportingCSV(true);

      const items = transactions.length > 0 ? transactions : MOCK_TRANSACTIONS;

      // En-têtes du CSV
      const headers = ["Date", "Description", "Montant (FCFA)", "Type", "Compte"];

      // Lignes de données échappées
      const rows = items.map((t) => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.montant,
        t.type,
        `"${t.compte.replace(/"/g, '""')}"`,
      ]);

      // Assemblage avec point-virgule (standard Excel francophone) + BOM UTF-8
      const csvContent =
        "\uFEFF" +
        [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\r\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "gestfipro_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showFeedback("Export CSV téléchargé avec succès !");
    } catch (err) {
      console.error("[Export CSV Error]", err);
      showFeedback("Erreur lors de la génération du CSV.");
    } finally {
      setIsExportingCSV(false);
    }
  };

  // ── 2. Export PDF ─────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);

      // Import dynamique côté client de jsPDF et jspdf-autotable
      // (évite les erreurs de pré-rendu SSR sous Next.js)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsPDFModule: any = await import("jspdf");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const autoTableModule: any = await import("jspdf-autotable");

      const jsPDF = jsPDFModule.default || jsPDFModule;
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const items = transactions.length > 0 ? transactions : MOCK_TRANSACTIONS;

      // ── En-tête du document PDF ───────────────────────────────────────────
      // Bandeau supérieur sombre
      doc.setFillColor(24, 24, 27); // #18181B
      doc.rect(0, 0, 210, 36, "F");

      // Ligne d'accentuation rouge GestFiPro
      doc.setFillColor(239, 68, 68); // #EF4444
      doc.rect(0, 36, 210, 2, "F");

      // Titre principal
      doc.setTextColor(250, 250, 250); // #FAFAFA
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Relevé GestFiPro", 14, 20);

      // Sous-titre date
      doc.setTextColor(161, 161, 170); // #A1A1AA
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const todayFormatted = new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      doc.text(`Document généré le ${todayFormatted}`, 14, 28);
      doc.text("GestFiPro V2 • Gestion Financière", 140, 28);

      // ── Préparation du tableau ────────────────────────────────────────────
      const tableHeaders = [["Date", "Description", "Montant (FCFA)", "Type", "Compte"]];
      const tableRows = items.map((t) => [
        t.date,
        t.description,
        `${t.montant.toLocaleString("fr-FR")} FCFA`,
        t.type,
        t.compte,
      ]);

      // Calcul des totaux pour le récapitulatif
      const totalDepenses = items
        .filter((i) => i.type === "Dépense")
        .reduce((sum, i) => sum + i.montant, 0);

      const totalRevenus = items
        .filter((i) => i.type === "Revenu")
        .reduce((sum, i) => sum + i.montant, 0);

      // ── Génération du tableau avec jspdf-autotable ─────────────────────────
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 46,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 4,
          textColor: [39, 39, 42],
        },
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [250, 250, 250],
          fontStyle: "bold",
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 250],
        },
        margin: { left: 14, right: 14 },
      });

      // Position finale du tableau
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 120;

      // ── Récapitulatif en bas de page ───────────────────────────────────────
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(113, 113, 122);
      doc.text(`Total Dépenses : ${totalDepenses.toLocaleString("fr-FR")} FCFA`, 14, finalY + 12);
      doc.text(`Total Revenus : ${totalRevenus.toLocaleString("fr-FR")} FCFA`, 14, finalY + 18);

      doc.setFontSize(8);
      doc.text(
        "Ce document est un extrait d'archives pour usage personnel. GestFiPro © 2026",
        14,
        finalY + 28
      );

      // Téléchargement du fichier PDF
      doc.save("gestfipro_export.pdf");
      showFeedback("Export PDF téléchargé avec succès !");
    } catch (err) {
      console.error("[Export PDF Error]", err);
      showFeedback("Erreur lors de la génération du PDF. Vérifiez l'installation de jspdf.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="w-full">
      {/* ── Card Shadcn UI / Dark Mode Premium ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#18181B] border border-[#27272A] p-5 sm:p-6 shadow-xl shadow-black/40">
        {/* Glow discret d'ambiance */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#EF4444]/5 blur-3xl" />

        {/* ── En-tête de la Card ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#FAFAFA]">
                Export des données
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-0.5">
                Téléchargez vos historiques de transactions pour vos archives personnelles.
              </p>
            </div>
          </div>
        </div>

        {/* ── Feedback Toast inline ──────────────────────────────────────── */}
        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 px-3.5 py-2.5 text-xs font-medium text-[#FAFAFA]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#EF4444]" />
                <span>{feedbackMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Boutons d'exportation ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Bouton CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExportingCSV}
            className="
              group flex items-center justify-center gap-2.5
              w-full rounded-xl px-4 py-3
              bg-transparent border border-[#27272A]
              text-sm font-medium text-[#FAFAFA]
              transition-all duration-200
              hover:border-[#EF4444] hover:bg-[#EF4444]/5
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {isExportingCSV ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#EF4444]" />
            ) : (
              <FileText className="h-4 w-4 text-[#A1A1AA] transition-colors duration-200 group-hover:text-[#EF4444]" />
            )}
            <span>Télécharger en CSV</span>
          </button>

          {/* Bouton PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="
              group flex items-center justify-center gap-2.5
              w-full rounded-xl px-4 py-3
              bg-transparent border border-[#27272A]
              text-sm font-medium text-[#FAFAFA]
              transition-all duration-200
              hover:border-[#EF4444] hover:bg-[#EF4444]/5
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {isExportingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#EF4444]" />
            ) : (
              <FileDown className="h-4 w-4 text-[#A1A1AA] transition-colors duration-200 group-hover:text-[#EF4444]" />
            )}
            <span>Télécharger en PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
