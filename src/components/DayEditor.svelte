<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { DEFAULT_PAUSE, DEFAULT_SPESEN } from '../lib/constants';
  import { calcArbeitszeit, isOvernightShift } from '../lib/calculator';
  import { formatDecimal, isWeekend, getWochentag, formatDate } from '../lib/dateUtils';
  import type { DayEntry, Shift } from '../lib/types';

  export let date: Date;
  export let entry: DayEntry | null;
  export let recentLocations: string[] = [];

  const dispatch = createEventDispatcher<{
    save: DayEntry;
    delete: void;
    cancel: void;
  }>();

  const weekend = isWeekend(date);
  const dateKey = (() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  function emptyShift(): Shift {
    return { beginn: '', ende: '', arbeitsort: '', pause: DEFAULT_PAUSE };
  }

  let dayType = entry?.arbeitsort ?? '';
  let shifts: Shift[] = entry?.shifts?.length ? entry.shifts.map(s => ({ ...s })) : [emptyShift()];
  let soFeiertag = entry?.soFeiertag ?? (weekend.isSaturday || weekend.isSunday);
  let uebernachtung = entry?.uebernachtung ?? false;
  let spesen = entry?.spesen ?? 0;

  $: arbeitszeit = calcArbeitszeit({ arbeitsort: dayType, shifts });
  $: isFrei = dayType === 'Frei';
  $: isFeiertag = dayType === 'Feiertag';
  $: isWorkday = dayType !== 'Frei' && dayType !== 'Feiertag' && dayType !== 'Urlaub';

  function handleDayTypeChange(value: string) {
    dayType = value;
    if (value === 'Feiertag') {
      soFeiertag = true; shifts = []; spesen = 0; uebernachtung = false;
    } else if (value === 'Frei') {
      shifts = []; spesen = 0; uebernachtung = false;
      soFeiertag = weekend.isSaturday || weekend.isSunday;
    } else if (shifts.length === 0) {
      shifts = [emptyShift()];
    }
  }

  function addShift() {
    shifts = [...shifts, emptyShift()];
  }

  function removeShift(i: number) {
    const next = shifts.filter((_, idx) => idx !== i);
    shifts = next.length ? next : [emptyShift()];
  }

  function adjustPause(i: number, delta: number) {
    shifts[i].pause = Math.max(0, (Number(shifts[i].pause) || 0) + delta);
    shifts = shifts;
  }

  function handleUebernachtung(checked: boolean) {
    uebernachtung = checked;
    if (checked && spesen === 0) spesen = DEFAULT_SPESEN;
    else if (!checked) spesen = 0;
  }

  function save() {
    dispatch('save', {
      date: dateKey,
      arbeitsort: dayType,
      shifts: isWorkday ? shifts.filter(s => s.beginn || s.ende || s.arbeitsort) : [],
      soFeiertag, uebernachtung,
      spesen: Number(spesen) || 0,
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') dispatch('cancel');
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_interactive_supports_focus -->
<div class="backdrop" on:click|self={() => dispatch('cancel')} role="dialog" aria-modal="true" transition:fade={{ duration: 180 }}>
  <div class="modal" transition:fly={{ y: 32, duration: 420, easing: backOut }}>

    <!-- Header -->
    <div class="modal-header">
      <div class="modal-date-info">
        <span class="modal-wochentag">{getWochentag(date)}</span>
        <span class="modal-date">{formatDate(date)}</span>
      </div>
      <button class="close-btn" on:click={() => dispatch('cancel')} aria-label="Schließen">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Day-type chips -->
    <div class="chips">
      <button class="chip chip-work" class:chip-active={isWorkday} on:click={() => handleDayTypeChange('')}>Arbeitstag</button>
      <button class="chip chip-frei" class:chip-active={isFrei} on:click={() => handleDayTypeChange('Frei')}>Frei</button>
      <button class="chip chip-holiday" class:chip-active={isFeiertag} on:click={() => handleDayTypeChange('Feiertag')}>Feiertag</button>
    </div>

    <!-- Fields -->
    <div class="fields">

      {#if isWorkday}
        <div class="shifts-list">
          {#each shifts as shift, i (i)}
            <div class="shift-card">
              <div class="shift-card-header">
                <span class="shift-title">Schicht {i + 1}</span>
                {#if shifts.length > 1}
                  <button type="button" class="shift-remove" on:click={() => removeShift(i)} aria-label="Schicht entfernen">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                {/if}
              </div>

              <div class="field">
                <label class="field-label" for="ort-{i}">Arbeitsort</label>
                <input
                  id="ort-{i}"
                  type="text"
                  class="field-input"
                  bind:value={shift.arbeitsort}
                  placeholder="Ort / Baustelle"
                />
                {#if recentLocations.length}
                  <div class="shift-chips">
                    {#each recentLocations as loc}
                      <button type="button" class="chip chip-recent" on:click={() => (shift.arbeitsort = loc)}>{loc}</button>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="field-row">
                <div class="field">
                  <label class="field-label" for="beginn-{i}">
                    Beginn
                  </label>
                  <input id="beginn-{i}" type="text" class="field-input" bind:value={shift.beginn}
                    placeholder="08.00" inputmode="decimal" />
                </div>
                <div class="field">
                  <label class="field-label" for="ende-{i}">
                    Ende
                    {#if isOvernightShift(shift.beginn, shift.ende)}
                      <span class="next-day-badge" title="Ende am nächsten Tag">nächster Tag</span>
                    {/if}
                  </label>
                  <input id="ende-{i}" type="text" class="field-input" bind:value={shift.ende}
                    placeholder="16.00" inputmode="decimal" />
                </div>
              </div>

              <div class="field half">
                <label class="field-label" for="pause-{i}">Pause (Std.)</label>
                <div class="stepper">
                  <button class="sb" on:click={() => adjustPause(i, -0.5)}>−</button>
                  <span class="sv">{shift.pause}</span>
                  <button class="sb" on:click={() => adjustPause(i, 0.5)}>+</button>
                </div>
              </div>
            </div>
          {/each}

          <button type="button" class="add-shift-btn" on:click={addShift}>+ Schicht hinzufügen</button>
        </div>
      {/if}

      <!-- Toggles — iOS-style switch rows -->
      <div class="switch-list">
        <div class="switch-row">
          <span class="toggle-label">So + Feiertag</span>
          <button
            class="ios-switch" class:on={soFeiertag}
            role="switch" aria-checked={soFeiertag} aria-label="So + Feiertag"
            on:click={() => (soFeiertag = !soFeiertag)}
          ><span class="ios-switch-knob"></span></button>
        </div>

        {#if isWorkday}
          <div class="switch-divider"></div>
          <div class="switch-row">
            <span class="toggle-label">Übernachtung</span>
            <button
              class="ios-switch" class:on={uebernachtung}
              role="switch" aria-checked={uebernachtung} aria-label="Übernachtung"
              on:click={() => handleUebernachtung(!uebernachtung)}
            ><span class="ios-switch-knob"></span></button>
          </div>
        {/if}
      </div>

      {#if uebernachtung && isWorkday}
        <div class="field half">
          <label class="field-label" for="spesen">Spesen (€)</label>
          <input id="spesen" type="number" class="field-input" bind:value={spesen} min="0" step="1" />
        </div>
      {/if}

      <!-- Live hours preview -->
      {#if !isFrei}
        <div class="hours-preview">
          <span class="hours-label">Arbeitszeit</span>
          <span class="hours-value">{formatDecimal(arbeitszeit) || '—'} Std.</span>
        </div>
      {/if}
    </div>

    <!-- Footer actions -->
    <div class="modal-footer">
      <button class="btn-delete" on:click={() => dispatch('delete')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        Löschen
      </button>
      <div class="btn-group">
        <button class="btn-cancel" on:click={() => dispatch('cancel')}>Abbrechen</button>
        <button class="btn-save" on:click={save}>Speichern</button>
      </div>
    </div>

  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(28, 35, 51, 0.35);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
  }

  .modal {
    background: var(--glass-bg-strong);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: 18px;
    width: 100%;
    max-width: 420px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--glass-shadow), var(--shadow-lg);
  }

  /* Header */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }

  .modal-date-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .modal-wochentag {
    background: var(--accent);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .modal-date {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
  .close-btn:hover { color: var(--text-primary); background: var(--surface-alt); }

  /* Chips */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.85rem 1.25rem 0;
  }

  .chip {
    border-radius: 999px;
    padding: 0.3rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
  }
  .chip-work    { background: var(--surface); border-color: var(--border); color: var(--text-secondary); }
  .chip-frei    { background: var(--surface); border-color: var(--border); color: var(--text-secondary); }
  .chip-frei:hover { background: var(--surface-alt); color: var(--text-primary); }
  .chip-holiday { background: var(--holiday-soft); border-color: #f6cfa9; color: var(--holiday); }
  .chip-holiday:hover { background: var(--holiday); color: #fff; }
  .chip-recent  { background: var(--accent-soft); border-color: var(--accent-soft-border); color: var(--accent-dark); }
  .chip-recent:hover { background: var(--accent); color: #fff; }
  .chip-active  { background: var(--accent); border-color: var(--accent); color: #fff; }

  /* Fields */
  .fields {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 0.85rem 1.25rem;
  }

  .shifts-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .shift-card {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.75rem;
  }

  .shift-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .shift-title {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .shift-remove {
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
    background: var(--danger-soft); border: 1px solid #f6c6c1; color: var(--danger);
    border-radius: 6px; cursor: pointer;
  }
  .shift-remove:hover { background: var(--danger); color: #fff; }

  .shift-chips { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.4rem; }
  .shift-chips .chip { padding: 0.2rem 0.55rem; font-size: 0.7rem; }

  .add-shift-btn {
    padding: 0.6rem;
    background: var(--surface); border: 1px dashed var(--border-strong);
    color: var(--text-secondary); border-radius: 10px;
    font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .add-shift-btn:hover { background: var(--accent-soft); border-color: var(--accent); color: var(--accent-dark); }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .field.half { max-width: 130px; }

  .field-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .next-day-badge {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--accent-dark);
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft-border);
    border-radius: 999px;
    padding: 0.05rem 0.45rem;
    letter-spacing: 0.02em;
    text-transform: none;
    white-space: nowrap;
  }

  .field-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    padding: 0.6rem 0.75rem;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }
  .field-input:focus { border-color: var(--accent); }

  .field-row {
    display: flex;
    gap: 0.75rem;
  }
  .field-row .field { flex: 1; }

  /* Stepper */
  .stepper {
    display: flex; align-items: center;
    background: var(--surface-alt); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
    width: fit-content;
  }
  .sb { width: 36px; height: 36px; background: none; border: none; color: var(--accent); font-size: 1.2rem; cursor: pointer; }
  .sb:hover { background: var(--accent-soft); }
  .sv { min-width: 44px; text-align: center; color: var(--text-primary); font-size: 0.88rem; font-weight: 600; }

  /* Toggles — iOS-style switch list */
  .switch-list {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }

  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.65rem 0.85rem;
  }

  .switch-divider { height: 1px; background: var(--border); margin: 0 0.85rem; }

  .toggle-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  /* Real iOS switch: track + sliding knob */
  .ios-switch {
    position: relative;
    width: 46px; height: 28px;
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
    width: 24px; height: 24px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,.25), 0 1px 1px rgba(0,0,0,.1);
    transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .ios-switch.on .ios-switch-knob { transform: translateX(18px); }

  .ios-switch:active { transform: none; opacity: 1; }
  .ios-switch:active .ios-switch-knob { transform: scale(0.92); }
  .ios-switch.on:active .ios-switch-knob { transform: translateX(18px) scale(0.92); }

  /* Hours preview */
  .hours-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft-border);
    border-radius: 8px;
    padding: 0.6rem 0.85rem;
  }
  .hours-label { font-size: 0.82rem; color: var(--accent-dark); font-weight: 600; }
  .hours-value { font-size: 1.1rem; font-weight: 700; color: var(--accent-dark); }

  /* Footer */
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.25rem;
    border-top: 1px solid var(--border);
  }

  .btn-group { display: flex; gap: 0.5rem; }

  .btn-delete {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--danger-soft);
    border: 1px solid #f6c6c1;
    color: var(--danger);
    border-radius: 8px;
    padding: 0.5rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-delete:hover { background: var(--danger); color: #fff; }

  .btn-cancel {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-cancel:hover { background: var(--surface-alt); color: var(--text-primary); }

  .btn-save {
    background: var(--accent);
    border: 1px solid var(--accent);
    color: #fff;
    border-radius: 8px;
    padding: 0.5rem 1.2rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-save:hover { background: var(--accent-dark); }

  @media print { .backdrop { display: none; } }
</style>
