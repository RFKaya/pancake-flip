<script lang="ts">
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { oyuncuSeviyeAyarla } from "$lib/native";
  import { SEVIYE } from "$lib/oyun/veri";
  import type { OyuncuDetayiGirdileri } from "$lib/types";
  import { hataMetni, izinVar, sayiYaz, seviyeAyariDogrula, tarihYaz } from "$lib/yonetim";
  import Pencere from "./Pencere.svelte";
  let { kayit, oturum, onKapat, onKaydedildi }: OyuncuDetayiGirdileri = $props();
  const m = yonetimSozlugu();
  const k = m.kayitlar;
  let seviye = $state(1);
  let neden = $state("");
  let hata = $state("");
  let basari = $state("");
  let mesgul = $state(false);
  // Pencere her oyuncu seçiminde yeniden kurulur.
  $effect(() => { seviye = kayit.ilerleme?.seviye ?? 1; });
  async function kaydet(e: SubmitEvent) {
    e.preventDefault();
    if (mesgul || !izinVar(oturum, "SetLevel:Player")) return;
    basari = "";
    hata = seviyeAyariDogrula(seviye, neden, m);
    if (hata) return;
    mesgul = true;
    const s = await oyuncuSeviyeAyarla(kayit.id, seviye, neden);
    mesgul = false;
    if (!s.ok) { hata = hataMetni(s.hata, m); return; }
    basari = k.basarili;
    neden = "";
    onKaydedildi();
  }
</script>

<Pencere baslik={kayit.ad} onKapat={() => { if (!mesgul) onKapat(); }} kapatMetni={k.kapat}>
  <dl>
    <dt>{k.oyuncu}</dt><dd>{kayit.id}</dd>
    <dt>{k.eposta}</dt><dd>{izinVar(oturum, "Reveal:PII") ? (kayit.eposta ?? "—") : "•••"}</dd>
    <dt>{k.durum}</dt><dd>{k.oyuncuDurum[kayit.durum]}</dd>
    <dt>{k.seviye}</dt><dd>{sayiYaz(kayit.ilerleme?.seviye)}</dd>
    <dt>{k.enYuksek}</dt><dd>{sayiYaz(kayit.ilerleme?.enYuksekSeviye)}</dd>
    <dt>{k.servis}</dt><dd>{sayiYaz(kayit.ilerleme?.toplamMusteri)}</dd>
    <dt>{k.coin}</dt><dd>{sayiYaz(kayit.ilerleme?.toplamCoin)}</dd>
    <dt>{k.seri}</dt><dd>{sayiYaz(kayit.ilerleme?.enIyiSeri)}</dd>
    <dt>{k.kayitTarihi}</dt><dd>{tarihYaz(kayit.kayitTarihi)}</dd>
    <dt>{k.sonOyun}</dt><dd>{tarihYaz(kayit.sonOyun)}</dd>
  </dl>
  {#if izinVar(oturum, "SetLevel:Player")}
    <form onsubmit={kaydet}>
      <h3>{k.seviyeAyarla}</h3>
      <p class="ipucu">{k.seviyeNotu}</p>
      <label>{k.seviye}<input type="number" min="1" max={SEVIYE.seviyeSiniri} step="1" required bind:value={seviye} disabled={mesgul} /></label>
      <label>{k.gerekce}<input required minlength="5" bind:value={neden} disabled={mesgul} /></label>
      {#if hata}<p class="form-hatasi" role="alert">{hata}</p>{/if}
      {#if basari}<p role="status">{basari}</p>{/if}
      <button type="submit" class="btn" disabled={mesgul}>{mesgul ? k.kaydediliyor : k.kaydet}</button>
    </form>
  {/if}
</Pencere>

<style>
  dl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: var(--bosluk-2); }
  dt { color: var(--yazi-soluk); } dd { margin: 0; overflow-wrap: anywhere; }
  h3 { margin-bottom: 0; } button:disabled { opacity: 0.5; }
</style>
