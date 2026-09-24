-- Verification and explicit RLS policies for the authenticated user's data.
-- profiles uses id as the user identifier; accounts and transactions use user_id.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE EXCEPTION 'Missing table public.profiles';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
    RAISE EXCEPTION 'Missing table public.accounts';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    RAISE EXCEPTION 'Missing table public.transactions';
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "accounts_select_own" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_own" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_own" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete_own" ON public.accounts;

CREATE POLICY "accounts_select_own"
  ON public.accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert_own"
  ON public.accounts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update_own"
  ON public.accounts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_delete_own"
  ON public.accounts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;

CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Verification report: every table must be RLS-enabled and expose four policies.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  COUNT(p.policyname) FILTER (WHERE p.cmd IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'accounts', 'transactions')
GROUP BY n.nspname, c.relname, c.relrowsecurity
ORDER BY c.relname;
