import { test } from "node:test";
import assert from "node:assert/strict";
import {
  QUICK_CHOICES,
  detectProviderFromText,
  normalizeProviderKey,
} from "../lib/account-choices.ts";

test("QUICK_CHOICES contient tous les opérateurs demandés", () => {
  const ids = QUICK_CHOICES.map((c) => c.id);
  assert.ok(ids.includes("wave"), "Wave doit être présent");
  assert.ok(ids.includes("orange"), "Orange Money doit être présent");
  assert.ok(ids.includes("m-pesa"), "M-Pesa doit être présent");
  assert.ok(ids.includes("mtn"), "MTN doit être présent");
  assert.ok(ids.includes("cash"), "Espèces doit être présent");
  assert.ok(ids.includes("bni"), "BNI doit être présent");
  assert.ok(ids.includes("nsia"), "NSIA doit être présent");
  assert.ok(ids.includes("ecobank"), "Ecobank doit être présent");
});

test("Smart Default : les noms par défaut des banques et opérateurs sont cohérents", () => {
  const bni = QUICK_CHOICES.find((c) => c.id === "bni");
  const nsia = QUICK_CHOICES.find((c) => c.id === "nsia");
  const ecobank = QUICK_CHOICES.find((c) => c.id === "ecobank");

  assert.equal(bni?.defaultName, "Compte BNI");
  assert.equal(nsia?.defaultName, "Compte NSIA");
  assert.equal(ecobank?.defaultName, "Compte Ecobank");
});

test("Auto-détection (sens inverse) : détecte correctement les mots-clés dans les noms saisis", () => {
  assert.equal(detectProviderFromText("nsia"), "nsia");
  assert.equal(detectProviderFromText("Compte NSIA Banque"), "nsia");
  assert.equal(detectProviderFromText("bni"), "bni");
  assert.equal(detectProviderFromText("Mon salaire BNI"), "bni");
  assert.equal(detectProviderFromText("Ecobank courant"), "ecobank");
  assert.equal(detectProviderFromText("Wave perso"), "wave");
  assert.equal(detectProviderFromText("M Pesa"), "m-pesa");
  assert.equal(detectProviderFromText("Compte MPesa"), "m-pesa");
  assert.equal(detectProviderFromText("Mon argent liquide en espèces"), "cash");
  assert.equal(detectProviderFromText("Autre compte sans mot cle"), null);
});

test("AccountLogo normalise correctement les clés de providers", () => {
  assert.equal(normalizeProviderKey("wave"), "wave");
  assert.equal(normalizeProviderKey("orange"), "orange");
  assert.equal(normalizeProviderKey("M Pesa"), "m-pesa");
  assert.equal(normalizeProviderKey("mpesa"), "m-pesa");
  assert.equal(normalizeProviderKey("mtn"), "mtn");
  assert.equal(normalizeProviderKey("cash"), "cash");
  assert.equal(normalizeProviderKey("bni"), "bni");
  assert.equal(normalizeProviderKey("nsia"), "nsia");
  assert.equal(normalizeProviderKey("ecobank"), "ecobank");
  assert.equal(normalizeProviderKey("moov"), "moov");
});
