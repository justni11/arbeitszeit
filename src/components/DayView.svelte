<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { DEFAULT_PAUSE, DEFAULT_SPESEN, MONTH_NAMES } from '../lib/constants';
  import { calcArbeitszeit, isOvernightShift } from '../lib/calculator';
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
  $: overnight = isOvernightShift(beginn, ende);
  $: isFrei     = arbeitsort === 'Frei';
  $: isFeiertag = arbeitsort === 'Feiertag';
  $: isUrlaub   = arbeitsort === 'Urlaub';
  $: hasContent = !!arbeitsort || !!beginn || !!ende;

  function mark() { isDirty = true; }

  function setArbeitsort(v: string) {
    arbeitsort = v; isDirty = true;
    if (v === 'Feiertag') {
      soFeiertag = true; beginn = ''; ende = ''; pause = 0; spesen = 0; uebernachtung = false;
    } else if (v === 'Urlaub') {
      soFeiertag = false; beginn = ''; ende = ''; pause = 0; spesen = 0; uebernachtung = false;
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

  let navDirection = 1;
  function goTo(delta: number) {
    navDirection = delta;
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

  <!-- Hero card: date + hours in one elevated surface -->
  <div class="hero-card" class:hero-sa={isSa} class:hero-so={isSo}>
    <div class="hero-top">
      <button class="arrow" on:click={() => goTo(-1)} aria-label="Vorheriger Tag">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="date-center">
        {#key dateKey}
          <div
            class="date-center-inner"
            in:fly={{ x: navDirection * 28, duration: 240, easing: cubicOut }}
            out:fly={{ x: navDirection * -28, duration: 180, easing: cubicOut }}
          >
            <div class="dc-wt">{wochentag}</div>
            <div class="dc-num">{date.getDate()}</div>
            <div class="dc-my">{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}</div>
          </div>
        {/key}
      </div>
      <button class="arrow" on:click={() => goTo(1)} aria-label="Nächster Tag">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <div class="hero-divider"></div>

    <div class="hero-hours" class:lit={arbeitszeit > 0}>
      <span class="hz-num">{arbeitszeit > 0 ? formatDecimal(arbeitszeit) : '—'}</span>
      <span class="hz-unit">Stunden</span>
    </div>
  </div>

  <!-- Quick chips -->
  <div class="chips">
    <button class="chip c-frei"    on:click={() => setArbeitsort('Frei')}>Frei</button>
    <button class="chip c-holiday" on:click={() => setArbeitsort('Feiertag')}>Feiertag</button>
    <button class="chip c-urlaub"  on:click={() => setArbeitsort('Urlaub')}>Urlaub</button>
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
    {#if !isFrei && !isFeiertag && !isUrlaub}
      <div class="time-row">
        <TimePicker bind:value={beginn} label="Beginn" on:change={mark} />
        <div class="time-arrow">→</div>
        <div class="time-end-wrap">
          <TimePicker bind:value={ende} label="Ende" on:change={mark} />
          {#if overnight}
            <span class="next-day-badge" title="Ende am nächsten Tag">nächster Tag</span>
          {/if}
        </div>
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

    <!-- Toggles — iOS-style switch rows -->
    <div class="switch-list">
      <div class="switch-row">
        <span class="sr-icon">☀️</span>
        <span class="sr-label">So + Feiertag</span>
        <button
          class="ios-switch" class:on={soFeiertag}
          role="switch" aria-checked={soFeiertag} aria-label="So + Feiertag"
          on:click={() => { soFeiertag = !soFeiertag; mark(); }}
        ><span class="ios-switch-knob"></span></button>
      </div>

      {#if !isFrei && !isFeiertag && !isUrlaub}
        <div class="switch-divider"></div>
        <div class="switch-row">
          <span class="sr-icon">🌙</span>
          <span class="sr-label">Übernachtung</span>
          <button
            class="ios-switch" class:on={uebernachtung}
            role="switch" aria-checked={uebernachtung} aria-label="Übernachtung"
            on:click={() => setUebernachtung(!uebernachtung)}
          ><span class="ios-switch-knob"></span></button>
        </div>
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

  /* Hero card — date nav + hours reading, one elevated surface */
  .hero-card {
    margin: 1rem 1rem 0.85rem;
    background: linear-gradient(160deg, var(--accent-soft), #fff 75%);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    flex-shrink: 0;
    overflow: hidden;
  }
  .hero-sa { background: linear-gradient(160deg, var(--sat-soft), #fff 75%); }
  .hero-so { background: linear-gradient(160deg, var(--sun-soft), #fff 75%); }

  .hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1rem;
  }

  .arrow {
    width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.8);
    border: 1px solid var(--glass-border);
    border-radius: 13px;
    color: var(--text-secondary); cursor: pointer;
    transition: background 0.15s, transform 0.12s;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }
  .arrow:hover { background: #fff; color: var(--text-primary); }

  .date-center { position: relative; text-align: center; flex: 1; min-height: 4.6rem; }
  .date-center-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; }
  .dc-wt  { font-size: 0.72rem; font-weight: 700; color: var(--sat); text-transform: uppercase; letter-spacing: 0.14em; }
  .hero-so .dc-wt { color: var(--sun); }
  .dc-num { font-size: 3.4rem; font-weight: 800; color: var(--text-primary); line-height: 1; letter-spacing: -0.02em; }
  .dc-my  { font-size: 0.78rem; color: var(--text-tertiary); margin-top: 0.15rem; font-weight: 500; }

  .hero-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin: 0 1.25rem;
  }

  /* Hours reading, folded into the hero card */
  .hero-hours {
    display: flex; align-items: baseline; justify-content: center; gap: 0.4rem;
    padding: 0.85rem 1rem 1rem;
  }
  .hz-num  { font-size: 1.9rem; font-weight: 800; color: var(--border-strong); line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; transition: color 0.2s; }
  .hero-hours.lit .hz-num { color: var(--accent-dark); }
  .hz-unit { font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }

  /* Chips */
  .chips {
    display: flex; gap: 0.4rem;
    padding: 0 1rem 0.85rem;
    overflow-x: auto; scrollbar-width: none; flex-wrap: nowrap; flex-shrink: 0;
  }
  .chips::-webkit-scrollbar { display: none; }

  .chip { white-space: nowrap; border-radius: 999px; padding: 0.35rem 0.8rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; flex-shrink: 0; }
  .c-frei    { background: var(--surface); border-color: var(--border); color: var(--text-secondary); box-shadow: var(--shadow-sm); }
  .c-holiday { background: var(--holiday-soft); border-color: #f6cfa9; color: var(--holiday); }
  .c-urlaub  { background: var(--vacation-soft); border-color: #b7e8c8; color: var(--vacation); }
  .c-urlaub:hover { background: var(--vacation); color: #fff; }
  .c-recent  { background: var(--accent-soft); border-color: var(--accent-soft-border); color: var(--accent-dark); }
  .c-recent:hover { background: var(--accent); color: #fff; }

  /* Form */
  .form-card {
    margin: 0 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.1rem;
    display: flex; flex-direction: column; gap: 1.1rem;
    flex-shrink: 0;
    box-shadow: var(--shadow-md);
    transition: box-shadow 0.2s;
  }

  .field { display: flex; flex-direction: column; gap: 0.35rem; }
  .fl { font-size: 0.72rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.07em; }
  .fi {
    background: var(--surface-alt); border: 1px solid var(--border); border-radius: 10px;
    color: var(--text-primary); padding: 0.75rem 0.9rem; font-size: 1rem; outline: none;
    transition: border-color 0.15s; width: 100%;
  }
  .fi:focus { border-color: var(--accent); }

  /* Time row */
  .time-row {
    display: flex; align-items: flex-end; justify-content: center; gap: 0.75rem;
  }
  .time-arrow { color: var(--text-tertiary); font-size: 1.2rem; padding-bottom: 1.2rem; flex-shrink: 0; }

  .time-end-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
  .next-day-badge {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--accent-dark);
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft-border);
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  /* Inline field (label + control side by side) */
  .field-inline {
    display: flex; align-items: center; justify-content: space-between;
  }

  /* Stepper */
  .stepper {
    display: flex; align-items: center;
    background: var(--surface-alt); border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
  }
  .sb { width: 44px; height: 44px; background: none; border: none; color: var(--accent); font-size: 1.4rem; cursor: pointer; transition: background 0.1s; }
  .sb:hover { background: var(--accent-soft); }
  .sv { min-width: 56px; text-align: center; color: var(--text-primary); font-size: 0.95rem; font-weight: 600; }

  /* Toggles — iOS-style switch list */
  .switch-list {
    background: var(--surface-alt);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .switch-row {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.7rem 0.85rem;
  }

  .sr-icon { font-size: 1.05rem; flex-shrink: 0; }
  .sr-label { flex: 1; font-size: 0.9rem; font-weight: 500; color: var(--text-primary); }

  .switch-divider { height: 1px; background: var(--border); margin: 0 0.85rem; }

  /* Real iOS switch: track + sliding knob */
  .ios-switch {
    position: relative;
    width: 50px; height: 30px;
    padding: 2px;
    background: #dfe3ea;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.2s ease;
  }
  .ios-switch.on { background: var(--accent); }

  .ios-switch-knob {
    display: block;
    width: 26px; height: 26px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,.25), 0 1px 1px rgba(0,0,0,.1);
    transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .ios-switch.on .ios-switch-knob { transform: translateX(20px); }

  /* Switches shouldn't inherit the global button press-scale — they animate the knob instead */
  .ios-switch:active { transform: none; opacity: 1; }
  .ios-switch:active .ios-switch-knob { transform: scale(0.92); }
  .ios-switch.on:active .ios-switch-knob { transform: translateX(20px) scale(0.92); }

  /* Actions */
  .actions { display: flex; gap: 0.75rem; padding: 1rem; flex-shrink: 0; }

  .btn-del {
    padding: 0.85rem 1.1rem; background: var(--danger-soft);
    border: 1px solid #f6c6c1; color: var(--danger); border-radius: 12px;
    font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .btn-del:hover { background: var(--danger); color: #fff; }

  .btn-save {
    flex: 1; padding: 0.85rem;
    background: var(--surface-alt); border: 1px solid var(--border); color: var(--text-tertiary);
    border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .btn-save.active { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 6px 16px rgba(47,111,237,.3); }
  .btn-save.active:hover { background: var(--accent-dark); }

  @media print { .day-view { display: none; } }
</style>
