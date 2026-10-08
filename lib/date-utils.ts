/**
 * Utilitaire de gestion des dates synchronisées pour GestFipro
 * Fuseau horaire officiel : Africa/Abidjan (UTC+0)
 */

export const TIMEZONE_ABIDJAN = "Africa/Abidjan";

/**
 * Retourne la date courante réelle sans codage en dur.
 */
export function getTodayInAbidjan(): Date {
  return new Date();
}

/**
 * Retourne une clé de date selon le calendrier local (YYYY-MM-DD).
 */
export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Extrait la date civile locale d'un instant ou conserve une date sans fuseau.
 */
export function getDateKey(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : formatLocalDateKey(value);
  }

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const dateKey = `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;
    return parseLocalDateKey(dateKey) ? dateKey : null;
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : formatLocalDateKey(parsed);
}

/**
 * Analyse une date YYYY-MM-DD comme une date locale, sans interprétation UTC.
 */
export function parseLocalDateKey(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
}

/**
 * Différence entre deux dates civiles en jours, indépendamment de l'heure et du DST.
 */
export function getCalendarDayDifference(from: Date, to: Date): number {
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toDay - fromDay) / 86400000);
}

/**
 * Formate une date en français pour l'affichage (ex: "Octobre 2026") avec majuscule initiale.
 */
export function formatMonthYear(date: Date): string {
  const monthYear = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);

  return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
}

/**
 * Retourne le nombre de jours dans un mois (prend en compte les années bissextiles, ex: Février 2028 = 29 jours).
 * Note : month est indexé de 0 (Janvier = 0) à 11 (Décembre = 11).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Retourne l'index du 1er jour du mois dans un calendrier commençant le Lundi.
 * 0 = Lundi, 1 = Mardi, 2 = Mercredi, 3 = Jeudi, 4 = Vendredi, 5 = Samedi, 6 = Dimanche.
 */
export function getStartDayOfWeek(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

/**
 * Compare si deux dates correspondent au même jour (Année + Mois + Jour).
 */
export function isSameDay(d1: Date | string | null | undefined, d2: Date | string | null | undefined): boolean {
  if (!d1 || !d2) return false;
  const date1 = typeof d1 === "string" ? parseLocalDateKey(getDateKey(d1) ?? "") ?? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? parseLocalDateKey(getDateKey(d2) ?? "") ?? new Date(d2) : d2;

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Compare si deux dates sont dans le même mois et la même année.
 */
export function isSameMonth(d1: Date | string | null | undefined, d2: Date | string | null | undefined): boolean {
  if (!d1 || !d2) return false;
  const date1 = typeof d1 === "string" ? parseLocalDateKey(getDateKey(d1) ?? "") ?? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? parseLocalDateKey(getDateKey(d2) ?? "") ?? new Date(d2) : d2;

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

/**
 * Calcule le nombre de millisecondes restantes jusqu'au prochain minuit.
 */
export function getMsUntilNextMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const diff = nextMidnight.getTime() - now.getTime();
  return diff > 0 ? diff : 86400000;
}
