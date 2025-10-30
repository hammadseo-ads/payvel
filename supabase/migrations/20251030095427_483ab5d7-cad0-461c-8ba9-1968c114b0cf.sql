-- Add transaction hash and error tracking columns to tx_logs
ALTER TABLE public.tx_logs
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add indexes for faster lookups by transaction hashes
CREATE INDEX IF NOT EXISTS idx_tx_logs_user_op_hash 
ON public.tx_logs(user_op_hash);

CREATE INDEX IF NOT EXISTS idx_tx_logs_tx_hash 
ON public.tx_logs(tx_hash);

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_tx_logs_status 
ON public.tx_logs(status);