import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

let publicClient: SupabaseClient<any> | null = null;

/**
 * Lightweight, stateless Supabase client for public queries (cars, landing page).
 * Bypasses Next.js cookies() so pages can take full advantage of ISR and Edge CDN caching.
 */
export function createPublicClient(): SupabaseClient<any> {
  if (!publicClient) {
    publicClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return publicClient;
}
