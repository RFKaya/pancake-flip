<script lang="ts">
  // Denge Ayarları: oyun ayarlarının (ayarlar.json biçimi) bütün sayı alanları, ilk anahtara göre gruplu.
  // Uygulamada "Create:ContentVersion" izni varsa alanlar düzenlenir ve değişiklik yeni bir TASLAK içerik sürümü olarak kaydedilir;
  // yayın Sürümler ekranından yapılır. Tarayıcıda oyunun JSON'u salt okunur gösterilir.
  import { onMount } from "svelte";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { destekleniyorMu, kayitEkle, kayitListesi } from "$lib/native";
  import type { AyarEkraniGirdileri, Ayarlar, FormHatalari, IcerikSurumu } from "$lib/types";
  import { alanGruplari, dengeDogrula, hataMetni, izinVar, sayiAlanlari, sonrakiSurum, yolaYaz } from "$lib/yonetim";
  import EkranBasligi from "./EkranBasligi.svelte";

  let { oturum }: AyarEkraniGirdileri = $props();

  const m = yonetimSozlugu();
  const arkaUcVar = destekleniyorMu("yonetim");

  let durum = $state<"yukleniyor" | "hata" | "hazir">("yukleniyor");
  let hata = $state("");
  let asil = $state<Ayarlar | null>(null);
  let taslak = $state<Ayarlar | null>(null);
  let yayindakiSurum = $state(1);
  let surumler = $state<IcerikSurumu[]>([]);
  let arama = $state("");
  let not = $state("");
  let hatalar = $state<FormHatalari>({});
  let genelHata = $state("");
  let basari = $state("");
  let kaydediliyor = $state(false);

  const duzenleyebilir = $derived(arkaUcVar && izinVar(oturum, "Create:ContentVersion"));
  const asilDegerler = $derived(new Map(sayiAlanlari(asil).map((a) => [a.yol, a.deger])));
  const alanlar = $derived(sayiAlanlari(taslak).filter((a) => a.yol.toLocaleLowerCase("tr-TR").includes(arama.trim().toLocaleLowerCase("tr-TR"))));
  const gruplar = $derived(alanGruplari(alanlar));
  const degisen = $derived(sayiAlanlari(taslak).filter((a) => asilDegerler.get(a.yol) !== a.deger).length);

  async function yukle() {
    durum = "yukleniyor";
    const s = await kayitListesi("GameConfig");
    if (!s.ok) {
      hata = hataMetni(s.hata, m);
      durum = "hata";
      return;
    }
    const kayit = s.veri.items.find((x) => x.key === "ayarlar");
    asil = (kayit?.data as Ayarlar | undefined) ?? null;
    taslak = asil ? structuredClone($state.snapshot(asil)) : null;
    yayindakiSurum = kayit?.version ?? 1;
    if (arkaUcVar) {
      const v = await kayitListesi("ContentVersion", { pageSize: 100, filters: { kapsam: "ayarlar" } });
      surumler = v.ok ? v.veri.items : [];
    }
    durum = "hazir";
  }

  function degistir(yol: string, deger: number) {
    if (!taslak) return;
    taslak = yolaYaz($state.snapshot(taslak) as Ayarlar, yol, deger);
    basari = "";
  }

  function sifirla() {
    taslak = asil ? structuredClone($state.snapshot(asil)) : null;
    hatalar = {};
    genelHata = "";
  }

  async function kaydet(e: SubmitEvent) {
    e.preventDefault();
    if (!taslak) return;
    genelHata = "";
    basari = "";
    hatalar = dengeDogrula(taslak, m);
    if (Object.keys(hatalar).length > 0) {
      genelHata = m.form.duzelt;
      return;
    }
    kaydediliyor = true;
    const surum = sonrakiSurum(surumler, "ayarlar", yayindakiSurum);
    const s = await kayitEkle("ContentVersion", {
      id: `ayarlar-${surum}`,
      kapsam: "ayarlar",
      surum,
      durum: "taslak",
      yayinlayan: null,
      yayinTarihi: null,
      not: not.trim() || null,
      veri: $state.snapshot(taslak),
    });
    kaydediliyor = false;
    if (!s.ok) {
      genelHata = hataMetni(s.hata, m);
      return;
    }
    surumler = [...surumler, s.veri];
    not = "";
    sifirla();
    basari = `${m.surumler.surum} ${surum}: ${m.denge.kaydedildi}`;
  }

  onMount(yukle);
</script>

<div class="ekran">
  <EkranBasligi baslik={m.denge.baslik} aciklama={m.denge.aciklama} not={arkaUcVar ? m.ortak.veritabaniNotu : m.ortak.saltOkunurNotu} />

  {#if durum === "yukleniyor"}
    <Yukleniyor metin={m.denge.yukleniyor} />
  {:else if durum === "hata"}
    <HataDurumu baslik={m.hata.baslik} mesaj={hata} tekrarMetni={m.hata.tekrar} onTekrar={yukle} />
  {:else if taslak}
    <form class="duzen" onsubmit={kaydet} novalidate>
      <div class="ust">
        <input type="search" placeholder={m.denge.ara} aria-label={m.denge.ara} bind:value={arama} />
        <span class="hap">{m.denge.yayindaki}: {yayindakiSurum}</span>
        {#if duzenleyebilir && degisen > 0}<span class="hap degisti">{degisen} {m.denge.degisen}</span>{/if}
      </div>

      {#if gruplar.length === 0}
        <BosDurum ikon="🔍" baslik={m.denge.aramaBos} dugmeMetni={m.ortak.aramayiTemizle} onDugme={() => (arama = "")} />
      {/if}

      {#each gruplar as [grup, liste] (grup)}
        <fieldset class="kart grup">
          <legend>{grup || m.denge.genel}</legend>
          <div class="alanlar">
            {#each liste as a (a.yol)}
              {@const degisti = asilDegerler.get(a.yol) !== a.deger}
              <label class:degisti>
                <span class="yol">{grup ? a.yol.slice(grup.length + 1) : a.yol}</span>
                <input
                  type="number"
                  step="any"
                  value={a.deger}
                  readonly={!duzenleyebilir}
                  aria-invalid={!!hatalar[a.yol]}
                  oninput={(e) => degistir(a.yol, e.currentTarget.valueAsNumber)}
                />
                {#if hatalar[a.yol]}<span class="alan-hatasi">{hatalar[a.yol]}</span>{/if}
              </label>
            {/each}
          </div>
        </fieldset>
      {/each}

      {#if duzenleyebilir}
        <div class="kart alt">
          <label class="not-alani">
            {m.denge.not}
            <input type="text" maxlength="200" bind:value={not} />
          </label>
          {#if genelHata}<p class="form-hatasi" role="alert">{genelHata}</p>{/if}
          {#if basari}<p class="basari" role="status">{basari}</p>{/if}
          <div class="dugmeler">
            <button type="button" class="ikincil" disabled={degisen === 0} onclick={sifirla}>{m.denge.sifirla}</button>
            <button type="submit" class="btn" disabled={degisen === 0 || kaydediliyor}>
              {kaydediliyor ? m.ortak.kaydediliyor : m.denge.taslakKaydet}
            </button>
          </div>
        </div>
      {/if}
    </form>
  {/if}
</div>

<style>
  .ekran {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-4);
    max-width: 1100px;
  }

  .duzen {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
  }

  .ust {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--bosluk-2);
  }

  input {
    padding: 8px 10px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: var(--zemin);
    font-variant-numeric: tabular-nums;
  }

  input[type="search"] {
    width: min(260px, 100%);
    background: var(--kart);
  }

  input[readonly] {
    border-color: transparent;
    background: transparent;
    padding-inline: 0;
  }

  .hap.degisti {
    border-color: var(--renk-ana);
    color: var(--renk-ana);
  }

  .grup {
    margin: 0;
    padding: 12px 16px 16px;
  }

  legend {
    padding: 0 6px;
    font-weight: 800;
  }

  .alanlar {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: var(--bosluk-3);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-1);
    font-size: 12px;
    font-weight: 600;
  }

  label.degisti input {
    border-color: var(--renk-ana);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--renk-ana) 25%, transparent);
  }

  .yol {
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  [aria-invalid="true"] {
    border-color: var(--vurgu);
  }

  .alan-hatasi,
  .form-hatasi {
    color: var(--vurgu);
    font-size: 12px;
  }

  .alt {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
    padding: 16px;
  }

  .not-alani input {
    font-weight: 400;
  }

  p {
    margin: 0;
  }

  .form-hatasi {
    font-size: 14px;
  }

  .basari {
    color: var(--basari);
    font-size: 14px;
    font-weight: 600;
  }

  .dugmeler {
    display: flex;
    justify-content: flex-end;
    gap: var(--bosluk-2);
  }

  .dugmeler .btn {
    width: auto;
    padding: 10px 18px;
  }

  .ikincil {
    padding: 10px 16px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: transparent;
    font-weight: 700;
  }

  .ikincil:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
