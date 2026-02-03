import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2, CalendarIcon, Send, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScheduledMessage {
  id: string;
  bot_id: string;
  conversation_id: string | null;
  content: string;
  scheduled_for: string;
  status: string;
  created_at: string;
}

interface Bot {
  id: string;
  name: string;
}

export function ScheduledMessages() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New message form
  const [newMessage, setNewMessage] = useState({
    bot_id: "",
    content: "",
    scheduled_date: new Date(),
    scheduled_time: "09:00",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [messagesResult, botsResult] = await Promise.all([
        supabase
          .from("scheduled_messages")
          .select("*")
          .order("scheduled_for", { ascending: true }),
        supabase.from("bots").select("id, name"),
      ]);

      if (messagesResult.data) {
        setMessages(messagesResult.data);
      }
      if (botsResult.data) {
        setBots(botsResult.data);
        if (botsResult.data.length > 0 && !newMessage.bot_id) {
          setNewMessage(prev => ({ ...prev, bot_id: botsResult.data[0].id }));
        }
      }
    } catch (error) {
      console.error("Error fetching scheduled messages:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!newMessage.content.trim() || !newMessage.bot_id) {
      toast.error("Please fill in all fields");
      return;
    }

    const scheduledFor = new Date(newMessage.scheduled_date);
    const [hours, minutes] = newMessage.scheduled_time.split(":");
    scheduledFor.setHours(parseInt(hours), parseInt(minutes));

    if (scheduledFor <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    try {
      const { error } = await supabase.from("scheduled_messages").insert({
        bot_id: newMessage.bot_id,
        content: newMessage.content,
        scheduled_for: scheduledFor.toISOString(),
      });

      if (error) throw error;

      toast.success("Message scheduled successfully");
      setNewMessage({
        bot_id: bots[0]?.id || "",
        content: "",
        scheduled_date: new Date(),
        scheduled_time: "09:00",
      });
      setIsCreating(false);
      fetchData();
    } catch (error) {
      console.error("Error scheduling message:", error);
      toast.error("Failed to schedule message");
    }
  }

  async function handleCancel(id: string) {
    try {
      const { error } = await supabase
        .from("scheduled_messages")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
      toast.success("Message cancelled");
      fetchData();
    } catch (error) {
      console.error("Error cancelling message:", error);
      toast.error("Failed to cancel message");
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("scheduled_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Message deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "sent":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "cancelled":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const pendingMessages = messages.filter(m => m.status === "pending");
  const pastMessages = messages.filter(m => m.status !== "pending");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Scheduled Messages</CardTitle>
                <CardDescription>Schedule automated messages for your bots</CardDescription>
              </div>
            </div>
            <Button onClick={() => setIsCreating(true)} disabled={bots.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Message
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isCreating && (
            <Card className="mb-6 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">New Scheduled Message</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bot</label>
                    <Select
                      value={newMessage.bot_id}
                      onValueChange={(value) => setNewMessage(prev => ({ ...prev, bot_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bot" />
                      </SelectTrigger>
                      <SelectContent>
                        {bots.map(bot => (
                          <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={newMessage.scheduled_time}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newMessage.scheduled_date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newMessage.scheduled_date}
                        onSelect={(date) => date && setNewMessage(prev => ({ ...prev, scheduled_date: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Enter the message content..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Schedule Message
                </Button>
              </CardContent>
            </Card>
          )}

          {bots.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">No bots available</p>
              <p className="text-sm text-muted-foreground">
                Create a bot first to schedule messages
              </p>
            </div>
          ) : pendingMessages.length === 0 && !isCreating ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">No scheduled messages</p>
              <p className="text-sm text-muted-foreground">
                Schedule messages to be sent automatically
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMessages.map(message => (
                <div
                  key={message.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {bots.find(b => b.id === message.bot_id)?.name || "Unknown Bot"}
                      </p>
                      <Badge variant="outline" className={getStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {message.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scheduled for {format(new Date(message.scheduled_for), "PPP 'at' p")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancel(message.id)}
                      className="text-muted-foreground hover:text-amber-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(message.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pastMessages.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Past Messages</h4>
              <div className="space-y-2">
                {pastMessages.slice(0, 5).map(message => (
                  <div
                    key={message.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <Badge variant="outline" className={getStatusColor(message.status)}>
                      {message.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {message.content}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(message.scheduled_for), "MMM d")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
