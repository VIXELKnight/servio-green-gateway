-- Create table for bot Shopify integrations
CREATE TABLE public.bot_shopify_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  store_domain TEXT NOT NULL,
  access_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_id)
);

-- Enable RLS
ALTER TABLE public.bot_shopify_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own bot's Shopify integration
CREATE POLICY "Users can view their own bot Shopify integrations"
ON public.bot_shopify_integrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = bot_shopify_integrations.bot_id 
    AND bots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own bot Shopify integrations"
ON public.bot_shopify_integrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = bot_shopify_integrations.bot_id 
    AND bots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own bot Shopify integrations"
ON public.bot_shopify_integrations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = bot_shopify_integrations.bot_id 
    AND bots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own bot Shopify integrations"
ON public.bot_shopify_integrations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = bot_shopify_integrations.bot_id 
    AND bots.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_bot_shopify_integrations_updated_at
BEFORE UPDATE ON public.bot_shopify_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();