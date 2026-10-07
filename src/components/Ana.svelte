<script lang="ts">
  // Ana ekran (lobi): oyunun mutfağından canlı bir sahne + büyük OYNA. Pano/istatistik kartı yoktur.
  // Sahnedeki müşteri ve tava sayısı oyunun gerçek seviye ayarından gelir; süsler seviyeyle açılır (lobi.json).
  import { onMount } from "svelte";
  import { navigate } from "astro:transitions/client";
  import { ilerleme } from "$lib/ilerleme.svelte";
  import { gerekenMusteri, sayiKisalt, seviyeAyari } from "$lib/oyun/seviye";
  import { TIPLER } from "$lib/oyun/veri";
  import lobi from "$lib/veri/lobi.json";

  onMount(() => ilerleme.yukle());

  const v = $derived(ilerleme.veri);
  const sv = $derived(seviyeAyari(v.seviye));
  const oran = $derived(Math.min(1, v.ilerleme / gerekenMusteri(v.seviye)));
  const acik = (esik: number) => v.seviye >= esik;

  // Pencerede bekleyen müşteriler: açılmış tiplerden, seviyenin aynı anda müşteri sayısı kadar
  const yuzler = $derived.by(() => {
    const tipler = TIPLER.filter((t) => t.acilis <= v.seviye);
    return Array.from({ length: Math.max(1, sv.eszamanli) }, (_, i) => tipler[i % tipler.length].ikon);
  });
  const tavalar = $derived(Array.from({ length: Math.max(1, sv.tava) }, (_, i) => i));

  let giriyor = $state(false);

  function oyna(e: MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (giriyor) return;
    const az = matchMedia("(prefers-reduced-motion: reduce)").matches;
    giriyor = true;
    setTimeout(() => navigate("/oyna"), az ? 0 : lobi.girisMs);
  }
</script>

<div class="lobi" class:giriyor style:--giris={`${lobi.girisMs}ms`}>
  <div class="dunya">
    <!-- DUVAR: tabela, pencerede bekleyen müşteriler, raf -->
    <div class="duvar">
      {#if acik(lobi.dekor.susler)}
        <div class="susler" aria-hidden="true">
          {#each Array(9) as _, i}<i style:--i={i}></i>{/each}
        </div>
      {/if}

      <div class="tabela" class:buyuk={acik(lobi.dekor.tabela)} aria-hidden="true">
        <span class="ip sol"></span><span class="ip sag"></span>
        <b>pancake<em>flip</em></b>
        {#if acik(lobi.dekor.yildizlar)}<span class="yildizlar">★★★</span>{/if}
      </div>

      <div class="pencere" aria-hidden="true">
        <div class="cam"></div>
        <div class="kuyruk">
          {#each yuzler as yuz, i}
            <span class="musteri" style:--i={i}>
              {yuz}
              {#if i === 0}<span class="balon">🥞</span>{/if}
            </span>
          {/each}
        </div>
        <div class="tezgah-ust"></div>
      </div>

      <div class="raf" aria-hidden="true">
        <span class="kavanoz k1"><i></i></span>
        <span class="kavanoz k2"><i></i></span>
        <span class="kavanoz k3"><i></i></span>
        <span class="bitki">🪴</span>
      </div>
    </div>

    <!-- TEZGÂH: tava(lar), krep, buhar, tabak -->
    <div class="tezgah">
      {#if acik(lobi.dekor.masa)}
        <div class="masa" aria-hidden="true"><span class="fincan">☕</span><i class="ust"></i><i class="ayak"></i><i class="taban"></i></div>
      {/if}

      <div class="ocak" class:cift={tavalar.length > 1} aria-hidden="true">
        {#each tavalar as t (t)}
          <div class="tava" class:altin={acik(lobi.dekor.altinTava)} style:--g={`${t * 0.6}s`}>
            <div class="sap" class:sag={t === 1}></div>
            <div class="kasa"></div>
            <div class="ic"></div>
            <div class="krep"><i class="kabarcik b1"></i><i class="kabarcik b2"></i><i class="kabarcik b3"></i></div>
            <span class="buhar s1"></span><span class="buhar s2"></span><span class="buhar s3"></span>
            <div class="yuz"><i></i><i></i><b></b></div>
          </div>
        {/each}
      </div>

      <div class="tabak" aria-hidden="true">
        <div class="kule">
          <span class="k-krep"></span><span class="k-krep"></span><span class="k-krep"></span>
          <span class="surup"></span>
          <span class="tereyagi">🧈</span>
        </div>
        <div class="plaka"></div>
      </div>

      <a class="oyna" href="/oyna" onclick={oyna}>
        <span class="ok">▶</span> OYNA
      </a>
    </div>
  </div>

  <!-- Üst: yalnızca seviye, coin ve iki küçük düğme -->
  <header class="hud">
    <div class="seviye" title={`Seviye ${v.seviye}`}>
      <span>LEVEL {sayiKisalt(v.seviye)}</span>
      <i class="cubuk"><i style:transform={`scaleX(${oran})`}></i></i>
    </div>
    <div class="sag">
      <span class="hap coin" title="Toplam coin">🪙 {sayiKisalt(v.toplamCoin)}</span>
      <a class="yuvarlak" href="/hakkinda" aria-label="Nasıl oynanır">?</a>
      <a class="yuvarlak" href="/profil" aria-label="Ayarlar ve profil">⚙</a>
    </div>
  </header>
</div>

<style>
  /* Alt menü yüksekliği kadar boşluk bırakıp ekranın tamamını sahne yapar */
  .lobi {
    --alt-menu: 62px;
    position: relative;
    height: calc(100dvh - var(--alt-menu) - env(safe-area-inset-bottom));
    min-height: 560px;
    max-width: 520px;
    margin: 0 auto;
    overflow: hidden;
    color: var(--yazi);
    user-select: none;
    -webkit-user-select: none;
  }

  .dunya {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, var(--sahne-duvar) 0%, var(--sahne-duvar-koyu) 100%);
    transform-origin: 50% 62%;
    transition: transform var(--giris) cubic-bezier(0.5, 0, 0.75, 0), opacity var(--giris) ease-in;
  }

  /* OYNA'ya basınca: kamera tavaya yaklaşır gibi */
  .giriyor .dunya { transform: scale(1.9); opacity: 0; }
  .giriyor .hud { opacity: 0; transform: translateY(-12px); }

  /* ---------- Üst bilgi ---------- */
  .hud {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding: calc(10px + env(safe-area-inset-top)) 12px 0;
    transition: opacity 0.2s, transform 0.2s;
  }

  .seviye {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 150px;
    padding: 6px 14px 7px;
    border-radius: 999px;
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
    box-shadow: 0 3px 0 color-mix(in srgb, var(--renk-ana) 60%, black);
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .seviye span { overflow: hidden; text-overflow: ellipsis; }
  .cubuk { display: block; height: 4px; overflow: hidden; border-radius: 2px; background: rgb(255 255 255 / 0.3); }
  .cubuk i { display: block; height: 100%; border-radius: 2px; background: var(--renk-ana-yazi); transform-origin: left center; transition: transform 0.4s; }

  .sag { display: flex; align-items: center; gap: 6px; }
  .hap { padding: 6px 12px; border-radius: 999px; background: var(--kart); border: 1px solid var(--kenar); box-shadow: 0 3px 0 var(--kenar); font-size: 15px; font-weight: 900; white-space: nowrap; }
  .yuvarlak { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--kart); border: 1px solid var(--kenar); box-shadow: 0 3px 0 var(--kenar); color: var(--yazi); font-size: 17px; font-weight: 900; text-decoration: none; }
  .yuvarlak:active, .hap:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--kenar); }

  /* ---------- Duvar ---------- */
  .duvar { position: relative; flex: 0 0 42%; }

  .susler { position: absolute; left: 0; right: 0; top: 54px; display: flex; justify-content: space-around; padding: 0 6px; }
  .susler::before { content: ""; position: absolute; left: 0; right: 0; top: -2px; height: 14px; border-top: 2px solid var(--sahne-tezgah-koyu); border-radius: 0 0 50% 50%; }
  .susler i { width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; border-top: 16px solid var(--vurgu); transform-origin: top center; animation: sus 3s ease-in-out infinite; animation-delay: calc(var(--i) * -0.4s); }
  .susler i:nth-child(3n + 2) { border-top-color: var(--renk-logo); }
  .susler i:nth-child(3n) { border-top-color: var(--sahne-tabak); }

  .tabela { position: absolute; left: 50%; top: 66px; z-index: 3; padding: 8px 18px 10px; border-radius: 14px; background: linear-gradient(180deg, var(--krep-iyi), color-mix(in srgb, var(--krep-iyi) 70%, black)); box-shadow: 0 5px 0 rgb(0 0 0 / 0.18), inset 0 2px 0 rgb(255 255 255 / 0.18); transform-origin: 50% -26px; translate: -50% 0; animation: salin 4.5s ease-in-out infinite; }
  .tabela.buyuk { padding: 10px 24px 12px; }
  .tabela b { display: block; color: var(--ust-yazi); font-size: 22px; font-weight: 900; letter-spacing: -0.5px; white-space: nowrap; }
  .tabela.buyuk b { font-size: 26px; }
  .tabela em { font-style: normal; color: var(--renk-logo); }
  .ip { position: absolute; top: -26px; width: 2px; height: 28px; background: var(--sahne-tezgah-koyu); }
  .ip.sol { left: 22px; transform: rotate(14deg); }
  .ip.sag { right: 22px; transform: rotate(-14deg); }
  .yildizlar { display: block; color: var(--renk-logo); font-size: 12px; letter-spacing: 4px; text-align: center; animation: parilti 2s ease-in-out infinite; }

  .pencere { position: absolute; left: 50%; bottom: 46px; width: 230px; height: 112px; translate: -50% 0; border-radius: 60px 60px 8px 8px; border: 8px solid var(--kart); box-shadow: 0 4px 0 var(--kenar), inset 0 0 0 2px var(--kenar); overflow: hidden; }
  .cam { position: absolute; inset: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--sahne-tabak) 30%, white) 0%, color-mix(in srgb, var(--sahne-tabak) 55%, white) 100%); }
  .cam::after { content: ""; position: absolute; left: 18%; top: -10%; width: 22%; height: 130%; background: rgb(255 255 255 / 0.35); transform: skewX(-18deg); }
  .kuyruk { position: absolute; left: 0; right: 0; bottom: 10px; display: flex; justify-content: center; gap: 14px; }
  .musteri { position: relative; font-size: 44px; line-height: 1; animation: bekle 2.6s ease-in-out infinite; animation-delay: calc(var(--i) * -0.9s); }
  .balon { position: absolute; right: -20px; top: -18px; padding: 2px 5px; border-radius: 12px 12px 12px 3px; background: var(--kart); border: 1px solid var(--kenar); font-size: 16px; animation: balon 2.6s ease-in-out infinite; }
  .tezgah-ust { position: absolute; left: 0; right: 0; bottom: 0; height: 12px; background: var(--sahne-tezgah-koyu); }

  .raf { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: var(--sahne-tezgah-koyu); box-shadow: 0 5px 0 rgb(0 0 0 / 0.12); }
  .kavanoz { position: absolute; bottom: 10px; width: 30px; height: 40px; border-radius: 6px 6px 10px 10px; background: color-mix(in srgb, var(--sahne-tabak) 35%, white); border: 2px solid color-mix(in srgb, var(--sahne-tabak) 50%, white); overflow: hidden; }
  .kavanoz::before { content: ""; position: absolute; left: 3px; right: 3px; top: 0; height: 7px; border-radius: 3px; background: var(--renk-ana); z-index: 1; }
  .kavanoz::after { content: ""; position: absolute; left: -30px; top: 0; width: 10px; height: 100%; background: rgb(255 255 255 / 0.6); transform: skewX(-20deg); animation: isilti 6s ease-in-out infinite; }
  .kavanoz i { position: absolute; left: 3px; right: 3px; bottom: 3px; height: 55%; border-radius: 3px 3px 6px 6px; background: var(--krep-az); }
  .k1 { left: 16px; }
  .k2 { left: 52px; height: 32px; } .k2 i { background: var(--vurgu); } .k2::after { animation-delay: 2s; }
  .k3 { right: 56px; height: 46px; width: 28px; } .k3 i { background: var(--krep-iyi); } .k3::after { animation-delay: 4s; }
  .bitki { position: absolute; right: 14px; bottom: 8px; font-size: 34px; transform-origin: 50% 100%; animation: sallan 5s ease-in-out infinite; }

  /* ---------- Tezgâh ---------- */
  .tezgah { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; padding: 30px 16px 18px; background: linear-gradient(180deg, var(--sahne-tezgah) 0%, var(--sahne-tezgah-koyu) 100%); }
  .tezgah::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 8px; background: rgb(255 255 255 / 0.35); }

  .masa { position: absolute; left: 10px; top: -46px; z-index: 2; width: 62px; height: 70px; }
  .masa .ust { position: absolute; left: 0; top: 18px; width: 62px; height: 16px; border-radius: 50%; background: var(--kart); box-shadow: 0 4px 0 var(--kenar); }
  .masa .ayak { position: absolute; left: 28px; top: 30px; width: 6px; height: 32px; background: var(--sahne-tava-koyu); }
  .masa .taban { position: absolute; left: 16px; top: 60px; width: 30px; height: 8px; border-radius: 50%; background: var(--sahne-tava-koyu); }
  .masa .fincan { position: absolute; left: 18px; top: -2px; z-index: 1; font-size: 24px; }

  .ocak { --olcek: 1.25; position: relative; display: flex; justify-content: center; gap: 4px; width: 100%; height: 176px; }
  .ocak.cift { --olcek: 0.78; height: 150px; }

  .tava { position: relative; flex: none; width: 230px; height: 112px; margin-top: 10px; scale: var(--olcek, 1); transform-origin: 50% 0; animation: tava-nefes 3.2s ease-in-out infinite; animation-delay: var(--g); }
  .ocak.cift .tava { margin: 10px -26px 0; }
  .sap { position: absolute; left: -58px; top: 40px; width: 90px; height: 17px; border-radius: 9px; background: linear-gradient(var(--sahne-tava), var(--sahne-tava-koyu)); transform: rotate(-14deg); }
  .sap.sag { left: auto; right: -58px; transform: rotate(14deg); }
  .kasa { position: absolute; inset: 0; border-radius: 50% / 46%; background: radial-gradient(ellipse at 50% 30%, var(--sahne-tava) 0%, var(--sahne-tava-koyu) 100%); box-shadow: 0 10px 0 rgb(0 0 0 / 0.2), inset 0 0 0 5px color-mix(in srgb, var(--sahne-tava) 70%, white); }
  .altin .kasa { box-shadow: 0 10px 0 rgb(0 0 0 / 0.2), inset 0 0 0 5px var(--renk-logo); }
  .ic { position: absolute; left: 12px; right: 12px; top: 5px; height: 72px; border-radius: 50%; background: radial-gradient(ellipse at 50% 60%, var(--sahne-tava-koyu), color-mix(in srgb, var(--sahne-tava-koyu) 60%, black)); box-shadow: inset 0 3px 0 rgb(0 0 0 / 0.25); }

  .krep { position: absolute; left: 34px; right: 34px; top: 12px; height: 56px; border-radius: 50%; background: radial-gradient(ellipse at 50% 40%, var(--krep-az) 0%, var(--krep-orta) 70%, var(--krep-iyi) 100%); box-shadow: 0 5px 0 color-mix(in srgb, var(--krep-iyi) 80%, black), inset 0 -4px 0 rgb(0 0 0 / 0.12); animation: krep-zipla 3.2s ease-in-out infinite; animation-delay: var(--g); }
  .krep::before { content: ""; position: absolute; left: 22%; top: 16%; width: 34%; height: 22%; border-radius: 50%; background: rgb(255 255 255 / 0.35); }
  .kabarcik { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: color-mix(in srgb, var(--krep-iyi) 60%, transparent); animation: kabar 2.4s ease-in-out infinite; }
  .b1 { left: 30%; top: 50%; } .b2 { left: 60%; top: 38%; animation-delay: 0.8s; } .b3 { left: 46%; top: 66%; animation-delay: 1.6s; }

  .buhar { position: absolute; top: 0; width: 20px; height: 20px; border-radius: 50%; background: rgb(255 255 255 / 0.85); opacity: 0; filter: blur(3px); animation: buhar 2.6s ease-out infinite; }
  .s1 { left: 76px; } .s2 { left: 110px; animation-delay: 0.9s; } .s3 { left: 144px; animation-delay: 1.7s; }

  .yuz { position: absolute; left: 0; right: 0; bottom: 9px; display: flex; justify-content: center; align-items: center; gap: 20px; }
  .yuz i { width: 10px; height: 13px; border-radius: 50%; background: var(--sahne-yuz); animation: goz 4s infinite; }
  .yuz::before, .yuz::after { content: ""; position: absolute; bottom: -4px; width: 13px; height: 7px; border-radius: 50%; background: var(--vurgu); opacity: 0.4; }
  .yuz::before { left: calc(50% - 38px); } .yuz::after { right: calc(50% - 38px); }
  .yuz b { position: absolute; bottom: -7px; width: 16px; height: 8px; border-bottom: 3px solid var(--sahne-yuz); border-radius: 0 0 16px 16px; }

  .tabak { position: relative; align-self: flex-end; width: 150px; height: 74px; margin: -14px 0 0 0; }
  .kule { position: absolute; left: 22px; right: 22px; bottom: 16px; display: flex; flex-direction: column-reverse; align-items: center; }
  .k-krep { display: block; width: 100%; height: 14px; margin-top: -3px; border-radius: 8px; background: var(--krep-orta); box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.18), inset 0 3px 0 rgb(255 255 255 / 0.2); }
  .k-krep:nth-child(2) { width: 94%; } .k-krep:nth-child(3) { width: 88%; }
  .surup { position: absolute; left: 30%; top: -2px; width: 40%; height: 16px; border-radius: 6px 6px 50% 50%; background: var(--krep-iyi); opacity: 0.9; }
  .surup::after { content: ""; position: absolute; left: 20%; top: 12px; width: 5px; height: 10px; border-radius: 0 0 3px 3px; background: var(--krep-iyi); animation: damla 3s ease-in infinite; }
  .tereyagi { position: absolute; top: -18px; font-size: 18px; }
  .plaka { position: absolute; left: 0; bottom: 0; width: 150px; height: 26px; border-radius: 50%; background: radial-gradient(ellipse at 50% 35%, var(--sahne-tabak) 55%, color-mix(in srgb, var(--sahne-tabak) 70%, white) 56%); box-shadow: 0 6px 0 var(--sahne-tabak-koyu); }

  /* ---------- OYNA ---------- */
  .oyna {
    position: relative;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: min(100%, 300px);
    margin-top: auto;
    padding: 18px 24px;
    border-radius: 999px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--renk-ana) 80%, white) 0%, var(--renk-ana) 55%);
    color: var(--renk-ana-yazi);
    box-shadow: 0 7px 0 color-mix(in srgb, var(--renk-ana) 55%, black), 0 12px 20px rgb(0 0 0 / 0.18), inset 0 2px 0 rgb(255 255 255 / 0.35);
    font-size: 30px;
    font-weight: 900;
    letter-spacing: 2px;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
    animation: cagir 2.4s ease-in-out infinite;
    transition: transform 0.08s, box-shadow 0.08s;
  }

  .oyna .ok { font-size: 24px; }
  .oyna:active { animation: none; transform: translateY(6px) scale(0.96); box-shadow: 0 1px 0 color-mix(in srgb, var(--renk-ana) 55%, black), 0 4px 10px rgb(0 0 0 / 0.15), inset 0 2px 0 rgb(255 255 255 / 0.35); }
  .oyna:focus-visible { outline: 3px solid var(--renk-logo); outline-offset: 4px; }
  .giriyor .oyna { animation: bas 0.25s ease-out forwards; }

  /* ---------- Animasyonlar (yalnızca transform / opacity) ---------- */
  @keyframes cagir { 0%, 70%, 100% { transform: translateY(0) scale(1); } 80% { transform: translateY(-5px) scale(1.03); } 90% { transform: translateY(0) scale(0.99); } }
  @keyframes bas { 0% { transform: scale(0.94); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
  @keyframes tava-nefes { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-2px) rotate(-0.6deg); } }
  @keyframes krep-zipla { 0%, 82%, 100% { transform: translateY(0) scale(1, 1); } 87% { transform: translateY(-14px) scale(0.96, 1.05); } 93% { transform: translateY(0) scale(1.05, 0.93); } }
  @keyframes kabar { 0%, 100% { transform: scale(0.4); opacity: 0; } 50% { transform: scale(1); opacity: 1; } }
  @keyframes buhar { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 30% { opacity: 0.8; } 100% { transform: translateY(-58px) scale(1.5); opacity: 0; } }
  @keyframes goz { 0%, 92%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
  @keyframes bekle { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-4px) rotate(-3deg); } }
  @keyframes balon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
  @keyframes salin { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
  @keyframes sus { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
  @keyframes sallan { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
  @keyframes isilti { 0%, 80% { transform: translateX(0) skewX(-20deg); } 100% { transform: translateX(90px) skewX(-20deg); } }
  @keyframes parilti { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
  @keyframes damla { 0%, 60% { transform: translateY(0) scaleY(1); opacity: 1; } 100% { transform: translateY(14px) scaleY(1.4); opacity: 0; } }

  @media (prefers-reduced-motion: reduce) {
    .lobi *, .lobi *::before, .lobi *::after { animation: none !important; transition: none !important; }
  }

  /* Kısa ekranlar (ör. 375×667): sahneyi biraz sıkıştır, OYNA görünür kalsın */
  @media (max-height: 700px) {
    .duvar { flex-basis: 38%; }
    .pencere { height: 92px; bottom: 34px; }
    .musteri { font-size: 36px; }
    .ocak { --olcek: 1; height: 136px; }
    .ocak.cift { --olcek: 0.7; height: 120px; }
    .tabak { margin-top: -30px; }
    .oyna { padding: 14px 22px; font-size: 26px; }
  }
</style>
