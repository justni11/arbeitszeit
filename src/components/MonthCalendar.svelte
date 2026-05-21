<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getDaysInMonth, toDateKey, getWochentag, formatDecimal } from '../lib/dateUtils';
  import { calcArbeitszeit, calcTotals } from '../lib/calculator';
  import { MONTH_NAMES } from '../lib/constants';
  import type { MonthData } from '../lib/types';

  export let data: MonthData;
  export let selectedDate: Date;

  const dispatch = createEventDispatcher<{
    selectDay: Date;
    navigateMonth: number;
  }>();

  $: days = getDaysInMonth(data.year, data.month);
  $: totals = calcTotals(data);
  $: todayKey = toDateKey(new Date());
  $: selectedKey = toDateKey(selectedDate);

  // Pad calendar grid: start week on Monday
  $: firstDay = days[0];
  $: startPadding = (firstDay.getDay() + 6) % 7; // days to pad before the 1st (Mon=0)
  $: gridCells = [
    ...Array.from({ length: startPadding }, () => null),
    ...days,
  ];
</script>

<div class="month-cal">

  <!-- Month header -->
  <div class="month-header">
    <button class="arrow-btn" aria-label="Vorheriger Monat" on:click={() => dispatch('navigateMonth', -1)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="month-title">
      <span class="month-name">{MONTH_NAMES[data.month - 1]}</span>
      <span class="month-year">{data.year}</span>
    </div>
    <button class="arrow-btn" aria-label="Nächster Monat" on:click={() => dispatch('navigateMonth', 1)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>

  <!-- Weekday labels -->
  <div class="weekday-row">
    {#each ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as wd}
      <div class="wd-label" class:wd-weekend={wd === 'Sa' || wd === 'So'}>{wd}</div>
    {/each}
  </div>

  <!-- Calendar grid -->
  <div class="cal-grid">
    {#each gridCells as day}
      {#if day === null}
        <div class="cal-cell empty"></div>
      {:else}
        {@const key = toDateKey(day)}
        {@const entry = data.entries[key] ?? null}
        {@const wt = getWochentag(day)}
        {@const isSa = wt === 'Sa'}
        {@const isSo = wt === 'So'}
        {@const az = entry ? calcArbeitszeit(entry.beginn, entry.ende, entry.pause, entry.arbeitsort) : 0}
        {@const isToday = key === todayKey}
        {@const isSelected = key === selectedKey}
        <button
          class="cal-cell"
          class:sa={isSa}
          class:so={isSo}
          class:today={isToday}
          class:selected={isSelected}
          class:has-entry={!!entry}
          on:click={() => dispatch('selectDay', day)}
        >
          <span class="cal-day-num">{day.getDate()}</span>
          {#if az > 0}
            <span class="cal-hours">{formatDecimal(az)}</span>
          {:else if entry?.arbeitsort === 'Frei'}
            <span class="cal-tag frei-tag">Frei</span>
          {:else if entry?.arbeitsort === 'Feiertag'}
            <span class="cal-tag ft-tag">Ft</span>
          {/if}
          {#if entry?.uebernachtung}
            <span class="cal-dot nacht-dot"></span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Month totals -->
  <div class="month-totals">
    <div class="mt-item">
      <span class="mt-val">{formatDecimal(totals.gesamtStunden) || '0'}</span>
      <span class="mt-lbl">Gesamt Std.</span>
    </div>
    <div class="mt-divider"></div>
    <div class="mt-item">
      <span class="mt-val">{formatDecimal(totals.arbeitszeitSum) || '0'}</span>
      <span class="mt-lbl">Arbeitszeit</span>
    </div>
    <div class="mt-divider"></div>
    <div class="mt-item">
      <span class="mt-val">{totals.uebernachtungCount}</span>
      <span class="mt-lbl">Nächte</span>
    </div>
    <div class="mt-divider"></div>
    <div class="mt-item">
      <span class="mt-val">{totals.spesenSum} €</span>
      <span class="mt-lbl">Spesen</span>
    </div>
  </div>

</div>

<style>
  .month-cal {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  /* Header */
  .month-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
  }

  .month-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .month-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .month-year {
    font-size: 0.78rem;
    color: #64748b;
  }

  .arrow-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.15s;
  }
  .arrow-btn:hover { background: #334155; color: #e2e8f0; }

  /* Weekday row */
  .weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    padding: 0.5rem 0.75rem 0.25rem;
    background: #0f172a;
  }

  .wd-label {
    text-align: center;
    font-size: 0.68rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.25rem 0;
  }
  .wd-weekend { color: #3b82f6; }

  /* Calendar grid */
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
    padding: 0.5rem 0.75rem;
    background: #0f172a;
    flex: 1;
  }

  .cal-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid transparent;
    cursor: pointer;
    background: #1e293b;
    position: relative;
    transition: all 0.15s;
    gap: 1px;
    min-height: 44px;
    padding: 2px;
  }

  .cal-cell.empty {
    background: transparent;
    border: none;
    cursor: default;
  }

  .cal-cell:not(.empty):hover { background: #334155; }

  .cal-cell.sa { background: #172554; }
  .cal-cell.so { background: #2d1b0e; }

  .cal-cell.today {
    border-color: #3b82f6;
  }

  .cal-cell.selected {
    box-shadow: 0 0 0 2px #3b82f6;
  }

  .cal-cell.has-entry .cal-day-num {
    color: #f1f5f9;
  }

  .cal-day-num {
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
    line-height: 1;
  }

  .cal-hours {
    font-size: 0.62rem;
    font-weight: 700;
    color: #38bdf8;
    line-height: 1;
  }

  .cal-tag {
    font-size: 0.55rem;
    font-weight: 700;
    padding: 1px 3px;
    border-radius: 3px;
    line-height: 1;
  }

  .frei-tag  { background: #1e293b; color: #64748b; }
  .ft-tag    { background: #422006; color: #fb923c; }

  .cal-dot {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .nacht-dot { background: #8b5cf6; }

  /* Totals */
  .month-totals {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: #1e293b;
    border-top: 1px solid #334155;
    gap: 0.5rem;
  }

  .mt-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .mt-val {
    font-size: 1rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .mt-lbl {
    font-size: 0.62rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
  }

  .mt-divider {
    width: 1px;
    height: 32px;
    background: #334155;
    flex-shrink: 0;
  }

  @media print { .month-cal { display: none; } }
</style>
