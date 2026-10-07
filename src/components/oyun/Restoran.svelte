<script lang="ts">
  // Restoran sahnesi: lobi ve oyun AYNI sahnenin iki durumudur (sayfa/kamera geçişi yok). Duvar, tezgâh, tava ve tabak tek kez
  // çizilir; OYNA yalnızca `oyunda` durumunu açar: lobi arayüzü kapanır, oyun arayüzü (fişler, malzeme çubuğu) kısa sürede belirir.
  // Sonsuz oyun: duvarda müşteri fişleri, ortada tava(lar), yakında tabak. Bölüm yok; her başarılı müşteri
  // seviyeyi ilerletir (kurallar: oturum.ts / seviye.ts). Tavalar Tava.svelte'dedir:
  // basılı tut = hamur dök, yukarı kaydır = çevir, aşağı kaydır = tabağa al.
  // Temel kural: tabak bir siparişin BİREBİR aynısı olunca kendiliğinden servis edilir; yanlış tabak asla kabul edilmez.
  import { onDestroy, onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { fisKaydet } from "$lib/fisler.svelte";
  import { gelistiriciModuAcik, ilerleme } from "$lib/ilerleme.svelte";
  import { ruhHali } from "$lib/oyun/musteri";
  import { musteriyeVer, oturumIlerlet, oturumSeviyeAyarla, sabirOrani, tabakDurumu, yeniOturum, type OturumOlayi, type SeviyeAtlama } from "$lib/oyun/oturum";
  import type { Hata } from "$lib/oyun/degerlendirme";
  import { rngOlustur } from "$lib/oyun/rng";
  import { sayiKisalt, type Acilis } from "$lib/oyun/seviye";
  import { cal } from "$lib/oyun/ses";
  import { AYAR, malzeme, tip as tipBul } from "$lib/oyun/veri";
  import GelistiriciPaneli from "./GelistiriciPaneli.svelte";
  import Tava from "./Tava.svelte";
  import type { Musteri, Sonuc, TabakParcasi } from "../../types/oyun";

  let { baslangic = "lobi" }: { baslangic?: "lobi" | "oyun" } = $props();

  // Oyun ekranı yalnızca istemcide yüklenir (client:only), bu yüzden kayıt doğrudan okunabilir
  ilerleme.yukle();
  const rng = rngOlustur(Math.floor(Math.random() * 1e9));
  const gelistirici = gelistiriciModuAcik();

  /** false = lobi (sahne canlı, oyun donuk, tava kilitli), true = servis başladı */
  let oyunda = $state(baslangic === "oyun");
  let oturum = $state(yeniOturum({ ...ilerleme.veri }));
  let tabak = $state<TabakParcasi[]>([]);
  let sonuc = $state<{ s: Sonuc; neden: string; kazanc: number } | null>(null);
  let testModu = $state(false);
  let paneAcik = $state(false);
  let tekrar = $state(0);
  let barDolu = $state(false);
  let bildirim = $state<{ id: number; seviye: number; baslik: string; alt: string; acilanlar: Acilis[] } | null>(null);
  let gittiNo = $state(0);
  let dusenler = $state<{ id: number; ikon: string }[]>([]);
  let coinler = $state<{ id: number; dx: number }[]>([]);
  let sayac = 0;
  let sonucNo = 0;
  let bildirimNo = 0;

  let sahneEl: HTMLElement;
  let tabakEl: HTMLElement;
  let kuleEl: HTMLElement;
  let coinEl: HTMLElement;
  let seviyeEl: HTMLElement;

  const sv = $derived(oturum.sv);
  const menu = $derived(sv.menu.map(malzeme));
  const tavaSayisi = $derived(sv.tava);
  const olcek = $derived(tavaSayisi > 1 ? 0.62 : 1);
  const doluOran = $derived(barDolu ? 1 : Math.min(1, oturum.ilerleme / sv.gerekenMusteri));
  const ilerlemeYazi = $derived(`${Math.floor(oturum.ilerleme)} / ${sayiKisalt(sv.gerekenMusteri)}`);

  /** Tabaktaki parçaların, siparişin başından kaçı yerli yerinde (fişte ✓ olarak gösterilir) */
  const onek = (parcalar: string[]) => {
    let i = 0;
    while (i < tabak.length && tabak[i].malzeme === parcalar[i]) i++;
    return i;
  };

  /** Tabak şu an hangi müşteriye gidiyor gibi: sipariş önekiyle en çok eşleşen, eşitlikte sabrı en az kalan */
  const hedefIndeks = $derived.by(() => {
    let en = -1;
    let enSayi = -1;
    oturum.musteriler.forEach((m, i) => {
      const n = onek(m.siparis.parcalar);
      if (n > enSayi || (n === enSayi && sabirOrani(m) < sabirOrani(oturum.musteriler[en]))) {
        en = i;
        enSayi = n;
      }
    });
    return en;
  });
  const hedef = $derived(hedefIndeks >= 0 ? oturum.musteriler[hedefIndeks] : null);
  const siradaki = $derived.by(() => {
    if (!hedef) return null;
    const n = onek(hedef.siparis.parcalar);
    return n === tabak.length ? (hedef.siparis.parcalar[tabak.length] ?? null) : null;
  });

  /** Tabak hiçbir siparişe dönüşemiyorsa (yanlış tarif) kırmızı gösterilir ve Boşalt parlar */
  const tabakYanlis = $derived(tabakDurumu(oturum, tabak).durum === "yanlis");
  /** Tavadaki dökme hedefi: tabağın gittiği siparişin istediği kalınlık */
  const hedefKalinlik = $derived(hedef?.siparis.tercih ?? "normal");

  // Alt menü lobide sahnenin altında durur, oyun başlayınca aynı yerdeki malzeme çubuğuna yer açar (AppNav.svelte kaydırır)
  $effect(() => {
    document.body.toggleAttribute("data-oyunda", oyunda);
  });
  onDestroy(() => document.body?.removeAttribute("data-oyunda"));

  function oyna() {
    oyunda = true;
    cal("pop");
  }

  // ---- Oyun döngüsü: tek rAF, dt ile ----
  onMount(() => {
    let id = 0;
    let son = performance.now();
    const kare = (n: number) => {
      const dt = Math.min(0.1, (n - son) / 1000);
      son = n;
      if (!paneAcik && oyunda) olaylar(oturumIlerlet(oturum, dt, rng));
      id = requestAnimationFrame(kare);
    };
    id = requestAnimationFrame(kare);
    return () => cancelAnimationFrame(id);
  });

  function olaylar(liste: OturumOlayi[]) {
    for (const o of liste) {
      if (o.tur === "geldi") {
        cal("pop");
        kontrolEt(false);
      } else if (o.tur === "gitti") {
        gittiNo++;
        cal("puf");
        const no = gittiNo;
        setTimeout(() => {
          if (gittiNo === no) gittiNo = 0;
        }, 1400);
      }
    }
  }

  // ---- Efektler ----
  const anim = (el: Element | undefined, kf: Keyframe[], ms: number) => el?.animate(kf, { duration: ms, easing: "ease-out" });

  /** Hafif ekran titreşimi (yalnızca transform) */
  function salla(siddet: number) {
    const g = 5 * siddet;
    anim(sahneEl, [
      { transform: "translate(0,0)" }, { transform: `translate(${-g}px, ${g * 0.6}px)` },
      { transform: `translate(${g * 0.8}px, ${-g * 0.4}px)` }, { transform: `translate(${-g * 0.4}px, 0)` }, { transform: "translate(0,0)" },
    ], 260);
  }

  function tabakZipla(g = 1) {
    anim(tabakEl, [
      { transform: "none" }, { transform: `translateY(${6 * g}px) scale(${1 + 0.05 * g}, ${1 - 0.08 * g})` },
      { transform: `translateY(${-4 * g}px) scale(${1 - 0.02 * g}, ${1 + 0.04 * g})` }, { transform: "none" },
    ], 320);
  }

  /** Tava krebi tabağa kaydırdı */
  function tabagaGeldi(p: TabakParcasi) {
    if (tabak.length >= AYAR.tabakMax) return;
    tabak.push(p);
    tabakZipla(1.2);
    salla(0.5);
    kontrolEt(true);
  }

  /** Krep tabağın neresine düşecek: kulenin üst yüzü */
  function tabakHedef() {
    if (!kuleEl) return null;
    const r = kuleEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top - 8 };
  }

  function koy(id: string) {
    if (tabak.length >= AYAR.tabakMax) return;
    tabak.push({ malzeme: id });
    dusenler.push({ id: ++sayac, ikon: malzeme(id).ikon });
    if (dusenler.length > 4) dusenler.shift();
    tabakZipla(0.8);
    cal("malzeme");
    kontrolEt(true);
  }

  function bosalt() {
    if (!tabak.length) return;
    tabak = [];
    tabakZipla(0.6);
    cal("cop");
  }

  const YAZI: Record<Sonuc, string> = { perfect: "MÜKEMMEL!", great: "HARİKA", good: "İYİ", olmadi: "BU DEĞİL! 😅" };

  function nedenYazisi(ilk: Hata | undefined): string {
    if (!ilk) return "";
    switch (ilk.tur) {
      case "eksik": return `Eksik: ${malzeme(ilk.malzeme).ad}`;
      case "fazla": return `Fazla: ${malzeme(ilk.malzeme).ad}`;
      case "yanlis": return `${malzeme(ilk.malzeme).ad} yanlıştı`;
      case "sira": return "Sıra hatası";
      case "cig": return `${ilk.sira}. krep çiğ`;
      case "fazlaPismis": return `${ilk.sira}. krep fazla pişti`;
      case "kalinlik": return `${ilk.sira}. krep ${ilk.istenen === "ince" ? "ince" : "kalın"} olmalıydı`;
    }
  }

  function sonucGoster(s: Sonuc, neden: string, kazanc: number) {
    const no = ++sonucNo;
    sonuc = { s, neden, kazanc };
    setTimeout(() => {
      if (sonucNo === no) sonuc = null;
    }, 1500);
  }

  /**
   * Tabak her değiştiğinde (krep indi, malzeme kondu) ya da müşteri gelince çağrılır.
   * Birebir doğru tabak → hemen servis. Yanlış tabak → kısa "Bu değil!" uyarısı (yalnızca oyuncu tabağı değiştirdiyse).
   * Servis tabağı boşalttığı için aynı tabak iki kez ödül veremez.
   */
  function kontrolEt(oyuncuDegistirdi: boolean) {
    const d = tabakDurumu(oturum, tabak);
    if (d.durum === "dogru") teslim();
    else if (d.durum === "yanlis" && oyuncuDegistirdi) {
      sonucGoster("olmadi", nedenYazisi(d.degerlendirme.hatalar[0]), 0);
      cal("olmadi");
      anim(tabakEl, [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(0)" }], 320);
    }
  }

  function teslim() {
    const r = musteriyeVer(oturum, tabak);
    if (!r) return;
    sonucGoster(r.sonuc, "", r.kazanc);

    // Madeni para patlaması + sayaç zıplaması
    if (r.sonuc !== "olmadi") {
      const n = r.sonuc === "perfect" ? 6 : 3;
      for (let i = 0; i < n; i++) coinler.push({ id: ++sayac, dx: (i - (n - 1) / 2) * 22 });
      setTimeout(() => anim(coinEl, [{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(1)" }], 300), 350);
      cal("coin");
    }
    if (r.sonuc === "perfect") salla(1);
    tabak = [];
    cal(r.sonuc);
    if (r.seviyeAtladi.length) seviyeAtlandi(r.seviyeAtladi);
    if (!testModu) ilerleme.oturumKaydet(oturum);
  }

  /** LEVEL UP: kısa, oyunu bölmeyen geri bildirim (çubuk dolar, seviye zıplar, başlık belirir) */
  function seviyeAtlandi(liste: SeviyeAtlama[]) {
    const son = liste[liste.length - 1];
    const kil = [...liste].reverse().find((x) => x.kilometre)?.kilometre ?? null;
    const no = ++bildirimNo;
    bildirim = { id: no, seviye: son.seviye, baslik: kil?.baslik ?? "", alt: kil?.alt ?? "", acilanlar: liste.flatMap((x) => x.acilanlar) };
    barDolu = true;
    setTimeout(() => (barDolu = false), 520);
    anim(seviyeEl, [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], 480);
    cal("parilti");
    salla(kil ? 1.2 : 0.7);
    // Fişlerim: her kilometre taşında ve her 10. seviyede adisyon (Rust fis_olustur; "bolum" alanı artık seviyedir)
    if (!testModu) for (const x of liste) if (x.kilometre || x.seviye % 10 === 0) fisKaydet(x.seviye, 3, oturum.toplamCoin).catch(() => {});
    setTimeout(() => {
      if (bildirim?.id === no) bildirim = null;
    }, kil ? 2800 : 1800);
  }

  // ---- Geliştirici modu (yalnızca test amaçlı; docs/sonsuz-seviye.md §Geliştirici modu) ----
  function testSeviyesi(seviye: number) {
    testModu = true;
    oturumSeviyeAyarla(oturum, seviye);
    tabak = [];
    sonuc = null;
    bildirim = null;
    tekrar++;
  }

  function testSifirla() {
    testSeviyesi(1);
    oturum.toplamMusteri = 0;
    oturum.toplamCoin = 0;
  }

  function kayitUygula() {
    ilerleme.seviyeUygula(oturum.seviye, oturum.ilerleme);
    testModu = false;
  }

  function testtenCik() {
    ilerleme.yukle();
    oturum = yeniOturum({ ...ilerleme.veri });
    testModu = false;
    tabak = [];
    tekrar++;
  }

  function kaydiSil() {
    ilerleme.sifirla();
    testtenCik();
  }

  // ---- Görünüm yardımcıları ----
  const krepSayisi = (m: Musteri) => m.siparis.parcalar.filter((id) => id === "krep").length;
  const ekler = (m: Musteri) => m.siparis.parcalar.filter((id) => id !== "krep").map((id) => malzeme(id).ad);
  const ruh = (m: Musteri) => (sabirOrani(m) > 0.5 ? "iyi" : sabirOrani(m) > 0.25 ? "orta" : "kotu");
</script>

<div class="sahne" bind:this={sahneEl}>
  <header class="ust">
    <button class="geri" class:gizli={!oyunda} onclick={() => (oyunda = false)} aria-label="Lobiye dön" tabindex={oyunda ? 0 : -1}>←</button>
    <span class="seviye" bind:this={seviyeEl} title={`Seviye ${oturum.seviye}`}>LEVEL {sayiKisalt(oturum.seviye)}</span>
    {#if testModu}<span class="test-rozet">TEST</span>{/if}
    {#if oturum.seri >= 2}<span class="seri" title="Üst üste başarılı müşteri">🔥 {oturum.seri}</span>{/if}
    <span class="bosluk"></span>
    <span class="para" bind:this={coinEl}>🪙 {sayiKisalt(oturum.toplamCoin)}</span>
    <span class="lobi-ust" class:gizli={oyunda}>
      <a class="yuvarlak" href="/hakkinda" aria-label="Nasıl oynanır" tabindex={oyunda ? -1 : 0}>?</a>
      <a class="yuvarlak" href="/profil" aria-label="Ayarlar ve profil" tabindex={oyunda ? -1 : 0}>⚙</a>
    </span>
    {#if gelistirici}
      <button class="dev" onclick={() => (paneAcik = !paneAcik)} aria-label="Geliştirici paneli">🛠</button>
    {/if}
  </header>

  <div class="ilerleme" aria-label={`Sonraki seviyeye ${ilerlemeYazi} müşteri`}>
    <div class="cubuk"><div class="dolu" class:dolu-tam={barDolu} style:transform={`scaleX(${doluOran})`}></div></div>
    <span class="ilerleme-yazi">{ilerlemeYazi} müşteri</span>
  </div>

  <!-- Duvar: müşteri fişleri, raf, kavanozlar -->
  <div class="duvar">
    <div class="tabela" class:gizli={oyunda} aria-hidden="true">
      <span class="ip sol"></span><span class="ip sag"></span>
      <b>pancake<em>flip</em></b>
    </div>
    <div class="fisler" class:gizli={!oyunda}>
      {#each oturum.musteriler as m, i (m.id)}
        {@const t = tipBul(m.tip)}
        {@const oran = sabirOrani(m)}
        {@const dogru = onek(m.siparis.parcalar)}
        {@const ek = ekler(m)}
        <aside
          class="fis {ruh(m)}"
          class:hedef={i === hedefIndeks && oturum.musteriler.length > 1}
          class:ozel={m.tip !== "normal"}
          style:--kh={m.siparis.parcalar.length > 7 ? "6px" : "9px"}
          aria-label="Sipariş"
          in:fly={{ y: -24, duration: 260 }}
          out:fade={{ duration: 160 }}
        >
          <i class="igne"></i>
          <div class="kimlik"><span class="tip">{t.ikon}</span><span class="ruh">{ruhHali(oran, AYAR).yuz}</span></div>
          <div class="sabir"><i style:transform={`scaleX(${oran})`}></i></div>
          {#if m.tip !== "normal"}<small class="tip-ad">{t.ad}</small>{/if}
          <b class="fis-ust">{krepSayisi(m) === 1 && !ek.length ? "1 sade krep" : `${krepSayisi(m)} krep`}</b>
          {#if ek.length}<small class="fis-ek">+ {ek.join(", ")}</small>{/if}
          {#if m.siparis.tercih}<small class="tercih">📏 {m.siparis.tercih === "ince" ? "ince" : "kalın"} krep</small>{/if}
          <div class="mini">
            {#each m.siparis.parcalar as id, j}
              <div class="satir" class:bitti={j < dogru} class:siradaki={i === hedefIndeks && j === dogru && siradaki === id}>
                {#if id === "krep"}<span class="m-krep {m.siparis.tercih ?? ''}"></span>{:else}<span class="m-ek">{malzeme(id).ikon}</span>{/if}
                {#if j < dogru}<em>✓</em>{/if}
              </div>
            {/each}
          </div>
        </aside>
      {/each}
    </div>
    <div class="raf">
      <span class="kavanoz k1"><i></i></span>
      <span class="kavanoz k2"><i></i></span>
      <span class="kavanoz k3"><i></i></span>
    </div>
    {#if oturum.yogunKalan > 0}
      <div class="yogun">🔥 YOĞUN SAAT {Math.ceil(oturum.yogunKalan)}</div>
    {/if}
  </div>

  <!-- Tezgâh: tava(lar) + tabak -->
  <main class="tezgah" class:cift-sira={menu.length > 4}>
    {#key tekrar}
      <div class="tavalar" class:cift={tavaSayisi > 1}>
        {#each Array(tavaSayisi) as _, i (i)}
          <Tava kilit={!oyunda} seviye={oturum.seviye} ipucuAcik={sv.ipucu && oyunda} {hedefKalinlik} {olcek} duraklat={paneAcik || !oyunda} sag={tavaSayisi > 1 && i === 1} {tabakHedef} onTabaga={tabagaGeldi} onSalla={salla} />
        {/each}
      </div>
    {/key}

    <div class="tabak" class:yanlis={tabakYanlis} bind:this={tabakEl}>
      <div class="kule" bind:this={kuleEl}>
        {#each tabak as p, i (i)}
          {#if p.malzeme === "krep"}<div class="t-krep {p.pisme} {p.kalinlik ?? 'normal'}"></div>
          {:else}<div class="t-ek">{malzeme(p.malzeme).ikon}</div>{/if}
        {/each}
      </div>
      {#each dusenler as d (d.id)}
        <span class="dusen" onanimationend={() => (dusenler = dusenler.filter((x) => x.id !== d.id))}>{d.ikon}</span>
      {/each}
      {#each coinler as c (c.id)}
        <span class="coin" style:--dx={`${c.dx}px`} onanimationend={() => (coinler = coinler.filter((x) => x.id !== c.id))}>🪙</span>
      {/each}
      <div class="plaka"></div>
    </div>
  </main>

  {#if sonuc}
    <div class="mesaj {sonuc.s}">
      <div class="ana">{YAZI[sonuc.s]}</div>
      {#if sonuc.neden}<div class="alt">{sonuc.neden}</div>{/if}
      {#if sonuc.s !== "olmadi"}<div class="alt kazanc">+1 👤 · +{sonuc.kazanc} 🪙</div>{:else}<div class="alt">Boşalt ve yeniden dene</div>{/if}
    </div>
  {/if}

  {#if gittiNo}
    <div class="gitti">😞 Müşteri gitti</div>
  {/if}

  {#if bildirim}
    {#key bildirim.id}
      <div class="lvl" class:kilometre={bildirim.baslik}>
        <div class="lvl-ana">✨ LEVEL {sayiKisalt(bildirim.seviye)} ✨</div>
        {#if bildirim.baslik}<div class="lvl-baslik">{bildirim.baslik}</div><div class="lvl-alt">{bildirim.alt}</div>{/if}
        {#if bildirim.acilanlar.length}
          <div class="acilan">{#each bildirim.acilanlar as a}<span>{a.ikon} {a.ad}</span>{/each}</div>
        {/if}
      </div>
    {/key}
  {/if}

  <button class="oyna" class:gizli={oyunda} onclick={oyna} tabindex={oyunda ? -1 : 0}>
    <span class="ok">▶</span> OYNA
  </button>

  <footer class="alt-bar" class:cift-sira={menu.length > 4} class:gizli={!oyunda} inert={!oyunda}>
    <div class="malzemeler">
      {#each menu as m (m.id)}
        <button class="dugme" class:parlak={siradaki === m.id} onpointerdown={() => koy(m.id)}>
          <span>{m.ikon}</span><small>{m.ad}</small>
        </button>
      {/each}
    </div>
    <div class="eylemler">
      <button class="dugme kucuk" class:parlak={tabakYanlis} class:uyari={tabakYanlis} onpointerdown={bosalt} aria-label="Tabağı boşalt"><span>🗑</span><small>Boşalt</small></button>
    </div>
  </footer>

  {#if gelistirici && paneAcik}
    <GelistiriciPaneli
      {oturum}
      {testModu}
      kapat={() => (paneAcik = false)}
      seviyeAyarla={testSeviyesi}
      sifirla={testSifirla}
      {kayitUygula}
      {testtenCik}
      {kaydiSil}
    />
  {/if}
</div>

<style>
  .sahne {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 480px;
    height: 100dvh;
    margin: 0 auto;
    padding: calc(8px + env(safe-area-inset-top)) 12px calc(8px + env(safe-area-inset-bottom));
    overflow: hidden;
    color: var(--yazi);
    background: linear-gradient(180deg, var(--sahne-duvar) 0%, var(--sahne-duvar-koyu) 100%);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Lobi ↔ oyun: yalnızca opacity/transform, kısa; sahne (kamera, tava, tabak) yerinde kalır */
  .gizli { opacity: 0; pointer-events: none; }
  .fisler, .tabela, .lobi-ust, .geri, .oyna, .alt-bar { transition: opacity 0.3s ease, transform 0.3s ease; }
  .fisler.gizli { transform: translateY(-12px); }
  .alt-bar.gizli { transform: translateY(24px); }
  .lobi-ust { display: flex; gap: 6px; }
  .lobi-ust.gizli { position: absolute; right: 0; }
  .geri.gizli { position: absolute; left: 0; }
  .yuvarlak { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--kart); border: 1px solid var(--kenar); box-shadow: 0 3px 0 var(--kenar); color: var(--yazi); font-size: 17px; font-weight: 900; text-decoration: none; }
  .yuvarlak:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--kenar); }

  .tabela { position: absolute; left: 50%; top: 14px; z-index: 3; padding: 8px 18px 10px; border-radius: 14px; background: linear-gradient(180deg, var(--krep-iyi), color-mix(in srgb, var(--krep-iyi) 70%, black)); box-shadow: 0 5px 0 rgb(0 0 0 / 0.18), inset 0 2px 0 rgb(255 255 255 / 0.18); transform-origin: 50% -26px; translate: -50% 0; animation: salin 4.5s ease-in-out infinite; }
  .tabela b { display: block; color: var(--ust-yazi); font-size: 24px; font-weight: 900; letter-spacing: -0.5px; white-space: nowrap; }
  .tabela em { font-style: normal; color: var(--renk-logo); }
  .ip { position: absolute; top: -26px; width: 2px; height: 28px; background: var(--sahne-tezgah-koyu); }
  .ip.sol { left: 22px; transform: rotate(14deg); }
  .ip.sag { right: 22px; transform: rotate(-14deg); }

  /* OYNA: alt menünün hemen üstünde; basınca kaybolur, yerini (alt menüyle birlikte) malzeme çubuğu alır */
  .oyna { position: absolute; left: 50%; bottom: calc(62px + 14px + env(safe-area-inset-bottom)); z-index: 12; display: flex; align-items: center; justify-content: center; gap: 10px; width: min(calc(100% - 48px), 300px); padding: 14px 24px; border: 0; border-radius: 999px; background: linear-gradient(180deg, color-mix(in srgb, var(--renk-ana) 80%, white) 0%, var(--renk-ana) 55%); color: var(--renk-ana-yazi); box-shadow: 0 7px 0 color-mix(in srgb, var(--renk-ana) 55%, black), 0 12px 20px rgb(0 0 0 / 0.18), inset 0 2px 0 rgb(255 255 255 / 0.35); font-size: 28px; font-weight: 900; letter-spacing: 2px; translate: -50% 0; -webkit-tap-highlight-color: transparent; animation: cagir 2.4s ease-in-out infinite; }
  .oyna.gizli { animation: none; transform: translateY(12px); }
  .oyna .ok { font-size: 22px; }
  .oyna:active { animation: none; transform: translateY(6px) scale(0.96); box-shadow: 0 1px 0 color-mix(in srgb, var(--renk-ana) 55%, black), 0 4px 10px rgb(0 0 0 / 0.15); }
  .oyna:focus-visible { outline: 3px solid var(--renk-logo); outline-offset: 4px; }
  @keyframes cagir { 0%, 70%, 100% { transform: translateY(0) scale(1); } 80% { transform: translateY(-5px) scale(1.03); } 90% { transform: translateY(0) scale(0.99); } }
  @keyframes salin { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
  @media (prefers-reduced-motion: reduce) { .oyna, .tabela { animation: none; } }

  .ust { position: relative; z-index: 10; display: flex; flex: none; height: 40px; align-items: center; gap: 8px; width: 100%; }
  .bosluk { flex: 1; }
  .geri { border: 1px solid var(--kenar); display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--kart); border: 1px solid var(--kenar); font-size: 18px; }
  .seviye { max-width: 150px; padding: 5px 12px; overflow: hidden; border-radius: 999px; background: var(--renk-ana); color: var(--renk-ana-yazi); font-size: 16px; font-weight: 900; letter-spacing: 0.5px; white-space: nowrap; text-overflow: ellipsis; }
  .seri { padding: 4px 8px; border-radius: 999px; background: var(--kart); border: 1px solid var(--kenar); font-size: 13px; font-weight: 800; }
  .test-rozet { padding: 3px 8px; border-radius: 6px; background: var(--vurgu); color: var(--renk-ana-yazi); font-size: 11px; font-weight: 900; }
  .para { padding: 4px 10px; border-radius: 999px; background: var(--kart); border: 1px solid var(--kenar); font-size: 14px; font-weight: 800; white-space: nowrap; }
  .dev { width: 36px; height: 36px; border-radius: 50%; border: 1px dashed var(--vurgu); background: var(--kart); font-size: 16px; }

  .ilerleme { position: relative; z-index: 10; display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 6px; }
  .cubuk { position: relative; flex: 1; height: 14px; overflow: hidden; border-radius: 8px; background: var(--kart); border: 2px solid var(--kenar); }
  .dolu { width: 100%; height: 100%; border-radius: 6px; background: var(--basari); transform-origin: left center; transition: transform 0.4s ease-out; }
  .dolu-tam { background: var(--renk-logo); }
  .ilerleme-yazi { padding: 2px 8px; border-radius: 999px; background: var(--kart); border: 1px solid var(--kenar); font-size: 12px; font-weight: 800; text-align: center; white-space: nowrap; }

  /* Duvar */
  .duvar { position: relative; flex: none; width: calc(100% + 24px); height: 178px; margin: 6px -12px 0; }
  .fisler { position: absolute; left: 8px; top: 6px; z-index: 5; display: flex; align-items: flex-start; gap: 6px; }
  .fis { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 84px; max-width: 112px; padding: 12px 8px 8px; border-radius: 6px 6px 14px 14px; background: var(--kart); border: 1px solid var(--kenar); box-shadow: 0 4px 0 var(--kenar); font-size: 12px; text-align: center; }
  .fis:nth-child(odd) { transform: rotate(-2deg); }
  .fis:nth-child(even) { transform: rotate(1.5deg); }
  .fis.hedef { border-color: var(--renk-ana); box-shadow: 0 4px 0 var(--renk-ana); }
  .fis.ozel { border-color: var(--renk-logo); }
  .igne { position: absolute; top: -6px; left: 50%; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: var(--vurgu); box-shadow: 0 2px 0 rgb(0 0 0 / 0.2); }
  .kimlik { display: flex; align-items: center; gap: 4px; font-size: 18px; line-height: 20px; }
  .sabir { width: 100%; height: 5px; overflow: hidden; border-radius: 3px; background: var(--kenar); }
  .sabir i { display: block; width: 100%; height: 100%; border-radius: 3px; background: var(--basari); transform-origin: left center; }
  .fis.orta .sabir i { background: var(--renk-logo); }
  .fis.kotu .sabir i { background: var(--vurgu); }
  .fis.kotu { animation: tedirgin 0.5s ease-in-out infinite; }
  .tip-ad { color: var(--renk-ana); font-size: 10px; font-weight: 800; }
  .fis-ust { font-size: 13px; }
  .fis-ek { font-size: 10px; color: var(--yazi-soluk); line-height: 1.15; }
  .tercih { font-size: 10px; font-weight: 800; color: var(--vurgu); }
  .mini { display: flex; flex-direction: column-reverse; align-items: center; gap: 1px; margin-top: 4px; }
  .satir { position: relative; display: grid; place-items: center; min-width: 60px; transition: opacity 0.2s, transform 0.2s; }
  .satir.bitti { opacity: 0.45; }
  .satir.siradaki { animation: parla-s 0.8s ease-in-out infinite; }
  .satir em { position: absolute; right: -2px; top: -3px; font-style: normal; font-size: 11px; font-weight: 900; color: var(--basari); }
  .m-krep { display: block; width: 56px; height: var(--kh, 9px); border-radius: 5px; background: var(--krep-orta); box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.2); }
  .m-krep.ince { height: calc(var(--kh, 9px) * 0.6); }
  .m-krep.kalin { height: calc(var(--kh, 9px) * 1.4); }
  .m-ek { font-size: calc(var(--kh, 9px) + 2px); line-height: calc(var(--kh, 9px) + 2px); }

  .raf { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: var(--sahne-tezgah-koyu); box-shadow: 0 5px 0 rgb(0 0 0 / 0.12); }
  .kavanoz { position: absolute; bottom: 10px; width: 30px; height: 40px; border-radius: 6px 6px 10px 10px; background: color-mix(in srgb, var(--sahne-tabak) 35%, white); border: 2px solid color-mix(in srgb, var(--sahne-tabak) 50%, white); }
  .kavanoz::before { content: ""; position: absolute; left: 3px; right: 3px; top: -9px; height: 9px; border-radius: 4px; background: var(--renk-ana); }
  .kavanoz i { position: absolute; left: 3px; right: 3px; bottom: 3px; height: 55%; border-radius: 3px 3px 6px 6px; background: var(--krep-az); }
  .k1 { right: 92px; animation: kavanoz 5s ease-in-out infinite; }
  .k2 { right: 56px; height: 32px; animation: kavanoz 5s ease-in-out 1.7s infinite; } .k2 i { background: var(--vurgu); }
  .k3 { right: 20px; height: 46px; width: 28px; animation: kavanoz 5s ease-in-out 3.1s infinite; } .k3 i { background: var(--krep-iyi); }
  .yogun { position: absolute; right: 12px; top: 6px; z-index: 6; padding: 3px 10px; border-radius: 999px; background: var(--vurgu); color: var(--renk-ana-yazi); font-size: 12px; font-weight: 900; animation: parla-s 0.8s ease-in-out infinite; }

  /* Tezgâh */
  .tezgah { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: calc(100% + 24px); margin: 0 -12px; padding-bottom: 80px; background: linear-gradient(180deg, var(--sahne-tezgah) 0%, var(--sahne-tezgah-koyu) 100%); }
  .tezgah.cift-sira { padding-bottom: 146px; }
  .tavalar { position: relative; z-index: 6; display: flex; justify-content: center; gap: 6px; margin-top: 40px; }

  .tabak { position: relative; z-index: 4; width: 290px; height: 150px; flex: none; }
  .kule { position: absolute; left: 0; right: 0; bottom: 28px; display: flex; flex-direction: column-reverse; align-items: center; gap: 1px; }
  .t-krep { width: 170px; height: 20px; border-radius: 10px; box-shadow: inset 0 -4px 0 rgb(0 0 0 / 0.2); background-image: linear-gradient(180deg, rgb(255 255 255 / 0.25) 0 38%, transparent 38%); }
  .t-krep.ince { height: 12px; } .t-krep.kalin { height: 28px; border-radius: 14px; }
  .t-krep.cig { background-color: var(--krep-cig); }
  .t-krep.az { background-color: var(--krep-az); }
  .t-krep.orta { background-color: var(--krep-orta); }
  .t-krep.iyi { background-color: var(--krep-iyi); }
  .t-krep.fazla { background-color: var(--krep-fazla); }
  .t-krep.yanik { background-color: var(--krep-yanik); }
  .t-ek { font-size: 16px; line-height: 16px; height: 16px; }
  .plaka { position: absolute; left: 10px; bottom: 0; width: 270px; height: 38px; border-radius: 50%; background: radial-gradient(ellipse at 50% 35%, var(--sahne-tabak) 55%, color-mix(in srgb, var(--sahne-tabak) 70%, white) 56%); box-shadow: inset 0 -8px 0 rgb(0 0 0 / 0.13), 0 9px 0 var(--sahne-tabak-koyu); }
  .dusen { position: absolute; left: 50%; bottom: 60px; z-index: 3; margin-left: -12px; font-size: 24px; pointer-events: none; animation: dus 0.4s cubic-bezier(0.5, 0, 1, 0.6) forwards; }
  .coin { position: absolute; left: 50%; bottom: 80px; z-index: 20; margin-left: -10px; font-size: 20px; pointer-events: none; animation: coin 0.9s ease-out forwards; }

  .mesaj { position: absolute; left: 50%; top: 46%; z-index: 20; padding: 10px 20px; border-radius: 16px; border: 2px solid var(--renk-ana); background: var(--kart); text-align: center; pointer-events: none; animation: patla 0.45s ease-out forwards; transform: translateX(-50%); }
  .mesaj .ana { font-size: 34px; font-weight: 900; color: var(--renk-ana); }
  .mesaj.perfect { border-color: var(--basari); } .mesaj.perfect .ana { color: var(--basari); font-size: 42px; }
  .mesaj.olmadi { border-color: var(--vurgu); } .mesaj.olmadi .ana { color: var(--vurgu); }
  .mesaj .alt { font-size: 14px; }
  .mesaj .kazanc { font-weight: 800; }

  .gitti { position: absolute; left: 50%; top: 40%; z-index: 19; padding: 6px 14px; border-radius: 999px; background: var(--kart); border: 2px solid var(--vurgu); color: var(--vurgu); font-size: 14px; font-weight: 800; pointer-events: none; animation: patla 0.35s ease-out forwards; transform: translateX(-50%); }

  /* Seviye atlama: oyunu durdurmaz (pointer-events yok), kendiliğinden kaybolur */
  .lvl { position: absolute; left: 50%; top: 24%; z-index: 25; display: flex; flex-direction: column; align-items: center; gap: 4px; width: max-content; max-width: 92%; padding: 12px 22px; border-radius: 18px; border: 3px solid var(--renk-logo); background: var(--kart); text-align: center; pointer-events: none; transform: translateX(-50%); animation: lvl 1.8s ease-out forwards; }
  .lvl.kilometre { border-color: var(--vurgu); animation-duration: 2.8s; }
  .lvl-ana { font-size: 26px; font-weight: 900; color: var(--renk-ana); }
  .lvl-baslik { font-size: 30px; font-weight: 900; color: var(--vurgu); line-height: 1.1; }
  .lvl-alt { font-size: 14px; color: var(--yazi-soluk); }
  .acilan { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 8px; margin-top: 4px; font-size: 13px; font-weight: 800; }
  .acilan span { padding: 2px 8px; border-radius: 999px; background: var(--zemin); border: 1px solid var(--kenar); }

  .alt-bar { position: absolute; left: 12px; right: 12px; bottom: calc(10px + env(safe-area-inset-bottom)); z-index: 10; display: flex; gap: 8px; }
  .malzemeler, .eylemler { display: contents; }
  .alt-bar.cift-sira { flex-direction: column; gap: 6px; }
  .alt-bar.cift-sira .malzemeler, .alt-bar.cift-sira .eylemler { display: flex; gap: 6px; }
  .alt-bar.cift-sira .malzemeler .dugme { min-height: 54px; min-width: 0; }
  .alt-bar.cift-sira .malzemeler .dugme span { font-size: 22px; }
  .alt-bar.cift-sira .malzemeler .dugme small { max-width: 100%; overflow: hidden; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
  .dugme { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 64px; padding: 4px 2px; border: 2px solid var(--kenar); border-radius: 16px; background: var(--kart); box-shadow: 0 4px 0 var(--kenar); touch-action: none; -webkit-tap-highlight-color: transparent; }
  .dugme:active { transform: translateY(4px) scale(0.97); box-shadow: none; }
  .dugme span { font-size: 26px; line-height: 1; }
  .dugme small { font-size: 11px; }
  .dugme.uyari { border-color: var(--vurgu); }
  .tabak.yanlis .plaka { filter: saturate(0.4); }
  .tabak.yanlis::after { content: "✖"; position: absolute; right: 24px; top: 6px; z-index: 6; color: var(--vurgu); font-size: 26px; font-weight: 900; }
  .dugme.kucuk { flex: 0.8; min-height: 56px; align-self: center; }
  .dugme.parlak { animation: parla 0.9s ease-in-out infinite; }

  @keyframes patla { 0% { transform: translateX(-50%) scale(0.5); opacity: 0; } 60% { transform: translateX(-50%) scale(1.12); opacity: 1; } 100% { transform: translateX(-50%) scale(1); } }
  @keyframes lvl { 0% { transform: translateX(-50%) scale(0.4); opacity: 0; } 12% { transform: translateX(-50%) scale(1.15); opacity: 1; } 22% { transform: translateX(-50%) scale(1); } 80% { transform: translateX(-50%) scale(1); opacity: 1; } 100% { transform: translateX(-50%) translateY(-14px) scale(1); opacity: 0; } }
  @keyframes parla { 50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--renk-ana) 45%, transparent); } }
  @keyframes parla-s { 50% { transform: scale(1.12); } }
  @keyframes tedirgin { 25% { translate: -1px 0; } 75% { translate: 1px 0; } }
  @keyframes kavanoz { 0%, 90%, 100% { transform: none; } 94% { transform: translateY(-3px) rotate(-4deg); } 97% { transform: rotate(3deg); } }
  @keyframes dus { 0% { transform: translateY(-130px) scale(0.8); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(0) scale(1.1, 0.7); opacity: 0; } }
  @keyframes coin { 0% { transform: translate(0, 0) scale(0.6); opacity: 1; } 100% { transform: translate(calc(var(--dx) * 1.5), -300px) scale(1); opacity: 0; } }
</style>
