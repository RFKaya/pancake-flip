<script lang="ts">
  import { onMount } from "svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { yonetimKayitlariniYukle } from "$lib/yukleyici";
  import type { KatalogGirdileri, Sayfa, YonetimFisi } from "$lib/types";
  import { hataMetni, izinVar, kayitSorgusu, sayiYaz, tarihYaz } from "$lib/yonetim";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import EkranBasligi from "./EkranBasligi.svelte";
  import Sayfalama from "./Sayfalama.svelte";
  import FisDetayi from "./FisDetayi.svelte";
  let { oturum }: KatalogGirdileri = $props();
  const m = yonetimSozlugu();
  const k = m.kayitlar;
  let veri = $state<Sayfa<YonetimFisi>>({ items: [], total: 0, page: 1, pageSize: 25 });
  let sayfa = $state(1);
  let arama = $state("");
  let oyuncu = $state(""); let seviye = $state<number | undefined>(undefined); let yildiz = $state("");
  let secilen = $state<YonetimFisi | null>(null);
  let durum = $state<"yukleniyor" | "hazir" | "hata">("yukleniyor");
  let hata = $state("");
  let deneme = 0;
  let istek = 0;
  const gorebilir = $derived(izinVar(oturum, "View:Fis"));

  async function yukle() {
    const sira = ++istek;
    if (!izinVar(oturum, "ViewAny:Fis")) { hata = k.yetkiYok; durum = "hata"; return; }
    durum = "yukleniyor";
    const s = await yonetimKayitlariniYukle("Fis", kayitSorgusu(sayfa, arama, { playerId: oyuncu.trim(), bolum: seviye ?? "", yildiz: yildiz === "" ? "" : Number(yildiz) }), deneme++);
    if (sira !== istek) return;
    if (!s.ok) { hata = hataMetni(s.hata, m); durum = "hata"; return; }
    veri = s.veri;
    sayfa = s.veri.page;
    durum = "hazir";
  }
  function uygula(e: SubmitEvent) { e.preventDefault(); sayfa = 1; void yukle(); }
  function temizle() { arama = ""; oyuncu = ""; seviye = undefined; yildiz = ""; sayfa = 1; void yukle(); }
  function sayfayaGit(n: number) { sayfa = n; void yukle(); }

  onMount(() => { void yukle(); return () => { istek++; }; });
</script>

<div class="ekran">
  <EkranBasligi baslik={m.menu.fisler} aciklama={k.aciklama} />
  <form class="suzgec" onsubmit={uygula}>
    <label>{k.ara}<input type="search" bind:value={arama} /></label>
    <label>{k.oyuncu}<input bind:value={oyuncu} /></label><label>{k.seviye}<input type="number" min="1" step="1" bind:value={seviye} /></label><label>{k.yildiz}<select bind:value={yildiz}><option value="">{k.hepsi}</option>{#each [0, 1, 2, 3] as n}<option value={String(n)}>{n}</option>{/each}</select></label>
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
        <thead><tr><th scope="col">{k.kod}</th><th scope="col">{k.oyuncu}</th><th scope="col">{k.seviye}</th><th scope="col">{k.yildiz}</th><th scope="col">{k.net}</th><th scope="col">{k.coin}</th><th scope="col">{k.tarih}</th>{#if gorebilir}<th scope="col">{k.detay}</th>{/if}</tr></thead>
        <tbody>{#each veri.items as x (x.kod)}
          <tr><th scope="row">{x.kod}</th><td>{x.playerId ?? "—"}</td><td>{sayiYaz(x.bolum)}</td><td>{sayiYaz(x.yildiz)}</td><td>{sayiYaz(x.net)}</td><td>{sayiYaz(x.kasa)}</td><td>{tarihYaz(x.tarih)}</td>
            {#if gorebilir}<td><button type="button" onclick={() => secilen = x}>{k.detay}</button></td>{/if}
          </tr>
        {/each}</tbody>
      </table>
    </div>
  {/if}
  <Sayfalama {sayfa} toplam={veri.total} boyut={veri.pageSize} mesgul={durum !== "hazir"} onSayfa={sayfayaGit} />
</div>

{#if secilen}<FisDetayi kayit={secilen} onKapat={() => secilen = null} />{/if}

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
</style>
