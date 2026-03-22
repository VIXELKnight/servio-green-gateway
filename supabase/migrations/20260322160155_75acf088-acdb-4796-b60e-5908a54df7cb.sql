ALTER TABLE public.bot_shopify_integrations 
  ADD COLUMN IF NOT EXISTS pending_oauth_state text,
  ADD COLUMN IF NOT EXISTS state_expires_at timestamp with time zone;