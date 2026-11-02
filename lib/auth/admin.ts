/**
 * Authorized Admin Emails for Vulpi Platform Oversight.
 * Supports primary admin (vulpi.cdo@gmail.com), legacy fallback, and custom ADMIN_EMAIL env var.
 */
export const DEFAULT_ADMIN_EMAILS = [
  'vulpi.cdo@gmail.com',
  'admin@vulpi.ph',
];

export function getAdminEmails(): string[] {
  const envAdmin = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const list = [...DEFAULT_ADMIN_EMAILS];
  if (envAdmin && !list.includes(envAdmin)) {
    list.push(envAdmin);
  }
  return list;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return getAdminEmails().includes(normalized);
}
