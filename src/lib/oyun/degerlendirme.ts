// Tabak değerlendirmesi: sıralı düzenleme mesafesi (Damerau–Levenshtein) + pişme cezaları (docs/oyun-tasarimi.md §8)
import type { Ayarlar, Kalinlik, Sonuc, TabakParcasi } from "../types";

export type Hata =
  | { tur: "eksik"; malzeme: string }
  | { tur: "fazla"; malzeme: string }
  | { tur: "yanlis"; malzeme: string; beklenen: string }
  | { tur: "sira" }
  | { tur: "cig"; sira: number }
  | { tur: "fazlaPismis"; sira: number }
  | { tur: "kalinlik"; sira: number; istenen: Kalinlik };

export interface Degerlendirme {
  kalite: number;
  sonuc: Sonuc;
  hatalar: Hata[];
  /** Beklenen listenin her satırı için: yerinde doğru mu? (kartta ✓ / kırmızı göstermek için) */
  dogru: boolean[];
}

type Islem = "esles" | "yanlis" | "fazla" | "eksik" | "sira";

/** a (beklenen) -> b (tabak) en ucuz düzenleme işlemleri */
function hizala(a: string[], b: string[]): { islem: Islem; i: number; j: number }[] {
  const n = a.length;
  const m = b.length;
  const d: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const maliyet = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + maliyet);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== a[i - 2]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  const islemler: { islem: Islem; i: number; j: number }[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const maliyet = i > 0 && j > 0 && a[i - 1] === b[j - 1] ? 0 : 1;
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + maliyet) {
      islemler.push({ islem: maliyet === 0 ? "esles" : "yanlis", i: i - 1, j: j - 1 });
      i--;
      j--;
    } else if (
      i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] &&
      a[i - 1] !== a[i - 2] && d[i][j] === d[i - 2][j - 2] + 1
    ) {
      islemler.push({ islem: "sira", i: i - 2, j: j - 2 });
      i -= 2;
      j -= 2;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      islemler.push({ islem: "eksik", i: i - 1, j: -1 });
      i--;
    } else {
      islemler.push({ islem: "fazla", i: -1, j: j - 1 });
      j--;
    }
  }
  return islemler.reverse();
}

export function degerlendir(
  beklenen: string[],
  tabak: TabakParcasi[],
  hataCarpani: number,
  ayar: Ayarlar,
  tercih?: Kalinlik
): Degerlendirme {
  const tabakIds = tabak.map((p) => p.malzeme);
  const hatalar: Hata[] = [];
  const dogru: boolean[] = beklenen.map(() => false);
  let ceza = 0;

  for (const o of hizala(beklenen, tabakIds)) {
    switch (o.islem) {
      case "esles":
        dogru[o.i] = true;
        break;
      case "yanlis":
        hatalar.push({ tur: "yanlis", malzeme: tabakIds[o.j], beklenen: beklenen[o.i] });
        ceza += ayar.hataCezasi.yanlis;
        break;
      case "eksik":
        hatalar.push({ tur: "eksik", malzeme: beklenen[o.i] });
        ceza += ayar.hataCezasi.eksik;
        break;
      case "fazla":
        hatalar.push({ tur: "fazla", malzeme: tabakIds[o.j] });
        ceza += ayar.hataCezasi.fazla;
        break;
      case "sira":
        hatalar.push({ tur: "sira" });
        ceza += ayar.hataCezasi.sira;
        break;
    }
  }

  let krepSirasi = 0;
  for (const parca of tabak) {
    if (parca.malzeme !== "krep") continue;
    krepSirasi++;
    if (parca.pisme === "cig") {
      hatalar.push({ tur: "cig", sira: krepSirasi });
      ceza += ayar.hataCezasi.pisme;
    } else if (parca.pisme === "fazla" || parca.pisme === "yanik") {
      hatalar.push({ tur: "fazlaPismis", sira: krepSirasi });
      ceza += ayar.hataCezasi.pisme;
    }
    // Tercih yoksa sipariş "normal" kalınlık ister: hamur miktarı da tarifin parçasıdır
    const istenen = tercih ?? "normal";
    if ((parca.kalinlik ?? "normal") !== istenen) {
      hatalar.push({ tur: "kalinlik", sira: krepSirasi, istenen });
      ceza += ayar.hataCezasi.tercih;
    }
  }

  const kalite = Math.max(0, Math.round(100 - ceza * hataCarpani));
  const sonuc: Sonuc =
    kalite >= ayar.kalite.perfect ? "perfect"
    : kalite >= ayar.kalite.great ? "great"
    : kalite >= ayar.kalite.good ? "good"
    : "olmadi";
  return { kalite, sonuc, hatalar, dogru };
}
