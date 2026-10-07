<script lang="ts">
  // Tek tava: basılı tut = hamur dök, yukarı swipe = çevir, aşağı swipe = tabağa kaydır.
  // Kurallar saf mantıktan gelir (pisirme.ts, hamur.ts); burası yalnızca gösterir, jestleri iletir ve "juice" ekler.
  import { onDestroy, onMount } from "svelte";
  import { AYAR } from "$lib/oyun/veri";
  import { cal } from "$lib/oyun/ses";
  import {
    baglamOlustur, cevirKalitesi, pismeDurumu, servisEdilebilir, tavaBirak, tavaCevir, tavaDokBasla, tavaHareket, tavaIlerlet, tavaServis, yeniTava,
    type Tava,
  } from "$lib/oyun/pisirme";
  import { hamurIcinde } from "$lib/oyun/hamur";
  import type { Kalinlik, PismeDurumu, TabakParcasi } from "../../types/oyun";

  let { seviye, ipucuAcik = false, hedefKalinlik = "normal", olcek = 1, kilit = false, duraklat = false, sag = false, tabakHedef, onTabaga, onSalla, onHazir }: {
    seviye: number;
    ipucuAcik?: boolean;
    /** Tabağın gittiği siparişin istediği kalınlık: dökme hedef halkası buna göre çizilir */
    hedefKalinlik?: Kalinlik;
    sag?: boolean;
    olcek?: number;
    kilit?: boolean;
    duraklat?: boolean;
    tabakHedef: () => { x: number; y: number } | null;
    onTabaga: (p: TabakParcasi) => void;
    onSalla: (siddet: number) => void;
    /** Tavadaki krep tabağa alınabilir hale gelince / bırakılınca (tabak parlar) */
    onHazir?: (hazir: boolean) => void;
  } = $props();

  // Görsel ölçüler (px): krep elipsi ve uçuş yüksekliği
  const KW = 170;
  const KH = 60;
  const UCUS_Y = 150;
  const KALINLIK = { ince: 3, normal: 7, kalin: 12 };
  const BOYUT = { ince: 0.93, normal: 1, kalin: 1 };
  // Oyuncuya yalnızca üç pişme görünümü: ÇİĞ (soluk), PİŞMİŞ (altın), YANIK (siyah)
  const RENK: Record<PismeDurumu, { merkez: string; kenar: string }> = {
    cig: { merkez: "var(--krep-cig)", kenar: "color-mix(in srgb, var(--krep-az) 45%, var(--krep-cig))" },
    pismis: { merkez: "var(--krep-orta)", kenar: "var(--krep-iyi)" },
    yanik: { merkez: "var(--krep-yanik)", kenar: "color-mix(in srgb, var(--krep-yanik) 80%, black)" },
  };
  const KABARCIK = [[28, 38], [52, 30], [70, 44], [40, 58], [62, 64], [82, 58], [20, 62]];

  // Seviye değişince (seviye atlama ya da geliştirici modu) kurallar anında yenilenir; tavadaki pişen krep etkilenmez
  const baglam = $derived(baglamOlustur(seviye, AYAR));
  /** Dökme hedefi: ince/kalın yalnızca tercihler açıkken; yoksa her zaman normal */
  const hedefMiktar = $derived(AYAR.hamur.hedef[baglam.tercihAcik ? hedefKalinlik : "normal"]);

  type Fx = { id: number; tur: "yildiz" | "damla" | "yazi" | "puf" | "kor"; x: number; y: number; dx: number; dy: number; txt?: string; sinif?: string; dogdu: number };

  let t = $state<Tava>(yeniTava());
  let fx = $state<Fx[]>([]);
  let parmakX = $state(0);
  let kayX = $state(0);
  let kayY = $state(0);

  let alanEl: HTMLElement;
  let govdeEl: HTMLElement;
  let kapEl: HTMLElement;
  let saat = 0;
  let fxNo = 0;
  let kayan: TabakParcasi | null = null;
  let dokSes = 0;
  let cizSes = 0;
  let dingAnahtar = "";
  let parilti = 0;
  let hedefTutturuldu = false;

  // ---- Türetilmiş görünüm ----
  const aktifP = $derived(t.p[t.yuz]);
  /** Şu an pişen yüzün oyuncuya görünen durumu */
  const durum = $derived<PismeDurumu | null>(t.faz === "pisir" ? pismeDurumu(aktifP, AYAR) : t.faz === "yanik" ? "yanik" : null);
  /** Hazır = bu yüz PİŞMİŞ: çevrilebilir (1. yüz) ya da tabağa alınabilir (son yüz) */
  const hazir = $derived(t.faz === "pisir" && durum === "pismis");
  /** Pişmiş penceresinin içinde en iyi an (kusursuz çevirme → PERFECT için) */
  const mukemmel = $derived(hazir && cevirKalitesi(aktifP, seviye, AYAR) === "mukemmel");
  /** Dökerken hamur hedefin toleransında mı (hedef halka yeşil) */
  const hedefte = $derived(t.faz === "doku" && hamurIcinde(t.hamur.miktar, hedefMiktar, seviye));
  const hal = $derived(
    t.faz === "yanik" ? "yanik" : t.faz === "ucus" ? "ucus" : t.faz === "doku" ? "doku" : hazir ? "hazir" : "normal",
  );


  /** Krep elipsinin genişliği ve kalınlığı: dökerken miktara, yayılırken son haline göre */
  const sekil = $derived.by(() => {
    const m = t.hamur.miktar;
    const dokW = KW * Math.min(1.08, 0.3 + 0.7 * Math.sqrt(m)) * (0.9 + 0.1 * t.hamur.yay);
    const dokD = Math.min(16, 2 + 7 * m);
    const sonW = KW * BOYUT[t.kalinlik];
    const sonD = KALINLIK[t.kalinlik];
    if (t.faz === "bos") return { w: 0, d: 0 };
    if (t.faz === "doku") return { w: dokW, d: dokD };
    if (t.faz === "yayil") {
      const e = 1 - (1 - t.hamur.yay) ** 3;
      return { w: dokW + (sonW - dokW) * e, d: dokD + (sonD - dokD) * e };
    }
    return { w: sonW, d: sonD };
  });

  /** Krep hareketi: anticipation → fırlama → havada dönüş → iniş zıplaması / kayma */
  const G = $derived.by(() => {
    const P = AYAR.pisirme;
    let x = 0, y = 0, sx = 1, sy = 1, rot = 0, yuz: 0 | 1 = t.yuz, yuk = 0;
    if (t.faz === "ucus") {
      yuz = 0;
      if (t.t < P.anticipSn) {
        const a = t.t / P.anticipSn;
        sy = 1 - 0.3 * a;
        sx = 1 + 0.14 * a;
        y = 5 * a;
      } else {
        const u = Math.min(1, (t.t - P.anticipSn) / P.ucusSn);
        const v = u + (0.5 * Math.sin(2 * Math.PI * u)) / (2 * Math.PI); // tepe noktasında yavaşlar (hang time)
        const th = (540 * v * Math.PI) / 180;
        const c = Math.cos(th);
        yuz = c >= 0 ? 0 : 1;
        yuk = 4 * v * (1 - v);
        y = -UCUS_Y * yuk;
        sy = Math.max(0.07, Math.abs(c)) * (u < 0.2 ? 1 + 0.22 * (1 - u / 0.2) : 1);
        sx = 1 - 0.05 * yuk;
        x = t.kayik * 70 * v;
        rot = t.egim * v;
      }
    } else if (t.faz === "kayma") {
      const u = Math.min(1, t.t / AYAR.pisirme.kaymaSn);
      const e = u * u * (3 - 2 * u);
      x = kayX * e;
      y = kayY * e - 26 * Math.sin(Math.PI * u);
      sx = 1 + 0.05 * Math.sin(Math.PI * u);
      sy = 1 - 0.08 * Math.sin(Math.PI * u);
      rot = t.egim * 0.4 * (1 - u);
    } else if (t.yuz === 1) {
      const lt = t.landT;
      const q = lt < 0.7 ? Math.exp(-9 * lt) * Math.cos(lt * 30) : 0;
      const guc = Math.abs(t.egim) > 8 ? 1.5 : 1;
      sy = 1 - 0.3 * q * guc;
      sx = 1 + 0.15 * q * guc;
      x = t.kayik * 70;
      rot = t.egim * (0.4 + 0.6 * Math.exp(-4 * lt)) * (1 + 0.2 * Math.cos(lt * 22) * Math.exp(-5 * lt));
    }
    return { x, y, sx, sy, rot, yuz, yuk };
  });

  const yuzP = $derived(t.faz === "ucus" ? (G.yuz === 0 ? t.p[0] : 0) : t.faz === "kayma" ? t.p[t.yuz] : t.faz === "pisir" || t.faz === "yanik" ? aktifP : 0);
  const gorunen = $derived<PismeDurumu>(t.faz === "yayil" || t.faz === "doku" ? "cig" : t.faz === "yanik" ? "yanik" : pismeDurumu(yuzP, AYAR));
  const merkez = $derived(RENK[gorunen].merkez);
  const kenar = $derived(RENK[gorunen].kenar);
  /** Hedef halka: hedef miktardaki krebin boyutu (dökerken yayılmayla birlikte) */
  const hedefW = $derived(KW * Math.min(1.08, 0.3 + 0.7 * Math.sqrt(hedefMiktar)) * (0.9 + 0.1 * t.hamur.yay));
  const yan = $derived(`color-mix(in srgb, var(--krep-yanik) 30%, ${kenar})`);
  const buhar = $derived(t.faz === "pisir" || t.faz === "yanik" ? Math.max(0, Math.min(1, (aktifP - 0.12) / 0.5)) : 0);
  const duman = $derived(t.faz === "yanik" ? 1 : t.faz === "pisir" ? Math.max(0, Math.min(1, (aktifP - AYAR.pisirme.fazlaP + 0.1) / 0.4)) : 0);
  const kabarcik = $derived(t.faz === "pisir" ? aktifP : 0);
  const kalkik = $derived(mukemmel);
  const servisHazir = $derived(servisEdilebilir(t, baglam));
  let hazirBildirildi = false;
  $effect(() => {
    const h = servisHazir;
    if (h !== hazirBildirildi) {
      hazirBildirildi = h;
      onHazir?.(h);
    }
  });
  onDestroy(() => {
    if (hazirBildirildi) onHazir?.(false);
  });
  const stilKrep = $derived(
    `transform: translate(${G.x}px, ${G.y}px) rotate(${G.rot}deg) scale(${G.sx}, ${G.sy})`,
  );
  const stilPan = $derived.by(() => {
    const P = AYAR.pisirme;
    if (t.faz !== "ucus") return "";
    if (t.t < P.anticipSn) return `transform: translateY(${(t.t / P.anticipSn) * 8}px)`;
    const u = (t.t - P.anticipSn) / P.ucusSn;
    return u < 0.18 ? `transform: translateY(${-14 * (1 - u / 0.18)}px) rotate(${-3 * (1 - u / 0.18)}deg)` : "";
  });

  const ipucu = $derived.by(() => {
    if (!ipucuAcik) return "";
    if (t.faz === "bos") return "👆 Basılı tut: hamur dök";
    if (t.faz === "doku") return "Bırak!";
    if (t.faz === "pisir" && t.yuz === 0 && !baglam.cevirmeAcik) return hazir ? "⬇️ Aşağı kaydır: tabağa!" : "Pişiyor…";
    if (t.faz === "pisir" && t.yuz === 0) return hazir ? "⬆️ Yukarı kaydır: çevir!" : "Pişiyor…";
    if (t.faz === "pisir" && t.yuz === 1) return hazir ? "⬇️ Aşağı kaydır: tabağa!" : "İkinci yüz…";
    if (t.faz === "yanik") return "Yandı!";
    return "";
  });

  // ---- Efektler ----
  function ekle(f: Omit<Fx, "id" | "dogdu">) {
    if (fx.length > 28) fx.shift();
    fx.push({ ...f, id: ++fxNo, dogdu: saat });
  }
  function yazi(txt: string, sinif: string) {
    ekle({ tur: "yazi", x: 125, y: 30, dx: 0, dy: -36, txt, sinif });
  }
  function patlat(x: number, y: number, n: number, tur: Fx["tur"] = "yildiz", txt = "⭐") {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random();
      const r = 40 + Math.random() * 40;
      ekle({ tur, x, y, dx: Math.cos(a) * r, dy: Math.sin(a) * r - 18, txt });
    }
  }
  const anim = (el: Element | undefined, kf: Keyframe[], ms: number) => el?.animate(kf, { duration: ms, easing: "ease-out" });
  const zipla = (g = 1) =>
    anim(govdeEl, [
      { transform: "none" },
      { transform: `translateY(${5 * g}px) scale(${1 + 0.04 * g}, ${1 - 0.06 * g})` },
      { transform: `translateY(${-4 * g}px) scale(${1 - 0.02 * g}, ${1 + 0.03 * g})` },
      { transform: "none" },
    ], 260);
  const salla = (g = 1) =>
    anim(govdeEl, [
      { transform: "rotate(0)" }, { transform: `rotate(${-5 * g}deg) translateY(${-6 * g}px)` },
      { transform: `rotate(${3 * g}deg)` }, { transform: `rotate(${-1.5 * g}deg)` }, { transform: "rotate(0)" },
    ], 420);

  function olayIsle(o: ReturnType<typeof tavaIlerlet>[number]) {
    switch (o) {
      case "tasti":
        yazi("ÇOK FAZLA!", "kotu");
        cal("plap");
        break;
      case "yayildi":
        cal("pop");
        break;
      case "indi": {
        const k = t.cevirme;
        cal("plap");
        salla(Math.abs(t.egim) > 8 ? 1.4 : 0.8);
        onSalla(k === "mukemmel" ? 0.7 : 0.4);
        if (k === "mukemmel") {
          yazi("MÜKEMMEL ÇEVİRİŞ!", "perfect");
          patlat(125, 100, 9);
          cal("parilti");
        } else if (k === "iyi") yazi("GÜZEL ÇEVİRİŞ", "iyi");
        else if (k === "erken") yazi("ERKEN ÇEVİRDİN", "kotu");
        else if (k === "gec") yazi("GEÇ ÇEVİRDİN", "kotu");
        else yazi("ISKA!", "kotu");
        break;
      }
      case "yandi":
        yazi("YANDI! 🔥", "kotu");
        patlat(125, 80, 5, "puf", "💨");
        cal("puf");
        onSalla(0.5);
        break;
      case "cop":
        patlat(125, 90, 4, "puf", "💨");
        break;
      case "tabaga":
        if (kayan) {
          cal("flop");
          onTabaga(kayan);
          kayan = null;
        }
        break;
    }
  }

  function adim(dt: number) {
    saat += dt;
    if (t.faz === "doku") {
      dokSes += dt;
      if (dokSes > 0.11) {
        dokSes = 0;
        cal("dok");
        if (Math.random() < 0.5) ekle({ tur: "damla", x: 125 + parmakX * 0.25 + (Math.random() - 0.5) * 60, y: 112, dx: (Math.random() - 0.5) * 70, dy: -20 - Math.random() * 20, txt: "·" });
      }
    }
    for (const o of tavaIlerlet(t, dt, baglam)) olayIsle(o);

    if (t.faz === "pisir") {
      cizSes += dt;
      if (cizSes > 0.28 && aktifP > 0.1) {
        cizSes = 0;
        if (Math.random() < 0.55) cal("cizirti");
      }
      const anahtar = `${t.yuz}${hazir}`;
      if (hazir && dingAnahtar !== anahtar) {
        cal("ding");
        zipla(0.8);
      }
      dingAnahtar = anahtar;
    } else dingAnahtar = "";
    if (t.faz === "doku" && hedefte && !hedefTutturuldu) {
      hedefTutturuldu = true;
      ekle({ tur: "yildiz", x: 125 + hedefW / 2 - 6, y: 92, dx: 10, dy: -16, txt: "✓" });
    }

    if (t.faz === "ucus" && t.cevirme === "mukemmel") {
      const u = (t.t - AYAR.pisirme.anticipSn) / AYAR.pisirme.ucusSn;
      parilti -= dt;
      if (u > 0.25 && u < 0.8 && parilti <= 0) {
        parilti = 0.07;
        ekle({ tur: "yildiz", x: 125 + (Math.random() - 0.5) * 150, y: 100 - UCUS_Y * 0.8 + (Math.random() - 0.5) * 50, dx: (Math.random() - 0.5) * 20, dy: 14, txt: "✨" });
      }
    }
    if (fx.length && saat - fx[0].dogdu > 1.3) fx = fx.filter((f) => saat - f.dogdu <= 1.3);
  }

  onMount(() => {
    let id = 0;
    let son = performance.now();
    const kare = (n: number) => {
      const dt = Math.min(0.1, (n - son) / 1000);
      son = n;
      if (!duraklat) adim(dt);
      id = requestAnimationFrame(kare);
    };
    id = requestAnimationFrame(kare);
    return () => cancelAnimationFrame(id);
  });

  // ---- Jestler ----
  let bas: { x: number; y: number } | null = null;
  let son: { x: number; y: number } | null = null;
  let tuketildi = false;

  function asagi(e: PointerEvent) {
    if (kilit) return;
    bas = son = { x: e.clientX, y: e.clientY };
    tuketildi = false;
    try {
      alanEl.setPointerCapture(e.pointerId);
    } catch {
      // yakalama desteklenmiyorsa jest yine çalışır
    }
    zipla(0.7);
    if (tavaDokBasla(t)) {
      parmakX = 0;
      dokSes = 0.2;
      hedefTutturuldu = false;
    }
  }

  function yukari() {
    const k = tavaCevir(t, baglam);
    if (!k) return false;
    cal("whoosh");
    salla(1.1);
    return true;
  }

  function asagiKaydir() {
    if (!servisEdilebilir(t, baglam)) return false;
    const r = kapEl.getBoundingClientRect();
    const h = tabakHedef();
    kayX = h ? (h.x - (r.left + r.width / 2)) / olcek : 0;
    kayY = h ? (h.y - (r.top + r.height / 2)) / olcek : 160;
    kayan = tavaServis(t, baglam);
    cal("whoosh");
    return true;
  }

  function hareket(e: PointerEvent) {
    if (!bas || !son) return;
    const dx = e.clientX - son.x;
    const dy = e.clientY - son.y;
    son = { x: e.clientX, y: e.clientY };
    if (t.faz === "doku") {
      tavaHareket(t, Math.hypot(dx, dy) / olcek, baglam);
      const r = alanEl.getBoundingClientRect();
      parmakX = Math.max(-60, Math.min(60, (e.clientX - r.left - r.width / 2) / olcek));
      return;
    }
    if (tuketildi) return;
    const yukariPx = (bas.y - e.clientY) / olcek;
    const yanPx = Math.abs(e.clientX - bas.x) / olcek;
    const esik = AYAR.cevirmePx;
    if (Math.abs(yukariPx) >= esik && Math.abs(yukariPx) > yanPx) {
      const ok = yukariPx > 0 ? yukari() : asagiKaydir();
      tuketildi = true;
      if (!ok) {
        salla(0.5);
        if (t.faz === "pisir" && durum === "cig") yazi("HENÜZ PİŞMEDİ!", "kotu");
      }
    }
  }

  function birak() {
    if (!bas) return;
    bas = son = null;
    const miktar = t.hamur.miktar;
    const s = tavaBirak(t, baglam);
    if (!s) return;
    if (!s.kalinlik) {
      // Hedefin toleransı dışında: krep olmaz, tava boşalır, hemen yeniden dökülebilir
      yazi(miktar < hedefMiktar ? "AZ HAMUR! 😅" : "ÇOK HAMUR! 😅", "kotu");
      patlat(125, 100, 3, "puf", "💨");
      cal("plap");
      return;
    }
    zipla(1.2);
    if (baglam.tercihAcik && s.kalinlik !== hedefKalinlik) {
      yazi(s.kalinlik === "ince" ? "İNCE" : s.kalinlik === "kalin" ? "KALIN" : "NORMAL", "kotu");
    } else if (s.mukemmel) {
      yazi("MÜKEMMEL DÖKÜŞ!", "perfect");
      patlat(125, 100, 6);
      cal("parilti");
    } else yazi("GÜZEL DÖKÜŞ", "iyi");
    cal("plap");
  }
</script>

<div class="slot" style:width={`${250 * olcek}px`} style:height={`${200 * olcek}px`}>
  <div
    class="alan"
    style:transform={`scale(${olcek})`}
    data-faz={t.faz}
    bind:this={alanEl}
    onpointerdown={asagi}
    onpointermove={hareket}
    onpointerup={birak}
    onpointercancel={birak}
    role="button"
    tabindex="0"
    aria-label="Tava: basılı tut hamur dök, yukarı kaydır çevir, aşağı kaydır tabağa al"
  >
    <div class="halka" class:acik={hazir} class:muk={mukemmel}></div>

    <!-- Hamur sürahisi ve akışı -->
    <div class="surahi" class:acik={t.faz === "doku"} style:left={`${125 + parmakX * 0.6 - 30}px`}>
      <i class="sap-s"></i><i class="kulp"></i>
    </div>
    {#if t.faz === "doku"}
      <div class="akis" style:left={`${125 + parmakX * 0.6 - 6}px`} style:width={`${10 + Math.min(1.2, t.hamur.miktar) * 5}px`}></div>
      <div
        class="hedef-halka"
        class:hedefte
        style:width={`${hedefW}px`}
        style:height={`${(hedefW * KH) / KW}px`}
        style:left={`${125 - hedefW / 2}px`}
        style:top={`${106 - (hedefW * KH) / KW / 2}px`}
      ></div>
    {/if}

    <div class="tava" style={stilPan}>
      <div class="isi"></div>
      <div class="govde" bind:this={govdeEl} data-hal={hal}>
        <div class="sap" class:sag></div>
        <div class="kasa">
          <div class="ic"></div>
          <div class="yuz"><i></i><i></i><b></b></div>
        </div>
      </div>

      <!-- Krep -->
      <div class="krep-kap" class:havada={t.faz === "ucus" || t.faz === "kayma"} bind:this={kapEl}>
        {#if t.faz === "ucus" && G.yuk > 0.02}
          <div class="golge" style:opacity={0.35 * (1 - G.yuk)} style:transform={`scale(${1 - 0.25 * G.yuk})`}></div>
        {/if}
        {#if t.faz !== "bos"}
          <div class="krep" style={stilKrep}>
            <div
              class="y"
              class:kalkik
              class:yanikli={gorunen === "yanik"}
              style:width={`${sekil.w}px`}
              style:height={`${(sekil.w * KH) / KW}px`}
              style:background={`radial-gradient(ellipse at 50% 42%, ${merkez} 0 50%, ${kenar} 100%)`}
              style:box-shadow={`0 ${sekil.d}px 0 ${yan}`}
              style:--sal={t.faz === "doku" ? "1" : "0"}
            >
              <span class="parlak"></span>
              {#each KABARCIK as [bx, by], i}
                {#if kabarcik > 0.18 + i * 0.07 && kabarcik < 1.3}
                  <span class="kab" style:left={`${bx}%`} style:top={`${by}%`} style:animation-delay={`${i * 0.17}s`}></span>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>

      {#each [0, 1, 2] as i}
        <span class="buhar" class:kara={duman > 0.15} style:--o={duman > 0.15 ? 0.25 + duman * 0.55 : buhar * 0.55} style:left={`${78 + i * 40}px`} style:animation-delay={`${i * 0.45}s`}></span>
      {/each}

      {#if hazir}
        <i class="kv k1">✦</i><i class="kv k2">✦</i><i class="kv k3">✦</i>
      {/if}

      {#if hazir && (t.faz === "pisir")}
        <div class="ok">{t.yuz === 0 ? "⬆" : "⬇"}</div>
      {/if}
    </div>

    <!-- Parçacıklar ve yazılar -->
    {#each fx as f (f.id)}
      <span class="fx {f.tur} {f.sinif ?? ''}" style:left={`${f.x}px`} style:top={`${f.y}px`} style:--dx={`${f.dx}px`} style:--dy={`${f.dy}px`}>{f.txt ?? ""}</span>
    {/each}

    {#if ipucu}<div class="ipucu">{ipucu}</div>{/if}
  </div>
</div>

<style>
  .slot { position: relative; flex: none; }
  .alan { position: absolute; left: 0; top: 0; width: 250px; height: 200px; transform-origin: top left; touch-action: none; user-select: none; -webkit-user-select: none; cursor: pointer; -webkit-tap-highlight-color: transparent; outline: none; }

  .halka { position: absolute; left: 0; top: 62px; width: 250px; height: 124px; border-radius: 50%; border: 4px solid var(--basari); opacity: 0; transform: scale(0.94); transition: opacity 0.15s, transform 0.15s; pointer-events: none; }
  .halka.acik { opacity: 0.45; transform: scale(1); }
  .halka.muk { opacity: 0.95; border-width: 6px; animation: nabiz 0.5s ease-in-out infinite; }

  .tava { position: absolute; left: 10px; top: 70px; width: 230px; height: 110px; transition: transform 0.08s; }
  .govde { position: absolute; inset: 0; }
  /* Boştayken tava hafifçe nefes alır, kenarında ışık gezer, altı ılık parlar (CSS translate: dokunma sıçramalarıyla çakışmaz) */
  .alan[data-faz="bos"] .govde { animation: tava-bos 3.4s ease-in-out infinite; }
  .isi { position: absolute; left: -8px; right: -8px; top: 38px; height: 84px; border-radius: 50%; background: radial-gradient(ellipse at 50% 55%, color-mix(in srgb, var(--renk-logo) 55%, transparent), transparent 70%); opacity: 0.22; animation: isi 2.8s ease-in-out infinite; pointer-events: none; }
  .kasa { overflow: hidden; }
  .kasa::after { content: ""; position: absolute; top: 0; bottom: 0; left: -30%; width: 18%; background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.28), transparent); transform: skewX(-20deg); animation: tava-isilti 6s ease-in-out infinite; pointer-events: none; }
  .kv { position: absolute; z-index: 10; color: var(--renk-logo); font-style: normal; font-size: 14px; line-height: 1; text-shadow: 0 1px 0 var(--kart); pointer-events: none; animation: kv 1.1s ease-in-out infinite; }
  .kv.k1 { left: 10px; top: 4px; } .kv.k2 { right: 8px; top: 18px; animation-delay: 0.35s; font-size: 18px; } .kv.k3 { left: 44%; top: -10px; animation-delay: 0.7s; }
  .y.yanikli::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 24% 42%, rgb(0 0 0 / 0.6) 0 6px, transparent 7px), radial-gradient(circle at 60% 28%, rgb(0 0 0 / 0.55) 0 5px, transparent 6px), radial-gradient(circle at 72% 60%, rgb(0 0 0 / 0.6) 0 7px, transparent 8px), radial-gradient(circle at 42% 68%, rgb(0 0 0 / 0.5) 0 4px, transparent 5px); }
  .sap { position: absolute; left: -62px; top: 38px; width: 92px; height: 17px; border-radius: 9px; background: linear-gradient(var(--sahne-tava), var(--sahne-tava-koyu)); transform: rotate(14deg); }
  .sap.sag { left: auto; right: -62px; transform: rotate(-14deg); }
  .kasa { position: absolute; inset: 0; border-radius: 50% / 46%; background: radial-gradient(ellipse at 50% 30%, var(--sahne-tava) 0%, var(--sahne-tava-koyu) 100%); box-shadow: 0 10px 0 rgb(0 0 0 / 0.2), inset 0 0 0 5px color-mix(in srgb, var(--sahne-tava) 70%, white); }
  .ic { position: absolute; left: 12px; right: 12px; top: 5px; height: 72px; border-radius: 50%; background: radial-gradient(ellipse at 50% 60%, var(--sahne-tava-koyu), color-mix(in srgb, var(--sahne-tava-koyu) 60%, black)); box-shadow: inset 0 3px 0 rgb(0 0 0 / 0.25); }

  .yuz { position: absolute; left: 0; right: 0; bottom: 9px; display: flex; justify-content: center; align-items: center; gap: 20px; }
  .yuz i { width: 10px; height: 13px; border-radius: 50%; background: var(--sahne-yuz); transform-origin: center; animation: goz 4s infinite; transition: height 0.12s, width 0.12s; }
  .yuz::before, .yuz::after { content: ""; position: absolute; bottom: -4px; width: 13px; height: 7px; border-radius: 50%; background: var(--vurgu); opacity: 0.4; }
  .yuz::before { left: 27%; } .yuz::after { right: 27%; }
  .yuz b { position: absolute; bottom: -7px; width: 16px; height: 8px; border-bottom: 3px solid var(--sahne-yuz); border-radius: 0 0 16px 16px; transition: all 0.12s; }
  [data-hal="doku"] .yuz b { height: 11px; width: 11px; border: 3px solid var(--sahne-yuz); border-radius: 50%; bottom: -9px; }
  [data-hal="hazir"] .yuz i { width: 13px; height: 17px; }
  [data-hal="hazir"] .yuz b { width: 20px; height: 10px; }
  [data-hal="ucus"] .yuz i { height: 4px; border-radius: 4px; }
  [data-hal="yanik"] .yuz b { border-bottom: 0; border-top: 3px solid var(--sahne-yuz); border-radius: 16px 16px 0 0; bottom: -4px; }
  [data-hal="yanik"] .yuz i { width: 12px; height: 16px; }

  .krep-kap { position: absolute; left: 30px; top: 6px; width: 170px; height: 60px; z-index: 3; pointer-events: none; }
  .krep-kap.havada { z-index: 8; }
  .krep { position: absolute; inset: 0; display: grid; place-items: center; transform-origin: 50% 70%; will-change: transform; }
  .y { position: relative; border-radius: 50%; }
  .y.kalkik { animation: kalk 0.5s ease-in-out infinite; }
  .y::after { content: ""; position: absolute; inset: 0; border-radius: 50%; animation: sal 0.2s linear infinite; opacity: var(--sal); box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.25); }
  .parlak { position: absolute; left: 14%; right: 14%; top: 8%; height: 30%; border-radius: 50%; background: linear-gradient(180deg, rgb(255 255 255 / 0.4), transparent); }
  .kab { position: absolute; width: 9px; height: 7px; margin: -3px 0 0 -4px; border-radius: 50%; background: rgb(255 255 255 / 0.5); box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.15); animation: kabar 1.1s ease-in-out infinite; }
  .golge { position: absolute; left: 10px; right: 10px; top: 24px; height: 22px; border-radius: 50%; background: rgb(0 0 0 / 1); }

  .buhar { position: absolute; top: 10px; z-index: 9; width: 22px; height: 22px; border-radius: 50%; background: rgb(255 255 255 / 0.85); opacity: 0; filter: blur(2px); pointer-events: none; animation: yuksel 1.4s ease-out infinite; }
  .buhar.kara { background: rgb(60 50 48 / 0.9); width: 28px; height: 28px; }

  .ok { position: absolute; left: 50%; top: -34px; z-index: 9; margin-left: -18px; width: 36px; text-align: center; font-size: 26px; font-weight: 900; color: var(--basari); text-shadow: 0 2px 0 var(--kart); animation: zipla 0.5s ease-in-out infinite; pointer-events: none; }

  .surahi { position: absolute; top: -4px; width: 60px; height: 46px; z-index: 7; opacity: 0; transform: translateY(-40px) rotate(0); transition: opacity 0.12s, transform 0.18s ease-out; pointer-events: none; }
  .surahi.acik { opacity: 1; transform: translateY(0) rotate(-32deg); }
  .surahi::before { content: ""; position: absolute; inset: 0; border-radius: 10px 10px 18px 18px; background: linear-gradient(180deg, var(--kart), var(--krep-cig)); border: 3px solid var(--kenar); box-shadow: 0 3px 0 var(--kenar); }
  .sap-s { position: absolute; right: -9px; top: 4px; width: 16px; height: 14px; background: var(--krep-cig); border-right: 3px solid var(--kenar); border-top: 3px solid var(--kenar); transform: skewY(25deg); }
  .kulp { position: absolute; left: -14px; top: 10px; width: 16px; height: 22px; border: 4px solid var(--kenar); border-right: 0; border-radius: 12px 0 0 12px; }

  .akis { position: absolute; top: 40px; height: 66px; z-index: 6; border-radius: 6px 6px 10px 10px; background: linear-gradient(90deg, var(--krep-cig), color-mix(in srgb, var(--krep-cig) 70%, white), var(--krep-cig)); animation: akisal 0.18s ease-in-out infinite alternate; pointer-events: none; transform-origin: top; }
  .hedef-halka { position: absolute; z-index: 9; border-radius: 50%; border: 3px dashed rgb(255 255 255 / 0.9); pointer-events: none; transition: border-color 0.12s, box-shadow 0.12s; }
  .hedef-halka.hedefte { border-color: var(--basari); border-style: solid; box-shadow: 0 0 0 4px color-mix(in srgb, var(--basari) 35%, transparent); }

  .ipucu { position: absolute; left: 50%; bottom: -8px; z-index: 9; transform: translateX(-50%); white-space: nowrap; padding: 4px 12px; border-radius: 999px; background: var(--kart); border: 1px solid var(--kenar); font-size: 13px; font-weight: 800; box-shadow: 0 2px 0 var(--kenar); pointer-events: none; }

  .fx { position: absolute; z-index: 12; pointer-events: none; transform: translate(-50%, -50%); animation: firla 0.9s ease-out forwards; font-size: 18px; }
  .fx.damla { color: var(--krep-cig); font-size: 34px; line-height: 0; animation-duration: 0.55s; }
  .fx.puf { font-size: 24px; animation-duration: 1.1s; }
  .fx.yazi { white-space: nowrap; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; padding: 2px 12px; border-radius: 12px; background: var(--kart); border: 2px solid var(--renk-ana); color: var(--renk-ana); animation: yazil 1.1s ease-out forwards; }
  .fx.yazi.perfect { border-color: var(--basari); color: var(--basari); font-size: 25px; }
  .fx.yazi.iyi { border-color: var(--renk-logo); color: var(--renk-ana); }
  .fx.yazi.kotu { border-color: var(--vurgu); color: var(--vurgu); }

  @keyframes tava-bos { 0%, 100% { translate: 0 0; rotate: 0deg; } 50% { translate: 0 -3px; rotate: -0.8deg; } }
  @keyframes isi { 50% { opacity: 0.38; } }
  @keyframes tava-isilti { 0%, 70% { transform: translateX(0) skewX(-20deg); } 100% { transform: translateX(900%) skewX(-20deg); } }
  @keyframes kv { 0%, 100% { transform: scale(0.4) rotate(0); opacity: 0.2; } 50% { transform: scale(1.1) rotate(45deg); opacity: 1; } }
  @keyframes nabiz { 50% { transform: scale(1.04); } }
  @keyframes goz { 0%, 92%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
  @keyframes kalk { 50% { transform: translateY(-4px) rotate(1.2deg); } }
  @keyframes sal { 50% { transform: translateX(1px); } }
  @keyframes kabar { 0% { transform: scale(0.3); opacity: 0; } 40% { transform: scale(1); opacity: 1; } 55% { transform: scale(1.3, 0.8); } 70% { transform: scale(0.2); opacity: 0; } 100% { opacity: 0; } }
  @keyframes yuksel { 0% { transform: translateY(14px) scale(0.6); opacity: 0; } 25% { opacity: var(--o); } 100% { transform: translateY(-46px) scale(1.4); opacity: 0; } }
  @keyframes zipla { 50% { transform: translateY(-7px); } }
  @keyframes akisal { from { transform: scaleX(0.88); } to { transform: scaleX(1.05); } }
  @keyframes firla { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); opacity: 0; } }
  @keyframes yazil { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 18% { transform: translate(-50%, -50%) scale(1.18); opacity: 1; } 32% { transform: translate(-50%, -50%) scale(1); } 80% { opacity: 1; } 100% { transform: translate(-50%, calc(-50% + var(--dy))) scale(1); opacity: 0; } }
</style>
