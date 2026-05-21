<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { DEFAULT_PAUSE, DEFAULT_SPESEN, MONTH_NAMES } from '../lib/constants';
  import { calcArbeitszeit } from '../lib/calculator';
  import { formatDecimal, isWeekend, getWochentag, toDateKey } from '../lib/dateUtils';
  import { setEntry, deleteEntry } from '../lib/storage';
  import TimePicker from './TimePicker.svelte';
  import type { DayEntry, MonthData } from '../lib/types';

  export let date: Date;
  export let data: MonthData;
  export let recentLocations: string[] = [];

  const dispatch = createEventDispatcher<{
    change: MonthData;
    navigate: Date;
  }>();

  $: dateKey = toDateKey(date);
  $: entry = data.entries[dateKey] ?? null;
  $: weekend = isWeekend(date);
  $: wochentag = getWochentag(date);
  $: isSa = wochentag === 'Sa';
  $: isSo = wochentag === 'So';

  // Form state — reset whenever date changes
  let arbeitsort = '';
  let beginn = '';
  let ende = '';
  let pause: number = DEFAULT_PAUSE;
  let soFeiertag = false;
  let uebernachtung = false;
  let spesen = 0;
  let isDirty = false;

  $: {
    void dateKey; // trigger reactivity on date change
    arbeitsort    = entry?.arbeitsort ?? '';
    beginn        = entry?.beginn ?? '';
    ende          = entry?.ende ?? '';
    pause         = entry?.pause ?? DEFAULT_PAUSE;
    soFeiertag    = entry?.soFeiertag ?? (weekend.isSaturday || weekend.isSunday);
    uebernachtung = entry?.uebernachtung ?? false;
    spesen        = entry?.spesen ?? 0;
    isDirty       = false;
  }

  $: arbeitszeit = calcArbeitszeit(beginn, ende, pause, arbeitsort);
  $: isFrei     = arbeitsort === 'Frei';
  $: isFeiertag = arbeitsort === 'Feiertag';
  $: hasContent = !!arbeitsort || !!beginn || !!ende;

  function mark() { isDirty = true; }

  function setArbeitsort(v: string) {
    arbeitsort = v; isDirty = true;
    if (v === 'Feiertag') {
      soFeiertag = true; beginn = ''; ende = ''; pause = 0; spesen = 0; uebernachtung = false;
    } else if (v === 'Frei') {
      beginn = ''; ende = ''; pause = 0; spesen = 0; uebernachtung = false;
      soFeiertag = weekend.isSaturday || weekend.isSunday;
    }
  }

  function setUebernachtung(v: boolean) {
    uebernachtung = v; isDirty = true;
    if (v && spesen === 0) spesen = DEFAULT_SPESEN;
    else if (!v) spesen = 0;
  }

  function save() {
    const updated = setEntry(data, {
      date: dateKey, beginn, ende, arbeitsort, soFeiertag, uebernachtung,
      pause: Number(pause) || 0, spesen: Number(spesen) || 0,
    });
    dispatch('change', updated);
    isDirty = false;
  }

  function clear() {
    dispatch('change', deleteEntry(data, dateKey));
  }

  function goTo(delta: number) {
    const next = new Date(date);
    next.setDate(date.getDate() + delta);
    dispatch('navigate', next);
  }

  // Swipe
  let tx = 0;
  function onTouchStart(e: TouchEvent) { tx = e.touches[0].clientX; }
  function onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 60) goTo(dx < 0 ? 1 : -1);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="day-view" on:touchstart={onTouchStart} on:touchend={onTouchEnd}>

  <!-- Date strip -->
  <div class="date-strip" class:strip-sa={isSa} class:strip-so={isSo}>
    <button class="arrow" on:click={() => goTo(-1)} aria-label="Vorheriger Tag">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="date-center">
      <div class="dc-wt">{wochentag}</div>
      <div class="dc-num">{date.getDate()}</div>
      <div class="dc-my">{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}</div>
    </div>
    <button class="arrow" on:click={() => goTo(1)} aria-label="Nächster Tag">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>

  <!-- Hours hero -->
  <div class="hours-hero" class:lit={arbeitszeit > 0}>
    <span class="hz-num">{arbeitszeit > 0 ? formatDecimal(arbeitszeit) : '—'}</span>
    <span class="hz-unit">Stunden</span>
  </div>

  <!-- Quick chips -->
  <div class="chips">
    <button class="chip c-frei"    on:click={() => setArbeitsort('Frei')}>Frei</button>
    <button class="chip c-holiday" on:click={() => setArbeitsort('Feiertag')}>Feiertag</button>
    {#each recentLocations as loc}
      <button class="chip c-recent" on:click={() => setArbeitsort(loc)}>{loc}</button>
    {/each}
  </div>

  <!-- Form card -->
  <div class="form-card">

    <!-- Arbeitsort -->
    <div class="field">
      <label class="fl" for="dv-ort">Arbeitsort</label>
      <input id="dv-ort" type="text" class="fi"
        bind:value={arbeitsort}
        on:input={(e) => setArbeitsort((e.target as HTMLInputElement).value)}
        placeholder="Ort / Baustelle" />
    </div>

    <!-- Time pickers -->
    {#if !isFrei && !isFeiertag}
      <div class="time-row">
        <TimePicker bind:value={beginn} label="Beginn" on:change={mark} />
        <div class="time-arrow">→</div>
        <TimePicker bind:value={ende} label="Ende" on:change={mark} />
      </div>

      <!-- Pause stepper -->
      <div class="field-inline">
        <span class="fl">Pause (Std.)</span>
        <div class="stepper">
          <button class="sb" on:click={() => { pause = Math.max(0, (Number(pause)||0) - 0.5); mark(); }}>−</button>
          <span class="sv">{pause}</span>
          <button class="sb" on:click={() => { pause = (Number(pause)||0) + 0.5; mark(); }}>+</button>
        </div>
      </div>
    {/if}

    <!-- Toggles -->
    <div class="toggles">
      <button class="tog" class:tog-on={soFeiertag} on:click={() => { soFeiertag = !soFeiertag; mark(); }}>
        <span class="tog-icon">☀️</span>
        <span class="tog-name">So + Feiertag</span>
        <span class="tog-val">{soFeiertag ? 'Ja' : 'Nein'}</span>
      </button>

      {#if !isFrei && !isFeiertag}
        <button class="tog" class:tog-on={uebernachtung} on:click={() => setUebernachtung(!uebernachtung)}>
          <span class="tog-icon">🌙</span>
          <span class="tog-name">Übernachtung</span>
          <span class="tog-val">{uebernachtung ? 'Ja' : 'Nein'}</span>
        </button>
      {/if}
    </div>

    <!-- Spesen -->
    {#if uebernachtung && !isFrei}
      <div class="field-inline">
        <span class="fl">Spesen (€)</span>
        <div class="stepper">
          <button class="sb" on:click={() => { spesen = Math.max(0, (Number(spesen)||0) - 1); mark(); }}>−</button>
          <span class="sv">{spesen} €</span>
          <button class="sb" on:click={() => { spesen = (Number(spesen)||0) + 1; mark(); }}>+</button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Actions -->
  <div class="actions">
    {#if entry}
      <button class="btn-del" on:click={clear}>Löschen</button>
    {/if}
    <button class="btn-save" class:active={isDirty || hasContent} on:click={save}>
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
    overscroll-behavior: contain;
  }

  /* Date strip */
  .date-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: linear-gradient(135deg, #1e3a5f, #1e293b);
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
  }
  .strip-sa { background: linear-gradient(135deg, #1e3a5f, #172554); }
  .strip-so { background: linear-gradient(135deg, #422006, #2d1b0e); }

  .arrow {
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: #94a3b8; cursor: pointer;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .arrow:hover { background: rgba(255,255,255,0.14); color: #e2e8f0; }

  .date-center { text-align: center; flex: 1; }
  .dc-wt  { font-size: 0.75rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.12em; }
  .strip-so .dc-wt { color: #fbbf24; }
  .dc-num { font-size: 3.2rem; font-weight: 800; color: #f1f5f9; line-height: 1; }
  .dc-my  { font-size: 0.78rem; color: #64748b; margin-top: 0.2rem; }

  /* Hours hero */
  .hours-hero {
    display: flex; flex-direction: column; align-items: center;
    padding: 1.1rem 1rem 0.75rem;
    background: #0f172a;
    flex-shrink: 0;
  }
  .hz-num  { font-size: 2.6rem; font-weight: 800; color: #334155; line-height: 1; font-variant-numeric: tabular-nums; transition: color 0.2s; }
  .hours-hero.lit .hz-num { color: #38bdf8; }
  .hz-unit { font-size: 0.7rem; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.2rem; }

  /* Chips */
  .chips {
    display: flex; gap: 0.4rem;
    padding: 0 1rem 0.75rem;
    background: #0f172a;
    overflow-x: auto; scrollbar-width: none; flex-wrap: nowrap; flex-shrink: 0;
  }
  .chips::-webkit-scrollbar { display: none; }

  .chip { white-space: nowrap; border-radius: 999px; padding: 0.3rem 0.8rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; flex-shrink: 0; }
  .c-frei    { background: #1e293b; border-color: #334155; color: #94a3b8; }
  .c-holiday { background: #422006; border-color: #7c2d12; color: #fb923c; }
  .c-recent  { background: #1e3a5f; border-color: #1d4ed8; color: #60a5fa; }
  .c-recent:hover { background: #1d4ed8; color: #fff; }

  /* Form */
  .form-card {
    margin: 0 1rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 1rem;
    display: flex; flex-direction: column; gap: 1rem;
    flex-shrink: 0;
  }

  .field { display: flex; flex-direction: column; gap: 0.35rem; }
  .fl { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; }
  .fi {
    background: #0f172a; border: 1px solid #334155; border-radius: 10px;
    color: #e2e8f0; padding: 0.75rem 0.9rem; font-size: 1rem; outline: none;
    transition: border-color 0.15s; width: 100%;
  }
  .fi:focus { border-color: #3b82f6; }

  /* Time row */
  .time-row {
    display: flex; align-items: flex-end; justify-content: center; gap: 0.75rem;
  }
  .time-arrow { color: #475569; font-size: 1.2rem; padding-bottom: 1.2rem; flex-shrink: 0; }

  /* Inline field (label + control side by side) */
  .field-inline {
    display: flex; align-items: center; justify-content: space-between;
  }

  /* Stepper */
  .stepper {
    display: flex; align-items: center;
    background: #0f172a; border: 1px solid #334155; border-radius: 10px; overflow: hidden;
  }
  .sb { width: 44px; height: 44px; background: none; border: none; color: #60a5fa; font-size: 1.4rem; cursor: pointer; transition: background 0.1s; }
  .sb:hover { background: #1e293b; }
  .sv { min-width: 56px; text-align: center; color: #e2e8f0; font-size: 0.95rem; font-weight: 600; }

  /* Toggles */
  .toggles { display: flex; gap: 0.75rem; }

  .tog {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: #0f172a; border: 1px solid #334155; border-radius: 12px;
    cursor: pointer; transition: all 0.2s;
  }
  .tog.tog-on { background: #1e3a5f; border-color: #3b82f6; }

  .tog-icon { font-size: 1.2rem; }
  .tog-name { font-size: 0.67rem; color: #64748b; font-weight: 600; text-align: center; }
  .tog-val  { font-size: 0.78rem; font-weight: 700; color: #475569; }
  .tog-on .tog-val { color: #60a5fa; }

  /* Actions */
  .actions { display: flex; gap: 0.75rem; padding: 1rem; flex-shrink: 0; }

  .btn-del {
    padding: 0.85rem 1.1rem; background: transparent;
    border: 1px solid #991b1b; color: #f87171; border-radius: 12px;
    font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .btn-del:hover { background: #7f1d1d; }

  .btn-save {
    flex: 1; padding: 0.85rem;
    background: #1e293b; border: 1px solid #334155; color: #475569;
    border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .btn-save.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
  .btn-save.active:hover { background: #2563eb; }

  @media print { .day-view { display: none; } }
</style>
