import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
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

    // Build system prompt
    const systemPrompt = `${bot.instructions}
${knowledgeContext}

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
      metadata: { escalated: shouldEscalate }
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

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        conversation_id: currentConversationId,
        escalated: shouldEscalate
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
