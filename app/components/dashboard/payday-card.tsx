"use client";

import React, { useMemo } from "react";
import { CalendarClock, Wallet, TrendingDown, Settings, AlertCircle } from "lucide-react";
import { useLanguage, formatCurrencyValue } from "@/lib/i18n/LanguageContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaydayCardProps {
  /** Jour du mois de la paie (ex: 28) ou null/0 si non configuré */
  paydayDate?: number | null;
  /** Solde agrégé de tous les comptes */
  totalBalance: number;
  /** Salaire net mensuel pour calibrer le budget quotidien si pas encore de comptes */
  netSalary?: number;
  /** Devise affichée, synchronisée avec la préférence globale */
  currency?: string;
  /** Navigation vers un onglet (ex: réglages) */
  onNavigate?: (tab: string) => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

// ─── Composant PaydayCard ────────────────────────────────────────────────────

export default function PaydayCard({
  paydayDate,
  totalBalance,
  netSalary = 0,
  currency = "XOF",
  onNavigate,
}: PaydayCardProps) {
  const { t, isEn, currency: globalCurrency, language } = useLanguage();
  const activeCurrency = (currency || globalCurrency) as any;
  const isConfigured = Boolean(paydayDate && paydayDate > 0 && paydayDate <= 31);

  const { daysRemaining, dailyBudget, isUrgent, progressPercent } = useMemo(() => {
    if (!isConfigured || !paydayDate) {
      return {
        daysRemaining: null,
        dailyBudget: 0,
        isUrgent: false,
        progressPercent: 0,
      };
    }

    const now = new Date();
    const todayNum = now.getDate();
    const safe = paydayDate;

    let days = safe - todayNum;
    if (days <= 0) {
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      days += daysInMonth;
    }

    const effectiveBalance = totalBalance > 0 ? totalBalance : (netSalary > 0 ? netSalary : 0);
    const budget = days > 0 ? Math.max(0, Math.floor(effectiveBalance / days)) : 0;
    const urgent = days <= 5;

    // Progression dans le cycle (sur 30 jours environ)
    const progress = Math.min(
      100,
      Math.max(4, Math.round(((30 - days) / 30) * 100))
    );

    return {
      daysRemaining: days,
      dailyBudget: budget,
      isUrgent: urgent,
      progressPercent: progress,
    };
  }, [paydayDate, totalBalance, netSalary, isConfigured]);

  return (
    <div
      style={{
        background: isConfigured
          ? "linear-gradient(135deg, rgba(239,68,68,0.07) 0%, #18181B 45%, #18181B 100%)"
          : "linear-gradient(135deg, rgba(245,158,11,0.04) 0%, #18181B 45%, #18181B 100%)",
        border: isConfigured
          ? isUrgent
            ? "1px solid rgba(239,68,68,0.45)"
            : "1px solid #27272A"
          : "1px dashed rgba(245,158,11,0.3)",
        borderRadius: 16,
        padding: "22px 24px 20px",
        boxShadow: isUrgent
          ? "0 0 24px rgba(239,68,68,0.12), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 8px 32px rgba(0,0,0,0.35)",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Ligne lumineuse accent en haut */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: isConfigured
            ? "linear-gradient(90deg, transparent 0%, #EF4444 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, #52525B 50%, transparent 100%)",
          opacity: 0.7,
        }}
      />

      {/* ── HEADER : Titre + Badge jour de paie ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: isConfigured ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
              border: isConfigured ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CalendarClock size={17} color={isConfigured ? "#EF4444" : "#FAFAFA"} />
          </div>
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#FAFAFA",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {t.dashboard.paydayCard.title}
            </h3>
            <p
              style={{
                fontSize: 11,
                color: "#A1A1AA",
                fontWeight: 500,
                marginTop: 1,
              }}
            >
              {isConfigured ? t.dashboard.paydayCard.subtitleActive : t.dashboard.paydayCard.subtitleInactive}
            </p>
          </div>
        </div>

        {/* Badge jour de paie */}
        {isConfigured ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              fontSize: 11,
              fontWeight: 700,
              color: "#EF4444",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            <CalendarClock size={12} />
            {t.dashboard.paydayCard.payOnDay} {paydayDate}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("reglages")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 11,
              fontWeight: 700,
              color: "#FAFAFA",
              letterSpacing: "0.01em",
              cursor: onNavigate ? "pointer" : "default",
              whiteSpace: "nowrap",
            }}
          >
            <AlertCircle size={12} />
            {t.dashboard.paydayCard.notSetConfigure}
          </button>
        )}
      </div>

      {/* ── Barre de progression du cycle ── */}
      <div
        style={{
          width: "100%",
          height: 4,
          background: "#27272A",
          borderRadius: 99,
          marginBottom: 18,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            borderRadius: 99,
            background: isUrgent
              ? "linear-gradient(90deg, #EF4444, #F87171)"
              : "linear-gradient(90deg, #EF4444, #DC2626)",
            transition: "width 0.6s ease",
          }}
        />
      </div>

      {/* ── GRILLE RESPONSIVE ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* ── Colonne 1 : Jours avant la paie ── */}
        <div
          style={{
            background: "#09090B",
            border: "1px solid #27272A",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingDown
              size={13}
              color={isConfigured ? (isUrgent ? "#EF4444" : "#A1A1AA") : "#71717A"}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#A1A1AA",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t.dashboard.paydayCard.daysRemainingLabel}
            </span>
          </div>

          {isConfigured && daysRemaining !== null ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span
                  style={{
                    fontSize: 38,
                    fontWeight: 900,
                    color: isUrgent ? "#EF4444" : "#FAFAFA",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {daysRemaining}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isUrgent ? "#F87171" : "#71717A",
                  }}
                >
                  {isEn ? (daysRemaining > 1 ? "days" : "day") : (daysRemaining > 1 ? "jours" : "jour")}
                </span>
              </div>

              {isUrgent && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#F87171",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#EF4444",
                      display: "inline-block",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  {t.dashboard.paydayCard.urgentWarning}
                </span>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#71717A",
                  letterSpacing: "-0.02em",
                }}
              >
                {t.dashboard.paydayCard.notSetConfigure}
              </span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate("reglages")}
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Settings size={12} /> {t.dashboard.paydayCard.notSetConfigure} →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Colonne 2 : Budget / Jour disponible ── */}
        <div
          style={{
            background: "#09090B",
            border: "1px solid #27272A",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Wallet size={13} color={isConfigured ? "#EF4444" : "#71717A"} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#A1A1AA",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t.dashboard.paydayCard.dailyBudgetLabel}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                fontSize: isConfigured ? 28 : 22,
                fontWeight: 900,
                color: isConfigured ? "#EF4444" : "#71717A",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {isConfigured ? fmt(dailyBudget) : "--"}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#A1A1AA",
              }}
            >
              {currency}
            </span>
          </div>

          {/* Rappel solde agrégé total */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 2,
              padding: "4px 8px",
              background: "rgba(239,68,68,0.06)",
              borderRadius: 6,
              width: "fit-content",
            }}
          >
            <Wallet size={10} color="#71717A" />
            <span
              style={{
                fontSize: 10,
                color: "#71717A",
                fontWeight: 600,
              }}
            >
              {t.dashboard.balance} : {formatCurrencyValue(totalBalance, activeCurrency, language === "en" ? "en-US" : "fr-FR")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
