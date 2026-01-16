-- Drop the overly permissive RLS policy that exposes tokens
DROP POLICY IF EXISTS "Widget can read active channel config" ON public.bot_channels;

-- Create a secure view that exposes only non-sensitive fields
CREATE OR REPLACE VIEW public.bot_channels_public AS
SELECT 
  id, 
  bot_id, 
  channel_type, 
  is_active, 
  embed_key,
  created_at,
  updated_at,
  -- Only expose connection status, not the actual tokens
  jsonb_build_object(
    'connected', COALESCE((config->>'connected')::boolean, false)
  ) as config
FROM public.bot_channels
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON public.bot_channels_public TO anon, authenticated;

-- Create new policy for widget that only allows reading via embed_key lookup
-- (The actual reading happens in Edge Functions with service role)
CREATE POLICY "Widget can validate embed_key" 
ON public.bot_channels 
FOR SELECT 
USING (
  -- Only allow if user is authenticated and owns the bot, OR
  -- this is a public embed_key validation (handled by Edge Functions)
  EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = bot_channels.bot_id 
    AND bots.user_id = auth.uid()
  )
);

-- Add columns to store OAuth state
ALTER TABLE public.bot_channels 
ADD COLUMN IF NOT EXISTS oauth_state text,
ADD COLUMN IF NOT EXISTS oauth_expires_at timestamptz;