// Liste ekranlarının tek yükleme noktası (Malzeme rehberi, Fişlerim). Ekranlar veriyi yalnız buradan alır ve dört hâlden
// birini gösterir: yükleniyor, hata, boş, dolu. Geliştirme için hâl adres çubuğundan zorlanabilir: docs/gelistirme-notlari.md
import { kayit } from "./kayit.svelte";
import { MALZEMELER } from "./oyun/veri";
import type { Fis, Malzeme, ZorlananDurum } from "./types";
import { ornekFisler } from "./veri/ornek";

/** Adresteki ?durum=yukleniyor|hata|bos|ornek değeri (yoksa null) */
export function zorlananDurum(): ZorlananDurum | null {
  if (typeof window === "undefined") return null;
  const d = new URLSearchParams(window.location.search).get("durum");
  return d === "yukleniyor" || d === "hata" || d === "bos" || d === "ornek" ? d : null;
}

/** Hiç bitmeyen yükleme (yalnız ?durum=yukleniyor için) */
const hicBitmeyen = () => new Promise<never>(() => {});

/**
 * Zorlanan hâli uygular. `deneme` kaçıncı yükleme olduğunu söyler (0 = ilk): ?durum=hata yalnız ilk denemede hata verir,
 * böylece "Tekrar dene" düğmesi gerçekten listeyi getirir.
 */
async function zorla<T>(deneme: number, ornek: T[] | null, gercek: () => T[]): Promise<T[]> {
  const z = zorlananDurum();
  if (z === "yukleniyor") return hicBitmeyen();
  if (z === "hata" && deneme === 0) throw new Error("Zorlanan hata (?durum=hata)");
  if (z === "bos") return [];
  if (z === "ornek" && ornek) return ornek;
  return gercek();
}

/** Malzeme rehberinin verisi: oyunun malzemeleri (src/lib/veri/malzemeler.json) */
export function malzemeleriYukle(deneme = 0): Promise<Malzeme[]> {
  return zorla(deneme, null, () => MALZEMELER);
}

/** Fişlerim'in verisi: cihazdaki adisyonlar, en yeni başta; ?durum=ornek ile src/lib/veri/ornek.ts fişleri */
export function fisleriYukle(deneme = 0): Promise<Fis[]> {
  return zorla(deneme, ornekFisler, () => {
    kayit.yukle();
    return kayit.fisler();
  });
}
