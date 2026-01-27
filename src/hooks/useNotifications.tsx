import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "new_conversation" | "escalation" | "message";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  conversationId?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const processedIds = useRef(new Set<string>());
  const lastSyncTimestamp = useRef<string | null>(null);
  const pollIntervalRef = useRef(5000);

  const addNotification = useCallback((notification: Notification) => {
    if (processedIds.current.has(notification.id)) return;
    
    processedIds.current.add(notification.id);
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    toast(notification.title, {
      description: notification.description,
      duration: 5000,
    });
    
    // Update last sync timestamp
    if (notification.createdAt > (lastSyncTimestamp.current || "")) {
      lastSyncTimestamp.current = notification.createdAt;
    }
    
    // Reset poll interval on new data
    pollIntervalRef.current = 5000;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Get user's bot IDs for filtering
    const setupSubscriptions = async () => {
      const { data: bots } = await supabase
        .from("bots")
        .select("id")
        .eq("user_id", user.id);

      const botIds = bots?.map(b => b.id) || [];
      if (botIds.length === 0) return;

      // Subscribe to new conversations
      const conversationsChannel = supabase
        .channel(`conversations-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bot_conversations",
          },
          (payload) => {
            const newConvo = payload.new as { id: string; bot_id: string; visitor_name?: string; created_at: string };
            if (botIds.includes(newConvo.bot_id)) {
              addNotification({
                id: `conv-${newConvo.id}`,
                type: "new_conversation",
                title: "New Conversation",
                description: `${newConvo.visitor_name || "A visitor"} started a new conversation`,
                createdAt: newConvo.created_at,
                read: false,
                conversationId: newConvo.id,
              });
            }
          }
        )
        .subscribe();

      // Subscribe to escalations
      const escalationsChannel = supabase
        .channel(`escalations-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bot_conversations",
          },
          (payload) => {
            const updated = payload.new as { id: string; bot_id: string; status: string; escalation_reason?: string; visitor_name?: string; updated_at: string };
            const old = payload.old as { status: string };
            
            if (botIds.includes(updated.bot_id) && updated.status === "escalated" && old.status !== "escalated") {
              addNotification({
                id: `esc-${updated.id}-${Date.now()}`,
                type: "escalation",
                title: "🚨 Ticket Escalated",
                description: updated.escalation_reason || `${updated.visitor_name || "A conversation"} needs human attention`,
                createdAt: updated.updated_at,
                read: false,
                conversationId: updated.id,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationsChannel);
        supabase.removeChannel(escalationsChannel);
      };
    };

    const cleanup = setupSubscriptions();

    // Fallback polling with exponential backoff
    const poll = async () => {
      try {
        const { data: bots } = await supabase
          .from("bots")
          .select("id")
          .eq("user_id", user.id);

        const botIds = bots?.map(b => b.id) || [];
        if (botIds.length === 0) return;

        const since = lastSyncTimestamp.current || new Date(Date.now() - 60000).toISOString();

        // Check for new escalations
        const { data: escalated } = await supabase
          .from("bot_conversations")
          .select("*")
          .in("bot_id", botIds)
          .eq("status", "escalated")
          .gt("updated_at", since)
          .order("updated_at", { ascending: false })
          .limit(5);

        if (escalated && escalated.length > 0) {
          escalated.forEach(conv => {
            addNotification({
              id: `esc-poll-${conv.id}`,
              type: "escalation",
              title: "🚨 Ticket Escalated",
              description: conv.escalation_reason || `${conv.visitor_name || "A conversation"} needs human attention`,
              createdAt: conv.updated_at,
              read: false,
              conversationId: conv.id,
            });
          });
        } else {
          // Exponential backoff when no new data
          pollIntervalRef.current = Math.min(pollIntervalRef.current * 1.5, 30000);
        }
      } catch (error) {
        console.error("Polling error:", error);
        pollIntervalRef.current = Math.min(pollIntervalRef.current * 1.5, 30000);
      }
    };

    const pollTimeout = setInterval(poll, pollIntervalRef.current);

    return () => {
      cleanup.then(fn => fn?.());
      clearInterval(pollTimeout);
    };
  }, [user, addNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};
