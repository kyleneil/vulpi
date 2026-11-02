import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export function createAdminClient(): SupabaseClient<any> {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isPlaceholder = !rawKey || rawKey.includes('your-') || rawKey.length < 30;
  const serviceRoleKey = !isPlaceholder ? rawKey! : SUPABASE_ANON_KEY;

  return createSupabaseClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
