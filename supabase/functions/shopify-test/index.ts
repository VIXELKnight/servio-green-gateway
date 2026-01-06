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
    const { bot_id } = await req.json();

    if (!bot_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing bot_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Shopify config
    const { data: shopifyConfig, error: configError } = await supabase
      .from("bot_shopify_integrations")
      .select("*")
      .eq("bot_id", bot_id)
      .single();

    if (configError || !shopifyConfig) {
      return new Response(
        JSON.stringify({ success: false, message: "Shopify integration not configured" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test connection by fetching shop info
    const shopResponse = await fetch(
      `https://${shopifyConfig.store_domain}/admin/api/2024-01/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": shopifyConfig.access_token,
          "Content-Type": "application/json",
        },
      }
    );

    if (!shopResponse.ok) {
      const errorText = await shopResponse.text();
      console.error("Shopify API error:", shopResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Connection failed: ${shopResponse.status === 401 ? "Invalid access token" : "Could not connect to store"}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shopData = await shopResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Connected to ${shopData.shop?.name || shopifyConfig.store_domain}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Shopify test error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
