<script lang="ts">
  // Restoran sahnesi: lobi ve oyun AYNI sahnenin iki durumudur (sayfa/kamera geçişi yok). Duvar, tezgâh, tava ve tabak tek kez
  // çizilir; OYNA yalnızca `oyunda` durumunu açar: lobi arayüzü kapanır, oyun arayüzü (fişler, malzeme çubuğu) kısa sürede belirir.
  // Sonsuz oyun: duvarda müşteri fişleri, ortada tava(lar), yakında tabak. Bölüm yok; her başarılı müşteri
  // seviyeyi ilerletir (kurallar: oturum.ts / seviye.ts). Tavalar Tava.svelte'dedir:
  // basılı tut = hamur dök, yukarı kaydır = çevir, aşağı kaydır = tabağa al.
  // Temel kural: tabak bir siparişin BİREBİR aynısı olunca kendiliğinden servis edilir; yanlış tabak asla kabul edilmez.
  import { onDestroy, onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { fade, fly, scale } from "svelte/transition";
  import { fisKaydet } from "$lib/fisler.svelte";
  import { gelistiriciModuAcik, ilerleme } from "$lib/ilerleme.svelte";
  import { ruhHali } from "$lib/oyun/musteri";
  import { musteriyeVer, oturumIlerlet, oturumSeviyeAyarla, sabirOrani, tabakDurumu, yeniOturum, type OturumOlayi, type SeviyeAtlama } from "$lib/oyun/oturum";
  import type { Hata } from "$lib/oyun/degerlendirme";
  import { rngOlustur } from "$lib/oyun/rng";
  import { sayiKisalt, type Acilis } from "$lib/oyun/seviye";
  import { cal, coinYagmuru, sesYukle } from "$lib/oyun/ses";
  import { AYAR, malzeme, tip as tipBul } from "$lib/oyun/veri";
  import sahneAyar from "$lib/veri/sahne.json";
  import GelistiriciPaneli from "./GelistiriciPaneli.svelte";
  import Karakter from "./Karakter.svelte";
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
  /** Servis edilmiş / öfkeyle gitmiş müşteriler: tepkilerini göstermek için kısa süre sahnede kalır */
  type Ayrilan = { m: Musteri; durum: "mutlu" | "kizgin"; yemek: boolean };
  let ayrilanlar = $state<Ayrilan[]>([]);
  /** Tavada servise hazır krep olan tava sayısı (tabak "buraya koy" diye parlar) */
  let hazirTava = $state(0);
  let copAt = $state(false);
  let sonucNo = 0;
  let bildirimNo = 0;

  let sahneEl: HTMLElement;
  let tabakEl: HTMLElement;
  let kuleEl: HTMLElement;
  let coinEl: HTMLElement;
  let seviyeEl: HTMLElement;

  const sv = $derived(oturum.sv);
  /** Sahnedeki herkes: bekleyen müşteriler + tepki veren ayrılanlar, geliş sırasıyla (fişi yalnızca bekleyenin vardır) */
  const sahnedekiler = $derived(
    [
      ...oturum.musteriler.map((m) => ({ m, ay: null as Ayrilan | null })),
      ...ayrilanlar.map((a) => ({ m: a.m, ay: a as Ayrilan | null })),
    ].sort((a, b) => a.m.id - b.m.id),
  );
  const yuzu = (m: Musteri, ay: Ayrilan | null) =>
    ay ? (ay.durum === "kizgin" ? "🤬" : ay.yemek ? "😋" : "🤩") : ruhHali(sabirOrani(m), AYAR).yuz;

  function ayrilanEkle(m: Musteri, durum: Ayrilan["durum"]) {
    if (ayrilanlar.some((x) => x.m.id === m.id)) return;
    ayrilanlar.push({ m, durum, yemek: false });
    const a = ayrilanlar[ayrilanlar.length - 1];
    if (durum === "mutlu") setTimeout(() => (a.yemek = true), sahneAyar.mutluYemekMs);
    setTimeout(() => (ayrilanlar = ayrilanlar.filter((x) => x.m.id !== m.id)), durum === "mutlu" ? sahneAyar.mutluMs : sahneAyar.kizginMs);
  }

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
    cal("tikla");
  }

  // ---- Oyun döngüsü: tek rAF, dt ile ----
  onMount(() => {
    sesYukle();
    let id = 0;
    let son = performance.now();
    const kare = (n: number) => {
      const dt = Math.min(0.1, (n - son) / 1000);
      son = n;
      if (!paneAcik && oyunda) {
        olaylar(oturumIlerlet(oturum, dt, rng));
        ruhSesleri();
      }
      id = requestAnimationFrame(kare);
    };
    id = requestAnimationFrame(kare);
    return () => cancelAnimationFrame(id);
  });

  /** Müşteri sabırsızlandıkça kısa karakter sesleri (her eşikte bir kez): 0 → sabırsız (tık tık) → sinirli (homurtu) */
  const ruhSeviyesi = new Map<number, number>();
  function ruhSesleri() {
    for (const m of oturum.musteriler) {
      const oran = sabirOrani(m);
      const sv = oran < 0.2 ? 2 : oran < 0.4 ? 1 : 0;
      if (sv > (ruhSeviyesi.get(m.id) ?? 0)) {
        ruhSeviyesi.set(m.id, sv);
        cal(sv === 2 ? "homurtu" : "sabirsiz");
      }
    }
  }

  function olaylar(liste: OturumOlayi[]) {
    for (const o of liste) {
      if (o.tur === "geldi") {
        cal("musteri"); // sipariş fişi de aynı anda belirir
        kontrolEt(false);
      } else if (o.tur === "gitti") {
        ayrilanEkle(o.musteri, "kizgin");
        gittiNo++;
        cal("uzgun");
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
    cal("plop"); // krep tabağa temas etti
    cal("boing"); // tabağın zıplamasıyla birlikte
    kontrolEt(true);
  }

  /**
   * Tabaktaki parçaların dikey yerleşimi (px, tabağa göre). Krep, tava ile aynı eğimde bir elips olarak çizilir;
   * her yeni katman bir önceki yüzeyin hemen üstünde durur, böylece en üstteki krebin yüzeyi her zaman tam görünür.
   */
  const katmanlar = $derived.by(() => {
    const K = sahneAyar.katman;
    let z = 0;
    return tabak.map((p) => {
      if (p.malzeme === "krep") {
        z += K[p.kalinlik ?? "normal"];
        return { p, y: z, d: K[p.kalinlik ?? "normal"] };
      }
      const y = z + K.yukseklik * 0.32; // topping krebin üst yüzeyine konur
      z += K.ek;
      return { p, y, d: 0 };
    });
  });
  const tabakYuksek = $derived(katmanlar.reduce((z, k) => z + (k.p.malzeme === "krep" ? k.d : sahneAyar.katman.ek), 0));

  /** Krep tabağın neresine düşecek: yığının üstündeki yeni katmanın yüzey merkezi (tavadaki krebin merkeziyle aynı nokta) */
  function tabakHedef() {
    if (!kuleEl) return null;
    const r = kuleEl.getBoundingClientRect();
    const K = sahneAyar.katman;
    return { x: r.left + r.width / 2, y: r.top - tabakYuksek - K.normal - K.yukseklik / 2 };
  }

  function koy(id: string) {
    if (tabak.length >= AYAR.tabakMax) return;
    tabak.push({ malzeme: id });
    dusenler.push({ id: ++sayac, ikon: malzeme(id).ikon });
    if (dusenler.length > 4) dusenler.shift();
    tabakZipla(0.8);
    // Malzeme sesi türüne göre; yanlış tabakta bunun yerine kontrolEt "boop" çalar (iki ses üst üste binmesin)
    if (tabakDurumu(oturum, tabak).durum !== "yanlis") {
      const m = malzeme(id);
      cal(id.includes("krema") ? "krema" : m.kategori === "sos" ? "squish" : m.kategori === "dolgu" ? "meyve" : "serpme");
      cal("tik");
    }
    kontrolEt(true);
  }

  function bosalt() {
    if (!tabak.length) return;
    tabak = [];
    tabakZipla(0.6);
    cal("bonk");
    copAt = true;
    setTimeout(() => (copAt = false), 380);
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
      cal("boop");
      anim(tabakEl, [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(0)" }], 320);
    }
  }

  function teslim() {
    const d = tabakDurumu(oturum, tabak);
    const servis = d.durum === "dogru" ? d.musteri : null;
    const r = musteriyeVer(oturum, tabak);
    if (!r) return;
    if (servis) ayrilanEkle(servis, "mutlu");
    sonucGoster(r.sonuc, "", r.kazanc);

    // Madeni para patlaması + sayaç zıplaması
    if (r.sonuc !== "olmadi") {
      const n = r.sonuc === "perfect" ? 6 : 3;
      for (let i = 0; i < n; i++) coinler.push({ id: ++sayac, dx: (i - (n - 1) / 2) * 22 });
      setTimeout(() => anim(coinEl, [{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(1)" }], 300), 350);
      setTimeout(() => coinYagmuru(n), 140);
    }
    if (r.sonuc === "perfect") salla(1);
    tabak = [];
    cal(r.sonuc === "perfect" ? "perfect" : "great"); // başarı: en yüksek öncelik
    setTimeout(() => cal("yay"), 280); // müşteri tepkisi
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
    setTimeout(() => cal("levelup"), 450); // başarı sesinin ardından
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
    ayrilanlar = [];
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
    ayrilanlar = [];
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
  const i_hedef = (m: Musteri) => hedef?.id === m.id;
  const ruh = (m: Musteri) => (sabirOrani(m) > 0.5 ? "iyi" : sabirOrani(m) > 0.25 ? "orta" : "kotu");
</script>

<div class="sahne" bind:this={sahneEl}>
  <header class="ust">
    <button class="geri" class:gizli={!oyunda} onclick={() => { oyunda = false; cal("tikla"); }} aria-label="Lobiye dön" tabindex={oyunda ? 0 : -1}>←</button>
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

  <!-- Duvar (katmanlar arkadan öne): duvar kağıdı → arka masalar → raf/saat → müşteriler + fişleri → tezgâh kenarı -->
  <div class="duvar">
    <div class="kagit" aria-hidden="true"></div>
    <div class="arka-masalar" aria-hidden="true">
      <span class="masa-a ma1"><i class="sandalye"></i><i class="konuk">🧑‍🦱</i><i class="tabla"></i><i class="ayak"></i></span>
      <span class="masa-a ma2"><i class="sandalye"></i><i class="konuk">👵</i><i class="tabla"></i><i class="ayak"></i></span>
    </div>
    <div class="saat" aria-hidden="true"><i class="ibre ak"></i><i class="ibre yel"></i></div>
    <div class="raf-ust" aria-hidden="true">
      <span class="r-bitki">🪴</span>
      <span class="r-tabaklar"><i></i><i></i><i></i></span>
      <span class="r-kavanoz"><i></i></span>
      <span class="r-sus">🥞</span>
      <b class="tahta"></b>
    </div>

    <div class="tabela" class:gizli={oyunda} aria-hidden="true">
      <span class="ip sol"></span><span class="ip sag"></span>
      <b>pancake<em>flip</em></b>
    </div>

    <div class="musteriler" class:gizli={!oyunda}>
      {#each sahnedekiler as { m, ay } (m.id)}
        {@const t = tipBul(m.tip)}
        {@const oran = sabirOrani(m)}
        {@const dogru = onek(m.siparis.parcalar)}
        {@const ek = ekler(m)}
        <div class="kolon" class:hedef={!ay && i_hedef(m)} class:coklu={oturum.musteriler.length > 1} animate:flip={{ duration: 260 }} in:fly={{ y: 26, duration: 320 }} out:fade={{ duration: 180 }}>
          {#if !ay}
            <aside
              class="fis {ruh(m)}"
              class:hedef={i_hedef(m) && oturum.musteriler.length > 1}
              class:ozel={m.tip !== "normal"}
              style:--kh={m.siparis.parcalar.length > 7 ? "6px" : "9px"}
              aria-label="Sipariş"
              out:fade={{ duration: 120 }}
            >
              <i class="igne"></i>
              <div class="baslik">
                <div class="kimlik"><Karakter kimlik={m.id} yuz={yuzu(m, ay)} boyut="kucuk" rozet={m.tip !== "normal" ? t.ikon : ""} /></div>
                <div class="metin">
                  {#if m.tip !== "normal"}<small class="tip-ad">{t.ad}</small>{/if}
                  <b class="fis-ust">{krepSayisi(m) === 1 && !ek.length ? "1 sade krep" : `${krepSayisi(m)} krep`}</b>
                  {#if ek.length}<small class="fis-ek">+ {ek.join(", ")}</small>{/if}
                  {#if m.siparis.tercih}<small class="tercih">📏 {m.siparis.tercih === "ince" ? "ince" : "kalın"}</small>{/if}
                </div>
              </div>
              <div class="sabir"><i style:transform={`scaleX(${oran})`}></i></div>
              <div class="mini">
                {#each m.siparis.parcalar as id, j}
                  <div class="satir" class:bitti={j < dogru} class:siradaki={i_hedef(m) && j === dogru && siradaki === id}>
                    {#if id === "krep"}<span class="m-krep {m.siparis.tercih ?? ''}"></span>{:else}<span class="m-ek">{malzeme(id).ikon}</span>{/if}
                    {#if j < dogru}<em>✓</em>{/if}
                  </div>
                {/each}
              </div>
            </aside>
          {/if}
          <div class="kisi" class:bulut={!ay && ruh(m) === "kotu"}>
            <Karakter kimlik={m.id} yuz={yuzu(m, ay)} rozet={m.tip !== "normal" ? t.ikon : ""} durum={ay ? ay.durum : "bekle"} sabirsiz={!ay && oran < 0.4} />
            {#if !ay && oran < 0.4}<span class="dusunce" aria-hidden="true">💭</span>{/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="tezgah-kenar" aria-hidden="true"></div>
    {#if oturum.yogunKalan > 0}
      <div class="yogun">🔥 YOĞUN SAAT {Math.ceil(oturum.yogunKalan)}</div>
    {/if}
  </div>

  <!-- Tezgâh: tava(lar) + tabak -->
  <main class="tezgah" class:cift-sira={menu.length > 4}>
    <!-- Tezgâhın arka sırası: kaşıklık, açılan malzemelerin kapları, peçete kutusu -->
    <div class="arka-sira" aria-hidden="true">
      <span class="kasiklik"><i class="bardak"></i><em class="k1">🥄</em><em class="k2">🍴</em></span>
      <span class="un"><i></i><b>un</b></span>
      <span class="kaplar">
        {#each menu as m (m.id)}
          <span class="kap" class:parla={siradaki === m.id} style:--c={`var(${m.renkDegiskeni})`} in:scale={{ duration: 360, start: 0.3 }}>
            <i class="kapak"></i><i class="dolgu"></i><b>{m.ikon}</b>
          </span>
        {/each}
      </span>
      <span class="pecete"><i></i><i></i></span>
    </div>

    {#key tekrar}
      <div class="tavalar" class:cift={tavaSayisi > 1}>
        {#each Array(tavaSayisi) as _, i (i)}
          <Tava kilit={!oyunda} onHazir={(h) => (hazirTava += h ? 1 : -1)} seviye={oturum.seviye} ipucuAcik={sv.ipucu && oyunda} {hedefKalinlik} {olcek} duraklat={paneAcik || !oyunda} sag={tavaSayisi > 1 && i === 1} {tabakHedef} onTabaga={tabagaGeldi} onSalla={salla} />
        {/each}
      </div>
    {/key}

    <div class="tabak" class:yanlis={tabakYanlis} class:hazir={hazirTava > 0} bind:this={tabakEl}>
      <!-- Katman sırası: tabak (zemin) → krepler / toppingler (üstte, yüzeyleri açık) -->
      <div class="plaka"></div>
      <div class="kule" bind:this={kuleEl} style:--kw={`${sahneAyar.katman.genislik}px`} style:--kh={`${sahneAyar.katman.yukseklik}px`}>
        {#each katmanlar as k, i (i)}
          {#if k.p.malzeme === "krep"}
            <div class="t-krep {k.p.pisme} {k.p.kalinlik ?? 'normal'}" class:yeni={i === katmanlar.length - 1} style:bottom={`${k.y}px`} style:z-index={i + 1} style:--d={`${k.d}px`}><span class="parlak"></span></div>
          {:else}
            <div class="t-ek" class:yeni={i === katmanlar.length - 1} style:bottom={`${k.y}px`} style:z-index={i + 1}>{malzeme(k.p.malzeme).ikon}</div>
          {/if}
        {/each}
      </div>
      {#each dusenler as d (d.id)}
        <span class="dusen" onanimationend={() => (dusenler = dusenler.filter((x) => x.id !== d.id))}>{d.ikon}</span>
      {/each}
      {#each coinler as c (c.id)}
        <span class="coin" style:--dx={`${c.dx}px`} onanimationend={() => (coinler = coinler.filter((x) => x.id !== c.id))}>🪙</span>
      {/each}
    </div>

    <span class="tabak-yigini" aria-hidden="true"><i></i><i></i><i></i></span>
    <button class="cop" class:parla={tabakYanlis} class:acik={copAt || tabak.length > 0} onpointerdown={bosalt} aria-label="Tabağı çöpe at">
      <i class="cop-kapak"></i><i class="cop-govde"></i>
    </button>
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
  .musteriler, .tabela, .lobi-ust, .geri, .oyna, .alt-bar { transition: opacity 0.3s ease, transform 0.3s ease; }
  .musteriler.gizli { transform: translateY(12px); }
  .alt-bar.gizli { transform: translateY(24px); }
  .lobi-ust { display: flex; gap: 6px; }
  .lobi-ust.gizli { position: absolute; right: 0; }
  .geri.gizli { position: absolute; left: 0; }
  .yuvarlak { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--kart); border: 1px solid var(--kenar); box-shadow: 0 3px 0 var(--kenar); color: var(--yazi); font-size: 17px; font-weight: 900; text-decoration: none; }
  .yuvarlak:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--kenar); }

  .tabela { position: absolute; left: 50%; top: 40px; z-index: 3; padding: 8px 18px 10px; border-radius: 14px; background: linear-gradient(180deg, var(--krep-iyi), color-mix(in srgb, var(--krep-iyi) 70%, black)); box-shadow: 0 5px 0 rgb(0 0 0 / 0.18), inset 0 2px 0 rgb(255 255 255 / 0.18); transform-origin: 50% -26px; translate: -50% 0; animation: salin 4.5s ease-in-out infinite; }
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
  .duvar { position: relative; flex: none; width: calc(100% + 24px); height: 204px; margin: 6px -12px 0; overflow: hidden; }
  .kagit { position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 22px, rgb(255 255 255 / 0.22) 22px 44px), linear-gradient(180deg, transparent 62%, color-mix(in srgb, var(--sahne-tezgah-koyu) 30%, transparent) 62% 100%); }
  .kagit::after { content: ""; position: absolute; left: 0; right: 0; top: 62%; height: 4px; background: rgb(255 255 255 / 0.5); }

  /* Arka plan: uzakta oturan, sönük konuklar (oyunun önüne geçmesin) */
  .arka-masalar { position: absolute; inset: 0; opacity: 0.55; filter: blur(0.6px); }
  .masa-a { position: absolute; bottom: 22px; width: 64px; height: 62px; }
  .ma1 { right: 16px; } .ma2 { right: 100px; transform: scale(0.85); transform-origin: 50% 100%; }
  .masa-a .tabla { position: absolute; left: 6px; right: 6px; top: 30px; height: 12px; border-radius: 50%; background: var(--sahne-tezgah-koyu); box-shadow: 0 3px 0 rgb(0 0 0 / 0.12); }
  .masa-a .ayak { position: absolute; left: 30px; top: 40px; width: 5px; height: 22px; background: var(--sahne-tezgah-koyu); }
  .masa-a .sandalye { position: absolute; left: 0; top: 24px; width: 12px; height: 26px; border-radius: 6px 6px 2px 2px; background: color-mix(in srgb, var(--sahne-tezgah-koyu) 80%, black); }
  .masa-a .konuk { position: absolute; left: 14px; top: 2px; font-style: normal; font-size: 24px; line-height: 1; animation: konuk 3.6s ease-in-out infinite; }
  .ma2 .konuk { animation-delay: -1.8s; }

  .saat { position: absolute; right: 14px; top: 8px; z-index: 2; width: 28px; height: 28px; border-radius: 50%; background: var(--kart); border: 3px solid var(--sahne-tezgah-koyu); box-shadow: 0 2px 0 rgb(0 0 0 / 0.12); }
  .ibre { position: absolute; left: 50%; bottom: 50%; width: 2px; border-radius: 2px; background: var(--yazi); transform-origin: 50% 100%; }
  .ibre.ak { height: 9px; animation: don 24s linear infinite; }
  .ibre.yel { height: 6px; animation: don 288s linear infinite; }

  /* Raf: sağ üstte, ana oyun alanını kapatmaz */
  .raf-ust { position: absolute; right: 8px; top: 46px; z-index: 2; width: 132px; height: 40px; }
  .raf-ust .tahta { position: absolute; left: 0; right: 0; bottom: 0; height: 7px; border-radius: 3px; background: var(--sahne-tezgah-koyu); box-shadow: 0 3px 0 rgb(0 0 0 / 0.14); }
  .r-bitki { position: absolute; left: 2px; bottom: 5px; font-size: 24px; line-height: 1; transform-origin: 50% 100%; animation: sallan 5s ease-in-out infinite; }
  .r-tabaklar { position: absolute; left: 34px; bottom: 7px; width: 26px; height: 16px; }
  .r-tabaklar i { position: absolute; left: 0; right: 0; height: 5px; border-radius: 50%; background: var(--sahne-tabak); box-shadow: 0 2px 0 var(--sahne-tabak-koyu); }
  .r-tabaklar i:nth-child(1) { bottom: 0; } .r-tabaklar i:nth-child(2) { bottom: 4px; } .r-tabaklar i:nth-child(3) { bottom: 8px; }
  .r-kavanoz { position: absolute; left: 70px; bottom: 7px; width: 18px; height: 22px; border-radius: 4px 4px 7px 7px; background: color-mix(in srgb, var(--sahne-tabak) 35%, white); border: 2px solid color-mix(in srgb, var(--sahne-tabak) 50%, white); }
  .r-kavanoz i { position: absolute; left: 1px; right: 1px; bottom: 1px; height: 55%; border-radius: 2px 2px 5px 5px; background: var(--vurgu); }
  .r-kavanoz::before { content: ""; position: absolute; left: 1px; right: 1px; top: -6px; height: 5px; border-radius: 3px; background: var(--renk-ana); }
  .r-sus { position: absolute; right: 2px; bottom: 7px; font-size: 22px; line-height: 1; }

  /* Müşteriler + fişleri: fiş kişinin başının üstünde asılı, fişteki portre aynı kişi */
  .musteriler { position: absolute; left: 8px; right: 8px; bottom: 6px; z-index: 5; display: flex; align-items: flex-end; gap: 6px; }
  .kolon { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: none; transition: opacity 0.25s, transform 0.25s; }
  .kolon.coklu:not(.hedef) { opacity: 0.88; }
  .kolon.hedef .kisi { transform: scale(1.08); transform-origin: 50% 100%; }
  .kisi { position: relative; height: 62px; margin-bottom: -2px; transition: transform 0.25s; }
  .kisi :global(.kr) { margin: 0 auto; }
  .dusunce { position: absolute; right: -6px; top: -2px; font-size: 16px; animation: balon 1.1s ease-in-out infinite; }
  .fis { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 92px; max-width: 124px; padding: 12px 8px 8px; border-radius: 6px 6px 14px 14px; background: var(--kart); border: 1px solid var(--kenar); box-shadow: 0 4px 0 var(--kenar); font-size: 12px; text-align: center; }
  .fis::after { content: ""; position: absolute; left: 50%; bottom: -8px; width: 12px; height: 12px; margin-left: -6px; background: var(--kart); border-right: 1px solid var(--kenar); border-bottom: 1px solid var(--kenar); transform: rotate(45deg); z-index: -1; }
  .kolon:nth-child(odd) .fis { transform: rotate(-2deg); }
  .kolon:nth-child(even) .fis { transform: rotate(1.5deg); }
  .fis.hedef { border-color: var(--renk-ana); box-shadow: 0 4px 0 var(--renk-ana); }
  .fis.hedef::after { border-color: var(--renk-ana); }
  .fis.ozel { border-color: var(--renk-logo); }
  .igne { position: absolute; top: -6px; left: 50%; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: var(--vurgu); box-shadow: 0 2px 0 rgb(0 0 0 / 0.2); }
  .baslik { display: flex; align-items: center; gap: 5px; width: 100%; text-align: left; }
  .metin { display: flex; flex-direction: column; min-width: 0; line-height: 1.15; }
  .kimlik { display: flex; flex: none; align-items: center; justify-content: center; width: 32px; height: 30px; }
  .sabir { width: 100%; height: 5px; overflow: hidden; border-radius: 3px; background: var(--kenar); }
  .sabir i { display: block; width: 100%; height: 100%; border-radius: 3px; background: var(--basari); transform-origin: left center; }
  .fis.orta .sabir i { background: var(--renk-logo); }
  .fis.kotu .sabir i { background: var(--vurgu); }
  .fis.kotu { animation: tedirgin 0.5s ease-in-out infinite; }
  .tip-ad { color: var(--renk-ana); font-size: 10px; font-weight: 800; }
  .fis-ust { font-size: 13px; white-space: nowrap; }
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

  /* Tezgâhın ön kenarı: müşterilerin belden aşağısını örter */
  .tezgah-kenar { position: absolute; left: 0; right: 0; bottom: 0; z-index: 6; height: 14px; background: var(--sahne-tezgah-koyu); box-shadow: 0 5px 0 rgb(0 0 0 / 0.12); }
  .yogun { position: absolute; right: 50px; top: 10px; z-index: 6; padding: 3px 10px; border-radius: 999px; background: var(--vurgu); color: var(--renk-ana-yazi); font-size: 12px; font-weight: 900; animation: parla-s 0.8s ease-in-out infinite; }

  /* Tezgâh */
  .tezgah { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: calc(100% + 24px); margin: 0 -12px; padding-bottom: 80px; background: linear-gradient(180deg, var(--sahne-tezgah) 0%, var(--sahne-tezgah-koyu) 100%); }
  .tezgah.cift-sira { padding-bottom: 146px; }
  .tezgah { --alt: 80px; background-image: repeating-linear-gradient(90deg, rgb(255 255 255 / 0.07) 0 2px, transparent 2px 38px), linear-gradient(180deg, var(--sahne-tezgah) 0%, var(--sahne-tezgah-koyu) 100%); }
  .tezgah.cift-sira { --alt: 146px; }
  .tavalar { position: relative; z-index: 6; display: flex; justify-content: center; gap: 6px; margin-top: 40px; }

  /* Tezgâhın arka sırası: malzeme kapları, kaşıklık, peçete */
  .arka-sira { position: absolute; left: 10px; right: 10px; top: 14px; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; height: 46px; pointer-events: none; }
  .kaplar { flex: 1; display: flex; justify-content: center; align-items: flex-end; gap: 4px; }
  .kap, .un { position: relative; flex: none; width: 30px; height: 38px; border-radius: 5px 5px 10px 10px; background: color-mix(in srgb, var(--sahne-tabak) 30%, white); border: 2px solid color-mix(in srgb, var(--sahne-tabak) 50%, white); box-shadow: 0 3px 0 rgb(0 0 0 / 0.12); }
  .kap .kapak, .un::before { content: ""; position: absolute; left: 2px; right: 2px; top: -8px; height: 8px; border-radius: 4px; background: var(--renk-ana); }
  .kap .kapak { display: block; background: var(--c, var(--renk-ana)); }
  .kap .dolgu { position: absolute; left: 2px; right: 2px; bottom: 2px; height: 58%; border-radius: 3px 3px 7px 7px; background: var(--c); opacity: 0.85; }
  .kap b { position: absolute; left: 0; right: 0; bottom: 6px; z-index: 1; font-size: 15px; line-height: 1; text-align: center; font-weight: 400; }
  .kap.parla { animation: kap-sal 0.7s ease-in-out infinite; }
  .un { background: color-mix(in srgb, var(--kart) 85%, white); border-color: var(--kenar); }
  .un::before { background: var(--sahne-tezgah-koyu); }
  .un i { position: absolute; left: 2px; right: 2px; bottom: 2px; height: 50%; border-radius: 3px 3px 7px 7px; background: var(--zemin); }
  .un b { position: absolute; left: 0; right: 0; top: 12px; text-align: center; font-size: 9px; font-weight: 900; color: var(--yazi-soluk); }
  .kasiklik { position: relative; flex: none; width: 30px; height: 44px; }
  .kasiklik .bardak { position: absolute; left: 3px; right: 3px; bottom: 0; height: 22px; border-radius: 3px 3px 8px 8px; background: var(--renk-logo); box-shadow: inset 0 -4px 0 rgb(0 0 0 / 0.12); }
  .kasiklik em { position: absolute; bottom: 14px; font-style: normal; font-size: 20px; line-height: 1; }
  .kasiklik .k1 { left: 0; transform: rotate(-14deg); } .kasiklik .k2 { right: 0; transform: rotate(12deg); }
  .pecete { position: relative; flex: none; width: 30px; height: 30px; border-radius: 4px; background: var(--vurgu); box-shadow: 0 3px 0 rgb(0 0 0 / 0.14); }
  .pecete i { position: absolute; left: 5px; right: 5px; top: -7px; height: 12px; border-radius: 2px; background: white; transform: rotate(-6deg); border: 1px solid var(--kenar); }
  .pecete i + i { transform: rotate(8deg); top: -9px; }

  /* Tabak yığını (sol) ve çöp kutusu (sağ): tezgâhın alt köşeleri */
  .tabak-yigini { position: absolute; left: 10px; bottom: calc(var(--alt) + 8px); z-index: 3; width: 38px; height: 30px; pointer-events: none; }
  .tabak-yigini i { position: absolute; left: 0; right: 0; height: 9px; border-radius: 50%; background: var(--sahne-tabak); box-shadow: 0 3px 0 var(--sahne-tabak-koyu); }
  .tabak-yigini i:nth-child(1) { bottom: 0; } .tabak-yigini i:nth-child(2) { bottom: 7px; } .tabak-yigini i:nth-child(3) { bottom: 14px; }
  .cop { position: absolute; right: 8px; bottom: calc(var(--alt) + 2px); z-index: 7; width: 46px; height: 58px; padding: 0; border: 0; background: none; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .cop-govde { position: absolute; left: 4px; right: 4px; bottom: 0; height: 40px; border-radius: 3px 3px 9px 9px; background: repeating-linear-gradient(90deg, var(--sahne-tava) 0 6px, var(--sahne-tava-koyu) 6px 8px); clip-path: polygon(0 0, 100% 0, 88% 100%, 12% 100%); box-shadow: inset 0 -5px 0 rgb(0 0 0 / 0.18); }
  .cop-kapak { position: absolute; left: 0; right: 0; top: 10px; z-index: 1; height: 8px; border-radius: 4px; background: var(--sahne-tava-koyu); box-shadow: 0 3px 0 rgb(0 0 0 / 0.18); transform-origin: 0 100%; transition: transform 0.18s; }
  .cop.acik .cop-kapak { transform: rotate(-24deg) translateY(-2px); }
  .cop:active { transform: scale(0.94); }
  .cop.parla { animation: kap-sal 0.7s ease-in-out infinite; }
  .cop.parla .cop-govde { filter: drop-shadow(0 0 6px var(--vurgu)); }

  .tabak { position: relative; z-index: 4; width: 290px; height: 150px; flex: none; animation: tabak-bob 2.8s ease-in-out infinite; }
  .tabak.hazir .plaka { animation: plaka-parla 0.8s ease-in-out infinite; }
  .tabak.hazir::before { content: "▼"; position: absolute; left: 50%; top: -6px; z-index: 6; margin-left: -10px; color: var(--basari); font-size: 20px; text-shadow: 0 2px 0 var(--kart); animation: zipla-o 0.6s ease-in-out infinite; }
  /* Tabak tava ile aynı eğimde (genişlik/yükseklik ≈ 2,8) bir elips; krep onun üstünde, iç çapına yakın boyutta durur */
  .kule { position: absolute; left: 0; right: 0; bottom: 20px; height: 0; }
  .t-krep { --m: var(--krep-orta); --k: var(--krep-iyi); position: absolute; left: 50%; width: var(--kw); height: var(--kh); margin-left: calc(var(--kw) / -2); border-radius: 50%; background: radial-gradient(ellipse at 50% 42%, var(--m) 0 50%, var(--k) 100%); box-shadow: 0 var(--d) 0 color-mix(in srgb, var(--krep-yanik) 30%, var(--k)); }
  .t-krep.yeni, .t-ek.yeni { animation: plop 0.34s cubic-bezier(0.3, 0, 0.4, 1); }
  .t-krep .parlak { position: absolute; left: 14%; right: 14%; top: 8%; height: 30%; border-radius: 50%; background: linear-gradient(180deg, rgb(255 255 255 / 0.4), transparent); }
  .t-krep.cig { --m: var(--krep-cig); --k: color-mix(in srgb, var(--krep-az) 45%, var(--krep-cig)); }
  .t-krep.az { --m: var(--krep-az); --k: var(--krep-orta); }
  .t-krep.orta, .t-krep.iyi { --m: var(--krep-orta); --k: var(--krep-iyi); }
  .t-krep.fazla { --m: var(--krep-fazla); --k: var(--krep-yanik); }
  .t-krep.yanik { --m: var(--krep-yanik); --k: color-mix(in srgb, var(--krep-yanik) 80%, black); }
  .t-ek { position: absolute; left: 50%; width: 24px; margin-left: -12px; font-size: 20px; line-height: 1; text-align: center; }
  .plaka { position: absolute; left: 20px; bottom: 9px; width: 250px; height: 88px; border-radius: 50%; background: radial-gradient(ellipse at 50% 38%, var(--sahne-tabak) 62%, color-mix(in srgb, var(--sahne-tabak) 70%, white) 63%); box-shadow: inset 0 -8px 0 rgb(0 0 0 / 0.13), 0 9px 0 var(--sahne-tabak-koyu); }
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
  @keyframes konuk { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(2px) rotate(3deg); } }
  @keyframes don { to { transform: rotate(360deg); } }
  @keyframes sallan { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
  @keyframes balon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }
  @keyframes kap-sal { 0%, 100% { transform: translateY(0) rotate(0); } 30% { transform: translateY(-4px) rotate(-3deg); } 60% { transform: translateY(0) rotate(2deg); } }
  @keyframes tabak-bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -3px; } }
  @keyframes plaka-parla { 50% { box-shadow: inset 0 -8px 0 rgb(0 0 0 / 0.13), 0 9px 0 var(--sahne-tabak-koyu), 0 0 0 6px color-mix(in srgb, var(--basari) 45%, transparent); } }
  @keyframes plop { 0% { transform: translateY(-20px) scale(1.04, 1.1); opacity: 0.6; } 55% { transform: translateY(1px) scale(1.08, 0.86); opacity: 1; } 80% { transform: scale(0.98, 1.05); } 100% { transform: none; } }
  @keyframes zipla-o { 50% { transform: translateY(6px); } }
  @keyframes tedirgin { 25% { translate: -1px 0; } 75% { translate: 1px 0; } }
  @keyframes kavanoz { 0%, 90%, 100% { transform: none; } 94% { transform: translateY(-3px) rotate(-4deg); } 97% { transform: rotate(3deg); } }
  @keyframes dus { 0% { transform: translateY(-130px) scale(0.8); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(0) scale(1.1, 0.7); opacity: 0; } }
  @keyframes coin { 0% { transform: translate(0, 0) scale(0.6); opacity: 1; } 100% { transform: translate(calc(var(--dx) * 1.5), -300px) scale(1); opacity: 0; } }
</style>
