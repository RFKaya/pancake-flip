<script lang="ts">
  // Boş hâl: başlık, açıklama ve isteğe bağlı düğme (bağlantı ya da eylem; örn. "Aramayı temizle").
  import type { BosDurumGirdileri } from "$lib/types";

  let { baslik, aciklama, ikon = "🍽️", dugmeMetni, href, onDugme }: BosDurumGirdileri = $props();
</script>

<section class="bos-durum" aria-live="polite">
  <span class="ikon" aria-hidden="true">{ikon}</span>
  <h2>{baslik}</h2>
  {#if aciklama}<p>{aciklama}</p>{/if}
  {#if dugmeMetni && href}
    <a class="btn" {href}>{dugmeMetni}</a>
  {:else if dugmeMetni && onDugme}
    <button type="button" class="btn" onclick={onDugme}>{dugmeMetni}</button>
  {/if}
</section>

<style>
  .bos-durum {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--bosluk-2);
    padding: var(--bosluk-4) var(--bosluk-4) calc(var(--bosluk-4) * 2);
    border: 1px dashed var(--kenar);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--kart) 70%, var(--zemin));
    text-align: center;
  }

  .ikon {
    font-size: 44px;
    line-height: 1;
  }

  h2 {
    margin: 0;
    font-size: 18px;
  }

  p {
    max-width: 32ch;
    margin: 0;
    color: var(--yazi-soluk);
    overflow-wrap: anywhere;
  }

  .btn {
    margin-top: var(--bosluk-2);
    text-decoration: none;
  }
</style>
