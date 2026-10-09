// Adisyon (fiş) kuralları: seviye fişinin kazancı (docs/oyun-mimarisi.md §5). Saf mantık; kayıt kayit.svelte.ts'te.
import type { Fis } from "../types";

/**
 * Yeni fişin kazancı: bir önceki fişten bu yana kasaya giren coin. Fiş, o anki kasayı da saklar ki sonraki fiş farkı
 * bulabilsin. Kasası bilinen önceki fiş yoksa (ilk fiş ya da eski sürüm fişleri) kazanç kasanın tamamıdır. Kasa önceki
 * fişinkinden azsa ilerleme sıfırlanmıştır: kazanç yine yeni kasadır (negatif kazanç yazılmaz).
 */
export function fisNeti(kasa: number, oncekiFisler: Fis[]): number {
  const k = Math.max(0, Math.round(kasa));
  const onceki = oncekiFisler.find((f) => typeof f.kasa === "number" && Number.isFinite(f.kasa))?.kasa;
  return onceki === undefined || k < onceki ? k : k - onceki;
}

const sonlu = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/**
 * localStorage'daki adisyon kaydını fiş listesine çevirir (en yeni başta). Kaydın başka alanları (kaldırılan bölüm
 * modelinin coin / bolumler alanları) önemsenmez. Kodu, seviyesi ya da tarihi olmayan girdi atlanır; yıldız ve
 * kazanç sayı değilse 0 sayılır, böylece Fişlerim toplamı NaN olmaz.
 */
export function fislerCoz(ham: string | null): Fis[] {
  if (!ham) return [];
  try {
    const v = JSON.parse(ham);
    if (v?.surum !== 1 || !Array.isArray(v.fisler)) return [];
    return v.fisler
      .filter((f: Partial<Fis> | null) => f && typeof f.kod === "string" && sonlu(f.bolum) && typeof f.tarih === "string")
      .map((f: Fis): Fis => ({
        kod: f.kod,
        bolum: f.bolum,
        yildiz: sonlu(f.yildiz) ? f.yildiz : 0,
        net: sonlu(f.net) ? f.net : 0,
        ...(sonlu(f.kasa) ? { kasa: f.kasa } : {}),
        tarih: f.tarih,
      }));
  } catch {
    return [];
  }
}
