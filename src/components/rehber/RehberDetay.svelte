<script lang="ts">
  // Malzeme detayı: adresteki kimlikle (/rehber/<id>) malzemeyi bulur; yoksa HataDurumu ile "bulunamadı".
  // Geri: listenin son adresine döner (liste aramasıyla birlikte ?q= adresini sessionStorage'a yazar); yoksa düz listeye gider.
  import { onMount } from "svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import { ilerleme } from "$lib/ilerleme.svelte";
  import { detayMetni, kategoriAdlari, malzemeAdlari, rehberMetni, sayfaYolu, type Dil } from "$lib/i18n";
  import { MALZEMELER } from "$lib/oyun/veri";
  import { LISTE_ANAHTARI } from "./rehber";

  let { id, dil }: { id: string; dil: Dil } = $props();

  const m = $derived(MALZEMELER.find((x) => x.id === id) ?? null);
  const dm = $derived(detayMetni[dil]);
  const rm = $derived(rehberMetni[dil]);
  const listeAdresi = $derived(sayfaYolu(dil, "rehber"));

  let seviye = $state(1);
  let kayitliListe = $state<string | null>(null);
  onMount(() => {
    ilerleme.yukle();
    seviye = ilerleme.veri.seviye;
    try {
      kayitliListe = sessionStorage.getItem(LISTE_ANAHTARI);
    } catch {
      kayitliListe = null;
    }
  });
  // Yalnız aynı dildeki listeye dönülür (/rehber?q=… ya da /en/rehber/?q=…)
  const geriAdresi = $derived(
    kayitliListe && kayitliListe.replace(/[?#].*$/, "").replace(/\/$/, "") === listeAdresi ? kayitliListe : listeAdresi,
  );
</script>

<a class="geri" href={geriAdresi}>← {dm.geri}</a>

{#if m}
  {@const ad = malzemeAdlari[dil][m.id] ?? m.ad}
  {@const acik = m.acilis <= seviye}
  <article class="detay">
    <span class="ikon" role="img" aria-label={ad}>{m.ikon}</span>
    <h1>{ad}</h1>
    <span class="durum" class:acik>{acik ? rm.acik : rm.seviye(m.acilis)}</span>
    <dl>
      <div><dt>{dm.kategori}</dt><dd>{kategoriAdlari[dil][m.kategori]}</dd></div>
      <div><dt>{dm.acilis}</dt><dd>{rm.seviye(m.acilis)}</dd></div>
      <div><dt>{dm.deger}</dt><dd>+{m.deger} 🪙</dd></div>
      <div><dt>{dm.maliyet}</dt><dd>−{m.maliyet} 🪙</dd></div>
      <div><dt>{dm.tatli}</dt><dd>{m.tatli ? dm.evet : dm.hayir}</dd></div>
    </dl>
  </article>
{:else}
  <HataDurumu baslik={dm.bulunamadiBaslik} mesaj={dm.bulunamadiMesaj} />
{/if}

<style>
  .geri {
    align-self: flex-start;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    color: var(--renk-ana);
    font-weight: 800;
    text-decoration: none;
  }

  .geri:focus-visible {
    outline: 3px solid var(--renk-logo);
    outline-offset: 2px;
    border-radius: var(--radius-kucuk);
  }

  .detay {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--bosluk-2);
    padding: var(--bosluk-4);
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
    box-shadow: var(--golge-kart);
  }

  .ikon {
    display: grid;
    place-items: center;
    width: 96px;
    height: 96px;
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--kenar) 45%, var(--kart));
    font-size: 56px;
    line-height: 1;
  }

  h1 {
    margin: 0;
    font-size: 26px;
    text-align: center;
    overflow-wrap: anywhere;
  }

  .durum {
    padding: 2px var(--bosluk-3);
    border: 1px solid var(--renk-logo);
    border-radius: 999px;
    background: color-mix(in srgb, var(--renk-logo) 22%, var(--kart));
    font-size: 13px;
    font-weight: 800;
  }

  .durum.acik {
    border-color: var(--basari);
    background: color-mix(in srgb, var(--basari) 10%, var(--kart));
    color: var(--basari);
  }

  dl {
    display: grid;
    gap: var(--bosluk-2);
    width: 100%;
    margin: var(--bosluk-2) 0 0;
  }

  dl div {
    display: flex;
    justify-content: space-between;
    gap: var(--bosluk-3);
    padding: var(--bosluk-2) 0;
    border-top: 1px solid var(--kenar);
  }

  dt {
    color: var(--yazi-soluk);
  }

  dd {
    margin: 0;
    font-weight: 800;
    text-align: end;
  }
</style>
