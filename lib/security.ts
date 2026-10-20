/**
 * Utilitaires de sécurité centralisés pour GestFiPro.
 * - Protection contre les Open Redirects (CWE-601)
 * - Protection contre l'injection de formules CSV / Excel (CWE-1236)
 * - Nettoyage et validation des entrées textuelles
 */

/**
 * Valide et assainit une URL de redirection pour s'assurer qu'elle pointe
 * uniquement vers un chemin interne de l'application.
 *
 * Bloque :
 * - Les URLs absolues externes (ex: https://attacker.com)
 * - Les URLs relatives au protocole (ex: //attacker.com, /\attacker.com)
 * - Les schémas dangereux (javascript:, data:, vbscript:)
 * - Les séquences d'encodage manipulatrices (%2f%2f, etc.)
 */
export function sanitizeRedirectPath(
  raw: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!raw || typeof raw !== "string") {
    return fallback;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return fallback;
  }

  // Tenter de décoder les encodages URI pour détecter les doubles slashs masqués (%2F%2F)
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // Si l'encodage est invalide, rejeter immédiatement
    return fallback;
  }

  // Doit obligatoirement commencer par un slash simple
  if (!decoded.startsWith("/")) {
    return fallback;
  }

  // Interdire les doubles slashs ou slash-antislash (protocole relatif //evil.com, /\evil.com)
  if (decoded.startsWith("//") || decoded.startsWith("/\\") || decoded.startsWith("\\")) {
    return fallback;
  }

  // Interdire tout antislash dans le chemin (comportement non standard de certains navigateurs)
  if (decoded.includes("\\")) {
    return fallback;
  }

  // Interdire la présence de deux-points avant le premier slash de chemin ou paramètre
  // pour empêcher des protocoles comme "javascript:...", "http:...", etc.
  const queryIndex = decoded.indexOf("?");
  const hashIndex = decoded.indexOf("#");
  const pathEnd = Math.min(
    queryIndex === -1 ? decoded.length : queryIndex,
    hashIndex === -1 ? decoded.length : hashIndex
  );
  const pathOnly = decoded.slice(0, pathEnd);

  if (pathOnly.includes(":")) {
    return fallback;
  }

  // Re-vérifier l'URL brute également pour parer toute désynchronisation
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\") ||
    trimmed.startsWith("/javascript:")
  ) {
    return fallback;
  }

  return trimmed;
}

/**
 * Assainit une cellule pour un fichier CSV afin de bloquer les attaques
 * par injection de formules (CSV / Formula Injection, CWE-1236).
 *
 * Lorsque des logiciels tableurs (Excel, LibreOffice, Google Sheets) ouvrent un CSV,
 * les cellules débutant par '=', '+', '-', '@', tab ou retour chariot peuvent être
 * exécutées comme formules ou déclencher des macros DDE malveillantes.
 *
 * Préfixer ces cellules d'une apostrophe simple (') neutralise l'exécution sans altérer
 * l'affichage du texte dans le tableur.
 */
export function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }

  // Si c'est déjà un nombre JavaScript pur et fini, il est intrinsèquement sûr
  if (typeof val === "number" && Number.isFinite(val)) {
    return `"${val}"`;
  }

  const str = String(val);

  // Si la cellule est vide, renvoyer une chaîne vide échappée
  if (str.length === 0) {
    return '""';
  }

  const trimmed = str.trimStart();

  // Les montants numériques purs (ex: "+350000", "-2000", "12.5") sont sûrs
  const isPureNumber = /^[+-]?\d+(\.\d+)?$/.test(trimmed);

  // Caractères déclencheurs de formules tableur
  const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r", ";"];

  let safeStr = str;
  if (!isPureNumber && DANGEROUS_PREFIXES.some((char) => trimmed.startsWith(char))) {
    // Neutralisation standard OWASP : ajout d'une apostrophe d'échappement
    safeStr = "'" + str;
  }

  // Échapper les guillemets doubles selon la norme RFC 4180
  const escaped = safeStr.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Nettoie une chaîne de caractères en supprimant les caractères de contrôle non imprimables
 * et limite sa longueur maximale.
 */
export function sanitizeText(input: unknown, maxLen = 500): string {
  if (typeof input !== "string") return "";
  // Retirer les caractères de contrôle sauf retours à la ligne et tabulations
  const clean = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "").trim();
  return clean.slice(0, maxLen);
}
