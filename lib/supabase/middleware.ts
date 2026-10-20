import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeRedirectPath } from "@/lib/security";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nlbcbtxqbimhkrcwskze.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sYmNidHhxYmltaGtyY3dza3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTM3NjgsImV4cCI6MjEwNDM2OTc2OH0.wDcWOuAxHUjIK9mwSYA6r4Bjl9nUzRARRknwC42mnBU";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Ne pas exécuter de logique entre createServerClient et supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Exclure les routes d'authentification publique et les endpoints d'API (qui gèrent leur propre auth)
  if (pathname.startsWith("/auth") || pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  // Protection des routes privées (Dashboard, Onboarding, Historique)
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/historique");

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Assainir le chemin de redirection pour éviter tout Open Redirect
    url.searchParams.set("redirectedFrom", sanitizeRedirectPath(pathname, "/dashboard"));
    const redirectResponse = NextResponse.redirect(url);
    // Transférer tous les cookies (y compris les éventuels refresh tokens)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // Si l'utilisateur est déjà connecté et visite la page de connexion ou d'inscription
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
    const targetPath = sanitizeRedirectPath(redirectedFrom, "/dashboard");
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    // Transférer tous les cookies
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
