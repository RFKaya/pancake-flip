<script lang="ts">
  import type { SayfalamaGirdileri } from "$lib/types";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  let { sayfa, toplam, boyut, mesgul, onSayfa }: SayfalamaGirdileri = $props();
  const m = yonetimSozlugu().kayitlar;
  const son = $derived(Math.max(1, Math.ceil(toplam / boyut)));
</script>

<nav aria-label={m.sayfa}>
  <span aria-live="polite">{m.toplam}: {toplam} · {m.sayfa}: {sayfa} / {son}</span>
  <button type="button" disabled={mesgul || sayfa <= 1} onclick={() => onSayfa(sayfa - 1)}>{m.onceki}</button>
  <button type="button" disabled={mesgul || sayfa >= son} onclick={() => onSayfa(sayfa + 1)}>{m.sonraki}</button>
</nav>

<style>
  nav { display: flex; flex-wrap: wrap; align-items: center; gap: var(--bosluk-2); font-size: 13px; }
  span { margin-inline-end: auto; color: var(--yazi-soluk); }
  button { padding: var(--bosluk-2) var(--bosluk-3); border: 1px solid var(--kenar); border-radius: var(--radius-kucuk); background: var(--kart); color: var(--yazi); }
  button:disabled { opacity: 0.5; cursor: default; }
</style>
