# UI Specification

## Print Header (matches paper form)

```
Arbeitszeiterfassung         2026
April
Name: ___________________          IBO TRAFFIC
```

## Main Table Layout

Column headers use diagonal/rotated text (matching the original) for the narrow columns:

```
┌──────────┬────┬───────┬───────┬──────────────────┬──────────┬─────────────┬─────────────┬───────┬────────┐
│  Datum   │    │ Beginn│  Ende │    Arbeitsort     │Arbeitszeit│ So+Feiertag│ Übernachtung│ Pause │ Spesen │
├──────────┼────┼───────┼───────┼──────────────────┼──────────┼─────────────┼─────────────┼───────┼────────┤
│ 01.04.26 │ Mi │       │       │ Frei             │          │             │             │       │        │
│ 02.04.26 │ Do │ 08.00 │ 15.30 │ Werkstatt        │   7,5    │             │             │   1   │        │
│ 03.04.26 │ Fr │       │       │ Feiertag         │   8      │             │             │       │        │
│ 04.04.26 │ Sa │ 07.00 │ 18.30 │ Kitzingen        │  11,5    │             │             │   1   │        │
│ 08.04.26 │ Mi │ 15.30 │ 05.30 │ Malsfeld         │   14     │             │      X      │   1   │   28   │
│ 12.04.26 │ So │ 17.00 │ 02.00 │ Bayreuth/Wartezeit│   9     │      X      │      X      │   1   │   28   │
│  ...     │    │       │       │                  │          │             │             │       │        │
├──────────┴────┴───────┴───────┼──────────────────┼──────────┼─────────────┼─────────────┼───────┼────────┤
│                      Stunden  │                  │  302,75  │      2      │     10      │  23   │  280   │
├───────────────────────────────┴──────────────────┴──────────┴─────────────┴─────────────┴───────┴────────┤
│  Gesamt Stunden:  279,75                                                                                  │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Row States & Visual Design

| Row type | Background | Notes |
|---|---|---|
| Empty weekday | White | Datum + Wochentag shown, all other cells empty |
| Filled weekday | White | All data visible |
| Saturday (Sa) | Light blue | Wochentag bold |
| Sunday (So) | Light orange | Wochentag bold |
| "Frei" | Light grey | Only Datum + Wochentag + "Frei" shown |
| "Feiertag" | Light yellow | Arbeitszeit fixed at 8, So+Feiertag auto-checked |
| Currently editing | Highlighted border | Row expands or modal opens |

## Interaction Model

- **Tap/click any row** → opens the day editor for that row
- **Day editor fields** (in order):
  1. Arbeitsort (text input with autocomplete from recent entries)
  2. Beginn (time input, displayed/stored as HH.MM)
  3. Ende (time input)
  4. Pause (number input, default 1)
  5. So + Feiertag (toggle button, auto-checked for Sa/So)
  6. Übernachtung (toggle button)
  7. Spesen (number input, auto-filled 28 when Übernachtung checked)
  8. Live preview of Arbeitszeit (calculated in real-time as user types)
- **Speichern** button → saves and closes editor
- **Löschen** button → clears the day's entry
- **Abbrechen** → closes without saving

## Quick-Fill Buttons in Editor

Prominent tap targets for the most common Arbeitsort values:
- [Frei] [Feiertag] + last 5 used locations (stored in localStorage)

## Navigation Bar (top of page)

```
[ ← ]   April 2026   [ → ]        [Drucken]  [CSV Export]
```

## Worker Name

- Shown in header area above the table
- Editable by clicking on it (inline edit)
- Saved to localStorage immediately on change

## Print Layout

- Navigation bar, editor, export buttons hidden
- Table fills full page width
- Header block:
  ```
  Arbeitszeiterfassung    2026
  April
  Name: [worker name]               IBO TRAFFIC
  ```
- Column headers rotated (matching paper form style)
- Footer with "Stunden" totals row + "Gesamt Stunden" row
- Signature line at bottom (optional, can be hand-signed on printout)

## Mobile Considerations

- All tap targets minimum 44px height
- Time inputs use native `<input type="text" inputmode="decimal">` — the worker enters "08.00" as text (matching their habit from the paper form), not a time picker
- Arbeitszeit shown live in editor so the worker can verify before saving
- Table scrolls horizontally on small screens; Datum + Wochentag columns are sticky (frozen left)

## Number Formatting

- Arbeitszeit: German decimal comma (7,5 not 7.5) in display; stored internally as float
- Spesen: integer euros (28, not 28.00)
- Totals: same formatting as individual cells
