import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Bot,
  CheckCircle
} from "lucide-react";

interface BotMetrics {
  botId: string;
  botName: string;
  totalMessages: number;
  totalConversations: number;
  escalatedConversations: number;
  resolvedConversations: number;
  avgMessagesPerConversation: number;
}

export function BotUsageMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BotMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({
    messages: 0,
    conversations: 0,
    escalated: 0,
    resolved: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetchMetrics();
  }, [user]);

  async function fetchMetrics() {
    try {
      // Get all bots for this user
      const { data: bots } = await supabase
        .from("bots")
        .select("id, name")
        .eq("user_id", user!.id);

      if (!bots || bots.length === 0) {
        setIsLoading(false);
        return;
      }

      const botMetrics: BotMetrics[] = [];
      let totalMessages = 0;
      let totalConversations = 0;
      let totalEscalated = 0;
      let totalResolved = 0;

      for (const bot of bots) {
        // Get conversations for this bot
        const { data: conversations, count: convCount } = await supabase
          .from("bot_conversations")
          .select("id, status", { count: "exact" })
          .eq("bot_id", bot.id);

        const conversationIds = conversations?.map(c => c.id) || [];
        const escalated = conversations?.filter(c => c.status === "escalated").length || 0;
        const resolved = conversations?.filter(c => c.status === "resolved").length || 0;

        // Get message count
        let messageCount = 0;
        if (conversationIds.length > 0) {
          const { count } = await supabase
            .from("bot_messages")
            .select("id", { count: "exact", head: true })
            .in("conversation_id", conversationIds);
          messageCount = count || 0;
        }

        botMetrics.push({
          botId: bot.id,
          botName: bot.name,
          totalMessages: messageCount,
          totalConversations: convCount || 0,
          escalatedConversations: escalated,
          resolvedConversations: resolved,
          avgMessagesPerConversation: conversationIds.length > 0 
            ? Math.round(messageCount / conversationIds.length) 
            : 0,
        });

        totalMessages += messageCount;
        totalConversations += convCount || 0;
        totalEscalated += escalated;
        totalResolved += resolved;
      }

      setMetrics(botMetrics);
      setTotals({
        messages: totalMessages,
        conversations: totalConversations,
        escalated: totalEscalated,
        resolved: totalResolved,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const escalationRate = totals.conversations > 0 
    ? Math.round((totals.escalated / totals.conversations) * 100) 
    : 0;

  const resolutionRate = totals.conversations > 0 
    ? Math.round((totals.resolved / totals.conversations) * 100) 
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bot Usage Metrics</CardTitle>
          <CardDescription>Performance overview of your AI bots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
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
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Bot Usage Metrics</CardTitle>
            <CardDescription>Performance overview of your AI bots</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">Messages</span>
            </div>
            <p className="text-2xl font-bold">{totals.messages.toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Conversations</span>
            </div>
            <p className="text-2xl font-bold">{totals.conversations.toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">Escalation Rate</span>
            </div>
            <p className="text-2xl font-bold">{escalationRate}%</p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">Resolution Rate</span>
            </div>
            <p className="text-2xl font-bold">{resolutionRate}%</p>
          </div>
        </div>

        {/* Per-Bot Breakdown */}
        {metrics.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">By Bot</h4>
            {metrics.map((bot) => (
              <div
                key={bot.botId}
                className="p-4 rounded-lg border bg-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="font-medium">{bot.botName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {bot.totalConversations} chats
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {bot.totalMessages} msgs
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Avg/Chat</p>
                    <p className="font-semibold">{bot.avgMessagesPerConversation}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Escalated</p>
                    <p className="font-semibold text-amber-600">{bot.escalatedConversations}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Resolved</p>
                    <p className="font-semibold text-emerald-600">{bot.resolvedConversations}</p>
                  </div>
                </div>

                {bot.totalConversations > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Resolution Progress</span>
                      <span className="font-medium">
                        {Math.round((bot.resolvedConversations / bot.totalConversations) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(bot.resolvedConversations / bot.totalConversations) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {metrics.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No bot activity yet</p>
            <p className="text-sm text-muted-foreground">
              Metrics will appear here once your bots start receiving messages
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
