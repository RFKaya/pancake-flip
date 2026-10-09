<script lang="ts">
  // Genel liste kartı: hangi veriyi gösterdiğini bilmez; dönüşümü kartı kullanan ekran yapar (girdiler: $lib/types → KartGirdileri).
  // href verilirse bağlantı, onclick verilirse düğme, ikisi de yoksa düz kutu olur; klavyeyle odaklanır, Enter ile açılır.
  import type { KartGirdileri } from "$lib/types";

  let { baslik, altMetin, gorsel, ikon, gorselAlt, etiket, etiketTuru = "bilgi", href, onclick }: KartGirdileri = $props();
</script>

{#snippet icerik()}
  {#if gorsel}
    <img class="gorsel" src={gorsel} alt={gorselAlt ?? baslik} loading="lazy" />
  {:else if ikon}
    <span class="gorsel ikon" role="img" aria-label={gorselAlt ?? baslik}>{ikon}</span>
  {/if}
  <span class="metin">
    <strong class="baslik">{baslik}</strong>
    {#if altMetin}<span class="alt">{altMetin}</span>{/if}
  </span>
  {#if etiket}<span class="etiket {etiketTuru}">{etiket}</span>{/if}
{/snippet}

{#if href}
  <a class="ui-kart etkin" {href}>{@render icerik()}</a>
{:else if onclick}
  <button type="button" class="ui-kart etkin" {onclick}>{@render icerik()}</button>
{:else}
  <div class="ui-kart">{@render icerik()}</div>
{/if}

<style>
  .ui-kart {
    display: flex;
    align-items: center;
    gap: var(--bosluk-3);
    width: 100%;
    min-height: 64px;
    padding: var(--bosluk-3) var(--bosluk-4);
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
    box-shadow: var(--golge-kart);
    color: var(--yazi);
    font: inherit;
    text-align: start;
    text-decoration: none;
    box-sizing: border-box;
  }

  .etkin {
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .etkin:active {
    transform: translateY(var(--bosluk-1));
    box-shadow: 0 0 0 var(--kenar);
  }

  .etkin:focus-visible {
    outline: 3px solid var(--renk-logo);
    outline-offset: 2px;
  }

  .gorsel {
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-kucuk);
    object-fit: cover;
    background: color-mix(in srgb, var(--kenar) 45%, var(--kart));
  }

  .ikon {
    display: grid;
    place-items: center;
    font-size: 28px;
    line-height: 1;
  }

  .metin {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  /* Uzun başlık iki satırda kesilir; uzun tek kelime de taşmaz */
  .baslik {
    display: -webkit-box;
    overflow: hidden;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.25;
    overflow-wrap: anywhere;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .alt {
    overflow: hidden;
    color: var(--yazi-soluk);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .etiket {
    flex: none;
    max-width: 40%;
    overflow: hidden;
    padding: 2px var(--bosluk-2);
    border: 1px solid currentColor;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .etiket.bilgi { color: var(--renk-ana); background: color-mix(in srgb, var(--renk-ana) 10%, var(--kart)); }
  .etiket.basari { color: var(--basari); background: color-mix(in srgb, var(--basari) 10%, var(--kart)); }
  .etiket.uyari { color: var(--yazi); border-color: var(--renk-logo); background: color-mix(in srgb, var(--renk-logo) 22%, var(--kart)); }
  .etiket.hata { color: var(--vurgu); background: color-mix(in srgb, var(--vurgu) 10%, var(--kart)); }

  @media (prefers-reduced-motion: reduce) {
    .etkin { transition: none; }
  }
</style>
