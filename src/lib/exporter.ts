import { MONTH_NAMES } from './constants';
import { getDaysInMonth, getWochentag, toDateKey, formatDate, formatDecimal } from './dateUtils';
import { calcArbeitszeit } from './calculator';
import type { MonthData } from './types';

export function exportCSV(data: MonthData): void {
  const days = getDaysInMonth(data.year, data.month);
  const monthName = MONTH_NAMES[data.month - 1];

  const headers = ['Datum', 'Tag', 'Beginn', 'Ende', 'Arbeitsort', 'Arbeitszeit', 'So+Feiertag', 'Übernachtung', 'Pause', 'Spesen'];
  const rows: string[][] = [headers];

  for (const day of days) {
    const key = toDateKey(day);
    const entry = data.entries[key];
    if (!entry) {
      rows.push([formatDate(day), getWochentag(day), '', '', '', '', '', '', '', '']);
    } else {
      const az = calcArbeitszeit(entry.beginn, entry.ende, entry.pause, entry.arbeitsort);
      rows.push([
        formatDate(day),
        getWochentag(day),
        entry.beginn,
        entry.ende,
        entry.arbeitsort,
        formatDecimal(az).replace(',', '.'),
        entry.soFeiertag ? 'X' : '',
        entry.uebernachtung ? 'X' : '',
        entry.pause ? String(entry.pause) : '',
        entry.spesen ? String(entry.spesen) : '',
      ]);
    }
  }

  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IBO_TRAFFIC_${monthName}_${data.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
