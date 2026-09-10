"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User, Banknote, CalendarDays, ArrowRight, CheckCircle2 } from "lucide-react";

const steps = ["Profil", "Salaire", "Comptes", "Terminé"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [payday, setPayday] = useState("28");

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        {/* ── LOGO ─────────────────────────────────────────────────────────── */}
        <Image
          src="/logo.png"
          alt="GestFiPro"
          width={120}
          height={120}
          style={{ objectFit: "contain", width: 120, height: 120 }}
          priority
          quality={90}
        />

        {/* ── STEPPER ───────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: i <= step ? "#EF4444" : "#18181B",
                    border: `1px solid ${i <= step ? "#EF4444" : "#27272A"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: i <= step ? "white" : "#52525B",
                    transition: "all 0.3s ease",
                  }}
                >
                  {i < step ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: i <= step ? "#FAFAFA" : "#52525B",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: i < step ? "#EF4444" : "#27272A",
                    marginBottom: 18,
                    transition: "background 0.3s ease",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── FORM CARD ─────────────────────────────────────────────────────── */}
        <div
          style={{
            width: "100%",
            background: "#18181B",
            border: "1px solid #27272A",
            borderRadius: 20,
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Step 0: Profil */}
          {step === 0 && (
            <>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.03em", marginBottom: 4 }}>
                  Bienvenue sur GestFiPro 🎉
                </h1>
                <p style={{ fontSize: 12, color: "#A1A1AA" }}>
                  Commençons par configurer votre profil en quelques étapes simples.
                </p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Votre prénom
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={14} color="#52525B" style={{ position: "absolute", left: 12 }} />
                  <input
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Kadmiel"
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 1: Salaire */}
          {step === 1 && (
            <>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.03em", marginBottom: 4 }}>
                  Votre salaire net 💰
                </h2>
                <p style={{ fontSize: 12, color: "#A1A1AA" }}>
                  Ces informations restent locales — aucune donnée n'est partagée.
                </p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Salaire net mensuel (FCFA)
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Banknote size={14} color="#52525B" style={{ position: "absolute", left: 12 }} />
                  <input
                    className="input-field"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="Ex : 750000"
                    style={{ paddingLeft: 36 }}
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Jour de versement (1–31)
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <CalendarDays size={14} color="#52525B" style={{ position: "absolute", left: 12 }} />
                  <input
                    className="input-field"
                    type="number"
                    value={payday}
                    onChange={(e) => setPayday(e.target.value)}
                    min={1}
                    max={31}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Comptes */}
          {step === 2 && (
            <>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.03em", marginBottom: 4 }}>
                  Vos comptes 🏦
                </h2>
                <p style={{ fontSize: 12, color: "#A1A1AA" }}>
                  Indiquez vos soldes actuels pour initialiser votre tableau de bord.
                </p>
              </div>
              {[
                { label: "Espèces", icon: "💵", placeholder: "Ex : 50000" },
                { label: "Wave", icon: "🌊", placeholder: "Ex : 120000" },
                { label: "Orange Money", icon: "🟠", placeholder: "Ex : 80000" },
                { label: "Compte Bancaire", icon: "🏦", placeholder: "Ex : 450000" },
              ].map((acc) => (
                <div key={acc.label}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {acc.icon} {acc.label} (FCFA)
                  </label>
                  <input className="input-field" type="number" placeholder={acc.placeholder} min={0} />
                </div>
              ))}
            </>
          )}

          {/* Step 3: Terminé */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎊</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FAFAFA", letterSpacing: "-0.03em", marginBottom: 8 }}>
                C'est prêt, {name || "vous"} !
              </h2>
              <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.6 }}>
                Votre profil GestFiPro est configuré. Accédez à votre tableau de bord pour commencer à suivre vos finances.
              </p>
            </div>
          )}

          {/* CTA Button */}
          <button
            className="btn-primary"
            style={{ justifyContent: "center", padding: "11px 0", width: "100%" }}
            onClick={step === steps.length - 1 ? () => (window.location.href = "/") : next}
          >
            {step === steps.length - 1 ? (
              <>Accéder au tableau de bord <ArrowRight size={14} /></>
            ) : (
              <>Continuer <ArrowRight size={14} /></>
            )}
          </button>

          {step > 0 && step < steps.length - 1 && (
            <button
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#52525B", fontFamily: "inherit" }}
              onClick={() => setStep((s) => s - 1)}
            >
              ← Retour
            </button>
          )}
        </div>

        <p style={{ fontSize: 11, color: "#52525B", textAlign: "center" }}>
          GestFiPro · Gestion Financière Afrique de l'Ouest
        </p>
      </div>
    </div>
  );
}
