<script lang="ts">
  // Adım 14: Profil — basit (sahte) giriş formu, kullanıcı localStorage'da tutulur
  import { biletlerim } from "$lib/biletler.svelte";

  let kullanici = $state(
    typeof localStorage !== "undefined"
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
      <p>{biletlerim.liste.length} biletiniz var</p>
    </div>
    <a class="btn" href="/biletlerim">Biletlerime git</a>
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
</div>

<style>
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
</style>
