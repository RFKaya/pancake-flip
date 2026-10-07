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
  mukemmel: boolean; // "MÜKEMMEL DÖKÜŞ!": hedefe payın yarısından yakın
  az: boolean; // geçersizse: hedefin altında mı kaldı (geri bildirim için)
}

/**
 * Hedefin ± kabul payı (miktar birimiyle). Miktarlar normal krebe göre ölçeklidir (normal = 1), tolerans da normalin yüzdesidir.
 * Hiçbir hedefin payı normalinkinden dar olamaz: ince krep (hedef < 1) normal kadar süre tanır, kalın krep (hedef > 1) kendi
 * oranıyla genişler. Böylece müşterinin rastgele seçtiği kalınlık, dökme penceresini daraltıp zorluğu şansa bağlamaz.
 */
export const hamurPayi = (hedef: number, seviye: number): number => hamurToleransi(seviye) * Math.max(1, hedef);

/** Miktar, hedefin ± payı içinde mi? (sınırlar dahil; ör. seviye 1'de normal 0,90–1,10, ince 0,60–0,80) */
export function hamurIcinde(miktar: number, hedef: number, seviye: number): boolean {
  return Math.abs(miktar - hedef) <= hamurPayi(hedef, seviye) + 1e-9;
}

/** Geçerli kalınlık hedefleri: tercihler açılmadan yalnızca "normal" */
export const hamurHedefleri = (tercihAcik: boolean): Kalinlik[] => (tercihAcik ? ["ince", "normal", "kalin"] : ["normal"]);

export function hamurSonucu(miktar: number, seviye: number, ayar: Ayarlar, tercihAcik = false): HamurSonuc {
  for (const k of hamurHedefleri(tercihAcik)) {
    const h = ayar.hamur.hedef[k];
    if (hamurIcinde(miktar, h, seviye)) return { kalinlik: k, mukemmel: Math.abs(miktar - h) <= hamurPayi(h, seviye) / 2, az: false };
  }
  return { kalinlik: null, mukemmel: false, az: miktar < ayar.hamur.hedef.normal };
}
