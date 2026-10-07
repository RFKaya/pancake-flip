<script lang="ts">
  // Hızlı mod: hedef sipariş kartı + yüzlü tava + büyük tabak. Dokun = hamur dök / çevir, yukarı kaydır = çevir.
  // Kurallar mevcut saf mantıktan gelir (siparis, pisirme, degerlendirme); müşteri ve sabır yok.
  import { onMount } from "svelte";
  import { degerlendir } from "$lib/oyun/degerlendirme";
  import { jest } from "$lib/oyun/jest";
  import { bolgeBul, tavaIlerlet, yeniTava, type Tava } from "$lib/oyun/pisirme";
  import { rngOlustur } from "$lib/oyun/rng";
  import { AYAR, BOLUMLER, MALZEMELER, malzeme, TIPLER } from "$lib/oyun/servis.svelte";
  import { siparisUret } from "$lib/oyun/siparis";
  import { cal } from "$lib/oyun/ses";
  import type { PismeBolgesi, Sonuc, TabakParcasi } from "../../types/oyun";

  const bolum = BOLUMLER[5]; // menüde çikolata, çilek sosu, çilek dilimi
  const menu = bolum.menu.map(malzeme);
  const TOPLAM = 6;

  const rng = rngOlustur(Math.floor(Math.random() * 1e9));
  const yeniSiparis = () => siparisUret(bolum, MALZEMELER, TIPLER[0], AYAR, rng);

  let siparis = $state(yeniSiparis());
  let tava = $state<Tava>(yeniTava());
  let tabak = $state<TabakParcasi[]>([]);
  let ucus = $state<PismeBolgesi | null>(null);
  let tavaSalla = $state(0);
  let tabakSalla = $state(0);
  let tamam = $state(0);
  let puan = $state(0);
  let sonuc = $state<{ s: Sonuc; neden: string; sayi: number } | null>(null);
  let bitti = $state(false);

  const bolge = $derived(tava.durum === "yanik" ? "yanik" : bolgeBul(tava.p, AYAR));
  const oran = $derived(Math.min(1, tava.p / AYAR.bolgeler.iyi));
  const ilerleme = $derived(tamam / TOPLAM);
  const yildiz = $derived(puan / TOPLAM >= 90 ? 3 : puan / TOPLAM >= 70 ? 2 : puan / TOPLAM >= 45 ? 1 : 0);

  onMount(() => {
    let id = 0;
    let son = performance.now();
    const kare = (t: number) => {
      const dt = Math.min(0.1, (t - son) / 1000);
      son = t;
      if (tavaIlerlet(tava, dt, AYAR)) tava = yeniTava();
      id = requestAnimationFrame(kare);
    };
    id = requestAnimationFrame(kare);
    return () => cancelAnimationFrame(id);
  });

  function dokun() {
    if (ucus || bitti) return;
    if (tava.durum === "bos") {
      tava = { durum: "pisiyor", p: 0, yanikSn: 0 };
      cal("hamur");
    } else if (tava.durum === "pisiyor") cevir();
  }

  function cevir() {
    if (ucus || bitti || tava.durum !== "pisiyor") return;
    ucus = bolgeBul(tava.p, AYAR);
    tava = yeniTava();
    tavaSalla++;
    cal("cevir");
  }

  function indi() {
    if (!ucus) return;
    tabak.push({ malzeme: "krep", pisme: ucus });
    ucus = null;
    tabakSalla++;
  }

  function koy(id: string) {
    if (ucus || bitti || tabak.length >= AYAR.tabakMax) return;
    tabak.push({ malzeme: id });
    tabakSalla++;
    cal("malzeme");
  }

  function bosalt() {
    tabak = [];
    cal("cop");
  }

  const YAZI: Record<Sonuc, string> = { perfect: "PERFECT!", great: "GREAT", good: "GOOD", olmadi: "OLMADI" };

  function ver() {
    if (ucus || bitti || !tabak.length) return;
    const d = degerlendir(siparis.parcalar, tabak, 1, AYAR);
    const ilk = d.hatalar[0];
    const neden = !ilk ? "" : ilk.tur === "eksik" ? `Eksik: ${malzeme(ilk.malzeme).ad}`
      : ilk.tur === "fazla" ? `Fazla: ${malzeme(ilk.malzeme).ad}`
      : ilk.tur === "yanlis" ? `${malzeme(ilk.malzeme).ad} yanlıştı`
      : ilk.tur === "sira" ? "Sıra hatası"
      : ilk.tur === "cig" ? `${ilk.sira}. krep çiğ` : `${ilk.sira}. krep fazla pişti`;
    sonuc = { s: d.sonuc, neden, sayi: tamam + 1 };
    puan += d.kalite;
    tamam++;
    tabak = [];
    cal(d.sonuc);
    if (tamam >= TOPLAM) bitti = true;
    else siparis = yeniSiparis();
    setTimeout(() => (sonuc = null), 1500);
  }

  function yeniden() {
    tamam = 0;
    puan = 0;
    tabak = [];
    tava = yeniTava();
    siparis = yeniSiparis();
    bitti = false;
    sonuc = null;
  }

  const secenek = $derived({ dokun, yukari: cevir, px: AYAR.cevirmePx, ms: AYAR.cevirmeMs });
  const siradaki = $derived.by(() => {
    for (let i = 0; i < tabak.length; i++) if (tabak[i].malzeme !== siparis.parcalar[i]) return null;
    return siparis.parcalar[tabak.length] ?? "ver";
  });
</script>

<div class="sahne">
  <header class="ust">
    <a class="geri" href="/" aria-label="Bölümler">←</a>
    <div class="cubuk" aria-label={`İlerleme ${tamam}/${TOPLAM}`}>
      <div class="dolu" style:width={`${ilerleme * 100}%`}></div>
      <span class="yildiz">{bitti ? ["☆", "⭐"][yildiz > 0 ? 1 : 0] : "⭐"}</span>
    </div>
  </header>

  <div class="raf-dekor"></div>
  <div class="dekor" aria-hidden="true">🫙🪴</div>

  <aside class="hedef">
    <b>Hedef sipariş</b>
    <div class="mini">
      {#each siparis.parcalar as id}
        {#if id === "krep"}<div class="m-krep"></div>{:else}<div class="m-ek">{malzeme(id).ikon}</div>{/if}
      {/each}
    </div>
  </aside>

  <!-- Tava -->
  <div class="tava-alan" use:jest={secenek} role="button" tabindex="0" aria-label="Tava: dokun ya da yukarı kaydır">
    <div class="tava" class:salla={tavaSalla > 0} data-k={tavaSalla}>
      <div class="sap"></div>
      <div class="govde">
        {#if tava.durum !== "bos"}<div class="pkrep {bolge}" style:--yuk={`${4 + oran * 10}px`}></div>{/if}
        {#if bolge === "fazla" || bolge === "yanik"}<span class="duman">💨</span>{/if}
        <div class="yuz"><i></i><i></i><b></b></div>
      </div>
    </div>
    <div class="ipucu">
      {#if tava.durum === "bos"}Hamur dökmek için dokun
      {:else if bolge === "cig" || bolge === "az"}Pişiyor…
      {:else}Şimdi çevir! ↑{/if}
    </div>
    <div class="pisme"><div class="p-dolgu" style:width={`${oran * 100}%`}></div></div>

    {#if ucus}
      <div class="ucan {ucus}" onanimationend={indi}></div>
    {/if}
  </div>

  <!-- Tabak -->
  {#key tabakSalla}
    <div class="tabak" class:sallan={tabakSalla > 0}>
      <div class="kule">
        {#each tabak as p, i (i)}
          {#if p.malzeme === "krep"}<div class="t-krep {p.pisme}"></div>
          {:else}<div class="t-ek">{malzeme(p.malzeme).ikon}</div>{/if}
        {/each}
      </div>
      <div class="plaka"></div>
    </div>
  {/key}

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
    <button class="dugme" onpointerdown={bosalt}><span>🗑</span><small>Boşalt</small></button>
  </footer>

  {#if bitti}
    <div class="perde">
      <div class="pencere">
        <h2>Tamamlandı!</h2>
        <div class="yildizlar">{#each [1, 2, 3] as n}<span>{yildiz >= n ? "⭐" : "☆"}</span>{/each}</div>
        <p>Ortalama kalite: <b>{Math.round(puan / TOPLAM)}</b></p>
        <button class="btn" onclick={yeniden}>Tekrar oyna</button>
        <a class="btn ikincil" href="/">Bölümler</a>
      </div>
    </div>
  {/if}
</div>

<style>
  .sahne {
    --d: 420px;
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
    background:
      linear-gradient(180deg, var(--sahne-tezgah) 0, var(--sahne-tezgah-koyu) 100%) bottom / 100% 36% no-repeat,
      linear-gradient(180deg, var(--sahne-duvar) 0%, var(--sahne-duvar-koyu) 100%);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .ust { display: flex; align-items: center; gap: 10px; width: 100%; }
  .raf-dekor { position: absolute; left: 0; right: 0; top: 150px; height: 10px; background: var(--sahne-tezgah-koyu); box-shadow: 0 5px 0 #0002; }
  .dekor { position: absolute; top: 96px; right: 18px; font-size: 38px; letter-spacing: 6px; opacity: 0.9; }
  .geri { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--kart); border: 1px solid var(--kenar); font-size: 18px; }
  .cubuk { position: relative; flex: 1; height: 16px; border-radius: 8px; background: var(--kart); border: 2px solid var(--kenar); }
  .dolu { height: 100%; border-radius: 6px; background: var(--basari); transition: width 0.4s; }
  .yildiz { position: absolute; right: -6px; top: -8px; font-size: 26px; }

  .hedef { position: absolute; left: 12px; top: 64px; z-index: 5; padding: 8px 10px; border-radius: 14px; background: var(--kart); border: 1px solid var(--kenar); font-size: 12px; text-align: center; box-shadow: 0 3px 0 var(--kenar); }
  .mini { display: flex; flex-direction: column-reverse; align-items: center; gap: 1px; margin-top: 6px; min-width: 56px; }
  .m-krep { width: 52px; height: 9px; border-radius: 5px; background: var(--krep-orta); box-shadow: inset 0 -2px 0 #0003; }
  .m-ek { font-size: 10px; line-height: 10px; }

  .tava-alan { position: relative; margin-top: 90px; width: 100%; height: 190px; display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  .tava { position: relative; width: 230px; height: 90px; margin-top: 36px; }
  .tava.salla { animation: salla 0.4s ease-out; }
  .sap { position: absolute; left: -62px; top: 30px; width: 90px; height: 16px; border-radius: 8px; background: linear-gradient(var(--sahne-tava), var(--sahne-tava-koyu)); transform: rotate(-14deg); }
  .govde { position: absolute; inset: 0; border-radius: 50% / 45%; background: radial-gradient(ellipse at 50% 30%, var(--sahne-tava) 0%, var(--sahne-tava-koyu) 100%); box-shadow: 0 10px 0 #0003, inset 0 0 0 5px color-mix(in srgb, var(--sahne-tava) 70%, white); }
  .pkrep { position: absolute; left: 12%; right: 12%; top: calc(8px - var(--yuk)); height: calc(34px + var(--yuk)); border-radius: 50%; box-shadow: inset 0 -6px 0 #0003; transition: background 0.25s; }
  .yuz { position: absolute; left: 0; right: 0; bottom: 14px; display: flex; justify-content: center; align-items: center; gap: 18px; }
  .yuz i { width: 9px; height: 12px; border-radius: 50%; background: var(--sahne-yuz); }
  .yuz::before, .yuz::after { content: ""; position: absolute; bottom: -4px; width: 12px; height: 7px; border-radius: 50%; background: var(--vurgu); opacity: 0.35; }
  .yuz::before { left: 28%; } .yuz::after { right: 28%; }
  .yuz b { position: absolute; bottom: -6px; width: 16px; height: 8px; border-bottom: 3px solid var(--sahne-yuz); border-radius: 0 0 16px 16px; }

  .pkrep, .ucan, .t-krep, .m-krep { background-image: linear-gradient(180deg, #ffffff40 0 38%, transparent 38%); }
  .pkrep.cig, .ucan.cig, .t-krep.cig { background: var(--krep-cig); }
  .pkrep.az, .ucan.az, .t-krep.az { background: var(--krep-az); }
  .pkrep.orta, .ucan.orta, .t-krep.orta { background: var(--krep-orta); }
  .pkrep.iyi, .ucan.iyi, .t-krep.iyi { background: var(--krep-iyi); }
  .pkrep.fazla, .ucan.fazla, .t-krep.fazla { background: var(--krep-fazla); }
  .pkrep.yanik, .ucan.yanik, .t-krep.yanik { background: var(--krep-yanik); }

  .duman { position: absolute; top: -34px; right: 30px; font-size: 28px; animation: yuksel 1s ease-out infinite; }
  .ipucu { margin-top: 18px; padding: 4px 14px; border-radius: 999px; background: var(--kart); font-size: 14px; font-weight: 700; color: var(--yazi); }
  .pisme { width: 140px; height: 8px; margin-top: 6px; border-radius: 4px; background: var(--kart); border: 1px solid var(--kenar); overflow: hidden; }
  .p-dolgu { height: 100%; background: linear-gradient(90deg, var(--krep-az), var(--basari) 60%, var(--renk-ana) 85%, var(--vurgu)); }

  .ucan { position: absolute; left: calc(50% - 85px); top: 70px; width: 170px; height: 38px; border-radius: 50%; box-shadow: inset 0 -6px 0 #0003; animation: ucus 0.7s cubic-bezier(0.3, 0.1, 0.5, 1) forwards; z-index: 6; }

  .tabak { position: absolute; left: 0; right: 0; bottom: 150px; display: flex; flex-direction: column; align-items: center; }
  .tabak.sallan { animation: wobble 0.45s ease-out; }
  .kule { display: flex; flex-direction: column-reverse; align-items: center; gap: 1px; }
  .t-krep { width: 170px; height: 20px; border-radius: 10px; box-shadow: inset 0 -4px 0 #0003; }
  .t-ek { font-size: 16px; line-height: 16px; height: 16px; }
  .plaka { width: 270px; height: 34px; margin-top: -6px; border-radius: 50%; background: radial-gradient(ellipse at 50% 35%, var(--sahne-tabak) 55%, color-mix(in srgb, var(--sahne-tabak) 70%, white) 56%); box-shadow: inset 0 -8px 0 #0002, 0 9px 0 var(--sahne-tabak-koyu); }

  .mesaj { position: absolute; left: 50%; top: 40%; z-index: 20; padding: 10px 20px; border-radius: 16px; border: 2px solid var(--renk-ana); background: var(--kart); text-align: center; pointer-events: none; animation: patla 0.45s ease-out forwards; transform: translateX(-50%); }
  .mesaj .ana { font-size: 34px; font-weight: 900; color: var(--renk-ana); }
  .mesaj.perfect { border-color: var(--basari); } .mesaj.perfect .ana { color: var(--basari); font-size: 42px; }
  .mesaj.olmadi { border-color: var(--vurgu); } .mesaj.olmadi .ana { color: var(--vurgu); }
  .mesaj .alt { font-size: 14px; }

  .alt-bar { position: absolute; left: 12px; right: 12px; bottom: calc(10px + env(safe-area-inset-bottom)); display: flex; gap: 8px; }
  .dugme { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 66px; padding: 4px 2px; border: 2px solid var(--kenar); border-radius: 14px; background: var(--kart); box-shadow: 0 3px 0 var(--kenar); touch-action: none; -webkit-tap-highlight-color: transparent; }
  .dugme:active { transform: translateY(3px); box-shadow: none; }
  .dugme span { font-size: 26px; line-height: 1; }
  .dugme small { font-size: 11px; }
  .dugme.ver { border-color: var(--basari); }
  .dugme.parlak { animation: parla 0.9s ease-in-out infinite; }

  .perde { position: absolute; inset: 0; z-index: 30; display: grid; place-items: center; padding: 16px; background: color-mix(in srgb, var(--renk-koyu) 70%, transparent); }
  .pencere { width: 100%; max-width: 320px; padding: 22px; border-radius: 18px; background: var(--kart); text-align: center; display: flex; flex-direction: column; gap: 10px; }
  .pencere h2 { margin: 0; }
  .yildizlar { font-size: 44px; }
  .ikincil { background: var(--zemin); color: var(--yazi); border: 1px solid var(--kenar); }

  @keyframes ucus {
    0% { transform: translateY(0) scaleY(1); }
    25% { transform: translateY(-110px) scaleY(0.12); }
    50% { transform: translateY(-150px) scaleY(1); }
    75% { transform: translateY(100px) scaleY(0.12); }
    100% { transform: translateY(var(--d)) scaleY(1); }
  }
  @keyframes salla { 30% { transform: translateY(-14px) rotate(-6deg); } 70% { transform: translateY(2px) rotate(2deg); } }
  @keyframes wobble { 25% { transform: translateX(-6px) rotate(-1.5deg); } 55% { transform: translateX(5px) rotate(1deg); } 80% { transform: translateX(-2px); } }
  @keyframes yuksel { from { transform: translateY(8px); opacity: 1; } to { transform: translateY(-14px); opacity: 0; } }
  @keyframes patla { 0% { transform: translateX(-50%) scale(0.5); opacity: 0; } 60% { transform: translateX(-50%) scale(1.12); opacity: 1; } 100% { transform: translateX(-50%) scale(1); } }
  @keyframes parla { 50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--renk-ana) 45%, transparent); } }
</style>
