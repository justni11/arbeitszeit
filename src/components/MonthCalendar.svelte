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
          {:else if e?.arbeitsort === 'Urlaub'}
            <span class="cell-tag tag-ur">Ur</span>
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
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
    box-shadow: var(--shadow-sm);
  }
  .nav-btn:hover { background: var(--surface-alt); color: var(--text-primary); }

  .cal-title { display: flex; flex-direction: column; align-items: center; gap: 0; }
  .cal-month { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
  .cal-year  { font-size: 0.72rem; color: var(--text-tertiary); }

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
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.2rem 0;
  }
  .wd-end { color: var(--accent); }

  /* Grid — stretches to fill remaining height */
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: 1fr;
    flex: 1;
    padding: 0.25rem 0.5rem;
    gap: 4px;
    min-height: 0;
  }

  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    border: 1px solid var(--border);
    cursor: pointer;
    background: var(--surface);
    position: relative;
    transition: all 0.12s;
    padding: 2px;
    min-height: 0;
    gap: 1px;
    box-shadow: var(--shadow-sm);
  }

  .cell.empty { background: transparent; cursor: default; border: none; box-shadow: none; }
  .cell:not(.empty):hover { background: var(--surface-alt); box-shadow: var(--shadow-md); transform: translateY(-1px); }
  .cell.sa { background: var(--sat-soft); border-color: var(--accent-soft-border); }
  .cell.so { background: var(--sun-soft); border-color: #f6d9a9; }
  .cell.today  { border-color: var(--accent) !important; }
  .cell.sel    { box-shadow: 0 0 0 2px var(--accent); background: var(--accent-soft) !important; }
  .cell.filled .cell-num { color: var(--text-primary); }

  .cell-num  { font-size: 0.78rem; font-weight: 600; color: var(--text-tertiary); line-height: 1; }
  .cell-hours { font-size: 0.6rem; font-weight: 700; color: var(--accent-dark); line-height: 1; }
  .cell-tag  { font-size: 0.55rem; font-weight: 700; border-radius: 3px; padding: 0 2px; line-height: 1.4; }
  .tag-frei  { color: var(--text-tertiary); }
  .tag-ft    { background: var(--holiday-soft); color: var(--holiday); }
  .tag-ur    { background: var(--vacation-soft); color: var(--vacation); }

  .cell-dot {
    position: absolute;
    bottom: 3px; right: 3px;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--night);
  }

  /* Stats strip */
  .stats-strip {
    display: flex;
    align-items: center;
    padding: 0.6rem 1rem;
    background: var(--surface-alt);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    gap: 0.25rem;
  }

  .stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
  .s-val { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
  .s-lbl { font-size: 0.58rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; }
  .s-div { width: 1px; height: 28px; background: var(--border); flex-shrink: 0; }

  /* Compact (sidebar) mode */
  .compact .cal-header { padding: 0.5rem 0.75rem; }
  .compact .cell { border-radius: 6px; }
  .compact .cell-num { font-size: 0.72rem; }
  .compact .cal-month { font-size: 0.88rem; }
  .compact .stats-strip { padding: 0.5rem 0.75rem; }

  @media print { .month-cal { display: none; } }
</style>
