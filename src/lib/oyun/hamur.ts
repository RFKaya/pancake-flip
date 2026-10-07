// Hamur dökme: basılı tutma süresi = miktar. 1 = ideal; tolerans bölümle daralır (docs/oyun-tasarimi.md §4)
import type { Ayarlar, Kalinlik } from "../../types/oyun";

export interface Hamur {
  miktar: number; // 0 → boş, 1 → ideal, >1 → kalın
  yay: number; // 0..1: hamurun yayılma oranı
}

export const yeniHamur = (): Hamur => ({ miktar: 0, yay: 0 });

/** Bölüme göre ideal miktar toleransı (ilk bölümler çok geniş) */
export function hamurToleransi(bolumNo: number, ayar: Ayarlar): number {
  const t = ayar.hamur.tolerans;
  return Math.max(t.min, t.baslangic - t.adim * (bolumNo - 1));
}

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

export function hamurSonucu(miktar: number, bolumNo: number, ayar: Ayarlar): HamurSonuc {
  const tol = hamurToleransi(bolumNo, ayar);
  if (miktar < 1 - tol) return { kalinlik: "ince", mukemmel: false };
  if (miktar > 1 + tol) return { kalinlik: "kalin", mukemmel: false };
  return { kalinlik: "normal", mukemmel: true };
}
