"use client";

import React, { useState } from "react";
import { X, DollarSign, Calendar, Tag, CreditCard, FileText } from "lucide-react";
import { formatCurrencyValue, getCurrencyMeta, useLanguage } from "@/lib/i18n/LanguageContext";

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    comptes: { id: number; nom: string; solde: number }[];
    onAddTransaction: (tx: {
        montant: number;
        categorie: string;
        compteId: number;
        note: string;
        date: string;
    }) => void;
}

const CATEGORIES = [
    "Nourriture",
    "Transport",
    "Logement",
    "Factures",
    "Loisirs",
    "Santé",
    "Autre",
];

export default function AddExpenseModal({
    isOpen,
    onClose,
    comptes,
    onAddTransaction,
}: AddExpenseModalProps) {
    const { currency, isEn, language } = useLanguage();
    const currencySymbol = getCurrencyMeta(currency).symbol;
    const [montant, setMontant] = useState("");
    const [categorie, setCategorie] = useState(CATEGORIES[0]);
    const [customCategory, setCustomCategory] = useState("");
    const [compteId, setCompteId] = useState(comptes[0]?.id || 1);
    const [note, setNote] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    if (!isOpen) return null;

    const isOther = categorie === "Autre";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!montant || Number(montant) <= 0) return;

        const resolvedCategory = (isOther && customCategory.trim()) ? customCategory.trim() : categorie;

        onAddTransaction({
            montant: Number(montant),
            categorie: resolvedCategory,
            compteId: Number(compteId),
            note,
            date,
        });

        setMontant("");
        setCustomCategory("");
        setNote("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#18181B] border border-[#27272A] w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#A1A1AA] hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-6">Ajouter une dépense</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Montant */}
                    <div>
                        <label className="text-xs text-[#A1A1AA] font-medium block mb-1">{isEn ? `Amount (${currencySymbol})` : `Montant (${currencySymbol})`}</label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                placeholder="Ex: 2500"
                                value={montant}
                                onChange={(e) => setMontant(e.target.value)}
                                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF4444] transition font-semibold text-lg"
                            />
                            <span className="absolute right-4 top-3.5 text-xs text-[#EF4444] font-bold">{currencySymbol}</span>
                        </div>
                    </div>

                    {/* Catégorie */}
                    <div>
                        <label className="text-xs text-[#A1A1AA] font-medium block mb-1">Catégorie</label>
                        <select
                            value={categorie}
                            onChange={(e) => setCategorie(e.target.value)}
                            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF4444] transition"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Préciser la catégorie si Autre */}
                    {isOther && (
                        <div>
                            <label className="text-xs text-[#EF4444] font-medium block mb-1">Préciser la catégorie</label>
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Ex: Cadeau, Coiffure, Abonnement..."
                                className="w-full bg-[#09090B] border border-[#EF4444]/40 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#EF4444] transition text-sm"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Compte source */}
                    <div>
                        <label className="text-xs text-[#A1A1AA] font-medium block mb-1">Compte source</label>
                        <select
                            value={compteId}
                            onChange={(e) => setCompteId(Number(e.target.value))}
                            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF4444] transition"
                        >
                            {comptes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nom} ({formatCurrencyValue(c.solde, currency, language === "en" ? "en-US" : "fr-FR")})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-xs text-[#A1A1AA] font-medium block mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF4444] transition"
                        />
                    </div>

                    {/* Note optionnelle */}
                    <div>
                        <label className="text-xs text-[#A1A1AA] font-medium block mb-1">Note (Optionnel)</label>
                        <input
                            type="text"
                            placeholder="Ex: Taxi Plateau"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF4444] transition"
                        />
                    </div>

                    {/* Bouton Validation */}
                    <button
                        type="submit"
                        className="w-full mt-4 bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium py-3 rounded-xl transition shadow-lg shadow-red-500/20"
                    >
                        Enregistrer la dépense
                    </button>
                </form>
            </div>
        </div>
    );
}