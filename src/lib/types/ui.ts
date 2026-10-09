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

/** Bir liste ekranının hâli: yalnız biri gösterilir */
export type ListeDurumu = "yukleniyor" | "hata" | "bos" | "dolu";

/** ui/Yukleniyor.svelte girdileri */
export interface YukleniyorGirdileri {
  metin: string; // ekran okuyucuya söylenen "yükleniyor" metni
  satir?: number; // iskelette kaç satır görünsün; varsayılan 4
}

/** ui/BosDurum.svelte girdileri */
export interface BosDurumGirdileri {
  baslik: string; // kısa başlık ("Henüz fiş yok")
  aciklama?: string; // ne yapılabileceğini anlatan cümle
  ikon?: string; // başlığın üstündeki emoji
  dugmeMetni?: string; // düğme yazısı; yoksa düğme çizilmez
  href?: string; // düğme bir bağlantıysa adresi
  onDugme?: () => void; // düğme bir eylemse (örn. süzgeci temizle)
}

/** ui/HataDurumu.svelte girdileri */
export interface HataDurumuGirdileri {
  baslik: string; // kısa başlık ("Bir şeyler ters gitti")
  mesaj: string; // ne olduğunu anlatan cümle
  tekrarMetni?: string; // "Tekrar dene" düğmesinin yazısı; yoksa düğme çizilmez
  onTekrar?: () => void; // tekrar deneme eylemi
}

/** Geliştirme sırasında adres çubuğundan zorlanan liste hâli (?durum=…; docs/gelistirme-notlari.md) */
export type ZorlananDurum = "yukleniyor" | "hata" | "bos" | "ornek";
