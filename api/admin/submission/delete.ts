import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getUserIdFromToken(token?: string | null) {
  if (!token) return null;
  try {
    const { data, error } = await supabaseService.auth.getUser({ access_token: token } as any);
    if (error) {
      console.error('getUser error', error);
      return null;
    }
    return data?.user?.id ?? null;
  } catch (err) {
    console.error('Failed to get user from token', err);
    return null;
  }
}

async function isAdminUser(userId: string | null) {
  if (!userId) return false;
  try {
    // try canonical user_id first
    const { data: byUserId, error: err1 } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(1)
      .single();
    if (!err1 && byUserId) return byUserId.role === 'admin';

    // fallback to id
    const { data: byId, error: err2 } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('id', userId)
      .limit(1)
      .single();
    if (!err2 && byId) return byId.role === 'admin';

    return false;
  } catch (err) {
    console.error('isAdminUser error', err);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = (req.headers.authorization as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = await getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: 'Unauthorized: invalid token' });

  const admin = await isAdminUser(userId);
  if (!admin) return res.status(403).json({ error: 'Forbidden: requires admin' });

  const id = (req.query.id as string) || (req.body && req.body.id);
  if (!id) return res.status(400).json({ error: 'Missing submission id' });

  try {
    const { error } = await supabaseService.from('contact_submissions').delete().eq('id', id);
    if (error) {
      console.error('Delete error', error);
      return res.status(500).json({ error: 'Failed to delete submission' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unhandled delete error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
