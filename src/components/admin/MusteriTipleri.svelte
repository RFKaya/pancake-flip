<script lang="ts">
  // Müşteri Tipleri: her tip bir kart (açılış, ağırlık, sabır, çarpanlar, zorluk); uygulamada izne göre ekleme, düzenleme ve silme.
  // Veri uygulamada yerel arka uçtan (crud_index), tarayıcıda oyunun JSON verisinden gelir (salt okunur).
  import { onMount } from "svelte";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { destekleniyorMu, kayitListesi } from "$lib/native";
  import type { KatalogGirdileri, MusteriTipi } from "$lib/types";
  import { hataMetni, izinVar, musteriTipiSuz } from "$lib/yonetim";
  import MusteriTipiFormu from "./MusteriTipiFormu.svelte";
  import SilmeOnayi from "./SilmeOnayi.svelte";

  let { oturum }: KatalogGirdileri = $props();

  const m = yonetimSozlugu();
  const arkaUcVar = destekleniyorMu("yonetim");

  let liste = $state<MusteriTipi[]>([]);
  let durum = $state<"yukleniyor" | "hata" | "hazir">("yukleniyor");
  let hata = $state("");
  let arama = $state("");

  /** Açık form: düzenlenen tip, "yeni" ya da kapalı (null) */
  let form = $state<MusteriTipi | "yeni" | null>(null);
  let silinecek = $state<MusteriTipi | null>(null);

  const gorunen = $derived(musteriTipiSuz(liste, arama));
  const ekleyebilir = $derived(arkaUcVar && izinVar(oturum, "Create:MusteriTipi"));
  const duzenleyebilir = $derived(arkaUcVar && izinVar(oturum, "Update:MusteriTipi"));
  const silebilir = $derived(arkaUcVar && izinVar(oturum, "Delete:MusteriTipi"));

  const carpan = (n: number) => `×${n.toLocaleString("tr-TR")}`;

  async function yukle() {
    durum = "yukleniyor";
    const s = await kayitListesi("MusteriTipi", { pageSize: 100 });
    if (s.ok) {
      liste = s.veri.items;
      durum = "hazir";
    } else {
      hata = hataMetni(s.hata, m);
      durum = "hata";
    }
  }

  function kaydedildi(k: MusteriTipi) {
    liste = liste.some((x) => x.id === k.id) ? liste.map((x) => (x.id === k.id ? k : x)) : [...liste, k];
    form = null;
  }

  function silindi() {
    liste = liste.filter((x) => x.id !== silinecek?.id);
    silinecek = null;
  }

  onMount(yukle);
</script>

<div class="ekran">
  <header class="baslik">
    <div>
      <h2>{m.musteriler.baslik}</h2>
      <p class="soluk">{m.musteriler.aciklama}</p>
      <p class="not">{arkaUcVar ? m.ortak.veritabaniNotu : m.ortak.saltOkunurNotu}</p>
    </div>
    {#if ekleyebilir}
      <button type="button" class="btn yeni" onclick={() => (form = "yeni")}>＋ {m.musteriler.yeni}</button>
    {/if}
  </header>

  <label class="arama">
    <span class="gizli">{m.ortak.ara}</span>
    <input type="search" placeholder={m.ortak.aramaYeri} bind:value={arama} />
  </label>

  {#if durum === "yukleniyor"}
    <Yukleniyor metin={m.musteriler.yukleniyor} />
  {:else if durum === "hata"}
    <HataDurumu baslik={m.hata.baslik} mesaj={hata} tekrarMetni={m.hata.tekrar} onTekrar={yukle} />
  {:else if liste.length === 0}
    <BosDurum ikon="🧑" baslik={m.musteriler.bos} />
  {:else if gorunen.length === 0}
    <BosDurum ikon="🔍" baslik={m.musteriler.aramaBos} dugmeMetni={m.ortak.aramayiTemizle} onDugme={() => (arama = "")} />
  {:else}
    <ul class="kartlar">
      {#each gorunen as x (x.id)}
        <li class="kart tip">
          <header>
            <span class="ikon" aria-hidden="true">{x.ikon}</span>
            <div>
              <h3>{x.ad}</h3>
              <small>{x.id} · {m.musteriler.acilis}: {x.acilis}</small>
            </div>
            {#if x.tatliMi}<span class="hap">🍫 {m.musteriler.tatliMi}</span>{/if}
          </header>
          <dl>
            <div><dt>{m.musteriler.agirlik}</dt><dd>{x.agirlik.toLocaleString("tr-TR")}</dd></div>
            <div><dt>{m.musteriler.sabir}</dt><dd>{carpan(x.sabir)}</dd></div>
            <div><dt>{m.musteriler.odeme}</dt><dd>{carpan(x.odeme)}</dd></div>
            <div><dt>{m.musteriler.bahsis}</dt><dd>{carpan(x.bahsis)}</dd></div>
            <div><dt>{m.musteriler.ceza}</dt><dd>{carpan(x.ceza)}</dd></div>
            <div><dt>{m.musteriler.dKaydirma}</dt><dd>{x.dKaydirma}</dd></div>
            <div><dt>{m.musteriler.dMax}</dt><dd>{x.dMax ?? m.ortak.yok}</dd></div>
          </dl>
          {#if duzenleyebilir || silebilir}
            <footer>
              {#if duzenleyebilir}<button type="button" onclick={() => (form = x)}>{m.ortak.duzenle}</button>{/if}
              {#if silebilir}<button type="button" class="sil" onclick={() => (silinecek = x)}>{m.ortak.sil}</button>{/if}
            </footer>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#if form !== null}
  <MusteriTipiFormu
    kayit={form === "yeni" ? null : form}
    mevcutIdler={liste.map((x) => x.id)}
    onKaydedildi={kaydedildi}
    onIptal={() => (form = null)}
  />
{/if}

{#if silinecek}
  <SilmeOnayi kaynak="MusteriTipi" id={silinecek.id} ad={silinecek.ad} onSilindi={silindi} onIptal={() => (silinecek = null)} />
{/if}

<style>
  .ekran {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-4);
    max-width: 1100px;
  }

  .baslik {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--bosluk-3);
  }

  h2,
  h3,
  p,
  dl,
  dd {
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

  .not {
    margin-top: var(--bosluk-2);
    padding: 8px 10px;
    border-inline-start: 3px solid var(--renk-logo);
    border-radius: var(--radius-kucuk);
    background: color-mix(in srgb, var(--renk-logo) 10%, transparent);
    font-size: 12px;
    color: var(--yazi-soluk);
  }

  .yeni {
    width: auto;
    padding: 10px 16px;
  }

  .arama input {
    width: min(280px, 100%);
    padding: 9px 12px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: var(--kart);
  }

  .kartlar {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--bosluk-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tip {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
    padding: 16px;
  }

  .tip header {
    display: flex;
    align-items: center;
    gap: var(--bosluk-3);
  }

  .tip header .hap {
    margin-inline-start: auto;
    font-size: 11px;
  }

  .ikon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--renk-ana) 14%, var(--kart));
    font-size: 24px;
  }

  small {
    color: var(--yazi-soluk);
    font-size: 12px;
  }

  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--bosluk-2) var(--bosluk-3);
  }

  dt {
    color: var(--yazi-soluk);
    font-size: 11px;
    font-weight: 600;
  }

  dd {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--bosluk-1);
    padding-top: var(--bosluk-2);
    border-top: 1px solid var(--kenar);
  }

  footer button {
    padding: 5px 10px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: transparent;
    font-size: 12px;
    font-weight: 700;
  }

  footer .sil {
    color: var(--vurgu);
  }

  .gizli {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
