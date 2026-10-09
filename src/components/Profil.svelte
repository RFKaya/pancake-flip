<script lang="ts">
  // Profil: şef karnesi (ilerleme kaydı + fiş sayısı, yalnızca okunur), hesap (sahte giriş, localStorage), ses ve bilgi
  import { onMount } from "svelte";
  import { ilerleme } from "$lib/ilerleme.svelte";
  import { kayit } from "$lib/kayit.svelte";
  import { cal, sesDurumu, sesKaydet, sesYukle } from "$lib/oyun/ses";
  import { gerekenMusteri, sayiKisalt, sonrakiAcilis } from "$lib/oyun/seviye";

  /** Seviye kimliğin parçası: kısaltılmaz, binlik ayraçla tam yazılır (123.456) */
  const seviyeYaz = (n: number) => n.toLocaleString("tr-TR");

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
    {@const gereken = gerekenMusteri(v.seviye)}
    {@const sonraki = sonrakiAcilis(v.seviye)}
    {@const fisSayisi = kayit.fisler().length}
    <section class="sef" aria-labelledby="sef-baslik">
      <div class="kimlik">
        <!-- Şef rozeti: karamel tabak üstünde krep kulesi, tepede aşçı şapkası (yalnızca CSS) -->
        <div class="rozet" aria-hidden="true">
          <span class="sapka"><i></i></span>
          <span class="kule"><i></i><i></i><i></i></span>
        </div>
        <div class="kimlik-yazi">
          <p class="ust-baslik">👨‍🍳 Şef karnesi</p>
          <h1 id="sef-baslik">{kullanici ? `Şef ${kullanici}` : "Şef"}</h1>
          <div class="seviye">
            <small>Şef seviyesi</small>
            <strong>{seviyeYaz(v.seviye)}</strong>
          </div>
        </div>
      </div>

      <div class="yol">
        <div
          class="cubuk"
          role="progressbar"
          aria-label="Sonraki seviyeye ilerleme"
          aria-valuemin={0}
          aria-valuemax={gereken}
          aria-valuenow={Math.floor(v.ilerleme)}
        >
          <span style:width={`${Math.min(100, (v.ilerleme / gereken) * 100)}%`}></span>
        </div>
        <p class="durum">
          {Math.floor(v.ilerleme)} / {sayiKisalt(gereken)} müşteri → seviye {seviyeYaz(v.seviye + 1)}
          {#if v.enYuksekSeviye > v.seviye}<span class="soluk">· en yüksek {seviyeYaz(v.enYuksekSeviye)}</span>{/if}
        </p>
        {#if sonraki.length}
          <p class="siradaki">Sıradaki yenilik: {sonraki.map((a) => `${a.ikon} ${a.ad}`).join(", ")} · seviye {seviyeYaz(sonraki[0].seviye)}</p>
        {/if}
      </div>

      {#if v.toplamMusteri === 0}
        <div class="baslangic">
          <p>İlk müşterini doyur: PERFECT servislerin, en uzun serin ve kasan burada birikir.</p>
          <a class="btn" href="/">🥞 Oyna</a>
        </div>
      {:else}
        <!-- Performans: iki öne çıkan değer (PERFECT, seri) ve iki ikincil değer; eşit kutular değil, çizgili bir karne -->
        <dl class="basari">
          <div class="vurgu mukemmel"><dt>⭐ PERFECT</dt><dd>{sayiKisalt(v.toplamMukemmel)}</dd></div>
          <div class="vurgu seri"><dt>🔥 En iyi seri</dt><dd>{sayiKisalt(v.enIyiSeri)}</dd></div>
          <div><dt>🧑‍🍳 Müşteri</dt><dd>{sayiKisalt(v.toplamMusteri)}</dd></div>
          <div>
            <dt>🧾 Adisyon</dt>
            <dd><a href="/fislerim" aria-label={`${fisSayisi} adisyon, Fişlerim'e git`}>{sayiKisalt(fisSayisi)} ›</a></dd>
          </div>
        </dl>
        <div class="kasa">
          <span class="kasa-ad">🪙 Kasa</span>
          <strong>{sayiKisalt(v.toplamCoin)}</strong>
        </div>
      {/if}
    </section>
  {/if}

  <h2 class="bilgi-baslik">Hesap</h2>
  {#if kullanici}
    <div class="kart hesap">
      <span class="avatar" aria-hidden="true">{kullanici[0].toLocaleUpperCase("tr")}</span>
      <div class="hesap-yazi">
        <strong>{kullanici}</strong>
        <small>Giriş yapıldı · bu cihazda</small>
      </div>
      <button class="kucuk-dugme" onclick={cikisYap}>Çıkış yap</button>
    </div>
  {:else}
    <form class="kart form" onsubmit={girisYap}>
      <p class="form-not">Adını yaz, karnende "Şef {ad.trim() || "…"}" yazsın.</p>
      <div class="alanlar">
        <label>
          <span>Ad Soyad</span>
          <input bind:value={ad} placeholder="Ayşe Yılmaz" autocomplete="name" />
        </label>
        <label>
          <span>E-posta</span>
          <input type="email" bind:value={eposta} placeholder="ayse@ornek.com" autocomplete="email" />
        </label>
      </div>
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
    <a href="/rehber">🥞 Malzeme rehberi</a>
    <a href="/hakkinda">📖 Hakkında</a>
    <a href="/iletisim">✉️ İletişim</a>
    <a href="/kosullar">📜 Kullanım Koşulları</a>
    <a href="/gizlilik">🔒 Gizlilik Politikası</a>
  </nav>
</div>

<style>
  /* ---- Şef karnesi ---- */
  .sef {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px 16px 16px;
    border: 1px solid var(--kenar);
    border-radius: calc(var(--radius) + 6px);
    background:
      radial-gradient(120% 70% at 100% 0%, color-mix(in srgb, var(--renk-ana) 16%, transparent), transparent 60%),
      var(--kart);
    box-shadow: var(--golge-yuksek);
  }

  .kimlik {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .rozet {
    position: relative;
    flex-shrink: 0;
    display: grid;
    place-items: end center;
    width: 92px;
    height: 92px;
    padding-bottom: 16px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--renk-ana) 75%, var(--ust-yazi)), var(--renk-ana) 70%);
    box-shadow: 0 var(--basma) 0 var(--renk-ana-koyu), inset 0 0 0 5px color-mix(in srgb, var(--ust-yazi) 35%, transparent);
    animation: rozet-gir 0.5s ease-out backwards;
  }

  .kule {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .kule i {
    width: 52px;
    height: 13px;
    margin-top: -4px;
    border-radius: 50%;
    background: var(--krep-orta);
    box-shadow: inset 0 -3px 0 var(--krep-iyi), 0 2px 0 color-mix(in srgb, var(--renk-koyu) 30%, transparent);
  }

  .kule i:nth-child(1) { width: 44px; }
  .kule i:nth-child(2) { width: 50px; }

  /* Aşçı şapkası: krem bant + üç yuvarlak kabarık tepe (--ust-yazi iki temada da krem) */
  .sapka {
    position: absolute;
    top: 7px;
    left: 50%;
    width: 40px;
    height: 30px;
    translate: -50% 0;
    rotate: -8deg;
  }

  .sapka::before {
    content: "";
    position: absolute;
    inset: 0 0 8px;
    background:
      radial-gradient(circle at 25% 62%, var(--ust-yazi) 0 9px, transparent 9.5px),
      radial-gradient(circle at 50% 42%, var(--ust-yazi) 0 11px, transparent 11.5px),
      radial-gradient(circle at 75% 62%, var(--ust-yazi) 0 9px, transparent 9.5px);
  }

  .sapka i {
    position: absolute;
    left: 7px;
    right: 7px;
    bottom: 0;
    height: 10px;
    border-radius: 3px;
    background: var(--ust-yazi);
    box-shadow: inset 0 -3px 0 color-mix(in srgb, var(--renk-koyu) 12%, var(--ust-yazi));
  }

  .kimlik-yazi {
    min-width: 0;
  }

  .ust-baslik {
    margin: 0;
    color: var(--renk-ana);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .sef h1 {
    display: -webkit-box;
    margin: 2px 0 6px;
    overflow: hidden;
    font-size: 22px;
    line-height: 1.15;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  /* Seviye: istatistik değil, ilerleme rozeti */
  .seviye {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 4px 12px 5px;
    border-radius: 999px;
    background: var(--renk-koyu);
    color: var(--ust-yazi);
    box-shadow: 0 3px 0 color-mix(in srgb, var(--renk-koyu) 55%, var(--renk-ana));
  }

  .seviye small {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .seviye strong {
    color: var(--renk-logo);
    font-size: 24px;
    font-weight: 900;
    line-height: 1;
  }

  .yol {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cubuk {
    height: 12px;
    padding: 2px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    background: var(--zemin);
  }

  .cubuk span {
    display: block;
    height: 100%;
    min-width: 6px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--krep-orta), var(--renk-ana));
  }

  .durum,
  .siradaki {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
  }

  .soluk,
  .siradaki {
    color: var(--yazi-soluk);
  }

  .basari {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 0;
    border-top: 2px dashed var(--kenar);
    border-bottom: 2px dashed var(--kenar);
  }

  .basari > div {
    min-width: 0;
    padding: 10px 4px;
  }

  .basari > div:nth-child(odd) {
    padding-right: 12px;
    border-right: 1px solid var(--kenar);
  }

  .basari > div:nth-child(even) {
    padding-left: 12px;
  }

  .basari > div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--kenar);
  }

  .basari dt {
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 800;
  }

  .basari dd {
    margin: 2px 0 0;
    font-size: 20px;
    font-weight: 900;
  }

  .basari .vurgu dd {
    font-size: 30px;
    line-height: 1.1;
  }

  .mukemmel dd { color: var(--basari); }
  .seri dd { color: var(--vurgu); }

  /* Görünüm aynı, dokunma alanı ≥ 44 px (negatif kenar boşluğu düzeni bozmaz) */
  .basari dd a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: -9px -10px;
    padding: 0 10px;
    border-radius: var(--radius-kucuk);
  }

  .basari dd a:hover {
    color: var(--renk-ana);
  }

  /* Kasa: kazanç performanstan ayrı, karamel bir şerit */
  .kasa {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--radius);
    background: linear-gradient(180deg, color-mix(in srgb, var(--renk-ana) 94%, var(--ust-yazi)), var(--renk-ana) 60%);
    box-shadow: 0 var(--basma) 0 var(--renk-ana-koyu);
    color: var(--renk-ana-yazi);
  }

  .kasa-ad {
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .kasa strong {
    font-size: 26px;
    font-weight: 900;
  }

  .baslangic {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 12px;
    border-top: 2px dashed var(--kenar);
  }

  .baslangic p {
    margin: 0;
    color: var(--yazi-soluk);
    font-weight: 600;
  }

  @keyframes rozet-gir {
    from { opacity: 0; transform: scale(0.7) rotate(-12deg); }
    70% { transform: scale(1.05) rotate(2deg); }
  }

  /* ---- Hesap (ikincil) ---- */
  .hesap {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
  }

  .avatar {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
    font-size: 20px;
    font-weight: 900;
  }

  .hesap-yazi {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
  }

  .hesap-yazi strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hesap-yazi small {
    color: var(--yazi-soluk);
  }

  .kucuk-dugme {
    flex-shrink: 0;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    background: var(--zemin);
    box-shadow: 0 3px 0 var(--kenar);
    font-size: 14px;
    font-weight: 800;
    transition: transform 0.08s ease-out, box-shadow 0.08s ease-out;
  }

  .kucuk-dugme:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--kenar);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px 14px;
  }

  .form-not {
    margin: 0;
    color: var(--yazi-soluk);
    font-size: 13px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .alanlar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .alanlar label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    font-size: 12px;
    font-weight: 800;
  }

  .alanlar input {
    width: 100%;
    min-height: 44px;
    padding: 10px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: var(--zemin);
    font-size: 15px;
    font-weight: 400;
  }

  .form .btn {
    padding: 11px 18px;
  }

  /* ---- Ses ve bilgi ---- */
  .ses-ayar { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; }
  .ses-satir { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ses-satir input[type="range"] { flex: 1; max-width: 160px; }
  .ses-ayar small { color: var(--yazi-soluk); }

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

  @media (max-width: 340px) {
    .alanlar { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rozet { animation: none; }
    .kucuk-dugme { transition: none; }
  }
</style>
