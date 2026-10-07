// Hamur dökme: basılı tutma süresi = miktar. 1 = ideal; tolerans seviyeyle daralır (docs/oyun-tasarimi.md §4)
import type { Ayarlar, Kalinlik } from "../../types/oyun";
import { hamurToleransDegeri } from "./seviye";

export interface Hamur {
  miktar: number; // 0 → boş, 1 → ideal, >1 → kalın
  yay: number; // 0..1: hamurun yayılma oranı
}

export const yeniHamur = (): Hamur => ({ miktar: 0, yay: 0 });

/** Seviyeye göre ideal miktar toleransı (ilk seviyelerde çok geniş, ileride sabit bir tabana yaklaşır) */
export const hamurToleransi = (seviye: number): number => hamurToleransDegeri(seviye);

/** Basılı tutulan dt saniye hamur akıtır; tavan aşıldıysa true (taştı, dökme kendiliğinden biter) */
export function hamurDok(h: Hamur, dt: number, ayar: Ayarlar): boolean {
  h.miktar = Math.min(ayar.hamur.max, h.miktar + dt / ayar.hamur.dokmeSn);
  return h.miktar >= ayar.hamur.max;
}

/** Parmak px kadar hareket etti: hamur yayılır */
export function hamurYay(h: Hamur, px: number, ayar: Ayarlar) {
  h.yay = Math.min(1, h.yay + px * ayar.hamur.yayPx);
}

export interface HamurSonuc {
  kalinlik: Kalinlik;
  mukemmel: boolean; // "PERFECT POUR!"
}

export function hamurSonucu(miktar: number, seviye: number): HamurSonuc {
  const tol = hamurToleransi(seviye);
  if (miktar < 1 - tol) return { kalinlik: "ince", mukemmel: false };
  if (miktar > 1 + tol) return { kalinlik: "kalin", mukemmel: false };
  return { kalinlik: "normal", mukemmel: true };
}
