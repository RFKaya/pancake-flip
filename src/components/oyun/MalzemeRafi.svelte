<script lang="ts">
  // Malzeme rafı (en fazla 8 düğme, 4 sütun). Sıradaki doğru malzeme ipucu olarak parlar.
  import { malzeme, type ServisDurumu } from "$lib/oyun/servis.svelte";

  let { servis }: { servis: ServisDurumu } = $props();
  const menu = $derived(servis.bolum.menu.map(malzeme));
</script>

<div class="raf">
  {#each menu as m (m.id)}
    <button
      class="dugme"
      class:parlak={servis.ipucu && servis.siradaki === m.id}
      style:border-color={`var(${m.renkDegiskeni})`}
      onpointerdown={() => servis.malzemeKoy(m.id)}
    >
      <span class="ikon">{m.ikon}</span>
      <span class="ad">{m.ad}</span>
      <span class="maliyet">−{m.maliyet}</span>
    </button>
  {:else}
    <p class="bos">Bu serviste yalnızca krep var.</p>
  {/each}
</div>

<style>
  .raf {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    min-height: 60px;
  }

  .dugme {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 64px;
    padding: 4px 2px;
    border: 2px solid var(--kenar);
    border-radius: 12px;
    background: var(--kart);
    box-shadow: 0 3px 0 var(--kenar);
    touch-action: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .dugme:active {
    transform: translateY(3px);
    box-shadow: none;
  }

  .dugme.parlak {
    animation: parla 1s ease-in-out infinite;
  }

  .ikon {
    font-size: 26px;
    line-height: 1;
  }

  .ad {
    font-size: 11px;
    color: var(--yazi);
  }

  .maliyet {
    position: absolute;
    top: 2px;
    right: 5px;
    font-size: 10px;
    color: var(--yazi-soluk);
  }

  .bos {
    grid-column: 1 / -1;
    margin: 0;
    text-align: center;
    color: var(--yazi-soluk);
    font-size: 14px;
  }

  @keyframes parla {
    50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--renk-ana) 45%, transparent); }
  }
</style>
