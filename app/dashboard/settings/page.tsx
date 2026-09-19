"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Wallet,
  Coins,
  User,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Save,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState<number>(0);
  const [paydayDate, setPaydayDate] = useState<number>(0);

  // Charger profil depuis Supabase et localStorage
  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUserId(session.user.id);
          const { data: prof, error: profError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (prof && !profError) {
            setUserName(prof.full_name || session.user.email?.split("@")[0] || "");
            setMonthlySalary(Number(prof.net_salary) || 0);
            setPaydayDate(prof.payday_with_month || 0);
          } else {
            // Local fallback
            const saved = localStorage.getItem("gestfipro_profile");
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                setUserName(parsed.userName || "");
                setMonthlySalary(Number(parsed.monthlySalary) || 0);
                setPaydayDate(Number(parsed.paydayDate) || 0);
              } catch {}
            }
          }
        } else {
          // Mode invité / local
          const saved = localStorage.getItem("gestfipro_profile");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setUserName(parsed.userName || "");
              setMonthlySalary(Number(parsed.monthlySalary) || 0);
              setPaydayDate(Number(parsed.paydayDate) || 0);
            } catch {}
          }
        }
      } catch (err: any) {
        console.error("Erreur chargement profil :", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Calculs dynamiques pour le Payday Preview
  const { daysRemaining, nextPaydayFormatted, dailyBudgetPreview, isConfigured } = useMemo(() => {
    if (!paydayDate || paydayDate < 1 || paydayDate > 31) {
      return {
        daysRemaining: 0,
        nextPaydayFormatted: "Non configuré",
        dailyBudgetPreview: 0,
        isConfigured: false,
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    const safePayday = paydayDate;

    const maxDaysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const clampedDayCurrentMonth = Math.min(safePayday, maxDaysInCurrentMonth);
    let targetPaydayDate = new Date(currentYear, currentMonth, clampedDayCurrentMonth);

    if (currentDay > clampedDayCurrentMonth) {
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const maxDaysInNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
      const clampedDayNextMonth = Math.min(safePayday, maxDaysInNextMonth);
      targetPaydayDate = new Date(nextMonthYear, nextMonth, clampedDayNextMonth);
    }

    const todayStart = new Date(currentYear, currentMonth, currentDay);
    const diffMs = targetPaydayDate.getTime() - todayStart.getTime();
    const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    const nextFormatted = targetPaydayDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });

    const budget = monthlySalary > 0 ? Math.max(0, Math.floor(monthlySalary / days)) : 0;

    return {
      daysRemaining: days,
      nextPaydayFormatted: nextFormatted,
      dailyBudgetPreview: budget,
      isConfigured: true,
    };
  }, [paydayDate, monthlySalary]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const cleanPayday = paydayDate > 0 && paydayDate <= 31 ? Number(paydayDate) : null;
      const cleanSalary = Math.max(0, Number(monthlySalary) || 0);
      const cleanName = userName.trim();

      if (userId) {
        const { error: upsertErr } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: cleanName,
          net_salary: cleanSalary,
          payday_with_month: cleanPayday,
          updated_at: new Date().toISOString(),
        });

        if (upsertErr) throw upsertErr;
      }

      // Toujours persister dans localStorage pour synchro instantanée
      localStorage.setItem(
        "gestfipro_profile",
        JSON.stringify({
          userName: cleanName,
          monthlySalary: cleanSalary,
          paydayDate: cleanPayday || 0,
        })
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error("Erreur enregistrement profil :", err);
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#09090B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 className="animate-spin" size={32} color="#EF4444" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090B",
        color: "#FAFAFA",
        fontFamily: "var(--font-geist-sans), Inter, sans-serif",
        padding: "32px 20px 60px",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header avec lien retour */}
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#A1A1AA",
              textDecoration: "none",
              marginBottom: 16,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#FAFAFA")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#A1A1AA")}
          >
            <ArrowLeft size={16} />
            Retour au Tableau de Bord
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarClock size={22} color="#EF4444" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#FAFAFA",
                  margin: 0,
                }}
              >
                Paramètres du Profil & Cycle de Paie
              </h1>
              <p style={{ fontSize: 13, color: "#A1A1AA", margin: "4px 0 0" }}>
                Modifiez votre salaire et votre date de paie pour synchroniser la PaydayCard.
              </p>
            </div>
          </div>
        </div>

        {/* Messages Feedback */}
        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 20,
              color: "#10B981",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            Paramètres enregistrés avec succès ! La PaydayCard sera mise à jour.
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 20,
              color: "#EF4444",
              fontSize: 14,
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Formulaire de Réglages */}
        <form onSubmit={handleSave}>
          <div
            style={{
              background: "#18181B",
              border: "1px solid #27272A",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {/* Nom Complet */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#A1A1AA",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                <User size={13} color="#EF4444" />
                Nom ou Prénom
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex. Amadou Diallo"
                style={{
                  width: "100%",
                  background: "#09090B",
                  border: "1px solid #27272A",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "#FAFAFA",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Salaire Net Mensuel */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#A1A1AA",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                <Wallet size={13} color="#EF4444" />
                Salaire Net Mensuel (FCFA)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={monthlySalary || ""}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  placeholder="Ex. 450 000"
                  style={{
                    width: "100%",
                    background: "#09090B",
                    border: "1px solid #27272A",
                    borderRadius: 10,
                    padding: "12px 64px 12px 14px",
                    color: "#FAFAFA",
                    fontSize: 14,
                    fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#71717A",
                  }}
                >
                  FCFA
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#71717A", marginTop: 6 }}>
                Montant de base pris en compte pour le calcul du budget et du cycle de revenus.
              </p>
            </div>

            {/* Jour de Versement de la Paie */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#A1A1AA",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                <CalendarClock size={13} color="#EF4444" />
                Jour de versement de la paie (1 à 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paydayDate || ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPaydayDate(Math.max(1, Math.min(31, val)));
                }}
                placeholder="28"
                style={{
                  width: "100%",
                  background: "#09090B",
                  border: "1px solid #27272A",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "#FAFAFA",
                  fontSize: 14,
                  fontWeight: 700,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 11, color: "#71717A", marginTop: 6 }}>
                Jour du mois où vous recevez votre salaire (ex: 28). Utilisé par le compte à rebours de la PaydayCard.
              </p>
            </div>

            {/* ── APERÇU DYNAMIQUE DU CYCLE DE PAIE ── */}
            <div
              style={{
                background: "#09090B",
                border: "1px solid #27272A",
                borderRadius: 12,
                padding: 16,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Sparkles size={14} color="#EF4444" />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#FAFAFA",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Aperçu calculé pour la PaydayCard
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: "#18181B",
                    border: "1px solid #27272A",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <p style={{ fontSize: 11, color: "#A1A1AA", margin: "0 0 4px" }}>
                    {isConfigured ? `Prochaine paie (${paydayDate})` : "Prochaine paie"}
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: isConfigured ? "#FAFAFA" : "#71717A",
                      margin: 0,
                    }}
                  >
                    {isConfigured ? nextPaydayFormatted : "Non défini"}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: isConfigured ? (daysRemaining <= 5 ? "#EF4444" : "#10B981") : "#71717A",
                      fontWeight: 700,
                      margin: "4px 0 0",
                    }}
                  >
                    {isConfigured ? `Dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}` : "Renseignez le jour ci-dessus"}
                  </p>
                </div>

                <div
                  style={{
                    background: "#18181B",
                    border: "1px solid #27272A",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <p style={{ fontSize: 11, color: "#A1A1AA", margin: "0 0 4px" }}>
                    Budget journalier estimé
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: isConfigured ? "#EF4444" : "#71717A",
                      margin: 0,
                    }}
                  >
                    {isConfigured ? fmt(dailyBudgetPreview) : "--"}{" "}
                    <span style={{ fontSize: 11, color: "#A1A1AA", fontWeight: 500 }}>
                      FCFA/j
                    </span>
                  </p>
                  <p style={{ fontSize: 10, color: "#71717A", margin: "4px 0 0" }}>
                    {isConfigured
                      ? `(basé sur ${fmt(monthlySalary)} FCFA)`
                      : "Jour de paie requis"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton d'action */}
            <button
              type="submit"
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#EF4444",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "13px 20px",
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!saving) (e.currentTarget as HTMLElement).style.background = "#DC2626";
              }}
              onMouseLeave={(e) => {
                if (!saving) (e.currentTarget as HTMLElement).style.background = "#EF4444";
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Enregistrement en cours...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
