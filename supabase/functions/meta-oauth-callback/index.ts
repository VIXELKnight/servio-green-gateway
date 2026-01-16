import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://servio-green.lovable.app";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorReason = url.searchParams.get("error_reason");

  // Handle OAuth errors
  if (errorParam) {
    console.error("Meta OAuth error:", errorParam, errorReason);
    return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=${encodeURIComponent(errorReason || errorParam)}`);
  }

  if (!code || !state) {
    return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=missing_params`);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const metaAppId = Deno.env.get("META_APP_ID")!;
    const metaAppSecret = Deno.env.get("META_APP_SECRET")!;
    const redirectUri = `${supabaseUrl}/functions/v1/meta-oauth-callback`;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse state to get channel info
    const [stateDataB64] = state.split(".");
    let stateData: { channel_id: string; channel_type: string; user_id: string };
    
    try {
      stateData = JSON.parse(atob(stateDataB64));
    } catch {
      return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=invalid_state`);
    }

    // Verify state matches what we stored
    const { data: channel, error: channelError } = await supabase
      .from("bot_channels")
      .select("oauth_state, oauth_expires_at")
      .eq("id", stateData.channel_id)
      .single();

    if (channelError || !channel) {
      return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=channel_not_found`);
    }

    if (channel.oauth_state !== state) {
      return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=state_mismatch`);
    }

    if (new Date(channel.oauth_expires_at) < new Date()) {
      return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=state_expired`);
    }

    // Exchange code for access token
    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", metaAppId);
    tokenUrl.searchParams.set("client_secret", metaAppSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error);
      return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=token_exchange_failed`);
    }

    const shortLivedToken = tokenData.access_token;

    // Exchange for long-lived token
    const longLivedUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", metaAppId);
    longLivedUrl.searchParams.set("client_secret", metaAppSecret);
    longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longLivedResponse = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedResponse.json();

    const userAccessToken = longLivedData.access_token || shortLivedToken;

    // Get user's pages/accounts based on channel type
    let config: Record<string, unknown> = { connected: true };
    let webhookSubscribed = false;

    if (stateData.channel_type === "instagram") {
      // Get user's pages with Instagram accounts
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${userAccessToken}`
      );
      const pagesData = await pagesResponse.json();

      if (pagesData.data && pagesData.data.length > 0) {
        // Get the first page with Instagram
        const pageWithInstagram = pagesData.data.find((p: any) => p.instagram_business_account);
        
        if (pageWithInstagram) {
          const pageId = pageWithInstagram.id;
          const igAccountId = pageWithInstagram.instagram_business_account.id;

          // Get page access token (long-lived)
          const pageTokenResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${userAccessToken}`
          );
          const pageTokenData = await pageTokenResponse.json();
          const pageAccessToken = pageTokenData.access_token;

          // Subscribe to Instagram webhooks
          const verifyToken = "servio_ig_" + stateData.channel_id.slice(0, 8);
          
          try {
            const subscribeResponse = await fetch(
              `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscribed_fields: ["messages", "messaging_postbacks"],
                  access_token: pageAccessToken
                })
              }
            );
            webhookSubscribed = subscribeResponse.ok;
            console.log("Instagram webhook subscription:", webhookSubscribed);
          } catch (e) {
            console.error("Webhook subscription failed:", e);
          }

          // Token expires in ~60 days
          const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
          
          config = {
            connected: true,
            page_id: pageId,
            page_name: pageWithInstagram.name,
            instagram_account_id: igAccountId,
            instagram_username: pageWithInstagram.instagram_business_account.username,
            access_token: pageAccessToken,
            webhook_verify_token: verifyToken,
            webhook_subscribed: webhookSubscribed,
            token_expires_at: tokenExpiresAt
          };
        }
      }
    } else if (stateData.channel_type === "whatsapp") {
      // Get WhatsApp Business accounts
      const wabaResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name,phone_numbers{id,verified_name,display_phone_number}}&access_token=${userAccessToken}`
      );
      const wabaData = await wabaResponse.json();

      if (wabaData.data && wabaData.data.length > 0) {
        const business = wabaData.data[0];
        const waba = business.owned_whatsapp_business_accounts?.data?.[0];
        
        if (waba && waba.phone_numbers?.data?.[0]) {
          const phoneNumber = waba.phone_numbers.data[0];
          const verifyToken = "servio_wa_" + stateData.channel_id.slice(0, 8);

          // Token expires in ~60 days
          const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
          
          config = {
            connected: true,
            business_account_id: waba.id,
            business_name: waba.name,
            phone_number_id: phoneNumber.id,
            display_phone_number: phoneNumber.display_phone_number,
            verified_name: phoneNumber.verified_name,
            access_token: userAccessToken,
            webhook_verify_token: verifyToken,
            token_expires_at: tokenExpiresAt
          };
        }
      }
    }

    // Calculate token expiration (60 days from now)
    const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    
    // Update channel with new config
    const { error: updateError } = await supabase
      .from("bot_channels")
      .update({
        config,
        is_active: true,
        oauth_state: null,
        oauth_expires_at: null,
        token_expires_at: tokenExpiresAt,
        token_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", stateData.channel_id);

    if (updateError) {
      console.error("Failed to update channel:", updateError);
      return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=save_failed`);
    }

    console.log(`Successfully connected ${stateData.channel_type} channel:`, stateData.channel_id);
    return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=success&channel=${stateData.channel_type}`);

  } catch (error) {
    console.error("Meta OAuth callback error:", error);
    return Response.redirect(`${FRONTEND_URL}/dashboard?oauth=error&reason=unknown`);
  }
});
