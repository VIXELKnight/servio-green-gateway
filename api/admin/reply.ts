// Serverless function for Vercel/Netlify to send replies via SendGrid
// Required server env vars (server-only): SUPABASE_URL, SUPABASE_SERVICE_KEY, SENDGRID_API_KEY

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY required on the server.');
}

sgMail.setApiKey(SENDGRID_API_KEY ?? '');

const supabaseService = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_KEY ?? '');

async function getUserIdFromToken(token?: string | null) {
  if (!token) return null;
  try {
    const { data, error } = await supabaseService.auth.getUser(token ? { access_token: token } : undefined as any);
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
  const { data, error } = await supabaseService
    .from('user_roles')
    .select('role')
    .eq('id', userId)
    .limit(1)
    .single();
  if (error || !data) return false;
  return data.role === 'admin';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const userId = await getUserIdFromToken(token);
    if (!userId) return res.status(401).send('Unauthorized: invalid token');

    const admin = await isAdminUser(userId);
    if (!admin) return res.status(403).send('Forbidden: requires admin');

    const { submissionId, to_email, subject, body } = req.body;
    if (!submissionId || !to_email || !subject || !body) {
      return res.status(400).send('Missing required fields');
    }

    await sgMail.send({
      to: to_email,
      from: 'noreply@yourdomain.com',
      subject,
      text: body,
      html: `<pre>${body}</pre>`,
    });

    await supabaseService
      .from('contact_submissions')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
        responded_by: userId,
        reply_channel: 'email',
        reply_body: body,
      })
      .eq('id', submissionId);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal error');
  }
}
