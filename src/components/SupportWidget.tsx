import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

const SupportWidget = forwardRef<HTMLDivElement>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const initializeChat = useCallback(async () => {
    if (messages.length > 0) return;
    
    // Add welcome message
    setMessages([
      {
        id: "welcome",
        role: "bot",
        content: "Hi there! 👋 I'm Servio's AI assistant. How can I help you today?",
      },
    ]);
  }, [messages.length]);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, initializeChat]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate AI response for demo purposes
      // In production, this would call your bot-chat edge function
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: getBotResponse(userMessage.content),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "bot",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const toggleWidget = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div ref={ref}>
      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-50 w-80 sm:w-96 transition-all duration-300 ease-out",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[480px]">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Servio Support</h3>
                <p className="text-xs text-primary-foreground/70">Typically replies instantly</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleWidget}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        onClick={toggleWidget}
        size="icon"
        className={cn(
          "fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300",
          isOpen ? "rotate-0" : "rotate-0"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
});

SupportWidget.displayName = "SupportWidget";

// Simple demo responses
function getBotResponse(input: string): string {
  const lowered = input.toLowerCase();
  
  if (lowered.includes("price") || lowered.includes("cost") || lowered.includes("pricing")) {
    return "We offer flexible pricing plans starting from $49/month for Starter, $99/month for Professional, and custom Enterprise pricing. Would you like me to explain the features of each plan?";
  }
  
  if (lowered.includes("demo") || lowered.includes("trial")) {
    return "Great! You can try our widget demo right now at /widget-demo, or schedule a personalized demo with our team. Would you like me to help you get started?";
  }
  
  if (lowered.includes("feature") || lowered.includes("what can")) {
    return "Servio offers AI-powered customer support with features like multi-channel integration (Website, WhatsApp, Instagram), smart ticket routing, knowledge base management, and real-time analytics. What specific feature interests you?";
  }
  
  if (lowered.includes("integration") || lowered.includes("connect")) {
    return "We integrate with popular platforms including Shopify, WhatsApp Business, Instagram DMs, and any website via our embeddable widget. Which integration are you interested in?";
  }
  
  if (lowered.includes("hello") || lowered.includes("hi") || lowered.includes("hey")) {
    return "Hello! 👋 How can I assist you today? I can help with pricing, features, integrations, or answer any other questions about Servio.";
  }
  
  return "Thanks for your message! Our team typically responds within 24 hours. Is there anything specific about Servio I can help you with - like pricing, features, or integrations?";
}

export default SupportWidget;
