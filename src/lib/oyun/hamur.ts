// Hamur dökme: basılı tutma süresi = miktar. Her kalınlığın bir hedef miktarı vardır; yalnızca hedefin ±toleransı
// içindeki döküm geçerli krep olur (docs/sonsuz-seviye.md §1.1). Tolerans seviyeyle biraz daralır.
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
  /** Dökülen miktarın denk geldiği kalınlık; hiçbir hedefin toleransına girmiyorsa null (krep geçersiz, atılır) */
  kalinlik: Kalinlik | null;
  mukemmel: boolean; // "PERFECT POUR!": hedefe toleransın yarısından yakın
  az: boolean; // geçersizse: hedefin altında mı kaldı (geri bildirim için)
}

/** Miktar, hedefin ±tolerans aralığında mı? (sınırlar dahil; ör. hedef 1, tolerans 0,10 → 0,90–1,10) */
export function hamurIcinde(miktar: number, hedef: number, seviye: number): boolean {
  return Math.abs(miktar / hedef - 1) <= hamurToleransi(seviye) + 1e-9;
}

/** Geçerli kalınlık hedefleri: tercihler açılmadan yalnızca "normal" */
export const hamurHedefleri = (tercihAcik: boolean): Kalinlik[] => (tercihAcik ? ["ince", "normal", "kalin"] : ["normal"]);

export function hamurSonucu(miktar: number, seviye: number, ayar: Ayarlar, tercihAcik = false): HamurSonuc {
  const tol = hamurToleransi(seviye);
  for (const k of hamurHedefleri(tercihAcik)) {
    const h = ayar.hamur.hedef[k];
    if (hamurIcinde(miktar, h, seviye)) return { kalinlik: k, mukemmel: Math.abs(miktar / h - 1) <= tol / 2, az: false };
  }
  return { kalinlik: null, mukemmel: false, az: miktar < ayar.hamur.hedef.normal };
}
