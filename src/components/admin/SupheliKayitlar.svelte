<script lang="ts">
  import { onMount } from "svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { yonetimKayitlariniYukle } from "$lib/yukleyici";
  import type { KatalogGirdileri, Sayfa, SupheliKayit } from "$lib/types";
  import { hataMetni, izinVar, kayitSorgusu, tarihYaz } from "$lib/yonetim";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import EkranBasligi from "./EkranBasligi.svelte";
  import Sayfalama from "./Sayfalama.svelte";
  import Pencere from "./Pencere.svelte";
  import { kayitGuncelle } from "$lib/native";
  let { oturum }: KatalogGirdileri = $props();
  const m = yonetimSozlugu();
  const k = m.kayitlar;
  let veri = $state<Sayfa<SupheliKayit>>({ items: [], total: 0, page: 1, pageSize: 25 });
  let sayfa = $state(1);
  let arama = $state("");
  let oyuncu = $state(""); let filtre = $state(""); let neden = $state(""); let yeniDurum = $state<SupheliKayit["durum"]>("acik"); let kaydediliyor = $state(false); let islemHatasi = $state("");
  let secilen = $state<SupheliKayit | null>(null);
  let durum = $state<"yukleniyor" | "hazir" | "hata">("yukleniyor");
  let hata = $state("");
  let deneme = 0;
  let istek = 0;
  const gorebilir = $derived(izinVar(oturum, "View:FraudFlag"));

  async function yukle() {
    const sira = ++istek;
    if (!izinVar(oturum, "ViewAny:FraudFlag")) { hata = k.yetkiYok; durum = "hata"; return; }
    durum = "yukleniyor";
    const s = await yonetimKayitlariniYukle("FraudFlag", kayitSorgusu(sayfa, arama, { playerId: oyuncu.trim(), durum: filtre, neden: neden.trim() }), deneme++);
    if (sira !== istek) return;
    if (!s.ok) { hata = hataMetni(s.hata, m); durum = "hata"; return; }
    veri = s.veri;
    sayfa = s.veri.page;
    durum = "hazir";
  }
  function uygula(e: SubmitEvent) { e.preventDefault(); sayfa = 1; void yukle(); }
  function temizle() { arama = ""; oyuncu = ""; filtre = ""; neden = ""; sayfa = 1; void yukle(); }
  function sayfayaGit(n: number) { sayfa = n; void yukle(); }

  function detayAc(x: SupheliKayit) { secilen = x; yeniDurum = x.durum; islemHatasi = ""; }
  async function kaydet(e: SubmitEvent) {
    e.preventDefault();
    if (!secilen || kaydediliyor || !izinVar(oturum, "Update:FraudFlag")) return;
    kaydediliyor = true;
    const s = await kayitGuncelle("FraudFlag", secilen.id, { durum: yeniDurum });
    kaydediliyor = false;
    if (!s.ok) { islemHatasi = hataMetni(s.hata, m); return; }
    secilen = null;
    await yukle();
  }
  onMount(() => { void yukle(); return () => { istek++; }; });
</script>

<div class="ekran">
  <EkranBasligi baslik={m.menu.supheli} aciklama={k.aciklama} />
  <form class="suzgec" onsubmit={uygula}>

    <label>{k.oyuncu}<input bind:value={oyuncu} /></label><label>{k.neden}<input bind:value={neden} /></label><label>{k.durum}<select bind:value={filtre}><option value="">{k.hepsi}</option>{#each Object.entries(k.supheDurum) as [id, ad]}<option value={id}>{ad}</option>{/each}</select></label>
    <button type="submit" disabled={durum === "yukleniyor"}>{k.uygula}</button>
    <button type="button" disabled={durum === "yukleniyor"} onclick={temizle}>{k.temizle}</button>
    <button type="button" disabled={durum === "yukleniyor"} onclick={() => yukle()}>{k.yenile}</button>
  </form>
  {#if durum === "yukleniyor"}
    <Yukleniyor metin={k.yukleniyor} />
  {:else if durum === "hata"}
    <HataDurumu baslik={m.hata.baslik} mesaj={hata} tekrarMetni={m.hata.tekrar} onTekrar={yukle} />
  {:else if veri.items.length === 0}
    <BosDurum baslik={k.bos} aciklama={k.bosAciklama} dugmeMetni={k.temizle} onDugme={temizle} />
  {:else}
    <div class="tablo">
      <table>
        <thead><tr><th scope="col">{k.oyuncu}</th><th scope="col">{k.neden}</th><th scope="col">{k.durum}</th><th scope="col">{k.tarih}</th>{#if gorebilir}<th scope="col">{k.detay}</th>{/if}</tr></thead>
        <tbody>{#each veri.items as x (x.id)}
          <tr><th scope="row">{x.playerId}</th><td>{x.neden}</td><td>{k.supheDurum[x.durum]}</td><td>{tarihYaz(x.tarih)}</td>
            {#if gorebilir}<td><button type="button" onclick={() => detayAc(x)}>{k.detay}</button></td>{/if}
          </tr>
        {/each}</tbody>
      </table>
    </div>
  {/if}
  <Sayfalama {sayfa} toplam={veri.total} boyut={veri.pageSize} mesgul={durum !== "hazir"} onSayfa={sayfayaGit} />
</div>

{#if secilen}
<Pencere baslik={m.menu.supheli} onKapat={() => { if (!kaydediliyor) secilen = null; }} kapatMetni={k.kapat}>
  <dl class="ayrinti"><dt>{k.oyuncu}</dt><dd>{secilen.playerId}</dd><dt>{k.neden}</dt><dd>{secilen.neden}</dd><dt>{k.kanit}</dt><dd>{secilen.kanit ?? "—"}</dd><dt>{k.durum}</dt><dd>{k.supheDurum[secilen.durum]}</dd></dl>
  <p>{k.yaptirimNotu}</p>
  {#if izinVar(oturum, "Update:FraudFlag")}
  <form onsubmit={kaydet}>
    <label>{k.durum}<select bind:value={yeniDurum} disabled={kaydediliyor}>{#each Object.entries(k.supheDurum) as [id, ad]}<option value={id}>{ad}</option>{/each}</select></label>
    {#if islemHatasi}<p class="form-hatasi" role="alert">{islemHatasi}</p>{/if}
    <button type="submit" class="btn" disabled={kaydediliyor || yeniDurum === secilen.durum}>{kaydediliyor ? k.kaydediliyor : k.kaydet}</button>
  </form>
  {/if}
</Pencere>
{/if}

<style>
  .ekran { display: flex; flex-direction: column; gap: var(--bosluk-4); max-width: 1200px; min-width: 0; }
  .suzgec { display: flex; flex-wrap: wrap; align-items: end; gap: var(--bosluk-3); }
  label { display: flex; flex-direction: column; gap: var(--bosluk-1); font-size: 13px; min-width: 0; }
  input, select, button { font: inherit; color: var(--yazi); background: var(--kart); border: 1px solid var(--kenar); border-radius: var(--radius-kucuk); padding: var(--bosluk-2); max-width: 100%; }
  input { width: 180px; }
  button { cursor: pointer; } button:disabled { opacity: 0.5; cursor: default; }
  .tablo { overflow-x: auto; border: 1px solid var(--kenar); border-radius: var(--radius); background: var(--kart); }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: var(--bosluk-3); text-align: start; border-bottom: 1px solid var(--kenar); white-space: nowrap; }
  th { color: var(--yazi-soluk); } tbody th { color: var(--yazi); }
  .ayrinti { overflow-wrap: anywhere; } .ayrinti dt { color: var(--yazi-soluk); } .ayrinti dd { margin: 0 0 var(--bosluk-3); }
</style>
