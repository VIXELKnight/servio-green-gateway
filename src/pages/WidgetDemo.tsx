import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MessageSquare, 
  Code, 
  Smartphone, 
  Globe, 
  Zap, 
  CheckCircle,
  Bot,
  Send,
  Palette,
  Settings,
  Instagram,
  MessageCircle as WhatsAppIcon,
  ShoppingBag,
  Play,
  Pause,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

// Demo conversation for realistic chat simulation
const demoConversation = [
  { role: "bot", content: "Hi there! 👋 Welcome to TechStore. How can I help you today?", delay: 0 },
  { role: "user", content: "Hi! I'm looking for a laptop for video editing", delay: 2000 },
  { role: "bot", content: "Great choice! For video editing, I'd recommend our **MacBook Pro 16\"** or the **Dell XPS 15**. Both have:\n\n• Powerful processors (M3 Pro or i9)\n• 32GB RAM options\n• Dedicated graphics\n• Color-accurate displays\n\nWhat's your budget range?", delay: 4000 },
  { role: "user", content: "Around $2000-2500", delay: 7000 },
  { role: "bot", content: "Perfect! At that price point, I'd suggest the **Dell XPS 15** ($2,299). It includes:\n\n✅ Intel Core i7-13700H\n✅ 32GB DDR5 RAM\n✅ NVIDIA RTX 4060\n✅ 1TB SSD\n✅ 15.6\" OLED display\n\nWould you like me to check availability or compare with other options?", delay: 9000 },
  { role: "user", content: "Can I get free shipping?", delay: 12000 },
  { role: "bot", content: "Yes! 🎉 All orders over $500 qualify for **free express shipping** (2-3 business days).\n\nPlus, if you sign up for our newsletter, you'll get an extra **10% off** your first order!\n\nWant me to help you complete your purchase?", delay: 14000 },
];

const channelPreviews = [
  {
    id: "website",
    name: "Website",
    icon: Globe,
    description: "Embed on any website",
    color: "bg-primary"
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: WhatsAppIcon,
    description: "WhatsApp Business API",
    color: "bg-green-500"
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    description: "Instagram DM automation",
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    description: "E-commerce integration",
    color: "bg-[#96bf48]"
  }
];

const WidgetDemo = () => {
  const [activeTab, setActiveTab] = useState("chat");
  
  // Chat simulation state
  const [chatMessages, setChatMessages] = useState<typeof demoConversation>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Customization state
  const [widgetColor, setWidgetColor] = useState("#16a34a");
  const [widgetPosition, setWidgetPosition] = useState<"right" | "left">("right");
  const [botName, setBotName] = useState("Support Bot");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! How can I help you today?");
  const [showBranding, setShowBranding] = useState(true);

  // Channel state
  const [selectedChannel, setSelectedChannel] = useState("website");

  // Simulate chat conversation
  useEffect(() => {
    if (!isPlaying || currentMessageIndex >= demoConversation.length) {
      if (currentMessageIndex >= demoConversation.length) {
        setIsPlaying(false);
      }
      return;
    }

    const message = demoConversation[currentMessageIndex];
    const delay = currentMessageIndex === 0 ? 500 : (message.delay - (demoConversation[currentMessageIndex - 1]?.delay || 0));

    const timer = setTimeout(() => {
      setChatMessages(prev => [...prev, message]);
      setCurrentMessageIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentMessageIndex]);

  const handlePlayDemo = () => {
    setChatMessages([]);
    setCurrentMessageIndex(0);
    setIsPlaying(true);
  };

  const handlePauseDemo = () => {
    setIsPlaying(false);
  };

  const handleResetDemo = () => {
    setIsPlaying(false);
    setChatMessages([]);
    setCurrentMessageIndex(0);
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('• ') || line.startsWith('✅ ')) {
        return <p key={i} className="ml-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Instant messaging with typing indicators and smooth animations"
    },
    {
      icon: Zap,
      title: "AI-Powered Responses",
      description: "Intelligent automation that learns from your knowledge base"
    },
    {
      icon: Globe,
      title: "Multi-Channel",
      description: "Same bot works on website, WhatsApp, and Instagram"
    },
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      description: "Looks great on any device, automatically adapts to screen size"
    }
  ];

  const installSteps = [
    {
      step: 1,
      title: "Create Your Bot",
      description: "Sign up and create a new bot in your dashboard with custom instructions"
    },
    {
      step: 2,
      title: "Add Knowledge Base",
      description: "Upload FAQs and documentation to train your bot on your business"
    },
    {
      step: 3,
      title: "Copy Embed Code",
      description: "Get your unique embed code from the Channels tab"
    },
    {
      step: 4,
      title: "Paste & Go Live",
      description: "Add the script to your website and start helping customers instantly"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container px-4 md:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Interactive Demo
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-6">
              Experience the
              <br />
              <span className="text-green-200">AI Chat Widget</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Explore a realistic demo, customize the look, and see how Servio works across different channels.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container px-4 md:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Live Chat Demo
              </TabsTrigger>
              <TabsTrigger value="customize" className="gap-2">
                <Palette className="w-4 h-4" />
                Customize Widget
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-2">
                <Globe className="w-4 h-4" />
                Multi-Channel
              </TabsTrigger>
            </TabsList>

            {/* Live Chat Demo */}
            <TabsContent value="chat" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Realistic Conversation Demo</CardTitle>
                      <CardDescription>
                        Watch a sample customer interaction unfold in real-time
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!isPlaying ? (
                        <Button onClick={handlePlayDemo} size="sm" className="gap-2">
                          <Play className="w-4 h-4" />
                          {chatMessages.length > 0 ? "Resume" : "Start Demo"}
                        </Button>
                      ) : (
                        <Button onClick={handlePauseDemo} size="sm" variant="outline" className="gap-2">
                          <Pause className="w-4 h-4" />
                          Pause
                        </Button>
                      )}
                      <Button onClick={handleResetDemo} size="sm" variant="ghost" className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    {/* Simulated widget */}
                    <div className="w-full max-w-sm border border-border rounded-2xl shadow-2xl overflow-hidden bg-card">
                      {/* Widget header */}
                      <div className="bg-primary p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center relative">
                          <Bot className="w-5 h-5 text-primary-foreground" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary-foreground">TechStore Support</h3>
                          <p className="text-xs text-primary-foreground/70">Online • Replies instantly</p>
                        </div>
                      </div>

                      {/* Messages area */}
                      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-muted/30">
                        {chatMessages.length === 0 && !isPlaying && (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
                            <div>
                              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>Click "Start Demo" to watch</p>
                              <p>a sample conversation</p>
                            </div>
                          </div>
                        )}
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex animate-fade-in",
                              msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-3 text-sm space-y-1",
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-card border border-border text-foreground rounded-bl-md shadow-sm"
                              )}
                            >
                              {formatMessage(msg.content)}
                            </div>
                          </div>
                        ))}
                        {isPlaying && currentMessageIndex < demoConversation.length && (
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
                      </div>

                      {/* Input area */}
                      <div className="p-4 border-t border-border bg-card">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Type your message..."
                            className="flex-1"
                            disabled
                          />
                          <Button size="icon" disabled>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customize Widget */}
            <TabsContent value="customize" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customization Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Customize Your Widget
                    </CardTitle>
                    <CardDescription>
                      See your changes in real-time on the preview
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Bot Name</Label>
                      <Input
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        placeholder="Support Bot"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Welcome Message</Label>
                      <Input
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="Hi! How can I help?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={widgetColor}
                          onChange={(e) => setWidgetColor(e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={widgetColor}
                          onChange={(e) => setWidgetColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        {["#16a34a", "#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#0891b2"].map((color) => (
                          <button
                            key={color}
                            onClick={() => setWidgetColor(color)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                              widgetColor === color ? "border-foreground" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Position</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={widgetPosition === "left" ? "default" : "outline"}
                          onClick={() => setWidgetPosition("left")}
                          className="flex-1"
                        >
                          Left
                        </Button>
                        <Button
                          variant={widgetPosition === "right" ? "default" : "outline"}
                          onClick={() => setWidgetPosition("right")}
                          className="flex-1"
                        >
                          Right
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Show "Powered by Servio"</Label>
                      <Switch
                        checked={showBranding}
                        onCheckedChange={setShowBranding}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Live Preview */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>
                      This is how your widget will appear to customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={cn("relative h-96 bg-muted/50 rounded-lg overflow-hidden border border-dashed border-border")}>
                      {/* Mock website content */}
                      <div className="absolute inset-0 p-4 opacity-50">
                        <div className="h-4 w-1/3 bg-muted rounded mb-4" />
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-muted rounded" />
                          <div className="h-3 w-4/5 bg-muted rounded" />
                          <div className="h-3 w-2/3 bg-muted rounded" />
                        </div>
                      </div>

                      {/* Widget Preview */}
                      <div className={cn(
                        "absolute bottom-4 w-72 border border-border rounded-2xl shadow-xl bg-card overflow-hidden",
                        widgetPosition === "right" ? "right-4" : "left-4"
                      )}>
                        <div className="p-3 flex items-center gap-2" style={{ backgroundColor: widgetColor }}>
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{botName || "Support Bot"}</p>
                            <p className="text-xs text-white/70">Online</p>
                          </div>
                        </div>
                        <div className="p-3 bg-muted/30 min-h-[120px]">
                          <div className="bg-card border border-border rounded-xl rounded-bl-none p-2 text-xs max-w-[85%]">
                            {welcomeMessage || "Hi! How can I help you today?"}
                          </div>
                        </div>
                        {showBranding && (
                          <div className="p-2 text-center border-t border-border">
                            <span className="text-[10px] text-muted-foreground">Powered by Servio</span>
                          </div>
                        )}
                      </div>

                      {/* Toggle button preview */}
                      <button
                        className={cn(
                          "absolute bottom-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center",
                          widgetPosition === "right" ? "right-4" : "left-4"
                        )}
                        style={{ backgroundColor: widgetColor }}
                      >
                        <MessageSquare className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Multi-Channel */}
            <TabsContent value="channels" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>One Bot, Every Channel</CardTitle>
                  <CardDescription>
                    Your AI bot works seamlessly across all platforms with unified conversations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {channelPreviews.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          selectedChannel === channel.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", channel.color)}>
                          <channel.icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-medium">{channel.name}</h4>
                        <p className="text-xs text-muted-foreground">{channel.description}</p>
                      </button>
                    ))}
                  </div>

                  {/* Channel-specific preview */}
                  <div className="bg-muted/50 rounded-xl p-6">
                    {selectedChannel === "website" && (
                      <div className="text-center max-w-md mx-auto">
                        <Globe className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <h3 className="text-lg font-semibold mb-2">Website Widget</h3>
                        <p className="text-muted-foreground mb-4">
                          Embed on any website with a single line of code. Works with WordPress, Shopify, Wix, Squarespace, and custom sites.
                        </p>
                        <code className="block p-3 bg-card rounded-lg text-xs text-left overflow-x-auto">
                          {`<script src="https://servio.app/widget.js" data-embed-key="YOUR_KEY"></script>`}
                        </code>
                      </div>
                    )}
                    {selectedChannel === "whatsapp" && (
                      <div className="text-center max-w-md mx-auto">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-green-500 flex items-center justify-center">
                          <WhatsAppIcon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">WhatsApp Business</h3>
                        <p className="text-muted-foreground mb-4">
                          Connect via WhatsApp Business API. Handle customer inquiries at scale with automated responses and smart escalation.
                        </p>
                        <Badge variant="outline">OAuth Integration</Badge>
                      </div>
                    )}
                    {selectedChannel === "instagram" && (
                      <div className="text-center max-w-md mx-auto">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                          <Instagram className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Instagram DMs</h3>
                        <p className="text-muted-foreground mb-4">
                          Auto-reply to Instagram DMs. Perfect for e-commerce, influencers, and businesses with high message volume.
                        </p>
                        <Badge variant="outline">Requires Business Account</Badge>
                      </div>
                    )}
                    {selectedChannel === "shopify" && (
                      <div className="text-center max-w-md mx-auto">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-[#96bf48] flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Shopify Integration</h3>
                        <p className="text-muted-foreground mb-4">
                          Deep integration with your store. The bot can check order status, recommend products, and answer product questions.
                        </p>
                        <Badge variant="outline">Full Catalog Access</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Widget Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for exceptional customer engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Easy Installation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your AI chatbot running in under 5 minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {installSteps.map((item) => (
                <Card key={item.step} className="relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <CardHeader className="pr-16">
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Code Example */}
          <div className="max-w-3xl mx-auto mt-12">
            <Card className="border-primary/20 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Just One Line of Code
                </CardTitle>
                <CardDescription>
                  Add this script tag to your website before the closing &lt;/body&gt; tag
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code className="text-foreground">
                    {`<script src="https://servio.app/widget.js" data-embed-key="YOUR_EMBED_KEY"></script>`}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Replace YOUR_EMBED_KEY with your bot's embed key from the dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Ready to Transform Your Customer Support?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of businesses using Servio to automate support and delight customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button variant="hero" size="xl">
                  Start Free Trial
                </Button>
              </Link>
              <a href="/#pricing">
                <Button variant="heroOutline" size="xl">
                  View Pricing
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container px-4 md:px-6 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Servio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WidgetDemo;
