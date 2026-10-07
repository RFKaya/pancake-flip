<script lang="ts">
  // Servis (oyun) ekranı: üst çubuk, müşteriler, tezgâh (tava + tabak), malzeme rafı
  import { onMount } from "svelte";
  import { motorBaslat } from "$lib/oyun/motor";
  import { ServisDurumu } from "$lib/oyun/servis.svelte";
  import { sesDurumu } from "$lib/oyun/ses";
  import MalzemeRafi from "./MalzemeRafi.svelte";
  import MusteriSlotu from "./MusteriSlotu.svelte";
  import SonucPenceresi from "./SonucPenceresi.svelte";
  import TabakKule from "./TabakKule.svelte";
  import TavaHalka from "./TavaHalka.svelte";

  let { bolumNo }: { bolumNo: number } = $props();

  const ayarAnahtari = "pancakeflip-ayar";
  let servis = $state(new ServisDurumu(bolumNo));
  let ses = $state(true);

  function ayarYukle() {
    try {
      const a = JSON.parse(localStorage.getItem(ayarAnahtari) ?? "{}");
      servis.dokunarakCevir = !!a.dokunarakCevir;
      servis.ipucu = a.ipucu ?? true;
      ses = a.ses ?? true;
      sesDurumu.acik = ses;
    } catch {
      // bozuk ayar: varsayılanlarla devam
    }
  }

  function ayarKaydet() {
    sesDurumu.acik = ses;
    try {
      localStorage.setItem(
        ayarAnahtari,
        JSON.stringify({ dokunarakCevir: servis.dokunarakCevir, ipucu: servis.ipucu, ses })
      );
    } catch {
      // depolama kapalı
    }
  }

  function yeniden() {
    const d = servis.dokunarakCevir;
    const i = servis.ipucu;
    servis = new ServisDurumu(bolumNo);
    servis.dokunarakCevir = d;
    servis.ipucu = i;
  }

  onMount(() => {
    ayarYukle();
    return motorBaslat(() => servis);
  });

  const krepIpucu = $derived(servis.ipucu && servis.siradaki === "krep");
</script>

<div class="oyun">
  <header class="ust">
    <button class="ikon-dugme" onclick={() => servis.duraklat()} aria-label="Duraklat">⏸</button>
    <span class="coin">🪙 {Math.round(servis.net)}</span>
    <span class="sayac">👤 {servis.servisEdilen}/{servis.kuyruk.length}</span>
    <span class="combo" class:aktif={servis.combo >= 2 && servis.bolum.id >= 6}>
      {#if servis.bolum.id >= 6}COMBO {servis.combo}{/if}
    </span>
  </header>

  <section class="musteriler">
    {#each servis.slotlar as slot, i (i)}
      <MusteriSlotu {servis} {slot} index={i} />
    {/each}
  </section>

  <section class="tezgah">
    <div class="tavalar">
      {#each servis.tavalar as tava, i (i)}
        <TavaHalka
          {tava}
          parlak={krepIpucu && tava.durum === "bos"}
          dokunarakCevir={servis.dokunarakCevir}
          dokun={() => servis.tavayaDokun(i)}
          cevir={() => servis.tavayiCevir(i)}
        />
      {/each}
    </div>
    <TabakKule {servis} />
  </section>

  <section class="raf">
    <MalzemeRafi {servis} />
  </section>

  {#if servis.mesaj}
    <div class="mesaj {servis.mesaj.sonuc}" aria-live="polite">
      <div class="ana">{servis.mesaj.ana}</div>
      {#each servis.mesaj.alt as satir}<div class="alt">{satir}</div>{/each}
    </div>
  {/if}

  {#if servis.duraklatildi && !servis.bitti}
    <div class="perde" role="dialog" aria-modal="true" aria-label="Duraklatıldı">
      <div class="menu">
        <h2>Duraklatıldı</h2>
        <button class="btn" onclick={() => servis.surdur()}>Devam</button>
        <button class="btn ikincil" onclick={yeniden}>Yeniden başla</button>
        <a class="btn ikincil" href="/">Bölümlere dön</a>
        <label class="secenek">
          <input type="checkbox" bind:checked={servis.dokunarakCevir} onchange={ayarKaydet} />
          Dokunarak çevir (kaydırma yerine)
        </label>
        <label class="secenek">
          <input type="checkbox" bind:checked={servis.ipucu} onchange={ayarKaydet} />
          İpuçları
        </label>
        <label class="secenek">
          <input type="checkbox" bind:checked={ses} onchange={ayarKaydet} />
          Ses
        </label>
      </div>
    </div>
  {/if}

  {#if servis.bitti}
    <SonucPenceresi {servis} {yeniden} />
  {/if}
</div>

<style>
  .oyun {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 480px;
    height: 100dvh;
    margin: 0 auto;
    padding: env(safe-area-inset-top) 12px calc(12px + env(safe-area-inset-bottom));
    gap: 8px;
    background:
      linear-gradient(180deg, var(--sahne-tezgah) 0, var(--sahne-tezgah-koyu) 100%) bottom / 100% 44% no-repeat,
      linear-gradient(180deg, var(--sahne-duvar) 0%, var(--sahne-duvar-koyu) 100%);
    color: var(--yazi);
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .ust {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    font-weight: 700;
  }

  .ikon-dugme {
    width: 44px;
    height: 44px;
    border: 1px solid var(--kenar);
    border-radius: 12px;
    background: var(--kart);
    font-size: 18px;
    box-shadow: 0 3px 0 var(--kenar);
  }

  .coin,
  .sayac,
  .combo {
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--kart);
    color: var(--yazi);
  }

  .coin {
    font-size: 18px;
  }

  .sayac {
    font-size: 14px;
  }

  .combo {
    margin-left: auto;
    font-size: 14px;
  }

  .combo:empty {
    display: none;
  }

  .combo.aktif {
    color: var(--renk-ana);
  }

  .musteriler {
    display: flex;
    flex: 1 1 0;
    min-height: 0;
    gap: 6px;
    align-items: flex-start;
    justify-content: center;
    overflow-y: auto;
  }

  .tezgah {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    padding: 10px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius);
    background: transparent;
    border: 0;
  }

  .tavalar {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mesaj {
    position: absolute;
    left: 50%;
    top: 36%;
    z-index: 20;
    transform: translateX(-50%);
    padding: 10px 18px;
    border-radius: 16px;
    background: var(--kart);
    border: 2px solid var(--renk-ana);
    text-align: center;
    pointer-events: none;
    animation: patla 0.45s ease-out;
  }

  .mesaj .ana {
    font-size: 30px;
    font-weight: 900;
    color: var(--renk-ana);
  }

  .mesaj.perfect { border-color: var(--basari); }
  .mesaj.perfect .ana { color: var(--basari); font-size: 38px; }
  .mesaj.olmadi, .mesaj.yanik { border-color: var(--vurgu); }
  .mesaj.olmadi .ana, .mesaj.yanik .ana { color: var(--vurgu); }
  .mesaj.yanik .ana { font-size: 20px; }

  .mesaj .alt {
    font-size: 14px;
    color: var(--yazi);
  }

  .perde {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: color-mix(in srgb, var(--renk-koyu) 70%, transparent);
  }

  .menu {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 320px;
    padding: 20px;
    border-radius: 18px;
    background: var(--kart);
    border: 1px solid var(--kenar);
  }

  .menu h2 {
    margin: 0 0 4px;
    text-align: center;
  }

  .ikincil {
    background: var(--zemin);
    color: var(--yazi);
    border: 1px solid var(--kenar);
  }

  .secenek {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  @keyframes patla {
    0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
    60% { transform: translateX(-50%) scale(1.12); opacity: 1; }
    100% { transform: translateX(-50%) scale(1); }
  }
</style>
