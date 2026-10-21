<script lang="ts">
  // Panel Özeti: oyuncu istatistikleri (pancake_dashboard, yalnız uygulamada ve oturum varken) ve oyun içeriğinin sayıları (JSON).
  // Oyuncu verisinin dört hâli: yükleniyor / hata / boş (hiç oyuncu yok) / dolu.
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { panelOzeti } from "$lib/native";
  import { sayiKisalt } from "$lib/oyun/seviye";
  import type { PanelOzeti, PanelOzetiGirdileri } from "$lib/types";
  import { dagilimYuzdeleri, hataMetni, icerikOzeti, seviyeYaz, yuzdeYaz } from "$lib/yonetim";

  let { oyuncuVerisi }: PanelOzetiGirdileri = $props();

  const m = yonetimSozlugu();
  const icerik = icerikOzeti();

  let ozet = $state<PanelOzeti | null>(null);
  let hata = $state("");
  let yukleniyor = $state(false);

  async function yukle() {
    yukleniyor = true;
    hata = "";
    const s = await panelOzeti();
    yukleniyor = false;
    if (s.ok) ozet = s.veri;
    else hata = hataMetni(s.hata, m);
  }

  $effect(() => {
    if (oyuncuVerisi) yukle();
  });

  const yuzdeler = $derived(ozet ? dagilimYuzdeleri(ozet.dagilim) : []);
</script>

<div class="ozet">
  <header>
    <h2>{m.ozet.baslik}</h2>
    <p class="soluk">{m.ozet.aciklama}</p>
  </header>

  {#if oyuncuVerisi}
    {#if yukleniyor}
      <Yukleniyor metin={m.ozet.yukleniyor} satir={3} />
    {:else if hata}
      <HataDurumu baslik={m.hata.baslik} mesaj={hata} tekrarMetni={m.hata.tekrar} onTekrar={yukle} />
    {:else if ozet && ozet.oyuncu === 0}
      <BosDurum ikon="🧑‍🍳" baslik={m.ozet.bosBaslik} aciklama={m.ozet.bosAciklama} />
    {:else if ozet}
      <dl class="kpi">
        <div class="kart">
          <dt>{m.ozet.oyuncular}</dt>
          <dd>{ozet.oyuncu.toLocaleString("tr-TR")}</dd>
        </div>
        <div class="kart">
          <dt>{m.ozet.ortalamaSeviye}</dt>
          <dd>{seviyeYaz(ozet.ortalamaSeviye)} <small>/ {m.ozet.medyan} {seviyeYaz(ozet.medyanSeviye)}</small></dd>
        </div>
        <div class="kart">
          <dt>{m.ozet.enYuksekSeviye}</dt>
          <dd>{seviyeYaz(ozet.enYuksekSeviye)}</dd>
        </div>
        <div class="kart">
          <dt>{m.ozet.toplamServis}</dt>
          <dd title={ozet.toplamServis.toLocaleString("tr-TR")}>{sayiKisalt(ozet.toplamServis)}</dd>
        </div>
        <div class="kart">
          <dt>{m.ozet.perfectOrani}</dt>
          <dd class="basari">{yuzdeYaz(ozet.perfectOrani)}</dd>
        </div>
      </dl>

      <section class="kart blok" aria-labelledby="dagilim-baslik">
        <h3 id="dagilim-baslik">{m.ozet.dagilim}</h3>
        <p class="soluk">{m.ozet.dagilimAciklama}</p>
        <ul class="dagilim">
          {#each ozet.dagilim as d, i (d.aralik)}
            <li>
              <span class="aralik">{d.aralik}</span>
              <span class="cubuk" aria-hidden="true"><i style:width={`${yuzdeler[i]}%`}></i></span>
              <span class="sayi">{d.sayi} {m.ozet.oyuncuBirim}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}

  <section class="kart blok" aria-labelledby="icerik-baslik">
    <h3 id="icerik-baslik">{m.ozet.icerik}</h3>
    <p class="soluk">{m.ozet.icerikAciklama}</p>
    <dl class="icerik">
      <div><dt>{m.ozet.malzeme}</dt><dd>{icerik.malzeme}</dd></div>
      <div><dt>{m.ozet.musteriTipi}</dt><dd>{icerik.musteriTipi}</dd></div>
      <div><dt>{m.ozet.mekanik}</dt><dd>{icerik.mekanik}</dd></div>
      <div><dt>{m.ozet.kilometreTasi}</dt><dd>{icerik.kilometreTasi}</dd></div>
      <div><dt>{m.ozet.seviyeSiniri}</dt><dd title={icerik.seviyeSiniri.toLocaleString("tr-TR")}>{sayiKisalt(icerik.seviyeSiniri)}</dd></div>
    </dl>
  </section>
</div>

<style>
  .ozet {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-4);
    max-width: 1100px;
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  h2 {
    font-size: 22px;
  }

  h3 {
    font-size: 16px;
  }

  .soluk {
    color: var(--yazi-soluk);
    font-size: 13px;
  }

  dl,
  dd {
    margin: 0;
  }

  .kpi {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--bosluk-3);
  }

  .kpi .kart {
    padding: 14px 16px;
  }

  dt {
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 600;
  }

  .kpi dd {
    margin-top: var(--bosluk-1);
    font-size: 24px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .kpi small {
    font-size: 13px;
    font-weight: 500;
    color: var(--yazi-soluk);
  }

  .basari {
    color: var(--basari);
  }

  .blok {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-2);
    padding: 18px;
  }

  .dagilim {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-2);
    margin: var(--bosluk-2) 0 0;
    padding: 0;
    list-style: none;
  }

  .dagilim li {
    display: grid;
    grid-template-columns: 72px 1fr auto;
    align-items: center;
    gap: var(--bosluk-3);
    font-size: 13px;
  }

  .aralik,
  .sayi {
    font-variant-numeric: tabular-nums;
  }

  .sayi {
    color: var(--yazi-soluk);
  }

  .cubuk {
    height: 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--kenar) 50%, transparent);
    overflow: hidden;
  }

  .cubuk i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--renk-ana);
    transition: width 0.4s ease-out;
  }

  .icerik {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: var(--bosluk-3);
    margin-top: var(--bosluk-2);
  }

  .icerik dd {
    font-size: 20px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .cubuk i {
      transition: none;
    }
  }
</style>
