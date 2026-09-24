-- ==============================================================================
-- GESTFIPRO — SCRIPT DE CORRECTION DES COLONNES MANQUANTES SUPABASE (PGRST204)
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. TABLE PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS net_salary NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payday_with_month INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_payday_with_month_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_payday_with_month_check CHECK (payday_with_month IS NULL OR (payday_with_month BETWEEN 1 AND 31));

-- 2. TABLE ACCOUNTS
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 3. TABLE TRANSACTIONS
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Divers';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 4. TABLE GOALS
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_date TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 5. RECHARGER LE CACHE POSTGREST POUR QUE LES NOUVELLES COLONNES SOIENT DISPONIBLES IMMÉDIATEMENT
NOTIFY pgrst, 'reload schema';

-- 6. VERIFICATION
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'accounts', 'transactions', 'goals')
ORDER BY table_name, ordinal_position;
