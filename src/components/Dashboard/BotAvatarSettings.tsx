import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Upload, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface BotData {
  id: string;
  name: string;
  avatar_url: string | null;
}

const DEFAULT_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=aneka&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/bottts/svg?seed=missy&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/bottts/svg?seed=buddy&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/bottts/svg?seed=rocky&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/bottts/svg?seed=gizmo&backgroundColor=c1f4c5",
  "https://api.dicebear.com/7.x/bottts/svg?seed=pixel&backgroundColor=f4e3c1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=spark&backgroundColor=e3c1f4",
];

export function BotAvatarSettings() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [customUrl, setCustomUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBots();
  }, []);

  useEffect(() => {
    const bot = bots.find(b => b.id === selectedBotId);
    if (bot) {
      setAvatarUrl(bot.avatar_url || "");
      setCustomUrl(bot.avatar_url || "");
    }
  }, [selectedBotId, bots]);

  async function fetchBots() {
    try {
      const { data, error } = await supabase
        .from("bots")
        .select("id, name, avatar_url");

      if (error) throw error;

      const botsData = (data || []).map(bot => ({
        id: bot.id,
        name: bot.name,
        avatar_url: (bot as any).avatar_url ?? null,
      }));

      setBots(botsData);
      if (botsData.length > 0) {
        setSelectedBotId(botsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching bots:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedBotId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("bots")
        .update({ avatar_url: avatarUrl || null } as any)
        .eq("id", selectedBotId);

      if (error) throw error;

      toast.success("Avatar updated successfully");
      
      setBots(prev => prev.map(bot => 
        bot.id === selectedBotId 
          ? { ...bot, avatar_url: avatarUrl }
          : bot
      ));
    } catch (error) {
      console.error("Error saving avatar:", error);
      toast.error("Failed to save avatar");
    } finally {
      setIsSaving(false);
    }
  }

  function generateRandomAvatar() {
    const seeds = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"];
    const colors = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "c1f4c5"];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Date.now();
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=${randomColor}`;
    setAvatarUrl(newUrl);
    setCustomUrl(newUrl);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Bot Avatar</CardTitle>
            <CardDescription>
              Customize your bot's appearance in the chat widget
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {bots.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No bots available</p>
            <p className="text-sm text-muted-foreground">
              Create a bot first to customize its avatar
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Select Bot</Label>
              <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bot" />
                </SelectTrigger>
                <SelectContent>
                  {bots.map(bot => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center p-6 rounded-lg border bg-muted/30">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-3 border-4 border-background shadow-lg">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    <Bot className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">Preview</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Choose from presets</Label>
              <div className="grid grid-cols-4 gap-3">
                {DEFAULT_AVATARS.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setAvatarUrl(url);
                      setCustomUrl(url);
                    }}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      avatarUrl === url 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <Avatar className="w-full h-auto">
                      <AvatarImage src={url} />
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" onClick={generateRandomAvatar} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Random Avatar
            </Button>

            <div className="space-y-2">
              <Label>Or use custom URL</Label>
              <Input
                placeholder="https://example.com/avatar.png"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setAvatarUrl(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter a direct link to an image (PNG, JPG, SVG)
              </p>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Avatar"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
