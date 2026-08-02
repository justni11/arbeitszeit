<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    confirm: { von: string; bis: string };
    cancel: void;
  }>();

  const today = new Date().toISOString().slice(0, 10);
  let von = today;
  let bis = today;

  function countWeekdays(from: string, to: string): number {
    if (!from || !to || from > to) return 0;
    const start = new Date(from);
    const end = new Date(to);
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  $: days = countWeekdays(von, bis);
  $: valid = !!von && !!bis && von <= bis && days > 0;

  function confirm() {
    if (!valid) return;
    dispatch('confirm', { von, bis });
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" on:click|self={() => dispatch('cancel')}>
  <div class="modal">
    <div class="modal-header">
      <div class="modal-icon-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h2 class="modal-title">Urlaub eintragen</h2>
    </div>

    <div class="fields">
      <div class="field">
        <label class="fl" for="vac-von">Von</label>
        <input id="vac-von" type="date" class="date-in" bind:value={von} />
      </div>
      <div class="field-arrow">→</div>
      <div class="field">
        <label class="fl" for="vac-bis">Bis</label>
        <input id="vac-bis" type="date" class="date-in" bind:value={bis} min={von} />
      </div>
    </div>

    {#if von > bis}
      <div class="info info-warn">Enddatum muss nach dem Startdatum liegen</div>
    {:else if days > 0}
      <div class="info">
        <span class="info-num">{days}</span>
        <span class="info-txt">Werktag{days !== 1 ? 'e' : ''} werden als Urlaub (je 8 Std.) eingetragen<br><span class="info-sub">Samstage und Sonntage werden übersprungen</span></span>
      </div>
    {/if}

    <div class="actions">
      <button class="btn-cancel" on:click={() => dispatch('cancel')}>Abbrechen</button>
      <button class="btn-confirm" disabled={!valid} on:click={confirm}>
        Eintragen
      </button>
    </div>
  </div>
</div>

<style>
  .overlay {
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
    border-radius: 22px;
    padding: 1.5rem;
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    box-shadow: var(--glass-shadow), var(--shadow-lg);
  }

  .modal-header { display: flex; align-items: center; gap: 0.75rem; }

  .modal-icon-wrap {
    width: 36px; height: 36px;
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft-border);
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    color: var(--accent);
    flex-shrink: 0;
  }

  .modal-title {
    font-size: 1.05rem; font-weight: 700;
    color: var(--text-primary); margin: 0;
  }

  .fields {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .field { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }

  .field-arrow {
    color: var(--text-tertiary);
    font-size: 1.1rem;
    padding-bottom: 0.9rem;
    flex-shrink: 0;
  }

  .fl {
    font-size: 0.7rem; font-weight: 700;
    color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.07em;
  }

  .date-in {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-primary);
    padding: 0.7rem 0.75rem;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
    color-scheme: light;
  }
  .date-in:focus { border-color: var(--accent); }

  .info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.85rem 1rem;
  }

  .info-num {
    font-size: 2rem; font-weight: 800;
    color: var(--accent-dark);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    line-height: 1;
  }

  .info-txt {
    font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;
  }

  .info-sub { font-size: 0.72rem; color: var(--text-tertiary); }

  .info-warn {
    background: var(--danger-soft);
    border-color: #f6c6c1;
    color: var(--danger);
    font-size: 0.82rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
  }

  .actions { display: flex; gap: 0.75rem; }

  .btn-cancel {
    flex: 1; padding: 0.85rem;
    background: transparent; border: 1px solid var(--border);
    color: var(--text-secondary); border-radius: 12px;
    font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .btn-cancel:hover { background: var(--surface-alt); color: var(--text-primary); }

  .btn-confirm {
    flex: 2; padding: 0.85rem;
    background: var(--accent); border: 1px solid var(--accent);
    color: #fff; border-radius: 12px;
    font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 6px 16px rgba(47,111,237,.3);
  }
  .btn-confirm:hover:not(:disabled) { background: var(--accent-dark); }
  .btn-confirm:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
</style>
