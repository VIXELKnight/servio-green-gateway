````markdown
# Roles & RLS for contact_submissions

Summary:
- A `user_roles` table determines which users are 'admin' vs 'user'.
- Row Level Security is enabled on `user_roles` and `contact_submissions`.
- Policies:
  - Anyone (authenticated or anonymous) may INSERT contact_submissions (so public contact form works).
  - Only users with a row in `user_roles` where role = 'admin' can SELECT/UPDATE/DELETE contact_submissions.
  - `user_roles` management is restricted to admins (and service role used by migrations/scripts).

Deployment notes:
- Apply migrations using your normal migration process or via Supabase SQL editor.
- To add an admin, run (with service role or via SQL editor):
  ```sql
  INSERT INTO public.user_roles (id, role) VALUES ('<USER_UUID_HERE>', 'admin');
  ```
- Enable "Leaked Password Protection" in the Supabase Dashboard under Authentication -> Settings -> Leaked password protection.

Testing:
- Verify public form submission still works (anonymous INSERT).
- Sign in as an admin (user with role='admin') and confirm you can SELECT contact_submissions.
- Sign in as a normal user and confirm you cannot SELECT contact_submissions.

````
