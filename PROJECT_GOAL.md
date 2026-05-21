# Project Goal: Arbeitszeiterfassung — IBO TRAFFIC

## Vision

A simple, mobile-friendly web app that replaces the paper timesheet used by a worker at IBO TRAFFIC. The digital form must feel identical to the paper version — same columns, same layout, same totals — but faster to fill in and easier to correct.

## The Original Form (Reference)

The paper form has the following structure:

**Header:**
- Title: "Arbeitszeiterfassung"
- Month + Year (e.g., "April 2026")
- Worker name field
- Company logo/name: IBO TRAFFIC

**Columns (one row per calendar day):**

| Column | Type | Notes |
|---|---|---|
| Datum | Date | Format: DD.MM.YY |
| Wochentag | Text (auto) | Mi / Do / Fr / Sa / So / Mo / Di |
| Beginn | Time | Format: HH.MM (decimal dot, not colon) |
| Ende | Time | Format: HH.MM |
| Arbeitsort | Text | Job site / location. Special values: "Frei", "Feiertag" |
| Arbeitszeit | Decimal number | Auto-calculated from Beginn/Ende/Pause. Feiertag = 8h auto |
| So + Feiertag | Checkbox (X) | Mark if Sunday OR public holiday |
| Übernachtung | Checkbox (X) | Mark if overnight stay |
| Pause | Number | Hours of break (usually 1) |
| Spesen | Number | Daily allowance in €. Usually 28 when Übernachtung = X |

**Footer totals row ("Stunden"):**
- Sum of Arbeitszeit
- Count of So + Feiertag days
- Count of Übernachtung days
- Sum of Pause hours
- Sum of Spesen €

**"Gesamt Stunden" = Sum(Arbeitszeit) − Sum(Pause)**

## User

A single worker (not a team) who fills this in daily or weekly on their phone or computer.

## Core Requirements

### Must Have (MVP)
- [ ] Monthly calendar view — one row per day, matching the PDF layout exactly
- [ ] Columns: Datum, Wochentag (auto), Beginn, Ende, Arbeitsort, Arbeitszeit (auto-calc), So+Feiertag (X), Übernachtung (X), Pause, Spesen
- [ ] Wochentag auto-filled from date (Mo/Di/Mi/Do/Fr/Sa/So)
- [ ] Arbeitszeit auto-calculated: `(Ende − Beginn) − Pause`
- [ ] Arbeitszeit displayed as decimal (7.5, not 07:30)
- [ ] Times displayed with dot format: 08.00, 15.30 (matching the paper form)
- [ ] Footer row: sums and counts for all columns
- [ ] "Gesamt Stunden" = Arbeitszeit total − Pause total
- [ ] Spesen auto-suggests 28 when Übernachtung is checked
- [ ] Worker name stored persistently (fill once, remembered forever)
- [ ] Data persists in browser (localStorage) — no login required
- [ ] Navigate between months
- [ ] Print layout that mirrors the original form

### Should Have
- [ ] Quick-fill buttons for common Arbeitsort values ("Frei", "Feiertag", recent locations)
- [ ] When "Feiertag" is selected, auto-set Arbeitszeit to 8 and So+Feiertag to X
- [ ] Visual highlight for Sa/So rows
- [ ] CSV export for Excel

### Won't Have (MVP scope)
- User accounts / multi-user
- Server-side storage
- Overtime or legal compliance calculations
- Automatic public holiday detection (worker marks manually)

## Success Criteria

The worker can fill in a full month in the same time or less than the paper form, and print a result that looks identical to it.
