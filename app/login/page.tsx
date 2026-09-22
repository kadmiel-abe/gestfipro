"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Send,
  User,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LoginPageProps {
  initialSignUp?: boolean;
}

export default function LoginPage({ initialSignUp = false }: LoginPageProps) {
  const router = useRouter();
  const supabase = createClient();

  // Mode connexion ou inscription directe
  const [isSignUp, setIsSignUp] = useState(initialSignUp);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Mot de passe oublié
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Vérification de session active et lecture des paramètres d'URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirectedFrom = params.get("redirectedFrom");
      const targetDest = redirectedFrom && redirectedFrom.startsWith("/") ? redirectedFrom : "/dashboard";

      const errParam = params.get("error");
      const detailsParam = params.get("details") || params.get("error_description");

      if (errParam === "oauth_failed") {
        setError(
          detailsParam
            ? `La connexion avec Google a échoué (${detailsParam}). Veuillez réessayer.`
            : "La connexion avec Google a échoué. Veuillez réessayer ou utiliser votre adresse email."
        );
      } else if (errParam) {
        setError(detailsParam ? `${errParam}: ${detailsParam}` : `Erreur : ${errParam}`);
      }

      if (
        initialSignUp ||
        window.location.pathname.includes("signup") ||
        params.get("mode") === "signup" ||
        params.get("signup") === "true" ||
        params.get("action") === "signup" ||
        params.get("tab") === "signup"
      ) {
        setIsSignUp(true);
      }

      // 1. Vérifier la session existante immédiatement
      supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
        if (data?.session?.user) {
          window.location.href = targetDest;
        }
      });

      // 2. Écouter tout changement d'état d'authentification (ex: retour d'OAuth)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
        if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
          window.location.href = targetDest;
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [supabase, initialSignUp]);

  // Connexion Google OAuth direct
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      setSuccessMsg(null);

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirectedFrom = params?.get("redirectedFrom");
      const targetNext = redirectedFrom && redirectedFrom.startsWith("/") ? redirectedFrom : "/dashboard";
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetNext)}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        console.error("Google signInWithOAuth error:", oauthError);
        setError(oauthError.message || "Erreur de redirection Google.");
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error("Google login exception:", err);
      setError(err?.message || "Une erreur est survenue lors de la connexion Google.");
      setGoogleLoading(false);
    }
  };

  // Connexion / Inscription directe Email & Mot de passe
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError("Veuillez renseigner votre adresse email.");
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Veuillez saisir une adresse email valide (ex: nom@exemple.com).");
      return;
    }
    if (!cleanPassword) {
      setError("Veuillez renseigner votre mot de passe.");
      return;
    }
    if (cleanPassword.length < 6) {
      setError("Le mot de passe doit contenir au minimum 6 caractères.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Mode Inscription
        const resolvedName = name.trim() || cleanEmail.split("@")[0];
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: resolvedName,
              name: resolvedName,
            },
          },
        });

        if (signUpError) {
          if (
            signUpError.message.includes("User already registered") ||
            signUpError.message.includes("already registered") ||
            signUpError.message.includes("already exists")
          ) {
            // L'utilisateur existe déjà, tenter la connexion directe avec son mot de passe
            const { data: retryData, error: retrySignInErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });

            if (retrySignInErr) {
              setError("Ce compte existe déjà. Veuillez vérifier votre mot de passe pour vous connecter.");
              setLoading(false);
              return;
            }

            if (retryData?.user) {
              setSuccessMsg("Connexion réussie ! Redirection vers votre tableau de bord...");
              setTimeout(() => {
                window.location.href = "/dashboard";
              }, 400);
              return;
            }
          }

          setError(signUpError.message || "Erreur lors de la création du compte.");
          setLoading(false);
          return;
        }

        if (signUpData?.user) {
          // Cas où l'utilisateur existe déjà dans Supabase sans renvoyer d'erreur (identities vide)
          if (signUpData.user.identities && signUpData.user.identities.length === 0) {
            const { data: retryData, error: retrySignInErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });

            if (retrySignInErr) {
              setError("Un compte existe déjà avec cette adresse email. Veuillez saisir le mot de passe associé pour vous connecter.");
              setLoading(false);
              return;
            }

            if (retryData?.user) {
              setSuccessMsg("Connexion réussie ! Redirection en cours...");
              setTimeout(() => {
                window.location.href = "/dashboard";
              }, 400);
              return;
            }
          }

          // Initialiser le profil utilisateur (sans jour de paie par défaut)
          try {
            await supabase.from("profiles").upsert({
              id: signUpData.user.id,
              full_name: resolvedName,
              net_salary: 0,
              payday_with_month: null,
            });
          } catch (e) {
            console.warn("Profil auto-init warning:", e);
          }

          // Si une session est créée immédiatement
          if (signUpData.session) {
            setSuccessMsg("Compte créé avec succès ! Accès direct à votre tableau de bord...");
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 400);
            return;
          }

          // Si Supabase nécessite une confirmation par email
          setSuccessMsg("Compte créé ! Veuillez vérifier votre boîte email pour valider votre inscription ou connectez-vous directement.");
          setLoading(false);
          return;
        }
      } else {
        // Mode Connexion standard
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (signInError) {
          if (
            signInError.message.includes("Invalid login credentials") ||
            signInError.message.includes("invalid_credentials") ||
            signInError.message.includes("invalid_grant")
          ) {
            setError("Email ou mot de passe incorrect. Si vous n'avez pas encore de compte, cliquez sur \"Créer un compte\".");
          } else if (signInError.message.includes("Email not confirmed")) {
            setError("Votre adresse email n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception.");
          } else {
            setError(signInError.message || "Erreur lors de la connexion.");
          }
          setLoading(false);
          return;
        }

        if (signInData?.user) {
          setSuccessMsg("Connexion réussie ! Redirection vers votre tableau de bord...");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 300);
          return;
        }

        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      setError(err?.message || "Une erreur inattendue est survenue.");
      setLoading(false);
    }
  };

  // Réinitialisation du mot de passe
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setResetStatus({
        type: "error",
        message: "Veuillez renseigner une adresse email valide.",
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (resetErr) {
        setResetStatus({
          type: "error",
          message: resetErr.message || "Impossible d'envoyer l'email de réinitialisation.",
        });
      } else {
        setResetStatus({
          type: "success",
          message: "Un lien de réinitialisation sécurisé a été envoyé à votre adresse email.",
        });
      }
    } catch (err: any) {
      setResetStatus({
        type: "error",
        message: err?.message || "Erreur lors de la demande de réinitialisation.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-[#EF4444] selection:text-white">
      {/* ── LUMIÈRE D'AMBIANCE CRIMSON RED DARK MODE ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gradient-to-b from-[#EF4444]/15 via-[#EF4444]/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#EF4444]/10 blur-[150px] rounded-full" />
      </div>

      {/* ── TOP BAR / RETOUR AU SITE ── */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors bg-[#18181B]/80 hover:bg-[#27272A] border border-[#27272A] px-3.5 py-2 rounded-xl backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au site</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-[#71717A]">
          <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
          <span>Système 100% opérationnel</span>
        </div>
      </header>

      {/* ── CARTE PRINCIPALE AUTHENTIFICATION ── */}
      <main className="w-full max-w-md my-auto py-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full bg-[#18181B] border border-[#27272A] rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 relative backdrop-blur-xl overflow-hidden"
        >
          {/* Ligne lumineuse en accent rouge */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent" />

          {/* ── EN-TÊTE : LOGO + TITRE ── */}
          <div className="flex flex-col items-center text-center mb-7">
            <Link
              href="/"
              className="w-14 h-14 rounded-2xl overflow-hidden bg-[#09090B] border border-[#27272A] p-2 flex items-center justify-center shadow-lg hover:border-[#EF4444]/50 transition-colors mb-4 group"
            >
              <Image
                src="/logo.png"
                alt="GestFiPro Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </Link>

            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1.5">
              {isSignUp ? "Créer un compte" : "Connexion"}
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-xs">
              {isSignUp
                ? "Rejoignez GestFiPro gratuitement pour gérer votre budget et cycle de paie."
                : "Accédez immédiatement à votre tableau de bord et suivez vos finances."}
            </p>
          </div>

          {/* ── 1. BOUTON GOOGLE OAUTH DIRECT (PRIORITAIRE) ── */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#09090B] border border-[#27272A] hover:border-[#EF4444]/50 hover:bg-[#1c1c20] text-sm font-semibold text-[#FAFAFA] flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 text-[#EF4444] animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{googleLoading ? "Connexion à Google..." : "Continuer avec Google"}</span>
            </button>
          </div>

          {/* ── SÉPARATEUR SOBRE ── */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-full border-t border-[#27272A]" />
            <span className="absolute bg-[#18181B] px-3 text-[11px] font-medium text-[#71717A] uppercase tracking-wider">
              ou avec votre email
            </span>
          </div>

          {/* ── ALERTE ERREUR / SUCCÈS ── */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-5 p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#f87171] flex items-start gap-2.5 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                <span className="leading-snug">{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-5 p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#FAFAFA] flex items-start gap-2.5 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                <span className="leading-snug">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FORMULAIRE EMAIL DIRECT ── */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Nom (uniquement si mode inscription) */}
            {isSignUp && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5"
                >
                  Votre Prénom ou Nom
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-[#52525B] pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Amadou Diallo"
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] rounded-xl py-3 pl-10 pr-4 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Champ Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5"
              >
                Adresse email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-[#52525B] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="nom@exemple.com"
                  autoComplete="email"
                  required
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] rounded-xl py-3 pl-10 pr-4 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none transition-all"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]"
                >
                  Mot de passe
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetStatus(null);
                      setResetModalOpen(true);
                    }}
                    className="text-xs text-[#EF4444] hover:text-[#DC2626] font-semibold hover:underline transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-[#52525B] pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] rounded-xl py-3 pl-10 pr-11 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#71717A] hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bouton d'action principal */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] active:bg-[#B91C1C] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#EF4444]/30 hover:shadow-[#EF4444]/45 transition-all transform active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Créer mon compte et continuer" : "Se connecter"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ── BASCULE RAPIDE CONNEXION / INSCRIPTION ── */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-[#A1A1AA] hover:text-white transition-colors"
            >
              {isSignUp ? (
                <span>
                  Vous avez déjà un compte ?{" "}
                  <strong className="text-[#EF4444] font-bold hover:underline">Se connecter</strong>
                </span>
              ) : (
                <span>
                  Nouveau sur GestFiPro ?{" "}
                  <strong className="text-[#EF4444] font-bold hover:underline">Créer un compte</strong>
                </span>
              )}
            </button>
          </div>

          {/* ── NOTE DE RÉASSURANCE ── */}
          <div className="mt-6 pt-4 border-t border-[#27272A] flex items-center justify-center gap-2 text-[11px] text-[#71717A] text-center font-medium">
            <ShieldCheck className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>Connexion sécurisée SSL • Accès direct au tableau de bord</span>
          </div>
        </motion.div>
      </main>

      {/* ── FOOTER SIMPLE ── */}
      <footer className="w-full text-center py-4 text-[11px] text-[#52525B] z-10">
        <p>© 2026 GestFiPro · Gestion Financière & Cycle de Paie Afrique de l&apos;Ouest</p>
      </footer>

      {/* ── MODAL MOT DE PASSE OUBLIÉ ── */}
      <AnimatePresence>
        {resetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-3xl p-6 sm:p-7 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="absolute top-5 right-5 text-[#71717A] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Réinitialiser votre mot de passe
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé.
                </p>
              </div>

              {resetStatus && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    resetStatus.type === "success"
                      ? "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#FAFAFA]"
                      : "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#f87171]"
                  }`}
                >
                  {resetStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                  )}
                  <span>{resetStatus.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                    Votre adresse email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#52525B] pointer-events-none" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      required
                      className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#EF4444] rounded-xl py-3 pl-10 pr-4 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="w-1/2 py-2.5 px-4 rounded-xl border border-[#27272A] bg-[#09090B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-1/2 py-2.5 px-4 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#EF4444]/30 disabled:opacity-60 cursor-pointer"
                  >
                    {resetLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <>
                        <span>Envoyer</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
