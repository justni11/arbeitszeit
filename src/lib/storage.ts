import { STORAGE_PREFIX, WORKER_NAME_KEY, RECENT_LOCATIONS_KEY, MAX_RECENT_LOCATIONS } from './constants';
import type { MonthData } from './types';

function monthKey(year: number, month: number): string {
  return `${STORAGE_PREFIX}${year}_${String(month).padStart(2, '0')}`;
}

export function loadMonth(year: number, month: number): MonthData {
  try {
    const raw = localStorage.getItem(monthKey(year, month));
    if (raw) return JSON.parse(raw) as MonthData;
  } catch {
    // corrupted data — fall through to return empty
  }
  return { year, month, entries: {} };
}

export function saveMonth(data: MonthData): void {
  localStorage.setItem(monthKey(data.year, data.month), JSON.stringify(data));
}

export function setEntry(data: MonthData, entry: import('./types').DayEntry): MonthData {
  return { ...data, entries: { ...data.entries, [entry.date]: entry } };
}

export function deleteEntry(data: MonthData, dateKey: string): MonthData {
  const entries = { ...data.entries };
  delete entries[dateKey];
  return { ...data, entries };
}

export function loadWorkerName(): string {
  return localStorage.getItem(WORKER_NAME_KEY) ?? '';
}

export function saveWorkerName(name: string): void {
  localStorage.setItem(WORKER_NAME_KEY, name);
}

export function loadRecentLocations(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_LOCATIONS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return [];
}

export function saveRecentLocation(location: string): void {
  if (!location || location === 'Frei' || location === 'Feiertag') return;
  const current = loadRecentLocations();
  const updated = [location, ...current.filter(l => l !== location)].slice(0, MAX_RECENT_LOCATIONS);
  localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
}
