<script lang="ts">
  // Malzemeler: arama ve kategori süzgeciyle tablo; uygulamada izne göre ekleme, düzenleme ve silme.
  // Veri uygulamada yerel arka uçtan (crud_index), tarayıcıda oyunun JSON verisinden gelir (salt okunur).
  import { onMount } from "svelte";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { destekleniyorMu, kayitListesi } from "$lib/native";
  import type { KatalogGirdileri, Kategori, Malzeme } from "$lib/types";
  import { hataMetni, izinVar, KATEGORILER, malzemeNeti, malzemeSuz } from "$lib/yonetim";
  import MalzemeFormu from "./MalzemeFormu.svelte";
  import SilmeOnayi from "./SilmeOnayi.svelte";

  let { oturum }: KatalogGirdileri = $props();

  const m = yonetimSozlugu();
  const arkaUcVar = destekleniyorMu("yonetim");

  let liste = $state<Malzeme[]>([]);
  let durum = $state<"yukleniyor" | "hata" | "hazir">("yukleniyor");
  let hata = $state("");
  let arama = $state("");
  let kategori = $state<Kategori | "hepsi">("hepsi");

  /** Açık form: düzenlenen malzeme, "yeni" ya da kapalı (null) */
  let form = $state<Malzeme | "yeni" | null>(null);
  let silinecek = $state<Malzeme | null>(null);

  const gorunen = $derived(malzemeSuz(liste, arama, kategori));
  const ekleyebilir = $derived(arkaUcVar && izinVar(oturum, "Create:Malzeme"));
  const duzenleyebilir = $derived(arkaUcVar && izinVar(oturum, "Update:Malzeme"));
  const silebilir = $derived(arkaUcVar && izinVar(oturum, "Delete:Malzeme"));

  async function yukle() {
    durum = "yukleniyor";
    const s = await kayitListesi("Malzeme", { pageSize: 100 });
    if (s.ok) {
      liste = s.veri.items;
      durum = "hazir";
    } else {
      hata = hataMetni(s.hata, m);
      durum = "hata";
    }
  }

  function kaydedildi(k: Malzeme) {
    liste = liste.some((x) => x.id === k.id) ? liste.map((x) => (x.id === k.id ? k : x)) : [...liste, k];
    form = null;
  }

  function silindi() {
    liste = liste.filter((x) => x.id !== silinecek?.id);
    silinecek = null;
  }

  function aramayiTemizle() {
    arama = "";
    kategori = "hepsi";
  }

  onMount(yukle);
</script>

<div class="ekran">
  <header class="baslik">
    <div>
      <h2>{m.malzemeler.baslik}</h2>
      <p class="soluk">{m.malzemeler.aciklama}</p>
      <p class="not">{arkaUcVar ? m.ortak.veritabaniNotu : m.ortak.saltOkunurNotu}</p>
    </div>
    {#if ekleyebilir}
      <button type="button" class="btn yeni" onclick={() => (form = "yeni")}>＋ {m.malzemeler.yeni}</button>
    {/if}
  </header>

  <div class="suzgec">
    <label class="arama">
      <span class="gizli">{m.ortak.ara}</span>
      <input type="search" placeholder={m.ortak.aramaYeri} bind:value={arama} />
    </label>
    <div class="cipler" role="group" aria-label={m.malzemeler.kategori}>
      {#each ["hepsi", ...KATEGORILER] as k (k)}
        <button type="button" class:secili={kategori === k} aria-pressed={kategori === k} onclick={() => (kategori = k as Kategori | "hepsi")}>
          {k === "hepsi" ? m.ortak.hepsi : m.kategori[k as Kategori]}
        </button>
      {/each}
    </div>
  </div>

  {#if durum === "yukleniyor"}
    <Yukleniyor metin={m.malzemeler.yukleniyor} />
  {:else if durum === "hata"}
    <HataDurumu baslik={m.hata.baslik} mesaj={hata} tekrarMetni={m.hata.tekrar} onTekrar={yukle} />
  {:else if liste.length === 0}
    <BosDurum ikon="🥞" baslik={m.malzemeler.bos} />
  {:else if gorunen.length === 0}
    <BosDurum ikon="🔍" baslik={m.malzemeler.aramaBos} dugmeMetni={m.ortak.aramayiTemizle} onDugme={aramayiTemizle} />
  {:else}
    <div class="kart tablo-kabi">
      <table>
        <thead>
          <tr>
            <th scope="col">{m.malzemeler.malzeme}</th>
            <th scope="col">{m.malzemeler.kategori}</th>
            <th scope="col" class="sayi">{m.malzemeler.acilis}</th>
            <th scope="col" class="sayi">{m.malzemeler.maliyet}</th>
            <th scope="col" class="sayi">{m.malzemeler.deger}</th>
            <th scope="col" class="sayi">{m.malzemeler.net}</th>
            <th scope="col">{m.malzemeler.tatli}</th>
            {#if duzenleyebilir || silebilir}<th scope="col"><span class="gizli">{m.ortak.islemler}</span></th>{/if}
          </tr>
        </thead>
        <tbody>
          {#each gorunen as x (x.id)}
            {@const net = malzemeNeti(x)}
            <tr>
              <th scope="row">
                <span class="kap" style:--c={`var(${x.renkDegiskeni})`} aria-hidden="true">{x.ikon}</span>
                <span class="ad">{x.ad}<small>{x.id}</small></span>
              </th>
              <td>{m.kategori[x.kategori]}</td>
              <td class="sayi">{x.acilis}</td>
              <td class="sayi">{x.maliyet}</td>
              <td class="sayi">{x.deger}</td>
              <td class="sayi" class:zarar={net <= 0} title={net <= 0 ? m.malzemeler.zararUyarisi : undefined}>{net > 0 ? `+${net}` : net}</td>
              <td>{x.tatli ? m.ortak.evet : m.ortak.hayir}</td>
              {#if duzenleyebilir || silebilir}
                <td class="islemler">
                  {#if duzenleyebilir}<button type="button" onclick={() => (form = x)}>{m.ortak.duzenle}</button>{/if}
                  {#if silebilir}<button type="button" class="sil" onclick={() => (silinecek = x)}>{m.ortak.sil}</button>{/if}
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if form !== null}
  <MalzemeFormu
    kayit={form === "yeni" ? null : form}
    mevcutIdler={liste.map((x) => x.id)}
    onKaydedildi={kaydedildi}
    onIptal={() => (form = null)}
  />
{/if}

{#if silinecek}
  <SilmeOnayi kaynak="Malzeme" id={silinecek.id} ad={silinecek.ad} onSilindi={silindi} onIptal={() => (silinecek = null)} />
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
  p {
    margin: 0;
  }

  h2 {
    font-size: 22px;
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

  .suzgec {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--bosluk-3);
  }

  .arama input {
    width: min(280px, 100%);
    padding: 9px 12px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: var(--kart);
  }

  .cipler {
    display: flex;
    flex-wrap: wrap;
    gap: var(--bosluk-1);
  }

  .cipler button {
    padding: 6px 12px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    background: var(--kart);
    font-size: 13px;
    font-weight: 600;
    color: var(--yazi-soluk);
  }

  .cipler button.secili {
    border-color: var(--renk-ana);
    background: color-mix(in srgb, var(--renk-ana) 14%, transparent);
    color: var(--renk-ana);
  }

  .tablo-kabi {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th,
  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--kenar);
    text-align: start;
    white-space: nowrap;
  }

  thead th {
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 600;
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }

  tbody th {
    display: flex;
    align-items: center;
    gap: var(--bosluk-3);
    font-weight: 700;
  }

  .kap {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--c) 22%, var(--kart));
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c) 55%, transparent);
    font-size: 18px;
  }

  .ad small {
    display: block;
    color: var(--yazi-soluk);
    font-size: 11px;
    font-weight: 500;
  }

  .sayi {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  .zarar {
    color: var(--vurgu);
    font-weight: 700;
  }

  .islemler {
    text-align: end;
  }

  .islemler button {
    padding: 5px 10px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: transparent;
    font-size: 12px;
    font-weight: 700;
  }

  .islemler button + button {
    margin-inline-start: var(--bosluk-1);
  }

  .islemler .sil {
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
