import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  // Déterminer l'URL d'origine propre (gère reverse proxies, HTTPS, Vercel, localhost)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocal = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  
  const origin = forwardedHost && !isLocal
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  // Gérer d'éventuelles erreurs renvoyées directement par le fournisseur OAuth
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorDesc = requestUrl.searchParams.get("error_description");
  if (oauthError) {
    console.error("OAuth Provider Error received:", oauthError, oauthErrorDesc);
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", "oauth_failed");
    if (oauthErrorDesc) {
      redirectUrl.searchParams.set("details", oauthErrorDesc);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nlbcbtxqbimhkrcwskze.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sYmNidHhxYmltaGtyY3dza3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTM3NjgsImV4cCI6MjEwNDM2OTc2OH0.wDcWOuAxHUjIK9mwSYA6r4Bjl9nUzRARRknwC42mnBU";

    // Target redirect destination
    const targetPath = next.startsWith("/") ? next : `/${next}`;
    const redirectTarget = new URL(targetPath, origin);
    const response = NextResponse.redirect(redirectTarget);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      // S'assurer que le profil existe en base pour le nouvel utilisateur Google sans bloquer
      try {
        const user = data.session.user;
        if (user) {
          const meta = user.user_metadata;
          const fullName = meta?.full_name || meta?.name || user.email?.split("@")[0] || "";
          
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              full_name: fullName,
              net_salary: 0,
              payday_with_month: null,
            },
            { onConflict: "id", ignoreDuplicates: true }
          );
        }
      } catch (e) {
        console.warn("OAuth auto-profile init notice:", e);
      }

      return response;
    }

    console.error("OAuth exchange code error:", error?.message);
    const failUrl = new URL("/login", origin);
    failUrl.searchParams.set("error", "oauth_failed");
    if (error?.message) {
      failUrl.searchParams.set("details", error.message);
    }
    return NextResponse.redirect(failUrl);
  }

  // Pas de code ni d'erreur → rediriger vers login
  return NextResponse.redirect(new URL("/login", origin));
}