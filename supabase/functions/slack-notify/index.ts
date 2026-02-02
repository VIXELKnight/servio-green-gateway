import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SlackNotifyRequest {
  type: "escalation" | "ticket" | "custom";
  title: string;
  message: string;
  conversation_id?: string;
  ticket_id?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, title, message, conversation_id, ticket_id, priority, user_id }: SlackNotifyRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's notification preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("slack_webhook_url, slack_escalation")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!prefs?.slack_webhook_url) {
      return new Response(
        JSON.stringify({ error: "Slack webhook not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user wants this type of notification
    if (type === "escalation" && !prefs.slack_escalation) {
      return new Response(
        JSON.stringify({ message: "Slack escalation notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Slack message
    const priorityEmoji: Record<string, string> = {
      low: "🟢",
      medium: "🟡",
      high: "🟠",
      urgent: "🔴",
    };

    const typeEmoji: Record<string, string> = {
      escalation: "⚠️",
      ticket: "🎫",
      custom: "📢",
    };

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${typeEmoji[type] || "📢"} ${title}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
    ];

    if (priority) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `${priorityEmoji[priority] || ""} Priority: *${priority.toUpperCase()}*`,
          },
        ],
      } as any);
    }

    if (conversation_id || ticket_id) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `ID: \`${conversation_id || ticket_id}\``,
          },
        ],
      } as any);
    }

    // Send to Slack
    const slackResponse = await fetch(prefs.slack_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    if (!slackResponse.ok) {
      const error = await slackResponse.text();
      console.error("Slack webhook error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send Slack notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Slack notify error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
