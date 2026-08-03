import { parseTimeToDecimal } from './dateUtils';
import type { DayEntry, MonthData, MonthTotals, Shift } from './types';

/** Hours worked in a single shift, handling overnight shifts (ende <= beginn means next day). */
export function calcShiftHours(beginn: string, ende: string): number {
  if (!beginn || !ende) return 0;
  let start = parseTimeToDecimal(beginn);
  let end = parseTimeToDecimal(ende);
  if (end <= start) end += 24;
  return end - start;
}

/** True when a shift's ende falls on the next calendar day relative to its beginn (e.g. 18.00 -> 03.00). */
export function isOvernightShift(beginn: string, ende: string): boolean {
  if (!beginn || !ende) return false;
  return parseTimeToDecimal(ende) <= parseTimeToDecimal(beginn);
}

export function calcArbeitszeit(entry: Pick<DayEntry, 'arbeitsort' | 'shifts'> | null | undefined): number {
  if (!entry) return 0;
  if (entry.arbeitsort === 'Feiertag' || entry.arbeitsort === 'Urlaub') return 8;

  let worked = 0;
  for (const shift of entry.shifts) {
    worked += calcShiftHours(shift.beginn, shift.ende) - (shift.pause || 0);
  }
  return Math.max(0, Math.round(worked * 100) / 100);
}

export function shiftPauseSum(shifts: Shift[]): number {
  return shifts.reduce((sum, s) => sum + (s.pause || 0), 0);
}

export function calcTotals(data: MonthData): MonthTotals {
  let arbeitszeitSum = 0;
  let soFeiertageCount = 0;
  let uebernachtungCount = 0;
  let pauseSum = 0;
  let spesenSum = 0;

  for (const entry of Object.values(data.entries)) {
    arbeitszeitSum += calcArbeitszeit(entry);
    if (entry.soFeiertag) soFeiertageCount++;
    if (entry.uebernachtung) uebernachtungCount++;
    pauseSum += shiftPauseSum(entry.shifts);
    spesenSum += entry.spesen || 0;
  }

  arbeitszeitSum = Math.round(arbeitszeitSum * 100) / 100;
  pauseSum = Math.round(pauseSum * 100) / 100;
  const gesamtStunden = Math.round((arbeitszeitSum - pauseSum) * 100) / 100;

  return {
    arbeitszeitSum,
    soFeiertageCount,
    uebernachtungCount,
    pauseSum,
    spesenSum,
    gesamtStunden,
  };
}
