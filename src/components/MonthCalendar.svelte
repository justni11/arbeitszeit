<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getDaysInMonth, toDateKey, getWochentag, formatDecimal } from '../lib/dateUtils';
  import { calcArbeitszeit, calcTotals } from '../lib/calculator';
  import { MONTH_NAMES } from '../lib/constants';
  import type { MonthData } from '../lib/types';

  export let data: MonthData;
  export let selectedDate: Date;
  export let compact: boolean = false; // sidebar mode on desktop

  const dispatch = createEventDispatcher<{
    selectDay: Date;
    navigateMonth: number;
  }>();

  $: days = getDaysInMonth(data.year, data.month);
  $: totals = calcTotals(data);
  $: todayKey = toDateKey(new Date());
  $: selectedKey = toDateKey(selectedDate);
  $: firstDay = days[0];
  $: startPad = (firstDay.getDay() + 6) % 7;
  $: grid = [...Array(startPad).fill(null), ...days];
</script>

<div class="month-cal" class:compact>

  <!-- Header -->
  <div class="cal-header">
    <button class="nav-btn" aria-label="Vorheriger Monat" on:click={() => dispatch('navigateMonth', -1)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="cal-title">
      <span class="cal-month">{MONTH_NAMES[data.month - 1]}</span>
      <span class="cal-year">{data.year}</span>
    </div>
    <button class="nav-btn" aria-label="Nächster Monat" on:click={() => dispatch('navigateMonth', 1)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>

  <!-- Weekday labels -->
  <div class="wd-row">
    {#each ['Mo','Di','Mi','Do','Fr','Sa','So'] as wd}
      <div class="wd" class:wd-end={wd === 'Sa' || wd === 'So'}>{wd}</div>
    {/each}
  </div>

  <!-- Calendar grid — fills remaining space -->
  <div class="cal-grid">
    {#each grid as day}
      {#if !day}
        <div class="cell empty"></div>
      {:else}
        {@const key = toDateKey(day)}
        {@const e = data.entries[key] ?? null}
        {@const wt = getWochentag(day)}
        {@const isSa = wt === 'Sa'}
        {@const isSo = wt === 'So'}
        {@const az = e ? calcArbeitszeit(e.beginn, e.ende, e.pause, e.arbeitsort) : 0}
        {@const isToday = key === todayKey}
        {@const isSel = key === selectedKey}
        <button
          class="cell"
          class:sa={isSa} class:so={isSo}
          class:today={isToday} class:sel={isSel}
          class:filled={!!e}
          on:click={() => dispatch('selectDay', day)}
          aria-label="{day.getDate()}. {MONTH_NAMES[data.month-1]}"
          aria-pressed={isSel}
        >
          <span class="cell-num">{day.getDate()}</span>
          {#if e?.arbeitsort === 'Frei'}
            <span class="cell-tag tag-frei">—</span>
          {:else if e?.arbeitsort === 'Feiertag'}
            <span class="cell-tag tag-ft">Ft</span>
          {:else if az > 0}
            <span class="cell-hours">{formatDecimal(az)}</span>
          {/if}
          {#if e?.uebernachtung}
            <span class="cell-dot"></span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Stats strip -->
  <div class="stats-strip">
    <div class="stat">
      <span class="s-val">{formatDecimal(totals.gesamtStunden) || '0'}</span>
      <span class="s-lbl">Gesamt</span>
    </div>
    <div class="s-div"></div>
    <div class="stat">
      <span class="s-val">{formatDecimal(totals.arbeitszeitSum) || '0'}</span>
      <span class="s-lbl">Arbeitszeit</span>
    </div>
    <div class="s-div"></div>
    <div class="stat">
      <span class="s-val">{totals.uebernachtungCount}</span>
      <span class="s-lbl">Nächte</span>
    </div>
    <div class="s-div"></div>
    <div class="stat">
      <span class="s-val">{totals.spesenSum} €</span>
      <span class="s-lbl">Spesen</span>
    </div>
  </div>

</div>

<style>
  .month-cal {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    overflow: hidden;
  }

  /* Header */
  .cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    flex-shrink: 0;
  }

  .nav-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    background: #1e293b; border: 1px solid #334155; border-radius: 8px;
    color: #94a3b8; cursor: pointer; transition: all 0.15s;
  }
  .nav-btn:hover { background: #334155; color: #e2e8f0; }

  .cal-title { display: flex; flex-direction: column; align-items: center; gap: 0; }
  .cal-month { font-size: 1rem; font-weight: 700; color: #f1f5f9; }
  .cal-year  { font-size: 0.72rem; color: #64748b; }

  /* Weekday row */
  .wd-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    padding: 0 0.5rem;
    flex-shrink: 0;
  }
  .wd {
    text-align: center;
    font-size: 0.65rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.2rem 0;
  }
  .wd-end { color: #3b82f6; }

  /* Grid — stretches to fill remaining height */
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: 1fr;
    flex: 1;
    padding: 0.25rem 0.5rem;
    gap: 3px;
    min-height: 0;
  }

  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    background: #1e293b;
    position: relative;
    transition: all 0.12s;
    padding: 2px;
    min-height: 0;
    gap: 1px;
  }

  .cell.empty { background: transparent; cursor: default; border: none; }
  .cell:not(.empty):hover { background: #334155; }
  .cell.sa { background: #172554; border-color: #1e3a8a22; }
  .cell.so { background: #2d1b0e; border-color: #78350f22; }
  .cell.today  { border-color: #3b82f6 !important; }
  .cell.sel    { box-shadow: 0 0 0 2px #3b82f6; background: #1e3a5f !important; }
  .cell.filled .cell-num { color: #e2e8f0; }

  .cell-num  { font-size: 0.78rem; font-weight: 600; color: #475569; line-height: 1; }
  .cell-hours { font-size: 0.6rem; font-weight: 700; color: #38bdf8; line-height: 1; }
  .cell-tag  { font-size: 0.55rem; font-weight: 700; border-radius: 2px; padding: 0 2px; line-height: 1.4; }
  .tag-frei  { color: #475569; }
  .tag-ft    { background: #422006; color: #fb923c; }

  .cell-dot {
    position: absolute;
    bottom: 3px; right: 3px;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #8b5cf6;
  }

  /* Stats strip */
  .stats-strip {
    display: flex;
    align-items: center;
    padding: 0.6rem 1rem;
    background: #1e293b;
    border-top: 1px solid #334155;
    flex-shrink: 0;
    gap: 0.25rem;
  }

  .stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
  .s-val { font-size: 0.88rem; font-weight: 700; color: #f1f5f9; }
  .s-lbl { font-size: 0.58rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .s-div { width: 1px; height: 28px; background: #334155; flex-shrink: 0; }

  /* Compact (sidebar) mode */
  .compact .cal-header { padding: 0.5rem 0.75rem; }
  .compact .cell { border-radius: 6px; }
  .compact .cell-num { font-size: 0.72rem; }
  .compact .cal-month { font-size: 0.88rem; }
  .compact .stats-strip { padding: 0.5rem 0.75rem; }

  @media print { .month-cal { display: none; } }
</style>
