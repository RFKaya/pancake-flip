// Oyun tipleri (şema: docs/oyun-mimarisi.md §4)
export type Kategori = "krep" | "dolgu" | "sos" | "topping";
export type PismeBolgesi = "cig" | "az" | "orta" | "iyi" | "fazla" | "yanik";
export type Sonuc = "perfect" | "great" | "good" | "olmadi";
export type Kalinlik = "ince" | "normal" | "kalin";
export type CevirKalitesi = "kacti" | "erken" | "iyi" | "mukemmel" | "gec";

export interface Malzeme {
  id: string;
  ad: string;
  kategori: Kategori;
  acilis: number; // açıldığı seviye
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
  acilis: number; // açıldığı seviye
  agirlik: number; // açıldıktan sonra görülme ağırlığı (normal = 1)
  sabir: number;
  odeme: number;
  bahsis: number;
  ceza: number;
  dKaydirma: number;
  dMax?: number;
  tatliMi?: boolean;
}

/** Bir seviyenin bütün oyun parametreleri (seviye numarasından hesaplanır; bkz. docs/sonsuz-seviye.md) */
export interface SeviyeAyari {
  seviye: number;
  zorluk: number; // 0..1, doyuma giden normalize zorluk
  gerekenMusteri: number;
  menu: string[]; // açık malzeme id'leri (krep hariç)
  krep: [number, number];
  d: [number, number];
  tava: number;
  eszamanli: number;
  cevirmeAcik: boolean;
  tercihAcik: boolean;
  yogunSaatAcik: boolean;
  ipucu: boolean;
  cevirPencere: number;
  hamurTolerans: number;
  pisirmeHizi: number;
  sabirCarpani: number;
  gelmeAraligi: number;
  tercihOlasiligi: number;
  musteriAgirlik: Record<string, number>;
}

export interface SeviyeYapilandirmasi {
  seviyeSiniri: number;
  devHizliSeviyeler: number[];
  devEnYuksek: number;
  gerekenMusteri: { noktalar: [number, number][]; ileriArtis: number; tavan: number };
  zorluk: { olcek: number };
  ilerleme: { perfect: number; great: number; good: number; olmadi: number; seri: { esik: number; bonus: number } };
  egriler: Record<"cevirPencere" | "hamurTolerans" | "pisirmeHizi" | "sabirCarpani" | "gelmeAraligi" | "ozelMusteriCarpani" | "tercihOlasiligi", [number, number]>;
  sabirMin: number;
  musteriArasi: number;
  ilkMusteriGecikmesi: number;
  ipucuSeviyesi: number;
  yogunSaat: { aralik: number; sure: number; gelmeCarpani: number; kazancCarpani: number };
  kademeler: { seviye: number; krep: [number, number]; d: [number, number]; eszamanli: number; tava: number }[];
  mekanikler: { seviye: number; id: string; ad: string; ikon: string }[];
  kilometreTaslari: { seviye: number; baslik: string; alt: string }[];
}

export interface Siparis {
  parcalar: string[]; // aşağıdan yukarı malzeme id'leri
  d: number;
  tercih?: Kalinlik; // müşteri bu kalınlıkta krep istiyor (yoksa fark etmez)
}

export interface TabakParcasi {
  malzeme: string;
  pisme?: PismeBolgesi; // yalnızca krep için
  kalinlik?: Kalinlik; // yalnızca krep için (hamur miktarı)
}

export interface Musteri {
  id: number;
  tip: string;
  siparis: Siparis;
  sabirToplam: number; // sn
  sabir: number; // kalan sn
}

export interface Ayarlar {
  pismeSuresi: number;
  pisirme: {
    yuzSuresi: number;
    ikinciYuzHiz: number;
    hizArtis: number;
    hizMax: number;
    fazlaP: number;
    yanikP: number;
    kacirP: number;
    puanDusus: number;
    anticipSn: number;
    ucusSn: number;
    kaymaSn: number;
    kalinHiz: Record<Kalinlik, number>;
    kalinKalite: Record<Kalinlik, number>;
  };
  hamur: {
    dokmeSn: number;
    max: number;
    min: number;
    yayPx: number;
    yayilSn: number;
  };
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
  combo: { adim: number; max: number; baslangicSeviye: number };
  cikisSuresi: number;
  mesajSuresi: number;
  zorlukAgirlik: { krep: number; dolgu: number; sos: number; topping: number };
  hataCezasi: { eksik: number; fazla: number; yanlis: number; sira: number; pisme: number; tercih: number };
  kalite: { perfect: number; great: number; good: number };
  odemeCarpani: { perfect: number; great: number; good: number; olmadi: number };
  ruhHali: { esik: number; yuz: string; bahsis: number }[];
  yildiz: [number, number, number];
}
