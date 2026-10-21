<script lang="ts">
  // Yönetici girişi ve hesap oluşturma: yerel arka uca (auth_login / auth_register) native.ts üzerinden gider.
  // Doğrulama arka uçtadır (auth.rs); burada yalnız boş gönderim engellenir ve arka ucun iletisi gösterilir.
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { yonetimGiris, yonetimKayit } from "$lib/native";
  import type { GirisGirdileri } from "$lib/types";
  import { hataMetni } from "$lib/yonetim";

  let { onGiris }: GirisGirdileri = $props();

  const m = yonetimSozlugu();

  let mod = $state<"giris" | "kayit">("giris");
  let ad = $state("");
  let eposta = $state("");
  let parola = $state("");
  let gonderiliyor = $state(false);
  let hata = $state("");

  const dolu = $derived(eposta.trim() !== "" && parola !== "" && (mod === "giris" || ad.trim() !== ""));

  async function gonder(event: SubmitEvent) {
    event.preventDefault();
    if (!dolu || gonderiliyor) return;
    gonderiliyor = true;
    hata = "";
    const s = mod === "giris" ? await yonetimGiris(eposta.trim(), parola) : await yonetimKayit(ad.trim(), eposta.trim(), parola);
    gonderiliyor = false;
    if (s.ok) onGiris(s.veri);
    else hata = hataMetni(s.hata, m);
  }

  function modSec(yeni: "giris" | "kayit") {
    mod = yeni;
    hata = "";
  }
</script>

<section class="kart giris" aria-labelledby="giris-baslik">
  <h2 id="giris-baslik">{m.giris.baslik}</h2>
  <p class="soluk">{m.giris.aciklama}</p>

  <div class="sekmeler" role="group">
    <button type="button" class:secili={mod === "giris"} aria-pressed={mod === "giris"} onclick={() => modSec("giris")}>
      {m.giris.girisSekmesi}
    </button>
    <button type="button" class:secili={mod === "kayit"} aria-pressed={mod === "kayit"} onclick={() => modSec("kayit")}>
      {m.giris.kayitSekmesi}
    </button>
  </div>

  <form onsubmit={gonder}>
    {#if mod === "kayit"}
      <label>
        {m.giris.ad}
        <input type="text" autocomplete="name" bind:value={ad} required />
      </label>
    {/if}
    <label>
      {m.giris.eposta}
      <input type="email" autocomplete="email" bind:value={eposta} required />
    </label>
    <label>
      {m.giris.parola}
      <input
        type="password"
        autocomplete={mod === "giris" ? "current-password" : "new-password"}
        minlength={mod === "kayit" ? 8 : undefined}
        maxlength="128"
        bind:value={parola}
        required
      />
      {#if mod === "kayit"}<small class="soluk">{m.giris.parolaKurali}</small>{/if}
    </label>

    {#if hata}<p class="hata" role="alert">{hata}</p>{/if}

    <button class="btn" type="submit" disabled={!dolu || gonderiliyor}>
      {gonderiliyor ? m.giris.gonderiliyor : mod === "giris" ? m.giris.girisYap : m.giris.kayitOl}
    </button>
  </form>

  {#if mod === "kayit"}<p class="not soluk">{m.giris.ilkHesap}</p>{/if}
</section>

<style>
  .giris {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
    padding: 20px;
  }

  h2 {
    margin: 0;
    font-size: 20px;
  }

  p {
    margin: 0;
  }

  .soluk {
    color: var(--yazi-soluk);
    font-size: 13px;
  }

  .sekmeler {
    display: flex;
    gap: var(--bosluk-1);
    padding: var(--bosluk-1);
    border-radius: var(--radius-kucuk);
    background: color-mix(in srgb, var(--kenar) 45%, transparent);
  }

  .sekmeler button {
    flex: 1;
    padding: 8px;
    border: 0;
    border-radius: calc(var(--radius-kucuk) - 2px);
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    color: var(--yazi-soluk);
  }

  .sekmeler button.secili {
    background: var(--kart);
    color: var(--yazi);
    box-shadow: 0 1px 0 var(--kenar);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-1);
    font-size: 14px;
    font-weight: 600;
  }

  input {
    padding: 10px 12px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: var(--zemin);
    font-weight: 400;
  }

  .hata {
    padding: 10px 12px;
    border-radius: var(--radius-kucuk);
    background: color-mix(in srgb, var(--vurgu) 12%, transparent);
    color: var(--vurgu);
    font-size: 14px;
  }

  .not {
    text-align: center;
  }
</style>
