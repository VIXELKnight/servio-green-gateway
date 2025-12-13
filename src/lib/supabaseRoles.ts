import type { SupabaseClient } from '@supabase/supabase-js';

export async function isAdmin(supabase: SupabaseClient, userId?: string): Promise<boolean> {
  let uid = userId;
  if (!uid) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return false;
    uid = data.user.id;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', uid)
    .limit(1)
    .single();

  if (error || !data) return false;
  return data.role === 'admin';
}

export async function setRoleService(supabaseService: SupabaseClient, userId: string, role: 'admin' | 'user') {
  return supabaseService
    .from('user_roles')
    .upsert({ id: userId, role }, { onConflict: 'id' });
}
