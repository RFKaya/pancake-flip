// Yönetim paneli tipleri: alanlar yerel arka ucun (src-tauri/src/backend) döndürdüğü JSON ile birebir aynıdır (docs/backend.md)
import type { Snippet } from "svelte";
import type { Malzeme } from "./malzeme";
import type { MusteriTipi } from "./musteri";
import type { Ayarlar } from "./ayarlar";
import type { Acilis, SeviyeYapilandirmasi } from "./seviye";
import type { Siparis } from "./siparis";

/** Arka uç kullanıcısı (auth.rs → User) */
export interface YonetimKullanicisi {
  id: number; // kullanıcı numarası
  name: string; // ad soyad
  email: string; // giriş e-postası
  status: string; // "active" | "suspended" | "banned"
  lastLoginAt: string | null; // son giriş zamanı (ISO-8601), hiç girmediyse null
  createdAt: string; // kayıt zamanı (ISO-8601)
}

/** Oturumdaki kullanıcı ve yetkileri (auth_me, auth_login, auth_register) */
export interface YonetimOturumu {
  user: YonetimKullanicisi; // giriş yapan kullanıcı
  roles: string[]; // rol adları (örn. "admin", "game_designer")
  superAdmin: boolean; // "admin" rolü: her izni geçer
  permissions: string[]; // "Eylem:Kaynak" biçiminde izinler (örn. "ViewAny:Player")
}

/** Panel özeti (pancake_dashboard): oyuncu kayıtlarından hesaplanır */
export interface PanelOzeti {
  oyuncu: number; // kayıtlı oyuncu sayısı
  ortalamaSeviye: number | null; // oyuncuların ortalama seviyesi; oyuncu yoksa null
  medyanSeviye: number | null; // ortanca seviye; oyuncu yoksa null
  enYuksekSeviye: number | null; // ulaşılan en yüksek seviye; oyuncu yoksa null
  toplamServis: number; // servis edilen toplam müşteri
  perfectOrani: number; // PERFECT servislerin oranı (0–1)
  dagilim: { aralik: string; sayi: number }[]; // seviye aralığına göre oyuncu sayısı
}

/** Oyun içeriğinin özeti: src/lib/veri/*.json dosyalarından hesaplanır (Rust gerektirmez) */
export interface IcerikOzeti {
  malzeme: number; // malzeme sayısı
  musteriTipi: number; // müşteri tipi sayısı
  mekanik: number; // seviyeyle açılan mekanik sayısı
  kilometreTasi: number; // fiş kesilen kilometre taşı sayısı
  seviyeSiniri: number; // ulaşılabilecek en yüksek seviye
}

/** Arka uç hata kodları (error.rs → AppError::code) */
export type ArkaUcKodu = "unauthenticated" | "forbidden" | "not_found" | "validation" | "conflict" | "db" | "internal";

/** Doğrulama hatasında alan bazlı ileti (error.rs → FieldError) */
export interface AlanHatasi {
  field: string; // hatalı alanın adı
  message: string; // kullanıcıya gösterilecek ileti
}

/** Yönetim panelinin sekmeleri (kenar menüsü); sonraki aşamalarda yenileri eklenir */
export type YonetimSekmesi = "ozet" | "malzemeler" | "musteriler" | "egri" | "kilometre" | "simulator" | "denge" | "surumler";

/** Kenar menüsündeki bir bölüm (ad sözlükten gelir: menu[id]) */
export interface YonetimMenuOgesi {
  id: YonetimSekmesi; // bölüm kimliği
  ikon: string; // menüde adın önündeki emoji
}

/** admin/Giris.svelte girdileri */
export interface GirisGirdileri {
  onGiris: (oturum: YonetimOturumu) => void; // giriş ya da kayıt başarılı olunca oturumla çağrılır
}

/** admin/PanelOzeti.svelte girdileri */
export interface PanelOzetiGirdileri {
  oyuncuVerisi: boolean; // oyuncu istatistikleri yüklensin mi (uygulamada ve oturum varken true)
}

/** Yerel arka uçtaki kaynaklar ve kayıt tipleri (schema.rs → Entity.resource); sonraki aşamalarda yenileri eklenir */
export interface YonetimKaynaklari {
  Malzeme: Malzeme;
  MusteriTipi: MusteriTipi;
  GameConfig: OyunAyarKaydi;
  ContentVersion: IcerikSurumu;
}

/** Yayındaki oyun ayarı (game_configs): "seviye" → SeviyeYapilandirmasi, "ayarlar" → Ayarlar */
export interface OyunAyarKaydi {
  key: "seviye" | "ayarlar"; // hangi ayar dosyası
  version: number; // yayındaki sürüm numarası
  data: SeviyeYapilandirmasi | Ayarlar; // ayarın tamamı
  updatedAt: string | null; // son yayın zamanı (ISO-8601)
}

/** İçerik sürümü kapsamı (content_versions.kapsam) */
export type IcerikKapsami = "malzemeler" | "musteriler" | "seviye" | "ayarlar";

/** İçerik sürümü (content_versions): taslak hazırlanır, doğrulanıp yayınlanır, gerekirse geri alınır */
export interface IcerikSurumu {
  id: string; // kayıt kimliği
  kapsam: IcerikKapsami; // hangi içerik
  surum: number; // kapsam içinde artan sürüm numarası
  durum: "taslak" | "yayinda" | "geri-alindi"; // yaşam döngüsü
  yayinlayan: string | null; // yayınlayan kullanıcının numarası
  yayinTarihi: string | null; // yayın zamanı (ISO-8601)
  not: string | null; // sürüm notu
  veri: unknown; // içeriğin tamamı (kapsama göre ayar nesnesi ya da liste)
}

/** Ayar nesnesindeki bir sayı alanı: "kalite.perfect" gibi noktalı yol ve değeri */
export interface SayiAlani {
  yol: string; // nesne içindeki noktalı yol
  deger: number; // alanın değeri
}

/** Seviye eğrisi tablosunun bir satırı (oyunun kurallarından hesaplanır) */
export interface EgriSatiri {
  seviye: number; // seviye
  gerekenMusteri: number; // seviyeyi geçmek için gereken müşteri
  zorluk: number; // 0–1
  cevirPencere: number; // çevirme penceresi
  hamurTolerans: number; // döküm toleransı
  sabirCarpani: number; // sabır çarpanı
  gelmeAraligi: number; // müşteri geliş aralığı (sn)
  tava: number; // tava sayısı
  eszamanli: number; // aynı anda bekleyen müşteri
}

/** Bir seviyedeki kilometre taşı ve açılan yenilikler */
export interface SeviyeDurak {
  seviye: number; // seviye
  kilometreTasi: { baslik: string; alt: string } | null; // fiş kesilen kilometre taşı
  acilislar: Acilis[]; // bu seviyede açılan malzeme, müşteri ve mekanikler
}

/** Simülatördeki örnek sipariş: açık bir müşteri tipinin bu seviyede isteyebileceği tabak */
export interface OrnekSiparis {
  tip: MusteriTipi; // müşteri tipi
  siparis: Siparis; // üretilen sipariş
  fiyat: number; // siparişin fiyatı (coin)
  sabir: number; // müşterinin sabrı (sn)
}

/** admin/EkranBasligi.svelte girdileri: ekranın başlığı, açıklaması, bilgi notu ve sağdaki düğmeler */
export interface EkranBasligiGirdileri {
  baslik: string; // ekranın adı
  aciklama: string; // bir cümlelik açıklama
  not?: string; // vurgulu bilgi notu (veri nereden geliyor)
  children?: Snippet; // sağda duran eylemler (örn. "Yeni" düğmesi)
}

/** Ekran girdileri: Sürümler ve Denge (oturum izinler için) */
export type AyarEkraniGirdileri = KatalogGirdileri;

/** Kaynak adı ("Malzeme", "MusteriTipi") */
export type YonetimKaynagi = keyof YonetimKaynaklari;

/** Liste sorgusu (crud.rs → ListQuery) */
export interface ListeSorgusu {
  search?: string; // id ve ad içinde arama
  page?: number; // 1'den başlar
  pageSize?: number; // 1–100, varsayılan 25
  sort?: { key: string; dir?: "asc" | "desc" }; // sıralama sütunu
  filters?: Record<string, unknown>; // tam eşleşme; dizi = içinde; "<ad>Min" / "<ad>Max" = aralık
}

/** Sayfalı liste sonucu (crud.rs → Paged) */
export interface Sayfa<T> {
  items: T[]; // bu sayfadaki kayıtlar
  total: number; // süzgece uyan toplam kayıt
  page: number; // sayfa numarası
  pageSize: number; // sayfa boyu
}

/** Formdaki hatalar: alan adı → ileti; boşsa form geçerli */
export type FormHatalari = Record<string, string>;

/** Malzemeler ve Müşteri Tipleri ekranlarının girdileri */
export interface KatalogGirdileri {
  oturum: YonetimOturumu | null; // oturumdaki kullanıcı (izinler buradan); tarayıcıda null
}

/** admin/Pencere.svelte girdileri: üstte başlık, altta içerik olan iletişim kutusu */
export interface PencereGirdileri {
  baslik: string; // pencerenin başlığı
  onKapat: () => void; // Esc, dış tıklama ya da kapat düğmesi
  kapatMetni: string; // kapat düğmesinin ekran okuyucu adı
  children: Snippet; // pencerenin içeriği
}

/** admin/MalzemeFormu.svelte girdileri */
export interface MalzemeFormuGirdileri {
  kayit: Malzeme | null; // düzenlenen malzeme; null ise yeni malzeme
  mevcutIdler: string[]; // yeni kimlik bunlardan biri olamaz
  onKaydedildi: (kayit: Malzeme) => void; // arka uç kaydı döndürünce
  onIptal: () => void; // vazgeçilince
}

/** admin/MusteriTipiFormu.svelte girdileri */
export interface MusteriTipiFormuGirdileri {
  kayit: MusteriTipi | null; // düzenlenen tip; null ise yeni tip
  mevcutIdler: string[]; // yeni kimlik bunlardan biri olamaz
  onKaydedildi: (kayit: MusteriTipi) => void; // arka uç kaydı döndürünce
  onIptal: () => void; // vazgeçilince
}

/** admin/SilmeOnayi.svelte girdileri */
export interface SilmeOnayiGirdileri {
  kaynak: "Malzeme" | "MusteriTipi"; // silinecek kaydın kaynağı
  id: string; // silinecek kaydın kimliği
  ad: string; // onay cümlesinde görünen ad
  onSilindi: () => void; // arka uç silince
  onIptal: () => void; // vazgeçilince
}
