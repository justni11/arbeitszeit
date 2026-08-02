<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  export let items: string[];
  export let value: string;

  const ITEM_H = 52;
  const VISIBLE = 5; // must be odd
  const PAD = Math.floor(VISIBLE / 2);

  const dispatch = createEventDispatcher<{ change: string }>();

  let scrollEl: HTMLDivElement;
  let locked = false;
  let scrollEndTimer: ReturnType<typeof setTimeout>;

  function indexOf(val: string): number {
    const i = items.indexOf(val);
    return i >= 0 ? i : 0;
  }

  function scrollToIndex(index: number, smooth = true) {
    if (!scrollEl) return;
    locked = true;
    scrollEl.scrollTo({ top: index * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
    setTimeout(() => { locked = false; }, 350);
  }

  onMount(() => scrollToIndex(indexOf(value), false));

  // Sync when value changes from outside
  $: scrollToIndex(indexOf(value), true);

  function onScroll() {
    if (locked) return;
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => {
      const raw = Math.round(scrollEl.scrollTop / ITEM_H);
      const idx = Math.max(0, Math.min(items.length - 1, raw));
      locked = true;
      scrollEl.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
      setTimeout(() => { locked = false; }, 350);
      if (items[idx] !== value) {
        value = items[idx];
        dispatch('change', value);
      }
    }, 80);
  }

  function pick(idx: number) {
    value = items[idx];
    dispatch('change', value);
    scrollToIndex(idx);
  }
</script>

<div class="drum" style="--item-h:{ITEM_H}px; --pad:{PAD};">
  <!-- Selection highlight band -->
  <div class="drum-highlight"></div>
  <!-- Fade top / bottom -->
  <div class="drum-fade drum-fade-top"></div>
  <div class="drum-fade drum-fade-bottom"></div>

  <div class="drum-scroll" bind:this={scrollEl} on:scroll={onScroll}>
    <!-- top padding -->
    {#each Array(PAD) as _}
      <div class="drum-pad"></div>
    {/each}

    {#each items as item, i}
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="drum-item"
        class:drum-selected={item === value}
        on:click={() => pick(i)}
      >{item}</div>
    {/each}

    <!-- bottom padding -->
    {#each Array(PAD) as _}
      <div class="drum-pad"></div>
    {/each}
  </div>
</div>

<style>
  .drum {
    position: relative;
    height: calc(var(--item-h) * 5);
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Scrollable track */
  .drum-scroll {
    height: 100%;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    overscroll-behavior: contain;
  }
  .drum-scroll::-webkit-scrollbar { display: none; }

  /* Pad items */
  .drum-pad {
    height: var(--item-h);
    scroll-snap-align: center;
    flex-shrink: 0;
  }

  /* Each item */
  .drum-item {
    height: var(--item-h);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--text-tertiary);
    cursor: pointer;
    scroll-snap-align: center;
    transition: color 0.15s, font-weight 0.15s;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  .drum-selected {
    color: var(--text-primary);
    font-weight: 700;
    font-size: 1.6rem;
  }

  /* Selection band — must stay translucent: it's painted (via DOM order
     + z-index) on top of .drum-scroll, so an opaque fill here would
     hide the selected digits underneath instead of just tinting them. */
  .drum-highlight {
    position: absolute;
    top: calc(var(--item-h) * 2);
    left: 0; right: 0;
    height: var(--item-h);
    background: rgba(47, 111, 237, 0.1);
    border-top: 1px solid var(--accent-soft-border);
    border-bottom: 1px solid var(--accent-soft-border);
    pointer-events: none;
    z-index: 1;
    border-radius: 8px;
    margin: 0 4px;
  }

  /* Fade overlays */
  .drum-fade {
    position: absolute;
    left: 0; right: 0;
    height: calc(var(--item-h) * 2);
    pointer-events: none;
    z-index: 2;
  }
  .drum-fade-top {
    top: 0;
    background: linear-gradient(to bottom, var(--surface-alt) 0%, transparent 100%);
  }
  .drum-fade-bottom {
    bottom: 0;
    background: linear-gradient(to top, var(--surface-alt) 0%, transparent 100%);
  }
</style>
