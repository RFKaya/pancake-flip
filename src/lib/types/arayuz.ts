// Arayüz ve sahne tipleri (oyun kuralı değil, yalnızca görünüm durumu)
import type { Musteri } from "./musteri";
import type { Acilis } from "./seviye";
import type { Sonuc } from "./siparis";

/** Renk teması (localStorage "tema") */
export type Tema = "gunduz" | "gece";

/** Servis edilmiş ya da öfkeyle gitmiş müşteri: tepkisini göstermek için kısa süre sahnede kalır */
export interface Ayrilan {
  m: Musteri; // ayrılan müşteri
  durum: "mutlu" | "kizgin"; // ayrılış biçimi
  yemek: boolean; // memnun müşteri yemeye başladı mı
  derece?: Sonuc; // yalnızca görünüm: servis tepkisinin gücü
}

/** Tavadaki kısa ömürlü görsel efekt (yıldız, damla, yazı, duman, kor) */
export interface Fx {
  id: number; // efekt numarası
  tur: "yildiz" | "damla" | "yazi" | "puf" | "kor"; // efekt türü
  x: number; // başlangıç x (px)
  y: number; // başlangıç y (px)
  dx: number; // yatay yol (px)
  dy: number; // dikey yol (px)
  txt?: string; // yazı efektinin metni
  sinif?: string; // yazı efektinin renk sınıfı
  dogdu: number; // oluştuğu oyun zamanı (sn)
}

/** Tabağın üstündeki sonuç damgası (MÜKEMMEL!, HARİKA, BU DEĞİL!) */
export interface SonucMesaji {
  s: Sonuc; // sonuç katmanı
  neden: string; // yanlış tabakta kısa açıklama; başarıda boş
  kazanc: number; // kazanılan coin
  musteri?: number; // tabağın gittiği müşteri (yalnızca görünüm)
}

/** Seviye atlama şeridi */
export interface SeviyeBildirimi {
  id: number; // bildirim numarası (yeniden çizim için)
  seviye: number; // ulaşılan seviye
  baslik: string; // kilometre taşı başlığı; yoksa boş
  alt: string; // kilometre taşı alt yazısı; yoksa boş
  acilanlar: Acilis[]; // bu atlamada açılan yenilikler
}

/** Tabağa düşen malzeme animasyonu */
export interface DusenParca {
  id: number; // animasyon numarası
  ikon: string; // malzemenin emojisi
}

/** Tabaktan kasaya uçan ödül parası (sahne koordinatları, px) */
export interface UcanPara {
  id: number; // para numarası
  x: number; // başlangıç x
  y: number; // başlangıç y
  tx: number; // varış x (kasa)
  ty: number; // varış y (kasa)
  gec: number; // başlama gecikmesi (ms)
}

/** Kasanın yanında kısa süre görünen kazanç (+12) */
export interface KazancEtiketi {
  id: number; // etiket numarası
  deger: number; // kazanılan coin
}
