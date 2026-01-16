import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify the user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    const { channel_id, channel_type } = await req.json();

    if (!channel_id || !channel_type) {
      return new Response(
        JSON.stringify({ error: "Missing channel_id or channel_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns the channel
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: channel, error: channelError } = await supabase
      .from("bot_channels")
      .select("*, bots!inner(user_id)")
      .eq("id", channel_id)
      .single();

    if (channelError || !channel || channel.bots.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Channel not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metaAppId = Deno.env.get("META_APP_ID");
    const redirectUri = `${supabaseUrl}/functions/v1/meta-oauth-callback`;

    if (!metaAppId) {
      return new Response(
        JSON.stringify({ error: "Meta App ID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure state parameter
    const state = crypto.randomUUID();
    const stateData = JSON.stringify({ channel_id, channel_type, user_id: userId });
    const encodedState = btoa(stateData) + "." + state;

    // Store state in database with expiry
    await supabase
      .from("bot_channels")
      .update({ 
        oauth_state: encodedState,
        oauth_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min expiry
      })
      .eq("id", channel_id);

    // Build OAuth URL based on channel type
    let scopes: string;
    
    if (channel_type === "instagram") {
      // Instagram Business requires these scopes
      scopes = [
        "instagram_basic",
        "instagram_manage_messages", 
        "pages_show_list",
        "pages_messaging",
        "pages_read_engagement"
      ].join(",");
    } else if (channel_type === "whatsapp") {
      // WhatsApp Business requires these scopes
      scopes = [
        "whatsapp_business_management",
        "whatsapp_business_messaging",
        "business_management"
      ].join(",");
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid channel type for OAuth" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    authUrl.searchParams.set("client_id", metaAppId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", encodedState);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("response_type", "code");

    return new Response(
      JSON.stringify({ auth_url: authUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Meta OAuth start error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
