-- ==============================================================================
-- GESTFIPRO — VÉRIFICATION & CORRECTION COMPLÈTE DES POLITIQUES RLS
-- Exécuter dans l'éditeur SQL de Supabase (Dashboard → SQL Editor → New query)
-- ==============================================================================

-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  ÉTAPE 1 : VÉRIFIER QUE LES TABLES EXISTENT                                ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE EXCEPTION '❌ Table public.profiles introuvable — exécutez d''abord schema.sql';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
    RAISE EXCEPTION '❌ Table public.accounts introuvable — exécutez d''abord schema.sql';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    RAISE EXCEPTION '❌ Table public.transactions introuvable — exécutez d''abord schema.sql';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'goals') THEN
    RAISE EXCEPTION '❌ Table public.goals introuvable — exécutez d''abord schema.sql';
  END IF;
  RAISE NOTICE '✅ Les 4 tables (profiles, accounts, transactions, goals) existent.';
END $$;


-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  ÉTAPE 2 : ACTIVER ROW LEVEL SECURITY SUR TOUTES LES TABLES                ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- S'assurer que les colonnes nécessaires existent
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS net_salary NUMERIC(15, 2) DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payday_with_month INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals        ENABLE ROW LEVEL SECURITY;


-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  ÉTAPE 3 : SUPPRIMER TOUTES LES ANCIENNES POLITIQUES (éviter les doublons)  ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- ── profiles ──
DROP POLICY IF EXISTS "Users can view own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"            ON public.profiles;

-- ── accounts ──
DROP POLICY IF EXISTS "Users can manage own accounts"  ON public.accounts;
DROP POLICY IF EXISTS "accounts_select_own"            ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_own"            ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_own"            ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete_own"            ON public.accounts;

-- ── transactions ──
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_own"           ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own"           ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own"           ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own"           ON public.transactions;

-- ── goals ──
DROP POLICY IF EXISTS "Users can manage own goals"  ON public.goals;
DROP POLICY IF EXISTS "goals_select_own"            ON public.goals;
DROP POLICY IF EXISTS "goals_insert_own"            ON public.goals;
DROP POLICY IF EXISTS "goals_update_own"            ON public.goals;
DROP POLICY IF EXISTS "goals_delete_own"            ON public.goals;


-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  ÉTAPE 4 : CRÉER LES POLITIQUES GRANULAIRES (SELECT/INSERT/UPDATE/DELETE)   ║
-- ║  Chaque opération a sa propre politique pour un contrôle précis.             ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- ─── PROFILES (clé primaire = id = auth.uid()) ───────────────────────────────

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);


-- ─── ACCOUNTS (user_id = auth.uid()) ─────────────────────────────────────────

CREATE POLICY "accounts_select_own"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert_own"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update_own"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_delete_own"
  ON public.accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ─── TRANSACTIONS (user_id = auth.uid()) ─────────────────────────────────────

CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ─── GOALS (user_id = auth.uid()) ────────────────────────────────────────────

CREATE POLICY "goals_select_own"
  ON public.goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_own"
  ON public.goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_own"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_delete_own"
  ON public.goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  ÉTAPE 5 : RAPPORT DE VÉRIFICATION                                          ║
-- ║  Chaque table doit afficher : rls_enabled = true, policy_count = 4          ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

SELECT
  n.nspname                AS schema_name,
  c.relname                AS table_name,
  c.relrowsecurity         AS rls_enabled,
  COUNT(p.policyname)      AS policy_count,
  string_agg(p.policyname, ', ' ORDER BY p.policyname) AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'accounts', 'transactions', 'goals')
GROUP BY n.nspname, c.relname, c.relrowsecurity
ORDER BY c.relname;


-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  ÉTAPE 6 : VÉRIFICATION DES COLONNES ATTENDUES PAR L'APPLICATION            ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'accounts', 'transactions', 'goals')
ORDER BY table_name, ordinal_position;


-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  ÉTAPE 7 : RAFRAÎCHIR LE CACHE POSTGREST                                   ║
-- ║  Nécessaire pour que Supabase prenne en compte les changements immédiatement ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

NOTIFY pgrst, 'reload schema';
