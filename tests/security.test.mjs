import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeRedirectPath,
  sanitizeCsvCell,
  sanitizeText,
} from "../lib/security.ts";

test("sanitizeRedirectPath : autorise les chemins internes valides", () => {
  assert.equal(sanitizeRedirectPath("/dashboard"), "/dashboard");
  assert.equal(sanitizeRedirectPath("/historique"), "/historique");
  assert.equal(sanitizeRedirectPath("/dashboard/settings"), "/dashboard/settings");
  assert.equal(sanitizeRedirectPath("/onboarding?step=2"), "/onboarding?step=2");
  assert.equal(sanitizeRedirectPath("/dashboard#summary"), "/dashboard#summary");
});

test("sanitizeRedirectPath : bloque les URLs absolues et protocol-relative", () => {
  assert.equal(sanitizeRedirectPath("https://attacker.com"), "/dashboard");
  assert.equal(sanitizeRedirectPath("http://attacker.com"), "/dashboard");
  assert.equal(sanitizeRedirectPath("//attacker.com"), "/dashboard");
  assert.equal(sanitizeRedirectPath("//attacker.com/test"), "/dashboard");
  assert.equal(sanitizeRedirectPath("/\\attacker.com"), "/dashboard");
  assert.equal(sanitizeRedirectPath("\\\\attacker.com"), "/dashboard");
});

test("sanitizeRedirectPath : bloque les schémas dangereux et encodages malveillants", () => {
  assert.equal(sanitizeRedirectPath("javascript:alert(1)"), "/dashboard");
  assert.equal(sanitizeRedirectPath("/javascript:alert(1)"), "/dashboard");
  assert.equal(sanitizeRedirectPath("%2F%2Fattacker.com"), "/dashboard");
  assert.equal(sanitizeRedirectPath("/path\\with\\backslash"), "/dashboard");
  assert.equal(sanitizeRedirectPath(""), "/dashboard");
  assert.equal(sanitizeRedirectPath(null), "/dashboard");
  assert.equal(sanitizeRedirectPath(undefined), "/dashboard");
});

test("sanitizeCsvCell : échappe correctement les caractères spéciaux RFC 4180", () => {
  assert.equal(sanitizeCsvCell("Achat pain"), '"Achat pain"');
  assert.equal(sanitizeCsvCell('Restaurant "Chez Paul"'), '"Restaurant ""Chez Paul"""');
  assert.equal(sanitizeCsvCell(12500), '"12500"');
  assert.equal(sanitizeCsvCell(null), '""');
  assert.equal(sanitizeCsvCell(""), '""');
});

test("sanitizeCsvCell : neutralise les attaques par injection de formules Excel/Sheets (CWE-1236)", () => {
  assert.equal(sanitizeCsvCell("=cmd|' /C calc'!A0"), '"\'=cmd|\' /C calc\'!A0"');
  assert.equal(sanitizeCsvCell("+1+2"), '"\'+1+2"');
  assert.equal(sanitizeCsvCell("-cmd"), '"\'-cmd"');
  assert.equal(sanitizeCsvCell("@SUM(A1:A10)"), '"\'@SUM(A1:A10)"');
  assert.equal(sanitizeCsvCell("\t=2+2"), '"\'\t=2+2"');
  assert.equal(sanitizeCsvCell(";cmd"), '"\';cmd"');
});

test("sanitizeCsvCell : préserve les nombres signés légitimes sans apostrophe parasite", () => {
  assert.equal(sanitizeCsvCell("+350000"), '"+350000"');
  assert.equal(sanitizeCsvCell("-2000"), '"-2000"');
  assert.equal(sanitizeCsvCell("1500.50"), '"1500.50"');
});

test("sanitizeText : nettoie les caractères de contrôle et tronque à la longueur max", () => {
  assert.equal(sanitizeText("Hello\u0000World"), "HelloWorld");
  assert.equal(sanitizeText("   Texte propre   "), "Texte propre");
  assert.equal(sanitizeText("a".repeat(600), 500).length, 500);
});
