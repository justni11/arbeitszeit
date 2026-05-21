<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let active: 'day' | 'week' | 'month';
  const dispatch = createEventDispatcher<{ change: 'day' | 'week' | 'month' }>();
</script>

<nav class="bottom-nav">
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
</nav>

<style>
  .bottom-nav {
    display: flex;
    background: #0f172a;
    border-top: 1px solid #1e293b;
    padding-bottom: env(safe-area-inset-bottom);
    flex-shrink: 0;
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    padding: 0.6rem 0.5rem;
    background: none;
    border: none;
    color: #475569;
    cursor: pointer;
    transition: color 0.15s;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .nav-item.active {
    color: #3b82f6;
  }

  .nav-item:hover {
    color: #94a3b8;
  }

  .nav-item.active:hover {
    color: #3b82f6;
  }

  /* Hide on desktop — sidebar replaces navigation */
  @media (min-width: 1024px) {
    .bottom-nav { display: none; }
  }

  @media print {
    .bottom-nav { display: none; }
  }
</style>
