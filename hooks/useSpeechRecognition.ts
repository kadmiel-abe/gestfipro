import { useState, useEffect, useRef, useCallback } from "react";

// ── Types pour Web Speech API ────────────────────────────────────────────────
export interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
    isFinal?: boolean;
    length: number;
  };
  length: number;
}

export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

export interface UseSpeechRecognitionOptions {
  /** Langue de reconnaissance (par défaut 'fr-FR') */
  lang?: string;
  /** Écoute continue ou arrêt automatique après la première phrase */
  continuous?: boolean;
  /** Fournir les résultats intermédiaires en temps réel */
  interimResults?: boolean;
  /** Callback déclenché à chaque segment de texte reconnu */
  onResult?: (transcript: string, isFinal: boolean) => void;
  /** Callback déclenché en cas d'erreur */
  onError?: (errorMessage: string, rawError: string) => void;
  /** Callback déclenché au début de l'écoute */
  onStart?: () => void;
  /** Callback déclenché à la fin de l'écoute */
  onEnd?: () => void;
}

export interface UseSpeechRecognitionReturn {
  /** Indique si le microphone est activement en train d'écouter */
  isListening: boolean;
  /** Indique si le navigateur supporte la Web Speech API */
  isSupported: boolean;
  /** Dernier texte reconnu */
  transcript: string;
  /** Message d'erreur convivial en français (ou null) */
  error: string | null;
  /** Démarre la reconnaissance vocale */
  startListening: () => void;
  /** Arrête la reconnaissance vocale proprement */
  stopListening: () => void;
  /** Alterne entre démarrage et arrêt */
  toggleListening: () => void;
  /** Réinitialise l'erreur courante */
  clearError: () => void;
  /** Réinitialise le texte transcrit */
  resetTranscript: () => void;
}

/**
 * Traduit les codes d'erreur de la Web Speech API en messages compréhensibles.
 */
function getLocalizedErrorMessage(errorCode: string, lang = "fr"): string {
  const isEn = lang.startsWith("en");
  switch (errorCode) {
    case "not-allowed":
      return isEn
        ? "Microphone access denied. Please grant microphone permissions in your browser."
        : "Accès au microphone refusé. Veuillez autoriser le micro dans les paramètres de votre navigateur.";
    case "no-speech":
      return isEn
        ? "No speech detected. Please speak closer to your microphone and try again."
        : "Aucune parole détectée. Veuillez parler distinctement dans le micro et réessayer.";
    case "audio-capture":
      return isEn
        ? "No microphone detected or audio capture failed. Please check your hardware."
        : "Aucun microphone détecté ou problème matériel audio. Vérifiez vos branchements.";
    case "network":
      return isEn
        ? "Network error occurred during speech recognition. Please check your connection."
        : "Erreur réseau lors de la reconnaissance vocale. Vérifiez votre connexion internet.";
    case "service-not-allowed":
      return isEn
        ? "Speech recognition service is not permitted by this browser."
        : "Le service de reconnaissance vocale n'est pas autorisé par votre navigateur.";
    case "language-not-supported":
      return isEn
        ? "The requested language is not supported by your browser."
        : "La langue sélectionnée n'est pas supportée par votre navigateur.";
    case "not-supported":
      return isEn
        ? "Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
        : "La reconnaissance vocale n'est pas supportée par ce navigateur (utilisez Chrome, Edge ou Safari).";
    case "aborted":
      return "";
    default:
      return isEn
        ? "An unexpected error occurred during voice input."
        : "Une erreur est survenue lors de la saisie vocale.";
  }
}

/**
 * Hook personnalisé React pour intégrer facilement la reconnaissance vocale
 * Web Speech API native avec gestion des permissions, retours d'état et erreurs.
 */
export function useSpeechRecognition({
  lang = "fr-FR",
  continuous = false,
  interimResults = false,
  onResult,
  onError,
  onStart,
  onEnd,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isExplicitStopRef = useRef<boolean>(false);

  // Mémorisation des callbacks dans des refs pour éviter de recréer l'instance à chaque re-render
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const langRef = useRef(lang);
  langRef.current = lang;

  // Détection de la disponibilité de l'API au montage côté client
  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    isExplicitStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // En cas d'erreur de stop, on tente abort
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    // Réinitialiser les états
    clearError();
    isExplicitStopRef.current = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      const msg = getLocalizedErrorMessage("not-supported", langRef.current);
      setError(msg);
      onErrorRef.current?.(msg, "not-supported");
      return;
    }

    // Si une instance est déjà en cours, on l'arrête avant de redémarrer
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.lang = langRef.current || "fr-FR";
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        onStartRef.current?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            finalTranscript += text;
          } else {
            currentInterim += text;
          }
        }

        const recognizedText = finalTranscript || currentInterim;
        if (recognizedText) {
          setTranscript(recognizedText);
          onResultRef.current?.(recognizedText, Boolean(finalTranscript));
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // L'utilisateur a stoppé explicitement l'écoute, on n'affiche pas d'erreur
        if (event.error === "aborted" && isExplicitStopRef.current) {
          setIsListening(false);
          return;
        }

        setIsListening(false);
        const userMsg = getLocalizedErrorMessage(event.error, langRef.current);
        if (userMsg) {
          setError(userMsg);
          onErrorRef.current?.(userMsg, event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        onEndRef.current?.();
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      const errMsg = getLocalizedErrorMessage("not-supported", langRef.current);
      setError(errMsg);
      onErrorRef.current?.(errMsg, String(err));
    }
  }, [clearError, continuous, interimResults]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearError,
    resetTranscript,
  };
}
