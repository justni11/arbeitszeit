<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { MONTH_NAMES } from '../lib/constants';
  import { exportCSV } from '../lib/exporter';
  import type { MonthData } from '../lib/types';

  export let year: number;
  export let month: number;
  export let data: MonthData;

  const dispatch = createEventDispatcher();
</script>

<div class="nav-bar">
  <div class="nav-month">
    <button class="nav-arrow" on:click={() => dispatch('prev')} aria-label="Vorheriger Monat">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <span class="nav-label">{MONTH_NAMES[month - 1]} {year}</span>
    <button class="nav-arrow" on:click={() => dispatch('next')} aria-label="Nächster Monat">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>

  <div class="nav-actions">
    <button class="action-btn outline" on:click={() => exportCSV(data)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      CSV
    </button>
    <button class="action-btn primary" on:click={() => window.print()}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Drucken
    </button>
  </div>
</div>

<style>
  .nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.5rem;
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
    flex-shrink: 0;
  }

  .nav-month {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid #334155;
    background: #1e293b;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.15s;
  }

  .nav-arrow:hover {
    background: #334155;
    color: #e2e8f0;
  }

  .nav-label {
    font-size: 1rem;
    font-weight: 600;
    color: #f1f5f9;
    min-width: 10rem;
    text-align: center;
  }

  .nav-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.02em;
  }

  .outline {
    background: transparent;
    border: 1px solid #334155;
    color: #94a3b8;
  }

  .outline:hover {
    background: #1e293b;
    color: #e2e8f0;
  }

  .primary {
    background: #3b82f6;
    border: 1px solid #3b82f6;
    color: #fff;
  }

  .primary:hover {
    background: #2563eb;
    border-color: #2563eb;
  }

  @media print {
    .nav-bar { display: none; }
  }
</style>
