<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { DEFAULT_PAUSE, DEFAULT_SPESEN } from '../lib/constants';
  import { calcArbeitszeit } from '../lib/calculator';
  import { formatDecimal, isWeekend, getWochentag, formatDate } from '../lib/dateUtils';
  import type { DayEntry } from '../lib/types';

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

  let arbeitsort = entry?.arbeitsort ?? '';
  let beginn = entry?.beginn ?? '';
  let ende = entry?.ende ?? '';
  let pause = entry?.pause ?? DEFAULT_PAUSE;
  let soFeiertag = entry?.soFeiertag ?? (weekend.isSaturday || weekend.isSunday);
  let uebernachtung = entry?.uebernachtung ?? false;
  let spesen = entry?.spesen ?? 0;

  $: arbeitszeit = calcArbeitszeit(beginn, ende, pause, arbeitsort);
  $: isFrei = arbeitsort === 'Frei';
  $: isFeiertag = arbeitsort === 'Feiertag';

  function handleArbeitsortChange(value: string) {
    arbeitsort = value;
    if (value === 'Feiertag') {
      soFeiertag = true;
      beginn = ''; ende = ''; pause = 0; spesen = 0; uebernachtung = false;
    } else if (value === 'Frei') {
      beginn = ''; ende = ''; pause = 0; spesen = 0; uebernachtung = false;
      soFeiertag = weekend.isSaturday || weekend.isSunday;
    }
  }

  function handleUebernachtung(checked: boolean) {
    uebernachtung = checked;
    if (checked && spesen === 0) spesen = DEFAULT_SPESEN;
    else if (!checked) spesen = 0;
  }

  function save() {
    dispatch('save', {
      date: dateKey,
      beginn, ende, arbeitsort, soFeiertag, uebernachtung,
      pause: Number(pause) || 0,
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

    <!-- Quick-fill chips -->
    <div class="chips">
      <button class="chip chip-frei"    on:click={() => handleArbeitsortChange('Frei')}>Frei</button>
      <button class="chip chip-holiday" on:click={() => handleArbeitsortChange('Feiertag')}>Feiertag</button>
      {#each recentLocations as loc}
        <button class="chip chip-recent" on:click={() => handleArbeitsortChange(loc)}>{loc}</button>
      {/each}
    </div>

    <!-- Fields -->
    <div class="fields">

      <div class="field">
        <label class="field-label" for="ort">Arbeitsort</label>
        <input
          id="ort"
          type="text"
          class="field-input"
          bind:value={arbeitsort}
          on:input={(e) => handleArbeitsortChange((e.target as HTMLInputElement).value)}
          placeholder="Ort / Baustelle"
        />
      </div>

      {#if !isFrei && !isFeiertag}
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="beginn">Beginn</label>
            <input id="beginn" type="text" class="field-input" bind:value={beginn}
              placeholder="08.00" inputmode="decimal" />
          </div>
          <div class="field">
            <label class="field-label" for="ende">Ende</label>
            <input id="ende" type="text" class="field-input" bind:value={ende}
              placeholder="16.00" inputmode="decimal" />
          </div>
        </div>

        <div class="field half">
          <label class="field-label" for="pause">Pause (Std.)</label>
          <input id="pause" type="number" class="field-input" bind:value={pause}
            min="0" max="4" step="0.5" />
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

        {#if !isFrei && !isFeiertag}
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

      {#if !isFrei && !isFeiertag}
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
    box-shadow: var(--glass-shadow), var(--shadow-lg);
    overflow: hidden;
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
  .chip-frei    { background: var(--surface); border-color: var(--border); color: var(--text-secondary); }
  .chip-frei:hover { background: var(--surface-alt); color: var(--text-primary); }
  .chip-holiday { background: var(--holiday-soft); border-color: #f6cfa9; color: var(--holiday); }
  .chip-holiday:hover { background: var(--holiday); color: #fff; }
  .chip-recent  { background: var(--accent-soft); border-color: var(--accent-soft-border); color: var(--accent-dark); }
  .chip-recent:hover { background: var(--accent); color: #fff; }

  /* Fields */
  .fields {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 0.85rem 1.25rem;
  }

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
