<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { downloadBackup, restoreBackup } from '../lib/storage';

  const dispatch = createEventDispatcher<{ restored: void; cancel: void }>();

  let fileInput: HTMLInputElement;
  let pendingJson: string | null = null;
  let pendingFileName = '';
  let error = '';
  let restored = false;

  function pickFile() {
    error = '';
    fileInput.click();
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    error = '';
    const reader = new FileReader();
    reader.onload = () => {
      pendingJson = reader.result as string;
      pendingFileName = file.name;
    };
    reader.onerror = () => { error = 'Datei konnte nicht gelesen werden.'; };
    reader.readAsText(file);
    input.value = '';
  }

  function confirmRestore() {
    if (!pendingJson) return;
    try {
      restoreBackup(pendingJson);
      pendingJson = null;
      restored = true;
      setTimeout(() => dispatch('restored'), 900);
    } catch {
      error = 'Diese Datei ist keine gültige Sicherung.';
      pendingJson = null;
    }
  }
</script>

<input
  bind:this={fileInput}
  type="file"
  accept="application/json"
  style="display: none"
  on:change={onFileChange}
/>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" on:click|self={() => dispatch('cancel')} transition:fade={{ duration: 180 }}>
  <div class="modal" transition:fly={{ y: 32, duration: 420, easing: backOut }}>

    <div class="modal-header">
      <div class="modal-icon-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </div>
      <h2 class="modal-title">Daten sichern</h2>
    </div>

    {#if restored}
      <div class="success">
        <span class="success-icon">✓</span>
        <span>Sicherung wiederhergestellt</span>
      </div>
    {:else}
      <div class="section">
        <h3 class="section-title">Sicherung erstellen</h3>
        <p class="section-text">
          Lädt alle deine Einträge als Datei herunter. Am besten in <strong>iCloud Drive</strong> speichern —
          dann ist sie auch nach einem Handywechsel noch da.
        </p>
        <button class="btn-primary" on:click={downloadBackup}>Backup herunterladen</button>
      </div>

      <div class="divider"></div>

      <div class="section">
        <h3 class="section-title">Sicherung wiederherstellen</h3>
        <p class="section-text">Ersetzt alle aktuellen Daten auf diesem Gerät mit dem Inhalt der Datei.</p>

        {#if pendingJson}
          <div class="confirm-box">
            <span class="confirm-text">„{pendingFileName}" wiederherstellen?</span>
            <div class="confirm-actions">
              <button class="btn-cancel" on:click={() => (pendingJson = null)}>Abbrechen</button>
              <button class="btn-danger" on:click={confirmRestore}>Wiederherstellen</button>
            </div>
          </div>
        {:else}
          <button class="btn-secondary" on:click={pickFile}>Datei auswählen</button>
        {/if}

        {#if error}
          <div class="error-text">{error}</div>
        {/if}
      </div>
    {/if}

    {#if !restored}
      <button class="btn-close" on:click={() => dispatch('cancel')}>Fertig</button>
    {/if}
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
    max-width: 420px;
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

  .modal-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0; }

  .section { display: flex; flex-direction: column; gap: 0.6rem; }
  .section-title { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); margin: 0; }
  .section-text { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; margin: 0; }

  .divider { height: 1px; background: var(--border); }

  .btn-primary {
    padding: 0.75rem; background: var(--accent); border: 1px solid var(--accent);
    color: #fff; border-radius: 12px; font-size: 0.88rem; font-weight: 700;
    cursor: pointer; box-shadow: 0 6px 16px rgba(47,111,237,.3);
  }
  .btn-primary:hover { background: var(--accent-dark); }

  .btn-secondary {
    padding: 0.75rem; background: var(--surface); border: 1px solid var(--border);
    color: var(--text-primary); border-radius: 12px; font-size: 0.88rem; font-weight: 600;
    cursor: pointer;
  }
  .btn-secondary:hover { background: var(--surface-alt); }

  .confirm-box {
    display: flex; flex-direction: column; gap: 0.65rem;
    background: var(--danger-soft); border: 1px solid #f6c6c1;
    border-radius: 12px; padding: 0.85rem;
  }
  .confirm-text { font-size: 0.82rem; color: var(--text-primary); font-weight: 600; }
  .confirm-actions { display: flex; gap: 0.5rem; }

  .btn-cancel {
    flex: 1; padding: 0.55rem; background: transparent; border: 1px solid var(--border);
    color: var(--text-secondary); border-radius: 10px; font-size: 0.82rem; font-weight: 600; cursor: pointer;
  }
  .btn-cancel:hover { background: var(--surface-alt); }

  .btn-danger {
    flex: 1; padding: 0.55rem; background: var(--danger); border: 1px solid var(--danger);
    color: #fff; border-radius: 10px; font-size: 0.82rem; font-weight: 700; cursor: pointer;
  }
  .btn-danger:hover { opacity: 0.9; }

  .error-text { font-size: 0.78rem; color: var(--danger); font-weight: 600; }

  .btn-close {
    padding: 0.7rem; background: transparent; border: none;
    color: var(--text-tertiary); font-size: 0.85rem; font-weight: 600; cursor: pointer;
  }
  .btn-close:hover { color: var(--text-primary); }

  .success {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 1.2rem 0.5rem;
    font-size: 0.95rem; font-weight: 600; color: var(--vacation);
  }
  .success-icon {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--vacation-soft); color: var(--vacation);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.95rem; flex-shrink: 0;
  }
</style>
