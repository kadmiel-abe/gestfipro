// Client Supabase unifié pour GestFiPro
export { createClient } from "./supabase/client";
export { createClient as createServerClient } from "./supabase/server";
export { updateSession } from "./supabase/middleware";