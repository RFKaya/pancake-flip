<script lang="ts">
  // Ana ekran: sonsuz seviye durumu ve "Oyna" düğmesi. Bölüm listesi yoktur; ana ilerleme LEVEL'dir.
  import { onMount } from "svelte";
  import { ilerleme } from "$lib/ilerleme.svelte";
  import { gerekenMusteri, sayiKisalt, seviyeAyari, sonrakiAcilis } from "$lib/oyun/seviye";
  import { malzeme } from "$lib/oyun/veri";

  onMount(() => ilerleme.yukle());

  const v = $derived(ilerleme.veri);
  const gerek = $derived(gerekenMusteri(v.seviye));
  const oran = $derived(Math.min(1, v.ilerleme / gerek));
  const acik = $derived(seviyeAyari(v.seviye).menu.map(malzeme));
  const sonraki = $derived(sonrakiAcilis(v.seviye));
  const yeni = $derived(v.seviye <= 1 && v.ilerleme === 0 && v.toplamMusteri === 0);
</script>

<div class="sayfa">
  <h1>🥞 Pancake Flip!</h1>

  <section class="kart seviye-kart" aria-label="Seviye">
    <span class="etiket">LEVEL</span>
    <span class="no">{sayiKisalt(v.seviye)}</span>
    <div class="cubuk"><div class="dolu" style:transform={`scaleX(${oran})`}></div></div>
    <span class="yazi">{Math.floor(v.ilerleme)} / {sayiKisalt(gerek)} müşteri</span>
    {#if sonraki.length}
      <span class="sonraki">Sıradaki yenilik (Level {sonraki[0].seviye}): {sonraki.map((a) => `${a.ikon} ${a.ad}`).join(", ")}</span>
    {/if}
  </section>

  <a class="btn oyna" href="/oyna">{yeni ? "▶ Oyna" : "▶ Devam et"}</a>

  <div class="istatistik">
    <div class="kart"><b>{sayiKisalt(v.toplamMusteri)}</b><small>👤 müşteri</small></div>
    <div class="kart"><b>{sayiKisalt(v.toplamCoin)}</b><small>🪙 coin</small></div>
    <div class="kart"><b>{sayiKisalt(v.enYuksekSeviye)}</b><small>🏆 en yüksek</small></div>
  </div>

  {#if acik.length}
    <p class="acik">Açık malzemeler: {acik.map((m) => m.ikon).join(" ")}</p>
  {/if}

  <p class="giris">
    Tavaya <b>dokun</b> (hamur dökülür), krep pişince <b>aşağı kaydır</b> (tabağa düşer), siparişe göre malzemeleri koy ve
    <b>Ver</b>'e bas. Doğru servis ettikçe seviye atlarsın — oyunun sonu yok.
  </p>
</div>

<style>
  h1 { margin: 0; font-size: 24px; }
  .seviye-kart { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px 16px; text-align: center; }
  .etiket { color: var(--yazi-soluk); font-size: 13px; font-weight: 800; letter-spacing: 3px; }
  .no { max-width: 100%; overflow: hidden; color: var(--renk-ana); font-size: 64px; font-weight: 900; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
  .cubuk { width: 100%; height: 14px; overflow: hidden; border-radius: 8px; background: var(--zemin); border: 2px solid var(--kenar); }
  .dolu { width: 100%; height: 100%; background: var(--basari); transform-origin: left center; }
  .yazi { font-size: 14px; font-weight: 800; }
  .sonraki { color: var(--yazi-soluk); font-size: 12px; }
  .oyna { padding: 16px; font-size: 20px; }
  .istatistik { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .istatistik .kart { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; }
  .istatistik b { max-width: 100%; overflow: hidden; font-size: 20px; text-overflow: ellipsis; }
  .istatistik small { color: var(--yazi-soluk); font-size: 11px; }
  .acik { margin: 0; font-size: 14px; text-align: center; }
  .giris { margin: 0; color: var(--yazi-soluk); font-size: 14px; line-height: 1.5; }
  @media (min-width: 1200px) {
    .sayfa { max-width: 520px; margin: 0 auto; }
  }
</style>
