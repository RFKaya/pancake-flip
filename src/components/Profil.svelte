<script lang="ts">
  // Adım 14: Profil — basit (sahte) giriş formu, kullanıcı localStorage'da tutulur
  import { onMount } from "svelte";
  import { kayit } from "$lib/kayit.svelte";
  import { cal, sesDurumu, sesKaydet, sesYukle } from "$lib/oyun/ses";

  let sesAcik = $state(true);
  let sfx = $state(1);
  onMount(() => {
    kayit.yukle();
    sesYukle();
    sesAcik = sesDurumu.acik;
    sfx = sesDurumu.sfx;
  });

  function sesDegisti(ornek: boolean) {
    sesDurumu.acik = sesAcik;
    sesDurumu.sfx = sfx;
    sesKaydet();
    if (ornek) cal("coin"); // ayarı duyurmak için kısa örnek
  }

  let kullanici = $state(
    // Node 25+ SSR'de de global bir `localStorage` nesnesi tanımlar (getItem yok); bu yüzden window'a bakılır
    typeof window !== "undefined"
      ? (localStorage.getItem("kullanici") ?? "")
      : ""
  );
  let ad = $state("");
  let eposta = $state("");

  const gecerli = $derived(ad.trim().length > 1 && eposta.includes("@"));

  function girisYap(event: SubmitEvent) {
    event.preventDefault();
    kullanici = ad.trim();
    localStorage.setItem("kullanici", kullanici);
  }

  function cikisYap() {
    kullanici = "";
    localStorage.removeItem("kullanici");
  }
</script>

<div class="sayfa">
  {#if kullanici}
    <div class="kart profil">
      <div class="avatar">{kullanici[0].toLocaleUpperCase("tr")}</div>
      <h2>Merhaba, {kullanici}</h2>
      <p>{kayit.fisler().length} adisyonunuz var</p>
    </div>
    <a class="btn" href="/fislerim">Fişlerime git</a>
    <button class="btn ikincil" onclick={cikisYap}>Çıkış yap</button>
  {:else}
    <h1>Giriş yap</h1>
    <form class="kart form" onsubmit={girisYap}>
      <label>
        Ad Soyad
        <input bind:value={ad} placeholder="Ayşe Yılmaz" />
      </label>
      <label>
        E-posta
        <input type="email" bind:value={eposta} placeholder="ayse@ornek.com" />
      </label>
      <button class="btn" disabled={!gecerli}>Giriş yap</button>
    </form>
  {/if}

  <h2 class="bilgi-baslik">Ses</h2>
  <div class="kart ses-ayar">
    <label class="ses-satir">
      <span>Ses efektleri</span>
      <input type="checkbox" bind:checked={sesAcik} onchange={() => sesDegisti(true)} />
    </label>
    <label class="ses-satir">
      <span>Efekt seviyesi</span>
      <input type="range" min="0" max="1" step="0.05" bind:value={sfx} disabled={!sesAcik} onchange={() => sesDegisti(true)} />
    </label>
    <small>Müzik ayarı, müzik eklendiğinde buraya gelecek.</small>
  </div>

  <h2 class="bilgi-baslik">Bilgi</h2>
  <nav class="kart bilgi-linkler">
    <a href="/hakkinda">📖 Hakkında</a>
    <a href="/iletisim">✉️ İletişim</a>
    <a href="/kosullar">📜 Kullanım Koşulları</a>
    <a href="/gizlilik">🔒 Gizlilik Politikası</a>
  </nav>
</div>

<style>
  .ses-ayar { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; }
  .ses-satir { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ses-satir input[type="range"] { flex: 1; max-width: 160px; }
  .ses-ayar small { color: var(--yazi-soluk); }

  h1 {
    margin: 0;
    font-size: 22px;
  }

  .profil {
    padding: 24px;
    text-align: center;
  }

  .profil h2 {
    margin: 12px 0 4px;
  }

  .profil p {
    margin: 0;
    color: var(--yazi-soluk);
  }

  .avatar {
    width: 72px;
    height: 72px;
    margin: 0 auto;
    border-radius: 50%;
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
    font-size: 32px;
    font-weight: 700;
    line-height: 72px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
  }

  input {
    padding: 12px;
    border: 1px solid var(--kenar);
    border-radius: 10px;
    background: var(--zemin);
    font-weight: 400;
  }

  .ikincil {
    background: var(--kart);
    color: var(--yazi);
    border: 1px solid var(--kenar);
    margin-top: 8px;
  }

  .bilgi-baslik {
    margin: 8px 0 0;
    font-size: 16px;
  }

  .bilgi-linkler {
    display: flex;
    flex-direction: column;
  }

  .bilgi-linkler a {
    padding: 14px 16px;
    border-bottom: 1px solid var(--kenar);
  }

  .bilgi-linkler a:last-child {
    border-bottom: 0;
  }
</style>
