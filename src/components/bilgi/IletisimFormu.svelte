<script lang="ts">
  // İletişim formu: gönderince sahte başarı bildirimi gösterir ve formu temizler
  import { iletisimMetni, yon, type Dil } from "$lib/i18n";

  let { dil = "tr" }: { dil?: Dil } = $props();
  let ad = $state("");
  let eposta = $state("");
  let konu = $state("");
  let mesaj = $state("");
  let durum = $state<"" | "basari" | "eksik">("");

  const m = $derived(iletisimMetni[dil]);
  const gecerli = $derived(
    ad.trim().length > 1 && /^\S+@\S+\.\S+$/.test(eposta) && konu.trim().length > 0 && mesaj.trim().length > 0
  );

  function gonder(event: SubmitEvent) {
    event.preventDefault();
    if (!gecerli) {
      durum = "eksik";
      return;
    }
    durum = "basari";
    ad = eposta = konu = mesaj = "";
  }
</script>

<form class="form" dir={yon(dil)} onsubmit={gonder} novalidate>
  <label>{m.ad}<input bind:value={ad} autocomplete="name" /></label>
  <label>{m.eposta}<input type="email" bind:value={eposta} autocomplete="email" dir="ltr" /></label>
  <label>{m.konu}<input bind:value={konu} /></label>
  <label>{m.mesaj}<textarea rows="5" bind:value={mesaj}></textarea></label>
  <button class="btn">{m.gonder}</button>
  {#if durum === "basari"}
    <p class="bildirim basari" role="status">✅ {m.basari}</p>
  {:else if durum === "eksik"}
    <p class="bildirim eksik" role="alert">⚠️ {m.eksik}</p>
  {/if}
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
  }

  input,
  textarea {
    padding: 12px;
    border: 1px solid var(--kenar);
    border-radius: 10px;
    background: var(--zemin);
    font-weight: 400;
  }

  .bildirim {
    margin: 0;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid currentColor;
    font-weight: 600;
  }

  .basari {
    color: var(--basari);
  }

  .eksik {
    color: var(--vurgu);
  }
</style>
