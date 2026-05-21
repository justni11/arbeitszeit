<script lang="ts">
  import { createEventDispatcher } from 'svelte';
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
<div class="backdrop" on:click|self={() => dispatch('cancel')} role="dialog" aria-modal="true">
  <div class="modal">

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

      <!-- Toggles -->
      <div class="toggles">
        <div class="toggle-item">
          <span class="toggle-label">So + Feiertag</span>
          <button class="toggle-btn" class:on={soFeiertag}
            on:click={() => (soFeiertag = !soFeiertag)}>
            {soFeiertag ? 'Ja' : 'Nein'}
          </button>
        </div>

        {#if !isFrei && !isFeiertag}
          <div class="toggle-item">
            <span class="toggle-label">Übernachtung</span>
            <button class="toggle-btn" class:on={uebernachtung}
              on:click={() => handleUebernachtung(!uebernachtung)}>
              {uebernachtung ? 'Ja' : 'Nein'}
            </button>
          </div>

          <div class="toggle-item">
            <span class="toggle-label">Spesen (€)</span>
            <input type="number" class="spesen-input" bind:value={spesen} min="0" step="1" />
          </div>
        {/if}
      </div>

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
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
  }

  .modal {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    overflow: hidden;
  }

  /* Header */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #334155;
    background: #0f172a;
  }

  .modal-date-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .modal-wochentag {
    background: #3b82f6;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .modal-date {
    font-size: 0.95rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
  .close-btn:hover { color: #e2e8f0; background: #334155; }

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
  .chip-frei    { background: #1e293b; border-color: #334155; color: #94a3b8; }
  .chip-frei:hover { background: #334155; color: #e2e8f0; }
  .chip-holiday { background: #422006; border-color: #7c2d12; color: #fb923c; }
  .chip-holiday:hover { background: #7c2d12; }
  .chip-recent  { background: #1e3a5f; border-color: #1d4ed8; color: #60a5fa; }
  .chip-recent:hover { background: #1d4ed8; color: #fff; }

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
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field-input {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    padding: 0.6rem 0.75rem;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }
  .field-input:focus { border-color: #3b82f6; }

  .field-row {
    display: flex;
    gap: 0.75rem;
  }
  .field-row .field { flex: 1; }

  /* Toggles */
  .toggles {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .toggle-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .toggle-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .toggle-btn {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #64748b;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    transition: all 0.15s;
  }
  .toggle-btn.on {
    background: #1d4ed8;
    border-color: #3b82f6;
    color: #fff;
  }

  .spesen-input {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
    width: 80px;
    outline: none;
  }
  .spesen-input:focus { border-color: #3b82f6; }

  /* Hours preview */
  .hours-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0c4a6e;
    border: 1px solid #0369a1;
    border-radius: 8px;
    padding: 0.6rem 0.85rem;
  }
  .hours-label { font-size: 0.82rem; color: #7dd3fc; font-weight: 600; }
  .hours-value { font-size: 1.1rem; font-weight: 700; color: #38bdf8; }

  /* Footer */
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.25rem;
    border-top: 1px solid #334155;
    background: #0f172a;
  }

  .btn-group { display: flex; gap: 0.5rem; }

  .btn-delete {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: transparent;
    border: 1px solid #991b1b;
    color: #f87171;
    border-radius: 8px;
    padding: 0.5rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-delete:hover { background: #7f1d1d; }

  .btn-cancel {
    background: transparent;
    border: 1px solid #334155;
    color: #94a3b8;
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-cancel:hover { background: #334155; color: #e2e8f0; }

  .btn-save {
    background: #3b82f6;
    border: 1px solid #3b82f6;
    color: #fff;
    border-radius: 8px;
    padding: 0.5rem 1.2rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-save:hover { background: #2563eb; }

  @media print { .backdrop { display: none; } }
</style>
