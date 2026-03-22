-- Remove the anon policy since the widget uses bot-init edge function (service role)
-- which already selects only safe fields
DROP POLICY IF EXISTS "Widget can read basic bot info" ON public.bots;