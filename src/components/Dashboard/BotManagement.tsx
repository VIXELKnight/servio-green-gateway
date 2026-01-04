import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Bot, 
  Plus, 
  Settings, 
  MessageSquare, 
  Globe, 
  Instagram, 
  Smartphone,
  Code,
  Copy,
  Check,
  Trash2,
  BookOpen
} from "lucide-react";
import { KnowledgeBase } from "./KnowledgeBase";
import { BotConversations } from "./BotConversations";
import { ChannelConfigDialog } from "./ChannelConfig";

interface BotData {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  welcome_message: string | null;
  is_active: boolean;
  triage_enabled: boolean;
  triage_threshold: number;
  created_at: string;
}

interface ChannelData {
  id: string;
  bot_id: string;
  channel_type: string;
  is_active: boolean;
  config: unknown;
  embed_key: string;
}

export function BotManagement() {
  const { user, isSubscribed } = useAuth();
  const [bots, setBots] = useState<BotData[]>([]);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<BotData | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [newBot, setNewBot] = useState({
    name: "",
    description: "",
    instructions: "You are a helpful customer service assistant. Be friendly, professional, and provide accurate information.",
    welcome_message: "Hello! How can I help you today?"
  });

  useEffect(() => {
    if (user) {
      fetchBots();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBot) {
      fetchChannels(selectedBot.id);
    }
  }, [selectedBot]);

  async function fetchBots() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bots:", error);
      toast.error("Failed to load bots");
    } else {
      setBots(data || []);
      if (data && data.length > 0 && !selectedBot) {
        setSelectedBot(data[0]);
      }
    }
    setIsLoading(false);
  }

  async function fetchChannels(botId: string) {
    const { data, error } = await supabase
      .from("bot_channels")
      .select("*")
      .eq("bot_id", botId);

    if (error) {
      console.error("Error fetching channels:", error);
    } else {
      setChannels(data || []);
    }
  }

  async function createBot() {
    if (!newBot.name.trim()) {
      toast.error("Bot name is required");
      return;
    }

    const { data, error } = await supabase
      .from("bots")
      .insert({
        user_id: user?.id,
        name: newBot.name.trim(),
        description: newBot.description.trim() || null,
        instructions: newBot.instructions.trim(),
        welcome_message: newBot.welcome_message.trim()
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating bot:", error);
      toast.error("Failed to create bot");
      return;
    }

    // Create default channels
    await supabase.from("bot_channels").insert([
      { bot_id: data.id, channel_type: "website" },
      { bot_id: data.id, channel_type: "whatsapp" },
      { bot_id: data.id, channel_type: "instagram" }
    ]);

    toast.success("Bot created successfully");
    setIsCreateDialogOpen(false);
    setNewBot({
      name: "",
      description: "",
      instructions: "You are a helpful customer service assistant. Be friendly, professional, and provide accurate information.",
      welcome_message: "Hello! How can I help you today?"
    });
    fetchBots();
    setSelectedBot(data);
  }

  async function updateBot(bot: BotData) {
    const { error } = await supabase
      .from("bots")
      .update({
        name: bot.name,
        description: bot.description,
        instructions: bot.instructions,
        welcome_message: bot.welcome_message,
        is_active: bot.is_active,
        triage_enabled: bot.triage_enabled,
        triage_threshold: bot.triage_threshold
      })
      .eq("id", bot.id);

    if (error) {
      console.error("Error updating bot:", error);
      toast.error("Failed to update bot");
    } else {
      toast.success("Bot updated successfully");
      fetchBots();
      setIsEditDialogOpen(false);
    }
  }

  async function deleteBot(botId: string) {
    const { error } = await supabase
      .from("bots")
      .delete()
      .eq("id", botId);

    if (error) {
      console.error("Error deleting bot:", error);
      toast.error("Failed to delete bot");
    } else {
      toast.success("Bot deleted");
      setSelectedBot(null);
      fetchBots();
    }
  }

  async function toggleChannel(channelId: string, isActive: boolean) {
    const { error } = await supabase
      .from("bot_channels")
      .update({ is_active: isActive })
      .eq("id", channelId);

    if (error) {
      console.error("Error updating channel:", error);
      toast.error("Failed to update channel");
    } else {
      toast.success(`Channel ${isActive ? "enabled" : "disabled"}`);
      if (selectedBot) fetchChannels(selectedBot.id);
    }
  }

  function copyEmbedCode(embedKey: string) {
    const embedCode = `<script src="${window.location.origin}/widget.js" data-embed-key="${embedKey}"></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopiedKey(embedKey);
    toast.success("Embed code copied!");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function getChannelIcon(type: string) {
    switch (type) {
      case "website": return Globe;
      case "whatsapp": return Smartphone;
      case "instagram": return Instagram;
      default: return MessageSquare;
    }
  }

  if (!isSubscribed) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">AI Bots Feature</h3>
          <p className="text-muted-foreground mb-4">
            Upgrade to a paid plan to create AI-powered bots for your website, WhatsApp, and Instagram.
          </p>
          <Button>Upgrade Now</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Bots</h2>
          <p className="text-muted-foreground">Create and manage AI-powered customer service bots</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Bot</DialogTitle>
              <DialogDescription>
                Set up a new AI bot for your customer service
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bot-name">Bot Name</Label>
                <Input
                  id="bot-name"
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                  placeholder="e.g., Sales Assistant"
                />
              </div>
              <div>
                <Label htmlFor="bot-description">Description</Label>
                <Input
                  id="bot-description"
                  value={newBot.description}
                  onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
                  placeholder="Brief description of what this bot does"
                />
              </div>
              <div>
                <Label htmlFor="bot-instructions">AI Instructions</Label>
                <Textarea
                  id="bot-instructions"
                  value={newBot.instructions}
                  onChange={(e) => setNewBot({ ...newBot, instructions: e.target.value })}
                  placeholder="Instructions for how the AI should behave..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="bot-welcome">Welcome Message</Label>
                <Input
                  id="bot-welcome"
                  value={newBot.welcome_message}
                  onChange={(e) => setNewBot({ ...newBot, welcome_message: e.target.value })}
                  placeholder="First message visitors see"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createBot}>Create Bot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : bots.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Bots Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI bot to start automating customer support
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Bot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Bot List Sidebar */}
          <div className="space-y-2">
            {bots.map((bot) => (
              <Card
                key={bot.id}
                className={`cursor-pointer transition-all ${
                  selectedBot?.id === bot.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedBot(bot)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{bot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bot.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={bot.is_active ? "default" : "secondary"}>
                      {bot.is_active ? "On" : "Off"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bot Details */}
          {selectedBot && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedBot.name}
                        <Badge variant={selectedBot.is_active ? "default" : "secondary"}>
                          {selectedBot.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{selectedBot.description || "No description"}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Bot Settings</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Bot Name</Label>
                              <Input
                                value={selectedBot.name}
                                onChange={(e) => setSelectedBot({ ...selectedBot, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={selectedBot.description || ""}
                                onChange={(e) => setSelectedBot({ ...selectedBot, description: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>AI Instructions</Label>
                              <Textarea
                                value={selectedBot.instructions}
                                onChange={(e) => setSelectedBot({ ...selectedBot, instructions: e.target.value })}
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Welcome Message</Label>
                              <Input
                                value={selectedBot.welcome_message || ""}
                                onChange={(e) => setSelectedBot({ ...selectedBot, welcome_message: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Bot Active</Label>
                                <p className="text-xs text-muted-foreground">Enable/disable the bot</p>
                              </div>
                              <Switch
                                checked={selectedBot.is_active}
                                onCheckedChange={(checked) => setSelectedBot({ ...selectedBot, is_active: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Auto-Triage</Label>
                                <p className="text-xs text-muted-foreground">Route complex queries to humans</p>
                              </div>
                              <Switch
                                checked={selectedBot.triage_enabled}
                                onCheckedChange={(checked) => setSelectedBot({ ...selectedBot, triage_enabled: checked })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="destructive" onClick={() => deleteBot(selectedBot.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Bot
                            </Button>
                            <Button onClick={() => updateBot(selectedBot)}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="channels" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="channels" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Channels
                      </TabsTrigger>
                      <TabsTrigger value="knowledge" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Knowledge Base
                      </TabsTrigger>
                      <TabsTrigger value="conversations" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Conversations
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="channels" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {channels.map((channel) => {
                          const Icon = getChannelIcon(channel.channel_type);
                          return (
                            <Card key={channel.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium capitalize">{channel.channel_type}</p>
                                      <Badge variant={channel.is_active ? "default" : "secondary"} className="text-xs">
                                        {channel.is_active ? "Active" : "Inactive"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={channel.is_active}
                                    onCheckedChange={(checked) => toggleChannel(channel.id, checked)}
                                  />
                                </div>

                                {channel.channel_type === "website" && (
                                  <div className="space-y-2">
                                    <Label className="text-xs">Embed Code</Label>
                                    <div className="flex gap-2">
                                      <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                                        &lt;script data-embed-key="{channel.embed_key.slice(0, 8)}..."&gt;
                                      </code>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyEmbedCode(channel.embed_key)}
                                      >
                                        {copiedKey === channel.embed_key ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <Copy className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {(channel.channel_type === "whatsapp" || channel.channel_type === "instagram") && (
                                  <ChannelConfigDialog 
                                    channel={channel} 
                                    onUpdate={() => selectedBot && fetchChannels(selectedBot.id)} 
                                  />
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {channels.some(c => c.channel_type === 'website' && c.is_active) && (
                        <Card className="border-primary/20 bg-primary/5">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <Code className="w-6 h-6 text-primary shrink-0 mt-1" />
                              <div>
                                <h4 className="font-medium mb-1">Website Widget Integration</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Add this script tag to your website to enable the chat widget:
                                </p>
                                <div className="bg-background rounded-lg p-3 font-mono text-sm">
                                  {`<script src="${window.location.origin}/widget.js" data-embed-key="${channels.find(c => c.channel_type === 'website')?.embed_key}"></script>`}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="knowledge">
                      <KnowledgeBase botId={selectedBot.id} />
                    </TabsContent>

                    <TabsContent value="conversations">
                      <BotConversations botId={selectedBot.id} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
