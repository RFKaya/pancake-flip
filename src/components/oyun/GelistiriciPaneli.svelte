<script lang="ts">
  // Geliştirici modu: seviyeyi elle ayarla, o seviyenin parametrelerini gör. Yalnızca test içindir.
  // Seviye değişikliği "test durumu" oluşturur: gerçek kayda dokunmaz. Kayda yazmak için "Kayda uygula" gerekir.
  import type { Oturum } from "$lib/oyun/oturum";
  import { gerekenMusteri, sayiKisalt, seviyeSinirla, zorluk } from "$lib/oyun/seviye";
  import { SEVIYE } from "$lib/oyun/veri";

  let { oturum, testModu, kapat, seviyeAyarla, sifirla, kayitUygula, testtenCik, kaydiSil }: {
    oturum: Oturum;
    testModu: boolean;
    kapat: () => void;
    seviyeAyarla: (seviye: number) => void;
    sifirla: () => void;
    kayitUygula: () => void;
    testtenCik: () => void;
    kaydiSil: () => void;
  } = $props();

  let girdi = $state("");
  let hata = $state("");

  /** Metin kutusundaki değeri güvenle tam sayıya çevirir; geçersizse null */
  function oku(): number | null {
    const n = Number(girdi.trim().replace(/[ _,]/g, ""));
    if (!girdi.trim() || !Number.isFinite(n)) {
      hata = "Geçerli bir sayı yaz";
      return null;
    }
    hata = "";
    return seviyeSinirla(n);
  }

  function ayarla() {
    const n = oku();
    if (n !== null) {
      seviyeAyarla(n);
      girdi = String(n);
    }
  }

  const git = (n: number) => {
    const s = seviyeSinirla(n);
    seviyeAyarla(s);
    girdi = String(s);
    hata = "";
  };

  const sv = $derived(oturum.sv);
  const satirlar = $derived<[string, string][]>([
    ["Zorluk (0–1)", zorluk(oturum.seviye).toFixed(3)],
    ["Sonraki seviye", `${Math.floor(oturum.ilerleme)} / ${gerekenMusteri(oturum.seviye)} müşteri`],
    ["Çevirme penceresi", sv.cevirPencere.toFixed(3)],
    ["Hamur toleransı", sv.hamurTolerans.toFixed(3)],
    ["Pişme hızı", `×${sv.pisirmeHizi.toFixed(2)}`],
    ["Sabır çarpanı", `×${sv.sabirCarpani.toFixed(2)}`],
    ["Gelme aralığı", `${sv.gelmeAraligi.toFixed(1)} sn`],
    ["Müşteri / tava", `${sv.eszamanli} / ${sv.tava}`],
    ["Krep · D", `${sv.krep.join("–")} · ${sv.d.join("–")}`],
    ["Çevirme · tercih", `${sv.cevirmeAcik ? "açık" : "kapalı"} · ${sv.tercihAcik ? "açık" : "kapalı"}`],
    ["Malzemeler", `${sv.menu.length}`],
    ["Müşteri tipleri", Object.keys(sv.musteriAgirlik).join(", ")],
    ["Toplam müşteri · coin", `${sayiKisalt(oturum.toplamMusteri)} · ${sayiKisalt(oturum.toplamCoin)}`],
  ]);
</script>

<div class="panel" role="dialog" aria-label="Geliştirici modu">
  <div class="baslik">
    <b>DEVELOPER MODE</b>
    <span class="rozet" class:test={testModu}>{testModu ? "TEST — kayıt etkilenmez" : "KAYIT AÇIK"}</span>
    <button class="kapat" onclick={kapat} aria-label="Kapat">✕</button>
  </div>

  <div class="satir ayar">
    <label for="dev-seviye">Current Level: <b>{sayiKisalt(oturum.seviye)}</b></label>
    <input
      id="dev-seviye"
      type="text"
      inputmode="numeric"
      placeholder="Set level: örn. 100"
      bind:value={girdi}
      onkeydown={(e) => e.key === "Enter" && ayarla()}
    />
    <button class="ana" onclick={ayarla}>SET LEVEL</button>
  </div>
  {#if hata}<p class="hata">{hata}</p>{/if}

  <div class="satir">
    <button onclick={() => git(oturum.seviye - 1)}>−1 Level</button>
    <button onclick={() => git(oturum.seviye + 1)}>+1 Level</button>
    <button onclick={() => git(oturum.seviye - 10)}>−10</button>
    <button onclick={() => git(oturum.seviye + 10)}>+10</button>
  </div>
  <div class="satir">
    {#each SEVIYE.devHizliSeviyeler as s}
      <button class="chip" onclick={() => git(s)}>{s}</button>
    {/each}
    <button class="chip" onclick={() => git(SEVIYE.devEnYuksek)}>MAX ({SEVIYE.devEnYuksek})</button>
  </div>
  <div class="satir">
    <button onclick={sifirla}>RESET PROGRESSION</button>
  </div>

  <div class="satir kayit">
    <button class="ana" onclick={kayitUygula}>Kayda uygula (Apply to Save)</button>
    {#if testModu}<button onclick={testtenCik}>Testten çık (kayda dön)</button>{/if}
    <button class="tehlike" onclick={() => confirm("Gerçek kayıt silinsin mi?") && kaydiSil()}>Kaydı sil</button>
  </div>

  <dl class="bilgi">
    {#each satirlar as [ad, deger]}
      <dt>{ad}</dt><dd>{deger}</dd>
    {/each}
  </dl>
</div>

<style>
  .panel {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 72%;
    padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
    overflow-y: auto;
    border-radius: 18px 18px 0 0;
    border: 2px solid var(--vurgu);
    border-bottom: 0;
    background: var(--kart);
    box-shadow: 0 -8px 24px rgb(0 0 0 / 0.25);
    touch-action: pan-y;
    user-select: text;
    -webkit-user-select: text;
    font-size: 13px;
  }
  .baslik { display: flex; align-items: center; gap: 8px; }
  .baslik b { color: var(--vurgu); letter-spacing: 1px; }
  .rozet { flex: 1; padding: 2px 8px; border-radius: 6px; background: var(--zemin); border: 1px solid var(--kenar); font-size: 11px; font-weight: 800; }
  .rozet.test { background: var(--vurgu); color: var(--renk-ana-yazi); border-color: var(--vurgu); }
  .kapat { width: 32px; height: 32px; border: 0; border-radius: 50%; background: var(--zemin); }
  .satir { display: flex; flex-wrap: wrap; gap: 6px; }
  .ayar { align-items: center; }
  .ayar label { flex: 1 1 100%; }
  .ayar input { flex: 1; min-width: 0; padding: 9px 10px; border: 2px solid var(--kenar); border-radius: 10px; background: var(--zemin); user-select: text; -webkit-user-select: text; }
  button { padding: 9px 12px; border: 1px solid var(--kenar); border-radius: 10px; background: var(--zemin); font-weight: 700; touch-action: manipulation; }
  button:active { transform: translateY(1px); }
  .ana { border-color: var(--basari); color: var(--basari); }
  .chip { padding: 6px 10px; }
  .tehlike { border-color: var(--vurgu); color: var(--vurgu); }
  .hata { margin: 0; color: var(--vurgu); font-weight: 700; }
  .kayit button { flex: 1 1 auto; }
  .bilgi { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; margin: 4px 0 0; font-size: 12px; }
  .bilgi dt { color: var(--yazi-soluk); }
  .bilgi dd { margin: 0; font-weight: 800; text-align: right; overflow-wrap: anywhere; }
</style>
