-- Add avatar and out-of-office settings to bots
ALTER TABLE public.bots 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS out_of_office_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS out_of_office_message text DEFAULT 'Thanks for reaching out! We''re currently away but will respond as soon as possible.';

-- Add read receipts and attachments to messages
ALTER TABLE public.bot_messages
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text;

-- Create scheduled messages table
CREATE TABLE public.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES public.bots(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES public.bot_conversations(id) ON DELETE CASCADE,
  content text NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone
);

-- Enable RLS on scheduled_messages
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_messages
CREATE POLICY "Users can view their own scheduled messages"
ON public.scheduled_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM bots WHERE bots.id = scheduled_messages.bot_id AND bots.user_id = auth.uid()
));

CREATE POLICY "Users can create scheduled messages for their bots"
ON public.scheduled_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM bots WHERE bots.id = scheduled_messages.bot_id AND bots.user_id = auth.uid()
));

CREATE POLICY "Users can update their own scheduled messages"
ON public.scheduled_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM bots WHERE bots.id = scheduled_messages.bot_id AND bots.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own scheduled messages"
ON public.scheduled_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM bots WHERE bots.id = scheduled_messages.bot_id AND bots.user_id = auth.uid()
));

-- Create onboarding progress table
CREATE TABLE public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step_bot_created boolean DEFAULT false,
  step_knowledge_added boolean DEFAULT false,
  step_channel_connected boolean DEFAULT false,
  step_widget_tested boolean DEFAULT false,
  step_first_conversation boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on onboarding_progress
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for onboarding_progress
CREATE POLICY "Users can view own onboarding progress"
ON public.onboarding_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
ON public.onboarding_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
ON public.onboarding_progress FOR UPDATE
USING (auth.uid() = user_id);