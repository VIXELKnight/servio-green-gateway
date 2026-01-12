import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InstagramMessage {
  mid: string;
  text: string;
}

interface InstagramWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: InstagramMessage;
    }>;
  }>;
}

// Send message via Instagram Messaging API
async function sendInstagramMessage(
  pageId: string,
  accessToken: string,
  recipientId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Instagram send error:", response.status, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending Instagram message:", error);
    return false;
  }
}

// Process message with bot logic
async function processWithBot(
  supabase: any,
  botId: string,
  message: string,
  visitorId: string,
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  
  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("id", botId)
    .single();

  if (!bot) {
    return { response: "Sorry, the bot is not available.", conversationId: "" };
  }

  let currentConversationId = conversationId;
  
  if (!currentConversationId) {
    const { data: newConv } = await supabase
      .from("bot_conversations")
      .insert({
        bot_id: botId,
        channel_type: "instagram",
        visitor_id: visitorId,
        visitor_name: "Instagram User",
      })
      .select()
      .single();

    currentConversationId = newConv?.id || "";
  }

  if (!currentConversationId) {
    return { response: "Sorry, couldn't start conversation.", conversationId: "" };
  }

  await supabase.from("bot_messages").insert({
    conversation_id: currentConversationId,
    role: "user",
    content: message,
  });

  const { data: history } = await supabase
    .from("bot_messages")
    .select("role, content")
    .eq("conversation_id", currentConversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const { data: knowledgeEntries } = await supabase
    .from("knowledge_base")
    .select("title, content")
    .eq("bot_id", botId)
    .limit(10);

  let knowledgeContext = "";
  if (knowledgeEntries && knowledgeEntries.length > 0) {
    knowledgeContext = "\n\nKnowledge Base:\n" + 
      knowledgeEntries.map((e: any) => `- ${e.title}: ${e.content}`).join("\n");
  }

  const systemPrompt = `${bot.instructions}
${knowledgeContext}

Guidelines:
1. Be helpful and friendly
2. Keep responses concise for Instagram DMs
3. Use emojis sparingly to match Instagram's tone
4. If complex, offer to connect with human: [ESCALATE: reason]`;

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
  ];

  if (!lovableApiKey) {
    return { response: "AI service not configured.", conversationId: currentConversationId };
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
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!aiResponse.ok) {
    console.error("AI error:", await aiResponse.text());
    return { response: "I'm having trouble responding. Please try again.", conversationId: currentConversationId };
  }

  const aiData = await aiResponse.json();
  let assistantMessage = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";

  const escalateMatch = assistantMessage.match(/\[ESCALATE:\s*(.+?)\]/i);
  if (escalateMatch) {
    assistantMessage = assistantMessage.replace(/\[ESCALATE:\s*.+?\]/gi, "").trim();
    assistantMessage += "\n\n📞 A team member will help you soon!";
    
    await supabase
      .from("bot_conversations")
      .update({ status: "escalated", escalation_reason: escalateMatch[1] })
      .eq("id", currentConversationId);
  }

  await supabase.from("bot_messages").insert({
    conversation_id: currentConversationId,
    role: "assistant",
    content: assistantMessage,
  });

  return { response: assistantMessage, conversationId: currentConversationId };
}

serve(async (req) => {
  const url = new URL(req.url);

  // Webhook verification (GET request from Meta)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log("Instagram webhook verification:", { mode, token, challenge });

    if (mode === "subscribe") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Verify token matches any Instagram channel config
      const { data: channels } = await supabase
        .from("bot_channels")
        .select("config")
        .eq("channel_type", "instagram")
        .eq("is_active", true);

      const validToken = channels?.some(ch => {
        const config = ch.config as Record<string, unknown>;
        return config?.webhook_verify_token === token;
      });

      if (validToken) {
        console.log("Instagram webhook verified");
        return new Response(challenge, { status: 200 });
      }
    }

    return new Response("Verification failed", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle incoming messages (POST)
  if (req.method === "POST") {
    try {
      const payload: InstagramWebhookPayload = await req.json();
      console.log("Instagram webhook payload:", JSON.stringify(payload).slice(0, 500));

      if (payload.object !== "instagram") {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      for (const entry of payload.entry) {
        const pageId = entry.id;

        // Find channel by page_id or instagram_account_id
        const { data: channels } = await supabase
          .from("bot_channels")
          .select("*, bots(*)")
          .eq("channel_type", "instagram")
          .eq("is_active", true);

        const matchedChannel = channels?.find(ch => {
          const config = ch.config as Record<string, unknown>;
          return config?.page_id === pageId || config?.instagram_account_id === pageId;
        });

        if (!matchedChannel) {
          console.error("No matching Instagram channel for page_id:", pageId);
          continue;
        }

        const config = matchedChannel.config as Record<string, unknown>;
        const accessToken = config?.access_token as string;
        const configPageId = (config?.page_id as string) || pageId;

        for (const messaging of entry.messaging || []) {
          if (!messaging.message?.text) continue;

          const senderId = messaging.sender.id;
          const messageText = messaging.message.text;

          // Skip if sender is our page (echo)
          if (senderId === configPageId) continue;

          console.log(`Processing Instagram message from ${senderId}: ${messageText.slice(0, 100)}`);

          // Check for existing conversation
          const { data: existingConv } = await supabase
            .from("bot_conversations")
            .select("id")
            .eq("bot_id", matchedChannel.bots.id)
            .eq("channel_type", "instagram")
            .eq("visitor_id", senderId)
            .neq("status", "closed")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { response } = await processWithBot(
            supabase,
            matchedChannel.bots.id,
            messageText,
            senderId,
            existingConv?.id
          );

          await sendInstagramMessage(configPageId, accessToken, senderId, response);
        }
      }

      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error("Instagram webhook error:", error);
      return new Response("Error", { status: 500, headers: corsHeaders });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
