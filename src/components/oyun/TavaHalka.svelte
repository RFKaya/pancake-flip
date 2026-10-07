<script lang="ts">
  // Tava: pişme halkası + krep. Dokun = hamur dök, yukarı kaydır = çevir.
  import { jest } from "$lib/oyun/jest";
  import { bolgeBul, type Tava } from "$lib/oyun/pisirme";
  import { AYAR } from "$lib/oyun/servis.svelte";

  let {
    tava,
    parlak = false,
    dokunarakCevir = false,
    dokun,
    cevir,
  }: { tava: Tava; parlak?: boolean; dokunarakCevir?: boolean; dokun: () => void; cevir: () => void } = $props();

  const toplam = AYAR.bolgeler.fazla;
  const yuzde = (v: number) => `${(v / toplam) * 100}%`;
  const b = AYAR.bolgeler;
  const halka = `conic-gradient(
    var(--halka-gri) 0 ${yuzde(b.cig)},
    var(--krep-az) ${yuzde(b.cig)} ${yuzde(b.az)},
    var(--basari) ${yuzde(b.az)} ${yuzde(b.orta)},
    var(--renk-ana) ${yuzde(b.orta)} ${yuzde(b.iyi)},
    var(--vurgu) ${yuzde(b.iyi)} 100%)`;

  const bolge = $derived(tava.durum === "yanik" ? "yanik" : bolgeBul(tava.p, AYAR));
  const ibre = $derived(Math.min(tava.p, toplam) / toplam * 360);
  const secenek = $derived({ dokun, yukari: cevir, px: AYAR.cevirmePx, ms: AYAR.cevirmeMs });
</script>

<div class="tava" class:parlak use:jest={secenek} role="button" tabindex="0" aria-label="Tava">
  <div class="halka" class:titrer={bolge === "fazla"} style:background={halka}>
    {#if tava.durum !== "bos"}
      <div class="ibre" style:transform={`rotate(${ibre}deg)`}></div>
    {/if}
    <div class="yuz">
      {#if tava.durum === "bos"}
        <span class="ipucu">dokun</span>
      {:else}
        <div class="krep {bolge}"></div>
        {#if bolge === "fazla" || bolge === "yanik"}<span class="duman">💨</span>{/if}
        {#if bolge === "cig"}<span class="damla">💧</span>{/if}
        <span class="kaydir">{dokunarakCevir ? "dokun" : "↑"}</span>
      {/if}
      <div class="yuz-ifade"><i></i><i></i><b></b></div>
    </div>
  </div>
</div>

<style>
  .tava {
    width: 112px;
    height: 112px;
    touch-action: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    border-radius: 50%;
  }

  .tava.parlak {
    animation: parla 1s ease-in-out infinite;
  }

  .halka {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    padding: 9px;
  }

  .halka.titrer {
    animation: titre 0.35s linear infinite;
  }

  .ibre {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .ibre::after {
    content: "";
    position: absolute;
    top: -3px;
    left: calc(50% - 4px);
    width: 8px;
    height: 16px;
    border-radius: 4px;
    background: var(--yazi);
    border: 2px solid var(--kart);
  }

  .yuz {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 35%, var(--sahne-tava) 0%, var(--sahne-tava-koyu) 100%);
    box-shadow: inset 0 0 0 4px color-mix(in srgb, var(--sahne-tava) 70%, white);
  }

  .yuz-ifade {
    position: absolute;
    bottom: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    pointer-events: none;
  }

  .yuz-ifade i {
    width: 6px;
    height: 8px;
    border-radius: 50%;
    background: var(--sahne-yuz);
  }

  .yuz-ifade b {
    position: absolute;
    bottom: -4px;
    width: 10px;
    height: 5px;
    border-bottom: 2px solid var(--sahne-yuz);
    border-radius: 0 0 10px 10px;
  }

  .ipucu {
    color: var(--sahne-yuz);
    font-size: 13px;
    opacity: 0.9;
  }

  .krep {
    width: 70%;
    height: 70%;
    border-radius: 50%;
    box-shadow: inset 0 -5px 0 #0003;
  }

  .krep { background-image: linear-gradient(180deg, #ffffff40 0 38%, transparent 38%); }
  .krep.cig { background: var(--krep-cig); }
  .krep.az { background: var(--krep-az); }
  .krep.orta { background: var(--krep-orta); }
  .krep.iyi { background: var(--krep-iyi); }
  .krep.fazla { background: var(--krep-fazla); }
  .krep.yanik { background: var(--krep-yanik); }

  .duman {
    position: absolute;
    top: -14px;
    right: 6px;
    font-size: 24px;
    animation: yuksel 1s ease-out infinite;
  }

  .damla {
    position: absolute;
    bottom: 4px;
    font-size: 16px;
  }

  .kaydir {
    position: absolute;
    top: 3px;
    color: var(--sahne-yuz);
    font-size: 14px;
    font-weight: 700;
    opacity: 0.9;
  }

  @keyframes parla {
    50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--renk-ana) 45%, transparent); }
  }

  @keyframes titre {
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }

  @keyframes yuksel {
    from { transform: translateY(6px); opacity: 1; }
    to { transform: translateY(-12px); opacity: 0; }
  }
</style>
