// Oyun tipleri (şema: docs/oyun-mimarisi.md §4)
export type Kategori = "krep" | "dolgu" | "sos" | "topping";
export type PismeBolgesi = "cig" | "az" | "orta" | "iyi" | "fazla" | "yanik";
export type Sonuc = "perfect" | "great" | "good" | "olmadi";

export interface Malzeme {
  id: string;
  ad: string;
  kategori: Kategori;
  acilis: number;
  maliyet: number;
  deger: number;
  ikon: string;
  renkDegiskeni: string;
  tatli?: boolean;
}

export interface MusteriTipi {
  id: string;
  ad: string;
  ikon: string;
  acilis: number;
  sabir: number;
  odeme: number;
  bahsis: number;
  ceza: number;
  dKaydirma: number;
  dMax?: number;
  tatliMi?: boolean;
}

export interface Bolum {
  id: number;
  musteriSayisi: number;
  eszamanli: 1 | 2 | 3;
  krep: [number, number];
  d: [number, number];
  tava: 1 | 2;
  tabak: 1 | 2;
  menu: string[];
  musteriAgirlik: Record<string, number>;
  yeni?: string;
}

export interface Siparis {
  parcalar: string[]; // aşağıdan yukarı malzeme id'leri
  d: number;
}

export interface TabakParcasi {
  malzeme: string;
  pisme?: PismeBolgesi; // yalnızca krep için
}

export interface Musteri {
  id: number;
  tip: string;
  siparis: Siparis;
  gelisZamani: number;
  sabirToplam: number;
  sabir: number;
}

export interface Ayarlar {
  pismeSuresi: number;
  bolgeler: { cig: number; az: number; orta: number; iyi: number; fazla: number };
  yanikBekleme: number;
  sosSuresi: number;
  dolguSuresi: number;
  toppingSuresi: number;
  copBasma: number;
  tabakMax: number;
  cevirmePx: number;
  cevirmeMs: number;
  perfectBonus: number;
  combo: { adim: number; max: number; baslangicBolumu: number };
  hiz: { dusus: number; min: number };
  gelmeAraligi: { baslangic: number; azalma: number; min: number };
  sabirDondurmaBolumu: number;
  gitmeBolumu: number;
  sabirTaban: number;
  cikisSuresi: number;
  mesajSuresi: number;
  zorlukAgirlik: { krep: number; dolgu: number; sos: number; topping: number };
  hataCezasi: { eksik: number; fazla: number; yanlis: number; sira: number; pisme: number };
  kalite: { perfect: number; great: number; good: number };
  odemeCarpani: { perfect: number; great: number; good: number; olmadi: number };
  ruhHali: { esik: number; yuz: string; bahsis: number }[];
  yildiz: [number, number, number];
}

/** Servis sonu adisyonu (docs/oyun-tasarimi.md §14) */
export interface Fis {
  kod: string;
  bolum: number;
  yildiz: number;
  net: number;
  tarih: string;
}
