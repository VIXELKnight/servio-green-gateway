import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, User, Mail, MessageSquare } from "lucide-react";

type Props = {
  submission: {
    id: string;
    name: string;
    email: string;
    message: string;
  };
  onClose: () => void;
  onSent: () => void;
};

export default function ReplyModal({ submission, onClose, onSent }: Props) {
  const [subject, setSubject] = useState(`Re: Your inquiry to Servio`);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  async function handleSend() {
    if (!replyBody.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error: fnError } = await supabase.functions.invoke('send-reply', {
        body: {
          submissionId: submission.id,
          to_email: submission.email,
          subject: subject,
          body: replyBody,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to send reply');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Reply sent",
        description: `Your response has been sent to ${submission.email}`,
      });
      onSent();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || 'Failed to send reply.',
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Reply to Message
          </DialogTitle>
          <DialogDescription>
            Send a response to {submission.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Message Card */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{submission.name}</span>
              <span className="text-muted-foreground">({submission.email})</span>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {submission.message}
              </p>
            </div>
          </div>

          {/* Reply Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={submission.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply">Your Reply</Label>
              <Textarea
                id="reply"
                rows={6}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Type your response here..."
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
