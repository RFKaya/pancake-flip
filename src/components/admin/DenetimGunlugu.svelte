<script lang="ts">
  import { onMount } from "svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { yonetimKayitlariniYukle } from "$lib/yukleyici";
  import type { KatalogGirdileri, Sayfa, DenetimKaydi } from "$lib/types";
  import { hataMetni, izinVar, kayitSorgusu, gunAraligi, tarihYaz } from "$lib/yonetim";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import EkranBasligi from "./EkranBasligi.svelte";
  import Sayfalama from "./Sayfalama.svelte";
  import Pencere from "./Pencere.svelte";
  let { oturum }: KatalogGirdileri = $props();
  const m = yonetimSozlugu();
  const k = m.kayitlar;
  let veri = $state<Sayfa<DenetimKaydi>>({ items: [], total: 0, page: 1, pageSize: 25 });
  let sayfa = $state(1);
  let arama = $state("");
  let kaynak = $state(""); let eylem = $state(""); let baslangic = $state(""); let bitis = $state("");
  let secilen = $state<DenetimKaydi | null>(null);
  let durum = $state<"yukleniyor" | "hazir" | "hata">("yukleniyor");
  let hata = $state("");
  let deneme = 0;
  let istek = 0;
  const gorebilir = $derived(izinVar(oturum, "View:AuditLog"));

  async function yukle() {
    const sira = ++istek;
    if (!izinVar(oturum, "ViewAny:AuditLog")) { hata = k.yetkiYok; durum = "hata"; return; }
    durum = "yukleniyor";
    const s = await yonetimKayitlariniYukle("AuditLog", kayitSorgusu(sayfa, arama, { entity: kaynak.trim(), action: eylem.trim(), ...gunAraligi(baslangic, bitis) }), deneme++);
    if (sira !== istek) return;
    if (!s.ok) { hata = hataMetni(s.hata, m); durum = "hata"; return; }
    veri = s.veri;
    sayfa = s.veri.page;
    durum = "hazir";
  }
  function uygula(e: SubmitEvent) { e.preventDefault(); sayfa = 1; void yukle(); }
  function temizle() { arama = ""; kaynak = ""; eylem = ""; baslangic = ""; bitis = ""; sayfa = 1; void yukle(); }
  function sayfayaGit(n: number) { sayfa = n; void yukle(); }

  onMount(() => { void yukle(); return () => { istek++; }; });
</script>

<div class="ekran">
  <EkranBasligi baslik={m.menu.denetim} aciklama={k.aciklama} />
  <form class="suzgec" onsubmit={uygula}>
    <label>{k.ara}<input type="search" bind:value={arama} /></label>
    <label>{k.kaynak}<input bind:value={kaynak} /></label><label>{k.eylem}<input bind:value={eylem} /></label><label>{k.baslangic}<input type="date" bind:value={baslangic} max={bitis || undefined} /></label><label>{k.bitis}<input type="date" bind:value={bitis} min={baslangic || undefined} /></label>
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
        <thead><tr><th scope="col">{k.tarih}</th><th scope="col">{k.aktor}</th><th scope="col">{k.eylem}</th><th scope="col">{k.kaynak}</th><th scope="col">{k.hedef}</th><th scope="col">{k.neden}</th>{#if gorebilir}<th scope="col">{k.detay}</th>{/if}</tr></thead>
        <tbody>{#each veri.items as x (x.id)}
          <tr><th scope="row">{tarihYaz(x.at)}</th><td>{x.actorId ?? "—"}</td><td>{x.action}</td><td>{x.entity}</td><td>{x.entityId}</td><td>{x.reason ?? "—"}</td>
            {#if gorebilir}<td><button type="button" onclick={() => secilen = x}>{k.detay}</button></td>{/if}
          </tr>
        {/each}</tbody>
      </table>
    </div>
  {/if}
  <Sayfalama {sayfa} toplam={veri.total} boyut={veri.pageSize} mesgul={durum !== "hazir"} onSayfa={sayfayaGit} />
</div>

{#if secilen}<Pencere baslik={secilen.action} onKapat={() => secilen = null} kapatMetni={k.kapat}>
<dl class="ayrinti"><dt>{k.aktor}</dt><dd>{secilen.actorId ?? "—"}</dd><dt>{k.kaynak}</dt><dd>{secilen.entity}</dd><dt>{k.hedef}</dt><dd>{secilen.entityId}</dd><dt>{k.neden}</dt><dd>{secilen.reason ?? "—"}</dd></dl>
<h3>{k.once}</h3><pre>{JSON.stringify(secilen.before, null, 2) ?? "—"}</pre><h3>{k.sonra}</h3><pre>{JSON.stringify(secilen.after, null, 2) ?? "—"}</pre>
</Pencere>{/if}

<style>
  .ekran { display: flex; flex-direction: column; gap: var(--bosluk-4); max-width: 1200px; min-width: 0; }
  .suzgec { display: flex; flex-wrap: wrap; align-items: end; gap: var(--bosluk-3); }
  label { display: flex; flex-direction: column; gap: var(--bosluk-1); font-size: 13px; min-width: 0; }
  input, button { font: inherit; color: var(--yazi); background: var(--kart); border: 1px solid var(--kenar); border-radius: var(--radius-kucuk); padding: var(--bosluk-2); max-width: 100%; }
  input { width: 180px; }
  button { cursor: pointer; } button:disabled { opacity: 0.5; cursor: default; }
  .tablo { overflow-x: auto; border: 1px solid var(--kenar); border-radius: var(--radius); background: var(--kart); }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: var(--bosluk-3); text-align: start; border-bottom: 1px solid var(--kenar); white-space: nowrap; }
  th { color: var(--yazi-soluk); } tbody th { color: var(--yazi); }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: var(--bosluk-3); background: var(--zemin); border-radius: var(--radius-kucuk); font-size: 12px; }
  .ayrinti { overflow-wrap: anywhere; } .ayrinti dt { color: var(--yazi-soluk); } .ayrinti dd { margin: 0 0 var(--bosluk-3); }
</style>
