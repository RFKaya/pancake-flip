<script lang="ts">
  // Adım 14: Profil — basit (sahte) giriş formu, kullanıcı localStorage'da tutulur
  import { onMount } from "svelte";
  import { ilerleme } from "$lib/ilerleme.svelte";
  import { kayit } from "$lib/kayit.svelte";
  import { cal, sesDurumu, sesKaydet, sesYukle } from "$lib/oyun/ses";
  import { sayiKisalt } from "$lib/oyun/seviye";

  let sesAcik = $state(true);
  let sfx = $state(1);
  let hazir = $state(false);
  onMount(() => {
    kayit.yukle();
    ilerleme.yukle();
    hazir = true;
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
  {#if hazir}
    {@const v = ilerleme.veri}
    <section class="kart karne" aria-labelledby="karne-baslik">
      <h2 id="karne-baslik">🍳 Mutfak karnesi</h2>
      {#if v.toplamMusteri > 0}
        <div class="rozet">
          <span class="krep-kule" aria-hidden="true"><i></i><i></i><i></i></span>
          <div>
            <strong>Seviye {sayiKisalt(v.seviye)}</strong>
            {#if v.enYuksekSeviye > v.seviye}<small>En yüksek: {sayiKisalt(v.enYuksekSeviye)}</small>{/if}
          </div>
        </div>
        <ul class="karolar">
          <li><span aria-hidden="true">🧑‍🍳</span><b>{sayiKisalt(v.toplamMusteri)}</b><small>müşteri</small></li>
          <li><span aria-hidden="true">⭐</span><b>{sayiKisalt(v.toplamMukemmel)}</b><small>mükemmel</small></li>
          <li><span aria-hidden="true">🔥</span><b>{sayiKisalt(v.enIyiSeri)}</b><small>en uzun seri</small></li>
          <li><span aria-hidden="true">🪙</span><b>{sayiKisalt(v.toplamCoin)}</b><small>coin</small></li>
          <li><span aria-hidden="true">🧾</span><b>{sayiKisalt(kayit.fisler().length)}</b><small>adisyon</small></li>
        </ul>
      {:else}
        <p class="karne-bos">Henüz müşteri yok. İlk krebini dök, karnen burada dolsun!</p>
        <a class="btn" href="/">🥞 Oyna</a>
      {/if}
    </section>
  {/if}
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
  .karne { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .karne h2 { margin: 0; font-size: 18px; }
  .rozet { display: flex; align-items: center; gap: 12px; }
  .rozet strong { display: block; font-size: 22px; }
  .rozet small { color: var(--yazi-soluk); font-weight: 700; }
  .krep-kule { display: flex; flex-direction: column-reverse; align-items: center; width: 56px; }
  .krep-kule i { width: 52px; height: 12px; margin-top: -3px; border-radius: 50%; background: var(--krep-iyi); border: 2px solid var(--kart); }
  .krep-kule i:nth-child(2) { width: 46px; }
  .krep-kule i:nth-child(3) { width: 40px; background: var(--renk-ana); }
  .karolar { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
  .karolar li { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 6px; border-radius: 14px; background: var(--zemin); border: 1px solid var(--kenar); }
  .karolar span { font-size: 22px; line-height: 1; }
  .karolar b { font-size: 18px; }
  .karolar small { color: var(--yazi-soluk); font-size: 12px; font-weight: 700; text-align: center; }
  .karne-bos { margin: 0; color: var(--yazi-soluk); }
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
