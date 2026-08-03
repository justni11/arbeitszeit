<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getWochentag, toDateKey, formatDecimal } from '../lib/dateUtils';
  import { calcArbeitszeit, calcTotals, isOvernightShift } from '../lib/calculator';
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
      {@const overnight = entry ? isOvernightShift(entry.beginn, entry.ende) : false}
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
            <span class="dc-times">
              {entry.beginn} → {entry.ende}
              {#if overnight}
                <span class="next-day-badge" title="Ende am nächsten Tag">+1</span>
              {/if}
            </span>
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
    flex-shrink: 0;
  }

  .week-label {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
    flex: 1;
  }

  .arrow-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }
  .arrow-btn:hover { background: var(--surface-alt); color: var(--text-primary); }

  /* Week total */
  .week-total-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.7rem 1rem;
    margin: 0 1rem 0.75rem;
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft-border);
    border-radius: var(--radius-md);
  }

  .wt-label { font-size: 0.78rem; color: var(--accent-dark); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .wt-value { font-size: 1rem; color: var(--accent-dark); font-weight: 700; }

  /* Day list */
  .day-list {
    display: flex;
    flex-direction: column;
    padding: 0 0.75rem 0.75rem;
    gap: 0.5rem;
  }

  .day-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.15s, background 0.15s;
    text-align: left;
    width: 100%;
    box-shadow: var(--shadow-sm);
  }

  .day-card:hover   { box-shadow: var(--shadow-md); transform: translateY(-1px); }
  .day-card.sa      { border-color: var(--accent-soft-border); background: var(--sat-soft); }
  .day-card.so      { border-color: #f6d9a9; background: var(--sun-soft); }
  .day-card.today   { border-color: var(--accent) !important; }
  .day-card.selected { box-shadow: 0 0 0 2px var(--accent); }

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
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .dc-weekend { color: var(--sat); }
  .so .dc-weekend { color: var(--sun); }

  .dc-date {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text-primary);
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
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dc-times {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .next-day-badge {
    display: inline-block;
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--accent-dark);
    background: var(--accent-soft);
    border-radius: 3px;
    padding: 0 0.2rem;
    margin-left: 0.1rem;
  }

  .dc-empty { color: var(--border-strong); font-size: 0.9rem; }

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
    color: var(--accent-dark);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .dc-unit { font-size: 0.65rem; color: var(--text-tertiary); }

  .dc-dots { display: flex; gap: 3px; }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .dot-so    { background: var(--sun); }
  .dot-nacht { background: var(--night); }

  @media print { .week-view { display: none; } }
</style>
