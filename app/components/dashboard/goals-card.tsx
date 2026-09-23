"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  CalendarDays,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Goal } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GoalsCardProps {
  /** Objectifs d'épargne de l'utilisateur */
  goals: Goal[];
  /** ID de l'utilisateur Supabase */
  userId: string | null;
  /** Callback après ajout/modification d'un objectif */
  onGoalChanged?: () => void;
  /** Navigation vers l'onglet objectifs */
  onNavigate?: (tab: string) => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

// ─── Couleurs par progression ────────────────────────────────────────────────

function getProgressColor(pct: number): string {
  if (pct >= 100) return "#FAFAFA";
  if (pct >= 75) return "#EF4444";
  if (pct >= 50) return "#EF4444";
  if (pct >= 25) return "#DC2626";
  return "#B91C1C";
}

// ─── Modal de création d'objectif ────────────────────────────────────────────

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onGoalCreated?: () => void;
}

function CreateGoalModal({
  isOpen,
  onClose,
  userId,
  onGoalCreated,
}: CreateGoalModalProps) {
  const supabase = createClient();
  const { t, isEn } = useLanguage();
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setTargetAmount("");
      setTargetDate("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(isEn ? "Please enter a title for your goal." : "Veuillez saisir un nom pour votre objectif.");
      return;
    }
    const amount = Number(targetAmount);
    if (!amount || amount <= 0) {
      setError(isEn ? "Please enter a valid target amount." : "Veuillez saisir un montant cible valide.");
      return;
    }

    setLoading(true);
    try {
      if (userId) {
        const { error: insertErr } = await supabase.from("goals").insert({
          user_id: userId,
          title: title.trim(),
          target_amount: amount,
          current_amount: 0,
          target_date: targetDate || null,
        });
        if (insertErr) {
          setError(insertErr.message);
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onGoalCreated) onGoalCreated();
      }, 600);
    } catch (err: any) {
      setError(err?.message || (isEn ? "Unexpected error." : "Erreur inattendue."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(6px)",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#18181B",
          border: "1px solid #27272A",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Ligne accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #EF4444, transparent)",
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "20px 24px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#FAFAFA",
                letterSpacing: "-0.02em",
              }}
            >
              {t.dashboard.goalsPage.modalTitle}
            </h3>
            <p style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>
              {isEn ? "Set a target for your project" : "Définissez une cible financière pour votre projet"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#09090B",
              border: "1px solid #27272A",
              borderRadius: 10,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#A1A1AA",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "18px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Nom du projet */}
          <div>
            <label style={labelStyle}>{t.dashboard.goalsPage.goalTitleLabel}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder={t.dashboard.goalsPage.goalTitlePlaceholder}
              required
              style={inputStyle}
            />
          </div>

          {/* Montant cible */}
          <div>
            <label style={labelStyle}>{t.dashboard.goalsPage.targetAmountLabel}</label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => {
                  setTargetAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: 500 000"
                min="1"
                required
                style={{
                  ...inputStyle,
                  fontSize: 16,
                  fontWeight: 700,
                  paddingRight: 60,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#EF4444",
                  pointerEvents: "none",
                }}
              >
                FCFA
              </span>
            </div>
          </div>

          {/* Date cible (optionnel) */}
          <div>
            <label style={labelStyle}>
              <CalendarDays
                size={10}
                style={{ display: "inline", marginRight: 4 }}
              />
              {t.dashboard.goalsPage.deadlineLabel} ({isEn ? "optional" : "optionnel"})
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Erreur */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                fontSize: 12,
                color: "#F87171",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background: success ? "#EF4444" : "#EF4444",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || success ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                {isEn ? "Creating..." : "Création..."}
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={16} />
                {isEn ? "Goal created!" : "Objectif créé !"}
              </>
            ) : (
              <>
                <Target size={16} />
                {t.dashboard.goalsPage.saveBtn}
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Composant GoalsCard ─────────────────────────────────────────────────────

export default function GoalsCard({
  goals,
  userId,
  onGoalChanged,
  onNavigate,
}: GoalsCardProps) {
  const supabase = createClient();
  const { t, isEn, language } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedingGoalId, setFeedingGoalId] = useState<string | null>(null);
  const [feedAmount, setFeedAmount] = useState("");
  const [feedLoading, setFeedLoading] = useState(false);

  // Alimenter un objectif
  const handleFeedGoal = async (goalId: string) => {
    const amount = Number(feedAmount);
    if (!amount || amount <= 0) return;

    setFeedLoading(true);
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const newAmount = Math.min(
        goal.current_amount + amount,
        goal.target_amount
      );

      if (userId && typeof goalId === "string" && goalId.length > 10) {
        await supabase
          .from("goals")
          .update({ current_amount: newAmount })
          .eq("id", goalId);
      }

      setFeedingGoalId(null);
      setFeedAmount("");
      if (onGoalChanged) onGoalChanged();
    } catch (err) {
      console.error("Erreur alimentation objectif:", err);
    } finally {
      setFeedLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          background: "#18181B",
          border: "1px solid #27272A",
          borderRadius: 16,
          padding: "22px 24px",
          marginBottom: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Target size={14} color="#EF4444" />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FAFAFA",
                  lineHeight: 1.2,
                }}
              >
                {t.dashboard.home.savingsGoals}
              </h3>
              <p style={{ fontSize: 10, color: "#71717A", marginTop: 1 }}>
                {goals.length} {isEn ? (goals.length > 1 ? "active goals" : "active goal") : (goals.length > 1 ? "objectifs actifs" : "objectif actif")}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {onNavigate && (
              <button
                onClick={() => onNavigate("objectifs")}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#EF4444",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: "4px 8px",
                  borderRadius: 6,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(239,68,68,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {t.dashboard.home.seeAllGoals}
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#EF4444",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
              }}
            >
              <Plus size={12} />
              {isEn ? "Add" : "Ajouter"}
            </button>
          </div>
        </div>

        {/* Liste des objectifs */}
        {goals.length === 0 ? (
          <div
            style={{
              padding: "28px 0",
              textAlign: "center",
              color: "#71717A",
            }}
          >
            <Sparkles
              size={28}
              style={{ margin: "0 auto 10px", opacity: 0.4 }}
            />
            <p
              style={{ fontSize: 13, fontWeight: 600, color: "#A1A1AA" }}
            >
              {t.dashboard.goalsPage.emptyGoals}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                marginTop: 14,
                padding: "8px 20px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#EF4444",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus size={13} />
              {t.dashboard.goalsPage.addFirstGoal}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {goals.slice(0, 3).map((goal) => {
              const pct =
                goal.target_amount > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (goal.current_amount / goal.target_amount) * 100
                      )
                    )
                  : 0;
              const progressColor = getProgressColor(pct);
              const isComplete = pct >= 100;
              const isFeeding = feedingGoalId === goal.id;

              return (
                <div
                  key={goal.id}
                  style={{
                    background: "#09090B",
                    border: isComplete
                      ? "1px solid rgba(16,185,129,0.3)"
                      : "1px solid #27272A",
                    borderRadius: 12,
                    padding: "14px 16px",
                    transition: "border-color 0.15s",
                  }}
                >
                  {/* Titre + pourcentage */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: isComplete
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(239,68,68,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isComplete ? (
                          <CheckCircle2 size={14} color="#EF4444" />
                        ) : (
                          <TrendingUp size={13} color={progressColor} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#FAFAFA",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {goal.title}
                        </p>
                        {goal.target_date && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "#52525B",
                              marginTop: 1,
                            }}
                          >
                            {isEn ? "Due:" : "Échéance :"} {new Date(goal.target_date).toLocaleDateString(
                              language === "en" ? "en-US" : "fr-FR",
                              { day: "numeric", month: "short", year: "numeric" }
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: progressColor,
                        marginLeft: 8,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      background: "#27272A",
                      borderRadius: 99,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 99,
                        background: isComplete
                          ? "linear-gradient(90deg, #EF4444, #FAFAFA)"
                          : `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>

                  {/* Montants + bouton alimenter */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <p style={{ fontSize: 11, color: "#A1A1AA" }}>
                      <span style={{ fontWeight: 700, color: "#FAFAFA" }}>
                        {fmt(goal.current_amount)}
                      </span>{" "}
                      / {fmt(goal.target_amount)} FCFA
                    </p>

                    {!isComplete && !isFeeding && (
                      <button
                        onClick={() => setFeedingGoalId(goal.id)}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#EF4444",
                          background: "none",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 6,
                          padding: "3px 10px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,68,68,0.08)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        + {isEn ? "Fund" : "Alimenter"}
                      </button>
                    )}

                    {isComplete && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#EF4444",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={12} />
                        {t.dashboard.goalsPage.goalCompleted}
                      </span>
                    )}
                  </div>

                  {/* Input inline pour alimenter */}
                  {isFeeding && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 10,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="number"
                        value={feedAmount}
                        onChange={(e) => setFeedAmount(e.target.value)}
                        placeholder="Montant FCFA"
                        min="1"
                        autoFocus
                        style={{
                          flex: 1,
                          background: "#18181B",
                          border: "1px solid #27272A",
                          borderRadius: 8,
                          padding: "7px 12px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#FAFAFA",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleFeedGoal(goal.id);
                          if (e.key === "Escape") {
                            setFeedingGoalId(null);
                            setFeedAmount("");
                          }
                        }}
                      />
                      <button
                        onClick={() => handleFeedGoal(goal.id)}
                        disabled={feedLoading}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 8,
                          background: "#EF4444",
                          border: "none",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          opacity: feedLoading ? 0.6 : 1,
                        }}
                      >
                        {feedLoading ? "..." : "OK"}
                      </button>
                      <button
                        onClick={() => {
                          setFeedingGoalId(null);
                          setFeedAmount("");
                        }}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          background: "none",
                          border: "1px solid #27272A",
                          color: "#A1A1AA",
                          fontSize: 12,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de création */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={userId}
        onGoalCreated={() => {
          setShowCreateModal(false);
          if (onGoalChanged) onGoalChanged();
        }}
      />
    </>
  );
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: 11,
  fontWeight: 600,
  color: "#A1A1AA",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#09090B",
  border: "1px solid #27272A",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  color: "#FAFAFA",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};
