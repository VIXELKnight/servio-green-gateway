import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Smartphone, Instagram, CheckCircle, AlertCircle, Loader2, Unlink, Clock, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ChannelConfigProps {
  channel: {
    id: string;
    channel_type: string;
    config: unknown;
    is_active: boolean;
  };
  onUpdate: () => void;
}

interface ChannelConfig {
  connected?: boolean;
  page_name?: string;
  instagram_username?: string;
  display_phone_number?: string;
  verified_name?: string;
  business_name?: string;
  token_expires_at?: string;
}

// Helper to check if token is expiring soon (within 7 days)
function isTokenExpiringSoon(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return expiry < sevenDaysFromNow;
}

// Format relative time
function formatExpiry(expiresAt?: string): string {
  if (!expiresAt) return "";
  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "Expired";
  if (daysLeft === 0) return "Expires today";
  if (daysLeft === 1) return "Expires tomorrow";
  return `Expires in ${daysLeft} days`;
}

export function ChannelConfigDialog({ channel, onUpdate }: ChannelConfigProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const config = (channel.config as ChannelConfig) || {};
  const isConnected = config.connected === true;
  const tokenExpiringSoon = isTokenExpiringSoon(config.token_expires_at);
  const expiryText = formatExpiry(config.token_expires_at);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to connect your account");
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/meta-oauth-start`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel_id: channel.id,
          channel_type: channel.channel_type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start OAuth");
      }

      // Redirect to Meta OAuth
      window.location.href = data.auth_url;
    } catch (error) {
      console.error("OAuth start error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start connection");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      // Re-authenticate to refresh the token
      await handleConnect();
    } catch (error) {
      console.error("Token refresh error:", error);
      toast.error("Failed to refresh token. Please reconnect your account.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in");
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/meta-disconnect`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel_id: channel.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect");
      }

      toast.success("Account disconnected");
      onUpdate();
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectDialog(false);
    }
  };

  // Token status component
  const TokenStatus = () => {
    if (!config.token_expires_at) return null;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${tokenExpiringSoon ? 'text-amber-500' : 'text-muted-foreground'}`}>
        <Clock className="w-3 h-3" />
        <span>{expiryText}</span>
        {tokenExpiringSoon && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-xs"
            onClick={handleRefreshToken}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    );
  };

  if (channel.channel_type === "whatsapp") {
    return (
      <>
        <div className="space-y-3">
          {isConnected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">Connected</span>
              </div>
              {config.display_phone_number && (
                <p className="text-xs text-muted-foreground">
                  📱 {config.display_phone_number}
                  {config.verified_name && ` (${config.verified_name})`}
                </p>
              )}
              {config.business_name && (
                <p className="text-xs text-muted-foreground">
                  🏢 {config.business_name}
                </p>
              )}
              <TokenStatus />
              <Button 
                variant="outline" 
                size="sm"
                className="w-full mt-2 text-destructive hover:text-destructive"
                onClick={() => setShowDisconnectDialog(true)}
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Not connected</span>
              </div>
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Smartphone className="w-4 h-4 mr-2" />
                )}
                Connect WhatsApp
              </Button>
              <p className="text-xs text-muted-foreground">
                Connect your WhatsApp Business account with one click
              </p>
            </div>
          )}
        </div>

        <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect WhatsApp?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop your bot from responding to WhatsApp messages. You can reconnect anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (channel.channel_type === "instagram") {
    return (
      <>
        <div className="space-y-3">
          {isConnected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">Connected</span>
              </div>
              {config.instagram_username && (
                <p className="text-xs text-muted-foreground">
                  📸 @{config.instagram_username}
                </p>
              )}
              {config.page_name && (
                <p className="text-xs text-muted-foreground">
                  📄 {config.page_name}
                </p>
              )}
              <TokenStatus />
              <Button 
                variant="outline" 
                size="sm"
                className="w-full mt-2 text-destructive hover:text-destructive"
                onClick={() => setShowDisconnectDialog(true)}
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Not connected</span>
              </div>
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Instagram className="w-4 h-4 mr-2" />
                )}
                Connect Instagram
              </Button>
              <p className="text-xs text-muted-foreground">
                Connect your Instagram Business account with one click
              </p>
            </div>
          )}
        </div>

        <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Instagram?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop your bot from responding to Instagram DMs. You can reconnect anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return null;
}
