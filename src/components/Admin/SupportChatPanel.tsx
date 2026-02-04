import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Send, 
  Loader2, 
  MessageCircle, 
  Bot, 
  User, 
  CheckCircle2, 
  Clock,
  Inbox,
  CheckCheck,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export function SupportChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "resolved">("open");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch conversations
  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("support_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user emails for each conversation
      const convsWithEmails = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", conv.user_id)
            .single();
          return { ...conv, user_email: profile?.email || "Unknown" };
        })
      );

      setConversations(convsWithEmails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [filterStatus]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) return;

    async function fetchMessages() {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(data || []);
    }

    fetchMessages();
  }, [selectedConversation?.id]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`admin-support-${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  // Subscribe to new conversations
  useEffect(() => {
    const channel = supabase
      .channel("admin-new-conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendMessage = async (asAI = false) => {
    if (!input.trim() || !selectedConversation || isSending) return;

    const messageContent = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const { error } = await supabase.from("support_messages").insert({
        conversation_id: selectedConversation.id,
        sender_type: asAI ? "ai" : "admin",
        content: messageContent,
      });

      if (error) throw error;
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setInput(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const generateAIResponse = async () => {
    if (!selectedConversation || messages.length === 0) return;
    
    setIsGeneratingAI(true);
    
    try {
      // Get the last user message
      const lastUserMessage = [...messages].reverse().find(m => m.sender_type === "user");
      if (!lastUserMessage) {
        toast.error("No user message to respond to");
        return;
      }

      // Simple AI response generation (could be enhanced with actual AI API)
      const aiResponse = generateSmartResponse(lastUserMessage.content, messages);
      setInput(aiResponse);
      toast.success("AI suggestion generated - review and send!");
    } catch (error) {
      console.error("Error generating AI response:", error);
      toast.error("Failed to generate response");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateSmartResponse = (lastMessage: string, history: Message[]): string => {
    const lower = lastMessage.toLowerCase();
    
    if (lower.includes("billing") || lower.includes("charge") || lower.includes("refund")) {
      return "I've reviewed your billing inquiry. Let me check your account details and get back to you with specific information about your charges. Could you please confirm the date range you're asking about?";
    }
    
    if (lower.includes("cancel") || lower.includes("subscription")) {
      return "I understand you have questions about your subscription. I'd be happy to help! Before we proceed, could you tell me more about what's prompting this? We might be able to find a solution that works better for you.";
    }
    
    if (lower.includes("bug") || lower.includes("error") || lower.includes("broken") || lower.includes("not working")) {
      return "Thank you for reporting this issue. I've escalated it to our technical team. Could you provide:\n\n1. Steps to reproduce the issue\n2. Browser/device you're using\n3. Any error messages you see\n\nThis will help us resolve it faster.";
    }
    
    if (lower.includes("feature") || lower.includes("request") || lower.includes("suggestion")) {
      return "Thank you for this valuable feedback! I've noted your suggestion and passed it to our product team. We truly appreciate users like you helping us improve Servio. Is there anything else you'd like to see?";
    }
    
    if (lower.includes("how") || lower.includes("help") || lower.includes("guide")) {
      return "Great question! Let me help you with that. You can find step-by-step guides in our Help Center (accessible from your dashboard). For this specific topic, here's what I recommend:\n\n1. [Provide specific steps]\n2. [Additional guidance]\n\nWould you like more detailed instructions?";
    }
    
    return "Thank you for reaching out! I've reviewed your message and I'm here to help. Could you provide a bit more detail so I can assist you better?";
  };

  const resolveConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from("support_conversations")
        .update({ 
          status: "resolved", 
          resolved_at: new Date().toISOString() 
        })
        .eq("id", selectedConversation.id);

      if (error) throw error;

      toast.success("Conversation resolved");
      setSelectedConversation({ ...selectedConversation, status: "resolved" });
      fetchConversations();
    } catch (error) {
      console.error("Error resolving conversation:", error);
      toast.error("Failed to resolve conversation");
    }
  };

  const reopenConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from("support_conversations")
        .update({ status: "open", resolved_at: null })
        .eq("id", selectedConversation.id);

      if (error) throw error;

      toast.success("Conversation reopened");
      setSelectedConversation({ ...selectedConversation, status: "open" });
      fetchConversations();
    } catch (error) {
      console.error("Error reopening conversation:", error);
      toast.error("Failed to reopen conversation");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case "user":
        return <User className="w-4 h-4" />;
      case "admin":
        return <CheckCircle2 className="w-4 h-4" />;
      case "ai":
        return <Bot className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case "user":
        return "Customer";
      case "admin":
        return "You (Admin)";
      case "ai":
        return "AI Assistant";
      default:
        return "Unknown";
    }
  };

  const openCount = conversations.filter(c => c.status === "open").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                Support Chats
              </CardTitle>
              <CardDescription>
                {openCount} open conversation{openCount !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchConversations}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{conv.user_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge 
                        variant={conv.status === "open" ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {conv.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Panel */}
      <Card className="lg:col-span-2 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    {selectedConversation.user_email}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3" />
                    Started {formatDistanceToNow(new Date(selectedConversation.created_at), { addSuffix: true })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.status === "open" ? (
                    <Button variant="outline" size="sm" onClick={resolveConversation}>
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={reopenConversation}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.sender_type !== "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          message.sender_type === "user"
                            ? "bg-muted text-muted-foreground"
                            : message.sender_type === "admin"
                            ? "bg-green-500 text-white"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {getSenderIcon(message.sender_type)}
                      </div>
                      <div
                        className={cn(
                          "flex flex-col max-w-[75%]",
                          message.sender_type !== "user" ? "items-end" : "items-start"
                        )}
                      >
                        <span className="text-xs text-muted-foreground mb-1">
                          {getSenderLabel(message.sender_type)}
                        </span>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                            message.sender_type === "user"
                              ? "bg-muted text-foreground rounded-bl-md"
                              : message.sender_type === "admin"
                              ? "bg-green-500 text-white rounded-br-md"
                              : "bg-primary text-primary-foreground rounded-br-md"
                          )}
                        >
                          {message.content}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-4 space-y-3">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateAIResponse}
                    disabled={isGeneratingAI || selectedConversation.status !== "open"}
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    AI Suggest
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your reply..."
                    disabled={isSending || selectedConversation.status !== "open"}
                    rows={2}
                    className="resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => sendMessage(false)} 
                      disabled={!input.trim() || isSending || selectedConversation.status !== "open"}
                      className="flex-1"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => sendMessage(true)} 
                      disabled={!input.trim() || isSending || selectedConversation.status !== "open"}
                      className="flex-1"
                      title="Send as AI"
                    >
                      <Bot className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
