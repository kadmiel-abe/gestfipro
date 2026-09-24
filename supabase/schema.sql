-- ==============================================================================
-- GESTFIPRO — SCHEMA INITIAL DE BASE DE DONNÉES SUPABASE (POSTGRESQL)
-- Gestion financière pour salariés et fonctionnaires en Afrique de l'Ouest
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. TABLE : PROFILES
-- Stocke les informations du profil utilisateur, son salaire net et son cycle de paie
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    net_salary NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    payday_with_month INTEGER CHECK (payday_with_month IS NULL OR (payday_with_month BETWEEN 1 AND 31)),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la table existait déjà avec d'autres colonnes (ex: pay_day)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS net_salary NUMERIC(15, 2) DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payday_with_month INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ALTER COLUMN payday_with_month DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN payday_with_month DROP NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. TABLE : ACCOUNTS
-- Comptes de l'utilisateur (Espèces, Wave, Orange Money, Banque, etc.)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT accounts_user_id_name_key UNIQUE (user_id, name)
);

-- Si la table existait déjà sans contrainte UNIQUE
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'accounts_user_id_name_key'
    ) THEN
        ALTER TABLE public.accounts ADD CONSTRAINT accounts_user_id_name_key UNIQUE (user_id, name);
    END IF;
END $$;

-- Index pour accélérer les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- ------------------------------------------------------------------------------
-- 4. TABLE : TRANSACTIONS
-- Dépenses et entrées d'argent associées à un compte
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Divers',
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    transaction_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la table existait déjà avec un schéma partiel
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Divers';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);

-- ------------------------------------------------------------------------------
-- 5. TABLE : GOALS
-- Objectifs d'épargne et projets d'investissement
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- ------------------------------------------------------------------------------
-- 6. SECURITÉ & ROW LEVEL SECURITY (RLS)
-- Active le RLS et définit les politiques strictes auth.uid() = user_id
-- ------------------------------------------------------------------------------

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Politiques PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;

CREATE POLICY "Users can manage own profile"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Politiques ACCOUNTS
DROP POLICY IF EXISTS "Users can manage own accounts" ON public.accounts;
CREATE POLICY "Users can manage own accounts"
    ON public.accounts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politiques TRANSACTIONS
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions"
    ON public.transactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politiques GOALS
DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals"
    ON public.goals
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. TRIGGER D'INITIALISATION AUTOMATIQUE DU PROFIL LORS DE L'INSCRIPTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, net_salary, payday_with_month)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE((new.raw_user_meta_data->>'net_salary')::numeric, 0),
        (new.raw_user_meta_data->>'payday_with_month')::integer
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
