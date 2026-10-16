"use client";

import React, { useState, useRef, useId } from "react";
import { Camera, KeyRound, Check, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export interface SidebarProfileProps {
  initialFullName?: string;
  initialEmail?: string;
  initialAvatarUrl?: string;
  subtitle?: string;
  collapsed?: boolean;
  onProfileUpdate?: (updated: { fullName: string; email: string; avatarUrl?: string }) => void;
  className?: string;
}

export default function SidebarProfile({
  initialFullName = "Utilisateur",
  initialEmail = "utilisateur@gestfipro.com",
  initialAvatarUrl,
  subtitle = "Compte personnel",
  collapsed = false,
  onProfileUpdate,
  className = "",
}: SidebarProfileProps) {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Initialisation paresseuse pour éviter les problèmes d'hydratation et cascade de rendus
  const [fullName, setFullName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gestfipro_profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.full_name) return parsed.full_name;
        }
      } catch {
        // Ignorer les erreurs d'accès au localStorage
      }
    }
    return initialFullName;
  });

  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gestfipro_profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.email) return parsed.email;
        }
      } catch {
        // Ignorer les erreurs d'accès au localStorage
      }
    }
    return initialEmail;
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gestfipro_profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          // Si un URL blob temporaire résiduel existe (expiré), on l'ignore
          if (parsed.avatar_url && !parsed.avatar_url.startsWith("blob:")) {
            return parsed.avatar_url;
          }
        }
      } catch {
        // Ignorer les erreurs d'accès au localStorage
      }
    }
    return initialAvatarUrl || null;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const nameInputId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();

  // Initiales dynamiques
  const initials = React.useMemo(() => {
    const target = (fullName || initialFullName || "U").trim();
    const parts = target.split(" ").filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase() || "GF";
  }, [fullName, initialFullName]);

  // Gestion de la photo de profil avec persistance Base64 pérenne
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limiter la taille à 2 Mo pour assurer une performance maximale
      if (file.size > 2 * 1024 * 1024) {
        alert("La photo sélectionnée dépasse 2 Mo. Veuillez choisir une image plus légère.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
          setImageError(false);
        }
      };
      reader.onerror = () => {
        setImageError(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Retirer la photo de profil et revenir aux initiales
  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Enregistrement des modifications
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Persistance locale immédiate dans localStorage
      const profileToSave = {
        full_name: fullName.trim(),
        email: email.trim(),
        avatar_url: imageError ? null : avatarUrl,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem("gestfipro_profile", JSON.stringify(profileToSave));

      // 2. Synchronisation Supabase si session existante
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        });

        if (newPassword.trim() && showPasswordSection) {
          const { error: pwdErr } = await supabase.auth.updateUser({
            password: newPassword.trim(),
          });
          if (pwdErr) {
            setPasswordFeedback("Erreur mot de passe: " + pwdErr.message);
          } else {
            setPasswordFeedback("Mot de passe mis à jour !");
            setNewPassword("");
          }
        }
      }

      onProfileUpdate?.({
        fullName: fullName.trim(),
        email: email.trim(),
        avatarUrl: (!imageError && avatarUrl) || undefined,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setOpen(false);
      }, 900);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ── Trigger : Zone cliquable englobant Avatar, Nom et Sous-titre ── */}
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Modifier mon profil"
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-white/5 cursor-pointer text-left group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#EF4444] ${
            collapsed ? "justify-center" : "justify-start"
          } ${className}`}
        >
          {/* Avatar avec initiales ou image sécurisée */}
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-md shadow-[#EF4444]/25 ring-1 ring-[#27272A] overflow-hidden group-hover:scale-105 transition-transform">
            {avatarUrl && !imageError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Nom et sous-titre */}
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs font-bold text-[#FAFAFA] truncate group-hover:text-white transition-colors">
                {fullName || "Utilisateur"}
              </p>
              <p className="text-[10px] text-[#A1A1AA] truncate group-hover:text-[#D4D4D8] transition-colors">
                {subtitle}
              </p>
            </div>
          )}
        </button>
      </DialogTrigger>

      {/* ── Modale : Strict Dark Mode ── */}
      <DialogContent className="bg-[#18181B] border border-[#27272A] text-[#FAFAFA] max-w-md p-6 sm:rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-[#FAFAFA]">
            Mon Profil
          </DialogTitle>
          <DialogDescription className="text-xs text-[#A1A1AA]">
            Gérez vos informations personnelles et préférences de compte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 mt-2">
          {/* 1. Section Photo : Avatar grand format + boutons */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#09090B] border border-[#27272A]">
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-lg font-black text-white shrink-0 shadow-lg shadow-[#EF4444]/25 ring-2 ring-[#27272A] overflow-hidden">
              {avatarUrl && !imageError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-bold text-[#FAFAFA]">Photo de profil</p>
              <p className="text-[11px] text-[#A1A1AA]">
                JPG, PNG ou WebP (max 2 Mo).
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272A] bg-transparent hover:bg-white/5 text-xs font-semibold text-[#FAFAFA] transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Changer la photo</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#27272A] bg-transparent hover:bg-red-500/10 text-xs font-medium text-[#A1A1AA] hover:text-red-400 transition-colors cursor-pointer"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retirer</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Nom complet */}
          <div className="space-y-1.5">
            <Label htmlFor={nameInputId} className="text-xs font-semibold text-[#A1A1AA]">
              Nom complet
            </Label>
            <Input
              id={nameInputId}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ex: Kadmiel Abe"
              required
              className="bg-[#09090B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]"
            />
          </div>

          {/* 3. Adresse email */}
          <div className="space-y-1.5">
            <Label htmlFor={emailInputId} className="text-xs font-semibold text-[#A1A1AA]">
              Adresse email
            </Label>
            <Input
              id={emailInputId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: contact@gestfipro.com"
              required
              className="bg-[#09090B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]"
            />
          </div>

          {/* 4. Bouton Modifier le mot de passe (UI optionnelle avec expansion) */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl border border-[#27272A] bg-[#09090B] hover:bg-white/5 text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Modifier le mot de passe</span>
              </span>
              <span className="text-[10px] text-[#71717A]">
                {showPasswordSection ? "Masquer" : "Configurer"}
              </span>
            </button>

            {showPasswordSection && (
              <div className="p-3 rounded-xl bg-[#09090B]/60 border border-[#27272A] space-y-2 animate-in fade-in duration-200">
                <Label htmlFor={passwordInputId} className="text-[11px] font-semibold text-[#A1A1AA]">
                  Nouveau mot de passe
                </Label>
                <Input
                  id={passwordInputId}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="bg-[#09090B] border-[#27272A] text-[#FAFAFA] text-xs h-9"
                />
                {passwordFeedback && (
                  <p className="text-[11px] text-[#EF4444] font-medium">
                    {passwordFeedback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notification de succès */}
          {saveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Modifications enregistrées avec succès !</span>
            </div>
          )}

          {/* 5. Bouton principal d'enregistrement (Accent #EF4444) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-[#FAFAFA] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#EF4444]/25 transition-all transform active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <span>Enregistrer les modifications</span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
