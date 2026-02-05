import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Upload, Save, Sparkles, Clock, Palette } from "lucide-react";
import { toast } from "sonner";

interface BotCustomizationProps {
  botId: string;
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

interface BotData {
  id: string;
  name: string;
  avatar_url: string | null;
  out_of_office_enabled: boolean;
  out_of_office_message: string | null;
}

export function BotCustomization({ botId }: BotCustomizationProps) {
  const [bot, setBot] = useState<BotData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [customUrl, setCustomUrl] = useState<string>("");
  const [outOfOfficeEnabled, setOutOfOfficeEnabled] = useState(false);
  const [outOfOfficeMessage, setOutOfOfficeMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBot();
  }, [botId]);

  async function fetchBot() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bots")
        .select("id, name, avatar_url, out_of_office_enabled, out_of_office_message")
        .eq("id", botId)
        .single();

      if (error) throw error;

      setBot(data);
      setAvatarUrl(data.avatar_url || "");
      setCustomUrl(data.avatar_url || "");
      setOutOfOfficeEnabled(data.out_of_office_enabled || false);
      setOutOfOfficeMessage(data.out_of_office_message || "Thanks for reaching out! We're currently away but will respond as soon as possible.");
    } catch (error) {
      console.error("Error fetching bot:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!bot) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("bots")
        .update({ 
          avatar_url: avatarUrl || null,
          out_of_office_enabled: outOfOfficeEnabled,
          out_of_office_message: outOfOfficeMessage
        })
        .eq("id", botId);

      if (error) throw error;

      toast.success("Bot customization saved");
      setBot({ 
        ...bot, 
        avatar_url: avatarUrl, 
        out_of_office_enabled: outOfOfficeEnabled,
        out_of_office_message: outOfOfficeMessage
      });
    } catch (error) {
      console.error("Error saving bot:", error);
      toast.error("Failed to save changes");
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
    <div className="space-y-6">
      {/* Avatar Customization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="w-5 h-5 text-primary" />
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
        </CardContent>
      </Card>

      {/* Out of Office Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Out of Office</CardTitle>
              <CardDescription>
                Set an auto-reply when you're away
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Out of Office</p>
              <p className="text-sm text-muted-foreground">
                Send automatic replies when unavailable
              </p>
            </div>
            <Switch
              checked={outOfOfficeEnabled}
              onCheckedChange={setOutOfOfficeEnabled}
            />
          </div>

          {outOfOfficeEnabled && (
            <div className="space-y-2">
              <Label>Auto-Reply Message</Label>
              <Textarea
                value={outOfOfficeMessage}
                onChange={(e) => setOutOfOfficeMessage(e.target.value)}
                placeholder="Thanks for reaching out! We're currently away..."
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? "Saving..." : "Save Customization"}
      </Button>
    </div>
  );
}
