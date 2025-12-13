-- Add response fields and status to contact_submissions
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_channel TEXT,
  ADD COLUMN IF NOT EXISTS reply_body TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('unread','responded')) DEFAULT 'unread';

-- (Optional) Add index to speed up admin queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions (status);
