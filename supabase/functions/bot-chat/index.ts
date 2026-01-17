import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit, 
  getClientIdentifier, 
  rateLimitExceededResponse, 
  addRateLimitHeaders,
  RATE_LIMITS 
} from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  embed_key: string;
  message: string;
  conversation_id?: string;
  visitor_id: string;
  visitor_name?: string;
  visitor_email?: string;
}
interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  line_items: Array<{ title: string; quantity: number }>;
  shipping_address?: { city: string; country: string };
  tracking_urls?: string[];
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  variants: Array<{
    title: string;
    price: string;
    inventory_quantity: number;
    available: boolean;
  }>;
}

// Fetch order from Shopify
async function fetchShopifyOrder(storeDomain: string, accessToken: string, query: string): Promise<ShopifyOrder | null> {
  try {
    // Search by order name (e.g., #1001) or email
    const isOrderNumber = query.startsWith('#') || /^\d+$/.test(query);
    const searchQuery = isOrderNumber ? query.replace('#', '') : query;
    
    const url = isOrderNumber
      ? `https://${storeDomain}/admin/api/2024-01/orders.json?name=${encodeURIComponent(query)}&status=any`
      : `https://${storeDomain}/admin/api/2024-01/orders.json?email=${encodeURIComponent(searchQuery)}&status=any&limit=5`;

    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Shopify order fetch error:", response.status);
      return null;
    }

    const data = await response.json();
    const orders = data.orders || [];
    
    if (orders.length === 0) return null;
    
    // Return the most recent order
    return orders[0];
  } catch (error) {
    console.error("Error fetching Shopify order:", error);
    return null;
  }
}

// Search products from Shopify
async function searchShopifyProducts(storeDomain: string, accessToken: string, query: string): Promise<ShopifyProduct[]> {
  try {
    const response = await fetch(
      `https://${storeDomain}/admin/api/2024-01/products.json?title=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Shopify product search error:", response.status);
      return [];
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Error searching Shopify products:", error);
    return [];
  }
}

// Detect if message is asking about order or product
function detectShopifyIntent(message: string): { type: 'order' | 'product' | null; query: string } {
  const lowerMessage = message.toLowerCase();
  
  // Order-related patterns
  const orderPatterns = [
    /order\s*#?\s*(\d+)/i,
    /order\s+status/i,
    /tracking/i,
    /where\s+is\s+my\s+(order|package|shipment)/i,
    /shipped/i,
    /delivery/i,
    /#(\d+)/,
  ];
  
  for (const pattern of orderPatterns) {
    const match = message.match(pattern);
    if (match) {
      // Extract order number if present
      const orderNum = match[1] || '';
      return { type: 'order', query: orderNum ? `#${orderNum}` : '' };
    }
  }
  
  // Product-related patterns
  const productPatterns = [
    /do you have/i,
    /in stock/i,
    /available/i,
    /price of/i,
    /how much/i,
    /tell me about/i,
    /product/i,
  ];
  
  for (const pattern of productPatterns) {
    if (pattern.test(lowerMessage)) {
      // Extract potential product name (simple extraction)
      const words = message.split(/\s+/).filter(w => 
        w.length > 3 && 
        !['have', 'stock', 'available', 'price', 'much', 'tell', 'about', 'product', 'what', 'does', 'your'].includes(w.toLowerCase())
      );
      return { type: 'product', query: words.slice(0, 3).join(' ') };
    }
  }
  
  return { type: null, query: '' };
}

// Format order info for AI context
function formatOrderContext(order: ShopifyOrder): string {
  const items = order.line_items.map(item => `${item.quantity}x ${item.title}`).join(', ');
  const fulfillment = order.fulfillment_status || 'unfulfilled';
  
  return `
ORDER INFORMATION (Order ${order.name}):
- Status: ${order.financial_status} / ${fulfillment}
- Items: ${items}
- Total: ${order.currency} ${order.total_price}
- Placed: ${new Date(order.created_at).toLocaleDateString()}
${order.shipping_address ? `- Shipping to: ${order.shipping_address.city}, ${order.shipping_address.country}` : ''}
${order.tracking_urls?.length ? `- Tracking: ${order.tracking_urls[0]}` : ''}
`;
}

// Format product info for AI context
function formatProductContext(products: ShopifyProduct[]): string {
  if (products.length === 0) return '';
  
  return `
PRODUCT INFORMATION:
${products.map(p => {
    const variant = p.variants[0];
    const inStock = p.variants.some(v => v.inventory_quantity > 0);
    return `- ${p.title}: $${variant?.price || 'N/A'} (${inStock ? 'In Stock' : 'Out of Stock'})`;
  }).join('\n')}
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Variables for rate limiting outside try block for access in response
  let rateLimitResult = { allowed: true, currentCount: 0, resetAt: new Date() };

  try {
    // Rate limiting - use visitor_id or IP as identifier
    const clientId = getClientIdentifier(req);
    rateLimitResult = await checkRateLimit(clientId, "bot-chat", RATE_LIMITS.chat);
    
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for ${clientId} on bot-chat`);
      return rateLimitExceededResponse(rateLimitResult, corsHeaders);
    }

    const { embed_key, message, conversation_id, visitor_id, visitor_name, visitor_email } = 
      await req.json() as ChatRequest;

    if (!embed_key || !message || !visitor_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get channel and bot info
    const { data: channel, error: channelError } = await supabase
      .from("bot_channels")
      .select("*, bots(*)")
      .eq("embed_key", embed_key)
      .eq("is_active", true)
      .single();

    if (channelError || !channel) {
      console.error("Channel not found:", channelError);
      return new Response(
        JSON.stringify({ error: "Bot not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bot = channel.bots;
    if (!bot || !bot.is_active) {
      return new Response(
        JSON.stringify({ error: "Bot is inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Shopify integration if available
    const { data: shopifyConfig } = await supabase
      .from("bot_shopify_integrations")
      .select("*")
      .eq("bot_id", bot.id)
      .eq("is_active", true)
      .maybeSingle();

    // Get or create conversation
    let currentConversationId = conversation_id;
    
    if (!currentConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("bot_conversations")
        .insert({
          bot_id: bot.id,
          channel_type: channel.channel_type,
          visitor_id,
          visitor_name: visitor_name || null,
          visitor_email: visitor_email || null
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        return new Response(
          JSON.stringify({ error: "Failed to create conversation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      currentConversationId = newConv.id;
    }

    // Store user message
    await supabase.from("bot_messages").insert({
      conversation_id: currentConversationId,
      role: "user",
      content: message
    });

    // Get conversation history
    const { data: history } = await supabase
      .from("bot_messages")
      .select("role, content")
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Get knowledge base entries for context
    const { data: knowledgeEntries } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .eq("bot_id", bot.id)
      .limit(10);

    // Build context from knowledge base
    let knowledgeContext = "";
    if (knowledgeEntries && knowledgeEntries.length > 0) {
      knowledgeContext = "\n\nRelevant Knowledge Base:\n" + 
        knowledgeEntries.map(e => `- ${e.title}: ${e.content}`).join("\n");
    }

    // Shopify context
    let shopifyContext = "";
    if (shopifyConfig) {
      const intent = detectShopifyIntent(message);
      
      if (intent.type === 'order') {
        // Try to find order by number or use visitor email
        const orderQuery = intent.query || visitor_email || '';
        if (orderQuery) {
          const order = await fetchShopifyOrder(
            shopifyConfig.store_domain, 
            shopifyConfig.access_token, 
            orderQuery
          );
          if (order) {
            shopifyContext = formatOrderContext(order);
          }
        }
      } else if (intent.type === 'product' && intent.query) {
        const products = await searchShopifyProducts(
          shopifyConfig.store_domain,
          shopifyConfig.access_token,
          intent.query
        );
        if (products.length > 0) {
          shopifyContext = formatProductContext(products);
        }
      }
    }

    // Build system prompt
    const systemPrompt = `${bot.instructions}
${knowledgeContext}
${shopifyContext}

${shopifyConfig ? `
You have access to the customer's Shopify store data. When customers ask about orders, use the order information provided above. When they ask about products, use the product information provided.

If a customer asks about an order but no order info is shown above, ask them for their order number (e.g., #1234) to look it up.
` : ''}

Important guidelines:
1. Be helpful, friendly, and professional
2. If the user's question is complex or requires human assistance, end your response with: [ESCALATE: reason]
3. Stay focused on the topic and provide accurate information based on the knowledge base
4. If you don't know something, admit it and offer to connect them with a human agent`;

    // Prepare messages for AI
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(m => ({ role: m.role, content: m.content }))
    ];

    // Call Lovable AI
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let assistantMessage = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Check for escalation
    let shouldEscalate = false;
    let escalationReason = "";
    
    const escalateMatch = assistantMessage.match(/\[ESCALATE:\s*(.+?)\]/i);
    if (escalateMatch) {
      shouldEscalate = true;
      escalationReason = escalateMatch[1];
      assistantMessage = assistantMessage.replace(/\[ESCALATE:\s*.+?\]/gi, "").trim();
      
      // Add human handoff message
      assistantMessage += "\n\nI've notified our team and someone will assist you shortly.";
    }

    // Store assistant response
    await supabase.from("bot_messages").insert({
      conversation_id: currentConversationId,
      role: "assistant",
      content: assistantMessage,
      metadata: { escalated: shouldEscalate, shopify_used: !!shopifyContext }
    });

    // Update conversation status if escalated
    if (shouldEscalate && bot.triage_enabled) {
      await supabase
        .from("bot_conversations")
        .update({ 
          status: "escalated",
          escalation_reason: escalationReason
        })
        .eq("id", currentConversationId);
    }

    const responseHeaders = addRateLimitHeaders(
      { ...corsHeaders, "Content-Type": "application/json" },
      rateLimitResult,
      RATE_LIMITS.chat
    );

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        conversation_id: currentConversationId,
        escalated: shouldEscalate
      }),
      { headers: responseHeaders }
    );

  } catch (error) {
    console.error("Bot chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
