// Sonsuz seviye kaydının çözümü (saf mantık; localStorage okuma / yazma ilerleme.svelte.ts'te). Bozuk ya da eski kayıtla çökmez.
import { gerekenMusteri, seviyeSinirla } from "./seviye";
import { SEVIYE } from "./veri";

export interface IlerlemeVerisi {
  surum: 1;
  seviye: number; // playerLevel
  ilerleme: number; // progressToNextLevel
  toplamMusteri: number; // totalCustomersServed
  toplamCoin: number; // totalCoins
  enYuksekSeviye: number;
  enIyiSeri: number; // en uzun seri rekoru (eski kayıtlarda yok → 0)
  toplamMukemmel: number; // PERFECT servis sayısı (eski kayıtlarda yok → 0)
}

export const bosIlerleme = (): IlerlemeVerisi => ({
  surum: 1,
  seviye: 1,
  ilerleme: 0,
  toplamMusteri: 0,
  toplamCoin: 0,
  enYuksekSeviye: 1,
  enIyiSeri: 0,
  toplamMukemmel: 0,
});
const sayi = (x: unknown, varsayilan: number) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : varsayilan);

/**
 * Kayıttaki ilerleme, seviyenin gerektirdiği müşteri sayısına ulaşamaz: kaydedilirken her zaman seviye atlanmış olur.
 * Ulaşmışsa (seviye.json'da gerekenMusteri düşürüldü ya da kayıt bozuk) seviye atlamaya bir müşteri kalacak şekilde
 * kırpılır; aksi hâlde ekranda "40 / 3" görünür ve sonraki tek servis bir anda onlarca seviye atlatırdı.
 */
export function ilerlemeKirp(seviye: number, ilerleme: number): number {
  if (seviye >= SEVIYE.seviyeSiniri) return 0;
  return Math.min(ilerleme, Math.max(0, gerekenMusteri(seviye) - 1));
}

/** localStorage'daki ham metni güvenli bir kayda çevirir */
export function ilerlemeCoz(ham: string | null): IlerlemeVerisi {
  if (!ham) return bosIlerleme();
  try {
    const v = JSON.parse(ham);
    if (v?.surum !== 1) return bosIlerleme();
    const seviye = seviyeSinirla(sayi(v.seviye, 1));
    return {
      surum: 1,
      seviye,
      ilerleme: ilerlemeKirp(seviye, sayi(v.ilerleme, 0)),
      toplamMusteri: sayi(v.toplamMusteri, 0),
      toplamCoin: sayi(v.toplamCoin, 0),
      enYuksekSeviye: Math.max(seviye, seviyeSinirla(sayi(v.enYuksekSeviye, 1))),
      enIyiSeri: Math.floor(sayi(v.enIyiSeri, 0)),
      toplamMukemmel: Math.floor(sayi(v.toplamMukemmel, 0)),
    };
  } catch {
    return bosIlerleme();
  }
}
