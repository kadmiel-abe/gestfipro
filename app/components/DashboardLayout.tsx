"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  History,
  PieChart,
  Target,
  Settings,
  Menu,
  X,
  Plus,
  LogOut,
  Sparkles,
  CreditCard,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onOpenNewExpense?: () => void;
}

const navItems = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Comptes", href: "/dashboard?tab=comptes", icon: Wallet },
  { label: "Historique", href: "/dashboard?tab=historique", icon: History },
  { label: "Stats", href: "/dashboard?tab=statistiques", icon: PieChart },
  { label: "Objectifs", href: "/dashboard?tab=objectifs", icon: Target },
  { label: "Réglages", href: "/dashboard?tab=reglages", icon: Settings },
];

export default function DashboardLayout({ children, onOpenNewExpense }: DashboardLayoutProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans flex flex-col lg:flex-row selection:bg-[#EF4444] selection:text-white antialiased">
      
      {/* ═══════════════════════════════════════════════════════════════════
          1. SIDEBAR DESKTOP (Fixe à gauche, visible uniquement ≥ 1024px)
      ════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex lg:w-64 flex-col justify-between border-r border-[#27272A] bg-[#18181B] p-5 fixed h-full z-30 select-none">
        <div>
          {/* Logo officiel GestFiPro */}
          <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#09090B] border border-[#27272A] flex items-center justify-center group-hover:border-[#EF4444]/60 transition-colors shrink-0">
              <Image
                src="/logo.png"
                alt="GestFiPro"
                width={40}
                height={40}
                className="w-full h-full object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">
                Gest<span className="text-[#EF4444]">Fi</span>Pro
              </span>
              <span className="text-[10px] font-semibold text-[#71717A] tracking-wider uppercase block">
                SaaS Finances
              </span>
            </div>
          </Link>

          {/* Bouton CTA Action Rapide Desktop */}
          {onOpenNewExpense && (
            <button
              onClick={onOpenNewExpense}
              className="w-full mt-6 py-2.5 px-4 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#EF4444]/25 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle dépense</span>
            </button>
          )}

          {/* Liens de navigation */}
          <nav className={`space-y-1.5 ${onOpenNewExpense ? "mt-4" : "mt-8"}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#EF4444] text-white shadow-md shadow-[#EF4444]/25"
                      : "text-[#A1A1AA] hover:bg-[#27272A]/70 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#71717A]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bas de Sidebar : Déconnexion */}
        <div className="pt-4 border-t border-[#27272A]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#71717A] hover:text-[#EF4444]" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          2. HEADER MOBILE (Sticky top, visible < 1024px)
      ════════════════════════════════════════════════════════════════════ */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#18181B]/95 border-b border-[#27272A] sticky top-0 z-20 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#09090B] border border-[#27272A] flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="GestFiPro"
              width={32}
              height={32}
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <span className="font-extrabold text-base text-white tracking-tight">
            Gest<span className="text-[#EF4444]">Fi</span>Pro
          </span>
        </Link>

        {/* Bouton Hamburger & Actions */}
        <div className="flex items-center gap-2">
          {onOpenNewExpense && (
            <button
              onClick={onOpenNewExpense}
              className="p-2 rounded-xl bg-[#EF4444] text-white text-xs font-bold flex items-center justify-center shadow-md shadow-[#EF4444]/20 cursor-pointer"
              title="Nouvelle dépense"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setOpenMobileMenu(true)}
            className="p-2 rounded-xl bg-[#09090B] border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          3. DRAWER SHEET MOBILE ANIMÉ (< 1024px)
      ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {openMobileMenu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop sombre flouté */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenMobileMenu(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Panneau latéral coulissant */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-[#18181B] border-r border-[#27272A] p-5 flex flex-col justify-between shadow-2xl z-50"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#09090B] border border-[#27272A] flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="GestFiPro"
                        width={32}
                        height={32}
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                    <span className="font-extrabold text-base text-white">
                      Gest<span className="text-[#EF4444]">Fi</span>Pro
                    </span>
                  </div>
                  <button
                    onClick={() => setOpenMobileMenu(false)}
                    className="p-1.5 rounded-lg text-[#71717A] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5 mt-6">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenMobileMenu(false)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-[#EF4444] text-white shadow-md shadow-[#EF4444]/25"
                            : "text-[#A1A1AA] hover:bg-[#27272A] hover:text-white"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[#71717A]"}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#27272A]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-[#A1A1AA] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          4. CONTENU PRINCIPAL (ml-64 sur desktop, padding responsive)
      ════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 lg:ml-64 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-[1440px] mx-auto overflow-x-hidden">
        {children}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          5. BOTTOM NAVIGATION BAR MOBILE (Accès rapide sous le pouce)
      ════════════════════════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#18181B]/95 backdrop-blur-xl border-t border-[#27272A] flex justify-around items-center py-2 px-3 z-30 shadow-2xl">
        {/* 1. Accueil */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-colors ${
            pathname === "/dashboard" ? "text-[#EF4444]" : "text-[#71717A] hover:text-[#A1A1AA]"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Accueil</span>
        </Link>

        {/* 2. Comptes */}
        <Link
          href="/dashboard?tab=comptes"
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-colors ${
            pathname === "/dashboard" ? "text-[#EF4444]" : "text-[#71717A] hover:text-[#A1A1AA]"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Comptes</span>
        </Link>

        {/* 3. Bouton central "+ Dépense" surélevé */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            onClick={onOpenNewExpense ? onOpenNewExpense : () => (window.location.href = "/dashboard?action=new_expense")}
            className="w-12 h-12 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center shadow-lg shadow-[#EF4444]/40 border-4 border-[#09090B] active:scale-95 transition-all cursor-pointer"
            aria-label="Ajouter une dépense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Historique */}
        <Link
          href="/dashboard?tab=historique"
          className="flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-colors text-[#71717A] hover:text-[#A1A1AA]"
        >
          <History className="w-5 h-5" />
          <span>Historique</span>
        </Link>

        {/* 5. Stats */}
        <Link
          href="/dashboard?tab=statistiques"
          className="flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-colors text-[#71717A] hover:text-[#A1A1AA]"
        >
          <PieChart className="w-5 h-5" />
          <span>Stats</span>
        </Link>
      </nav>

    </div>
  );
}