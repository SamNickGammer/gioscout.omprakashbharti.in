import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN').format(n);
}

/** Guards against scraper noise (e.g. a rating like "4.3(9,415)") in the category. */
export function displayCategory(category: string | null | undefined): string {
  if (!category) return 'Uncategorized';
  if (/\(\s*\d[\d,]*\s*\)/.test(category) || /^\d(\.\d)?/.test(category)) return 'Uncategorized';
  return category;
}

/** Hides opening-hours text that may have leaked into the address field. */
export function isHoursText(s: string | null | undefined): boolean {
  if (!s) return false;
  return (
    /\b(open|opens|closed|closes|24\s*hours)\b/i.test(s) ||
    /\b\d{1,2}(:\d{2})?\s*[ap]\.?m\.?\b/i.test(s)
  );
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
