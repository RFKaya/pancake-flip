<script lang="ts">
  // Servis ekranı: duvarda sipariş fişi, ortada tava(lar), yakında tabak. Tavalar Tava.svelte'dedir:
  // basılı tut = hamur dök, yukarı kaydır = çevir, aşağı kaydır = tabağa al. Kurallar saf mantıktan gelir.
  import { degerlendir } from "$lib/oyun/degerlendirme";
  import { kayit } from "$lib/kayit.svelte";
  import { AYAR, BOLUMLER, MALZEMELER, malzeme, TIPLER } from "$lib/oyun/veri";
  import { gelirHesapla, siparisFiyati } from "$lib/oyun/ekonomi";
  import { rngOlustur } from "$lib/oyun/rng";
  import { siparisUret } from "$lib/oyun/siparis";
  import { cal } from "$lib/oyun/ses";
  import { onMount } from "svelte";
  import Tava from "./Tava.svelte";
  import type { Sonuc, TabakParcasi } from "../../types/oyun";

  let { bolumNo }: { bolumNo: number } = $props();

  // svelte-ignore state_referenced_locally
  const bolum = BOLUMLER.find((b) => b.id === bolumNo) ?? BOLUMLER[0];
  const sonrakiBolum = BOLUMLER.find((b) => b.id === bolum.id + 1);
  const menu = bolum.menu.map(malzeme);
  const TOPLAM = bolum.musteriSayisi;
  const tavaSayisi = bolum.tava;
  const olcek = tavaSayisi > 1 ? 0.62 : 1;

  const rng = rngOlustur(Math.floor(Math.random() * 1e9));
  const yeniSiparis = () => siparisUret(bolum, MALZEMELER, TIPLER[0], AYAR, rng);

  let siparis = $state(yeniSiparis());
  let tabak = $state<TabakParcasi[]>([]);
  let tamam = $state(0);
  let puan = $state(0);
  let net = $state(0);
  let sonuc = $state<{ s: Sonuc; neden: string; sayi: number } | null>(null);
  let bitti = $state(false);
  let tekrar = $state(0);
  let dusenler = $state<{ id: number; ikon: string }[]>([]);
  let coinler = $state<{ id: number; dx: number }[]>([]);
  let sayac = 0;

  let sahneEl: HTMLElement;
  let tabakEl: HTMLElement;
  let kuleEl: HTMLElement;
  let coinEl: HTMLElement;

  const ilerleme = $derived(tamam / TOPLAM);
  const kazanc = $derived(Math.round(net));
  const yildiz = $derived(puan / TOPLAM >= 90 ? 3 : puan / TOPLAM >= 70 ? 2 : puan / TOPLAM >= 45 ? 1 : 0);

  // Fişteki satırlardan hangisi tabakta doğru yerinde (✓)
  const dogruSayi = $derived.by(() => {
    let i = 0;
    while (i < tabak.length && tabak[i].malzeme === siparis.parcalar[i]) i++;
    return i;
  });
  const siradaki = $derived(dogruSayi === tabak.length ? (siparis.parcalar[tabak.length] ?? "ver") : null);
  const krepSayisi = $derived(siparis.parcalar.filter((id) => id === "krep").length);
  const ekler = $derived(siparis.parcalar.filter((id) => id !== "krep").map((id) => malzeme(id).ad));

  onMount(() => {
    kayit.yukle();
  });

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
    if (bitti) return;
    if (tabak.length >= AYAR.tabakMax) return;
    tabak.push(p);
    tabakZipla(1.2);
    salla(0.5);
  }

  /** Krep tabağın neresine düşecek: kulenin üst yüzü */
  function tabakHedef() {
    if (!kuleEl) return null;
    const r = kuleEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top - 8 };
  }

  function koy(id: string) {
    if (bitti || tabak.length >= AYAR.tabakMax) return;
    tabak.push({ malzeme: id });
    dusenler.push({ id: ++sayac, ikon: malzeme(id).ikon });
    if (dusenler.length > 4) dusenler.shift();
    tabakZipla(0.8);
    cal("malzeme");
  }

  function bosalt() {
    if (!tabak.length) return;
    tabak = [];
    tabakZipla(0.6);
    cal("cop");
  }

  const YAZI: Record<Sonuc, string> = { perfect: "PERFECT!", great: "GREAT", good: "GOOD", olmadi: "OLMADI" };

  function ver() {
    if (bitti || !tabak.length) return;
    const d = degerlendir(siparis.parcalar, tabak, 1, AYAR);
    const ilk = d.hatalar[0];
    const neden = !ilk ? "" : ilk.tur === "eksik" ? `Eksik: ${malzeme(ilk.malzeme).ad}`
      : ilk.tur === "fazla" ? `Fazla: ${malzeme(ilk.malzeme).ad}`
      : ilk.tur === "yanlis" ? `${malzeme(ilk.malzeme).ad} yanlıştı`
      : ilk.tur === "sira" ? "Sıra hatası"
      : ilk.tur === "cig" ? `${ilk.sira}. krep çiğ` : `${ilk.sira}. krep fazla pişti`;
    sonuc = { s: d.sonuc, neden, sayi: tamam + 1 };
    puan += d.kalite;
    const maliyet = siparis.parcalar.reduce((t, p) => t + malzeme(p).maliyet, 0);
    net += gelirHesapla({ fiyat: siparisFiyati(siparis, MALZEMELER), sonuc: d.sonuc, tip: TIPLER[0], sabirOrani: 1, combo: 1, bolumNo: bolum.id, ayar: AYAR }).toplam - maliyet;
    tamam++;
    // Madeni para patlaması + sayaç zıplaması
    if (d.sonuc !== "olmadi") {
      const n = d.sonuc === "perfect" ? 6 : 3;
      for (let i = 0; i < n; i++) coinler.push({ id: ++sayac, dx: (i - (n - 1) / 2) * 22 });
      setTimeout(() => anim(coinEl, [{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(1)" }], 300), 350);
      cal("coin");
    }
    if (d.sonuc === "perfect") salla(1);
    tabak = [];
    cal(d.sonuc);
    if (tamam >= TOPLAM) {
      bitti = true;
      kayit.servisKaydet(bolum.id, yildiz, net);
    } else siparis = yeniSiparis();
    setTimeout(() => (sonuc = null), 1500);
  }

  function yeniden() {
    tamam = 0;
    puan = 0;
    net = 0;
    tabak = [];
    siparis = yeniSiparis();
    bitti = false;
    sonuc = null;
    tekrar++;
  }
</script>

<div class="sahne" bind:this={sahneEl}>
  <header class="ust">
    <a class="geri" href="/" aria-label="Bölümler">←</a>
    <span class="bolum-no">Bölüm {bolum.id}</span>
    <div class="cubuk" aria-label={`İlerleme ${tamam}/${TOPLAM}`}>
      <div class="dolu" style:width={`${ilerleme * 100}%`}></div>
      <span class="yildiz">{bitti ? ["☆", "⭐"][yildiz > 0 ? 1 : 0] : "⭐"}</span>
    </div>
    <span class="para" bind:this={coinEl}>🪙 {kazanc}</span>
  </header>

  <!-- Duvar: sipariş fişi, raf, kavanozlar -->
  <div class="duvar" aria-hidden="false">
    <aside class="fis" aria-label="Sipariş">
      <i class="igne"></i>
      <b class="fis-ust">{krepSayisi === 1 && !ekler.length ? "1 sade krep" : `${krepSayisi} krep`}</b>
      {#if ekler.length}<small class="fis-ek">+ {ekler.join(", ")}</small>{/if}
      <div class="mini">
        {#each siparis.parcalar as id, i}
          <div class="satir" class:bitti={i < dogruSayi} class:siradaki={i === dogruSayi && siradaki === id}>
            {#if id === "krep"}<span class="m-krep"></span>{:else}<span class="m-ek">{malzeme(id).ikon}</span>{/if}
            {#if i < dogruSayi}<em>✓</em>{/if}
          </div>
        {/each}
      </div>
    </aside>
    <div class="raf">
      <span class="kavanoz k1"><i></i></span>
      <span class="kavanoz k2"><i></i></span>
      <span class="kavanoz k3"><i></i></span>
      <span class="bitki">🪴</span>
    </div>
  </div>

  <!-- Tezgâh: tava(lar) + tabak -->
  <main class="tezgah">
    {#key tekrar}
      <div class="tavalar" class:cift={tavaSayisi > 1}>
        {#each Array(tavaSayisi) as _, i}
          <Tava {bolumNo} {olcek} kilit={bitti} sag={tavaSayisi > 1 && i === 1} {tabakHedef} onTabaga={tabagaGeldi} onSalla={salla} />
        {/each}
      </div>
    {/key}

    <div class="tabak" bind:this={tabakEl}>
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
    </div>
  {/if}

  <footer class="alt-bar">
    {#each menu as m (m.id)}
      <button class="dugme" class:parlak={siradaki === m.id} onpointerdown={() => koy(m.id)}>
        <span>{m.ikon}</span><small>{m.ad}</small>
      </button>
    {/each}
    <button class="dugme ver" class:parlak={siradaki === "ver"} onpointerdown={ver}><span>✅</span><small>Ver</small></button>
    <button class="dugme kucuk" onpointerdown={bosalt} aria-label="Tabağı boşalt"><span>🗑</span><small>Boşalt</small></button>
  </footer>

  {#if bitti}
    <div class="perde">
      <div class="pencere">
        <h2>Tamamlandı!</h2>
        <div class="yildizlar">{#each [1, 2, 3] as n}<span>{yildiz >= n ? "⭐" : "☆"}</span>{/each}</div>
        <p>Ortalama kalite: <b>{Math.round(puan / TOPLAM)}</b> · Kazanç: <b>{kazanc >= 0 ? "+" : ""}{kazanc} 🪙</b></p>
        {#if yildiz === 0}<p class="uyari">Sonraki bölüm için en az 1 yıldız gerekir. Tekrar dene!</p>{/if}
        {#if yildiz >= 1 && sonrakiBolum}<a class="btn" href={`/servis/${sonrakiBolum.id}`}>Sonraki bölüm ▶</a>{/if}
        <button class="btn ikincil" onclick={yeniden}>Tekrar oyna</button>
        <a class="btn ikincil" href="/">Bölümler</a>
      </div>
    </div>
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

  .ust { position: relative; z-index: 10; display: flex; align-items: center; gap: 8px; width: 100%; }
  .geri { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--kart); border: 1px solid var(--kenar); font-size: 18px; }
  .bolum-no { padding: 4px 10px; border-radius: 999px; background: var(--kart); font-size: 14px; font-weight: 700; }
  .cubuk { position: relative; flex: 1; height: 14px; border-radius: 8px; background: var(--kart); border: 2px solid var(--kenar); }
  .dolu { height: 100%; border-radius: 6px; background: var(--basari); transition: width 0.4s; }
  .yildiz { position: absolute; right: -6px; top: -9px; font-size: 24px; }
  .para { padding: 4px 10px; border-radius: 999px; background: var(--kart); border: 1px solid var(--kenar); font-size: 14px; font-weight: 800; }

  /* Duvar */
  .duvar { position: relative; flex: none; width: calc(100% + 24px); height: 150px; margin: 0 -12px; }
  .fis { position: absolute; left: 14px; top: 6px; z-index: 5; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 92px; max-width: 120px; padding: 12px 10px 8px; border-radius: 6px 6px 14px 14px; background: var(--kart); border: 1px solid var(--kenar); box-shadow: 0 4px 0 var(--kenar); transform: rotate(-2deg); font-size: 12px; text-align: center; }
  .igne { position: absolute; top: -6px; left: 50%; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: var(--vurgu); box-shadow: 0 2px 0 rgb(0 0 0 / 0.2); }
  .fis-ust { font-size: 13px; }
  .fis-ek { font-size: 10px; color: var(--yazi-soluk); line-height: 1.15; }
  .mini { display: flex; flex-direction: column-reverse; align-items: center; gap: 1px; margin-top: 4px; }
  .satir { position: relative; display: grid; place-items: center; min-width: 60px; transition: opacity 0.2s, transform 0.2s; }
  .satir.bitti { opacity: 0.45; }
  .satir.siradaki { animation: parla-s 0.8s ease-in-out infinite; }
  .satir em { position: absolute; right: -2px; top: -3px; font-style: normal; font-size: 11px; font-weight: 900; color: var(--basari); }
  .m-krep { display: block; width: 56px; height: 9px; border-radius: 5px; background: var(--krep-orta); box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.2); }
  .m-ek { font-size: 11px; line-height: 11px; }

  .raf { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: var(--sahne-tezgah-koyu); box-shadow: 0 5px 0 rgb(0 0 0 / 0.12); }
  .kavanoz { position: absolute; bottom: 10px; width: 30px; height: 40px; border-radius: 6px 6px 10px 10px; background: color-mix(in srgb, var(--sahne-tabak) 35%, white); border: 2px solid color-mix(in srgb, var(--sahne-tabak) 50%, white); }
  .kavanoz::before { content: ""; position: absolute; left: 3px; right: 3px; top: -9px; height: 9px; border-radius: 4px; background: var(--renk-ana); }
  .kavanoz i { position: absolute; left: 3px; right: 3px; bottom: 3px; height: 55%; border-radius: 3px 3px 6px 6px; background: var(--krep-az); }
  .k1 { right: 92px; animation: kavanoz 5s ease-in-out infinite; }
  .k2 { right: 56px; height: 32px; animation: kavanoz 5s ease-in-out 1.7s infinite; } .k2 i { background: var(--vurgu); }
  .k3 { right: 20px; height: 46px; width: 28px; animation: kavanoz 5s ease-in-out 3.1s infinite; } .k3 i { background: var(--krep-iyi); }
  .bitki { position: absolute; left: 150px; bottom: 8px; font-size: 34px; transform-origin: 50% 90%; animation: yelpaze 4s ease-in-out infinite; }

  /* Tezgâh */
  .tezgah { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: calc(100% + 24px); margin: 0 -12px; padding-bottom: 80px; background: linear-gradient(180deg, var(--sahne-tezgah) 0%, var(--sahne-tezgah-koyu) 100%); }
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

  .mesaj { position: absolute; left: 50%; top: 42%; z-index: 20; padding: 10px 20px; border-radius: 16px; border: 2px solid var(--renk-ana); background: var(--kart); text-align: center; pointer-events: none; animation: patla 0.45s ease-out forwards; transform: translateX(-50%); }
  .mesaj .ana { font-size: 34px; font-weight: 900; color: var(--renk-ana); }
  .mesaj.perfect { border-color: var(--basari); } .mesaj.perfect .ana { color: var(--basari); font-size: 42px; }
  .mesaj.olmadi { border-color: var(--vurgu); } .mesaj.olmadi .ana { color: var(--vurgu); }
  .mesaj .alt { font-size: 14px; }

  .alt-bar { position: absolute; left: 12px; right: 12px; bottom: calc(10px + env(safe-area-inset-bottom)); z-index: 10; display: flex; gap: 8px; }
  .dugme { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 64px; padding: 4px 2px; border: 2px solid var(--kenar); border-radius: 16px; background: var(--kart); box-shadow: 0 4px 0 var(--kenar); touch-action: none; -webkit-tap-highlight-color: transparent; }
  .dugme:active { transform: translateY(4px) scale(0.97); box-shadow: none; }
  .dugme span { font-size: 26px; line-height: 1; }
  .dugme small { font-size: 11px; }
  .dugme.ver { flex: 1.6; border-color: var(--basari); }
  .dugme.kucuk { flex: 0.8; min-height: 56px; align-self: center; }
  .dugme.parlak { animation: parla 0.9s ease-in-out infinite; }

  .perde { position: absolute; inset: 0; z-index: 30; display: grid; place-items: center; padding: 16px; background: color-mix(in srgb, var(--renk-koyu) 70%, transparent); }
  .pencere { width: 100%; max-width: 320px; padding: 22px; border-radius: 18px; background: var(--kart); text-align: center; display: flex; flex-direction: column; gap: 10px; }
  .pencere h2 { margin: 0; }
  .yildizlar { font-size: 44px; }
  .uyari { margin: 0; color: var(--vurgu); font-size: 14px; }
  .ikincil { background: var(--zemin); color: var(--yazi); border: 1px solid var(--kenar); }

  @keyframes patla { 0% { transform: translateX(-50%) scale(0.5); opacity: 0; } 60% { transform: translateX(-50%) scale(1.12); opacity: 1; } 100% { transform: translateX(-50%) scale(1); } }
  @keyframes parla { 50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--renk-ana) 45%, transparent); } }
  @keyframes parla-s { 50% { transform: scale(1.12); } }
  @keyframes kavanoz { 0%, 90%, 100% { transform: none; } 94% { transform: translateY(-3px) rotate(-4deg); } 97% { transform: rotate(3deg); } }
  @keyframes yelpaze { 50% { transform: rotate(4deg); } }
  @keyframes dus { 0% { transform: translateY(-130px) scale(0.8); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(0) scale(1.1, 0.7); opacity: 0; } }
  @keyframes coin { 0% { transform: translate(0, 0) scale(0.6); opacity: 1; } 100% { transform: translate(calc(var(--dx) * 1.5), -300px) scale(1); opacity: 0; } }
</style>
