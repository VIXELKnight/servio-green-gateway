-- Create bots table for each customer
CREATE TABLE public.bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL DEFAULT 'You are a helpful customer service assistant.',
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  is_active BOOLEAN NOT NULL DEFAULT true,
  triage_enabled BOOLEAN NOT NULL DEFAULT true,
  triage_threshold DECIMAL(3,2) DEFAULT 0.7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bot_channels table for channel configurations
CREATE TABLE public.bot_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('website', 'whatsapp', 'instagram')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  embed_key UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_id, channel_type)
);

-- Create knowledge_base table for FAQ/docs (without vector embedding for now)
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bot_conversations table for chat history
CREATE TABLE public.bot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'resolved')),
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bot_messages table for individual messages
CREATE TABLE public.bot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.bot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bots
CREATE POLICY "Users can view their own bots" 
ON public.bots FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bots" 
ON public.bots FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots" 
ON public.bots FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots" 
ON public.bots FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bot_channels
CREATE POLICY "Users can view channels of their bots" 
ON public.bot_channels FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

CREATE POLICY "Users can create channels for their bots" 
ON public.bot_channels FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

CREATE POLICY "Users can update channels of their bots" 
ON public.bot_channels FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete channels of their bots" 
ON public.bot_channels FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

-- RLS Policies for knowledge_base
CREATE POLICY "Users can view knowledge base of their bots" 
ON public.knowledge_base FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

CREATE POLICY "Users can create knowledge base entries for their bots" 
ON public.knowledge_base FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

CREATE POLICY "Users can update knowledge base entries of their bots" 
ON public.knowledge_base FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete knowledge base entries of their bots" 
ON public.knowledge_base FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

-- RLS Policies for bot_conversations
CREATE POLICY "Users can view conversations of their bots" 
ON public.bot_conversations FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

CREATE POLICY "Anyone can create conversations via embed" 
ON public.bot_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update conversations of their bots" 
ON public.bot_conversations FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND user_id = auth.uid()));

-- RLS Policies for bot_messages
CREATE POLICY "Users can view messages of their bot conversations" 
ON public.bot_messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.bot_conversations c 
  JOIN public.bots b ON c.bot_id = b.id 
  WHERE c.id = conversation_id AND b.user_id = auth.uid()
));

CREATE POLICY "Anyone can create messages via embed" 
ON public.bot_messages FOR INSERT WITH CHECK (true);

-- Public read policy for widget access (via embed_key)
CREATE POLICY "Widget can read active channel config" 
ON public.bot_channels FOR SELECT 
USING (is_active = true);

CREATE POLICY "Widget can read bot info" 
ON public.bots FOR SELECT 
USING (is_active = true);

CREATE POLICY "Widget can read knowledge base" 
ON public.knowledge_base FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.bots WHERE id = bot_id AND is_active = true));

-- Create indexes for performance
CREATE INDEX idx_bots_user_id ON public.bots(user_id);
CREATE INDEX idx_bot_channels_bot_id ON public.bot_channels(bot_id);
CREATE INDEX idx_bot_channels_embed_key ON public.bot_channels(embed_key);
CREATE INDEX idx_knowledge_base_bot_id ON public.knowledge_base(bot_id);
CREATE INDEX idx_bot_conversations_bot_id ON public.bot_conversations(bot_id);
CREATE INDEX idx_bot_messages_conversation_id ON public.bot_messages(conversation_id);

-- Trigger for updated_at
CREATE TRIGGER update_bots_updated_at
BEFORE UPDATE ON public.bots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_channels_updated_at
BEFORE UPDATE ON public.bot_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_conversations_updated_at
BEFORE UPDATE ON public.bot_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_messages;