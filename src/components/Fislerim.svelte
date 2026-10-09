<script lang="ts">
  // Fişlerim: seviye adisyonları (Rust fis_olustur kodları). Veri tek yükleme işlevinden (fisleriYukle) gelir; ekran dört
  // hâlden birini gösterir: yükleniyor, hata, boş, dolu (ortak ui bileşenleriyle).
  import { onMount } from "svelte";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import { durumMetni } from "$lib/i18n";
  import { destekleniyorMu, fisCoz } from "$lib/native";
  import { kilometreTasi } from "$lib/oyun/seviye";
  import type { Fis, FisBilgisi, ListeDurumu, NativeHata } from "$lib/types";
  import { fisleriYukle } from "$lib/yukleyici";

  // Görülen en yeni fişin kodu: yalnızca "YENİ" damgası için (bu cihazdaki görüntüleme kolaylığı, oyun verisi değil)
  const GORULDU = "pancakeflip-fis-goruldu";
  const dm = durumMetni.tr;
  let durum = $state<ListeDurumu>("yukleniyor");
  let fisler = $state<Fis[]>([]);
  let yeniSayisi = $state(0);
  let deneme = 0;

  async function yukle() {
    durum = "yukleniyor";
    try {
      fisler = await fisleriYukle(deneme++);
    } catch {
      durum = "hata";
      return;
    }
    yeniIsaretle(fisler);
    durum = fisler.length ? "dolu" : "bos";
  }

  function yeniIsaretle(liste: Fis[]) {
    try {
      const son = localStorage.getItem(GORULDU);
      const i = son ? liste.findIndex((f) => f.kod === son) : -1;
      // İlk ziyarette (kayıt yok) hepsini yeni saymak yerine yalnızca en yenisini işaretle
      yeniSayisi = son ? (i === -1 ? liste.length : i) : Math.min(1, liste.length);
      if (liste.length) localStorage.setItem(GORULDU, liste[0].kod);
    } catch {
      yeniSayisi = 0;
    }
  }

  // Adisyon kodu çözme (Rust fis_coz): yalnız destekleyen platformda görünür (docs/platform-destegi.md)
  let cozucuVar = $state(false);
  let kodGirdi = $state("");
  let cozum = $state<FisBilgisi | null>(null);
  let cozumHatasi = $state<NativeHata | null>(null);
  let cozucuEl = $state<HTMLElement>();

  async function kodCoz() {
    const s = await fisCoz(kodGirdi);
    cozum = s.ok ? s.veri : null;
    cozumHatasi = s.ok ? null : s.hata;
  }

  function hataMetni(h: NativeHata): string {
    switch (h.tur) {
      case "BosKod": return "Kod boş. Bir adisyon kodu yaz (ör. KRP-010-3A9F1C2).";
      case "GecersizKod": return `"${h.kod}" bir adisyon kodu değil. Biçim: KRP-SSS-YXXXXXX.`;
      case "GecersizSeviye": return `Koddaki seviye (${h.seviye}) geçersiz.`;
      case "GecersizYildiz": return `Koddaki yıldız (${h.yildiz}) geçersiz.`;
      case "YalnizUygulamada": return "Kod çözme yalnız uygulamada çalışır.";
      case "Bilinmeyen": return `Beklenmeyen hata: ${h.mesaj}`;
    }
  }

  onMount(() => {
    yukle();
    cozucuVar = destekleniyorMu("fisCoz");
    // Paylaşılan bağlantı: /fislerim?kod=KRP-… kodu doldurup hemen çözer
    const k = new URLSearchParams(window.location.search).get("kod");
    if (cozucuVar && k !== null) {
      kodGirdi = k;
      // Bağlantı kod çözümü için açıldı: sonuç görünsün diye bölüme kaydır
      kodCoz().then(() => requestAnimationFrame(() => cozucuEl?.scrollIntoView({ block: "start" })));
    }
  });
  const toplamNet = $derived(fisler.reduce((t, f) => t + Math.max(0, f.net ?? 0), 0));

  function tarihYaz(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  const yildizSayisi = (y: number) => Math.max(0, Math.min(3, Math.round(y ?? 0)));
</script>

<div class="sayfa">
  <header class="baslik">
    <h1>🧾 Fişlerim</h1>
    {#if durum === "dolu"}<span class="hap">{fisler.length} adisyon</span>{/if}
  </header>

  {#if durum === "yukleniyor"}
    <Yukleniyor metin={dm.yukleniyor} satir={3} />
  {:else if durum === "hata"}
    <HataDurumu baslik={dm.hataBaslik} mesaj={dm.hataMesaji} tekrarMetni={dm.tekrar} onTekrar={yukle} />
  {:else if durum === "bos"}
    <BosDurum
      ikon="🧾"
      baslik="Henüz adisyon yok"
      aciklama="Her 10 seviyede ve her kilometre taşında bir adisyon kesilir; hepsi burada birikir."
      dugmeMetni={dm.oyna}
      href="/"
    />
  {:else}
    <section class="kasa" aria-label="Kasa">
      <span class="kasa-cekmece" aria-hidden="true">🪙</span>
      <div>
        <small>Fişlerdeki toplam kazanç</small>
        <strong>+{toplamNet}</strong>
      </div>
    </section>

    {#each fisler as f, i (f.kod + i)}
      {@const y = yildizSayisi(f.yildiz)}
      {@const kt = kilometreTasi(f.bolum)}
      <div class="golge" class:yeni={i < yeniSayisi} style:animation-delay={`${Math.min(i, 8) * 40}ms`}>
      {#if i < yeniSayisi}<span class="damga">YENİ</span>{/if}
      <article class="fis" class:kilometre={kt}>
        <div class="rozet" aria-hidden="true">
          <span class="kat"></span><span class="kat"></span><span class="kat"></span>
          <b>{f.bolum}</b>
        </div>
        <div class="govde">
          <div class="satir">
            <strong>Level {f.bolum}</strong>
            <span class="yildizlar" aria-label={`${y} yıldız`}>
              {#each [1, 2, 3] as n}<span class:sonuk={y < n}>⭐</span>{/each}
            </span>
          </div>
          <div class="satir alt">
            <span class="tarih">{tarihYaz(f.tarih)}</span>
            <span class="net">{(f.net ?? 0) >= 0 ? "+" : ""}{f.net ?? 0} 🪙</span>
          </div>
          {#if kt}<span class="serit">⭐ {kt.baslik}</span>{/if}
          <code class="kod">{f.kod}</code>
        </div>
      </article>
      </div>
    {/each}
  {/if}

  {#if cozucuVar}
    <section class="cozucu" aria-labelledby="cozucu-baslik" bind:this={cozucuEl}>
      <h2 id="cozucu-baslik">🔎 Adisyon kodu çöz</h2>
      <form onsubmit={(e) => { e.preventDefault(); kodCoz(); }}>
        <input bind:value={kodGirdi} placeholder="KRP-010-3A9F1C2" aria-label="Adisyon kodu" autocomplete="off" spellcheck="false" />
        <button type="submit" class="btn">Çöz</button>
      </form>
      {#if cozumHatasi}
        <HataDurumu baslik="Kod çözülemedi" mesaj={hataMetni(cozumHatasi)} />
      {:else if cozum}
        <dl class="cozum">
          <div><dt>Seviye</dt><dd>{cozum.seviye}</dd></div>
          <div><dt>Yıldız</dt><dd>{"⭐".repeat(cozum.yildiz) || "—"}</dd></div>
          <div><dt>Zaman damgası</dt><dd><code>{cozum.damga}</code></dd></div>
        </dl>
      {/if}
    </section>
  {/if}
</div>

<style>
  .baslik {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  h1 {
    margin: 0;
    font-size: 24px;
  }

  /* Gölge sarmalayıcıda: mask aynı elemandaki drop-shadow'u da keseceği için ayrı tutulur */
  .golge {
    position: relative;
    filter: drop-shadow(0 6px 6px color-mix(in srgb, var(--renk-koyu) 16%, transparent));
    animation: gir 0.35s ease-out backwards;
  }

  /* Kasa: fişlerin toplam kazancı, ekranın en önemli sayısı */
  .kasa {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: var(--radius);
    background: linear-gradient(180deg, var(--kart), color-mix(in srgb, var(--kart) 85%, var(--renk-ana)));
    border: 1px solid var(--kenar);
    box-shadow: var(--golge-yuksek);
  }

  .kasa-cekmece {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--renk-ana) 94%, var(--ust-yazi)), var(--renk-ana) 60%);
    box-shadow: 0 var(--basma) 0 var(--renk-ana-koyu);
    font-size: 26px;
  }

  .kasa small {
    display: block;
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 800;
  }

  .kasa strong {
    font-size: 28px;
    font-weight: 900;
    color: var(--basari);
  }

  /* Görülmemiş fiş: köşede çilek rengi damga, bir kez "basılır" */
  .damga {
    position: absolute;
    top: -8px;
    right: 10px;
    z-index: 2;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--vurgu);
    color: var(--renk-ana-yazi);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 1px;
    transform: rotate(6deg);
    animation: damga 0.45s 0.25s ease-out backwards;
  }

  :root[data-tema="gece"] .damga { color: var(--zemin); }

  /* Kilometre taşı fişi: altın şerit ve kenar vurgusu */
  .fis.kilometre {
    background: linear-gradient(180deg, color-mix(in srgb, var(--krep-az) 22%, var(--kart)), var(--kart) 60%);
  }

  :root[data-tema="gece"] .fis.kilometre {
    background: linear-gradient(180deg, color-mix(in srgb, var(--renk-ana) 12%, var(--kart)), var(--kart) 60%);
  }

  .serit {
    align-self: flex-start;
    padding: 2px 8px;
    border-radius: var(--radius-kucuk);
    background: color-mix(in srgb, var(--krep-az) 45%, var(--kart));
    color: var(--yazi);
    font-size: 12px;
    font-weight: 900;
  }

  .golge:nth-child(odd) { transform: rotate(-0.6deg); }
  .golge:nth-child(even) { transform: rotate(0.5deg); }

  /* Adisyon kâğıdı: alt kenarı yırtık */
  .fis {
    --dis: 10px;
    position: relative;
    display: flex;
    gap: 12px;
    padding: 14px 14px calc(14px + var(--dis));
    background: var(--kart);
    border-radius: var(--radius) var(--radius) 0 0;
    -webkit-mask:
      conic-gradient(from -45deg at bottom, transparent 0 90deg, var(--kart) 0) bottom / calc(var(--dis) * 2) var(--dis) repeat-x,
      linear-gradient(var(--kart) 0 0) top / 100% calc(100% - var(--dis)) no-repeat;
    mask:
      conic-gradient(from -45deg at bottom, transparent 0 90deg, var(--kart) 0) bottom / calc(var(--dis) * 2) var(--dis) repeat-x,
      linear-gradient(var(--kart) 0 0) top / 100% calc(100% - var(--dis)) no-repeat;
  }

  /* Bölüm rozeti: üç katlı mini krep kulesi, üstünde bölüm numarası */
  .rozet {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    width: 58px;
    height: 58px;
    padding-bottom: 4px;
    border-radius: 16px;
    background: linear-gradient(180deg, var(--sahne-duvar), var(--sahne-duvar-koyu));
  }

  .kat {
    width: 42px;
    height: 9px;
    margin-top: -1px;
    border-radius: 6px;
    background: var(--krep-orta);
    box-shadow: inset 0 -3px 0 color-mix(in srgb, var(--krep-iyi) 70%, transparent);
  }

  .kat:nth-child(2) { width: 46px; }
  .kat:nth-child(3) { width: 50px; }

  .rozet b {
    position: absolute;
    top: 4px;
    min-width: 26px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
    font-size: 15px;
    line-height: 22px;
    text-align: center;
  }

  .govde {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
  }

  .satir {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .satir strong {
    font-size: 17px;
  }

  .yildizlar {
    font-size: 15px;
    letter-spacing: -2px;
  }

  .sonuk {
    filter: grayscale(1);
    opacity: 0.3;
  }

  .alt {
    font-size: 13px;
  }

  .tarih {
    color: var(--yazi-soluk);
  }

  .net {
    font-weight: 800;
    color: var(--basari);
  }

  /* Kod: kesik çizgiyle ayrılmış "kaşe" */
  .kod {
    align-self: flex-start;
    margin-top: 4px;
    padding: 3px 8px;
    border: 2px dashed var(--renk-ana);
    border-radius: 8px;
    color: var(--renk-ana);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 1px;
    overflow-wrap: anywhere;
  }

  .cozucu {
    display: grid;
    gap: var(--bosluk-3);
    margin-top: var(--bosluk-4);
    padding: var(--bosluk-4);
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: var(--kart);
  }

  .cozucu h2 {
    margin: 0;
    font-size: 18px;
  }

  .cozucu form {
    display: flex;
    gap: var(--bosluk-2);
  }

  .cozucu input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: var(--bosluk-2) var(--bosluk-3);
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: var(--zemin);
    color: var(--yazi);
    font: inherit;
    font-family: ui-monospace, monospace;
  }

  .cozucu .btn {
    width: auto;
  }

  .cozum {
    display: grid;
    gap: var(--bosluk-2);
    margin: 0;
  }

  .cozum div {
    display: flex;
    justify-content: space-between;
    padding-top: var(--bosluk-2);
    border-top: 1px solid var(--kenar);
  }

  .cozum dd {
    margin: 0;
    font-weight: 800;
  }

  @keyframes gir {
    from { opacity: 0; translate: 0 10px; }
  }

  @keyframes damga {
    from { opacity: 0; transform: rotate(6deg) scale(2.2); }
    70% { opacity: 1; transform: rotate(6deg) scale(0.9); }
  }

  @media (min-width: 768px) {
    .sayfa { max-width: 560px; margin: 0 auto; }
  }

  @media (prefers-reduced-motion: reduce) {
    .golge, .damga { animation: none; }
  }
</style>
