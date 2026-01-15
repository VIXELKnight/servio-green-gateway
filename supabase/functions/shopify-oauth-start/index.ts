import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shopifyApiKey = Deno.env.get("SHOPIFY_API_KEY");
    if (!shopifyApiKey) throw new Error("SHOPIFY_API_KEY not configured");

    // Get bot_id from request
    const { bot_id, shop_domain } = await req.json();
    if (!bot_id || !shop_domain) {
      throw new Error("bot_id and shop_domain are required");
    }

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    // Verify bot belongs to user
    const { data: bot, error: botError } = await supabaseClient
      .from("bots")
      .select("id")
      .eq("id", bot_id)
      .eq("user_id", userData.user.id)
      .single();

    if (botError || !bot) throw new Error("Bot not found or not owned by user");

    // Clean shop domain (remove protocol if present)
    const cleanDomain = shop_domain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    // Generate state for CSRF protection (encode bot_id and user_id)
    const state = btoa(JSON.stringify({
      bot_id,
      user_id: userData.user.id,
      timestamp: Date.now(),
    }));

    // Define scopes for Shopify (full catalog as requested)
    const scopes = [
      "read_orders",
      "read_customers",
      "read_products",
      "read_inventory",
      "read_fulfillments",
      "read_shipping",
    ].join(",");

    const origin = req.headers.get("origin") || "https://servio-green.lovable.app";
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/shopify-oauth-callback`;

    // Build Shopify OAuth URL
    const authUrl = new URL(`https://${cleanDomain}/admin/oauth/authorize`);
    authUrl.searchParams.set("client_id", shopifyApiKey);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);

    console.log("[SHOPIFY-OAUTH-START] Redirecting to:", authUrl.toString());

    return new Response(
      JSON.stringify({ authorization_url: authUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SHOPIFY-OAUTH-START] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
