import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChannelConfig {
  access_token?: string;
  page_id?: string;
  connected?: boolean;
  [key: string]: unknown;
}

// Refresh a long-lived token (valid for 60 days, can be refreshed before expiry)
async function refreshLongLivedToken(accessToken: string, appId: string, appSecret: string): Promise<{ token: string; expiresIn: number } | null> {
  try {
    const url = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", accessToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      console.error("Token refresh error:", data.error);
      return null;
    }

    return {
      token: data.access_token,
      expiresIn: data.expires_in || 5184000 // Default 60 days
    };
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return null;
  }
}

// For page tokens, we need to get a new page token using the user token
async function refreshPageToken(pageId: string, userToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${userToken}`
    );
    const data = await response.json();

    if (data.error) {
      console.error("Page token refresh error:", data.error);
      return null;
    }

    return data.access_token;
  } catch (error) {
    console.error("Failed to refresh page token:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const metaAppId = Deno.env.get("META_APP_ID")!;
    const metaAppSecret = Deno.env.get("META_APP_SECRET")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find channels with tokens expiring in the next 7 days
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: channels, error } = await supabase
      .from("bot_channels")
      .select("id, channel_type, config, token_expires_at")
      .in("channel_type", ["instagram", "whatsapp"])
      .eq("is_active", true)
      .or(`token_expires_at.is.null,token_expires_at.lt.${sevenDaysFromNow}`);

    if (error) {
      throw error;
    }

    console.log(`Found ${channels?.length || 0} channels to check for token refresh`);

    const results: { channelId: string; status: string; error?: string }[] = [];

    for (const channel of channels || []) {
      const config = channel.config as ChannelConfig;
      
      if (!config?.access_token || !config?.connected) {
        continue;
      }

      try {
        let newToken: string | null = null;
        let expiresIn = 5184000; // 60 days default

        if (channel.channel_type === "instagram" && config.page_id) {
          // For Instagram, we use page access tokens
          // First refresh the underlying user token, then get new page token
          const refreshed = await refreshLongLivedToken(config.access_token, metaAppId, metaAppSecret);
          
          if (refreshed) {
            // The page token is derived from the user token and is also long-lived
            newToken = refreshed.token;
            expiresIn = refreshed.expiresIn;
          }
        } else if (channel.channel_type === "whatsapp") {
          // WhatsApp uses system user tokens which don't expire the same way
          // But we can still try to refresh if it's a user token
          const refreshed = await refreshLongLivedToken(config.access_token, metaAppId, metaAppSecret);
          
          if (refreshed) {
            newToken = refreshed.token;
            expiresIn = refreshed.expiresIn;
          }
        }

        if (newToken) {
          const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
          
          await supabase
            .from("bot_channels")
            .update({
              config: {
                ...config,
                access_token: newToken
              },
              token_expires_at: newExpiresAt,
              token_refreshed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", channel.id);

          results.push({ channelId: channel.id, status: "refreshed" });
          console.log(`Refreshed token for channel ${channel.id}, expires at ${newExpiresAt}`);
        } else {
          results.push({ channelId: channel.id, status: "skipped", error: "Could not refresh token" });
        }
      } catch (channelError) {
        console.error(`Error refreshing channel ${channel.id}:`, channelError);
        results.push({ 
          channelId: channel.id, 
          status: "error", 
          error: channelError instanceof Error ? channelError.message : "Unknown error" 
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: channels?.length || 0,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Token refresh error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
