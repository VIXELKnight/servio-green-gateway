import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  type: string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: WhatsAppMessage[];
      };
      field: string;
    }>;
  }>;
}

// Send message via WhatsApp Cloud API
async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  recipientPhone: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("WhatsApp send error:", response.status, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

// Process message with bot-chat logic
async function processWithBot(
  supabase: any,
  botId: string,
  message: string,
  visitorId: string,
  visitorName: string,
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  
  // Get bot info
  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("id", botId)
    .single();

  if (!bot) {
    return { response: "Sorry, the bot is not available.", conversationId: "" };
  }

  // Get or create conversation
  let currentConversationId = conversationId;
  
  if (!currentConversationId) {
    const { data: newConv } = await supabase
      .from("bot_conversations")
      .insert({
        bot_id: botId,
        channel_type: "whatsapp",
        visitor_id: visitorId,
        visitor_name: visitorName,
      })
      .select()
      .single();

    currentConversationId = newConv?.id || "";
  }

  if (!currentConversationId) {
    return { response: "Sorry, couldn't start conversation.", conversationId: "" };
  }

  // Store user message
  await supabase.from("bot_messages").insert({
    conversation_id: currentConversationId,
    role: "user",
    content: message,
  });

  // Get conversation history
  const { data: history } = await supabase
    .from("bot_messages")
    .select("role, content")
    .eq("conversation_id", currentConversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  // Get knowledge base
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
1. Be helpful and professional
2. Keep responses concise for WhatsApp
3. If complex, offer to connect with human: [ESCALATE: reason]`;

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
  ];

  // Call AI
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

  // Handle escalation
  const escalateMatch = assistantMessage.match(/\[ESCALATE:\s*(.+?)\]/i);
  if (escalateMatch) {
    assistantMessage = assistantMessage.replace(/\[ESCALATE:\s*.+?\]/gi, "").trim();
    assistantMessage += "\n\n📞 A team member will assist you shortly.";
    
    await supabase
      .from("bot_conversations")
      .update({ status: "escalated", escalation_reason: escalateMatch[1] })
      .eq("id", currentConversationId);
  }

  // Store response
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

    console.log("Webhook verification:", { mode, token, challenge });

    if (mode === "subscribe") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Find channel with matching verify token
      const { data: channels } = await supabase
        .from("bot_channels")
        .select("config")
        .eq("channel_type", "whatsapp")
        .eq("is_active", true);

      const validToken = channels?.some(ch => {
        const config = ch.config as Record<string, unknown>;
        return config?.webhook_verify_token === token;
      });

      if (validToken) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }
    }

    return new Response("Verification failed", { status: 403 });
  }

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle incoming messages (POST)
  if (req.method === "POST") {
    try {
      const payload: WhatsAppWebhookPayload = await req.json();
      console.log("WhatsApp webhook payload:", JSON.stringify(payload).slice(0, 500));

      if (payload.object !== "whatsapp_business_account") {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== "messages") continue;
          
          const value = change.value;
          const phoneNumberId = value.metadata.phone_number_id;
          const messages = value.messages || [];
          const contacts = value.contacts || [];

          // Find channel by phone_number_id
          const { data: channels } = await supabase
            .from("bot_channels")
            .select("*, bots(*)")
            .eq("channel_type", "whatsapp")
            .eq("is_active", true);

          const matchedChannel = channels?.find(ch => {
            const config = ch.config as Record<string, unknown>;
            return config?.phone_number_id === phoneNumberId;
          });

          if (!matchedChannel) {
            console.error("No matching WhatsApp channel for phone_number_id:", phoneNumberId);
            continue;
          }

          const config = matchedChannel.config as Record<string, unknown>;
          const accessToken = config?.access_token as string;

          for (const msg of messages) {
            if (msg.type !== "text" || !msg.text?.body) continue;

            const senderPhone = msg.from;
            const senderName = contacts.find(c => c.wa_id === senderPhone)?.profile?.name || "WhatsApp User";
            const messageText = msg.text.body;

            console.log(`Processing message from ${senderName}: ${messageText.slice(0, 100)}`);

            // Check for existing conversation
            const { data: existingConv } = await supabase
              .from("bot_conversations")
              .select("id")
              .eq("bot_id", matchedChannel.bots.id)
              .eq("channel_type", "whatsapp")
              .eq("visitor_id", senderPhone)
              .neq("status", "closed")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            // Process with bot
            const { response } = await processWithBot(
              supabase,
              matchedChannel.bots.id,
              messageText,
              senderPhone,
              senderName,
              existingConv?.id
            );

            // Send response
            await sendWhatsAppMessage(phoneNumberId, accessToken, senderPhone, response);
          }
        }
      }

      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error("WhatsApp webhook error:", error);
      return new Response("Error", { status: 500, headers: corsHeaders });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
