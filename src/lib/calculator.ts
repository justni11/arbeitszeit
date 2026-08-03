import { parseTimeToDecimal } from './dateUtils';
import type { DayEntry, MonthData, MonthTotals } from './types';

export function calcArbeitszeit(
  beginn: string,
  ende: string,
  pause: number,
  arbeitsort: string
): number {
  if (arbeitsort === 'Feiertag' || arbeitsort === 'Urlaub') return 8;
  if (!beginn || !ende) return 0;

  let start = parseTimeToDecimal(beginn);
  let end = parseTimeToDecimal(ende);

  // Overnight shift: end is next morning
  if (end <= start) {
    end += 24;
  }

  const worked = end - start - pause;
  return Math.max(0, Math.round(worked * 100) / 100);
}

/** True when ende falls on the next calendar day relative to beginn (e.g. 18.00 -> 03.00). */
export function isOvernightShift(beginn: string, ende: string): boolean {
  if (!beginn || !ende) return false;
  return parseTimeToDecimal(ende) <= parseTimeToDecimal(beginn);
}

export function calcTotals(data: MonthData): MonthTotals {
  let arbeitszeitSum = 0;
  let soFeiertageCount = 0;
  let uebernachtungCount = 0;
  let pauseSum = 0;
  let spesenSum = 0;

  for (const entry of Object.values(data.entries)) {
    const az = calcArbeitszeit(entry.beginn, entry.ende, entry.pause, entry.arbeitsort);
    arbeitszeitSum += az;
    if (entry.soFeiertag) soFeiertageCount++;
    if (entry.uebernachtung) uebernachtungCount++;
    pauseSum += entry.pause || 0;
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
