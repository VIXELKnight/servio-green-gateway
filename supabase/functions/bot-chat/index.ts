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

async function checkLimit(supabase: any, id: string, endpoint: string, max: number, windowMin: number) {
  try {
    const { data } = await supabase.rpc("check_rate_limit", {
      p_identifier: id, p_endpoint: endpoint, p_max_requests: max, p_window_minutes: windowMin,
    });
    const r = data?.[0];
    return { allowed: r?.allowed ?? true, count: r?.current_count ?? 0, resetAt: r?.reset_at ?? new Date().toISOString() };
  } catch { return { allowed: true, count: 0, resetAt: new Date().toISOString() }; }
}

// ─── Shopify helpers ───────────────────────────────────────────────
async function shopifyFetch(storeDomain: string, accessToken: string, endpoint: string) {
  try {
    const res = await fetch(`https://${storeDomain}/admin/api/2024-01/${endpoint}`, {
      headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" },
    });
    if (!res.ok) { console.error(`[SHOPIFY] ${endpoint} failed: ${res.status}`); return null; }
    return await res.json();
  } catch (e) { console.error(`[SHOPIFY] ${endpoint} error:`, e); return null; }
}

async function lookupOrder(storeDomain: string, accessToken: string, query: string) {
  const isEmail = query.includes("@");
  const endpoint = isEmail
    ? `orders.json?email=${encodeURIComponent(query)}&status=any&limit=5`
    : `orders.json?name=${encodeURIComponent(query.replace("#", ""))}&status=any&limit=5`;
  const data = await shopifyFetch(storeDomain, accessToken, endpoint);
  if (!data?.orders?.length && !isEmail) {
    const fallback = await shopifyFetch(storeDomain, accessToken, `orders.json?name=%23${query.replace("#", "")}&status=any&limit=5`);
    return fallback?.orders || [];
  }
  return data?.orders || [];
}

async function getProducts(storeDomain: string, accessToken: string, query?: string) {
  const endpoint = query
    ? `products.json?title=${encodeURIComponent(query)}&limit=10`
    : `products.json?limit=20&status=active`;
  const data = await shopifyFetch(storeDomain, accessToken, endpoint);
  return data?.products || [];
}

async function getCollections(storeDomain: string, accessToken: string) {
  const [custom, smart] = await Promise.all([
    shopifyFetch(storeDomain, accessToken, "custom_collections.json?limit=10"),
    shopifyFetch(storeDomain, accessToken, "smart_collections.json?limit=10"),
  ]);
  return [
    ...(custom?.custom_collections || []),
    ...(smart?.smart_collections || []),
  ];
}

function formatOrder(order: any): string {
  const fulfillments = order.fulfillments || [];
  const tracking = fulfillments.map((f: any) =>
    f.tracking_numbers?.map((t: string, i: number) =>
      `${t}${f.tracking_urls?.[i] ? ` (${f.tracking_urls[i]})` : ""}`
    ).join(", ") || "No tracking yet"
  ).join("; ");

  const items = (order.line_items || []).map((li: any) =>
    `• ${li.title}${li.variant_title ? ` (${li.variant_title})` : ""} × ${li.quantity} — ${li.price} ${order.currency}`
  ).join("\n");

  return `**Order ${order.name}** — ${order.financial_status} / ${order.fulfillment_status || "unfulfilled"}
Created: ${new Date(order.created_at).toLocaleDateString()}
Total: ${order.total_price} ${order.currency}
Items:\n${items}
Tracking: ${tracking || "Not shipped yet"}
${order.cancelled_at ? `⚠️ Cancelled: ${new Date(order.cancelled_at).toLocaleDateString()}` : ""}`;
}

function formatProduct(p: any): string {
  const variants = (p.variants || []).slice(0, 5).map((v: any) =>
    `  • ${v.title}: ${v.price} ${v.inventory_quantity != null ? `(${v.inventory_quantity} in stock)` : ""}`
  ).join("\n");
  return `**${p.title}**${p.product_type ? ` [${p.product_type}]` : ""}
${p.body_html ? p.body_html.replace(/<[^>]*>/g, "").substring(0, 200) : "No description"}
Variants:\n${variants}
Status: ${p.status}`;
}

function detectShopifyIntent(message: string): { type: string; query: string } | null {
  const msg = message.toLowerCase();

  const orderPatterns = [
    /(?:order|tracking|shipment|delivery|where.?s my|status of)\s*#?(\w+)/i,
    /(?:#)(\d{3,})/i,
    /(?:order\s*number\s*)(\w+)/i,
  ];
  for (const p of orderPatterns) {
    const m = message.match(p);
    if (m) return { type: "order_lookup", query: m[1] };
  }

  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch && (msg.includes("order") || msg.includes("tracking") || msg.includes("purchase"))) {
    return { type: "order_by_email", query: emailMatch[0] };
  }

  if (msg.match(/(?:do you (?:have|sell|carry)|looking for|find|search|show me|recommend|suggest|what.?s (?:available|in stock))/)) {
    const cleaned = msg.replace(/(?:do you (?:have|sell|carry)|looking for|find|search|show me|recommend|suggest|what.?s (?:available|in stock))\s*/i, "").replace(/\?/g, "").trim();
    return { type: "product_search", query: cleaned };
  }

  if (msg.match(/(?:in stock|available|inventory|how many|quantity)/)) {
    const cleaned = msg.replace(/(?:is|are|the|in stock|available|inventory|how many|quantity|do you have)\s*/gi, "").replace(/\?/g, "").trim();
    if (cleaned.length > 1) return { type: "inventory_check", query: cleaned };
  }

  if (msg.match(/(?:how much|price|cost|pricing)/)) {
    const cleaned = msg.replace(/(?:how much (?:is|are|does)|price (?:of|for)|cost (?:of|for)|pricing (?:of|for)|the)\s*/gi, "").replace(/\?/g, "").trim();
    if (cleaned.length > 1) return { type: "price_check", query: cleaned };
  }

  if (msg.match(/(?:categories|collections|what do you (?:sell|offer)|browse|catalog)/)) {
    return { type: "browse_collections", query: "" };
  }

  if (msg.match(/(?:cart|checkout|complete.*purchase|finish.*order)/)) {
    return { type: "cart_help", query: "" };
  }

  return null;
}

// ─── Main handler ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { embed_key, message, conversation_id, visitor_id, visitor_name, visitor_email } = await req.json();

    if (!embed_key || !message || !visitor_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long (max 2000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limiting — run both checks in parallel
    const clientIP = getClientIP(req);
    const [ipLimit, visitorLimit] = await Promise.all([
      checkLimit(supabase, clientIP, "bot-chat-ip", 30, 1),
      checkLimit(supabase, `visitor:${visitor_id}`, "bot-chat-visitor", 10, 1),
    ]);

    if (!ipLimit.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", retry_after: 60 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } });
    }
    if (!visitorLimit.allowed) {
      return new Response(JSON.stringify({ error: "Slow down! Please wait before sending another message." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get channel+bot info
    const { data: channel, error: channelError } = await supabase
      .from("bot_channels").select("*, bots(*)").eq("embed_key", embed_key).eq("is_active", true).single();

    if (channelError || !channel) {
      return new Response(JSON.stringify({ error: "Bot not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bot = channel.bots;
    if (!bot || !bot.is_active) {
      return new Response(JSON.stringify({ error: "Bot is inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get or create conversation
    let currentConversationId = conversation_id;
    if (!currentConversationId) {
      const { data: newConv, error: convError } = await supabase.from("bot_conversations").insert({
        bot_id: bot.id, channel_type: channel.channel_type, visitor_id,
        visitor_name: visitor_name || null, visitor_email: visitor_email || null
      }).select().single();
      if (convError) {
        return new Response(JSON.stringify({ error: "Failed to create conversation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      currentConversationId = newConv.id;
    }

    // Run these in parallel: store user msg, get history, get KB, get Shopify integration, check msg count
    const [, { data: history }, { data: kb }, { data: shopifyIntegration }, { count }] = await Promise.all([
      supabase.from("bot_messages").insert({ conversation_id: currentConversationId, role: "user", content: message }),
      supabase.from("bot_messages").select("role, content")
        .eq("conversation_id", currentConversationId).order("created_at", { ascending: true }).limit(20),
      supabase.from("knowledge_base").select("title, content").eq("bot_id", bot.id).limit(15),
      supabase.from("bot_shopify_integrations").select("*").eq("bot_id", bot.id).eq("is_active", true).maybeSingle(),
      supabase.from("bot_messages").select("*", { count: "exact", head: true }).eq("conversation_id", currentConversationId),
    ]);

    if (count && count >= 100) {
      return new Response(JSON.stringify({ error: "Conversation limit reached. Please start a new chat." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let kbContext = "";
    if (kb && kb.length > 0) {
      kbContext = "\n\n## Knowledge Base:\n" + kb.map((e: any) => `### ${e.title}\n${e.content}`).join("\n\n");
    }

    // ─── Shopify context enrichment (only when intent detected) ────
    let shopifyContext = "";
    const intent = shopifyIntegration ? detectShopifyIntent(message) : null;

    if (shopifyIntegration) {
      const { store_domain, access_token } = shopifyIntegration;

      if (intent) {
        console.log("[BOT-CHAT] Shopify intent:", intent.type, intent.query);
        try {
          if (intent.type === "order_lookup" || intent.type === "order_by_email") {
            const orders = await lookupOrder(store_domain, access_token, intent.query);
            shopifyContext = orders.length > 0
              ? "\n\n## Order Data (from Shopify):\n" + orders.map(formatOrder).join("\n\n---\n\n")
              : `\n\n## Order Lookup Result:\nNo orders found for "${intent.query}". Ask the customer to double-check their order number or email.`;
          } else if (intent.type === "product_search" || intent.type === "price_check" || intent.type === "inventory_check") {
            const products = await getProducts(store_domain, access_token, intent.query);
            shopifyContext = products.length > 0
              ? "\n\n## Product Data (from Shopify):\n" + products.slice(0, 5).map(formatProduct).join("\n\n---\n\n")
              : `\n\n## Product Search Result:\nNo products found matching "${intent.query}".`;
          } else if (intent.type === "browse_collections") {
            const collections = await getCollections(store_domain, access_token);
            if (collections.length > 0) {
              shopifyContext = "\n\n## Store Collections:\n" + collections.map((c: any) => `• **${c.title}**: ${c.body_html?.replace(/<[^>]*>/g, "").substring(0, 100) || "No description"}`).join("\n");
            }
          } else if (intent.type === "cart_help") {
            shopifyContext = "\n\n## Cart Assistance:\nThe customer needs help with their cart or checkout. Guide them through the process and encourage completing the purchase.";
          }
        } catch (shopifyError) {
          console.error("[BOT-CHAT] Shopify data fetch error:", shopifyError);
          shopifyContext = "\n\n[Note: Shopify data temporarily unavailable]";
        }
      }
      // Skip fetching top products for general messages — saves ~500ms per request
    }

    // ─── Build system prompt ───────────────────────────────────────
    const systemPrompt = `You are an elite AI customer service and sales assistant.

## Core Capabilities:
- Expert customer needs analysis, proactive issue resolution
- Clear, empathetic, professional communication
- Product recommendations, order tracking, inventory awareness

## Bot Configuration:
${bot.instructions}
${kbContext}
${shopifyContext}

${shopifyIntegration ? `## E-Commerce (Shopify: ${shopifyIntegration.store_domain}):
- Use real data provided above — never fabricate orders/prices/tracking
- Include prices when discussing products; suggest alternatives for out-of-stock
- Help customers complete purchases
` : ""}

## Response Guidelines:
1. Identify root need, provide complete actionable answers
2. Use bullet points for complex answers
3. Be concise yet thorough — like the best sales associate
4. Address likely follow-up questions proactively

## Escalation Triggers:
Billing disputes, refunds, technical bugs, security concerns, explicit human requests, order modifications`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content }))
    ];

    // Use gemini-3-flash-preview for faster responses
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, max_tokens: 1500, temperature: 0.7 }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[BOT-CHAT] AI error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Failed to generate response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Store response + update conversation + auto-tag — all in parallel
    const postOps: Promise<any>[] = [
      supabase.from("bot_messages").insert({ conversation_id: currentConversationId, role: "assistant", content: assistantMessage }),
      supabase.from("bot_conversations").update({ updated_at: new Date().toISOString() }).eq("id", currentConversationId),
    ];

    if (intent && shopifyIntegration) {
      const tagMap: Record<string, string> = {
        order_lookup: "order-inquiry", order_by_email: "order-inquiry",
        product_search: "product-inquiry", price_check: "pricing",
        inventory_check: "inventory", browse_collections: "browsing", cart_help: "cart-recovery",
      };
      const tag = tagMap[intent.type];
      if (tag) {
        postOps.push(
          supabase.from("bot_conversations").select("tags").eq("id", currentConversationId).single()
            .then(({ data: conv }) => {
              const currentTags = conv?.tags || [];
              if (!currentTags.includes(tag)) {
                return supabase.from("bot_conversations").update({ tags: [...currentTags, tag] }).eq("id", currentConversationId);
              }
            })
        );
      }
    }

    await Promise.all(postOps);

    return new Response(JSON.stringify({ response: assistantMessage, conversation_id: currentConversationId }), {
      headers: {
        ...corsHeaders, "Content-Type": "application/json",
        "X-RateLimit-Limit": "30", "X-RateLimit-Remaining": String(Math.max(0, 30 - ipLimit.count)),
      }
    });

  } catch (error) {
    console.error("[BOT-CHAT] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
