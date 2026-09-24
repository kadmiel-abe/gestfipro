"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User, Banknote, CalendarDays, ArrowRight, CheckCircle2, Plus, Trash2, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const steps = ["Profil", "Salaire", "Comptes", "Terminé"];

export default function OnboardingPage() {
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [payday, setPayday] = useState("");
  const [customAccounts, setCustomAccounts] = useState<{ id: string; name: string; type: string; balance: number }[]>([]);
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("Espèces");
  const [newAccBal, setNewAccBal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const addCustomAccount = () => {
    if (!newAccName.trim()) return;
    setCustomAccounts((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newAccName.trim(),
        type: newAccType,
        balance: Number(newAccBal) || 0,
      },
    ]);
    setNewAccName("");
    setNewAccBal("");
  };

  const removeCustomAccount = (id: string) => {
    setCustomAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const finishOnboarding = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const netSalary = Number(salary) || 0;
      const paydayNum = Number(payday) > 0 && Number(payday) <= 31 ? Number(payday) : null;
      const fullName = name.trim() || "";

      if (user) {
        // Sauvegarder dans profiles
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName,
          net_salary: netSalary,
          payday_with_month: paydayNum,
        });
        if (profileError) throw profileError;

        // Insérer UNIQUEMENT les comptes explicitement ajoutés par l'utilisateur
        if (customAccounts.length > 0) {
          const accountsToInsert = customAccounts.map((acc) => {
            let type = "cash";
            const lower = acc.type.toLowerCase() + " " + acc.name.toLowerCase();
            if (lower.includes("wave")) type = "wave";
            else if (lower.includes("orange") || lower.includes("mtn") || lower.includes("moov") || lower.includes("mobile")) type = "mobile_money";
            else if (lower.includes("banque") || lower.includes("bank")) type = "bank";

            return {
              user_id: user.id,
              name: acc.name,
              type: type,
              balance: acc.balance,
            };
          });

          const { error: accountsError } = await supabase.from("accounts").insert(accountsToInsert);
          if (accountsError) throw accountsError;
        }
      } else {
        throw new Error("Session utilisateur introuvable. Veuillez vous reconnecter avant de terminer l'onboarding.");
      }

      // Persistance dans localStorage pour la session
      localStorage.setItem("gestfipro_profile", JSON.stringify({
        userName: fullName,
        monthlySalary: netSalary,
        paydayDate: paydayNum || 0,
      }));

      localStorage.setItem("gestfipro_accounts", JSON.stringify(customAccounts));
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Erreur sauvegarde onboarding:", err);
      setSaveError(err?.message || "Impossible d'enregistrer vos informations.");
    } finally {
      setSaving(false);
    }
  };

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
        fontFamily: "var(--font-sans), system-ui, sans-serif",
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
                    placeholder="Votre nom complet"
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
                  Ces informations sont enregistrées dans votre profil sécurisé.
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
                  Optionnel : Vous pouvez ajouter un compte dès maintenant ou commencer avec un tableau de bord vierge et les créer plus tard.
                </p>
              </div>

              {/* Formulaire d'ajout de compte optionnel */}
              <div style={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", marginBottom: 4 }}>
                      Nom du compte
                    </label>
                    <input
                      className="input-field"
                      placeholder="Ex: Wave, Espèces, BOA..."
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", marginBottom: 4 }}>
                      Type
                    </label>
                    <select
                      className="input-field"
                      value={newAccType}
                      onChange={(e) => setNewAccType(e.target.value)}
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    >
                      <option value="Espèces">💵 Espèces</option>
                      <option value="Wave">🌊 Wave</option>
                      <option value="Orange Money">🟠 Orange Money</option>
                      <option value="Mobile Money">📱 Mobile Money (Autre)</option>
                      <option value="Banque">🏦 Compte Bancaire</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", marginBottom: 4 }}>
                    Solde initial (FCFA)
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="0"
                    value={newAccBal}
                    onChange={(e) => setNewAccBal(e.target.value)}
                    style={{ fontSize: 12, padding: "8px 12px" }}
                    min={0}
                  />
                </div>

                <button
                  type="button"
                  onClick={addCustomAccount}
                  style={{
                    background: "#27272A",
                    color: "#FAFAFA",
                    border: "1px solid #3F3F46",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <Plus size={14} /> Ajouter ce compte
                </button>
              </div>

              {/* Liste des comptes ajoutés */}
              {customAccounts.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase" }}>
                    Comptes prêts à être créés ({customAccounts.length}) :
                  </p>
                  {customAccounts.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#09090B",
                        border: "1px solid #27272A",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Wallet size={14} color="#EF4444" />
                        <div>
                          <span style={{ fontWeight: 700, color: "#FAFAFA" }}>{a.name}</span>
                          <span style={{ fontSize: 10, color: "#A1A1AA", marginLeft: 6 }}>({a.type})</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 700, color: "#FAFAFA" }}>{Number(a.balance).toLocaleString("fr-FR")} FCFA</span>
                        <button
                          type="button"
                          onClick={() => removeCustomAccount(a.id)}
                          style={{ background: "none", border: "none", color: "#52525B", cursor: "pointer", padding: 2 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            onClick={step === steps.length - 1 ? finishOnboarding : next}
            disabled={saving}
          >
            {step === steps.length - 1 ? (
              <>{saving ? "Enregistrement..." : "Accéder au tableau de bord"} <ArrowRight size={14} /></>
            ) : (
              <>Continuer <ArrowRight size={14} /></>
            )}
          </button>

          {saveError && (
            <p style={{ color: "#F87171", fontSize: 11, lineHeight: 1.5, margin: 0 }} role="alert">
              {saveError}
            </p>
          )}

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
