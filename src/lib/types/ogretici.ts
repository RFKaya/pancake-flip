import type { Kalinlik } from "./siparis";

export type TavaOgreticiDurumu = "bos" | "dokuyor" | "birak" | "fazla" | "cevir" | "tabaga" | "mesgul";

export type OgreticiHedefi =
  | { tur: "tava"; sira: number }
  | { tur: "malzeme"; id: string }
  | { tur: "fis"; musteri?: number }
  | { tur: "tabak" }
  | { tur: "seri" }
  | { tur: "yogun" };

export interface OgreticiIpucu {
  id: string;
  ikon: string;
  baslik: string;
  metin: string;
  hedef: OgreticiHedefi;
  sureli?: boolean;
}

export interface OgreticiBaglam {
  seviye: number;
  gorulen: readonly string[];
  tavalar: readonly TavaOgreticiDurumu[];
  siradaki: string | null;
  hedef: { tercih?: Kalinlik } | null;
  fisler: readonly { id: number; tip: string; krep: number; parca: number }[];
  teslimde: boolean;
  yogunSaat: boolean;
  seri: number;
}
