import { createClient } from "npm:@supabase/supabase-js@2";

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

    // Get knowledge base entries
    const { data: knowledgeEntries } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .eq("bot_id", bot.id)
      .limit(10);

    let knowledgeContext = "";
    if (knowledgeEntries && knowledgeEntries.length > 0) {
      knowledgeContext = "\n\nKnowledge Base:\n" + 
        knowledgeEntries.map(e => `- ${e.title}: ${e.content}`).join("\n");
    }

    const systemPrompt = `You are an AI customer service assistant.

INSTRUCTIONS:
${bot.instructions}
${knowledgeContext}

Be helpful, professional, and concise. If you cannot help, say so clearly.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(m => ({ role: m.role, content: m.content }))
    ];

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
      return new Response(
        JSON.stringify({ error: "Failed to generate response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

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
    console.error("Bot chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
