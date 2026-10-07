// Müşteri sabrı ve ruh hali (docs/oyun-tasarimi.md §7)
import type { Ayarlar, MusteriTipi } from "../../types/oyun";

export const hizCarpani = (bolumNo: number, ayar: Ayarlar) =>
  Math.max(ayar.hiz.min, 1 - ayar.hiz.dusus * (bolumNo - 1));

/** sabır (sn) = (10 + 5 × D) × hız(bölüm) × tipÇarpanı */
export const sabirHesapla = (d: number, bolumNo: number, tip: MusteriTipi, ayar: Ayarlar) =>
  (10 + 5 * d) * hizCarpani(bolumNo, ayar) * tip.sabir;

export function ruhHali(oran: number, ayar: Ayarlar) {
  return ayar.ruhHali.find((r) => oran > r.esik) ?? ayar.ruhHali[ayar.ruhHali.length - 1];
}
