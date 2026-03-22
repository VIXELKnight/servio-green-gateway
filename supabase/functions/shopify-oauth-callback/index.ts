import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const shop = url.searchParams.get("shop");

    console.log("[SHOPIFY-OAUTH-CALLBACK] Received callback for shop:", shop);

    if (!code || !state || !shop) {
      return new Response(
        `<html><body><h1>Error</h1><p>Missing required parameters</p></body></html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }

    // Decode and validate state
    let stateData: { bot_id: string; user_id: string; timestamp: number };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(
        `<html><body><h1>Error</h1><p>Invalid state parameter</p></body></html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }

    // Verify state against server-stored value
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: storedState } = await supabaseClient
      .from("bot_shopify_integrations")
      .select("pending_oauth_state, state_expires_at")
      .eq("bot_id", stateData.bot_id)
      .single();

    if (!storedState || storedState.pending_oauth_state !== state) {
      return new Response(
        `<html><body><h1>Error</h1><p>Invalid state - possible CSRF attack</p></body></html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }

    if (storedState.state_expires_at && new Date(storedState.state_expires_at) < new Date()) {
      return new Response(
        `<html><body><h1>Error</h1><p>Authorization expired. Please try again.</p></body></html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }

    const shopifyApiKey = Deno.env.get("SHOPIFY_API_KEY");
    const shopifyApiSecret = Deno.env.get("SHOPIFY_API_SECRET");

    if (!shopifyApiKey || !shopifyApiSecret) {
      throw new Error("Shopify credentials not configured");
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: shopifyApiKey,
        client_secret: shopifyApiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[SHOPIFY-OAUTH-CALLBACK] Token exchange failed:", errorText);
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log("[SHOPIFY-OAUTH-CALLBACK] Token exchange successful");

    // Update the integration with the real access token and clear OAuth state
    const { error: updateError } = await supabaseClient
      .from("bot_shopify_integrations")
      .update({
        store_domain: shop,
        access_token: accessToken,
        is_active: true,
        pending_oauth_state: null,
        state_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("bot_id", stateData.bot_id);

    console.log("[SHOPIFY-OAUTH-CALLBACK] Integration saved successfully");

    // Redirect back to dashboard with success message
    const redirectUrl = `https://servio-green.lovable.app/dashboard?shopify=connected`;

    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SHOPIFY-OAUTH-CALLBACK] Error:", errorMessage);
    
    return new Response(
      `<html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>Connection Failed</h1>
          <p>${errorMessage}</p>
          <a href="https://servio-green.lovable.app/dashboard" style="color: blue;">Return to Dashboard</a>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" }, status: 500 }
    );
  }
});
