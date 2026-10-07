// Tava durum makinesi ve pişme bölgeleri (docs/oyun-tasarimi.md §4)
import type { Ayarlar, PismeBolgesi } from "../../types/oyun";

export interface Tava {
  durum: "bos" | "pisiyor" | "yanik";
  p: number; // pişme değeri
  yanikSn: number; // yanık olduktan sonra geçen süre
}

export const yeniTava = (): Tava => ({ durum: "bos", p: 0, yanikSn: 0 });

export function bolgeBul(p: number, ayar: Ayarlar): PismeBolgesi {
  const b = ayar.bolgeler;
  if (p < b.cig) return "cig";
  if (p < b.az) return "az";
  if (p < b.orta) return "orta";
  if (p < b.iyi) return "iyi";
  if (p < b.fazla) return "fazla";
  return "yanik";
}

/** Tavayı dt saniye ilerletir. Yanık krep bekleme süresini doldurunca true döner (kendiliğinden çöpe gider). */
export function tavaIlerlet(tava: Tava, dt: number, ayar: Ayarlar): boolean {
  if (tava.durum === "bos") return false;
  if (tava.durum === "pisiyor") {
    tava.p += dt / ayar.pismeSuresi;
    if (tava.p > ayar.bolgeler.fazla) {
      tava.durum = "yanik";
      tava.yanikSn = 0;
    }
    return false;
  }
  tava.yanikSn += dt;
  return tava.yanikSn >= ayar.yanikBekleme;
}
