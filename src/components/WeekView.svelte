<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getWochentag, toDateKey, formatDecimal } from '../lib/dateUtils';
  import { calcArbeitszeit, calcTotals } from '../lib/calculator';
  import { MONTH_NAMES } from '../lib/constants';
  import type { MonthData } from '../lib/types';

  export let date: Date;
  export let data: MonthData;

  const dispatch = createEventDispatcher<{
    selectDay: Date;
    navigateWeek: number; // -1 or +1
  }>();

  function getWeekDays(d: Date): Date[] {
    const day = d.getDay(); // 0=So, 1=Mo, ...
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      return dd;
    });
  }

  $: weekDays = getWeekDays(date);
  $: weekStart = weekDays[0];
  $: weekEnd = weekDays[6];

  function weekLabel(days: Date[]): string {
    const s = days[0], e = days[6];
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()}. – ${e.getDate()}. ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()}. ${MONTH_NAMES[s.getMonth()]} – ${e.getDate()}. ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
  }

  function weekTotal(days: Date[]): number {
    return days.reduce((sum, d) => {
      const e = data.entries[toDateKey(d)];
      if (!e) return sum;
      return sum + calcArbeitszeit(e.beginn, e.ende, e.pause, e.arbeitsort);
    }, 0);
  }

  $: total = weekTotal(weekDays);
  $: todayKey = toDateKey(new Date());
  $: selectedKey = toDateKey(date);
</script>

<div class="week-view">

  <!-- Week header -->
  <div class="week-header">
    <button class="arrow-btn" aria-label="Vorherige Woche" on:click={() => dispatch('navigateWeek', -1)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="week-label">{weekLabel(weekDays)}</div>
    <button class="arrow-btn" aria-label="Nächste Woche" on:click={() => dispatch('navigateWeek', 1)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>

  <!-- Week total pill -->
  <div class="week-total-bar">
    <span class="wt-label">Woche gesamt</span>
    <span class="wt-value">{formatDecimal(total) || '0'} Std.</span>
  </div>

  <!-- Day list -->
  <div class="day-list">
    {#each weekDays as day (toDateKey(day))}
      {@const key = toDateKey(day)}
      {@const entry = data.entries[key] ?? null}
      {@const wt = getWochentag(day)}
      {@const az = entry ? calcArbeitszeit(entry.beginn, entry.ende, entry.pause, entry.arbeitsort) : 0}
      {@const isToday = key === todayKey}
      {@const isSelected = key === selectedKey}
      {@const isSa = wt === 'Sa'}
      {@const isSo = wt === 'So'}

      <button
        class="day-card"
        class:sa={isSa}
        class:so={isSo}
        class:today={isToday}
        class:selected={isSelected}
        class:has-entry={!!entry}
        on:click={() => dispatch('selectDay', day)}
      >
        <div class="dc-left">
          <span class="dc-wt" class:dc-weekend={isSa || isSo}>{wt}</span>
          <span class="dc-date">{day.getDate()}</span>
        </div>

        <div class="dc-middle">
          {#if entry?.arbeitsort}
            <span class="dc-ort">{entry.arbeitsort}</span>
          {:else}
            <span class="dc-empty">—</span>
          {/if}
          {#if entry?.beginn && entry?.ende}
            <span class="dc-times">{entry.beginn} → {entry.ende}</span>
          {/if}
        </div>

        <div class="dc-right">
          {#if az > 0}
            <span class="dc-hours">{formatDecimal(az)}</span>
            <span class="dc-unit">Std.</span>
          {/if}
          <div class="dc-dots">
            {#if entry?.soFeiertag}<span class="dot dot-so" title="So/Feiertag"></span>{/if}
            {#if entry?.uebernachtung}<span class="dot dot-nacht" title="Übernachtung"></span>{/if}
          </div>
        </div>
      </button>
    {/each}
  </div>

</div>

<style>
  .week-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  /* Header */
  .week-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
    flex-shrink: 0;
  }

  .week-label {
    font-size: 0.88rem;
    font-weight: 600;
    color: #e2e8f0;
    text-align: center;
    flex: 1;
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
    flex-shrink: 0;
  }
  .arrow-btn:hover { background: #334155; color: #e2e8f0; }

  /* Week total */
  .week-total-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1rem;
    background: #0c4a6e;
    border-bottom: 1px solid #0369a1;
  }

  .wt-label { font-size: 0.78rem; color: #7dd3fc; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .wt-value { font-size: 1rem; color: #38bdf8; font-weight: 700; }

  /* Day list */
  .day-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: #0f172a;
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .day-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    width: 100%;
  }

  .day-card:hover   { background: #334155; }
  .day-card.sa      { border-color: #1e40af; background: #172554; }
  .day-card.so      { border-color: #78350f; background: #2d1b0e; }
  .day-card.today   { border-color: #3b82f6 !important; }
  .day-card.selected { box-shadow: 0 0 0 2px #3b82f6; }

  /* Left: wochentag + date */
  .dc-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 36px;
  }

  .dc-wt {
    font-size: 0.68rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .dc-weekend { color: #60a5fa; }
  .so .dc-weekend { color: #fbbf24; }

  .dc-date {
    font-size: 1.3rem;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1;
  }

  /* Middle: ort + times */
  .dc-middle {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    overflow: hidden;
  }

  .dc-ort {
    font-size: 0.9rem;
    font-weight: 600;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dc-times {
    font-size: 0.75rem;
    color: #64748b;
    font-variant-numeric: tabular-nums;
  }

  .dc-empty { color: #334155; font-size: 0.9rem; }

  /* Right: hours + dots */
  .dc-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
    min-width: 40px;
  }

  .dc-hours {
    font-size: 1.1rem;
    font-weight: 700;
    color: #38bdf8;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .dc-unit { font-size: 0.65rem; color: #64748b; }

  .dc-dots { display: flex; gap: 3px; }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .dot-so    { background: #f59e0b; }
  .dot-nacht { background: #8b5cf6; }

  @media print { .week-view { display: none; } }
</style>
