import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DashboardStats {
  emailsProcessed: number;
  avgResponseTime: number;
  satisfactionRate: number;
  activeTickets: number;
  totalTickets: number;
  resolvedTickets: number;
}

interface ActivityItem {
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    emailsProcessed: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
    activeTickets: 0,
    totalTickets: 0,
    resolvedTickets: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch or create dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .from("dashboard_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (statsError) throw statsError;

      if (statsData) {
        setStats({
          emailsProcessed: statsData.emails_processed,
          avgResponseTime: Number(statsData.avg_response_time_minutes),
          satisfactionRate: Number(statsData.satisfaction_rate),
          activeTickets: statsData.total_tickets - statsData.resolved_tickets,
          totalTickets: statsData.total_tickets,
          resolvedTickets: statsData.resolved_tickets,
        });
      } else {
        // Initialize stats for new user
        const { error: insertError } = await supabase
          .from("dashboard_stats")
          .insert({
            user_id: user.id,
            emails_processed: 0,
            avg_response_time_minutes: 0,
            satisfaction_rate: 0,
            total_tickets: 0,
            resolved_tickets: 0,
          });
        
        if (insertError) console.error("Error creating stats:", insertError);
      }

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      if (activityData) {
        setActivities(
          activityData.map((a) => ({
            id: a.id,
            activityType: a.activity_type,
            title: a.title,
            description: a.description,
            createdAt: a.created_at,
          }))
        );
      }

      // Fetch tickets
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (ticketError) throw ticketError;

      if (ticketData) {
        setTickets(
          ticketData.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            createdAt: t.created_at,
            resolvedAt: t.resolved_at,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async (title: string, description: string, priority: string = "medium") => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          title,
          description,
          priority,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity("ticket_created", "New ticket created", title);

      // Refresh data
      await fetchDashboardData();

      return data;
    } catch (error) {
      console.error("Error creating ticket:", error);
      return null;
    }
  };

  const updateTicket = async (ticketId: string, updates: { status?: string; priority?: string; title?: string; description?: string }) => {
    if (!user) return false;

    try {
      const updateData: Record<string, unknown> = { ...updates };
      
      // If resolving, set resolved_at
      if (updates.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      } else if (updates.status && updates.status !== 'resolved') {
        updateData.resolved_at = null;
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", ticketId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Log activity
      if (updates.status) {
        await logActivity("ticket_updated", `Ticket status changed to ${updates.status}`, ticketId);
      }

      await fetchDashboardData();
      return true;
    } catch (error) {
      console.error("Error updating ticket:", error);
      return false;
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", ticketId)
        .eq("user_id", user.id);

      if (error) throw error;

      await logActivity("ticket_deleted", "Ticket deleted", ticketId);
      await fetchDashboardData();
      return true;
    } catch (error) {
      console.error("Error deleting ticket:", error);
      return false;
    }
  };

  const logActivity = async (type: string, title: string, description?: string) => {
    if (!user) return;

    try {
      await supabase.from("activity_log").insert({
        user_id: user.id,
        activity_type: type,
        title,
        description,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const updateStats = async (updates: Partial<{
    emails_processed: number;
    avg_response_time_minutes: number;
    satisfaction_rate: number;
    total_tickets: number;
    resolved_tickets: number;
  }>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("dashboard_stats")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchDashboardData();
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchDashboardData();

    // Subscribe to realtime updates
    const activityChannel = supabase
      .channel("activity-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const ticketChannel = supabase
      .channel("ticket-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, [user]);

  return {
    stats,
    activities,
    tickets,
    isLoading,
    createTicket,
    updateTicket,
    deleteTicket,
    logActivity,
    updateStats,
    refreshData: fetchDashboardData,
  };
};
