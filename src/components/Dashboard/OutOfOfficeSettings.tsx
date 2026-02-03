import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Save, Moon } from "lucide-react";
import { toast } from "sonner";

interface Bot {
  id: string;
  name: string;
  out_of_office_enabled: boolean;
  out_of_office_message: string;
}

export function OutOfOfficeSettings() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBots();
  }, []);

  useEffect(() => {
    const bot = bots.find(b => b.id === selectedBotId);
    if (bot) {
      setIsEnabled(bot.out_of_office_enabled);
      setMessage(bot.out_of_office_message || "Thanks for reaching out! We're currently away but will respond as soon as possible.");
    }
  }, [selectedBotId, bots]);

  async function fetchBots() {
    try {
      const { data, error } = await supabase
        .from("bots")
        .select("id, name, out_of_office_enabled, out_of_office_message");

      if (error) throw error;

      // Cast to handle new columns that might not be in types yet
      const botsData = (data || []).map(bot => ({
        id: bot.id,
        name: bot.name,
        out_of_office_enabled: (bot as any).out_of_office_enabled ?? false,
        out_of_office_message: (bot as any).out_of_office_message ?? "",
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
        .update({
          out_of_office_enabled: isEnabled,
          out_of_office_message: message,
        } as any)
        .eq("id", selectedBotId);

      if (error) throw error;

      toast.success("Out-of-office settings saved");
      
      // Update local state
      setBots(prev => prev.map(bot => 
        bot.id === selectedBotId 
          ? { ...bot, out_of_office_enabled: isEnabled, out_of_office_message: message }
          : bot
      ));
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  const presetMessages = [
    "Thanks for reaching out! We're currently away but will respond as soon as possible.",
    "Hello! Our team is currently offline. We'll get back to you within 24 hours.",
    "Hi there! We're outside of business hours right now. Leave us a message and we'll respond first thing in the morning.",
    "Thank you for your message! Our support team will respond during business hours (9 AM - 5 PM EST).",
  ];

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
            <Moon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Out-of-Office Auto-Reply</CardTitle>
            <CardDescription>
              Automatically respond when you're away
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {bots.length === 0 ? (
          <div className="text-center py-8">
            <Moon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No bots available</p>
            <p className="text-sm text-muted-foreground">
              Create a bot first to configure out-of-office replies
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

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Enable Out-of-Office</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send this message to new conversations
                </p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            <div className="space-y-3">
              <Label>Auto-Reply Message</Label>
              <Textarea
                placeholder="Enter your out-of-office message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick presets:</p>
                <div className="flex flex-wrap gap-2">
                  {presetMessages.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1 px-2"
                      onClick={() => setMessage(preset)}
                    >
                      Preset {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
