<script lang="ts">
  // Müşteri karakteri: aynı bileşen hem duvardaki gerçek müşteri (büyük) hem sipariş fişindeki portre (küçük) olarak çizilir.
  // Kimlik (kıyafet rengi + şapka) müşteri numarasından gelir, böylece fişteki kişi ile sahnedeki kişi aynıdır.
  // Yüz ifadesi dışarıdan gelir (sabra göre değişir); canlılık yalnızca CSS animasyonudur (transform / opacity).
  let { kimlik, yuz, rozet = "", boyut = "buyuk", durum = "bekle", sabirsiz = false }: {
    kimlik: number;
    yuz: string;
    /** Özel müşteri tipinin ikonu (çocuk, eleştirmen, VIP) */
    rozet?: string;
    boyut?: "buyuk" | "kucuk";
    durum?: "bekle" | "mutlu" | "kizgin";
    sabirsiz?: boolean;
  } = $props();

  const RENKLER = ["--vurgu", "--basari", "--renk-logo", "--renk-ana", "--sahne-tabak-koyu"];
  const SAPKALAR = ["🧢", "", "🎩", "🎀", "👒", "", "🪖"];
  const renk = $derived(`var(${RENKLER[kimlik % RENKLER.length]})`);
  const sapka = $derived(SAPKALAR[(kimlik * 3 + 1) % SAPKALAR.length]);
  const gec = $derived(`${-((kimlik * 7) % 6)}s`);
</script>

<div class="kr {boyut} {durum}" class:sabirsiz style:--k={renk} style:--gec={gec} aria-hidden="true">
  <div class="boy">
    <div class="govde"><i class="yaka"></i></div>
    <div class="kafa">
      {#if sapka}<span class="sapka">{sapka}</span>{/if}
      <span class="yuz">{yuz}</span>
    </div>
  </div>
  {#if rozet}<span class="rozet">{rozet}</span>{/if}
  {#if durum === "mutlu"}
    <span class="kalp k1">❤️</span><span class="kalp k2">✨</span><span class="kalp k3">❤️</span>
    <b class="yummy">Yummy!</b>
  {/if}
</div>

<style>
  .kr { position: relative; display: block; width: 1.6em; height: 1.55em; font-size: 40px; line-height: 1; pointer-events: none; }
  .kr.kucuk { font-size: 20px; }

  .boy { position: absolute; inset: 0; transform-origin: 50% 100%; animation: nefes 3.2s ease-in-out infinite; animation-delay: var(--gec); }
  .govde { position: absolute; left: 0.1em; right: 0.1em; bottom: 0; height: 0.72em; border-radius: 0.7em 0.7em 0.15em 0.15em; background: var(--k); box-shadow: inset 0 -0.12em 0 rgb(0 0 0 / 0.16), inset 0 0.08em 0 rgb(255 255 255 / 0.25); }
  .yaka { position: absolute; left: 50%; top: 0; width: 0.42em; height: 0.2em; margin-left: -0.21em; border-radius: 0 0 0.3em 0.3em; background: rgb(255 255 255 / 0.85); }
  .kafa { position: absolute; left: 50%; top: 0; width: 1em; margin-left: -0.5em; text-align: center; transform-origin: 50% 90%; animation: bak 7s ease-in-out infinite; animation-delay: var(--gec); }
  .yuz { display: block; font-size: 1em; line-height: 1; filter: drop-shadow(0 0.04em 0 rgb(0 0 0 / 0.15)); }
  .sapka { position: absolute; left: 50%; top: -0.38em; z-index: 1; font-size: 0.55em; line-height: 1; transform: translateX(-50%) rotate(-8deg); }
  .rozet { position: absolute; right: -0.15em; top: 0; font-size: 0.42em; line-height: 1; }

  /* Sabırsızlanma: kafa daha sık ve hızlı hareket eder, omuzlar zıplar */
  .sabirsiz .kafa { animation: sabirsiz 1.1s ease-in-out infinite; }
  .sabirsiz .boy { animation-duration: 1.6s; }

  /* Mutlu: sevinç sıçraması, sonra yemek yeme (çiğneme) */
  .mutlu .boy { animation: sevin 0.5s ease-out 1, nefes 3.2s ease-in-out 0.5s infinite; }
  .mutlu .kafa { animation: cigne 0.34s ease-in-out 0.55s infinite alternate; }
  .kalp { position: absolute; left: 50%; top: 0.2em; z-index: 3; font-size: 0.4em; line-height: 1; opacity: 0; animation: kalp 1.2s ease-out infinite; }
  .k2 { margin-left: 0.5em; animation-delay: 0.3s; }
  .k3 { margin-left: -0.6em; animation-delay: 0.6s; }
  .yummy { position: absolute; left: 50%; top: -2.1em; z-index: 4; padding: 0.05em 0.45em; border-radius: 999px; background: var(--kart); border: 0.05em solid var(--vurgu); color: var(--vurgu); font-size: 0.3em; font-weight: 900; line-height: 1.3; white-space: nowrap; transform: translateX(-50%); animation: yummy 1.2s ease-out forwards; }

  /* Kızgın ayrılış: titreyip kapıya yürür */
  .kizgin .boy { animation: titre 0.12s linear 4, git 0.5s ease-in 0.45s forwards; }

  @keyframes nefes { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.02, 1.035); } }
  @keyframes bak {
    0%, 22%, 100% { transform: rotate(0) translate(0, 0); }
    8% { transform: rotate(-4deg) translate(-2%, 0); }
    14% { transform: rotate(3deg) translate(2%, 1%); }
    /* saate / mutfağa bakar */
    42%, 50% { transform: rotate(8deg) translate(5%, -4%); }
    58% { transform: rotate(-2deg) translate(0, 2%); }
    75% { transform: rotate(0) translate(0, 3%); }
  }
  @keyframes sabirsiz { 0%, 100% { transform: rotate(-3deg) translateY(0); } 25% { transform: rotate(4deg) translateY(-3%); } 50% { transform: rotate(-4deg) translateY(0); } 75% { transform: rotate(3deg) translateY(-3%); } }
  @keyframes sevin { 0% { transform: translateY(0) scale(1, 1); } 35% { transform: translateY(-14%) scale(0.96, 1.08); } 70% { transform: translateY(0) scale(1.06, 0.94); } 100% { transform: none; } }
  @keyframes cigne { from { transform: translateY(0) scale(1, 1); } to { transform: translateY(3%) scale(1.04, 0.94); } }
  @keyframes kalp { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-1.1em) scale(1.1); opacity: 0; } }
  @keyframes yummy { 0% { transform: translate(-50%, 0.4em) scale(0.4); opacity: 0; } 20% { transform: translate(-50%, 0) scale(1.15); opacity: 1; } 35% { transform: translate(-50%, 0) scale(1); } 85% { opacity: 1; } 100% { transform: translate(-50%, -0.3em); opacity: 0; } }
  @keyframes titre { 0%, 100% { translate: 0 0; } 50% { translate: 3% 0; } }
  @keyframes git { to { transform: translate(60%, 8%) scale(0.9); opacity: 0; } }

  @media (prefers-reduced-motion: reduce) {
    .kr *, .kr { animation: none !important; }
  }
</style>
