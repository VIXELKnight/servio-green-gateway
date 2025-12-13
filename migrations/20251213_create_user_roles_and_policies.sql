CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "user_roles_admin_manage"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "contact_submissions_public_insert"
  ON public.contact_submissions
  FOR INSERT
  USING ( true )
  WITH CHECK ( true );

CREATE POLICY IF NOT EXISTS "contact_submissions_admin_select"
  ON public.contact_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "contact_submissions_admin_update"
  ON public.contact_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK ( true );

CREATE POLICY IF NOT EXISTS "contact_submissions_admin_delete"
  ON public.contact_submissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Optional seed placeholder (replace <USER_UUID_HERE> when ready)
-- INSERT INTO public.user_roles (id, role) VALUES ('<USER_UUID_HERE>', 'admin');
