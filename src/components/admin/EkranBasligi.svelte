<script lang="ts">
  // Yönetim ekranlarının ortak başlığı: ad, açıklama, verinin nereden geldiğini söyleyen not ve sağda eylemler.
  import type { EkranBasligiGirdileri } from "$lib/types";

  let { baslik, aciklama, not, children }: EkranBasligiGirdileri = $props();
</script>

<header class="baslik">
  <div>
    <h2>{baslik}</h2>
    <p class="soluk">{aciklama}</p>
    {#if not}<p class="not">{not}</p>{/if}
  </div>
  {#if children}<div class="eylemler">{@render children()}</div>{/if}
</header>

<style>
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
    max-width: 70ch;
    color: var(--yazi-soluk);
    font-size: 13px;
  }

  .not {
    margin-top: var(--bosluk-2);
    padding: 8px 10px;
    border-inline-start: 3px solid var(--renk-logo);
    border-radius: var(--radius-kucuk);
    background: color-mix(in srgb, var(--renk-logo) 10%, transparent);
    color: var(--yazi-soluk);
    font-size: 12px;
  }

  .eylemler {
    display: flex;
    flex-wrap: wrap;
    gap: var(--bosluk-2);
  }

  .eylemler :global(.btn) {
    width: auto;
    padding: 10px 16px;
  }
</style>
