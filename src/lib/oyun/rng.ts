// Tohumlu rastgele sayı üreteci (mulberry32): aynı tohum = aynı servis
export interface Rng {
  sonraki(): number;
  tamsayi(min: number, max: number): number;
  aralik(min: number, max: number): number;
  sec<T>(liste: readonly T[]): T;
  agirlikliSec(agirliklar: Record<string, number>): string;
}

export function rngOlustur(tohum: number): Rng {
  let a = tohum >>> 0;
  const sonraki = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    sonraki,
    tamsayi: (min, max) => min + Math.floor(sonraki() * (max - min + 1)),
    aralik: (min, max) => min + sonraki() * (max - min),
    sec: (liste) => liste[Math.floor(sonraki() * liste.length)],
    agirlikliSec(agirliklar) {
      const girdiler = Object.entries(agirliklar);
      const toplam = girdiler.reduce((s, [, w]) => s + w, 0);
      let r = sonraki() * toplam;
      for (const [anahtar, w] of girdiler) {
        r -= w;
        if (r <= 0) return anahtar;
      }
      return girdiler[girdiler.length - 1][0];
    },
  };
}
