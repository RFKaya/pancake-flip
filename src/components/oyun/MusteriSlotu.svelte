<script lang="ts">
  // Müşteri: yüz, sabır halkası, sipariş kartı (aşağıdan yukarı mini kule) ve "Ver" ipucu
  import { AYAR, malzeme, tip, type ServisDurumu, type Slot } from "$lib/oyun/servis.svelte";
  import { ruhHali } from "$lib/oyun/musteri";

  let { servis, slot, index }: { servis: ServisDurumu; slot: Slot | null; index: number } = $props();

  const oran = $derived(slot ? slot.musteri.sabir / slot.musteri.sabirToplam : 1);
  const yuz = $derived(slot?.yuz ?? ruhHali(oran, AYAR).yuz);
  const beklenen = $derived(slot?.musteri.siparis.parcalar ?? []);
  const tabak = $derived(servis.tabak.parcalar);
  const tekMusteri = $derived(servis.slotlar.filter((s) => s && s.durum === "bekliyor").length === 1);

  // Kartta her satır: tabak o satırda doğru mu (✓), yanlış mı (kırmızı), henüz yok mu
  const satirlar = $derived(
    beklenen.map((id, i) => ({
      id,
      durum: i < tabak.length ? (tabak[i].malzeme === id ? "ok" : "yanlis") : "bekliyor",
    }))
  );
  const hazir = $derived(
    slot?.durum === "bekliyor" && tabak.length === beklenen.length && satirlar.every((s) => s.durum === "ok")
  );
  const halkaRengi = $derived(oran > 0.6 ? "var(--basari)" : oran > 0.3 ? "var(--renk-ana)" : "var(--vurgu)");
</script>

<div class="slot" class:bos={!slot}>
  {#if slot}
    <button class="musteri" class:ayrildi={slot.durum === "ayrildi"} onpointerdown={() => servis.musteriyeVer(index)}>
      <div class="portre" style:background={`conic-gradient(${halkaRengi} ${oran * 100}%, var(--kenar) 0)`}>
        <div class="yuz">{yuz}</div>
      </div>
      <div class="tipi">{tip(slot.musteri.tip).ikon} {tip(slot.musteri.tip).id === "normal" ? "" : tip(slot.musteri.tip).ad}</div>

      <div class="kart">
        {#each [...satirlar].reverse() as s, k (beklenen.length - 1 - k)}
          <div class="satir {s.durum}">
            <span>{malzeme(s.id).ikon}</span>
            <span class="adi">{malzeme(s.id).ad}</span>
            {#if s.durum === "ok"}<span class="tik">✓</span>{/if}
          </div>
        {/each}
        {#if slot.durum === "bekliyor" && (hazir || (tabak.length > 0 && tekMusteri))}
          <div class="ver" class:parlak={hazir}>Ver ▶</div>
        {/if}
      </div>
    </button>
  {/if}
</div>

<style>
  .slot {
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: center;
  }

  .musteri {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 4px;
    border: 0;
    background: transparent;
    touch-action: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    animation: gir 0.3s ease-out;
  }

  .musteri.ayrildi {
    animation: cik 1.1s ease-in forwards;
  }

  .portre {
    width: 58px;
    height: 58px;
    padding: 4px;
    border-radius: 50%;
  }

  .yuz {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--kart);
    font-size: 30px;
  }

  .tipi {
    min-height: 14px;
    font-size: 11px;
    color: var(--yazi-soluk);
  }

  .kart {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 130px;
    padding: 6px;
    border: 1px solid var(--kenar);
    border-radius: 10px;
    background: var(--kart);
    gap: 2px;
  }

  .satir {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 1px 4px;
    border-radius: 6px;
    font-size: 12px;
    color: var(--yazi);
  }

  .satir.ok {
    background: color-mix(in srgb, var(--basari) 18%, transparent);
  }

  .satir.yanlis {
    background: color-mix(in srgb, var(--vurgu) 22%, transparent);
    color: var(--vurgu);
  }

  .adi {
    flex: 1;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tik {
    color: var(--basari);
    font-weight: 800;
  }

  .ver {
    margin-top: 3px;
    padding: 3px;
    border-radius: 8px;
    background: var(--renk-ana);
    color: var(--renk-ana-yazi);
    font-size: 12px;
    font-weight: 700;
  }

  .ver.parlak {
    animation: parla 0.8s ease-in-out infinite;
  }

  @keyframes gir {
    from { transform: translateY(-20px); opacity: 0; }
  }

  @keyframes cik {
    to { transform: translateY(24px) scale(0.9); opacity: 0; }
  }

  @keyframes parla {
    50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--renk-ana) 45%, transparent); }
  }
</style>
