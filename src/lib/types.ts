export type Shift = {
  beginn: string;         // "08.00"
  ende: string;           // "15.30"
  arbeitsort: string;
  pause: number;          // hours
};

export type DayEntry = {
  date: string;           // "YYYY-MM-DD"
  arbeitsort: string;     // '' for a normal work day, or 'Frei' | 'Feiertag' | 'Urlaub'
  shifts: Shift[];        // work blocks for the day (empty for Frei/Feiertag/Urlaub)
  soFeiertag: boolean;
  uebernachtung: boolean;
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
