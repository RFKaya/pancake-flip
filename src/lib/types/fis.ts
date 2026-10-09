// Adisyon (fiş) tipi: kilometre taşlarında ve her 10. seviyede kesilir (docs/oyun-tasarimi.md §14)

/** Fişteki yıldız sayısı */
export type Yildiz = 0 | 1 | 2 | 3;

export interface Fis {
  kod: string; // adisyon kodu: Rust'tan "KRP-SSS-YXXXXXX", tarayıcıda "WEB-…"
  bolum: number; // fişin kesildiği seviye (eski adıyla bölüm)
  yildiz: number; // 0–3 yıldız (Yildiz)
  net: number; // bir önceki fişten bu yana kazanılan coin
  kasa?: number; // fiş kesildiği andaki toplam coin; eski fişlerde yok
  tarih: string; // ISO 8601 tarih-saat
}
