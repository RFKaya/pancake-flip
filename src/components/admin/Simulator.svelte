<script lang="ts">
  // Simülatör: seçilen seviyenin oyun değerleri (seviyeAyari) ve açık her müşteri tipi için örnek sipariş (siparisUret).
  // Oyunun kendi kurallarıyla, tohumlu rastgele sayıyla hesaplanır: aynı seviye ve tohum aynı siparişleri verir.
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { sayiKisalt, seviyeAyari, seviyeSinirla } from "$lib/oyun/seviye";
  import { malzeme, SEVIYE } from "$lib/oyun/veri";
  import { ornekSiparisler, yuzdeYaz } from "$lib/yonetim";
  import EkranBasligi from "./EkranBasligi.svelte";

  const m = yonetimSozlugu();

  let girilen = $state(15);
  let tohum = $state(1);

  const seviye = $derived(seviyeSinirla(Number.isFinite(girilen) ? girilen : 1));
  const sv = $derived(seviyeAyari(seviye));
  const ornekler = $derived(ornekSiparisler(seviye, tohum));

  const iki = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  const aralik = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);
</script>

<div class="ekran">
  <EkranBasligi baslik={m.simulator.baslik} aciklama={m.simulator.aciklama} not={m.oyunKurallariNotu} />

  <div class="kart secim">
    <label>
      {m.simulator.seviye}
      <input type="number" min="1" max={SEVIYE.seviyeSiniri} step="1" bind:value={girilen} />
    </label>
    <div class="hizli" role="group" aria-label={m.simulator.hizli}>
      {#each SEVIYE.devHizliSeviyeler as l (l)}
        <button type="button" class:secili={seviye === l} aria-pressed={seviye === l} onclick={() => (girilen = l)}>{sayiKisalt(l)}</button>
      {/each}
    </div>
  </div>

  <section class="kart blok" aria-labelledby="sim-degerler">
    <h3 id="sim-degerler">{m.simulator.degerler} · {m.simulator.seviye} {seviye.toLocaleString("tr-TR")}</h3>
    <dl class="degerler">
      <div><dt>{m.egri.zorluk}</dt><dd>{yuzdeYaz(sv.zorluk)}</dd></div>
      <div><dt>{m.egri.gerekenMusteri}</dt><dd>{sv.gerekenMusteri}</dd></div>
      <div><dt>{m.egri.tava}</dt><dd>{sv.tava}</dd></div>
      <div><dt>{m.egri.eszamanli}</dt><dd>{sv.eszamanli}</dd></div>
      <div><dt>{m.simulator.krep}</dt><dd>{aralik(sv.krep)}</dd></div>
      <div><dt>{m.simulator.zorlukPuani}</dt><dd>{aralik(sv.d)}</dd></div>
      <div><dt>{m.egri.cevirPencere}</dt><dd>{iki(sv.cevirPencere)}</dd></div>
      <div><dt>{m.egri.hamurTolerans}</dt><dd>{yuzdeYaz(sv.hamurTolerans)}</dd></div>
      <div><dt>{m.egri.sabirCarpani}</dt><dd>×{iki(sv.sabirCarpani)}</dd></div>
      <div><dt>{m.egri.gelmeAraligi}</dt><dd>{iki(sv.gelmeAraligi)}</dd></div>
      <div><dt>{m.simulator.tercih}</dt><dd>{sv.tercihAcik ? m.simulator.acik : m.simulator.kapali}</dd></div>
      <div><dt>{m.simulator.yogunSaat}</dt><dd>{sv.yogunSaatAcik ? m.simulator.acik : m.simulator.kapali}</dd></div>
      <div><dt>{m.simulator.ipucu}</dt><dd>{sv.ipucu ? m.simulator.acik : m.simulator.kapali}</dd></div>
    </dl>
    <h4>{m.simulator.menu}</h4>
    <ul class="menu">
      {#each sv.menu as id (id)}
        <li><span aria-hidden="true">{malzeme(id).ikon}</span> {malzeme(id).ad}</li>
      {/each}
    </ul>
  </section>

  <section class="kart blok" aria-labelledby="sim-ornek">
    <div class="ust">
      <h3 id="sim-ornek">{m.simulator.ornekler}</h3>
      <button type="button" class="ikincil" onclick={() => (tohum += 1)}>🎲 {m.simulator.yeniOrnek}</button>
    </div>
    <ul class="ornekler">
      {#each ornekler as o (o.tip.id)}
        <li>
          <span class="tip"><span aria-hidden="true">{o.tip.ikon}</span> {o.tip.ad}</span>
          <span class="tabak" aria-label={o.siparis.parcalar.map((p) => malzeme(p).ad).join(", ")}>
            {#each o.siparis.parcalar as p, i (i)}<span title={malzeme(p).ad}>{malzeme(p).ikon}</span>{/each}
          </span>
          <span class="bilgi">
            {m.simulator.d} {iki(o.siparis.d)} · {m.simulator.fiyat} {o.fiyat} {m.simulator.coin} · {m.simulator.sabir} {iki(o.sabir)} {m.simulator.saniye}
            {#if o.siparis.tercih}· {o.siparis.tercih}{/if}
          </span>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .ekran {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-4);
    max-width: 1100px;
  }

  .secim {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--bosluk-4);
    padding: 14px 16px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-1);
    font-size: 13px;
    font-weight: 600;
  }

  input {
    width: 160px;
    padding: 9px 11px;
    border: 1px solid var(--kenar);
    border-radius: var(--radius-kucuk);
    background: var(--zemin);
  }

  .hizli {
    display: flex;
    flex-wrap: wrap;
    gap: var(--bosluk-1);
  }

  .hizli button,
  .ikincil {
    padding: 6px 12px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    background: var(--kart);
    font-size: 13px;
    font-weight: 700;
  }

  .hizli button.secili {
    border-color: var(--renk-ana);
    background: color-mix(in srgb, var(--renk-ana) 14%, transparent);
    color: var(--renk-ana);
  }

  .blok {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-3);
    padding: 16px;
  }

  h3,
  h4,
  dl,
  dd {
    margin: 0;
  }

  h3 {
    font-size: 16px;
  }

  h4 {
    font-size: 13px;
    color: var(--yazi-soluk);
  }

  .degerler {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--bosluk-3);
  }

  dt {
    color: var(--yazi-soluk);
    font-size: 11px;
    font-weight: 600;
  }

  dd {
    font-size: 17px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .menu {
    display: flex;
    flex-wrap: wrap;
    gap: var(--bosluk-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .menu li {
    padding: 4px 10px;
    border: 1px solid var(--kenar);
    border-radius: 999px;
    font-size: 13px;
  }

  .ust {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--bosluk-3);
  }

  .ornekler {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ornekler li {
    display: grid;
    grid-template-columns: 140px auto 1fr;
    align-items: center;
    gap: var(--bosluk-3);
    padding: 10px 0;
    border-bottom: 1px solid var(--kenar);
    font-size: 13px;
  }

  .ornekler li:last-child {
    border-bottom: 0;
  }

  .tip {
    font-weight: 700;
  }

  .tabak {
    font-size: 20px;
    letter-spacing: 2px;
  }

  .bilgi {
    color: var(--yazi-soluk);
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 600px) {
    .ornekler li {
      grid-template-columns: 1fr;
      gap: var(--bosluk-1);
    }
  }
</style>
