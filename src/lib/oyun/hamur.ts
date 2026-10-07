// Hamur dökme: basılı tutma süresi = miktar. Her kalınlığın bir hedef miktarı vardır; hedefin ± payı içindeki döküm krep olur:
// İDEAL (orta) ya da BİRAZ AZ / BİRAZ FAZLA (kenarlar). Yalnızca belirgin sapma krep yapmaz (docs/sonsuz-seviye.md §1.1).
import type { Ayarlar, Kalinlik } from "../../types/oyun";
import { hamurToleransDegeri } from "./seviye";
import { AYAR } from "./veri";

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

/** Dökümün hedefe göre durumu: İDEAL (payın yarısı içinde) · BİRAZ AZ / BİRAZ FAZLA (pay içinde, krep olur) · AZ / FAZLA (belirgin sapma, krep olmaz) */
export type HamurDurumu = "az" | "biraz-az" | "ideal" | "biraz-fazla" | "fazla";

export interface HamurSonuc {
  /** Dökülen miktarın denk geldiği kalınlık; hiçbir hedefin payına girmiyorsa null (krep geçersiz, atılır) */
  kalinlik: Kalinlik | null;
  mukemmel: boolean; // İDEAL döküm ("MÜKEMMEL" siparişe katkı): hedefe payın yarısından yakın
  az: boolean; // geçersizse: hedefin altında mı kaldı (geri bildirim için)
  durum: HamurDurumu;
}

/** Kalınlık hedefleri arasındaki en yakın komşunun yarı mesafesi: tercihler açıkken pencereler birbirine girmesin */
function komsuPayi(hedef: number): number {
  const d = Object.values(AYAR.hamur.hedef).filter((h) => h !== hedef).map((h) => Math.abs(h - hedef));
  return d.length ? (Math.min(...d) / 2) * 0.98 : Infinity;
}

/**
 * Hedefin ± kabul payı (miktar birimiyle). Miktarlar normal krebe göre ölçeklidir (normal = 1), tolerans da normalin yüzdesidir.
 * Hiçbir hedefin payı normalinkinden dar olamaz: ince krep (hedef < 1) normal kadar süre tanır, kalın krep (hedef > 1) kendi
 * oranıyla genişler. Kalınlık tercihleri açıkken pay, komşu kalınlığın penceresine girmeyecek kadarla sınırlanır.
 */
export const hamurPayi = (hedef: number, seviye: number, tercihAcik = false): number => {
  const pay = hamurToleransi(seviye) * Math.max(1, hedef);
  return tercihAcik ? Math.min(pay, komsuPayi(hedef)) : pay;
};

/** Miktar, hedefin ± payı içinde mi? (sınırlar dahil; ör. seviye 1'de normal 0,70–1,30) */
export function hamurIcinde(miktar: number, hedef: number, seviye: number, tercihAcik = false): boolean {
  return Math.abs(miktar - hedef) <= hamurPayi(hedef, seviye, tercihAcik) + 1e-9;
}

/** Aynı miktar her zaman aynı sonucu verir (rastgelelik yok). */
export function hamurDurumu(miktar: number, hedef: number, seviye: number, tercihAcik = false): HamurDurumu {
  const pay = hamurPayi(hedef, seviye, tercihAcik);
  const sap = miktar - hedef;
  if (Math.abs(sap) <= pay / 2 + 1e-9) return "ideal";
  if (Math.abs(sap) <= pay + 1e-9) return sap < 0 ? "biraz-az" : "biraz-fazla";
  return sap < 0 ? "az" : "fazla";
}

/** Geçerli kalınlık hedefleri: tercihler açılmadan yalnızca "normal" */
export const hamurHedefleri = (tercihAcik: boolean): Kalinlik[] => (tercihAcik ? ["ince", "normal", "kalin"] : ["normal"]);

export function hamurSonucu(miktar: number, seviye: number, ayar: Ayarlar, tercihAcik = false): HamurSonuc {
  for (const k of hamurHedefleri(tercihAcik)) {
    const d = hamurDurumu(miktar, ayar.hamur.hedef[k], seviye, tercihAcik);
    if (d !== "az" && d !== "fazla") return { kalinlik: k, mukemmel: d === "ideal", az: false, durum: d };
  }
  const az = miktar < ayar.hamur.hedef.normal;
  return { kalinlik: null, mukemmel: false, az, durum: az ? "az" : "fazla" };
}
