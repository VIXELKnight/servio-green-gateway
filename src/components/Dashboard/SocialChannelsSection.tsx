import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Smartphone, Instagram, Facebook, MessageCircle } from "lucide-react";
import { ChannelConfigDialog } from "./ChannelConfig";

interface ChannelData {
  id: string;
  bot_id: string;
  channel_type: string;
  is_active: boolean;
  config: unknown;
  embed_key: string;
}

interface SocialChannelsSectionProps {
  channels: ChannelData[];
  onUpdate: () => void;
  onToggle: (channelId: string, isActive: boolean) => void;
}

export function SocialChannelsSection({ channels, onUpdate, onToggle }: SocialChannelsSectionProps) {
  const getChannelIcon = (type: string) => {
    switch (type) {
      case "whatsapp": return Smartphone;
      case "instagram": return Instagram;
      case "facebook": return Facebook;
      default: return MessageCircle;
    }
  };

  const getChannelName = (type: string) => {
    switch (type) {
      case "whatsapp": return "WhatsApp";
      case "instagram": return "Instagram";
      case "facebook": return "Facebook Messenger";
      default: return type;
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case "whatsapp": return "bg-green-500/10 text-green-600";
      case "instagram": return "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 text-pink-600";
      case "facebook": return "bg-blue-500/10 text-blue-600";
      default: return "bg-primary/10 text-primary";
    }
  };

  if (channels.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Social Channels</h3>
          <p className="text-muted-foreground text-sm">
            Social channels will appear here once configured
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Media Channels</CardTitle>
          <CardDescription>
            Connect your social media accounts to respond to messages automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((channel) => {
            const Icon = getChannelIcon(channel.channel_type);
            const colorClass = getChannelColor(channel.channel_type);
            
            return (
              <div key={channel.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{getChannelName(channel.channel_type)}</p>
                      <Badge 
                        variant={channel.is_active ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {channel.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={channel.is_active}
                    onCheckedChange={(checked) => onToggle(channel.id, checked)}
                  />
                </div>
                
                <ChannelConfigDialog 
                  channel={channel} 
                  onUpdate={onUpdate} 
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Pro Tip</h4>
              <p className="text-xs text-muted-foreground">
                Connect all your social channels to provide seamless support across platforms. 
                Your AI bot will automatically respond to messages on WhatsApp, Instagram DMs, and Facebook Messenger.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
