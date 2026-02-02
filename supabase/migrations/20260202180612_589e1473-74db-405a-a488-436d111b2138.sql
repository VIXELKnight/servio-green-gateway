-- Add tags to bot_conversations for auto-tagging
ALTER TABLE public.bot_conversations ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add rating columns for training mode
ALTER TABLE public.bot_messages ADD COLUMN IF NOT EXISTS rating smallint CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.bot_messages ADD COLUMN IF NOT EXISTS rating_feedback text;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_new_ticket boolean DEFAULT true,
  email_escalation boolean DEFAULT true,
  email_weekly_report boolean DEFAULT false,
  slack_webhook_url text,
  slack_escalation boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bot_conversations_tags ON public.bot_conversations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_bot_messages_rating ON public.bot_messages(rating) WHERE rating IS NOT NULL;