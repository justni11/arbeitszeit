<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getDaysInMonth, toDateKey } from '../lib/dateUtils';
  import { calcTotals } from '../lib/calculator';
  import { setEntry, deleteEntry } from '../lib/storage';
  import DayRow from './DayRow.svelte';
  import DayEditor from './DayEditor.svelte';
  import SummaryRow from './SummaryRow.svelte';
  import type { MonthData, DayEntry } from '../lib/types';

  export let data: MonthData;
  export let recentLocations: string[] = [];

  const dispatch = createEventDispatcher<{ change: MonthData }>();

  let editingDate: Date | null = null;

  $: days = getDaysInMonth(data.year, data.month);
  $: totals = calcTotals(data);

  function openEditor(date: Date) { editingDate = date; }

  function handleSave(e: CustomEvent<DayEntry>) {
    const updated = setEntry(data, e.detail);
    dispatch('change', updated);
    editingDate = null;
  }

  function handleDelete() {
    if (!editingDate) return;
    const updated = deleteEntry(data, toDateKey(editingDate));
    dispatch('change', updated);
    editingDate = null;
  }
</script>

<!-- Screen table -->
<div class="card screen-only">
  <div class="table-wrapper">
    <table class="timesheet">
      <thead>
        <tr>
          <th class="th-datum">Datum</th>
          <th class="th-tag">Tag</th>
          <th class="th-time">Beginn</th>
          <th class="th-time">Ende</th>
          <th class="th-ort">Arbeitsort</th>
          <th class="th-num">Std.</th>
          <th class="th-badge">So/Ft</th>
          <th class="th-badge">Nacht</th>
          <th class="th-num">Pause</th>
          <th class="th-num">Spesen</th>
        </tr>
      </thead>
      <tbody>
        {#each days as day (toDateKey(day))}
          <DayRow
            date={day}
            entry={data.entries[toDateKey(day)] ?? null}
            on:edit={() => openEditor(day)}
          />
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Print table (matches the original PDF exactly) -->
<div class="print-table">
  <table class="print-timesheet">
    <thead>
      <tr>
        <th class="p-datum">Datum</th>
        <th class="p-tag"></th>
        <th class="p-time rotated"><span>Beginn</span></th>
        <th class="p-time rotated"><span>Ende</span></th>
        <th class="p-ort">Arbeitsort</th>
        <th class="p-num rotated"><span>Arbeitszeit</span></th>
        <th class="p-x rotated"><span>So + Feiertag</span></th>
        <th class="p-x rotated"><span>Übernachtung</span></th>
        <th class="p-num rotated"><span>Pause</span></th>
        <th class="p-num rotated"><span>Spesen</span></th>
      </tr>
    </thead>
    <tbody>
      {#each days as day (toDateKey(day))}
        <DayRow
          date={day}
          entry={data.entries[toDateKey(day)] ?? null}
          printMode={true}
          on:edit={() => {}}
        />
      {/each}
    </tbody>
    <SummaryRow {totals} />
  </table>
</div>

{#if editingDate}
  <DayEditor
    date={editingDate}
    entry={data.entries[toDateKey(editingDate)] ?? null}
    {recentLocations}
    on:save={handleSave}
    on:delete={handleDelete}
    on:cancel={() => (editingDate = null)}
  />
{/if}

<style>
  /* ===== SCREEN CARD ===== */
  .card {
    background: var(--surface);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
  }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .timesheet {
    width: 100%;
    border-collapse: collapse;
    min-width: 640px;
  }

  .timesheet thead th {
    padding: 0.75rem 0.85rem;
    text-align: left;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    background: var(--surface-alt);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .th-num, .th-badge { text-align: center; }
  .th-datum { min-width: 5.5rem; }
  .th-tag   { width: 2.5rem; }
  .th-time  { width: 4rem; }
  .th-ort   { min-width: 10rem; }
  .th-num   { width: 3.5rem; }
  .th-badge { width: 3.5rem; }

  /* ===== PRINT TABLE ===== */
  .print-table { display: none; }

  .print-timesheet {
    width: 100%;
    border-collapse: collapse;
    font-family: Arial, sans-serif;
    font-size: 9pt;
  }

  .print-timesheet thead th {
    border: 1px solid #000;
    padding: 2pt 3pt;
    /* No opaque background here on purpose: rotated header labels below
       intentionally spill into neighboring cells, and an opaque fill
       would paint over (clip) that overflow. Paper is white anyway. */
    background: transparent;
    color: #000;
    font-weight: bold;
    font-size: 8pt;
    vertical-align: bottom;
    text-align: center;
  }

  .p-datum { text-align: left; min-width: 50pt; }
  .p-tag   { width: 18pt; }
  .p-time  { width: 28pt; }
  .p-ort   { min-width: 160pt; text-align: left; }
  .p-num   { width: 18pt; }
  .p-x     { width: 15pt; }

  .rotated {
    height: 64pt;
    white-space: nowrap;
    overflow: visible;
  }

  .rotated span {
    display: inline-block;
    transform: rotate(-45deg);
    transform-origin: bottom left;
    padding-bottom: 2pt;
    margin-left: 6pt;
  }

  /* ===== PRINT ===== */
  @media print {
    .screen-only { display: none; }
    .print-table { display: block; }
  }
</style>
