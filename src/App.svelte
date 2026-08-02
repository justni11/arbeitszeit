<script lang="ts">
  import { onMount } from 'svelte';
  import { MONTH_NAMES } from './lib/constants';
  import {
    loadMonth, saveMonth, loadWorkerName, saveWorkerName,
    loadRecentLocations, saveRecentLocation, setEntry
  } from './lib/storage';
  import { toDateKey } from './lib/dateUtils';
  import DayView    from './components/DayView.svelte';
  import WeekView   from './components/WeekView.svelte';
  import MonthCalendar from './components/MonthCalendar.svelte';
  import BottomNav  from './components/BottomNav.svelte';
  import MonthView  from './components/MonthView.svelte'; // print only
  import VacationModal from './components/VacationModal.svelte';
  import type { MonthData } from './lib/types';

  type View = 'day' | 'week' | 'month';

  const now = new Date();
  let view: View = 'day';
  let selectedDate = new Date(now);
  let year  = now.getFullYear();
  let month = now.getMonth() + 1;
  let data: MonthData = { year, month, entries: {} };
  let workerName = '';
  let editingName = false;
  let recentLocations: string[] = [];
  let showVacation = false;

  onMount(() => {
    workerName    = loadWorkerName();
    recentLocations = loadRecentLocations();
    data          = loadMonth(year, month);
  });

  function ensureMonth(d: Date) {
    const y = d.getFullYear(), m = d.getMonth() + 1;
    if (y !== year || m !== month) {
      saveMonth(data); year = y; month = m; data = loadMonth(y, m);
    }
  }

  function onChange(e: CustomEvent<MonthData>) {
    data = e.detail; saveMonth(data);
    for (const entry of Object.values(data.entries)) saveRecentLocation(entry.arbeitsort);
    recentLocations = loadRecentLocations();
  }

  function onDayNavigate(e: CustomEvent<Date>) { selectedDate = e.detail; ensureMonth(e.detail); }

  function onSelectDay(e: CustomEvent<Date>) {
    selectedDate = e.detail; ensureMonth(e.detail); view = 'day';
  }

  function onNavigateWeek(e: CustomEvent<number>) {
    const d = new Date(selectedDate); d.setDate(d.getDate() + e.detail * 7);
    selectedDate = d; ensureMonth(d);
  }

  function onNavigateMonth(e: CustomEvent<number>) {
    let m = month + e.detail, y = year;
    if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
    saveMonth(data); year = y; month = m; data = loadMonth(y, m);
    selectedDate = new Date(y, m - 1, 1);
  }

  function nameBlur() { editingName = false; saveWorkerName(workerName); }

  function applyVacation(e: CustomEvent<{ von: string; bis: string }>) {
    const { von, bis } = e.detail;
    const start = new Date(von);
    const end = new Date(bis);
    const monthUpdates = new Map<string, MonthData>();

    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) {
        const y = cur.getFullYear(), m = cur.getMonth() + 1;
        const key = `${y}-${m}`;
        if (!monthUpdates.has(key)) monthUpdates.set(key, loadMonth(y, m));
        const md = monthUpdates.get(key)!;
        monthUpdates.set(key, setEntry(md, {
          date: toDateKey(cur), arbeitsort: 'Urlaub',
          beginn: '', ende: '', pause: 0,
          soFeiertag: false, uebernachtung: false, spesen: 0,
        }));
      }
      cur.setDate(cur.getDate() + 1);
    }

    for (const [, md] of monthUpdates) saveMonth(md);
    data = loadMonth(year, month);
    showVacation = false;
  }
</script>

<!-- ===== PRINT OUTPUT ===== -->
<div class="print-only">
  <div class="ph">
    <div>
      <b>Arbeitszeiterfassung</b><br>
      {MONTH_NAMES[month - 1]}<br>
      <span style="margin-top:6pt;display:block">Name: {workerName}</span>
    </div>
    <div style="text-align:right">
      {year}<br>
      <span style="font-size:16pt;font-weight:bold">IBO TRAFFIC</span>
    </div>
  </div>
  <MonthView {data} recentLocations={[]} on:change={onChange} />
</div>

<!-- ===== SCREEN APP ===== -->
<div class="app screen-only">

  <!-- Top bar (always visible) -->
  <header class="topbar">
    <div class="tb-left">
      <div class="logo">IBO</div>
      <div class="tb-titles">
        <span class="tb-company">IBO TRAFFIC</span>
        <span class="tb-sub">Arbeitszeiterfassung</span>
      </div>
    </div>
    <div class="tb-right">
      {#if editingName}
        <input class="name-in" bind:value={workerName}
          on:blur={nameBlur} on:keydown={(e) => e.key === 'Enter' && nameBlur()}
          placeholder="Name eingeben..." />
      {:else}
        <button class="name-btn" on:click={() => (editingName = true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          {workerName || 'Name'}
        </button>
      {/if}
      <button class="vacation-btn" title="Urlaub eintragen" on:click={() => (showVacation = true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Urlaub
      </button>
      <button class="icon-btn" title="Drucken" on:click={() => window.print()}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      </button>
    </div>
  </header>

  <!-- Body: desktop = two-column, mobile = single view -->
  <div class="body">

    <!-- Desktop LEFT sidebar: always shows month calendar -->
    <aside class="sidebar">
      <MonthCalendar
        {data} selectedDate={selectedDate} compact={true}
        on:selectDay={onSelectDay}
        on:navigateMonth={onNavigateMonth}
      />
    </aside>

    <!-- Main content area -->
    <div class="main">
      {#if view === 'day'}
        <DayView date={selectedDate} {data} {recentLocations}
          on:change={onChange} on:navigate={onDayNavigate} />
      {:else if view === 'week'}
        <WeekView date={selectedDate} {data}
          on:selectDay={onSelectDay} on:navigateWeek={onNavigateWeek} />
      {:else}
        <!-- Month view on mobile (sidebar always shows on desktop) -->
        <MonthCalendar
          {data} selectedDate={selectedDate}
          on:selectDay={onSelectDay}
          on:navigateMonth={onNavigateMonth}
        />
      {/if}
    </div>

  </div>

  <!-- Bottom nav (mobile only — hidden on desktop via CSS) -->
  <BottomNav active={view} on:change={(e) => (view = e.detail)} />

  {#if showVacation}
    <VacationModal
      on:confirm={applyVacation}
      on:cancel={() => (showVacation = false)}
    />
  {/if}

</div>

<style>
  /* ===== RESET ===== */
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    background: #0f172a;
    overflow: hidden;
  }

  /* ===== TOPBAR ===== */
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1rem; height: 52px;
    background: #0f172a; border-bottom: 1px solid #1e293b;
    flex-shrink: 0; gap: 0.5rem;
  }
  .tb-left  { display: flex; align-items: center; gap: 0.6rem; }
  .tb-right { display: flex; align-items: center; gap: 0.4rem; }

  .logo {
    width: 30px; height: 30px; background: #3b82f6;
    color: #fff; font-weight: 800; font-size: 0.65rem;
    border-radius: 7px; display: flex; align-items: center;
    justify-content: center; letter-spacing: 0.04em; flex-shrink: 0;
  }
  .tb-titles { display: flex; flex-direction: column; line-height: 1.2; }
  .tb-company { font-size: 0.82rem; font-weight: 700; color: #f1f5f9; letter-spacing: 0.03em; }
  .tb-sub     { font-size: 0.6rem; color: #475569; }

  .name-btn {
    display: flex; align-items: center; gap: 0.3rem;
    background: #1e293b; border: 1px solid #334155;
    color: #94a3b8; padding: 0.3rem 0.6rem;
    border-radius: 6px; cursor: pointer; font-size: 0.75rem;
    transition: all 0.15s; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .name-btn:hover { background: #334155; color: #e2e8f0; }

  .name-in {
    background: #1e293b; border: 1px solid #3b82f6; color: #f1f5f9;
    padding: 0.3rem 0.55rem; border-radius: 6px; font-size: 0.78rem;
    outline: none; max-width: 130px;
  }

  .icon-btn {
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    background: #1e293b; border: 1px solid #334155; border-radius: 6px;
    color: #64748b; cursor: pointer; transition: all 0.15s; flex-shrink: 0;
  }
  .icon-btn:hover { background: #334155; color: #94a3b8; }

  .vacation-btn {
    display: flex; align-items: center; gap: 0.35rem;
    background: #1e3a5f; border: 1px solid #1d4ed8;
    color: #60a5fa; padding: 0.3rem 0.65rem;
    border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600;
    transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
  }
  .vacation-btn:hover { background: #1d4ed8; color: #fff; }

  /* ===== BODY ===== */
  .body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  /* Sidebar: hidden on mobile, shown on desktop */
  .sidebar {
    display: none;
    width: 300px;
    flex-shrink: 0;
    border-right: 1px solid #1e293b;
    overflow: hidden;
  }

  /* Main: full width on mobile, remaining width on desktop */
  .main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* ===== RESPONSIVE ===== */

  /* Desktop: show sidebar, hide bottom nav */
  @media (min-width: 1024px) {
    .sidebar { display: flex; flex-direction: column; }
  }

  /* Large desktop: wider sidebar */
  @media (min-width: 1400px) {
    .sidebar { width: 340px; }
  }

  /* ===== PRINT ===== */
  .screen-only { }
  .print-only  { display: none; font-family: Arial, sans-serif; }

  .ph {
    display: flex; justify-content: space-between;
    padding-bottom: 1rem; border-bottom: 2px solid #000;
    margin-bottom: 0.25rem; font-size: 10pt;
  }

  @media print {
    .screen-only { display: none; }
    .print-only  { display: block; }
  }
</style>
