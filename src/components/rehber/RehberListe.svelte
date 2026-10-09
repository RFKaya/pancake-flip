<script lang="ts">
  // Malzeme rehberi listesi: malzeme verisini genel Kart girdilerine çevirir (Kart veri tipini tanımaz).
  // Açık / kilitli etiketi oyuncunun cihazdaki seviyesinden gelir; sayfa dili (tr, en, ar, fa) dışarıdan verilir.
  import { onMount } from "svelte";
  import Kart from "$lib/components/ui/Kart.svelte";
  import { ilerleme } from "$lib/ilerleme.svelte";
  import { kategoriAdlari, malzemeAdlari, rehberMetni, sayfaYolu, type Dil } from "$lib/i18n";
  import { MALZEMELER } from "$lib/oyun/veri";
  import type { KartGirdileri } from "$lib/types";

  let { dil }: { dil: Dil } = $props();

  let seviye = $state(1);
  onMount(() => {
    ilerleme.yukle();
    seviye = ilerleme.veri.seviye;
  });

  const metin = $derived(rehberMetni[dil]);
  const kartlar = $derived(
    MALZEMELER.map((m): KartGirdileri & { id: string } => ({
      id: m.id,
      baslik: malzemeAdlari[dil][m.id] ?? m.ad,
      altMetin: `${kategoriAdlari[dil][m.kategori]} · +${m.deger} 🪙`,
      ikon: m.ikon,
      gorselAlt: malzemeAdlari[dil][m.id] ?? m.ad,
      etiket: m.acilis <= seviye ? metin.acik : metin.seviye(m.acilis),
      etiketTuru: m.acilis <= seviye ? "basari" : "uyari",
      href: `${sayfaYolu(dil, "rehber")}/${m.id}`,
    })),
  );
</script>

<ul class="liste" aria-label={metin.liste}>
  {#each kartlar as { id, ...k } (id)}
    <li><Kart {...k} /></li>
  {/each}
</ul>

<style>
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
