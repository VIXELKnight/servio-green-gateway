````markdown
# Admin Inbox (Vite + React)

Overview
- Adds an admin inbox UI at /admin (protected) to view contact_submissions and reply via SendGrid.
- Adds response fields to contact_submissions: responded_at, responded_by, reply_channel, reply_body, status.
- Adds a serverless function to send replies (api/admin/reply).

Env variables
- Frontend (client-side):
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- Server (serverless function / deployment environment):
  - SUPABASE_URL (same as NEXT_PUBLIC_SUPABASE_URL)
  - SUPABASE_SERVICE_KEY (service role key - DO NOT EXPOSE)
  - SENDGRID_API_KEY

Routing (react-router-dom v6)
- Add the Admin page to your routes (example):

```tsx
// in your routes setup, e.g., src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminPage from './pages/Admin';
import Home from './pages/Home';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminPage />} />
        {/* other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

Serverless function
- The serverless function is at api/admin/reply (TypeScript). Deploy to your serverless platform (Vercel, Netlify functions, etc.) and configure the server env vars.
- The function expects a Bearer token in Authorization header (the admin user's access token). It validates the user's admin role using the service key, sends email via SendGrid, and updates the contact_submissions row.

Seeding an admin
- To add an admin, run (with service role or DB editor):
```sql
INSERT INTO public.user_roles (id, role) VALUES ('<USER_UUID_HERE>', 'admin');
```

Notes
- Make sure the FROM address used with SendGrid is a verified sender.
- If token verification using supabaseService.auth.getUser({ access_token }) doesn't work with your supabase-js version, replace the verification step with your preferred approach (for example calling the Auth `user` endpoint directly or verifying JWTs).
````
