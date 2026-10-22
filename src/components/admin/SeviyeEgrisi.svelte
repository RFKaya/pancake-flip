<script lang="ts">
  // Seviye Eğrisi: zorluk çizgisi ve örnek seviyelerde oyunun kullandığı değerler (src/lib/oyun/seviye.ts ile hesaplanır; Rust gerekmez).
  import { yonetimSozlugu } from "$lib/admin-sozluk";
  import { sayiKisalt } from "$lib/oyun/seviye";
  import { egriSatirlari, yuzdeYaz } from "$lib/yonetim";
  import EkranBasligi from "./EkranBasligi.svelte";

  const m = yonetimSozlugu();
  const satirlar = egriSatirlari();

  // Çizim alanı: x ekseni örnek seviyelerin sırası (seviyeler 1'den 1e9'a uzandığı için eşit aralıklı), y ekseni zorluk 0–1
  const G = 640;
  const Y = 180;
  const P = 28;
  const x = (i: number) => P + (i * (G - 2 * P)) / Math.max(1, satirlar.length - 1);
  const y = (z: number) => Y - P - z * (Y - 2 * P);
  const cizgi = satirlar.map((s, i) => `${x(i)},${y(s.zorluk)}`).join(" ");

  const iki = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
</script>

<div class="ekran">
  <EkranBasligi baslik={m.egri.baslik} aciklama={m.egri.aciklama} not={m.oyunKurallariNotu} />

  <figure class="kart cizim">
    <figcaption>{m.egri.zorlukCizgisi}</figcaption>
    <svg viewBox={`0 0 ${G} ${Y}`} role="img" aria-label={m.egri.zorlukCizgisi}>
      {#each [0, 0.5, 1] as z (z)}
        <line class="izgara" x1={P} x2={G - P} y1={y(z)} y2={y(z)} />
        <text class="eksen" x={P - 6} y={y(z) + 4} text-anchor="end">{z}</text>
      {/each}
      <polyline class="cizgi" points={cizgi} />
      {#each satirlar as s, i (s.seviye)}
        <circle class="nokta" cx={x(i)} cy={y(s.zorluk)} r="3"><title>{`${m.egri.seviye} ${s.seviye}: ${yuzdeYaz(s.zorluk)}`}</title></circle>
        {#if i % 2 === 0 || i === satirlar.length - 1}
          <text class="eksen" x={x(i)} y={Y - 6} text-anchor="middle">{sayiKisalt(s.seviye)}</text>
        {/if}
      {/each}
    </svg>
  </figure>

  <div class="kart tablo-kabi">
    <table>
      <thead>
        <tr>
          <th scope="col">{m.egri.seviye}</th>
          <th scope="col">{m.egri.gerekenMusteri}</th>
          <th scope="col">{m.egri.zorluk}</th>
          <th scope="col">{m.egri.cevirPencere}</th>
          <th scope="col">{m.egri.hamurTolerans}</th>
          <th scope="col">{m.egri.sabirCarpani}</th>
          <th scope="col">{m.egri.gelmeAraligi}</th>
          <th scope="col">{m.egri.tava}</th>
          <th scope="col">{m.egri.eszamanli}</th>
        </tr>
      </thead>
      <tbody>
        {#each satirlar as s (s.seviye)}
          <tr>
            <th scope="row" title={s.seviye.toLocaleString("tr-TR")}>{sayiKisalt(s.seviye)}</th>
            <td>{s.gerekenMusteri}</td>
            <td>{yuzdeYaz(s.zorluk)}</td>
            <td>{iki(s.cevirPencere)}</td>
            <td>{yuzdeYaz(s.hamurTolerans)}</td>
            <td>×{iki(s.sabirCarpani)}</td>
            <td>{iki(s.gelmeAraligi)}</td>
            <td>{s.tava}</td>
            <td>{s.eszamanli}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .ekran {
    display: flex;
    flex-direction: column;
    gap: var(--bosluk-4);
    max-width: 1100px;
  }

  .cizim {
    margin: 0;
    padding: 14px 16px;
  }

  figcaption {
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 600;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .izgara {
    stroke: var(--kenar);
    stroke-dasharray: 3 4;
  }

  .eksen {
    fill: var(--yazi-soluk);
    font-size: 11px;
  }

  .cizgi {
    fill: none;
    stroke: var(--renk-ana);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }

  .nokta {
    fill: var(--kart);
    stroke: var(--renk-ana);
    stroke-width: 2;
  }

  .tablo-kabi {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  th,
  td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--kenar);
    text-align: end;
    white-space: nowrap;
  }

  thead th {
    color: var(--yazi-soluk);
    font-size: 12px;
    font-weight: 600;
  }

  tbody th {
    text-align: start;
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }
</style>
