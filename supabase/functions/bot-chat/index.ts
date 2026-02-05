import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      console.error("[BOT-CHAT] Channel not found:", channelError);
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
        console.error("[BOT-CHAT] Error creating conversation:", convError);
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

    // Get knowledge base entries
    const { data: knowledgeEntries } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .eq("bot_id", bot.id)
      .limit(15);

    let knowledgeContext = "";
    if (knowledgeEntries && knowledgeEntries.length > 0) {
      knowledgeContext = "\n\n## Knowledge Base:\n" + 
        knowledgeEntries.map(e => `### ${e.title}\n${e.content}`).join("\n\n");
    }

    // Enhanced system prompt for maximum AI capabilities
    const systemPrompt = `You are an elite AI customer service expert with exceptional problem-solving abilities.

## Your Core Capabilities:
- Expert-level understanding of customer needs and intent
- Proactive issue resolution and anticipation
- Clear, empathetic, and professional communication
- Deep product/service knowledge integration
- Multi-step problem solving

## Bot Configuration:
${bot.instructions}

${knowledgeContext}

## Response Guidelines:
1. **Understand First**: Carefully analyze the customer's question to identify the root need
2. **Be Comprehensive**: Provide complete, actionable answers in a single response when possible
3. **Use Structure**: Use bullet points, numbered lists, or clear sections for complex answers
4. **Anticipate**: Address likely follow-up questions proactively
5. **Personalize**: Reference the conversation context and previous messages
6. **Be Concise Yet Complete**: Don't ramble, but ensure the answer is thorough

## Escalation Triggers (mention human assistance for):
- Billing disputes or payment issues requiring account access
- Technical bugs requiring investigation
- Account security concerns
- Complaints about service quality
- Requests explicitly asking for a human

## Tone:
Professional yet warm. Confident but not arrogant. Helpful and solution-oriented.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(m => ({ role: m.role, content: m.content }))
    ];

    if (!lovableApiKey) {
      console.error("[BOT-CHAT] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[BOT-CHAT] Calling AI gateway with model: google/gemini-2.5-pro");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: aiMessages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[BOT-CHAT] AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    console.log("[BOT-CHAT] AI response generated successfully");

    // Store assistant response
    await supabase.from("bot_messages").insert({
      conversation_id: currentConversationId,
      role: "assistant",
      content: assistantMessage
    });

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        conversation_id: currentConversationId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[BOT-CHAT] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
