// Yönetim paneli tipleri: alanlar yerel arka ucun (src-tauri/src/backend) döndürdüğü JSON ile birebir aynıdır (docs/backend.md)

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
export type YonetimSekmesi = "ozet";

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
