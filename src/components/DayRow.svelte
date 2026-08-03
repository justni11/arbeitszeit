<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getWochentag, formatDate, formatDecimal } from '../lib/dateUtils';
  import { calcArbeitszeit, isOvernightShift } from '../lib/calculator';
  import type { DayEntry } from '../lib/types';

  export let date: Date;
  export let entry: DayEntry | null;
  export let printMode: boolean = false;

  const dispatch = createEventDispatcher<{ edit: void }>();

  $: wochentag = getWochentag(date);
  $: isSa = wochentag === 'Sa';
  $: isSo = wochentag === 'So';
  $: arbeitszeit = entry
    ? calcArbeitszeit(entry.beginn, entry.ende, entry.pause, entry.arbeitsort)
    : 0;
  $: overnight = entry ? isOvernightShift(entry.beginn, entry.ende) : false;
  $: isFeiertag = entry?.arbeitsort === 'Feiertag';
  $: isFrei = entry?.arbeitsort === 'Frei';
  $: isUrlaub = entry?.arbeitsort === 'Urlaub';
  $: isWeekend = isSa || isSo;
  $: hasEntry = !!entry && !isFrei;
</script>

{#if printMode}
  <!-- PDF-style row -->
  <tr class="print-row" class:print-sa={isSa} class:print-so={isSo}>
    <td class="p-datum">{formatDate(date)}</td>
    <td class="p-tag">{wochentag}</td>
    <td class="p-time">{entry?.beginn ?? ''}</td>
    <td class="p-time">{entry?.ende ?? ''}{#if overnight}<sup class="p-next-day">+1</sup>{/if}</td>
    <td class="p-ort">{entry?.arbeitsort ?? ''}</td>
    <td class="p-arbeitszeit">{arbeitszeit > 0 ? formatDecimal(arbeitszeit).replace(',', '.') : ''}</td>
    <td class="p-x">{entry?.soFeiertag ? 'X' : ''}</td>
    <td class="p-x">{entry?.uebernachtung ? 'X' : ''}</td>
    <td class="p-num">{entry?.pause ? entry.pause : ''}</td>
    <td class="p-num">{entry?.spesen ? entry.spesen : ''}</td>
  </tr>
{:else}
  <!-- Modern screen row -->
  <tr
    class="day-row"
    class:weekend={isWeekend}
    class:saturday={isSa}
    class:sunday={isSo}
    class:frei={isFrei}
    class:feiertag={isFeiertag}
    class:urlaub={isUrlaub}
    class:has-entry={hasEntry}
    on:click={() => dispatch('edit')}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Enter' && dispatch('edit')}
  >
    <td class="col-datum">
      <span class="date-text">{formatDate(date)}</span>
    </td>
    <td class="col-tag">
      <span class="tag-badge" class:tag-weekend={isWeekend}>{wochentag}</span>
    </td>
    <td class="col-time">{entry?.beginn ?? ''}</td>
    <td class="col-time">
      {entry?.ende ?? ''}
      {#if overnight}
        <span class="next-day-badge" title="Ende am nächsten Tag">+1</span>
      {/if}
    </td>
    <td class="col-ort">
      {#if isFrei}
        <span class="pill pill-frei">Frei</span>
      {:else if isFeiertag}
        <span class="pill pill-feiertag">Feiertag</span>
      {:else if isUrlaub}
        <span class="pill pill-urlaub">Urlaub</span>
      {:else}
        <span class="ort-text">{entry?.arbeitsort ?? ''}</span>
      {/if}
    </td>
    <td class="col-num">
      {#if arbeitszeit > 0}
        <span class="hours-badge">{formatDecimal(arbeitszeit)}</span>
      {/if}
    </td>
    <td class="col-badge">
      {#if entry?.soFeiertag}
        <span class="dot dot-so" title="So / Feiertag"></span>
      {/if}
    </td>
    <td class="col-badge">
      {#if entry?.uebernachtung}
        <span class="dot dot-nacht" title="Übernachtung"></span>
      {/if}
    </td>
    <td class="col-num">{entry?.pause ? entry.pause : ''}</td>
    <td class="col-num">{entry?.spesen ? entry.spesen + ' €' : ''}</td>
  </tr>
{/if}

<style>
  /* ===== SCREEN ROWS ===== */
  .day-row {
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }

  .day-row:hover { background: var(--surface-alt) !important; }

  .day-row td {
    padding: 0.6rem 0.85rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  /* Weekend tints */
  .saturday { background: var(--sat-soft); }
  .sunday   { background: var(--sun-soft); }
  .frei     { background: var(--surface-alt); }
  .feiertag { background: var(--holiday-soft); }
  .urlaub   { background: var(--vacation-soft); }

  .saturday td, .sunday td { color: var(--text-primary); }

  /* Datum column */
  .col-datum { min-width: 5.5rem; }
  .date-text { color: var(--text-tertiary); font-size: 0.8rem; font-variant-numeric: tabular-nums; }

  /* Tag/Wochentag */
  .col-tag { width: 3rem; }
  .tag-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-tertiary);
    width: 2rem;
    text-align: center;
  }
  .tag-weekend { color: var(--sat); }
  .sunday .tag-weekend { color: var(--sun); }

  /* Times */
  .col-time {
    width: 4.5rem;
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary);
    font-size: 0.83rem;
  }

  .next-day-badge {
    display: inline-block;
    vertical-align: super;
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--accent-dark);
    background: var(--accent-soft);
    border-radius: 3px;
    padding: 0 0.2rem;
    margin-left: 0.1rem;
  }

  /* Ort */
  .col-ort { min-width: 10rem; }
  .ort-text { color: var(--text-primary); font-weight: 500; }

  .pill {
    display: inline-block;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .pill-frei    { background: var(--surface); color: var(--text-tertiary); border: 1px solid var(--border); }
  .pill-feiertag { background: #fff0e6; color: var(--holiday); border: 1px solid #f6cfa9; }
  .pill-urlaub  { background: var(--vacation-soft); color: var(--vacation); border: 1px solid #b7e8c8; }

  /* Hours */
  .col-num { width: 4rem; text-align: right; font-variant-numeric: tabular-nums; }
  .hours-badge {
    display: inline-block;
    background: var(--accent-soft);
    color: var(--accent-dark);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  /* Badges / dots */
  .col-badge { width: 3.5rem; text-align: center; }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .dot-so   { background: var(--sun); }
  .dot-nacht { background: var(--night); }

  /* ===== PRINT ROWS ===== */
  .print-row td {
    border: 1px solid #000;
    padding: 0.5pt 3pt;
    font-size: 9pt;
  }

  .p-datum { min-width: 50pt; }
  .p-tag   { width: 18pt; text-align: center; font-weight: bold; }
  .p-time  { width: 28pt; text-align: center; }
  .p-next-day { font-size: 5pt; font-weight: bold; }
  .p-ort   { min-width: 200pt; }
  .p-arbeitszeit { width: 18pt; text-align: center; }
  .p-num   { width: 13pt; text-align: center; }
  .p-x     { width: 7pt; text-align: center; font-weight: bold; }
</style>
