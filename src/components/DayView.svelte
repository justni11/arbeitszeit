<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { DEFAULT_PAUSE, DEFAULT_SPESEN, MONTH_NAMES } from '../lib/constants';
  import { calcArbeitszeit } from '../lib/calculator';
  import { formatDecimal, isWeekend, getWochentag, toDateKey } from '../lib/dateUtils';
  import type { DayEntry, MonthData } from '../lib/types';

  export let date: Date;
  export let data: MonthData;
  export let recentLocations: string[] = [];

  const dispatch = createEventDispatcher<{
    change: MonthData;
    navigate: Date;
  }>();

  import { setEntry, deleteEntry } from '../lib/storage';

  $: dateKey = toDateKey(date);
  $: entry = data.entries[dateKey] ?? null;
  $: weekend = isWeekend(date);
  $: wochentag = getWochentag(date);
  $: isSa = wochentag === 'Sa';
  $: isSo = wochentag === 'So';

  // Form state — reset when date changes
  let arbeitsort = '';
  let beginn = '';
  let ende = '';
  let pause: number = DEFAULT_PAUSE;
  let soFeiertag = false;
  let uebernachtung = false;
  let spesen = 0;
  let isDirty = false;

  $: {
    // Re-sync form when date or entry changes
    arbeitsort = entry?.arbeitsort ?? '';
    beginn     = entry?.beginn ?? '';
    ende       = entry?.ende ?? '';
    pause      = entry?.pause ?? DEFAULT_PAUSE;
    soFeiertag = entry?.soFeiertag ?? (weekend.isSaturday || weekend.isSunday);
    uebernachtung = entry?.uebernachtung ?? false;
    spesen     = entry?.spesen ?? 0;
    isDirty    = false;
    // suppress unused warning — dateKey is the actual trigger
    void dateKey;
  }

  $: arbeitszeit = calcArbeitszeit(beginn, ende, pause, arbeitsort);
  $: isFrei = arbeitsort === 'Frei';
  $: isFeiertag = arbeitsort === 'Feiertag';
  $: hasContent = !!arbeitsort || !!beginn || !!ende;

  function markDirty() { isDirty = true; }

  function setArbeitsort(value: string) {
    arbeitsort = value;
    isDirty = true;
    if (value === 'Feiertag') {
      soFeiertag = true; beginn = ''; ende = ''; pause = 0; spesen = 0; uebernachtung = false;
    } else if (value === 'Frei') {
      beginn = ''; ende = ''; pause = 0; spesen = 0; uebernachtung = false;
      soFeiertag = weekend.isSaturday || weekend.isSunday;
    }
  }

  function setUebernachtung(val: boolean) {
    uebernachtung = val;
    isDirty = true;
    if (val && spesen === 0) spesen = DEFAULT_SPESEN;
    else if (!val) spesen = 0;
  }

  function save() {
    const updated = setEntry(data, {
      date: dateKey, beginn, ende, arbeitsort, soFeiertag, uebernachtung,
      pause: Number(pause) || 0,
      spesen: Number(spesen) || 0,
    });
    dispatch('change', updated);
    isDirty = false;
  }

  function clear() {
    const updated = deleteEntry(data, dateKey);
    dispatch('change', updated);
  }

  function goTo(delta: number) {
    const next = new Date(date);
    next.setDate(date.getDate() + delta);
    dispatch('navigate', next);
  }

  // Swipe support
  let touchStartX = 0;
  function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX; }
  function onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) goTo(dx < 0 ? 1 : -1);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="day-view" on:touchstart={onTouchStart} on:touchend={onTouchEnd}>

  <!-- Date header -->
  <div class="date-header" class:weekend-header={isSa || isSo} class:sunday-header={isSo}>
    <button class="arrow-btn" on:click={() => goTo(-1)} aria-label="Vorheriger Tag">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>

    <div class="date-center">
      <div class="weekday-label">{wochentag}</div>
      <div class="date-big">{date.getDate()}</div>
      <div class="month-year">{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}</div>
    </div>

    <button class="arrow-btn" on:click={() => goTo(1)} aria-label="Nächster Tag">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>

  <!-- Hours display -->
  <div class="hours-hero" class:has-hours={arbeitszeit > 0}>
    <span class="hours-number">{arbeitszeit > 0 ? formatDecimal(arbeitszeit) : '—'}</span>
    <span class="hours-unit">Stunden</span>
  </div>

  <!-- Quick chips -->
  <div class="chips-row">
    <button class="chip chip-frei"    on:click={() => setArbeitsort('Frei')}>Frei</button>
    <button class="chip chip-holiday" on:click={() => setArbeitsort('Feiertag')}>Feiertag</button>
    {#each recentLocations as loc}
      <button class="chip chip-recent" on:click={() => setArbeitsort(loc)}>{loc}</button>
    {/each}
  </div>

  <!-- Form -->
  <div class="form-card">

    <div class="form-field">
      <label class="form-label" for="dv-ort">Arbeitsort</label>
      <input
        id="dv-ort"
        type="text"
        class="form-input"
        bind:value={arbeitsort}
        on:input={(e) => setArbeitsort((e.target as HTMLInputElement).value)}
        placeholder="Ort / Baustelle"
      />
    </div>

    {#if !isFrei && !isFeiertag}
      <div class="time-row">
        <div class="form-field">
          <label class="form-label" for="dv-beginn">Beginn</label>
          <input id="dv-beginn" type="text" class="form-input time-input"
            bind:value={beginn} on:input={markDirty}
            placeholder="08.00" inputmode="decimal" />
        </div>
        <div class="time-separator">→</div>
        <div class="form-field">
          <label class="form-label" for="dv-ende">Ende</label>
          <input id="dv-ende" type="text" class="form-input time-input"
            bind:value={ende} on:input={markDirty}
            placeholder="16.00" inputmode="decimal" />
        </div>
      </div>

      <div class="form-field pause-field">
        <label class="form-label" for="dv-pause">Pause (Std.)</label>
        <div class="stepper">
          <button class="stepper-btn" on:click={() => { pause = Math.max(0, (Number(pause) || 0) - 0.5); markDirty(); }}>−</button>
          <span class="stepper-val">{pause}</span>
          <button class="stepper-btn" on:click={() => { pause = (Number(pause) || 0) + 0.5; markDirty(); }}>+</button>
        </div>
      </div>
    {/if}

    <!-- Toggles -->
    <div class="toggles-row">
      <button
        class="toggle-card"
        class:toggle-on={soFeiertag}
        on:click={() => { soFeiertag = !soFeiertag; markDirty(); }}
      >
        <span class="toggle-icon">☀️</span>
        <span class="toggle-name">So + Feiertag</span>
        <span class="toggle-state">{soFeiertag ? 'Ja' : 'Nein'}</span>
      </button>

      {#if !isFrei && !isFeiertag}
        <button
          class="toggle-card"
          class:toggle-on={uebernachtung}
          on:click={() => setUebernachtung(!uebernachtung)}
        >
          <span class="toggle-icon">🌙</span>
          <span class="toggle-name">Übernachtung</span>
          <span class="toggle-state">{uebernachtung ? 'Ja' : 'Nein'}</span>
        </button>
      {/if}
    </div>

    {#if uebernachtung && !isFrei}
      <div class="form-field pause-field">
        <label class="form-label" for="dv-spesen">Spesen (€)</label>
        <div class="stepper">
          <button class="stepper-btn" on:click={() => { spesen = Math.max(0, (Number(spesen) || 0) - 1); markDirty(); }}>−</button>
          <span class="stepper-val">{spesen} €</span>
          <button class="stepper-btn" on:click={() => { spesen = (Number(spesen) || 0) + 1; markDirty(); }}>+</button>
        </div>
      </div>
    {/if}

  </div>

  <!-- Actions -->
  <div class="actions">
    {#if entry}
      <button class="btn-clear" on:click={clear}>Löschen</button>
    {/if}
    <button class="btn-save" class:btn-save-active={isDirty || hasContent} on:click={save}>
      Speichern
    </button>
  </div>

</div>

<style>
  .day-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    padding-bottom: 1rem;
  }

  /* Date header */
  .date-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1rem;
    background: linear-gradient(135deg, #1e3a5f, #1e293b);
    border-bottom: 1px solid #334155;
  }

  .weekend-header {
    background: linear-gradient(135deg, #1e3a5f 0%, #172554 100%);
  }

  .sunday-header {
    background: linear-gradient(135deg, #422006 0%, #2d1b0e 100%);
  }

  .arrow-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .arrow-btn:hover { background: rgba(255,255,255,0.15); color: #e2e8f0; }

  .date-center { text-align: center; flex: 1; }

  .weekday-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #60a5fa;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 0.15rem;
  }
  .sunday-header .weekday-label { color: #fbbf24; }

  .date-big {
    font-size: 3.5rem;
    font-weight: 800;
    color: #f1f5f9;
    line-height: 1;
  }

  .month-year {
    font-size: 0.82rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  /* Hours hero */
  .hours-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1rem 1rem;
    background: #0f172a;
  }

  .hours-number {
    font-size: 2.8rem;
    font-weight: 800;
    color: #475569;
    line-height: 1;
    transition: color 0.2s;
    font-variant-numeric: tabular-nums;
  }

  .hours-hero.has-hours .hours-number { color: #38bdf8; }

  .hours-unit {
    font-size: 0.75rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }

  /* Chips */
  .chips-row {
    display: flex;
    gap: 0.5rem;
    padding: 0 1rem 0.75rem;
    background: #0f172a;
    overflow-x: auto;
    scrollbar-width: none;
    flex-wrap: nowrap;
  }
  .chips-row::-webkit-scrollbar { display: none; }

  .chip {
    white-space: nowrap;
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .chip-frei    { background: #1e293b; border-color: #334155; color: #94a3b8; }
  .chip-frei:hover { background: #334155; }
  .chip-holiday { background: #422006; border-color: #7c2d12; color: #fb923c; }
  .chip-recent  { background: #1e3a5f; border-color: #1d4ed8; color: #60a5fa; }
  .chip-recent:hover { background: #1d4ed8; color: #fff; }

  /* Form */
  .form-card {
    margin: 0 1rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .form-input {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    color: #e2e8f0;
    padding: 0.8rem 0.9rem;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }
  .form-input:focus { border-color: #3b82f6; }

  .time-row {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
  }
  .time-row .form-field { flex: 1; }
  .time-input { text-align: center; font-size: 1.1rem; letter-spacing: 0.05em; }
  .time-separator {
    padding-bottom: 0.8rem;
    color: #475569;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .pause-field { align-items: flex-start; }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    overflow: hidden;
  }
  .stepper-btn {
    width: 48px;
    height: 48px;
    background: none;
    border: none;
    color: #60a5fa;
    font-size: 1.3rem;
    cursor: pointer;
    transition: background 0.1s;
    flex-shrink: 0;
  }
  .stepper-btn:hover { background: #1e293b; }
  .stepper-val {
    flex: 1;
    text-align: center;
    color: #e2e8f0;
    font-size: 1rem;
    font-weight: 600;
    min-width: 60px;
  }

  /* Toggles */
  .toggles-row {
    display: flex;
    gap: 0.75rem;
  }

  .toggle-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.85rem 0.5rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-card.toggle-on {
    background: #1e3a5f;
    border-color: #3b82f6;
  }

  .toggle-icon { font-size: 1.3rem; }

  .toggle-name {
    font-size: 0.7rem;
    color: #64748b;
    font-weight: 600;
    text-align: center;
  }

  .toggle-state {
    font-size: 0.82rem;
    font-weight: 700;
    color: #475569;
  }

  .toggle-on .toggle-state { color: #60a5fa; }

  /* Actions */
  .actions {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1rem 0;
  }

  .btn-clear {
    padding: 0.85rem 1.25rem;
    background: transparent;
    border: 1px solid #991b1b;
    color: #f87171;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-clear:hover { background: #7f1d1d; }

  .btn-save {
    flex: 1;
    padding: 0.85rem;
    background: #1e293b;
    border: 1px solid #334155;
    color: #475569;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-save.btn-save-active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }

  .btn-save.btn-save-active:hover { background: #2563eb; }

  @media print { .day-view { display: none; } }
</style>
