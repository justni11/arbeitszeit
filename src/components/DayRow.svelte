<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getWochentag, formatDate, formatDecimal } from '../lib/dateUtils';
  import { calcArbeitszeit } from '../lib/calculator';
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
  $: isFeiertag = entry?.arbeitsort === 'Feiertag';
  $: isFrei = entry?.arbeitsort === 'Frei';
  $: isWeekend = isSa || isSo;
  $: hasEntry = !!entry && !isFrei;
</script>

{#if printMode}
  <!-- PDF-style row -->
  <tr class="print-row" class:print-sa={isSa} class:print-so={isSo}>
    <td class="p-datum">{formatDate(date)}</td>
    <td class="p-tag">{wochentag}</td>
    <td class="p-time">{entry?.beginn ?? ''}</td>
    <td class="p-time">{entry?.ende ?? ''}</td>
    <td class="p-ort">{entry?.arbeitsort ?? ''}</td>
    <td class="p-num">{arbeitszeit > 0 ? formatDecimal(arbeitszeit).replace(',', '.') : ''}</td>
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
    <td class="col-time">{entry?.ende ?? ''}</td>
    <td class="col-ort">
      {#if isFrei}
        <span class="pill pill-frei">Frei</span>
      {:else if isFeiertag}
        <span class="pill pill-feiertag">Feiertag</span>
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
    border-bottom: 1px solid #1e3a5f20;
    transition: background 0.1s;
  }

  .day-row:hover { background: #334155 !important; }

  .day-row td {
    padding: 0.6rem 0.85rem;
    font-size: 0.875rem;
    color: #cbd5e1;
    white-space: nowrap;
  }

  /* Weekend tints */
  .saturday { background: #172554; }
  .sunday   { background: #2d1b0e; }
  .frei     { background: #0f172a; }
  .feiertag { background: #1a1a07; }

  .saturday td, .sunday td { color: #93c5fd; }
  .sunday td { color: #fcd34d; }

  /* Datum column */
  .col-datum { min-width: 5.5rem; }
  .date-text { color: #94a3b8; font-size: 0.8rem; font-variant-numeric: tabular-nums; }

  /* Tag/Wochentag */
  .col-tag { width: 3rem; }
  .tag-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    width: 2rem;
    text-align: center;
  }
  .tag-weekend { color: #60a5fa; }
  .sunday .tag-weekend { color: #fbbf24; }

  /* Times */
  .col-time {
    width: 4.5rem;
    font-variant-numeric: tabular-nums;
    color: #94a3b8;
    font-size: 0.83rem;
  }

  /* Ort */
  .col-ort { min-width: 10rem; }
  .ort-text { color: #e2e8f0; font-weight: 500; }

  .pill {
    display: inline-block;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .pill-frei    { background: #1e293b; color: #64748b; border: 1px solid #334155; }
  .pill-feiertag { background: #422006; color: #fb923c; border: 1px solid #7c2d12; }

  /* Hours */
  .col-num { width: 4rem; text-align: right; font-variant-numeric: tabular-nums; }
  .hours-badge {
    display: inline-block;
    background: #0c4a6e;
    color: #38bdf8;
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
  .dot-so   { background: #f59e0b; }
  .dot-nacht { background: #8b5cf6; }

  /* ===== PRINT ROWS ===== */
  .print-row td {
    border: 1px solid #000;
    padding: 2pt 3pt;
    font-size: 9pt;
  }

  .p-datum { min-width: 50pt; }
  .p-tag   { width: 18pt; text-align: center; font-weight: bold; }
  .p-time  { width: 28pt; text-align: center; }
  .p-ort   { min-width: 80pt; }
  .p-num   { width: 28pt; text-align: center; }
  .p-x     { width: 24pt; text-align: center; font-weight: bold; }
</style>
