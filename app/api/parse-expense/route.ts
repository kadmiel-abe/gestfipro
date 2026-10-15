import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Types ──────────────────────────────────────────────────────────────────
interface ParsedExpense {
  amount: number;
  category: string;
  note: string;
}

// ─── Constantes ─────────────────────────────────────────────────────────────
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// IDs temporaires pour le développement (à remplacer par l'auth réelle)
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";
const MOCK_ACCOUNT_ID = "00000000-0000-0000-0000-000000000001";

// Catégories valides pour validation
const VALID_CATEGORIES = new Set([
  "Transport",
  "Nourriture",
  "Logement",
  "Loisirs",
  "Santé",
  "Factures",
  "Autre",
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Appelle l'API Gemini pour extraire des dépenses structurées
 * à partir d'un texte en langage naturel.
 */
async function parseWithGemini(text: string): Promise<ParsedExpense[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY manquante. Ajoutez-la dans votre fichier .env.local"
    );
  }

  const prompt = `Tu es l'assistant financier de GestFiPro. L'utilisateur a écrit : '${text}'. Extrais toutes les dépenses. Attribue une catégorie (Transport, Nourriture, Logement, Loisirs, Santé, Autre). Renvoie STRICTEMENT un tableau JSON valide sous ce format : [{"amount": 5000, "category": "Transport", "note": "taxi"}].`;

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[Gemini API Error]", res.status, errorBody);
    throw new Error(`L'API Gemini a renvoyé une erreur (${res.status})`);
  }

  const data = await res.json();

  // Extraire le texte de la réponse Gemini
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    throw new Error("Réponse vide de l'API Gemini");
  }

  // Parser le JSON — Gemini peut enrober la réponse dans des backticks markdown
  const jsonMatch = rawText.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    console.error("[Parse Error] Impossible d'extraire le JSON de :", rawText);
    throw new Error(
      "Impossible de comprendre la réponse. Reformulez votre saisie."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("[JSON Parse Error]", jsonMatch[0]);
    throw new Error("Le format de la réponse IA est invalide.");
  }

  // Validation du tableau
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Aucune dépense n'a pu être extraite de votre saisie.");
  }

  // Valider et normaliser chaque entrée
  const expenses: ParsedExpense[] = parsed.map(
    (item: Record<string, unknown>, i: number) => {
      const amount = Number(item.amount);
      if (!amount || amount <= 0) {
        throw new Error(
          `Montant invalide pour la dépense #${i + 1} : "${item.amount}"`
        );
      }

      const category = String(item.category || "Autre");
      const note = String(item.note || "");

      return {
        amount,
        category: VALID_CATEGORIES.has(category) ? category : "Autre",
        note,
      };
    }
  );

  return expenses;
}

// ─── Route Handler ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer et valider l'input
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Le texte de saisie est requis." },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Le texte est trop long (max 500 caractères)." },
        { status: 400 }
      );
    }

    // 2. Parser avec Gemini
    const expenses = await parseWithGemini(text);

    // 3. Préparer les enregistrements pour Supabase
    const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const records = expenses.map((exp) => ({
      user_id: MOCK_USER_ID,
      account_id: MOCK_ACCOUNT_ID,
      title: exp.note || exp.category,
      category: exp.category,
      amount: exp.amount,
      type: "expense" as const,
      transaction_date: now,
      note: exp.note || null,
    }));

    // 4. Insérer dans Supabase
    const supabase = await createClient();

    const { data: inserted, error: dbError } = await supabase
      .from("transactions")
      .insert(records)
      .select();

    if (dbError) {
      console.error("[Supabase Insert Error]", dbError);
      return NextResponse.json(
        {
          error: "Erreur lors de l'enregistrement des transactions.",
          details: dbError.message,
        },
        { status: 500 }
      );
    }

    // 5. Succès
    return NextResponse.json({
      success: true,
      transactions: inserted,
      count: inserted?.length ?? 0,
    });
  } catch (err) {
    console.error("[parse-expense Error]", err);
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
