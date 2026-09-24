-- Run this once in Supabase SQL Editor.
-- Fixes PGRST204 when profiles.net_salary is missing from the remote database.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS net_salary NUMERIC(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payday_with_month INTEGER;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_payday_with_month_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_payday_with_month_check
  CHECK (payday_with_month IS NULL OR payday_with_month BETWEEN 1 AND 31);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Refresh the PostgREST schema cache so the new columns are available immediately.
NOTIFY pgrst, 'reload schema';

-- Verify the columns expected by the application.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'full_name', 'net_salary', 'payday_with_month', 'updated_at')
ORDER BY ordinal_position;
