-- Fix the SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.bot_channels_public;

CREATE VIEW public.bot_channels_public 
WITH (security_invoker = true) AS
SELECT 
  id, 
  bot_id, 
  channel_type, 
  is_active, 
  embed_key,
  created_at,
  updated_at,
  jsonb_build_object(
    'connected', COALESCE((config->>'connected')::boolean, false)
  ) as config
FROM public.bot_channels
WHERE is_active = true;

-- Re-grant access
GRANT SELECT ON public.bot_channels_public TO anon, authenticated;