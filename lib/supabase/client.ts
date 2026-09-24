import { createBrowserClient } from '@supabase/ssr'

// Singleton client — ensures the same Supabase instance is reused across
// all renders and hooks, preventing useCallback/useEffect dependency churn
// and guaranteeing a stable auth session throughout the app lifecycle.
let cachedClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!cachedClient) {
    cachedClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nlbcbtxqbimhkrcwskze.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sYmNidHhxYmltaGtyY3dza3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTM3NjgsImV4cCI6MjEwNDM2OTc2OH0.wDcWOuAxHUjIK9mwSYA6r4Bjl9nUzRARRknwC42mnBU'
    )
  }
  return cachedClient
}