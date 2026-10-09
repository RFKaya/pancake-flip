<script lang="ts">
  // Malzeme rehberi listesi: veriyi tek yükleme işlevinden (malzemeleriYukle) alır ve dört hâlden birini gösterir:
  // yükleniyor, hata, boş, dolu. Malzeme verisini genel Kart girdilerine çevirir (Kart veri tipini tanımaz).
  // Arama metni adreste (?q=) tutulur: detaydan geri dönünce arama kaybolmaz. Açık / kilitli etiketi cihazdaki seviyeden gelir.
  import { onMount } from "svelte";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Kart from "$lib/components/ui/Kart.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import { ilerleme } from "$lib/ilerleme.svelte";
  import { durumMetni, kategoriAdlari, malzemeAdlari, rehberMetni, sayfaYolu, type Dil } from "$lib/i18n";
  import type { KartGirdileri, ListeDurumu, Malzeme } from "$lib/types";
  import { malzemeleriYukle } from "$lib/yukleyici";

  let { dil }: { dil: Dil } = $props();

  let durum = $state<ListeDurumu>("yukleniyor");
  let malzemeler = $state<Malzeme[]>([]);
  let seviye = $state(1);
  let arama = $state("");
  let deneme = 0;

  async function yukle() {
    durum = "yukleniyor";
    try {
      malzemeler = await malzemeleriYukle(deneme++);
      durum = malzemeler.length ? "dolu" : "bos";
    } catch {
      durum = "hata";
    }
  }

  onMount(() => {
    ilerleme.yukle();
    seviye = ilerleme.veri.seviye;
    arama = new URLSearchParams(window.location.search).get("q") ?? "";
    yukle();
  });

  /** Arama adreste tutulur (geri dönüşte korunsun); diğer parametreler (örn. ?durum=) olduğu gibi kalır */
  function aramaYaz(q: string) {
    arama = q;
    const adres = new URL(window.location.href);
    if (q) adres.searchParams.set("q", q);
    else adres.searchParams.delete("q");
    history.replaceState(history.state, "", adres);
  }

  const metin = $derived(rehberMetni[dil]);
  const dm = $derived(durumMetni[dil]);
  const ad = (m: Malzeme) => malzemeAdlari[dil][m.id] ?? m.ad;
  const aranan = $derived(arama.trim().toLocaleLowerCase(dil));
  const kartlar = $derived(
    malzemeler
      .filter((m) => !aranan || ad(m).toLocaleLowerCase(dil).includes(aranan) || m.ad.toLocaleLowerCase("tr").includes(aranan))
      .map((m): KartGirdileri & { id: string } => ({
        id: m.id,
        baslik: ad(m),
        altMetin: `${kategoriAdlari[dil][m.kategori]} · +${m.deger} 🪙`,
        ikon: m.ikon,
        gorselAlt: ad(m),
        etiket: m.acilis <= seviye ? metin.acik : metin.seviye(m.acilis),
        etiketTuru: m.acilis <= seviye ? "basari" : "uyari",
        href: `${sayfaYolu(dil, "rehber")}/${m.id}`,
      })),
  );
</script>

{#if durum === "yukleniyor"}
  <Yukleniyor metin={dm.yukleniyor} satir={6} />
{:else if durum === "hata"}
  <HataDurumu baslik={dm.hataBaslik} mesaj={dm.hataMesaji} tekrarMetni={dm.tekrar} onTekrar={yukle} />
{:else if durum === "bos"}
  <BosDurum baslik={dm.bosBaslik} aciklama={dm.bosAciklama} dugmeMetni={dm.oyna} href="/" />
{:else}
  <label class="arama">
    <span class="gizli">{dm.ara}</span>
    <input type="search" placeholder={`🔍 ${dm.ara}`} value={arama} oninput={(e) => aramaYaz(e.currentTarget.value)} />
  </label>
  {#if kartlar.length}
    <ul class="liste" aria-label={metin.liste}>
      {#each kartlar as { id, ...k } (id)}
        <li><Kart {...k} /></li>
      {/each}
    </ul>
  {:else}
    <BosDurum ikon="🔎" baslik={dm.aramaBosBaslik} aciklama={dm.aramaBosAciklama(arama.trim())} dugmeMetni={dm.temizle} onDugme={() => aramaYaz("")} />
  {/if}
{/if}

<style>
  .arama input {
    width: 100%;
    min-height: 44px;
    padding: var(--bosluk-2) var(--bosluk-3);
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
    color: var(--yazi);
    font: inherit;
    box-sizing: border-box;
  }

  .arama input:focus-visible {
    outline: 3px solid var(--renk-logo);
    outline-offset: 2px;
  }

  .gizli {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .liste {
    display: grid;
    gap: var(--bosluk-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  @media (min-width: 768px) {
    .liste { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
