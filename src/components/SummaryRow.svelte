<script lang="ts">
  import { formatDecimal } from '../lib/dateUtils';
  import type { MonthTotals } from '../lib/types';

  export let totals: MonthTotals;
</script>

<tfoot>
  <tr class="totals-row">
    <td colspan="4" class="totals-label">Stunden</td>
    <td></td>
    <td class="p-arbeitszeit">{formatDecimal(totals.arbeitszeitSum).replace(',', '.') || '0'}</td>
    <td class="p-x">{totals.soFeiertageCount || ''}</td>
    <td class="p-x">{totals.uebernachtungCount || ''}</td>
    <td class="p-num">{totals.pauseSum || ''}</td>
    <td class="p-num">{totals.spesenSum || ''}</td>
  </tr>
  <tr class="gesamt-row">
    <td colspan="10" class="gesamt-label">
      Gesamt Stunden: <strong>{formatDecimal(totals.gesamtStunden).replace(',', '.')}</strong>
    </td>
  </tr>
</tfoot>

<style>
  .totals-row td, .gesamt-row td {
    border: 1px solid #000;
    padding: 0.5pt 3pt;
    font-size: 9pt;
  }

  .totals-row td {
    font-weight: bold;
    border-top: 2px solid #000;
  }

  .totals-label { text-align: right; }

  .gesamt-row td {
    text-align: right;
    border-top: 2px solid #000;
  }

  .p-arbeitszeit { width: 18pt; text-align: center; }
  .p-num { width: 13pt; text-align: center; }
  .p-x   { width: 7pt; text-align: center; }
</style>
