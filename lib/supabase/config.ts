/**
 * Centralized Supabase Configuration.
 * Resilient against missing NEXT_PUBLIC_ prefix, trailing slashes, and accidental spaces in Vercel.
 */

export const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://lmpacnlknaklqivncyav.supabase.co'
)
  .trim()
  .replace(/\/+$/, '');

export const SUPABASE_ANON_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_VVjOubujaQL_Yv4M9w-JzA_43A3FVxC'
).trim();
