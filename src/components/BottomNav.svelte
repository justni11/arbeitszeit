<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let active: 'day' | 'week' | 'month';
  const dispatch = createEventDispatcher<{ change: 'day' | 'week' | 'month' }>();

  const order: Array<'day' | 'week' | 'month'> = ['day', 'week', 'month'];
  $: activeIndex = order.indexOf(active);
</script>

<nav class="bottom-nav">
  <div class="nav-track">
    <div class="active-pill" style="transform: translateX({activeIndex * 100}%)"></div>
    <button
      class="nav-item"
      class:active={active === 'day'}
      on:click={() => dispatch('change', 'day')}
    >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <circle cx="12" cy="16" r="2" fill="currentColor" stroke="none"/>
    </svg>
    <span>Tag</span>
  </button>

  <button
    class="nav-item"
    class:active={active === 'week'}
    on:click={() => dispatch('change', 'week')}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14" stroke-width="3" stroke-linecap="round"/>
      <line x1="12" y1="14" x2="12" y2="14" stroke-width="3" stroke-linecap="round"/>
      <line x1="16" y1="14" x2="16" y2="14" stroke-width="3" stroke-linecap="round"/>
      <line x1="8" y1="18" x2="8" y2="18" stroke-width="3" stroke-linecap="round"/>
      <line x1="12" y1="18" x2="12" y2="18" stroke-width="3" stroke-linecap="round"/>
    </svg>
    <span>Woche</span>
  </button>

  <button
    class="nav-item"
    class:active={active === 'month'}
    on:click={() => dispatch('change', 'month')}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <rect x="7" y="13" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.5"/>
      <rect x="13" y="13" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.5"/>
    </svg>
    <span>Monat</span>
  </button>
  </div>
</nav>

<style>
  .bottom-nav {
    display: flex;
    justify-content: center;
    padding: 0 0.75rem calc(0.6rem + env(safe-area-inset-bottom));
    flex-shrink: 0;
  }

  .nav-track {
    position: relative;
    display: flex;
    width: 100%;
    max-width: 420px;
    background: var(--glass-bg-strong);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: 999px;
    box-shadow: var(--glass-shadow), var(--shadow-lg);
    padding: 6px;
  }

  .active-pill {
    position: absolute;
    top: 6px; bottom: 6px; left: 6px;
    width: calc((100% - 12px) / 3);
    background: #fff;
    border-radius: 999px;
    box-shadow: var(--shadow-md), 0 0 0 1px rgba(255,255,255,.8) inset;
    transition: transform 0.35s cubic-bezier(0.34, 1.15, 0.64, 1);
    z-index: 0;
  }

  .nav-item {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    padding: 0.55rem 0.5rem;
    background: none;
    border: none;
    border-radius: 999px;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: color 0.2s;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .nav-item.active {
    color: var(--accent);
  }

  .nav-item:hover {
    color: var(--text-secondary);
  }

  .nav-item.active:hover {
    color: var(--accent);
  }

  /* Hide on desktop — sidebar replaces navigation */
  @media (min-width: 1024px) {
    .bottom-nav { display: none; }
  }

  @media print {
    .bottom-nav { display: none; }
  }
</style>
