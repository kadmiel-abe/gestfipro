"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { CircleAlert, LoaderCircle, Mic, MicOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
 * TYPES — Web Speech API (absente ou incomplète selon les versions de lib.dom)
 * ══════════════════════════════════════════════════════════════════════════ */

interface SpeechAlternativeLike {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechResultLike {
  readonly length: number;
  readonly isFinal: boolean;
  readonly [index: number]: SpeechAlternativeLike;
}

interface SpeechResultListLike {
  readonly length: number;
  readonly [index: number]: SpeechResultLike;
}

interface SpeechResultEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechResultListLike;
}

interface SpeechErrorEventLike extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: ((event: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SupportState = "supported" | "unsupported" | "insecure";
type VoiceStatus = "idle" | "starting" | "listening" | "processing";

interface VoiceError {
  code: string;
  message: string;
}

/** Session d'écoute en cours : toute callback d'une ancienne session est ignorée. */
interface ListeningSession {
  id: number;
  lang: string;
  stopRequested: boolean;
  hadError: boolean;
  retryLang: string | null;
}

export interface VoiceExpenseInputProps {
  /**
   * Reçoit le texte final dicté (ex : « taxi 2000 francs »).
   * Peut renvoyer une Promise : le bouton affiche alors un état « Analyse… ».
   */
  onVoiceSubmit?: (text: string) => void | Promise<void>;
  /** Langue préférée. `fr-CI` est tenté puis remplacé par `fr-FR` s'il est refusé. */
  lang?: string;
  disabled?: boolean;
  className?: string;
}

/* ══════════════════════════════════════════════════════════════════════════
 * CONSTANTES
 * ══════════════════════════════════════════════════════════════════════════ */

const FALLBACK_LANG = "fr-FR";
/** Au-delà de cette durée d'appui, on est en « push-to-talk » : relâcher = envoyer. */
const HOLD_THRESHOLD_MS = 350;
/** Mode « appui simple » : arrêt automatique après ce délai sans nouvelle parole. */
const SILENCE_TIMEOUT_MS = 1800;
/** Garde-fou : durée maximale d'une écoute. */
const MAX_LISTEN_MS = 15000;
/** iOS Safari n'émet parfois jamais `onend` après `stop()` : on finalise nous-mêmes. */
const STOP_WATCHDOG_MS = 1500;

/** Langues refusées par le moteur pendant cette visite (évite de les retenter). */
const unsupportedLangs = new Set<string>();

/* ══════════════════════════════════════════════════════════════════════════
 * HELPERS
 * ══════════════════════════════════════════════════════════════════════════ */

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Détection du support compatible SSR : `null` côté serveur, valeur réelle après hydratation.
const subscribeNoop = () => () => {};
const getSupportSnapshot = (): SupportState => {
  if (!window.isSecureContext) return "insecure";
  return getSpeechRecognitionCtor() ? "supported" : "unsupported";
};
const getServerSupportSnapshot = (): SupportState | null => null;

function getErrorMessage(code: string): string | null {
  switch (code) {
    case "aborted":
      return null;
    case "not-allowed":
      return "Accès au micro refusé. Autorisez le micro pour ce site dans les réglages de votre navigateur.";
    case "service-not-allowed":
      return "Reconnaissance vocale indisponible. Sur iPhone, activez Siri et la Dictée (Réglages › Général › Clavier).";
    case "network":
      return typeof navigator !== "undefined" && !navigator.onLine
        ? "Vous êtes hors ligne. La saisie vocale nécessite une connexion internet."
        : "Problème réseau pendant la reconnaissance vocale. Vérifiez votre connexion et réessayez.";
    case "no-speech":
      return "Je n'ai rien entendu. Parlez près du micro et réessayez.";
    case "audio-capture":
      return "Aucun micro détecté, ou il est déjà utilisé par une autre application.";
    case "language-not-supported":
      return "Le français n'est pas disponible pour la reconnaissance vocale sur cet appareil.";
    case "unsupported":
      return "Votre navigateur ne gère pas la saisie vocale. Ouvrez GestFiPro dans Chrome (Android) ou Safari (iPhone).";
    case "insecure":
      return "La saisie vocale nécessite une connexion sécurisée (HTTPS).";
    case "submit-failed":
      return "L'analyse de votre dépense a échoué. Réessayez.";
    default:
      return "La saisie vocale a rencontré un problème. Réessayez.";
  }
}

function toVoiceError(code: string): VoiceError | null {
  const message = getErrorMessage(code);
  return message ? { code, message } : null;
}

/** Reconstruit tout le texte à partir de `results` (robuste aux comportements iOS / Android). */
function buildTranscript(results: SpeechResultListLike): string {
  let text = "";
  for (let i = 0; i < results.length; i++) {
    text += ` ${results[i]?.[0]?.transcript ?? ""}`;
  }
  return text.replace(/\s+/g, " ").trim();
}

/* ══════════════════════════════════════════════════════════════════════════
 * COMPOSANT
 * ══════════════════════════════════════════════════════════════════════════ */

export default function VoiceExpenseInput({
  onVoiceSubmit,
  lang = FALLBACK_LANG,
  disabled = false,
  className,
}: VoiceExpenseInputProps) {
  const support = useSyncExternalStore(subscribeNoop, getSupportSnapshot, getServerSupportSnapshot);

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<VoiceError | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionRef = useRef<ListeningSession | null>(null);
  const sessionCounterRef = useRef(0);
  const transcriptRef = useRef("");
  const holdingRef = useRef(false);
  const pressStartRef = useRef(0);
  const ignoreNextPointerUpRef = useRef(false);
  const timersRef = useRef<{
    silence?: ReturnType<typeof setTimeout>;
    max?: ReturnType<typeof setTimeout>;
    watchdog?: ReturnType<typeof setTimeout>;
  }>({});
  const onVoiceSubmitRef = useRef(onVoiceSubmit);
  const startListeningRef = useRef<(lang: string) => void>(() => {});

  useEffect(() => {
    onVoiceSubmitRef.current = onVoiceSubmit;
  }, [onVoiceSubmit]);

  /* ── Timers ─────────────────────────────────────────────────────────── */

  const clearTimers = useCallback(() => {
    const timers = timersRef.current;
    clearTimeout(timers.silence);
    clearTimeout(timers.max);
    clearTimeout(timers.watchdog);
    timersRef.current = {};
  }, []);

  /* ── Envoi du texte final ───────────────────────────────────────────── */

  const handleVoiceSubmit = useCallback(async (text: string) => {
    setStatus("processing");
    try {
      // 👉 Point d'intégration Gemini. Exemple avec la route existante :
      // const res = await fetch("/api/parse-expense", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ text }),
      // });
      // if (!res.ok) throw new Error((await res.json()).error);
      await onVoiceSubmitRef.current?.(text);
    } catch (err) {
      console.error("[VoiceExpenseInput] Échec de l'envoi :", err);
      setError(toVoiceError("submit-failed"));
    } finally {
      setStatus("idle");
    }
  }, []);

  /* ── Fin de session (unique point de sortie) ────────────────────────── */

  const finalize = useCallback(
    (sessionId: number) => {
      const session = sessionRef.current;
      if (!session || session.id !== sessionId) return; // déjà finalisée

      sessionRef.current = null;
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
        try {
          recognition.abort(); // sans effet si déjà terminée ; nécessaire après le watchdog
        } catch {
          /* ignore */
        }
      }

      clearTimers();
      holdingRef.current = false;
      setIsHolding(false);

      if (session.hadError) {
        setStatus("idle");
        return;
      }

      const text = transcriptRef.current.trim();
      if (!text) {
        setStatus("idle");
        setError(toVoiceError("no-speech"));
        return;
      }

      void handleVoiceSubmit(text);
    },
    [clearTimers, handleVoiceSubmit]
  );

  /* ── Arrêt demandé (relâchement, 2e appui, silence, durée max) ──────── */

  const requestStop = useCallback(() => {
    const session = sessionRef.current;
    const recognition = recognitionRef.current;
    if (!session || !recognition || session.stopRequested) return;

    session.stopRequested = true;
    clearTimeout(timersRef.current.silence);
    clearTimeout(timersRef.current.max);

    try {
      recognition.stop(); // laisse le moteur livrer le dernier résultat
    } catch {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    }

    timersRef.current.watchdog = setTimeout(() => finalize(session.id), STOP_WATCHDOG_MS);
  }, [finalize]);

  const armSilenceTimer = useCallback(() => {
    clearTimeout(timersRef.current.silence);
    // En push-to-talk, c'est le relâchement du doigt qui décide.
    if (holdingRef.current || !transcriptRef.current) return;
    timersRef.current.silence = setTimeout(requestStop, SILENCE_TIMEOUT_MS);
  }, [requestStop]);

  /* ── Démarrage d'une session ────────────────────────────────────────── */

  const startListening = useCallback(
    (requestedLang: string) => {
      if (!window.isSecureContext) {
        setError(toVoiceError("insecure"));
        return;
      }
      const SpeechRecognition = getSpeechRecognitionCtor();
      if (!SpeechRecognition) {
        setError(toVoiceError("unsupported"));
        return;
      }

      const sessionLang = unsupportedLangs.has(requestedLang) ? FALLBACK_LANG : requestedLang;
      const session: ListeningSession = {
        id: ++sessionCounterRef.current,
        lang: sessionLang,
        stopRequested: false,
        hadError: false,
        retryLang: null,
      };
      const isCurrent = () => sessionRef.current?.id === session.id;

      let recognition: SpeechRecognitionLike;
      try {
        recognition = new SpeechRecognition();
      } catch {
        setError(toVoiceError("unsupported"));
        return;
      }

      // Pas de mode `continuous` : il duplique les résultats sur Android et reste instable sur iOS.
      recognition.lang = sessionLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (!isCurrent()) return;
        setStatus("listening");
        navigator.vibrate?.(15); // retour haptique (Android uniquement)
        timersRef.current.max = setTimeout(requestStop, MAX_LISTEN_MS);
      };

      recognition.onresult = (event) => {
        if (!isCurrent()) return;
        const text = buildTranscript(event.results);
        transcriptRef.current = text;
        setTranscript(text);
        armSilenceTimer();
      };

      recognition.onerror = (event) => {
        if (!isCurrent()) return;
        // `onend` suit toujours `onerror` : la finalisation se fait là-bas.
        if (event.error === "aborted") return;
        if (event.error === "no-speech" && transcriptRef.current) return;
        if (event.error === "language-not-supported" && sessionLang !== FALLBACK_LANG) {
          unsupportedLangs.add(sessionLang);
          session.retryLang = FALLBACK_LANG;
          return;
        }
        session.hadError = true;
        setError(toVoiceError(event.error));
      };

      recognition.onend = () => {
        if (!isCurrent()) return;
        if (session.retryLang) {
          // Relance transparente en fr-FR si la langue demandée (ex : fr-CI) est refusée.
          sessionRef.current = null;
          recognitionRef.current = null;
          clearTimers();
          startListeningRef.current(session.retryLang);
          return;
        }
        finalize(session.id);
      };

      sessionRef.current = session;
      recognitionRef.current = recognition;
      transcriptRef.current = "";
      setTranscript("");
      setError(null);
      setStatus("starting");

      try {
        recognition.start();
      } catch (err) {
        console.error("[VoiceExpenseInput] start() a échoué :", err);
        sessionRef.current = null;
        recognitionRef.current = null;
        setStatus("idle");
        setError(toVoiceError("unknown"));
      }
    },
    [armSilenceTimer, clearTimers, finalize, requestStop]
  );

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  /** Annule sans rien envoyer. */
  const cancelListening = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.hadError = true; // empêche l'envoi dans finalize
    finalize(session.id);
    transcriptRef.current = "";
    setTranscript("");
  }, [finalize]);

  /* ── Cycle de vie : arrière-plan & démontage ────────────────────────── */

  useEffect(() => {
    // Mobile : passage en arrière-plan (appel, changement d'app) → on coupe le micro.
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") cancelListening();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      const recognition = recognitionRef.current;
      sessionRef.current = null;
      recognitionRef.current = null;
      clearTimers();
      if (recognition) {
        recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, [cancelListening, clearTimers]);

  /* ── Interactions : appui maintenu OU appui simple ──────────────────── */

  const isUnavailable = support === "unsupported" || support === "insecure";
  const isActive = status === "starting" || status === "listening";
  const isBusy = status === "processing";

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (disabled || isBusy) return;

    if (isUnavailable) {
      setError(toVoiceError(support));
      return;
    }

    // Déjà en écoute (mode appui simple) → ce nouvel appui termine la dictée.
    if (sessionRef.current) {
      ignoreNextPointerUpRef.current = true;
      requestStop();
      return;
    }

    try {
      // Garantit la réception de `pointerup` même si le doigt glisse hors du bouton.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    pressStartRef.current = performance.now();
    holdingRef.current = true;
    setIsHolding(true);
    startListening(lang);
  };

  const handlePointerUp = () => {
    if (ignoreNextPointerUpRef.current) {
      ignoreNextPointerUpRef.current = false;
      return;
    }
    if (!holdingRef.current) return;

    holdingRef.current = false;
    setIsHolding(false);

    if (performance.now() - pressStartRef.current >= HOLD_THRESHOLD_MS) {
      requestStop(); // push-to-talk : relâcher = envoyer
    } else {
      armSilenceTimer(); // appui simple : arrêt auto au silence
    }
  };

  /** iOS : la popup de permission interrompt l'appui → on bascule en mode appui simple. */
  const handlePointerCancel = () => {
    ignoreNextPointerUpRef.current = false;
    holdingRef.current = false;
    setIsHolding(false);
  };

  /** Activation clavier (Entrée / Espace) : `detail === 0` ⇒ clic non issu d'un pointeur. */
  const handleKeyboardClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0 || disabled || isBusy) return;
    if (isUnavailable) {
      setError(toVoiceError(support));
      return;
    }
    if (sessionRef.current) requestStop();
    else startListening(lang);
  };

  /* ── Rendu ──────────────────────────────────────────────────────────── */

  const helperText = isBusy
    ? "Analyse de votre dépense…"
    : status === "starting"
      ? "Activation du micro…"
      : status === "listening"
        ? isHolding
          ? "Je vous écoute… relâchez pour envoyer"
          : "Je vous écoute… appuyez pour terminer"
        : "Maintenez pour parler, ou appuyez une fois";

  const buttonLabel = isActive ? "Terminer la dictée" : "Dicter une dépense";

  return (
    <section
      aria-label="Saisie vocale d'une dépense"
      className={cn("flex w-full flex-col items-center gap-4 text-[#FAFAFA]", className)}
    >
      {/* ── Bouton micro + ondes ── */}
      <div className="relative flex h-44 w-44 items-center justify-center">
        {status === "listening" && (
          <>
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-[#EF4444]/15 blur-2xl motion-safe:animate-pulse"
            />
            {[0, 0.6, 1.2].map((delay) => (
              <span
                key={delay}
                aria-hidden
                className="absolute inset-6 rounded-full border-2 border-[#EF4444]/60 bg-[#EF4444]/10 motion-safe:animate-ping"
                style={{ animationDuration: "1.8s", animationDelay: `${delay}s` }}
              />
            ))}
          </>
        )}

        <button
          id="voice-expense-button"
          type="button"
          aria-label={buttonLabel}
          aria-pressed={isActive}
          aria-disabled={disabled || isBusy || isUnavailable}
          aria-describedby="voice-expense-helper"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClick={handleKeyboardClick}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            "relative z-10 flex h-28 w-28 cursor-pointer items-center justify-center rounded-full transition-all duration-200",
            // Mobile : pas de menu « appui long », de sélection, de zoom ni de surlignage au toucher.
            "touch-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4444]/40 focus-visible:ring-offset-4 focus-visible:ring-offset-[#09090B]",
            isUnavailable || disabled
              ? "cursor-not-allowed border border-[#27272A] bg-[#18181B] text-[#52525B]"
              : isActive
                ? "scale-110 bg-linear-to-br from-[#F87171] to-[#DC2626] text-white shadow-[0_0_50px_rgba(239,68,68,0.55)]"
                : isBusy
                  ? "bg-[#27272A] text-[#FAFAFA]"
                  : "bg-linear-to-br from-[#EF4444] to-[#B91C1C] text-white shadow-[0_10px_40px_rgba(239,68,68,0.35)] hover:shadow-[0_10px_50px_rgba(239,68,68,0.5)] active:scale-95"
          )}
        >
          {isBusy ? (
            <LoaderCircle className="h-10 w-10 animate-spin" aria-hidden />
          ) : isUnavailable ? (
            <MicOff className="h-10 w-10" aria-hidden />
          ) : (
            <Mic className={cn("h-11 w-11", status === "listening" && "motion-safe:animate-pulse")} aria-hidden />
          )}
        </button>
      </div>

      {/* ── Consigne / état ── */}
      <p id="voice-expense-helper" className="text-center text-xs font-semibold text-[#A1A1AA] sm:text-sm">
        {helperText}
      </p>

      {/* ── Transcription temps réel ── */}
      <div
        aria-live="polite"
        className={cn(
          "relative flex min-h-[4.5rem] w-full max-w-sm items-center justify-center rounded-2xl border px-4 py-3 text-center transition-colors",
          isActive ? "border-[#EF4444]/40 bg-[#EF4444]/5" : "border-[#27272A] bg-[#18181B]"
        )}
      >
        {transcript ? (
          <p className="text-base font-semibold leading-snug text-[#FAFAFA] first-letter:uppercase">
            {transcript}
            {status === "listening" && (
              <span aria-hidden className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-[#EF4444] motion-safe:animate-pulse" />
            )}
          </p>
        ) : (
          <p className="text-sm italic text-[#52525B]">Ex. : « Taxi deux mille francs »</p>
        )}

        {isActive && (
          <button
            id="voice-expense-cancel"
            type="button"
            onClick={cancelListening}
            aria-label="Annuler la dictée"
            className="absolute -right-2 -top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#27272A] bg-[#09090B] text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* ── Erreurs ── */}
      {(error || isUnavailable) && (
        <div
          role="alert"
          className="flex w-full max-w-sm items-start gap-2.5 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3.5 py-3 text-left"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" aria-hidden />
          <p className="flex-1 text-xs font-medium leading-relaxed text-[#FECACA]">
            {error?.message ?? (support ? getErrorMessage(support) : null)}
          </p>
          {error && !isUnavailable && (
            <button
              id="voice-expense-dismiss-error"
              type="button"
              onClick={() => setError(null)}
              aria-label="Fermer le message"
              className="shrink-0 cursor-pointer text-[#FCA5A5] transition-colors hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
