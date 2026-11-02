import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let publicClient: SupabaseClient<any> | null = null;

/**
 * Lightweight, stateless Supabase client for public queries (cars, landing page).
 * Bypasses Next.js cookies() so pages can take full advantage of ISR and Edge CDN caching.
 */
export function createPublicClient(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  if (!publicClient) {
    publicClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return publicClient;
}
