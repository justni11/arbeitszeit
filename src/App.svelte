<script lang="ts">
  import { onMount } from 'svelte';
  import { MONTH_NAMES } from './lib/constants';
  import {
    loadMonth, saveMonth, loadWorkerName, saveWorkerName,
    loadRecentLocations, saveRecentLocation
  } from './lib/storage';
  import { getDaysInMonth, toDateKey } from './lib/dateUtils';
  import DayView from './components/DayView.svelte';
  import WeekView from './components/WeekView.svelte';
  import MonthCalendar from './components/MonthCalendar.svelte';
  import BottomNav from './components/BottomNav.svelte';
  import MonthView from './components/MonthView.svelte'; // print-only
  import type { MonthData } from './lib/types';

  type View = 'day' | 'week' | 'month';

  const now = new Date();
  let view: View = 'day';
  let selectedDate: Date = new Date(now);
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  let data: MonthData = { year, month, entries: {} };
  let workerName = '';
  let editingName = false;
  let recentLocations: string[] = [];

  onMount(() => {
    workerName = loadWorkerName();
    recentLocations = loadRecentLocations();
    data = loadMonth(year, month);
  });

  // When selectedDate changes month, load that month's data
  function ensureMonthLoaded(d: Date) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (y !== year || m !== month) {
      saveMonth(data);
      year = y;
      month = m;
      data = loadMonth(year, month);
    }
  }

  function handleDataChange(e: CustomEvent<MonthData>) {
    data = e.detail;
    saveMonth(data);
    for (const entry of Object.values(data.entries)) {
      saveRecentLocation(entry.arbeitsort);
    }
    recentLocations = loadRecentLocations();
  }

  function handleDayNavigate(e: CustomEvent<Date>) {
    selectedDate = e.detail;
    ensureMonthLoaded(e.detail);
  }

  function handleSelectDay(e: CustomEvent<Date>) {
    selectedDate = e.detail;
    ensureMonthLoaded(e.detail);
    view = 'day';
  }

  function handleNavigateWeek(e: CustomEvent<number>) {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + e.detail * 7);
    selectedDate = next;
    ensureMonthLoaded(next);
  }

  function handleNavigateMonth(e: CustomEvent<number>) {
    let m = month + e.detail;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    saveMonth(data);
    year = y; month = m;
    data = loadMonth(year, month);
    // Move selectedDate into the new month
    selectedDate = new Date(y, m - 1, 1);
  }

  function handleNameBlur() {
    editingName = false;
    saveWorkerName(workerName);
  }
</script>

<!-- ===== PRINT OUTPUT (PDF-style, hidden on screen) ===== -->
<div class="print-only">
  <div class="print-header">
    <div>
      <div class="ph-title">Arbeitszeiterfassung</div>
      <div class="ph-month">{MONTH_NAMES[month - 1]}</div>
      <div class="ph-name">Name: {workerName}</div>
    </div>
    <div class="ph-right">
      <div class="ph-year">{year}</div>
      <div class="ph-company">IBO TRAFFIC</div>
    </div>
  </div>
  <MonthView {data} recentLocations={[]} on:change={handleDataChange} />
</div>

<!-- ===== SCREEN APP ===== -->
<div class="app screen-only">

  <!-- Top bar -->
  <header class="topbar">
    <div class="topbar-left">
      <div class="logo-mark">IBO</div>
      <div class="topbar-titles">
        <span class="topbar-company">IBO TRAFFIC</span>
        <span class="topbar-sub">Arbeitszeiterfassung</span>
      </div>
    </div>
    <div class="topbar-right">
      {#if editingName}
        <input
          class="name-input"
          bind:value={workerName}
          on:blur={handleNameBlur}
          on:keydown={(e) => e.key === 'Enter' && handleNameBlur()}
          placeholder="Name eingeben..."
        />
      {:else}
        <button class="name-btn" on:click={() => (editingName = true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          {workerName || 'Name eingeben'}
        </button>
      {/if}
      <button class="print-btn" on:click={() => window.print()} title="Drucken">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      </button>
    </div>
  </header>

  <!-- View content -->
  <div class="view-content">
    {#if view === 'day'}
      <DayView
        date={selectedDate}
        {data}
        {recentLocations}
        on:change={handleDataChange}
        on:navigate={handleDayNavigate}
      />
    {:else if view === 'week'}
      <WeekView
        date={selectedDate}
        {data}
        on:selectDay={handleSelectDay}
        on:navigateWeek={handleNavigateWeek}
      />
    {:else}
      <MonthCalendar
        {data}
        selectedDate={selectedDate}
        on:selectDay={handleSelectDay}
        on:navigateMonth={handleNavigateMonth}
      />
    {/if}
  </div>

  <!-- Bottom navigation -->
  <BottomNav {view} on:change={(e) => (view = e.detail)} />

</div>

<style>
  /* ===== SCREEN LAYOUT ===== */
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh; /* dynamic viewport height for mobile */
    max-width: 480px;
    margin: 0 auto;
    background: #0f172a;
    overflow: hidden;
  }

  /* Topbar */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 56px;
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
    flex-shrink: 0;
    gap: 0.5rem;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .logo-mark {
    width: 32px;
    height: 32px;
    background: #3b82f6;
    color: #fff;
    font-weight: 800;
    font-size: 0.7rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  .topbar-titles {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .topbar-company {
    font-size: 0.85rem;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 0.03em;
  }

  .topbar-sub {
    font-size: 0.65rem;
    color: #475569;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .name-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: #1e293b;
    border: 1px solid #334155;
    color: #94a3b8;
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.78rem;
    transition: all 0.15s;
    white-space: nowrap;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .name-btn:hover { background: #334155; color: #e2e8f0; }

  .name-input {
    background: #1e293b;
    border: 1px solid #3b82f6;
    color: #f1f5f9;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
    outline: none;
    max-width: 130px;
  }

  .print-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .print-btn:hover { background: #334155; color: #94a3b8; }

  /* Main scrollable view */
  .view-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ===== PRINT ===== */
  .screen-only { }
  .print-only  { display: none; }

  @media print {
    .screen-only { display: none; }
    .print-only  { display: block; }
  }

  /* ===== PRINT HEADER ===== */
  .print-header {
    display: flex;
    justify-content: space-between;
    padding: 0 0 1rem;
    border-bottom: 2px solid #000;
    margin-bottom: 0.25rem;
    font-family: Arial, sans-serif;
  }

  .ph-title  { font-size: 11pt; font-weight: bold; }
  .ph-month  { font-size: 10pt; margin-top: 2pt; }
  .ph-name   { font-size: 10pt; margin-top: 8pt; }
  .ph-right  { text-align: right; }
  .ph-year   { font-size: 10pt; }
  .ph-company { font-size: 16pt; font-weight: bold; margin-top: 4pt; }
</style>
