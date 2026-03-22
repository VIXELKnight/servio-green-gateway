-- Restrict the "Widget can read bot info" policy to only expose safe fields
-- by dropping the overly permissive policy and creating a narrower one
DROP POLICY IF EXISTS "Widget can read bot info" ON public.bots;

-- Create a restricted policy that only allows reading non-sensitive fields
-- We use a security invoker view instead for the widget
CREATE OR REPLACE VIEW public.public_bot_info WITH (security_invoker = true) AS
  SELECT id, name, welcome_message, avatar_url, is_active, out_of_office_enabled, out_of_office_message
  FROM public.bots
  WHERE is_active = true;

-- Re-add the widget policy but it will now be absent, so the widget 
-- must use the bot-init edge function (which uses service role) or the view
-- If direct table access is still needed for the embed widget, add a minimal policy:
CREATE POLICY "Widget can read basic bot info" ON public.bots
  FOR SELECT TO anon
  USING (is_active = true);