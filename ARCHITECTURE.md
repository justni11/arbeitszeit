# Architecture & Technical Plan

## Principles Applied

### KISS — Keep It Simple, Stupid
- No backend, no database, no authentication. localStorage is sufficient for one user.
- No over-abstraction. The app has one screen: a monthly table. Keep it that way.
- Time inputs store as plain strings ("08.00") matching the paper form exactly.

### SOLID
- **S — Single Responsibility**: `storage`, `calculator`, `dateUtils`, and `exporter` are separate modules. Each does exactly one thing.
- **O — Open/Closed**: Adding a new export format (e.g., PDF via jsPDF) does not require touching `calculator` or `storage`.
- **L — Liskov / I — Interface Segregation**: Not heavily class-based; modules expose minimal, stable function interfaces.
- **D — Dependency Inversion**: UI components never call `localStorage` directly — they go through `storage.ts`.

### DRY
- Time parsing, decimal hour calculation, and Wochentag lookup each live in exactly one place.

### YAGNI
- No config for things that don't change (Spesen default = 28, Pause default = 1 are constants, not settings).
- No multi-user support until actually needed.

---

## Tech Stack

| Concern       | Choice                  | Reason |
|---------------|-------------------------|--------|
| Framework     | **Svelte + Vite**       | Compiles to minimal plain JS; fast on mobile; no runtime overhead |
| Styling       | **Plain CSS** (custom properties) | No framework bloat; easy print overrides |
| Storage       | **localStorage**        | No server needed; survives refresh; simple key-value |
| Export        | **Browser print CSS**   | No dependency; worker uses Ctrl+P or print button |
| Optional export | **CSV via Blob URL**  | Zero-dependency, works offline |
| Build         | **Vite**                | Fast HMR, minimal config |

---

## Data Model

```ts
// One entry per calendar day
type DayEntry = {
  date: string;           // "YYYY-MM-DD" — primary key
  beginn: string;         // "08.00" — dot format matching the paper form
  ende: string;           // "15.30"
  arbeitsort: string;     // Free text. Special: "Frei", "Feiertag"
  soFeiertag: boolean;    // So + Feiertag checkbox
  uebernachtung: boolean; // Übernachtung checkbox
  pause: number;          // Hours (usually 1)
  spesen: number;         // Euros (usually 28 when uebernachtung = true)
  // NOTE: arbeitszeit is NOT stored — it is always derived:
  //   arbeitszeit = parseTime(ende) - parseTime(beginn) - pause
  //   Exception: if arbeitsort === "Feiertag", arbeitszeit = 8
};

type MonthData = {
  year: number;
  month: number;        // 1–12
  workerName: string;   // Stored here too for print header
  entries: Record<string, DayEntry>; // keyed by "YYYY-MM-DD"
};

type MonthTotals = {
  arbeitszeitSum: number;   // Sum of all Arbeitszeit (decimal hours)
  soFeiertageCount: number; // Count of days with soFeiertag = true
  uebernachtungCount: number;
  pauseSum: number;
  spesenSum: number;
  gesamtStunden: number;    // arbeitszeitSum - pauseSum
};
```

---

## Module Structure

```
src/
  lib/
    dateUtils.ts    -- getDaysInMonth, getWochentag, parseTime, formatDecimal
    calculator.ts   -- calcArbeitszeit, calcTotals
    storage.ts      -- loadMonth, saveMonth, loadWorkerName, saveWorkerName
    exporter.ts     -- exportCSV
    constants.ts    -- DEFAULT_PAUSE = 1, DEFAULT_SPESEN = 28, WOCHENTAG_MAP
  components/
    MonthView.svelte      -- the full table; owns edit state
    DayRow.svelte         -- display-only row; emits "edit" event
    DayEditor.svelte      -- inline/modal form for one day; emits "save" / "cancel"
    MonthNavigation.svelte -- prev/next month + month/year display
    SummaryRow.svelte     -- footer totals row
    PrintHeader.svelte    -- name, month, year, company logo (print only)
  App.svelte        -- root; owns current month, worker name, storage calls
  main.ts           -- entry point
```

---

## Key Calculations

### Arbeitszeit (decimal hours)
```
parseTime("08.00") → 8.0
parseTime("15.30") → 15.5   // 30 min = 0.5 h
parseTime("05.30") → 5.5    // handles overnight: if ende < beginn, add 24

arbeitszeit = parseTime(ende) - parseTime(beginn) - pause
// Special case: arbeitsort === "Feiertag" → arbeitszeit = 8 (fixed)
// Special case: arbeitsort === "Frei" → arbeitszeit = 0 (no entry)
```

### Overnight Detection
```
if (parseTime(ende) <= parseTime(beginn)) {
  // Shift crosses midnight
  arbeitszeit = (24 - parseTime(beginn)) + parseTime(ende) - pause
}
```

### Monthly Totals
```
arbeitszeitSum    = Σ arbeitszeit for all filled days
soFeiertageCount  = count(soFeiertag === true)
uebernachtungCount = count(uebernachtung === true)
pauseSum          = Σ pause for all filled days
spesenSum         = Σ spesen for all filled days
gesamtStunden     = arbeitszeitSum − pauseSum
```

---

## Smart Defaults (UX)

| Trigger | Auto-fill |
|---|---|
| Übernachtung checked | Spesen → 28 (if spesen was 0) |
| Arbeitsort = "Feiertag" | soFeiertag → true, Arbeitszeit → 8 (fixed) |
| Arbeitsort = "Frei" | Clear Beginn/Ende, Arbeitszeit → 0 |
| Sa / So row opened | soFeiertag pre-checked |

---

## Storage Keys

```
localStorage key: "ibotraffic_worklog_2026_04" → JSON of MonthData
localStorage key: "ibotraffic_worker_name"     → string
```

---

## Project Folder Layout

```
arbeitszeiterfassung/
  index.html
  vite.config.ts
  package.json
  src/
    lib/          (data logic, no Svelte)
    components/   (Svelte UI)
    App.svelte
    main.ts
    app.css       (global + print styles)
  public/
    favicon.ico
```
