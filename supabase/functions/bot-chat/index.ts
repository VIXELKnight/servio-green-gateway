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
  // Try by order name (#1001) or by email
  const isEmail = query.includes("@");
  const endpoint = isEmail
    ? `orders.json?email=${encodeURIComponent(query)}&status=any&limit=5`
    : `orders.json?name=${encodeURIComponent(query.replace("#", ""))}&status=any&limit=5`;
  const data = await shopifyFetch(storeDomain, accessToken, endpoint);
  if (!data?.orders?.length && !isEmail) {
    // Fallback: search by order number
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

async function getProductByHandle(storeDomain: string, accessToken: string, handle: string) {
  // Use GraphQL for handle lookup
  try {
    const res = await fetch(`https://${storeDomain}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ productByHandle(handle: "${handle}") { id title description variants(first:10) { edges { node { title price availableForSale inventoryQuantity } } } } }`
      }),
    });
    const data = await res.json();
    return data?.data?.productByHandle || null;
  } catch { return null; }
}

async function getInventoryLevels(storeDomain: string, accessToken: string, productId: string) {
  const data = await shopifyFetch(storeDomain, accessToken, `products/${productId}.json?fields=id,title,variants`);
  return data?.product?.variants || [];
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

// Detect intent from message
function detectShopifyIntent(message: string): { type: string; query: string } | null {
  const msg = message.toLowerCase();

  // Order lookup patterns
  const orderPatterns = [
    /(?:order|tracking|shipment|delivery|where.?s my|status of)\s*#?(\w+)/i,
    /(?:#)(\d{3,})/i,
    /(?:order\s*number\s*)(\w+)/i,
  ];
  for (const p of orderPatterns) {
    const m = message.match(p);
    if (m) return { type: "order_lookup", query: m[1] };
  }

  // Email-based order lookup
  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch && (msg.includes("order") || msg.includes("tracking") || msg.includes("purchase"))) {
    return { type: "order_by_email", query: emailMatch[0] };
  }

  // Product search
  if (msg.match(/(?:do you (?:have|sell|carry)|looking for|find|search|show me|recommend|suggest|what.?s (?:available|in stock))/)) {
    const cleaned = msg.replace(/(?:do you (?:have|sell|carry)|looking for|find|search|show me|recommend|suggest|what.?s (?:available|in stock))\s*/i, "").replace(/\?/g, "").trim();
    return { type: "product_search", query: cleaned };
  }

  // Inventory check
  if (msg.match(/(?:in stock|available|inventory|how many|quantity)/)) {
    const cleaned = msg.replace(/(?:is|are|the|in stock|available|inventory|how many|quantity|do you have)\s*/gi, "").replace(/\?/g, "").trim();
    if (cleaned.length > 1) return { type: "inventory_check", query: cleaned };
  }

  // Price inquiry
  if (msg.match(/(?:how much|price|cost|pricing)/)) {
    const cleaned = msg.replace(/(?:how much (?:is|are|does)|price (?:of|for)|cost (?:of|for)|pricing (?:of|for)|the)\s*/gi, "").replace(/\?/g, "").trim();
    if (cleaned.length > 1) return { type: "price_check", query: cleaned };
  }

  // Collection/category browsing
  if (msg.match(/(?:categories|collections|what do you (?:sell|offer)|browse|catalog)/)) {
    return { type: "browse_collections", query: "" };
  }

  // Cart recovery / abandoned cart
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

    // Rate limiting
    const clientIP = getClientIP(req);
    const ipLimit = await checkLimit(supabase, clientIP, "bot-chat-ip", 30, 1);
    if (!ipLimit.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", retry_after: 60 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } });
    }
    const visitorLimit = await checkLimit(supabase, `visitor:${visitor_id}`, "bot-chat-visitor", 10, 1);
    if (!visitorLimit.allowed) {
      return new Response(JSON.stringify({ error: "Slow down! Please wait before sending another message." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get channel and bot info
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

    // Conversation length limit
    const { count } = await supabase.from("bot_messages")
      .select("*", { count: "exact", head: true }).eq("conversation_id", currentConversationId);
    if (count && count >= 100) {
      return new Response(JSON.stringify({ error: "Conversation limit reached. Please start a new chat." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Store user message
    await supabase.from("bot_messages").insert({ conversation_id: currentConversationId, role: "user", content: message });

    // Get conversation history
    const { data: history } = await supabase.from("bot_messages").select("role, content")
      .eq("conversation_id", currentConversationId).order("created_at", { ascending: true }).limit(20);

    // Get knowledge base
    const { data: kb } = await supabase.from("knowledge_base").select("title, content").eq("bot_id", bot.id).limit(15);
    let kbContext = "";
    if (kb && kb.length > 0) {
      kbContext = "\n\n## Knowledge Base:\n" + kb.map((e: any) => `### ${e.title}\n${e.content}`).join("\n\n");
    }

    // ─── Shopify context enrichment ────────────────────────────────
    let shopifyContext = "";
    let shopifyDataSummary = "";

    const { data: shopifyIntegration } = await supabase
      .from("bot_shopify_integrations")
      .select("*")
      .eq("bot_id", bot.id)
      .eq("is_active", true)
      .maybeSingle();

    if (shopifyIntegration) {
      const { store_domain, access_token } = shopifyIntegration;
      const intent = detectShopifyIntent(message);

      console.log("[BOT-CHAT] Shopify intent:", intent?.type, intent?.query);

      try {
        if (intent?.type === "order_lookup" || intent?.type === "order_by_email") {
          const orders = await lookupOrder(store_domain, access_token, intent.query);
          if (orders.length > 0) {
            shopifyContext = "\n\n## Order Data (from Shopify):\n" + orders.map(formatOrder).join("\n\n---\n\n");
          } else {
            shopifyContext = `\n\n## Order Lookup Result:\nNo orders found for "${intent.query}". Ask the customer to double-check their order number or email.`;
          }
        } else if (intent?.type === "product_search" || intent?.type === "price_check" || intent?.type === "inventory_check") {
          const products = await getProducts(store_domain, access_token, intent.query);
          if (products.length > 0) {
            shopifyContext = "\n\n## Product Data (from Shopify):\n" + products.slice(0, 5).map(formatProduct).join("\n\n---\n\n");
          } else {
            shopifyContext = `\n\n## Product Search Result:\nNo products found matching "${intent.query}".`;
          }
        } else if (intent?.type === "browse_collections") {
          const collections = await getCollections(store_domain, access_token);
          if (collections.length > 0) {
            shopifyContext = "\n\n## Store Collections:\n" + collections.map((c: any) => `• **${c.title}**: ${c.body_html?.replace(/<[^>]*>/g, "").substring(0, 100) || "No description"}`).join("\n");
          }
        } else if (intent?.type === "cart_help") {
          shopifyContext = "\n\n## Cart Assistance:\nThe customer needs help with their cart or checkout. Guide them through the process, answer questions about shipping/payment, and encourage completing the purchase.";
        }

        // Always include basic store info for context
        if (!intent) {
          // Fetch top products as general context
          const topProducts = await getProducts(store_domain, access_token);
          if (topProducts.length > 0) {
            shopifyDataSummary = "\n\n## Store Catalog Summary (top products):\n" +
              topProducts.slice(0, 8).map((p: any) => `• ${p.title} — from ${p.variants?.[0]?.price || "N/A"}`).join("\n");
          }
        }
      } catch (shopifyError) {
        console.error("[BOT-CHAT] Shopify data fetch error:", shopifyError);
        shopifyContext = "\n\n[Note: Shopify data temporarily unavailable]";
      }
    }

    // ─── Build system prompt ───────────────────────────────────────
    const systemPrompt = `You are an elite AI customer service and sales assistant with exceptional problem-solving abilities.

## Your Core Capabilities:
- Expert-level understanding of customer needs and intent
- Proactive issue resolution and anticipation
- Clear, empathetic, and professional communication
- Deep product/service knowledge integration
- Multi-step problem solving
- **Product recommendations** based on customer needs
- **Order tracking** with real-time Shopify data
- **Inventory awareness** — know what's in stock

## Bot Configuration:
${bot.instructions}
${kbContext}
${shopifyContext}
${shopifyDataSummary}

## E-Commerce Assistant Rules:
${shopifyIntegration ? `
You are connected to the Shopify store: ${shopifyIntegration.store_domain}
- When customers ask about orders, use the order data provided above
- When customers ask about products, recommend from the catalog data above
- For product recommendations, consider what the customer is looking for and suggest relevant items
- Always include prices when discussing products
- If a product is out of stock, let the customer know and suggest alternatives
- For order tracking, provide tracking numbers and links when available
- Help customers complete their purchases — be a helpful sales assistant
- If you don't have specific data, offer to help the customer find what they need
- Never make up order numbers, tracking info, or prices — only use real data provided
` : "No e-commerce store is connected. Answer based on knowledge base only."}

## Response Guidelines:
1. Carefully analyze the customer's question to identify the root need
2. Provide complete, actionable answers in a single response when possible
3. Use bullet points or numbered lists for complex answers
4. For product recommendations, include name, price, and key features
5. Address likely follow-up questions proactively
6. Reference conversation context and previous messages
7. Be concise yet thorough — act like the best sales associate

## Escalation Triggers (mention human assistance for):
- Billing disputes or refund requests
- Technical bugs requiring investigation
- Account security concerns
- Complaints about service quality
- Requests explicitly asking for a human
- Order modifications or cancellations

## Tone: Professional yet warm. Confident but not arrogant. Helpful and solution-oriented. Like the best salesperson who genuinely wants to help.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content }))
    ];

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("[BOT-CHAT] Calling AI with model: google/gemini-2.5-flash, shopify:", !!shopifyIntegration);
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: aiMessages, max_tokens: 2000, temperature: 0.7 }),
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

    // Auto-tag conversation based on Shopify intent
    if (shopifyIntegration) {
      const intent = detectShopifyIntent(message);
      if (intent) {
        const tagMap: Record<string, string> = {
          order_lookup: "order-inquiry",
          order_by_email: "order-inquiry",
          product_search: "product-inquiry",
          price_check: "pricing",
          inventory_check: "inventory",
          browse_collections: "browsing",
          cart_help: "cart-recovery",
        };
        const tag = tagMap[intent.type];
        if (tag) {
          const { data: conv } = await supabase.from("bot_conversations")
            .select("tags").eq("id", currentConversationId).single();
          const currentTags = conv?.tags || [];
          if (!currentTags.includes(tag)) {
            await supabase.from("bot_conversations")
              .update({ tags: [...currentTags, tag] })
              .eq("id", currentConversationId);
          }
        }
      }
    }

    // Store assistant response
    await supabase.from("bot_messages").insert({ conversation_id: currentConversationId, role: "assistant", content: assistantMessage });
    await supabase.from("bot_conversations").update({ updated_at: new Date().toISOString() }).eq("id", currentConversationId);

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
