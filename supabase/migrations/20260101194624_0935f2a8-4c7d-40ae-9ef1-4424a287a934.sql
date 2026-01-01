-- Add response-tracking fields to contact submissions (if missing)
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'unread',
  ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS responded_by uuid,
  ADD COLUMN IF NOT EXISTS reply_channel text,
  ADD COLUMN IF NOT EXISTS reply_body text;

-- Helpful index for filtering/sorting by status
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions (status);
