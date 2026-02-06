import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "anonymous";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { embed_key } = await req.json();

    if (!embed_key) {
      return new Response(JSON.stringify({ error: "Missing embed_key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limit by IP (20/min)
    const clientIP = getClientIP(req);
    try {
      const { data } = await supabase.rpc("check_rate_limit", {
        p_identifier: clientIP, p_endpoint: "bot-init", p_max_requests: 20, p_window_minutes: 1,
      });
      if (data?.[0] && !data[0].allowed) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } });
      }
    } catch (e) { console.warn("[BOT-INIT] Rate limit check failed:", e); }

    // Get channel and bot info
    const { data: channel, error: channelError } = await supabase
      .from("bot_channels")
      .select("*, bots(id, name, welcome_message, is_active, avatar_url)")
      .eq("embed_key", embed_key)
      .eq("is_active", true)
      .single();

    if (channelError || !channel) {
      return new Response(JSON.stringify({ error: "Bot not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bot = channel.bots;
    if (!bot || !bot.is_active) {
      return new Response(JSON.stringify({ error: "Bot is inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      bot_name: bot.name,
      welcome_message: bot.welcome_message || "Hello! How can I help you today?",
      channel_type: channel.channel_type,
      avatar_url: bot.avatar_url || null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[BOT-INIT] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
