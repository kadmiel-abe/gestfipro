"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight, Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!username.trim()) {
      setError("Veuillez saisir votre nom d'utilisateur.");
      return;
    }
    if (!password.trim()) {
      setError("Veuillez saisir votre mot de passe.");
      return;
    }
    if (password.length < 4) {
      setError("Mot de passe trop court (minimum 4 caractères).");
      return;
    }

    // Simulation connexion (MVP : pas d'auth réelle)
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/";
    }, 800);
  };

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
      {/* Radial glow BG */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* ── LOGO CENTRÉ ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Logo — overflow:hidden + borderRadius pour coins arrondis */}
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 18,
              overflow: "hidden",
              flexShrink: 0,
              lineHeight: 0,
            }}
          >
            <Image
              src="/logo.png"
              alt="GestFiPro — Gestion Financière"
              width={90}
              height={90}
              style={{
                objectFit: "contain",
                width: 90,
                height: 90,
                display: "block",
                mixBlendMode: "screen",
              }}
              priority
              quality={95}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.5 }}>
              Connectez-vous pour accéder à votre tableau de bord financier
            </p>
          </div>
        </div>

        {/* ── FORMULAIRE ──────────────────────────────────────────────────── */}
        <div
          style={{
            width: "100%",
            background: "#18181B",
            border: "1px solid #27272A",
            borderRadius: 20,
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#FAFAFA",
                letterSpacing: "-0.03em",
                marginBottom: 4,
              }}
            >
              Connexion
            </h1>
            <p style={{ fontSize: 12, color: "#A1A1AA" }}>
              Pas encore inscrit ?{" "}
              <a href="/onboarding" style={{ color: "#EF4444", textDecoration: "none", fontWeight: 600 }}>
                Créer un compte
              </a>
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Erreur */}
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "#f87171",
                }}
              >
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Nom d'utilisateur */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#A1A1AA",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                Nom d'utilisateur
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <User
                  size={14}
                  color="#52525B"
                  style={{ position: "absolute", left: 12, pointerEvents: "none" }}
                />
                <input
                  className="input-field"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Ex: kadmiel_abe"
                  style={{ paddingLeft: 36 }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#A1A1AA",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                Mot de passe
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock
                  size={14}
                  color="#52525B"
                  style={{ position: "absolute", left: 12, pointerEvents: "none" }}
                />
                <input
                  className="input-field"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#52525B",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Mot de passe oublié */}
            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                onClick={() => alert("🔑 Réinitialisation du mot de passe :\n\nContactez votre administrateur ou recréez un compte via « Créer un compte ».\n\n(Fonctionnalité email à venir)")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 11,
                  color: "#EF4444",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* CTA */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                justifyContent: "center",
                padding: "11px 0",
                marginTop: 4,
                width: "100%",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 11, color: "#52525B", textAlign: "center" }}>
          GestFiPro · Gestion Financière Afrique de l'Ouest
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
