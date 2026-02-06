-- Allow facebook as a channel type
ALTER TABLE public.bot_channels DROP CONSTRAINT bot_channels_channel_type_check;
ALTER TABLE public.bot_channels ADD CONSTRAINT bot_channels_channel_type_check 
  CHECK (channel_type = ANY (ARRAY['website'::text, 'whatsapp'::text, 'instagram'::text, 'facebook'::text]));