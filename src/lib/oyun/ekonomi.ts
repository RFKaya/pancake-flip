// Fiyat, ödeme, bahşiş, combo ve yıldız eşikleri (docs/oyun-tasarimi.md §9)
import type { Ayarlar, Malzeme, MusteriTipi, Siparis, Sonuc } from "../../types/oyun";
import { ruhHali } from "./musteri";

const bul = (malzemeler: Malzeme[], id: string) => malzemeler.find((m) => m.id === id) as Malzeme;

export const siparisFiyati = (s: Siparis, malzemeler: Malzeme[]) =>
  s.parcalar.reduce((t, id) => t + bul(malzemeler, id).deger, 0);

export const siparisMaliyeti = (parcalar: string[], malzemeler: Malzeme[]) =>
  parcalar.reduce((t, id) => t + bul(malzemeler, id).maliyet, 0);

export const comboCarpani = (combo: number, seviye: number, ayar: Ayarlar) =>
  seviye >= ayar.combo.baslangicSeviye
    ? Math.min(ayar.combo.max, ayar.combo.adim * (combo - 1))
    : 0;

export interface Gelir {
  odeme: number;
  bahsis: number;
  combo: number;
  bonus: number;
  toplam: number; // maliyet düşülmeden
}

/** Bir siparişin geliri (maliyet servis sırasında malzeme konurken ayrıca düşülür) */
export function gelirHesapla(p: {
  fiyat: number;
  sonuc: Sonuc;
  tip: MusteriTipi;
  sabirOrani: number;
  combo: number; // bu servisten sonraki combo değeri
  seviye: number;
  ayar: Ayarlar;
}): Gelir {
  const { fiyat, sonuc, tip, sabirOrani, combo, seviye, ayar } = p;
  const odeme = fiyat * ayar.odemeCarpani[sonuc] * tip.odeme;
  const bahsis = fiyat * ruhHali(sabirOrani, ayar).bahsis * tip.bahsis;
  const comboKazanc = (odeme + bahsis) * comboCarpani(combo, seviye, ayar);
  const bonus = sonuc === "perfect" ? ayar.perfectBonus : 0;
  return { odeme, bahsis, combo: comboKazanc, bonus, toplam: odeme + bahsis + comboKazanc + bonus };
}

/** Servisin ideal net kazancı M: hepsi PERFECT, müşteriler 😊, combo yok */
export function idealNet(
  siparisler: { siparis: Siparis; tip: MusteriTipi }[],
  malzemeler: Malzeme[],
  ayar: Ayarlar
): number {
  let toplam = 0;
  for (const { siparis, tip } of siparisler) {
    const fiyat = siparisFiyati(siparis, malzemeler);
    const g = gelirHesapla({
      fiyat, sonuc: "perfect", tip, sabirOrani: 1, combo: 1, seviye: 1, ayar,
    });
    toplam += g.toplam - siparisMaliyeti(siparis.parcalar, malzemeler);
  }
  return toplam;
}

export function yildizHesapla(net: number, ideal: number, ayar: Ayarlar): 0 | 1 | 2 | 3 {
  const [a, b, c] = ayar.yildiz;
  if (net >= ideal * c) return 3;
  if (net >= ideal * b) return 2;
  if (net >= ideal * a) return 1;
  return 0;
}
