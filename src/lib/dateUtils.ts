import { WOCHENTAG } from './constants';

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getWochentag(date: Date): string {
  return WOCHENTAG[date.getDay()];
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(2);
  return `${d}.${m}.${y}`;
}

/** Parses "08.00" or "15.30" → decimal hours (8.0, 15.5) */
export function parseTimeToDecimal(time: string): number {
  if (!time || !time.includes('.')) return 0;
  const [h, m] = time.split('.').map(Number);
  return h + (m || 0) / 60;
}

export function isWeekend(date: Date): { isSaturday: boolean; isSunday: boolean } {
  const day = date.getDay();
  return { isSaturday: day === 6, isSunday: day === 0 };
}

/** Format decimal hours as German string: 7.5 → "7,5", 14 → "14" */
export function formatDecimal(value: number): string {
  if (value === 0) return '';
  // Round to 2 decimal places to avoid floating point noise
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString().replace('.', ',');
}
