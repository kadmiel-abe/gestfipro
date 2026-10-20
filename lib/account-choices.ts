/**
 * Données et logique des choix d'opérateurs / banques pour l'ajout de compte
 * (Module TypeScript pur, sans JSX, facilement testable)
 */

export interface QuickChoice {
  id: string;
  name: string;
  provider: string;
  defaultName: string;
  type: "mobile_money" | "cash" | "bank";
  /** Mots-clés pour l'auto-détection en sens inverse */
  keywords: string[];
}

export const QUICK_CHOICES: ReadonlyArray<QuickChoice> = [
  // Mobile Money
  {
    id: "wave",
    name: "Wave",
    provider: "wave",
    defaultName: "Compte Wave",
    type: "mobile_money",
    keywords: ["wave"],
  },
  {
    id: "orange",
    name: "Orange Money",
    provider: "orange",
    defaultName: "Compte Orange Money",
    type: "mobile_money",
    keywords: ["orange", "om"],
  },
  {
    id: "mtn",
    name: "MTN",
    provider: "mtn",
    defaultName: "Compte MTN",
    type: "mobile_money",
    keywords: ["mtn", "momo"],
  },
  // Cash
  {
    id: "cash",
    name: "Espèces",
    provider: "cash",
    defaultName: "Espèces",
    type: "cash",
    keywords: ["espèce", "espece", "cash", "billet", "liquide"],
  },
  // Banques locales
  {
    id: "bni",
    name: "BNI",
    provider: "bni",
    defaultName: "Compte BNI",
    type: "bank",
    keywords: ["bni"],
  },
  {
    id: "nsia",
    name: "NSIA",
    provider: "nsia",
    defaultName: "Compte NSIA",
    type: "bank",
    keywords: ["nsia"],
  },
  {
    id: "ecobank",
    name: "Ecobank",
    provider: "ecobank",
    defaultName: "Compte Ecobank",
    type: "bank",
    keywords: ["ecobank", "eco"],
  },
];

/**
 * Vérifie si un mot-clé correspond dans le texte, en évitant les faux positifs
 * sur les acronymes courts (ex: "om" ne doit pas matcher l'intérieur de "compte").
 */
function matchesKeyword(text: string, keyword: string): boolean {
  if (keyword.length <= 3) {
    const regex = new RegExp(`(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`, "i");
    return regex.test(text);
  }
  return text.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Détecte si le texte saisi contient le nom ou mot-clé d'un provider connu.
 * Ex : "Mon compte nsia" -> "nsia", "Salaire BNI" -> "bni"
 */
export function detectProviderFromText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const choice of QUICK_CHOICES) {
    if (choice.keywords.some((kw) => matchesKeyword(trimmed, kw))) {
      return choice.provider;
    }
  }
  return null;
}

/** Vérifie si un nom correspond à l'un des noms pré-remplis par défaut */
export function isKnownDefaultName(name: string): boolean {
  const trimmed = name.trim().toLowerCase();
  return QUICK_CHOICES.some(
    (c) => c.defaultName.toLowerCase() === trimmed || c.name.toLowerCase() === trimmed
  );
}

/**
 * Normalise un nom ou code en clé de provider connue
 */
export function normalizeProviderKey(provider = ""): string {
  const p = provider.toLowerCase().trim();
  if (p.includes("bni")) return "bni";
  if (p.includes("nsia")) return "nsia";
  if (p.includes("ecobank")) return "ecobank";
  if (p.includes("wave")) return "wave";
  if (p.includes("orange")) return "orange";
  if (p.includes("mtn")) return "mtn";
  if (p.includes("moov")) return "moov";
  if (p.includes("boa") || p.includes("africa")) return "boa";
  if (p.includes("cash") || p.includes("esp") || p.includes("billet")) return "cash";
  if (p.includes("banque") || p.includes("bank")) return "bank";
  return p;
}
