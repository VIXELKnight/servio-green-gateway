-- Add columns to track token expiration
ALTER TABLE public.bot_channels 
ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS token_refreshed_at timestamptz;