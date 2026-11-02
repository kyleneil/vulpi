import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

export function createAdminClient(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isPlaceholder = !rawKey || rawKey.includes('your-') || rawKey.length < 30;
  const serviceRoleKey = !isPlaceholder
    ? rawKey!
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key');

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
