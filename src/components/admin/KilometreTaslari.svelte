<script lang="ts">
  // Kilometre Taşları: seviye seviye ne açılıyor (malzeme, müşteri tipi, mekanik) ve hangi seviyelerde adisyon kesiliyor.
  // Oyunun verisinden hesaplanır (seviyeDuraklari); Rust gerekmez.
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { seviyeDuraklari } from "$lib/yonetim";
  import EkranBasligi from "./EkranBasligi.svelte";

  const m = yonetimSozlugu();
  const duraklar = seviyeDuraklari();
</script>

<div class="ekran">
  <EkranBasligi baslik={m.kilometre.baslik} aciklama={m.kilometre.aciklama} not={m.oyunKurallariNotu} />

  <ol class="cizelge">
    {#each duraklar as d (d.seviye)}
      <li class:tas={d.kilometreTasi !== null}>
        <span class="seviye">{m.kilometre.seviye} {d.seviye.toLocaleString("tr-TR")}</span>
        <div class="kart icerik">
          {#if d.kilometreTasi}
            <p class="tas-baslik">🧾 {d.kilometreTasi.baslik}</p>
            <p class="soluk">{d.kilometreTasi.alt}</p>
          {/if}
          {#if d.acilislar.length > 0}
            <ul class="acilislar">
              {#each d.acilislar as a (a.tur + a.id)}
                <li><span aria-hidden="true">{a.ikon}</span> {a.ad} <small>{m.kilometre.tur[a.tur]}</small></li>
              {/each}
            </ul>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
</div>

<style>
  .ekran {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-4);
    max-width: 800px;
  }

  .cizelge {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
    margin: 0;
    padding: 0 0 0 20px;
    list-style: none;
    border-inline-start: 2px solid var(--kenar);
  }

  .cizelge > li {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-1);
  }

  .cizelge > li::before {
    content: "";
    position: absolute;
    inset-inline-start: -27px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--kart);
    border: 2px solid var(--kenar);
  }

  .cizelge > li.tas::before {
    background: var(--renk-ana);
    border-color: var(--renk-ana);
  }

  .seviye {
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 700;
  }

  .icerik {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-2);
    padding: 12px 14px;
  }

  p {
    margin: 0;
  }

  .tas-baslik {
    font-weight: 800;
  }

  .soluk {
    color: var(--yazi-soluk);
    font-size: 13px;
  }

  .acilislar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--bosluk-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .acilislar li {
    padding: 4px 10px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
  }

  small {
    color: var(--yazi-soluk);
    font-weight: 500;
  }
</style>
