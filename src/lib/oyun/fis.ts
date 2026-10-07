// Adisyon (fiş) kuralları: seviye fişinin kazancı (docs/oyun-mimarisi.md §5). Saf mantık; kayıt kayit.svelte.ts'te.
import type { Fis } from "../../types/oyun";

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
