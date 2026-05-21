# Implementation Plan

Step-by-step build sequence. Each phase is independently testable before moving to the next.

## Phase 1 — Project Scaffold

```bash
npm create vite@latest arbeitszeiterfassung -- --template svelte-ts
cd arbeitszeiterfassung
npm install
```

Clean up boilerplate: remove `src/lib/Counter.svelte`, `src/assets/`, demo content in `App.svelte`.

Create folder structure:
```
src/
  lib/
  components/
  App.svelte
  main.ts
  app.css
```

---

## Phase 2 — Core Data & Logic (no UI)

Implement in this exact order. Each function is pure (no side effects) and can be verified in the browser console.

### `src/lib/constants.ts`
```ts
export const DEFAULT_PAUSE = 1;
export const DEFAULT_SPESEN = 28;
export const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const STORAGE_PREFIX = 'ibotraffic_worklog_';
export const WORKER_NAME_KEY = 'ibotraffic_worker_name';
export const RECENT_LOCATIONS_KEY = 'ibotraffic_recent_locations';
```

### `src/lib/dateUtils.ts`
```ts
getDaysInMonth(year: number, month: number): Date[]
  // Returns array of all Date objects in that month

getWochentag(date: Date): string
  // Returns "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"

toDateKey(date: Date): string
  // Returns "YYYY-MM-DD"

formatDate(date: Date): string
  // Returns "01.04.26"

parseTimeToDecimal(time: string): number
  // "08.00" → 8.0, "15.30" → 15.5, "05.30" → 5.5
  // IMPORTANT: "08.00" uses a dot, not a colon

isWeekend(date: Date): { isSaturday: boolean; isSunday: boolean }
```

### `src/lib/calculator.ts`
```ts
calcArbeitszeit(beginn: string, ende: string, pause: number, arbeitsort: string): number
  // Returns decimal hours
  // If arbeitsort === "Feiertag" → return 8
  // If beginn or ende is empty → return 0
  // If ende <= beginn (overnight shift) → add 24 to handle midnight crossing
  // Formula: parseTimeToDecimal(ende) - parseTimeToDecimal(beginn) - pause
  //          (with overnight correction)

calcTotals(entries: Record<string, DayEntry>, daysInMonth: Date[]): MonthTotals
  // Iterates all days, sums all columns
  // gesamtStunden = arbeitszeitSum - pauseSum
```

### `src/lib/storage.ts`
```ts
loadMonth(year: number, month: number): MonthData
  // Reads from localStorage key "ibotraffic_worklog_YYYY_MM"
  // Returns empty MonthData if not found

saveMonth(data: MonthData): void
  // Serializes and writes to localStorage

loadWorkerName(): string
saveWorkerName(name: string): void

loadRecentLocations(): string[]    // Last 5 unique Arbeitsort values
saveRecentLocation(loc: string): void  // Prepends, deduplicates, trims to 5
```

### `src/lib/exporter.ts`
```ts
exportCSV(data: MonthData, days: Date[]): void
  // Builds CSV string with all columns
  // Creates a Blob URL and triggers download
  // Filename: "IBO_TRAFFIC_April_2026.csv"
```

---

## Phase 3 — Component Build (bottom-up)

Build components in this order:

### 1. `SummaryRow.svelte`
- Props: `totals: MonthTotals`
- Renders the "Stunden" row + "Gesamt Stunden" row
- No interaction

### 2. `DayRow.svelte`
- Props: `date: Date`, `entry: DayEntry | null`
- Derived: `wochentag`, `formattedDate`, `arbeitszeit` (calculated)
- Emits: `edit` event (no payload needed, parent knows which date)
- Visual states: weekend highlight, Frei, Feiertag

### 3. `DayEditor.svelte`
- Props: `date: Date`, `entry: DayEntry | null`, `recentLocations: string[]`
- Internal state: a working copy of the entry fields
- Live-calculates Arbeitszeit as user types
- Smart defaults: auto-check soFeiertag for Sa/So, auto-fill Spesen=28 when Übernachtung checked
- Quick-fill buttons: "Frei", "Feiertag", recent locations
- Emits: `save` (payload: DayEntry), `delete`, `cancel`

### 4. `MonthNavigation.svelte`
- Props: `year: number`, `month: number`
- Emits: `prev`, `next`
- Displays: "April 2026"
- Shows: [Drucken] and [CSV Export] buttons

### 5. `PrintHeader.svelte`
- Props: `workerName: string`, `year: number`, `month: number`
- Renders only — no interaction
- Visible only in print mode (CSS `@media print`)

### 6. `MonthView.svelte`
- Props: `year: number`, `month: number`, `data: MonthData`, `recentLocations: string[]`
- Owns: `editingDate: string | null`
- Renders: header row, all DayRow components, active DayEditor (inline or modal), SummaryRow
- Handles save/delete/cancel from DayEditor → calls `setEntry` → emits `change` with updated MonthData

### 7. `App.svelte` (root)
- Owns: current year/month, MonthData, workerName, recentLocations
- On mount: loads from storage, defaults to current month
- On month change: saves current, loads new
- On MonthData change: saves to storage, updates recentLocations
- Renders: MonthNavigation + worker name field + MonthView

---

## Phase 4 — Styling

### `src/app.css`
- CSS custom properties for colors:
  ```css
  --color-saturday: #dbeafe;   /* light blue */
  --color-sunday: #fef3c7;     /* light amber */
  --color-feiertag: #fefce8;   /* light yellow */
  --color-frei: #f3f4f6;       /* light grey */
  ```
- Table: `border-collapse: collapse`, thin borders matching paper form
- Column widths: Datum (auto), Wochentag (narrow), Beginn/Ende (narrow), Arbeitsort (flex), numeric columns (narrow + right-aligned)
- Rotated column headers for narrow columns (matching the paper form style):
  ```css
  .rotated-header { writing-mode: vertical-rl; transform: rotate(180deg); }
  ```
- Mobile: horizontal scroll on table; Datum + Wochentag columns sticky with `position: sticky; left: 0`

### Print CSS (`@media print` in `app.css`)
- Hide: nav, editor, export buttons, edit affordances
- Show: PrintHeader
- Table: full width, no shadows
- Footer: "Gesamt Stunden" prominently displayed
- Page break handling: `page-break-inside: avoid` on footer rows

---

## Phase 5 — Polish & Edge Cases

- [ ] Overnight shifts: Ende < Beginn (e.g., 15.30 → 05.30 = 14h). Verify with `calcArbeitszeit`.
- [ ] Empty months: all rows show only Datum + Wochentag, no entered data
- [ ] Month navigation wraps: December 2026 → January 2027
- [ ] Worker name: click-to-edit inline in header; saved immediately
- [ ] Decimal formatting: display with comma (7,5), store as float (7.5)
- [ ] Test on mobile (Chrome DevTools → iPhone 14 size)
- [ ] Verify print output matches original form layout

---

## Phase 6 — Deployment

```bash
npm run build   # outputs to dist/
```

Options:
- **Netlify / Vercel**: drag-and-drop `dist/` folder — free, instant
- **GitHub Pages**: push `dist/` to `gh-pages` branch
- **Local**: worker opens `dist/index.html` directly in browser (works offline)

For offline support (optional, Phase 7): add a Vite PWA plugin (`vite-plugin-pwa`) with a simple service worker that caches the app shell.

---

## Open Questions (Resolved by the PDF)

| Question | Answer |
|---|---|
| Column names | Datum, Beginn, Ende, Arbeitsort, Arbeitszeit, So+Feiertag, Übernachtung, Pause, Spesen |
| Time format | HH.MM with dot (08.00, 15.30) |
| Hours format | Decimal with comma (7,5) |
| Pause unit | Hours (1 = 1 hour) |
| Spesen default | 28 (€ per overnight day) |
| Feiertag hours | Fixed 8h, no Beginn/Ende needed |
| Overnight shifts | Yes — Ende can be next morning (e.g., 15.30 → 05.30) |
| Company name | IBO TRAFFIC |
| "Gesamt Stunden" | = Arbeitszeit sum − Pause sum |
| Totals row label | "Stunden" |
