import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

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
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    if (!replyBody.trim()) {
      setError('Please enter a reply.');
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
          subject: `Re: your message to us`,
          body: replyBody,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to send reply');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      onSent();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="reply-title" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 20, maxWidth: 800, width: '100%' }}>
        <h2 id="reply-title">Reply to {submission.name} ({submission.email})</h2>
        <p>Original message:</p>
        <blockquote>{submission.message}</blockquote>

        <label>
          Your reply
          <textarea rows={8} value={replyBody} onChange={e => setReplyBody(e.target.value)} style={{ width: '100%' }} />
        </label>

        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

        <div style={{ marginTop: 12 }}>
          <button onClick={handleSend} disabled={sending}>{sending ? 'Sending…' : 'Send reply'}</button>
          <button onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
