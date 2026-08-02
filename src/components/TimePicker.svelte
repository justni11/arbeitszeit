<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import DrumPicker from './DrumPicker.svelte';

  /** Value in "HH.MM" format, e.g. "08.00" */
  export let value: string = '';
  export let label: string = '';

  const dispatch = createEventDispatcher<{ change: string }>();

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  function parse(v: string): { h: string; m: string } {
    if (!v) return { h: '08', m: '00' };
    const [h, m] = v.split('.');
    const hh = (h ?? '08').padStart(2, '0');
    const mm = (m ?? '00').padStart(2, '0');
    return { h: hh, m: mm };
  }

  let h = parse(value).h;
  let m = parse(value).m;

  // Keep h/m in sync when value changes externally
  $: {
    const p = parse(value);
    h = p.h;
    m = p.m;
  }

  function emit() {
    const next = `${h}.${m}`;
    if (next !== value) {
      value = next;
      dispatch('change', next);
    }
  }

  function onHourChange(e: CustomEvent<string>) { h = e.detail; emit(); }
  function onMinuteChange(e: CustomEvent<string>) { m = e.detail; emit(); }
</script>

<div class="time-picker">
  {#if label}
    <div class="tp-label">{label}</div>
  {/if}
  <div class="tp-drums">
    <DrumPicker items={HOURS} bind:value={h} on:change={onHourChange} />
    <div class="tp-sep">.</div>
    <DrumPicker items={MINUTES} bind:value={m} on:change={onMinuteChange} />
  </div>
</div>

<style>
  .time-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }

  .tp-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .tp-drums {
    display: flex;
    align-items: center;
    background: var(--surface-alt);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    padding: 0 0.5rem;
  }

  .tp-sep {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-tertiary);
    padding: 0 0.25rem;
    user-select: none;
  }
</style>
