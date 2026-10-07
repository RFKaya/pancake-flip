<script lang="ts">
  // Servis sonu: yıldızlar, kazanç ve sonraki adım
  import { onMount } from "svelte";
  import { BOLUMLER, AYAR, type ServisDurumu } from "$lib/oyun/servis.svelte";
  import { kayit } from "$lib/kayit.svelte";

  let { servis, yeniden }: { servis: ServisDurumu; yeniden: () => void } = $props();

  const net = $derived(Math.round(servis.net));
  const sonraki = $derived(BOLUMLER.find((b) => b.id === servis.bolum.id + 1));
  const esikler = $derived(AYAR.yildiz.map((o) => Math.round(servis.ideal * o)));

  onMount(() => kayit.servisKaydet(servis.bolum.id, servis.yildiz, servis.net));
</script>

<div class="perde" role="dialog" aria-modal="true" aria-label="Servis sonucu">
  <div class="pencere">
    <h2>Bölüm {servis.bolum.id} bitti</h2>
    <div class="yildizlar" aria-label={`${servis.yildiz} yıldız`}>
      {#each [1, 2, 3] as n}
        <span class:dolu={servis.yildiz >= n} style:animation-delay={`${n * 0.18}s`}>{servis.yildiz >= n ? "⭐" : "☆"}</span>
      {/each}
    </div>
    <p class="net">Net kazanç: <b>{net >= 0 ? "+" : ""}{net} 🪙</b></p>
    <p class="alt">
      {servis.servisEdilen} servis · {servis.perfectSayisi} PERFECT<br />
      Hedefler: ⭐ {esikler[0]} · ⭐⭐ {esikler[1]} · ⭐⭐⭐ {esikler[2]}
    </p>
    {#if servis.yildiz === 0}
      <p class="uyari">Sonraki bölüm için en az 1 yıldız gerekir. Tekrar dene!</p>
    {/if}
    <div class="dugmeler">
      {#if servis.yildiz >= 1 && sonraki}
        <a class="btn" href={`/servis/${sonraki.id}`}>Sonraki bölüm ▶</a>
      {/if}
      <button class="btn ikincil" onclick={yeniden}>Tekrar oyna</button>
      <a class="btn ikincil" href="/">Bölümler</a>
    </div>
  </div>
</div>

<style>
  .perde {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: color-mix(in srgb, var(--renk-koyu) 70%, transparent);
  }

  .pencere {
    width: 100%;
    max-width: 340px;
    padding: 22px 18px;
    border: 1px solid var(--kenar);
    border-radius: 18px;
    background: var(--kart);
    text-align: center;
    animation: gir 0.3s ease-out;
  }

  h2 {
    margin: 0 0 8px;
  }

  .yildizlar {
    display: flex;
    justify-content: center;
    gap: 8px;
    font-size: 42px;
  }

  .yildizlar span {
    animation: zipla 0.5s ease-out backwards;
    color: var(--yazi-soluk);
  }

  .net {
    margin: 12px 0 4px;
    font-size: 20px;
  }

  .alt {
    margin: 0 0 8px;
    color: var(--yazi-soluk);
    font-size: 13px;
    line-height: 1.5;
  }

  .uyari {
    margin: 8px 0;
    color: var(--vurgu);
    font-size: 14px;
  }

  .dugmeler {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .ikincil {
    background: var(--zemin);
    color: var(--yazi);
    border: 1px solid var(--kenar);
  }

  @keyframes gir {
    from { transform: scale(0.9); opacity: 0; }
  }

  @keyframes zipla {
    from { transform: scale(0) rotate(-40deg); }
  }
</style>
