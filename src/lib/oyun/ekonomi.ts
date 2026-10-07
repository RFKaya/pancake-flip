// Fiyat, ödeme, bahşiş ve combo (docs/oyun-tasarimi.md §9)
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
