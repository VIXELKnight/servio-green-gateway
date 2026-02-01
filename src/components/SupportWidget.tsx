import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

// Comprehensive responses for a live product demo
const knowledgeBase = {
  pricing: {
    keywords: ["price", "cost", "pricing", "plan", "plans", "subscription", "how much", "pay", "payment", "monthly", "yearly"],
    response: `We offer three flexible plans:

**🚀 Starter - $49/month**
• 1 AI Bot
• Website widget
• 1,000 conversations/month
• Knowledge base (50 articles)
• Email support

**⭐ Professional - $149/month** (Most Popular)
• 5 AI Bots
• Website + WhatsApp + Instagram
• 10,000 conversations/month
• Unlimited knowledge base
• Priority support
• Advanced analytics

**🏢 Enterprise - Custom Pricing**
• Unlimited bots & conversations
• All channels + custom integrations
• Dedicated account manager
• SLA guarantee
• Custom training

Would you like to start a free trial or learn more about any specific plan?`
  },
  demo: {
    keywords: ["demo", "trial", "try", "test", "free", "start"],
    response: `Great choice! Here's how to get started:

1. **Sign up free** - Click "Get Started" in the navigation
2. **Create your first bot** - Takes less than 2 minutes
3. **Add your knowledge base** - FAQs, product info, etc.
4. **Embed on your site** - Just one line of code!

You can try all Professional features free for 14 days - no credit card required!

Would you like me to walk you through any specific feature?`
  },
  features: {
    keywords: ["feature", "what can", "capabilities", "do", "help", "offer", "benefit"],
    response: `Servio is an AI-powered customer support platform. Here's what makes us special:

**🤖 Smart AI Bots**
• Train on your business knowledge
• Natural conversations in any language
• Smart escalation to human agents

**📱 Multi-Channel Support**
• Website chat widget
• WhatsApp Business integration
• Instagram DM automation
• Shopify store integration

**📊 Powerful Analytics**
• Real-time conversation tracking
• Customer satisfaction metrics
• Response time analytics

**⚡ Easy Setup**
• No coding required
• 5-minute installation
• Works on any website

What feature interests you most?`
  },
  integration: {
    keywords: ["integration", "connect", "instagram", "whatsapp", "shopify", "website", "embed", "install"],
    response: `We integrate with all major platforms:

**🌐 Website Widget**
Just add one line of code - works on any website, Shopify, WordPress, Wix, Squarespace, and more.

**📸 Instagram**
Connect via OAuth in seconds. Auto-reply to DMs and maintain context across conversations.

**💬 WhatsApp**
Full WhatsApp Business API integration. Handle customer inquiries at scale.

**🛒 Shopify**
Deep integration for order tracking, product recommendations, and store-specific support.

All channels sync to one dashboard - no switching between apps!

Which integration would you like to learn more about?`
  },
  support: {
    keywords: ["support", "help", "contact", "email", "phone", "team", "human", "agent"],
    response: `We've got you covered:

**📧 Email Support**
support@servio.app - Response within 24 hours

**📚 Help Center**
Comprehensive guides and tutorials in your dashboard

**🎓 Onboarding**
Step-by-step setup wizard for new users

**👥 Dedicated Support** (Enterprise)
Personal account manager and priority response

For urgent issues, Professional and Enterprise customers get priority queue access.

Is there something specific I can help you with right now?`
  },
  howItWorks: {
    keywords: ["how", "work", "ai", "train", "learn", "knowledge", "base", "setup"],
    response: `Here's how Servio works:

**1️⃣ Create Your Bot**
Give it a name and personality. Write instructions for how it should respond.

**2️⃣ Build Knowledge Base**
Add FAQs, product info, policies - anything your customers ask about. The AI learns from this.

**3️⃣ Connect Channels**
Website widget takes 30 seconds. Instagram/WhatsApp connect via OAuth.

**4️⃣ Go Live!**
Your AI handles inquiries 24/7. Complex questions get routed to your team.

**5️⃣ Improve Over Time**
Review conversations, update knowledge base, watch satisfaction scores climb.

The AI uses advanced language models to understand context and provide accurate, helpful responses.

Ready to create your first bot?`
  },
  greeting: {
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
    response: `Hello! 👋 Welcome to Servio!

I'm here to help you learn about our AI-powered customer support platform. I can tell you about:

• **Pricing & Plans** - Find the right fit for your business
• **Features** - What makes Servio special
• **Integrations** - Connect to your favorite platforms
• **Demo** - How to get started

What would you like to know?`
  },
  comparison: {
    keywords: ["compare", "vs", "versus", "alternative", "competitor", "different", "better", "zendesk", "intercom", "freshdesk"],
    response: `Great question! Here's why customers choose Servio:

**vs. Traditional Helpdesks**
✅ AI handles 80% of queries automatically
✅ No per-agent pricing
✅ Setup in minutes, not weeks

**vs. Other AI Chatbots**
✅ Multi-channel from day one
✅ Your data stays private
✅ Real escalation to humans

**vs. Building In-House**
✅ No ML expertise needed
✅ Pre-built integrations
✅ Fraction of the cost

Our customers typically see 60% reduction in support tickets and 90%+ customer satisfaction.

Would you like to see it in action?`
  },
  security: {
    keywords: ["security", "secure", "privacy", "data", "gdpr", "compliant", "safe"],
    response: `Security is our top priority:

🔒 **Data Protection**
• End-to-end encryption
• SOC 2 Type II compliant
• GDPR & CCPA ready

🛡️ **Privacy**
• Your data is never used to train external models
• Data residency options available
• Full data export & deletion

🔐 **Access Control**
• Role-based permissions
• SSO integration (Enterprise)
• Audit logs

We take security as seriously as you do. Need more details? I can connect you with our security team.`
  }
};

const SupportWidget = forwardRef<HTMLDivElement>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const initializeChat = useCallback(async () => {
    if (messages.length > 0) return;
    
    // Add welcome message with slight delay for effect
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsTyping(false);
    
    setMessages([
      {
        id: "welcome",
        role: "bot",
        content: "Hi there! 👋 I'm Servio's AI assistant.\n\nI can help you learn about our AI-powered customer support platform. Ask me about:\n\n• **Pricing** - Plans starting at $49/month\n• **Features** - Multi-channel AI support\n• **Demo** - Try it free for 14 days\n\nHow can I help you today?",
      },
    ]);
  }, [messages.length]);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, initializeChat]);

  const findBestResponse = (userInput: string): string => {
    const lowered = userInput.toLowerCase();
    
    // Check each category for keyword matches
    let bestMatch: { category: string; score: number } = { category: "", score: 0 };
    
    for (const [category, data] of Object.entries(knowledgeBase)) {
      const matchCount = data.keywords.filter(keyword => 
        lowered.includes(keyword)
      ).length;
      
      if (matchCount > bestMatch.score) {
        bestMatch = { category, score: matchCount };
      }
    }
    
    if (bestMatch.score > 0) {
      return knowledgeBase[bestMatch.category as keyof typeof knowledgeBase].response;
    }
    
    // Default response
    return `Thanks for your question! I'm here to help you learn about Servio's AI-powered customer support platform.

I can tell you about:
• **Pricing** - Our plans and what's included
• **Features** - AI bots, multi-channel support, analytics
• **Integrations** - Website, WhatsApp, Instagram, Shopify
• **Getting Started** - How to set up in 5 minutes

What would you like to explore?`;
  };

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
    setIsTyping(true);

    try {
      // Simulate realistic typing delay based on response length
      const response = findBestResponse(userMessage.content);
      const typingDelay = Math.min(1500, Math.max(800, response.length * 2));
      await new Promise((resolve) => setTimeout(resolve, typingDelay));
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: response,
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "bot",
          content: "Sorry, I'm having trouble connecting. Please try again or contact us at support@servio.app.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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

  // Parse markdown-like syntax for display
  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold text
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return <p key={i} className="ml-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

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
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center relative">
                <Bot className="w-5 h-5 text-primary-foreground" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground flex items-center gap-2">
                  Servio AI
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground/70" />
                </h3>
                <p className="text-xs text-primary-foreground/70">
                  {isTyping ? "Typing..." : "Online • Replies instantly"}
                </p>
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
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm space-y-1",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md shadow-sm"
                  )}
                >
                  {formatMessage(message.content)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
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

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 bg-muted/30">
              {["Pricing", "Features", "Start Free Trial"].map((quick) => (
                <button
                  key={quick}
                  onClick={() => {
                    setInput(quick);
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {quick}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about pricing, features, integrations..."
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
          "fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
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

export default SupportWidget;
