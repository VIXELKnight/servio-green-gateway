import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiSlack } from "@icons-pack/react-simple-icons";

interface NotificationPrefs {
  email_new_ticket: boolean;
  email_escalation: boolean;
  email_weekly_report: boolean;
  slack_webhook_url: string;
  slack_escalation: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_new_ticket: true,
    email_escalation: true,
    email_weekly_report: false,
    slack_webhook_url: "",
    slack_escalation: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPreferences();
  }, [user]);

  async function fetchPreferences() {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPrefs({
          email_new_ticket: data.email_new_ticket ?? true,
          email_escalation: data.email_escalation ?? true,
          email_weekly_report: data.email_weekly_report ?? false,
          slack_webhook_url: data.slack_webhook_url ?? "",
          slack_escalation: data.slack_escalation ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function savePreferences() {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Notification preferences saved");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  }

  const handleToggle = (key: keyof NotificationPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
            <CardDescription>Configure how you receive alerts</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Email Notifications
          </div>

          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">New ticket alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when new support tickets are created
                </p>
              </div>
              <Switch
                checked={prefs.email_new_ticket}
                onCheckedChange={() => handleToggle("email_new_ticket")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Escalation alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when conversations are escalated to humans
                </p>
              </div>
              <Switch
                checked={prefs.email_escalation}
                onCheckedChange={() => handleToggle("email_escalation")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Weekly reports</p>
                <p className="text-xs text-muted-foreground">
                  Receive weekly performance summaries
                </p>
              </div>
              <Switch
                checked={prefs.email_weekly_report}
                onCheckedChange={() => handleToggle("email_weekly_report")}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Slack Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SiSlack className="w-4 h-4 text-muted-foreground" />
            Slack Integration
          </div>

          <div className="space-y-3 pl-6">
            <div className="space-y-2">
              <Label htmlFor="slack-webhook" className="text-sm">
                Webhook URL
              </Label>
              <Input
                id="slack-webhook"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={prefs.slack_webhook_url}
                onChange={(e) => setPrefs(prev => ({ ...prev, slack_webhook_url: e.target.value }))}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Create an incoming webhook in your Slack workspace settings
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Escalation alerts</p>
                <p className="text-xs text-muted-foreground">
                  Send Slack messages when conversations need human attention
                </p>
              </div>
              <Switch
                checked={prefs.slack_escalation}
                onCheckedChange={() => handleToggle("slack_escalation")}
                disabled={!prefs.slack_webhook_url}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={savePreferences} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
