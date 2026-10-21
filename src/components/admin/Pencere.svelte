<script lang="ts">
  // İletişim kutusu (<dialog>, showModal): odak içeride tutulur, Esc ve dış tıklama kapatır. Formlar ve silme onayı bunun içinde açılır;
  // içerikteki etiket, girdi ve düğme biçimleri de burada tanımlıdır (yönetim formlarının ortak görünümü).
  import { onMount } from "svelte";
  import type { PencereGirdileri } from "$lib/types";

  let { baslik, onKapat, kapatMetni, children }: PencereGirdileri = $props();

  let kutu: HTMLDialogElement;

  onMount(() => {
    kutu.showModal();
    return () => kutu.close();
  });

  function disTiklama(e: MouseEvent) {
    if (e.target === kutu) onKapat();
  }
</script>

<dialog
  bind:this={kutu}
  class="pencere"
  aria-labelledby="pencere-baslik"
  oncancel={(e) => (e.preventDefault(), onKapat())}
  onclick={disTiklama}
>
  <header>
    <h2 id="pencere-baslik">{baslik}</h2>
    <button type="button" class="kapat" aria-label={kapatMetni} onclick={onKapat}>✕</button>
  </header>
  <div class="govde">
    {@render children()}
  </div>
</dialog>

<style>
  .pencere {
    width: min(560px, calc(100vw - 24px));
    max-height: calc(100vh - 24px);
    padding: 0;
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
    color: var(--yazi);
    box-shadow: var(--golge-yuksek);
  }

  .pencere::backdrop {
    background: color-mix(in srgb, var(--renk-koyu) 55%, transparent);
  }

  header {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    gap: var(--bosluk-3);
    padding: 14px 18px;
    border-bottom: 1px solid var(--kenar);
    background: var(--kart);
  }

  h2 {
    margin: 0;
    font-size: 17px;
  }

  .kapat {
    margin-inline-start: auto;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--yazi-soluk);
    font-size: 16px;
  }

  .kapat:hover {
    background: color-mix(in srgb, var(--kenar) 50%, transparent);
  }

  .govde {
    padding: 18px;
  }

  /* ---- İçerikteki formların ortak görünümü ---- */
  .govde :global(form) {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
  }

  .govde :global(.izgara) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--bosluk-3);
  }

  .govde :global(label) {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-1);
    font-size: 13px;
    font-weight: 600;
  }

  .govde :global(label.kutucuk) {
    flex-direction: row;
    align-items: center;
    gap: var(--bosluk-2);
  }

  .govde :global(input:not([type="checkbox"])),
  .govde :global(select) {
    padding: 9px 11px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: var(--zemin);
    color: var(--yazi);
    font: inherit;
    font-weight: 400;
  }

  .govde :global([aria-invalid="true"]) {
    border-color: var(--vurgu);
  }

  .govde :global(.alan-hatasi) {
    color: var(--vurgu);
    font-size: 12px;
    font-weight: 500;
  }

  .govde :global(.ipucu) {
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 400;
  }

  .govde :global(.form-hatasi) {
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-kucuk);
    background: color-mix(in srgb, var(--vurgu) 12%, transparent);
    color: var(--vurgu);
    font-size: 14px;
  }

  .govde :global(.dugmeler) {
    display: flex;
    justify-content: flex-end;
    gap: var(--bosluk-2);
    margin-top: var(--bosluk-2);
  }

  .govde :global(.dugmeler .btn) {
    width: auto;
    padding: 10px 18px;
  }

  .govde :global(.ikincil) {
    padding: 10px 16px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: transparent;
    font-weight: 700;
  }

  .govde :global(.tehlike) {
    background: var(--vurgu);
    box-shadow: 0 var(--basma) 0 color-mix(in srgb, var(--vurgu) 60%, var(--renk-koyu));
    color: var(--ust-yazi);
  }
</style>
