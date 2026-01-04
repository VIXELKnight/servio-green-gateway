import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Smartphone, Instagram, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

interface ChannelConfigProps {
  channel: {
    id: string;
    channel_type: string;
    config: unknown;
    is_active: boolean;
  };
  onUpdate: () => void;
}

interface WhatsAppConfig {
  phone_number_id?: string;
  access_token?: string;
  business_account_id?: string;
  webhook_verify_token?: string;
  connected?: boolean;
}

interface InstagramConfig {
  instagram_account_id?: string;
  access_token?: string;
  page_id?: string;
  connected?: boolean;
}

export function ChannelConfigDialog({ channel, onUpdate }: ChannelConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // WhatsApp config
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>(
    (channel.config as WhatsAppConfig) || {}
  );

  // Instagram config
  const [instagramConfig, setInstagramConfig] = useState<InstagramConfig>(
    (channel.config as InstagramConfig) || {}
  );

  const handleSaveWhatsApp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("bot_channels")
        .update({
          config: {
            ...whatsappConfig,
            connected: !!(whatsappConfig.phone_number_id && whatsappConfig.access_token)
          }
        })
        .eq("id", channel.id);

      if (error) throw error;
      toast.success("WhatsApp configuration saved!");
      onUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInstagram = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("bot_channels")
        .update({
          config: {
            ...instagramConfig,
            connected: !!(instagramConfig.instagram_account_id && instagramConfig.access_token)
          }
        })
        .eq("id", channel.id);

      if (error) throw error;
      toast.success("Instagram configuration saved!");
      onUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const isWhatsAppConnected = (channel.config as WhatsAppConfig)?.connected;
  const isInstagramConnected = (channel.config as InstagramConfig)?.connected;

  if (channel.channel_type === "whatsapp") {
    return (
      <>
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            {isWhatsAppConnected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
            <span>{isWhatsAppConnected ? "Connected" : "Not configured"}</span>
          </div>
          <Button 
            variant="link" 
            className="p-0 h-auto text-xs text-primary"
            onClick={() => setIsOpen(true)}
          >
            <Smartphone className="w-3 h-3 mr-1" />
            Configure WhatsApp →
          </Button>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-500" />
                WhatsApp Business API Setup
              </DialogTitle>
              <DialogDescription>
                Connect your WhatsApp Business account to enable automated responses.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Prerequisites:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Meta Business Account</li>
                  <li>• WhatsApp Business Platform access</li>
                  <li>• Verified phone number</li>
                </ul>
                <a 
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View setup guide
                </a>
              </div>

              <div>
                <Label htmlFor="wa-phone-id">Phone Number ID</Label>
                <Input
                  id="wa-phone-id"
                  value={whatsappConfig.phone_number_id || ""}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phone_number_id: e.target.value })}
                  placeholder="e.g., 123456789012345"
                />
              </div>

              <div>
                <Label htmlFor="wa-business-id">Business Account ID</Label>
                <Input
                  id="wa-business-id"
                  value={whatsappConfig.business_account_id || ""}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, business_account_id: e.target.value })}
                  placeholder="e.g., 123456789012345"
                />
              </div>

              <div>
                <Label htmlFor="wa-token">Access Token</Label>
                <Input
                  id="wa-token"
                  type="password"
                  value={whatsappConfig.access_token || ""}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, access_token: e.target.value })}
                  placeholder="Your permanent access token"
                />
              </div>

              <div>
                <Label htmlFor="wa-verify">Webhook Verify Token</Label>
                <Input
                  id="wa-verify"
                  value={whatsappConfig.webhook_verify_token || "servio_webhook_" + channel.id.slice(0, 8)}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, webhook_verify_token: e.target.value })}
                  placeholder="Custom verification token"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use this token when configuring your webhook in Meta Developer Console
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveWhatsApp} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (channel.channel_type === "instagram") {
    return (
      <>
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            {isInstagramConnected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
            <span>{isInstagramConnected ? "Connected" : "Not configured"}</span>
          </div>
          <Button 
            variant="link" 
            className="p-0 h-auto text-xs text-primary"
            onClick={() => setIsOpen(true)}
          >
            <Instagram className="w-3 h-3 mr-1" />
            Configure Instagram →
          </Button>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-500" />
                Instagram Messaging API Setup
              </DialogTitle>
              <DialogDescription>
                Connect your Instagram Professional account to enable automated DM responses.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Prerequisites:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Instagram Professional/Business Account</li>
                  <li>• Connected Facebook Page</li>
                  <li>• Meta Developer App with Instagram API access</li>
                </ul>
                <a 
                  href="https://developers.facebook.com/docs/instagram-api/getting-started" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View setup guide
                </a>
              </div>

              <div>
                <Label htmlFor="ig-account-id">Instagram Account ID</Label>
                <Input
                  id="ig-account-id"
                  value={instagramConfig.instagram_account_id || ""}
                  onChange={(e) => setInstagramConfig({ ...instagramConfig, instagram_account_id: e.target.value })}
                  placeholder="e.g., 17841400000000000"
                />
              </div>

              <div>
                <Label htmlFor="ig-page-id">Facebook Page ID</Label>
                <Input
                  id="ig-page-id"
                  value={instagramConfig.page_id || ""}
                  onChange={(e) => setInstagramConfig({ ...instagramConfig, page_id: e.target.value })}
                  placeholder="e.g., 123456789012345"
                />
              </div>

              <div>
                <Label htmlFor="ig-token">Access Token</Label>
                <Input
                  id="ig-token"
                  type="password"
                  value={instagramConfig.access_token || ""}
                  onChange={(e) => setInstagramConfig({ ...instagramConfig, access_token: e.target.value })}
                  placeholder="Your page access token"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a long-lived page access token with instagram_manage_messages permission
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveInstagram} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
