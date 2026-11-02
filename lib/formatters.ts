import { differenceInCalendarDays, parseISO, format } from 'date-fns';

export function formatPHP(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rate on request';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates rental days inclusive of both start and end dates.
 * Example: Oct 1 to Oct 3 is 3 days (Oct 1, Oct 2, Oct 3).
 */
export function calculateRentalDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const diff = differenceInCalendarDays(end, start);
  return Math.max(1, diff + 1);
}

export function formatDatePH(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = parseISO(dateStr);
    return format(d, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateRangePH(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return '';
  try {
    const s = parseISO(startStr);
    const e = parseISO(endStr);
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  } catch {
    return `${startStr} – ${endStr}`;
  }
}

export function formatPhonePH(phone: string): string {
  // Normalize Philippine mobile numbers (+63 9XX XXX XXXX)
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    return `+63 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith('09') && cleaned.length === 11) {
    return `+63 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}
