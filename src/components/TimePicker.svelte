<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import DrumPicker from './DrumPicker.svelte';

  /** Value in "HH.MM" format, e.g. "08.00" */
  export let value: string = '';
  export let label: string = '';

  const dispatch = createEventDispatcher<{ change: string }>();

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES = ['00', '15', '30', '45'];

  function parse(v: string): { h: string; m: string } {
    if (!v) return { h: '08', m: '00' };
    const [h, m] = v.split('.');
    const hh = (h ?? '08').padStart(2, '0');
    // Snap minutes to nearest 15
    const raw = parseInt(m ?? '0', 10) || 0;
    const snapped = MINUTES.reduce((best, cur) =>
      Math.abs(parseInt(cur) - raw) < Math.abs(parseInt(best) - raw) ? cur : best
    );
    return { h: hh.padStart(2, '0'), m: snapped };
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
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .tp-drums {
    display: flex;
    align-items: center;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 14px;
    overflow: hidden;
    padding: 0 0.5rem;
  }

  .tp-sep {
    font-size: 1.8rem;
    font-weight: 700;
    color: #64748b;
    padding: 0 0.25rem;
    user-select: none;
  }
</style>
