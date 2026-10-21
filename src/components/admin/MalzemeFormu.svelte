<script lang="ts">
  // Malzeme ekleme / düzenleme formu: önce yonetim.ts kurallarıyla denetlenir, sonra yerel arka uca yazılır
  // (crud_store / crud_update). Arka ucun alan hataları ilgili alanın altında gösterilir.
  import { untrack } from "svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { kayitEkle, kayitGuncelle } from "$lib/native";
  import type { FormHatalari, Malzeme, MalzemeFormuGirdileri } from "$lib/types";
  import { hataMetni, KATEGORILER, malzemeDogrula, malzemeNeti, RENK_DEGISKENLERI } from "$lib/yonetim";
  import Pencere from "./Pencere.svelte";

  let { kayit, mevcutIdler, onKaydedildi, onIptal }: MalzemeFormuGirdileri = $props();

  const m = yonetimSozlugu();
  // Form açıldığı andaki kayıttan başlar; sonra kullanıcının taslağıdır (bilinçli tek okuma)
  const yeni = untrack(() => kayit === null);
  let taslak = $state<Malzeme>(
    untrack(() =>
      kayit
        ? { ...kayit, tatli: kayit.tatli ?? false }
        : { id: "", ad: "", kategori: "dolgu", acilis: 1, maliyet: 1, deger: 2, ikon: "", renkDegiskeni: RENK_DEGISKENLERI[0], tatli: false },
    ),
  );

  let hatalar = $state<FormHatalari>({});
  let genelHata = $state("");
  let gonderiliyor = $state(false);

  const net = $derived(malzemeNeti(taslak));

  async function gonder(e: SubmitEvent) {
    e.preventDefault();
    genelHata = "";
    hatalar = malzemeDogrula(taslak, yeni, mevcutIdler, m);
    if (Object.keys(hatalar).length > 0) {
      genelHata = m.form.duzelt;
      return;
    }
    gonderiliyor = true;
    const veri: Malzeme = { ...taslak, ad: taslak.ad.trim(), ikon: taslak.ikon.trim() };
    const s = yeni ? await kayitEkle("Malzeme", veri) : await kayitGuncelle("Malzeme", veri.id, veri);
    gonderiliyor = false;
    if (s.ok) return onKaydedildi(s.veri);
    if (s.hata.tur === "ArkaUc" && s.hata.alanlar) hatalar = Object.fromEntries(s.hata.alanlar.map((a) => [a.field, a.message]));
    genelHata = hataMetni(s.hata, m);
  }
</script>

{#snippet alanHatasi(alan: string)}
  {#if hatalar[alan]}<span class="alan-hatasi" id={`hata-${alan}`}>{hatalar[alan]}</span>{/if}
{/snippet}

<Pencere baslik={yeni ? m.malzemeler.yeniBaslik : m.malzemeler.duzenleBaslik} kapatMetni={m.ortak.kapat} onKapat={onIptal}>
  <form onsubmit={gonder} novalidate>
    <div class="izgara">
      <label>
        {m.form.kimlik}
        <input type="text" bind:value={taslak.id} readonly={!yeni} aria-invalid={!!hatalar.id} aria-describedby="hata-id" autocomplete="off" />
        {#if yeni}<span class="ipucu">{m.form.kimlikAciklama}</span>{/if}
        {@render alanHatasi("id")}
      </label>
      <label>
        {m.form.ad}
        <input type="text" bind:value={taslak.ad} aria-invalid={!!hatalar.ad} aria-describedby="hata-ad" />
        {@render alanHatasi("ad")}
      </label>
      <label>
        {m.form.ikon}
        <input type="text" bind:value={taslak.ikon} maxlength="8" aria-invalid={!!hatalar.ikon} aria-describedby="hata-ikon" />
        {@render alanHatasi("ikon")}
      </label>
      <label>
        {m.malzemeler.kategori}
        <select bind:value={taslak.kategori}>
          {#each KATEGORILER as k (k)}<option value={k}>{m.kategori[k]}</option>{/each}
        </select>
        {@render alanHatasi("kategori")}
      </label>
      <label>
        {m.malzemeler.acilis}
        <input type="number" min="1" step="1" bind:value={taslak.acilis} aria-invalid={!!hatalar.acilis} aria-describedby="hata-acilis" />
        {@render alanHatasi("acilis")}
      </label>
      <label>
        {m.malzemeler.renk}
        <select bind:value={taslak.renkDegiskeni} style:border-inline-start={`8px solid var(${taslak.renkDegiskeni})`}>
          {#each RENK_DEGISKENLERI as r (r)}<option value={r}>{r}</option>{/each}
        </select>
        {@render alanHatasi("renkDegiskeni")}
      </label>
      <label>
        {m.malzemeler.maliyet}
        <input type="number" min="0" step="1" bind:value={taslak.maliyet} aria-invalid={!!hatalar.maliyet} aria-describedby="hata-maliyet" />
        {@render alanHatasi("maliyet")}
      </label>
      <label>
        {m.malzemeler.deger}
        <input type="number" min="0" step="1" bind:value={taslak.deger} aria-invalid={!!hatalar.deger} aria-describedby="hata-deger" />
        {@render alanHatasi("deger")}
      </label>
    </div>

    <label class="kutucuk"><input type="checkbox" bind:checked={taslak.tatli} /> {m.malzemeler.tatli}</label>

    <p class="net" class:zarar={net <= 0}>
      {m.malzemeler.net}: <strong>{Number.isFinite(net) ? net : m.ortak.yok}</strong>
      {#if net <= 0}<span>· {m.malzemeler.zararUyarisi}</span>{/if}
    </p>

    {#if genelHata}<p class="form-hatasi" role="alert">{genelHata}</p>{/if}

    <div class="dugmeler">
      <button type="button" class="ikincil" onclick={onIptal}>{m.ortak.vazgec}</button>
      <button type="submit" class="btn" disabled={gonderiliyor}>{gonderiliyor ? m.ortak.kaydediliyor : m.ortak.kaydet}</button>
    </div>
  </form>
</Pencere>

<style>
  .net {
    margin: 0;
    font-size: 14px;
  }

  .net.zarar {
    color: var(--vurgu);
  }
</style>
