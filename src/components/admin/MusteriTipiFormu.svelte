<script lang="ts">
  // Müşteri tipi ekleme / düzenleme formu: önce yonetim.ts kurallarıyla denetlenir, sonra yerel arka uca yazılır
  // (crud_store / crud_update). "Zorluk üst sınırı" boş bırakılırsa sınır yoktur (dMax gönderilmez ya da silinir).
  import { untrack } from "svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { kayitEkle, kayitGuncelle } from "$lib/native";
  import type { FormHatalari, MusteriTipi, MusteriTipiFormuGirdileri } from "$lib/types";
  import { hataMetni, musteriTipiDogrula } from "$lib/yonetim";
  import Pencere from "./Pencere.svelte";

  let { kayit, mevcutIdler, onKaydedildi, onIptal }: MusteriTipiFormuGirdileri = $props();

  const m = yonetimSozlugu();
  // Form açıldığı andaki kayıttan başlar; sonra kullanıcının taslağıdır (bilinçli tek okuma)
  const yeni = untrack(() => kayit === null);
  let taslak = $state<MusteriTipi>(
    untrack(() => (kayit ? { ...kayit } : { id: "", ad: "", ikon: "", acilis: 1, agirlik: 0.2, sabir: 1, odeme: 1, bahsis: 1, ceza: 1, dKaydirma: 0 })),
  );
  // Sayı kutusu boşken null verir; dMax için "sınır yok" anlamına gelir
  let dMax = $state<number | null>(untrack(() => kayit?.dMax ?? null));
  let tatliMi = $state(untrack(() => kayit?.tatliMi ?? false));

  let hatalar = $state<FormHatalari>({});
  let genelHata = $state("");
  let gonderiliyor = $state(false);

  const sayiAlanlari = ["agirlik", "sabir", "odeme", "bahsis", "ceza"] as const;

  async function gonder(e: SubmitEvent) {
    e.preventDefault();
    genelHata = "";
    const veri: MusteriTipi = { ...taslak, ad: taslak.ad.trim(), ikon: taslak.ikon.trim(), dMax: dMax ?? undefined, tatliMi };
    hatalar = musteriTipiDogrula(veri, yeni, mevcutIdler, m);
    if (Object.keys(hatalar).length > 0) {
      genelHata = m.form.duzelt;
      return;
    }
    gonderiliyor = true;
    // Güncellemede dMax açıkça null gönderilir ki önceki sınır silinsin (crud_update yalnız gönderilen alanları değiştirir)
    const s = yeni ? await kayitEkle("MusteriTipi", veri) : await kayitGuncelle("MusteriTipi", veri.id, { ...veri, dMax: dMax ?? null });
    gonderiliyor = false;
    if (s.ok) return onKaydedildi(s.veri);
    if (s.hata.tur === "ArkaUc" && s.hata.alanlar) hatalar = Object.fromEntries(s.hata.alanlar.map((a) => [a.field, a.message]));
    genelHata = hataMetni(s.hata, m);
  }
</script>

{#snippet alanHatasi(alan: string)}
  {#if hatalar[alan]}<span class="alan-hatasi" id={`hata-${alan}`}>{hatalar[alan]}</span>{/if}
{/snippet}

<Pencere baslik={yeni ? m.musteriler.yeniBaslik : m.musteriler.duzenleBaslik} kapatMetni={m.ortak.kapat} onKapat={onIptal}>
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
        {m.musteriler.acilis}
        <input type="number" min="1" step="1" bind:value={taslak.acilis} aria-invalid={!!hatalar.acilis} aria-describedby="hata-acilis" />
        {@render alanHatasi("acilis")}
      </label>
      {#each sayiAlanlari as alan (alan)}
        <label>
          {m.musteriler[alan]}
          <input type="number" min="0" step="0.05" bind:value={taslak[alan]} aria-invalid={!!hatalar[alan]} aria-describedby={`hata-${alan}`} />
          {@render alanHatasi(alan)}
        </label>
      {/each}
      <label>
        {m.musteriler.dKaydirma}
        <input type="number" min="0" step="1" bind:value={taslak.dKaydirma} aria-invalid={!!hatalar.dKaydirma} aria-describedby="hata-dKaydirma" />
        {@render alanHatasi("dKaydirma")}
      </label>
      <label>
        {m.musteriler.dMax}
        <input type="number" min="1" step="1" bind:value={dMax} aria-invalid={!!hatalar.dMax} aria-describedby="hata-dMax" />
        <span class="ipucu">{m.musteriler.dMaxBos}</span>
        {@render alanHatasi("dMax")}
      </label>
    </div>

    <label class="kutucuk"><input type="checkbox" bind:checked={tatliMi} /> {m.musteriler.tatliMi}</label>

    {#if genelHata}<p class="form-hatasi" role="alert">{genelHata}</p>{/if}

    <div class="dugmeler">
      <button type="button" class="ikincil" onclick={onIptal}>{m.ortak.vazgec}</button>
      <button type="submit" class="btn" disabled={gonderiliyor}>{gonderiliyor ? m.ortak.kaydediliyor : m.ortak.kaydet}</button>
    </div>
  </form>
</Pencere>
