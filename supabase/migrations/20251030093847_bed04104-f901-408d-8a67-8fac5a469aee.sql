-- =====================================================
-- Phase 1: Fix RLS Policies for Security
-- =====================================================
-- 
-- IMPORTANT: This app uses Web3Auth (not Supabase Auth)
-- Edge functions must verify JWT and use service_role key
-- All database access should go through edge functions
--

-- Drop existing permissive policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Drop existing permissive policies on tx_logs table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.tx_logs;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.tx_logs;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Service role can do everything (used by edge functions)
CREATE POLICY "Service role full access to users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Prevent anonymous access
CREATE POLICY "Prevent anonymous access to users"
ON public.users
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =====================================================
-- TX_LOGS TABLE POLICIES
-- =====================================================

-- Service role can do everything (used by edge functions)
CREATE POLICY "Service role full access to tx_logs"
ON public.tx_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Prevent anonymous access
CREATE POLICY "Prevent anonymous access to tx_logs"
ON public.tx_logs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =====================================================
-- Add helpful comments
-- =====================================================

COMMENT ON TABLE public.users IS 
'User profiles mapped from Web3Auth. Access controlled via edge functions with JWT verification.';

COMMENT ON TABLE public.tx_logs IS 
'Transaction logs. Access controlled via edge functions with JWT verification.';

-- =====================================================
-- Ensure user_id is not nullable (security requirement)
-- =====================================================

ALTER TABLE public.tx_logs 
ALTER COLUMN user_id SET NOT NULL;