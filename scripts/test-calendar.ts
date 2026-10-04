import {
  getDaysInMonth,
  getStartDayOfWeek,
  formatMonthYear,
  isSameDay,
  isSameMonth,
  getMsUntilNextMidnight,
} from "../lib/date-utils";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ÉCHEC : ${message}`);
    process.exit(1);
  }
  console.log(`✅ SUCCÈS : ${message}`);
}

console.log("🧪 Lancement des tests unitaires du calendrier GestFipro...\n");

// 1. Année bissextile (Février 2028 = 29 jours, Février 2026 = 28 jours)
assert(getDaysInMonth(2028, 1) === 29, "Février 2028 doit compter 29 jours (année bissextile)");
assert(getDaysInMonth(2026, 1) === 28, "Février 2026 doit compter 28 jours (année non bissextile)");

// 2. Nombre de jours et 1er jour pour Octobre 2026
assert(getDaysInMonth(2026, 9) === 31, "Octobre 2026 doit compter 31 jours");
// 1er Octobre 2026 est un Jeudi -> index 3 (0=Lundi, 1=Mardi, 2=Mercredi, 3=Jeudi)
assert(getStartDayOfWeek(2026, 9) === 3, "Le 1er Octobre 2026 doit tomber un Jeudi (index 3)");

// 3. Titre du mois dynamique en Français avec Majuscule
const testDate = new Date(2026, 9, 4); // 4 Octobre 2026
assert(formatMonthYear(testDate) === "Octobre 2026", 'formatMonthYear(4 Octobre 2026) doit retourner "Octobre 2026"');

// 4. Changement de mois & d'année (Décembre -> Janvier et Janvier -> Décembre)
const dec2026 = new Date(2026, 11, 1);
const jan2027 = new Date(dec2026.getFullYear(), dec2026.getMonth() + 1, 1);
assert(jan2027.getFullYear() === 2027 && jan2027.getMonth() === 0, "Décembre 2026 + 1 mois doit passer à Janvier 2027");

const jan2026 = new Date(2026, 0, 1);
const dec2025 = new Date(jan2026.getFullYear(), jan2026.getMonth() - 1, 1);
assert(dec2025.getFullYear() === 2025 && dec2025.getMonth() === 11, "Janvier 2026 - 1 mois doit passer à Décembre 2025");

// 5. Comparaison exacte de dates (isSameDay & isSameMonth)
const d1 = new Date(2026, 9, 4, 10, 30);
const d2 = new Date(2026, 9, 4, 22, 15);
const dDiffMonth = new Date(2026, 8, 4); // 4 Septembre 2026

assert(isSameDay(d1, d2) === true, "4 Oct 10h30 et 4 Oct 22h15 doivent être reconnus comme le même jour");
assert(isSameDay(d1, dDiffMonth) === false, "4 Octobre et 4 Septembre ne doivent PAS être le même jour");
assert(isSameMonth(d1, d2) === true, "4 Octobre et 4 Octobre sont dans le même mois");
assert(isSameMonth(d1, dDiffMonth) === false, "4 Octobre et 4 Septembre ne sont PAS dans le même mois");

// 6. Calcul minuit
const msMidnight = getMsUntilNextMidnight();
assert(msMidnight > 0 && msMidnight <= 86400000, "Le temps restant jusqu'à minuit doit être positif et inférieur à 24h");

console.log("\n🎉 Tous les tests unitaires du calendrier ont réussi avec succès !");
