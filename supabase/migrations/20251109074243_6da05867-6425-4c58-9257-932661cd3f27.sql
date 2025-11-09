-- Add token support columns to tx_logs table
ALTER TABLE tx_logs 
  ADD COLUMN token_address TEXT,
  ADD COLUMN token_symbol TEXT DEFAULT 'ETH',
  ADD COLUMN token_decimals INTEGER DEFAULT 18;