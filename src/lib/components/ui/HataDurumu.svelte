<script lang="ts">
  // Hata hâli: ne olduğunu söyleyen mesaj ve isteğe bağlı "Tekrar dene" düğmesi.
  import type { HataDurumuGirdileri } from "$lib/types";

  let { baslik, mesaj, tekrarMetni, onTekrar }: HataDurumuGirdileri = $props();
</script>

<section class="hata-durumu" role="alert">
  <span class="ikon" aria-hidden="true">⚠️</span>
  <h2>{baslik}</h2>
  <p>{mesaj}</p>
  {#if tekrarMetni && onTekrar}
    <button type="button" class="btn" onclick={onTekrar}>↻ {tekrarMetni}</button>
  {/if}
</section>

<style>
  .hata-durumu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--bosluk-2);
    padding: var(--bosluk-4) var(--bosluk-4) calc(var(--bosluk-4) * 2);
    border: 1px solid color-mix(in srgb, var(--vurgu) 45%, var(--kenar));
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--vurgu) 7%, var(--kart));
    text-align: center;
  }

  .ikon {
    font-size: 40px;
    line-height: 1;
  }

  h2 {
    margin: 0;
    color: var(--vurgu);
    font-size: 18px;
  }

  p {
    max-width: 34ch;
    margin: 0;
    color: var(--yazi);
    overflow-wrap: anywhere;
  }

  .btn {
    margin-top: var(--bosluk-2);
  }
</style>
