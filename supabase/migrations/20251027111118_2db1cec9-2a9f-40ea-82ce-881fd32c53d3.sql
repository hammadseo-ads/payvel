-- Create users table for Web3Auth + Smart Account mapping
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  web3auth_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  smart_account_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction logs table
CREATE TABLE IF NOT EXISTS public.tx_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  chain_id TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount TEXT,
  data TEXT,
  tx_hash TEXT,
  user_op_hash TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tx_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own data"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (true);

-- RLS Policies for tx_logs table
CREATE POLICY "Users can view their own transactions"
  ON public.tx_logs
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own transactions"
  ON public.tx_logs
  FOR INSERT
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_web3auth_user_id ON public.users(web3auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_tx_logs_user_id ON public.tx_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_logs_tx_hash ON public.tx_logs(tx_hash);
CREATE INDEX IF NOT EXISTS idx_tx_logs_created_at ON public.tx_logs(created_at DESC);