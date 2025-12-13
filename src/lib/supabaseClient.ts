import { createClient } from '@supabase/supabase-js';

// Use NEXT_PUBLIC_* for Next.js or VITE_* for Vite
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or Anon Key. Set NEXT_PUBLIC_* or VITE_* environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);