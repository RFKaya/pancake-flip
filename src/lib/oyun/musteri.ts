// Müşteri sabrı ve ruh hali (docs/oyun-tasarimi.md §7, docs/sonsuz-seviye.md)
import type { Ayarlar, MusteriTipi } from "../types";
import { SEVIYE } from "./veri";
import { sabirCarpaniDegeri } from "./seviye";

/** sabır (sn) = (10 + 5 × D) × seviye çarpanı × tip çarpanı; asla sabirMin'in altına inmez */
export const sabirHesapla = (d: number, seviye: number, tip: MusteriTipi) =>
  Math.max(SEVIYE.sabirMin, (10 + 5 * d) * sabirCarpaniDegeri(seviye) * tip.sabir);

export function ruhHali(oran: number, ayar: Ayarlar) {
  return ayar.ruhHali.find((r) => oran > r.esik) ?? ayar.ruhHali[ayar.ruhHali.length - 1];
}
