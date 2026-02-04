-- Create support chat conversations table
CREATE TABLE public.support_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID
);

-- Create support chat messages table
CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL, -- 'user', 'admin', 'ai'
    sender_id UUID,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_conversations
-- Users can view their own conversations
CREATE POLICY "Users can view own support conversations"
ON public.support_conversations FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create own support conversations"
ON public.support_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations (for closing)
CREATE POLICY "Users can update own support conversations"
ON public.support_conversations FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can view all support conversations"
ON public.support_conversations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all conversations
CREATE POLICY "Admins can update all support conversations"
ON public.support_conversations FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for support_messages
-- Users can view messages in their own conversations
CREATE POLICY "Users can view own conversation messages"
ON public.support_messages FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = support_messages.conversation_id
    AND user_id = auth.uid()
));

-- Users can create messages in their own conversations
CREATE POLICY "Users can create messages in own conversations"
ON public.support_messages FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = support_messages.conversation_id
    AND user_id = auth.uid()
));

-- Admins can view all messages
CREATE POLICY "Admins can view all support messages"
ON public.support_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can create messages in any conversation
CREATE POLICY "Admins can create support messages"
ON public.support_messages FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update messages (for read receipts)
CREATE POLICY "Admins can update support messages"
ON public.support_messages FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- Create indexes for better performance
CREATE INDEX idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at);