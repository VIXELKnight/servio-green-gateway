import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, MessageSquare, User, Bot } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: string;
  created_at: string;
  bot_id: string;
}

interface BotInfo {
  id: string;
  name: string;
}

export function ChatTranscripts() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [bots, setBots] = useState<BotInfo[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [selectedBotId]);

  async function fetchData() {
    try {
      const { data: botsData } = await supabase.from("bots").select("id, name");
      if (botsData) {
        setBots(botsData);
      }
      await fetchConversations();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchConversations() {
    try {
      let query = supabase
        .from("bot_conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (selectedBotId !== "all") {
        query = query.eq("bot_id", selectedBotId);
      }

      const { data } = await query;
      if (data) {
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }

  async function loadMessages(conversation: Conversation) {
    setSelectedConversation(conversation);
    try {
      const { data } = await supabase
        .from("bot_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  function generateTranscriptText(): string {
    if (!selectedConversation || messages.length === 0) return "";

    const bot = bots.find(b => b.id === selectedConversation.bot_id);
    
    let transcript = `Chat Transcript\n`;
    transcript += `================\n\n`;
    transcript += `Bot: ${bot?.name || "Unknown"}\n`;
    transcript += `Visitor: ${selectedConversation.visitor_name || "Anonymous"}\n`;
    transcript += `Email: ${selectedConversation.visitor_email || "Not provided"}\n`;
    transcript += `Date: ${format(new Date(selectedConversation.created_at), "PPP 'at' p")}\n`;
    transcript += `Status: ${selectedConversation.status}\n\n`;
    transcript += `Messages:\n`;
    transcript += `---------\n\n`;

    messages.forEach(msg => {
      const time = format(new Date(msg.created_at), "HH:mm");
      const sender = msg.role === "assistant" ? "Bot" : "Visitor";
      transcript += `[${time}] ${sender}:\n${msg.content}\n\n`;
    });

    return transcript;
  }

  function downloadAsText() {
    const transcript = generateTranscriptText();
    if (!transcript) {
      toast.error("No messages to export");
      return;
    }

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${selectedConversation?.id.slice(0, 8)}-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded");
  }

  function downloadAsCSV() {
    if (!selectedConversation || messages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    const headers = ["Timestamp", "Role", "Content"];
    const rows = messages.map(msg => [
      format(new Date(msg.created_at), "yyyy-MM-dd HH:mm:ss"),
      msg.role === "assistant" ? "Bot" : "Visitor",
      `"${msg.content.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${selectedConversation.id.slice(0, 8)}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  async function downloadAllAsCSV() {
    setIsExporting(true);
    try {
      // Fetch all conversations
      let query = supabase.from("bot_conversations").select("*");
      if (selectedBotId !== "all") {
        query = query.eq("bot_id", selectedBotId);
      }
      const { data: allConversations } = await query;

      if (!allConversations || allConversations.length === 0) {
        toast.error("No conversations to export");
        return;
      }

      // Fetch all messages for these conversations
      const conversationIds = allConversations.map(c => c.id);
      const { data: allMessages } = await supabase
        .from("bot_messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true });

      const headers = ["Conversation ID", "Visitor Name", "Visitor Email", "Timestamp", "Role", "Content"];
      const rows: string[][] = [];

      allConversations.forEach(conv => {
        const convMessages = allMessages?.filter(m => m.conversation_id === conv.id) || [];
        convMessages.forEach(msg => {
          rows.push([
            conv.id,
            conv.visitor_name || "Anonymous",
            conv.visitor_email || "",
            format(new Date(msg.created_at), "yyyy-MM-dd HH:mm:ss"),
            msg.role === "assistant" ? "Bot" : "Visitor",
            `"${msg.content.replace(/"/g, '""')}"`,
          ]);
        });
      });

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-transcripts-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allConversations.length} conversations`);
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export transcripts");
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Chat Transcripts</CardTitle>
                <CardDescription>Export conversation history</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadAllAsCSV}
              disabled={isExporting || conversations.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedBotId} onValueChange={setSelectedBotId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by bot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bots</SelectItem>
              {bots.map(bot => (
                <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ScrollArea className="h-[400px]">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No conversations</p>
                <p className="text-sm text-muted-foreground">
                  Conversations will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">
                        {conv.visitor_name || "Anonymous Visitor"}
                      </p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {conv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(conv.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Transcript Preview</CardTitle>
            {selectedConversation && messages.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadAsText}>
                  <Download className="w-4 h-4 mr-1" />
                  TXT
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsCSV}>
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedConversation ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a conversation to preview
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Visitor</p>
                  <p className="text-sm font-medium">
                    {selectedConversation.visitor_name || "Anonymous"}
                  </p>
                  {selectedConversation.visitor_email && (
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.visitor_email}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === "assistant" ? "" : "flex-row-reverse"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === "assistant" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        {msg.role === "assistant" ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className={`flex-1 ${
                        msg.role === "assistant" ? "pr-8" : "pl-8"
                      }`}>
                        <div className={`p-3 rounded-lg ${
                          msg.role === "assistant"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
