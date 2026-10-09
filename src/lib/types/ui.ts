// Genel arayüz bileşenlerinin girdi tipleri (uygulamanın veri tiplerini tanımazlar)

/** Kart etiketinin anlamı; rengi buna göre app.css değişkenlerinden gelir */
export type EtiketTuru = "bilgi" | "basari" | "uyari" | "hata";

/** ui/Kart.svelte girdileri */
export interface KartGirdileri {
  baslik: string; // kartın ana metni (uzunsa iki satırda kesilir)
  altMetin?: string; // başlığın altındaki ikincil metin
  gorsel?: string; // görsel adresi; yoksa ikon ya da hiçbir şey
  ikon?: string; // görsel yerine emoji
  gorselAlt?: string; // görselin / ikonun alternatif metni (yoksa başlık kullanılır)
  etiket?: string; // sağ (RTL'de sol) köşedeki kısa etiket
  etiketTuru?: EtiketTuru; // etiketin anlamı; varsayılan "bilgi"
  href?: string; // verilirse kart bir bağlantıdır
  onclick?: () => void; // href yoksa ve verilirse kart bir düğmedir
}
