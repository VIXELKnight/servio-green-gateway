import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { isAdmin } from '../lib/supabaseRoles';
import Inbox from '../components/Admin/Inbox';

export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        if (!user) {
          navigate('/', { replace: true });
          return;
        }
        const admin = await isAdmin(supabase, user.id);
        if (!admin) {
          navigate('/', { replace: true });
          return;
        }
        setOk(true);
      } catch (err) {
        console.error('Admin route auth check failed', err);
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [navigate]);

  if (loading) return <div>Loading…</div>;
  if (!ok) return null;

  return (
    <main>
      <h1>Admin Inbox</h1>
      <Inbox />
    </main>
  );
}
