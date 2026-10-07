<script lang="ts">
  // Hakkında sayfasındaki etkileşimli bileşen: dokununca dönen krep
  import { krepMetni, type Dil } from "$lib/i18n";

  let { dil = "tr" }: { dil?: Dil } = $props();
  let sayi = $state(0);
  const metin = $derived(krepMetni[dil]);
</script>

<div class="krep-kutu">
  <button class="krep" class:cevrildi={sayi % 2 === 1} onclick={() => sayi++} aria-label={metin.ipucu}>
    <span class="yuz">🥞</span>
  </button>
  <p>{sayi === 0 ? metin.ipucu : metin.sayac(sayi)}</p>
</div>

<style>
  .krep-kutu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 16px 0;
  }

  .krep {
    width: 96px;
    height: 96px;
    border: 1px solid var(--kenar);
    border-radius: 50%;
    background: var(--zemin);
    font-size: 48px;
    transition: transform 0.5s;
  }

  .krep.cevrildi {
    transform: rotateX(180deg);
  }

  .yuz {
    display: inline-block;
  }

  .cevrildi .yuz {
    transform: rotateX(180deg);
  }

  p {
    margin: 0;
    color: var(--yazi-soluk);
    font-size: 14px;
  }
</style>
