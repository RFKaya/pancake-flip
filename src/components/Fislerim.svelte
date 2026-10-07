<script lang="ts">
  // Fişlerim: geçmiş servislerin adisyonları (Rust fis_olustur kodları). Veri yalnızca kayit.fisler()'den okunur.
  import { onMount } from "svelte";
  import { kayit } from "$lib/kayit.svelte";

  let hazir = $state(false);
  onMount(() => {
    kayit.yukle();
    hazir = true;
  });

  const fisler = $derived(kayit.fisler());
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
    {#if hazir && fisler.length}
      <div class="ozet">
        <span class="hap">{fisler.length} adisyon</span>
        <span class="hap">🪙 {toplamNet}</span>
      </div>
    {/if}
  </header>

  {#if hazir}
    {#each fisler as f, i (f.kod + i)}
      {@const y = yildizSayisi(f.yildiz)}
      <div class="golge" style:animation-delay={`${Math.min(i, 8) * 40}ms`}>
      <article class="fis">
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
          <code class="kod">{f.kod}</code>
        </div>
      </article>
      </div>
    {:else}
      <div class="bos-durum">
        <div class="tabak" aria-hidden="true"><div class="plaka"></div></div>
        <h2>Henüz adisyon yok</h2>
        <p>Bir servisi bitirince adisyonun burada birikir.</p>
        <a class="btn" href="/">🥞 Servise başla</a>
      </div>
    {/each}
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

  .ozet {
    display: flex;
    gap: 6px;
  }

  .hap {
    padding: 4px 10px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    background: var(--kart);
    box-shadow: 0 3px 0 var(--kenar);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  /* Gölge sarmalayıcıda: mask aynı elemandaki drop-shadow'u da keseceği için ayrı tutulur */
  .golge {
    filter: drop-shadow(0 3px 0 var(--kenar));
    animation: gir 0.35s ease-out backwards;
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

  .bos-durum {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 36px 16px 8px;
    text-align: center;
  }

  .bos-durum h2 {
    margin: 8px 0 0;
    font-size: 20px;
  }

  .bos-durum p {
    margin: 0 0 8px;
    color: var(--yazi-soluk);
  }

  .bos-durum .btn {
    max-width: 260px;
    box-shadow: 0 4px 0 var(--renk-koyu);
  }

  /* Boş tabak: oyun sahnesindeki turkuaz tabak, hafif sallanır */
  .tabak {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 180px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 50% 60%, var(--sahne-duvar) 0 45%, transparent 70%);
  }

  .plaka {
    width: 150px;
    height: 30px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 50% 35%, var(--sahne-tabak) 55%, color-mix(in srgb, var(--sahne-tabak) 70%, white) 56%);
    box-shadow: 0 7px 0 var(--sahne-tabak-koyu);
    animation: salla 2.4s ease-in-out infinite;
  }

  @keyframes gir {
    from { opacity: 0; translate: 0 10px; }
  }

  @keyframes salla {
    50% { transform: rotate(-3deg) translateY(-3px); }
  }

  @media (min-width: 768px) {
    .sayfa { max-width: 560px; margin: 0 auto; }
  }

  @media (prefers-reduced-motion: reduce) {
    .golge, .plaka { animation: none; }
  }
</style>
