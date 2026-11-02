import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export function createClient(): SupabaseClient<any> {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
