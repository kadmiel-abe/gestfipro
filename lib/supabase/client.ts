import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nlbcbtxqbimhkrcwskze.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_bvhFDb_HsFiLt7iDcIvh8w_IG1mqyAR";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

