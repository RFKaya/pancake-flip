// Tava ve tabaktaki krebin durum tipleri
import type { Kalinlik } from "./siparis";

/** Krebin ayrıntılı pişme bölgesi (puanlama için) */
export type PismeBolgesi = "cig" | "az" | "orta" | "iyi" | "fazla" | "yanik";

/** Oyuncuya görünen pişme durumu: yalnızca üç hâl (docs/sonsuz-seviye.md §1.1) */
export type PismeDurumu = "cig" | "pismis" | "yanik";

/** Çevirme zamanlamasının kalitesi */
export type CevirKalitesi = "kacti" | "erken" | "iyi" | "mukemmel" | "gec";

export interface TabakParcasi {
  malzeme: string; // Malzeme.id
  pisme?: PismeBolgesi; // yalnızca krep için: pişme bölgesi
  kalinlik?: Kalinlik; // yalnızca krep için: hamur miktarından gelen kalınlık
  usta?: boolean; // yalnızca krep için: kusursuz döküm + kusursuz çevirme (PERFECT için)
}
