import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, Bot, User, CheckCircle2, Clock } from "lucide-react";
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
}

export function SupportChat() {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch or create conversation
  useEffect(() => {
    if (!user) return;

    async function fetchConversation() {
      setIsLoading(true);
      try {
        // Check for existing open conversation
        const { data: existingConv, error: convError } = await supabase
          .from("support_conversations")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (convError) throw convError;

        if (existingConv) {
          setConversation(existingConv);
          
          // Fetch messages
          const { data: msgs, error: msgError } = await supabase
            .from("support_messages")
            .select("*")
            .eq("conversation_id", existingConv.id)
            .order("created_at", { ascending: true });

          if (msgError) throw msgError;
          setMessages(msgs || []);
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
        toast.error("Failed to load support chat");
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversation();
  }, [user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`support-messages-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  const startConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("support_conversations")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      setConversation(data);

      // Send welcome message from AI
      const welcomeMsg = "Hi there! 👋 I'm here to help with any questions about Servio. Our support team and AI assistant are both available to assist you. How can we help today?";
      
      await supabase.from("support_messages").insert({
        conversation_id: data.id,
        sender_type: "ai",
        content: welcomeMsg,
      });

      toast.success("Support chat started!");
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start support chat");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation || isSending) return;

    const messageContent = input.trim();
    setInput("");
    setIsSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversation.id,
      sender_type: "user",
      sender_id: user?.id || null,
      content: messageContent,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase
        .from("support_messages")
        .insert({
          conversation_id: conversation.id,
          sender_type: "user",
          sender_id: user?.id,
          content: messageContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));

      // Get AI response (simple auto-reply for now, admin can respond manually)
      setTimeout(async () => {
        const aiResponse = getAutoResponse(messageContent);
        if (aiResponse) {
          await supabase.from("support_messages").insert({
            conversation_id: conversation.id,
            sender_type: "ai",
            content: aiResponse,
          });
        }
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const getAutoResponse = (message: string): string | null => {
    const lower = message.toLowerCase();
    
    if (lower.includes("billing") || lower.includes("payment") || lower.includes("invoice")) {
      return "I understand you have a billing question. Our team will review this and get back to you shortly. In the meantime, you can view your invoices in Settings > Billing.";
    }
    
    if (lower.includes("bug") || lower.includes("error") || lower.includes("not working")) {
      return "I'm sorry to hear you're experiencing an issue! Could you describe what's happening in more detail? A team member will look into this as soon as possible.";
    }
    
    if (lower.includes("feature") || lower.includes("request") || lower.includes("suggestion")) {
      return "Thanks for the feedback! We love hearing suggestions from our users. I've noted your request and our product team will review it.";
    }
    
    return "Thanks for reaching out! A member of our support team will respond to you shortly. Average response time is under 2 hours during business hours.";
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
        return "You";
      case "admin":
        return "Support Team";
      case "ai":
        return "AI Assistant";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Get Support
          </CardTitle>
          <CardDescription>
            Chat with our AI assistant and support team for help with any issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Need help?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start a conversation with our support team. Our AI assistant will help immediately, 
              and a human agent will follow up if needed.
            </p>
            <Button onClick={startConversation} size="lg">
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Support Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Support Chat
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3" />
              Started {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge variant={conversation.status === "open" ? "default" : "secondary"}>
            {conversation.status}
          </Badge>
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
                  message.sender_type === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.sender_type === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.sender_type === "admin"
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {getSenderIcon(message.sender_type)}
                </div>
                <div
                  className={cn(
                    "flex flex-col max-w-[75%]",
                    message.sender_type === "user" ? "items-end" : "items-start"
                  )}
                >
                  <span className="text-xs text-muted-foreground mb-1">
                    {getSenderLabel(message.sender_type)}
                  </span>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      message.sender_type === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
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

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              disabled={isSending || conversation.status !== "open"}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isSending || conversation.status !== "open"}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
