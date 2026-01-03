import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ChevronRight,
  Globe,
  Smartphone,
  Instagram
} from "lucide-react";

interface Conversation {
  id: string;
  channel_type: string;
  visitor_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: string;
  
  escalation_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface BotConversationsProps {
  botId: string;
}

export function BotConversations({ botId }: BotConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('bot-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_conversations',
          filter: `bot_id=eq.${botId}`
        },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [botId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      const channel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bot_messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  async function fetchConversations() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bot_conversations")
      .select("*")
      .eq("bot_id", botId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      setConversations(data || []);
    }
    setIsLoading(false);
  }

  async function fetchMessages(conversationId: string) {
    const { data, error } = await supabase
      .from("bot_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  }

  async function updateStatus(conversationId: string, status: 'active' | 'escalated' | 'resolved') {
    await supabase
      .from("bot_conversations")
      .update({ status })
      .eq("id", conversationId);
    
    fetchConversations();
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({ ...selectedConversation, status });
    }
  }

  function getChannelIcon(type: string) {
    switch (type) {
      case "website": return Globe;
      case "whatsapp": return Smartphone;
      case "instagram": return Instagram;
      default: return MessageSquare;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active": return "bg-blue-500";
      case "escalated": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      default: return "bg-gray-500";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "active": return Clock;
      case "escalated": return AlertTriangle;
      case "resolved": return CheckCircle;
      default: return MessageSquare;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Conversations Yet</h3>
          <p className="text-muted-foreground text-sm">
            Conversations will appear here when visitors start chatting with your bot
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Conversation List */}
      <div className="lg:col-span-1 border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/30">
          <h4 className="font-medium text-sm">Conversations ({conversations.length})</h4>
        </div>
        <ScrollArea className="h-[calc(600px-49px)]">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => {
              const ChannelIcon = getChannelIcon(conv.channel_type);
              const StatusIcon = getStatusIcon(conv.status);
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedConversation?.id === conv.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {conv.visitor_name || `Visitor ${conv.visitor_id.slice(0, 6)}`}
                      </span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${conv.status === 'escalated' ? 'border-yellow-500 text-yellow-600' : ''}`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {conv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Message View */}
      <div className="lg:col-span-2 border rounded-lg overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {selectedConversation.visitor_name || `Visitor ${selectedConversation.visitor_id.slice(0, 8)}`}
                </span>
                {selectedConversation.visitor_email && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedConversation.visitor_email})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedConversation.status !== 'resolved' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatus(selectedConversation.id, 'resolved')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Resolve
                  </Button>
                )}
                {selectedConversation.status === 'escalated' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatus(selectedConversation.id, 'active')}
                  >
                    Return to Bot
                  </Button>
                )}
              </div>
            </div>

            {selectedConversation.escalation_reason && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border-b flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-700 dark:text-yellow-400">
                  Escalated: {selectedConversation.escalation_reason}
                </span>
              </div>
            )}

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : msg.role === 'system'
                          ? 'bg-muted text-muted-foreground italic text-sm'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <ChevronRight className="w-8 h-8 mx-auto mb-2" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
