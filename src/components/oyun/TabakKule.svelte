<script lang="ts">
  // Tabak: aşağıdan yukarı krep kulesi + çöp kutusu (0,5 sn basılı tut)
  import { AYAR, malzeme, type ServisDurumu } from "$lib/oyun/servis.svelte";

  let { servis }: { servis: ServisDurumu } = $props();
  const oran = $derived(Math.min(1, servis.copSn / AYAR.copBasma));
</script>

<div class="alan">
  <div class="tabak">
    <div class="kule">
      {#each servis.tabak.parcalar as p, i (i)}
        {#if p.malzeme === "krep"}
          <div class="parca krep {p.pisme}"></div>
        {:else}
          <div class="parca ek" title={malzeme(p.malzeme).ad}>{malzeme(p.malzeme).ikon}</div>
        {/if}
      {/each}
    </div>
    <div class="zemin"></div>
    {#if servis.tabak.mesgul > 0}<div class="mesgul">⏳</div>{/if}
  </div>

  <button
    class="cop"
    class:basili={servis.copTutuluyor}
    onpointerdown={() => servis.copBasla()}
    onpointerup={() => servis.copBirak()}
    onpointerleave={() => servis.copBirak()}
    onpointercancel={() => servis.copBirak()}
    aria-label="Çöp kutusu: basılı tut"
  >
    🗑
    <span class="cop-cubuk" style:width={`${oran * 100}%`}></span>
  </button>
</div>

<style>
  .alan {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }

  .tabak {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    width: 132px;
    height: 150px;
  }

  .kule {
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    width: 100%;
    gap: 1px;
  }

  .zemin {
    width: 132px;
    height: 12px;
    margin-top: 2px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 50% 35%, var(--sahne-tabak) 55%, color-mix(in srgb, var(--sahne-tabak) 70%, white) 56%);
    box-shadow: inset 0 -4px 0 #0002, 0 5px 0 var(--sahne-tabak-koyu);
  }

  .parca {
    animation: plop 0.25s ease-out;
    flex-shrink: 0;
  }

  .krep {
    width: 104px;
    height: 13px;
    border-radius: 7px;
    box-shadow: inset 0 -3px 0 #0003;
  }

  .krep { background-image: linear-gradient(180deg, #ffffff40 0 38%, transparent 38%); }
  .krep.cig { background: var(--krep-cig); }
  .krep.az { background: var(--krep-az); }
  .krep.orta { background: var(--krep-orta); }
  .krep.iyi { background: var(--krep-iyi); }
  .krep.fazla { background: var(--krep-fazla); }
  .krep.yanik { background: var(--krep-yanik); }

  .ek {
    font-size: 13px;
    line-height: 13px;
    height: 13px;
  }

  .mesgul {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 14px;
  }

  .cop {
    position: relative;
    width: 52px;
    height: 52px;
    overflow: hidden;
    border: 1px solid var(--kenar);
    border-radius: 12px;
    background: var(--kart);
    font-size: 24px;
    box-shadow: 0 3px 0 var(--kenar);
    touch-action: none;
    user-select: none;
  }

  .cop.basili {
    border-color: var(--vurgu);
  }

  .cop-cubuk {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 5px;
    background: var(--vurgu);
  }

  @keyframes plop {
    from { transform: translateY(-26px) scale(1.12); opacity: 0.2; }
    to { transform: none; opacity: 1; }
  }
</style>
