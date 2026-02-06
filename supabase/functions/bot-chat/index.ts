import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Inlined rate limiting to avoid _shared import issues
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

    // Message length validation
    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long (max 2000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limit by IP (30/min)
    const clientIP = getClientIP(req);
    const ipLimit = await checkLimit(supabase, clientIP, "bot-chat-ip", 30, 1);
    if (!ipLimit.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", retry_after: 60 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } });
    }

    // Rate limit by visitor (10/min)
    const visitorLimit = await checkLimit(supabase, `visitor:${visitor_id}`, "bot-chat-visitor", 10, 1);
    if (!visitorLimit.allowed) {
      return new Response(JSON.stringify({ error: "Slow down! Please wait before sending another message." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get channel and bot info
    const { data: channel, error: channelError } = await supabase
      .from("bot_channels").select("*, bots(*)").eq("embed_key", embed_key).eq("is_active", true).single();

    if (channelError || !channel) {
      console.error("[BOT-CHAT] Channel not found:", channelError);
      return new Response(JSON.stringify({ error: "Bot not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bot = channel.bots;
    if (!bot || !bot.is_active) {
      return new Response(JSON.stringify({ error: "Bot is inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Out of office check
    if (bot.out_of_office_enabled && bot.out_of_office_message) {
      // Still create conversation and store message, but return OOO response
    }

    // Get or create conversation
    let currentConversationId = conversation_id;
    if (!currentConversationId) {
      const { data: newConv, error: convError } = await supabase.from("bot_conversations").insert({
        bot_id: bot.id, channel_type: channel.channel_type, visitor_id,
        visitor_name: visitor_name || null, visitor_email: visitor_email || null
      }).select().single();

      if (convError) {
        console.error("[BOT-CHAT] Error creating conversation:", convError);
        return new Response(JSON.stringify({ error: "Failed to create conversation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      currentConversationId = newConv.id;
    }

    // Conversation length limit (100 messages)
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

    const systemPrompt = `You are an elite AI customer service expert with exceptional problem-solving abilities.

## Your Core Capabilities:
- Expert-level understanding of customer needs and intent
- Proactive issue resolution and anticipation
- Clear, empathetic, and professional communication
- Deep product/service knowledge integration
- Multi-step problem solving

## Bot Configuration:
${bot.instructions}
${kbContext}

## Response Guidelines:
1. Carefully analyze the customer's question to identify the root need
2. Provide complete, actionable answers in a single response when possible
3. Use bullet points or numbered lists for complex answers
4. Address likely follow-up questions proactively
5. Reference conversation context and previous messages
6. Be concise yet thorough

## Escalation Triggers (mention human assistance for):
- Billing disputes or payment issues requiring account access
- Technical bugs requiring investigation
- Account security concerns
- Complaints about service quality
- Requests explicitly asking for a human

## Tone: Professional yet warm. Confident but not arrogant. Helpful and solution-oriented.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content }))
    ];

    if (!lovableApiKey) {
      console.error("[BOT-CHAT] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("[BOT-CHAT] Calling AI with model: google/gemini-2.5-flash");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: aiMessages, max_tokens: 1500, temperature: 0.7 }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[BOT-CHAT] AI error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Failed to generate response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Store assistant response
    await supabase.from("bot_messages").insert({ conversation_id: currentConversationId, role: "assistant", content: assistantMessage });

    // Update conversation timestamp
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
