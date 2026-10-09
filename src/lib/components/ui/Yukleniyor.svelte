<script lang="ts">
  // Yükleniyor hâli: kart biçiminde iskelet satırlar; ekran okuyucuya yalnızca metin söylenir.
  import type { YukleniyorGirdileri } from "$lib/types";

  let { metin, satir = 4 }: YukleniyorGirdileri = $props();
</script>

<div class="yukleniyor" role="status" aria-live="polite" aria-busy="true">
  <span class="gizli">{metin}</span>
  {#each Array(satir) as _, i (i)}
    <div class="iskelet" aria-hidden="true">
      <span class="kutu"></span>
      <span class="cizgiler"><span class="cizgi uzun"></span><span class="cizgi kisa"></span></span>
    </div>
  {/each}
</div>

<style>
  .yukleniyor {
    display: grid;
    gap: var(--bosluk-3);
  }

  .gizli {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .iskelet {
    display: flex;
    align-items: center;
    gap: var(--bosluk-3);
    min-height: 64px;
    padding: var(--bosluk-3) var(--bosluk-4);
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
    box-sizing: border-box;
  }

  .kutu,
  .cizgi {
    display: block;
    border-radius: var(--radius-kucuk);
    background: linear-gradient(90deg, var(--kenar) 0%, color-mix(in srgb, var(--kenar) 40%, var(--kart)) 50%, var(--kenar) 100%) 0 0 / 200% 100%;
    animation: parilti 1.2s ease-in-out infinite;
  }

  .kutu {
    flex: none;
    width: 48px;
    height: 48px;
  }

  .cizgiler {
    display: grid;
    flex: 1;
    gap: var(--bosluk-2);
  }

  .cizgi { height: 12px; }
  .cizgi.uzun { width: 70%; }
  .cizgi.kisa { width: 40%; }

  @keyframes parilti {
    from { background-position: 100% 0; }
    to { background-position: -100% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .kutu, .cizgi { animation: none; }
  }
</style>
