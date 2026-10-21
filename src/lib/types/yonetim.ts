// Yönetim paneli tipleri: alanlar yerel arka ucun (src-tauri/src/backend) döndürdüğü JSON ile birebir aynıdır (docs/backend.md)
import type { Snippet } from "svelte";
import type { Malzeme } from "./malzeme";
import type { MusteriTipi } from "./musteri";

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
export type YonetimSekmesi = "ozet" | "malzemeler" | "musteriler";

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
}

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
  kaynak: YonetimKaynagi; // silinecek kaydın kaynağı
  id: string; // silinecek kaydın kimliği
  ad: string; // onay cümlesinde görünen ad
  onSilindi: () => void; // arka uç silince
  onIptal: () => void; // vazgeçilince
}
