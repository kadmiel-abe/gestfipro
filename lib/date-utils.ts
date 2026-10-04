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
 * Formate une date en français pour l'affichage (ex: "Octobre 2026") avec majuscule initiale.
 */
export function formatMonthYear(date: Date, timeZone: string = TIMEZONE_ABIDJAN): string {
  const monthName = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    timeZone,
  }).format(date);

  const year = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    timeZone,
  }).format(date);

  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalizedMonth} ${year}`;
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
  const dayIndex = new Date(year, month, 1).getDay(); // 0 = Dimanche, 1 = Lundi...
  return dayIndex === 0 ? 6 : dayIndex - 1;
}

/**
 * Compare si deux dates correspondent au même jour (Année + Mois + Jour).
 */
export function isSameDay(d1: Date | string | null | undefined, d2: Date | string | null | undefined): boolean {
  if (!d1 || !d2) return false;
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;

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
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;

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
