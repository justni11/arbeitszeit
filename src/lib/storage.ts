import { STORAGE_PREFIX, WORKER_NAME_KEY, RECENT_LOCATIONS_KEY, MAX_RECENT_LOCATIONS, DEFAULT_PAUSE } from './constants';
import type { DayEntry, MonthData } from './types';

function monthKey(year: number, month: number): string {
  return `${STORAGE_PREFIX}${year}_${String(month).padStart(2, '0')}`;
}

/** Upgrades entries saved before multi-shift support (single top-level beginn/ende/pause) to the shifts[] shape. */
function normalizeEntry(raw: any): DayEntry {
  if (Array.isArray(raw?.shifts)) return raw as DayEntry;

  const legacyBeginn = raw?.beginn ?? '';
  const legacyEnde = raw?.ende ?? '';
  const shifts = legacyBeginn || legacyEnde
    ? [{ beginn: legacyBeginn, ende: legacyEnde, arbeitsort: raw?.arbeitsort ?? '', pause: raw?.pause ?? DEFAULT_PAUSE }]
    : [];

  return {
    date: raw.date,
    arbeitsort: shifts.length ? '' : (raw?.arbeitsort ?? ''),
    shifts,
    soFeiertag: !!raw?.soFeiertag,
    uebernachtung: !!raw?.uebernachtung,
    spesen: raw?.spesen ?? 0,
  };
}

function normalizeMonth(data: MonthData): MonthData {
  const entries: Record<string, DayEntry> = {};
  for (const [key, entry] of Object.entries(data.entries)) {
    entries[key] = normalizeEntry(entry);
  }
  return { ...data, entries };
}

export function loadMonth(year: number, month: number): MonthData {
  try {
    const raw = localStorage.getItem(monthKey(year, month));
    if (raw) return normalizeMonth(JSON.parse(raw) as MonthData);
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

type BackupPayload = {
  version: 1;
  exportedAt: string;
  workerName: string;
  recentLocations: string[];
  months: Record<string, MonthData>; // key = "YYYY_MM", matches monthKey() minus the prefix
};

function createBackup(): BackupPayload {
  const months: Record<string, MonthData> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    try {
      months[key.slice(STORAGE_PREFIX.length)] = JSON.parse(localStorage.getItem(key)!) as MonthData;
    } catch {
      // skip corrupted month entry
    }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    workerName: loadWorkerName(),
    recentLocations: loadRecentLocations(),
    months,
  };
}

export function downloadBackup(): void {
  const json = JSON.stringify(createBackup(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arbeitszeit_sicherung_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Restores a backup produced by downloadBackup(). Throws if the file isn't a valid backup. */
export function restoreBackup(json: string): void {
  const parsed = JSON.parse(json) as Partial<BackupPayload>;
  if (!parsed || typeof parsed !== 'object' || typeof parsed.months !== 'object' || !parsed.months) {
    throw new Error('Ungültige Sicherungsdatei');
  }
  for (const [key, data] of Object.entries(parsed.months)) {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  }
  if (typeof parsed.workerName === 'string') saveWorkerName(parsed.workerName);
  if (Array.isArray(parsed.recentLocations)) {
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(parsed.recentLocations));
  }
}
