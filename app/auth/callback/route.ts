import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nlbcbtxqbimhkrcwskze.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_bvhFDb_HsFiLt7iDcIvh8w_IG1mqyAR";

    const response = NextResponse.redirect(new URL(next, request.url));

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          } catch {
            // Ignorer si les cookies ne peuvent pas être modifiés directement
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // S'assurer que le profil existe en base pour le nouvel utilisateur Google
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const meta = user.user_metadata;
          const fullName = meta?.full_name || meta?.name || user.email?.split("@")[0] || "";
          await supabase.from("profiles").upsert({
            id: user.id,
            full_name: fullName,
            net_salary: 0,
            payday_with_month: null,
          });
        }
      } catch (e) {
        console.warn("OAuth auto-profile init warning:", e);
      }

      return response;
    }

    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed`, request.url)
    );
  }

  // Pas de code → rediriger vers login
  return NextResponse.redirect(new URL("/login", request.url));
}