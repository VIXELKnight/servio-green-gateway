import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles,
  Globe,
  Instagram,
  Smartphone,
  Rocket
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  { id: 1, title: "Welcome", description: "Get started with Servio" },
  { id: 2, title: "Create Bot", description: "Set up your first AI assistant" },
  { id: 3, title: "Configure", description: "Customize your bot's behavior" },
  { id: 4, title: "Channels", description: "Choose where to deploy" },
  { id: 5, title: "Done", description: "You're all set!" },
];

export function OnboardingWizard({ userId, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createdBotId, setCreatedBotId] = useState<string | null>(null);
  
  const [botData, setBotData] = useState({
    name: "",
    description: "",
    instructions: "You are a helpful customer service assistant. Be friendly, professional, and provide accurate information about our products and services.",
    welcome_message: "Hello! 👋 How can I help you today?",
  });
  
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["website"]);

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleNext = async () => {
    if (currentStep === 2) {
      // Validate bot name
      if (!botData.name.trim()) {
        toast.error("Please enter a name for your bot");
        return;
      }
    }
    
    if (currentStep === 4) {
      // Create the bot
      await createBot();
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createBot = async () => {
    setIsCreating(true);
    
    try {
      // Create the bot
      const { data: bot, error: botError } = await supabase
        .from("bots")
        .insert({
          user_id: userId,
          name: botData.name.trim(),
          description: botData.description.trim() || null,
          instructions: botData.instructions.trim(),
          welcome_message: botData.welcome_message.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (botError) throw botError;

      // Create selected channels
      const channelInserts = selectedChannels.map(channelType => ({
        bot_id: bot.id,
        channel_type: channelType,
        is_active: channelType === "website", // Only website is active by default
      }));

      await supabase.from("bot_channels").insert(channelInserts);

      setCreatedBotId(bot.id);
      setCurrentStep(5);
      toast.success("Your bot has been created!");
    } catch (error) {
      console.error("Error creating bot:", error);
      toast.error("Failed to create bot. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto shadow-lg">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold">Welcome to Servio!</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Let's set up your first AI-powered customer service bot in just a few steps.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex items-center gap-3 text-left p-4 rounded-xl bg-muted/50 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Create your AI bot</p>
                  <p className="text-xs text-muted-foreground">Name and configure your assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left p-4 rounded-xl bg-muted/50 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Connect channels</p>
                  <p className="text-xs text-muted-foreground">Deploy to website, WhatsApp & more</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left p-4 rounded-xl bg-muted/50 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Go live instantly</p>
                  <p className="text-xs text-muted-foreground">Start helping customers right away</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Name Your Bot</h2>
              <p className="text-muted-foreground">Give your AI assistant a name and description</p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Bot Name *</Label>
                <Input
                  id="bot-name"
                  value={botData.name}
                  onChange={(e) => setBotData({ ...botData, name: e.target.value })}
                  placeholder="e.g., Sales Assistant, Support Bot"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot-description">Description (optional)</Label>
                <Input
                  id="bot-description"
                  value={botData.description}
                  onChange={(e) => setBotData({ ...botData, description: e.target.value })}
                  placeholder="What does this bot do?"
                  className="h-12"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Configure Behavior</h2>
              <p className="text-muted-foreground">Tell your bot how to respond to customers</p>
            </div>
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="space-y-2">
                <Label htmlFor="instructions">AI Instructions</Label>
                <Textarea
                  id="instructions"
                  value={botData.instructions}
                  onChange={(e) => setBotData({ ...botData, instructions: e.target.value })}
                  placeholder="Describe how the AI should behave..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about your brand voice, products, and how to handle common questions.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome">Welcome Message</Label>
                <Input
                  id="welcome"
                  value={botData.welcome_message}
                  onChange={(e) => setBotData({ ...botData, welcome_message: e.target.value })}
                  placeholder="First message visitors see"
                  className="h-12"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Choose Channels</h2>
              <p className="text-muted-foreground">Where should your bot be available?</p>
            </div>
            <div className="grid gap-4 max-w-lg mx-auto">
              {[
                { id: "website", icon: Globe, title: "Website Widget", description: "Embed on your website", recommended: true },
                { id: "whatsapp", icon: Smartphone, title: "WhatsApp", description: "Connect WhatsApp Business" },
                { id: "instagram", icon: Instagram, title: "Instagram", description: "Connect Instagram DMs" },
              ].map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => toggleChannel(channel.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    selectedChannels.includes(channel.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                    selectedChannels.includes(channel.id) ? "bg-primary" : "bg-muted"
                  )}>
                    <channel.icon className={cn(
                      "w-6 h-6",
                      selectedChannels.includes(channel.id) ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{channel.title}</p>
                      {channel.recommended && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{channel.description}</p>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                    selectedChannels.includes(channel.id) 
                      ? "border-primary bg-primary" 
                      : "border-muted-foreground"
                  )}>
                    {selectedChannels.includes(channel.id) && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              You can configure and connect channels after setup
            </p>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold">You're All Set! 🎉</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Your bot <strong>{botData.name}</strong> is ready to help your customers.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4 max-w-sm mx-auto">
              <p className="text-sm text-muted-foreground">Next steps:</p>
              <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-muted/50">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm">Add knowledge base articles</span>
              </div>
              <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-muted/50">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm">Get the embed code for your website</span>
              </div>
              <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-muted/50">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm">Connect WhatsApp & Instagram</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 overflow-hidden shadow-2xl">
        {/* Progress Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Setup Wizard</span>
            </div>
            {currentStep < 5 && (
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip
              </Button>
            )}
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1 || currentStep === 5}
            className={cn(currentStep === 1 || currentStep === 5 ? "invisible" : "")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={isCreating}>
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : currentStep === 4 ? (
                <>
                  Create Bot
                  <Rocket className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={onComplete}>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
