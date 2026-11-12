<script lang="ts">
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { fisCoz } from "$lib/native";
  import type { FisBilgisi, FisDetayiGirdileri } from "$lib/types";
  import { hataMetni, sayiYaz, tarihYaz } from "$lib/yonetim";
  import Pencere from "./Pencere.svelte";
  let { kayit, onKapat }: FisDetayiGirdileri = $props();
  const m = yonetimSozlugu();
  const k = m.kayitlar;
  let sonuc = $state<FisBilgisi | null>(null);
  let hata = $state("");
  let mesgul = $state(false);
  async function coz() {
    if (mesgul) return;
    hata = "";
    mesgul = true;
    const s = await fisCoz(kayit.kod);
    mesgul = false;
    if (s.ok) sonuc = s.veri;
    else hata = hataMetni(s.hata, m);
  }
</script>

<Pencere baslik={k.kod} {onKapat} kapatMetni={k.kapat}>
  <dl>
    <dt>{k.kod}</dt><dd>{kayit.kod}</dd>
    <dt>{k.oyuncu}</dt><dd>{kayit.playerId ?? "—"}</dd>
    <dt>{k.seviye}</dt><dd>{sayiYaz(kayit.bolum)}</dd>
    <dt>{k.yildiz}</dt><dd>{sayiYaz(kayit.yildiz)}</dd>
    <dt>{k.net}</dt><dd>{sayiYaz(kayit.net)}</dd>
    <dt>{k.coin}</dt><dd>{sayiYaz(kayit.kasa)}</dd>
    <dt>{k.tarih}</dt><dd>{tarihYaz(kayit.tarih)}</dd>
  </dl>
  <p>{k.kodNotu}</p>
  <button type="button" class="btn" disabled={mesgul} onclick={coz}>{k.kodCoz}</button>
  {#if hata}<p role="alert" class="form-hatasi">{hata}</p>{/if}
  {#if sonuc}
    <div role="status">
      <p>{k.seviye}: {sonuc.seviye} · {k.yildiz}: {sonuc.yildiz} · {k.damga}: {sonuc.damga}</p>
      <p>{sonuc.seviye === kayit.bolum && sonuc.yildiz === kayit.yildiz ? k.uyumlu : k.uyumsuz}</p>
    </div>
  {/if}
</Pencere>

<style>
  dl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: var(--bosluk-2); }
  dt, p { color: var(--yazi-soluk); } dd { margin: 0; overflow-wrap: anywhere; }
</style>
