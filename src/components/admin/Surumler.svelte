<script lang="ts">
  // Sürümler: içerik sürümlerinin listesi (content_versions). "Publish:ContentVersion" izniyle taslak yayınlanır (content_publish,
  // arka uç doğrular) ya da yayındaki sürüm bir öncekine döndürülür (content_rollback, neden zorunlu). Yalnız uygulamada görünür.
  import { onMount } from "svelte";
  import BosDurum from "$lib/components/ui/BosDurum.svelte";
  import HataDurumu from "$lib/components/ui/HataDurumu.svelte";
  import Yukleniyor from "$lib/components/ui/Yukleniyor.svelte";
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { icerikGeriAl, icerikYayinla, kayitListesi } from "$lib/native";
  import type { AyarEkraniGirdileri, IcerikSurumu } from "$lib/types";
  import { hataMetni, izinVar, surumSirala } from "$lib/yonetim";
  import EkranBasligi from "./EkranBasligi.svelte";
  import Pencere from "./Pencere.svelte";

  let { oturum }: AyarEkraniGirdileri = $props();

  const m = yonetimSozlugu();

  let liste = $state<IcerikSurumu[]>([]);
  let durum = $state<"yukleniyor" | "hata" | "hazir">("yukleniyor");
  let hata = $state("");

  /** Açık işlem penceresi: hangi sürüm, yayın mı geri alma mı */
  let islem = $state<{ tur: "yayinla" | "geriAl"; surum: IcerikSurumu } | null>(null);
  let metin = $state("");
  let islemHatasi = $state("");
  let gonderiliyor = $state(false);

  const yetkili = $derived(izinVar(oturum, "Publish:ContentVersion"));
  const sirali = $derived(surumSirala(liste));

  const tarih = (iso: string | null) => (iso ? new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : m.ortak.yok);

  async function yukle() {
    durum = "yukleniyor";
    const s = await kayitListesi("ContentVersion", { pageSize: 100 });
    if (s.ok) {
      liste = s.veri.items;
      durum = "hazir";
    } else {
      hata = hataMetni(s.hata, m);
      durum = "hata";
    }
  }

  function ac(tur: "yayinla" | "geriAl", surum: IcerikSurumu) {
    islem = { tur, surum };
    // content_publish notu olduğu gibi yazar (boşsa siler); taslağın notu kaybolmasın diye kutu onunla açılır
    metin = tur === "yayinla" ? (surum.not ?? "") : "";
    islemHatasi = "";
  }

  async function gonder(e: SubmitEvent) {
    e.preventDefault();
    if (!islem) return;
    gonderiliyor = true;
    islemHatasi = "";
    const s = islem.tur === "yayinla" ? await icerikYayinla(islem.surum.id, metin.trim() || undefined) : await icerikGeriAl(islem.surum.kapsam, metin.trim());
    gonderiliyor = false;
    if (!s.ok) {
      islemHatasi = hataMetni(s.hata, m);
      return;
    }
    islem = null;
    // Yayın ve geri alma birden çok sürümün durumunu değiştirir; liste yeniden okunur
    await yukle();
  }

  onMount(yukle);
</script>

<div class="ekran">
  <EkranBasligi baslik={m.surumler.baslik} aciklama={m.surumler.aciklama} not={m.ortak.veritabaniNotu} />

  {#if durum === "yukleniyor"}
    <Yukleniyor metin={m.surumler.yukleniyor} />
  {:else if durum === "hata"}
    <HataDurumu baslik={m.hata.baslik} mesaj={hata} tekrarMetni={m.hata.tekrar} onTekrar={yukle} />
  {:else if liste.length === 0}
    <BosDurum ikon="🗂️" baslik={m.surumler.bos} aciklama={m.surumler.bosAciklama} />
  {:else}
    <div class="kart tablo-kabi">
      <table>
        <thead>
          <tr>
            <th scope="col">{m.surumler.surum}</th>
            <th scope="col">{m.surumler.durumBaslik}</th>
            <th scope="col">{m.surumler.yayinTarihi}</th>
            <th scope="col">{m.denge.not}</th>
            {#if yetkili}<th scope="col"><span class="gizli">{m.ortak.islemler}</span></th>{/if}
          </tr>
        </thead>
        <tbody>
          {#each sirali as s (s.id)}
            <tr>
              <th scope="row">{m.surumler.kapsam[s.kapsam]} · {s.surum}</th>
              <td><span class={`durum ${s.durum}`}>{m.surumler.durum[s.durum]}</span></td>
              <td>{tarih(s.yayinTarihi)}</td>
              <td class="not">{s.not ?? m.ortak.yok}</td>
              {#if yetkili}
                <td class="islemler">
                  {#if s.durum === "taslak"}<button type="button" onclick={() => ac("yayinla", s)}>{m.surumler.yayinla}</button>{/if}
                  {#if s.durum === "yayinda"}<button type="button" class="geri" onclick={() => ac("geriAl", s)}>{m.surumler.geriAl}</button>{/if}
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if islem}
  <Pencere baslik={islem.tur === "yayinla" ? m.surumler.yayinlaBaslik : m.surumler.geriAlBaslik} kapatMetni={m.ortak.kapat} onKapat={() => (islem = null)}>
    <form onsubmit={gonder}>
      <p><strong>{m.surumler.kapsam[islem.surum.kapsam]} · {m.surumler.surum} {islem.surum.surum}</strong></p>
      <p>{islem.tur === "yayinla" ? m.surumler.yayinlaSoru : m.surumler.geriAlSoru}</p>
      <label>
        {islem.tur === "yayinla" ? m.surumler.not : m.surumler.neden}
        <input type="text" maxlength="200" bind:value={metin} required={islem.tur === "geriAl"} />
      </label>
      {#if islemHatasi}<p class="form-hatasi" role="alert">{islemHatasi}</p>{/if}
      <div class="dugmeler">
        <button type="button" class="ikincil" onclick={() => (islem = null)}>{m.ortak.vazgec}</button>
        <button type="submit" class="btn" disabled={gonderiliyor || (islem.tur === "geriAl" && metin.trim() === "")}>
          {gonderiliyor ? m.surumler.gonderiliyor : islem.tur === "yayinla" ? m.surumler.yayinla : m.surumler.geriAl}
        </button>
      </div>
    </form>
  </Pencere>
{/if}

<style>
  .ekran {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-4);
    max-width: 1100px;
  }

  .tablo-kabi {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th,
  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--kenar);
    text-align: start;
    white-space: nowrap;
  }

  thead th {
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 600;
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }

  .not {
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--yazi-soluk);
  }

  .durum {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: color-mix(in srgb, var(--kenar) 50%, transparent);
  }

  .durum.yayinda {
    background: color-mix(in srgb, var(--basari) 18%, transparent);
    color: var(--basari);
  }

  .durum.taslak {
    background: color-mix(in srgb, var(--renk-logo) 18%, transparent);
    color: var(--renk-ana);
  }

  .islemler {
    text-align: end;
  }

  .islemler button {
    padding: 5px 10px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: transparent;
    font-size: 12px;
    font-weight: 700;
  }

  .islemler .geri {
    color: var(--vurgu);
  }

  p {
    margin: 0;
  }

  .gizli {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
