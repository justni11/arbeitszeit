export type DayEntry = {
  date: string;           // "YYYY-MM-DD"
  beginn: string;         // "08.00"
  ende: string;           // "15.30"
  arbeitsort: string;
  soFeiertag: boolean;
  uebernachtung: boolean;
  pause: number;          // hours
  spesen: number;         // euros
};

export type MonthData = {
  year: number;
  month: number;          // 1–12
  entries: Record<string, DayEntry>; // keyed by "YYYY-MM-DD"
};

export type MonthTotals = {
  arbeitszeitSum: number;
  soFeiertageCount: number;
  uebernachtungCount: number;
  pauseSum: number;
  spesenSum: number;
  gesamtStunden: number;
};
