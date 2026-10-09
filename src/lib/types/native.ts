// Rust komutlarının sonuç ve hata tipleri: alanlar src-tauri/src/lib.rs içindeki yapılarla birebir aynıdır (docs/komutlar.md)

/** fis_olustur başarı sonucu */
export interface Adisyon {
  kod: string; // "KRP-SSS-YXXXXXX" (tarayıcı yedeğinde "WEB-…")
  seviye: number; // adisyonun kesildiği seviye
  yildiz: number; // 0–3
}

/** fis_coz başarı sonucu */
export interface FisBilgisi {
  kod: string; // çözülen kod (boşlukları kırpılmış)
  seviye: number; // koddaki seviye
  yildiz: number; // koddaki yıldız (0–3)
  damga: string; // koddaki 6 haneli zaman damgası (hex)
}

/** Rust komut hataları (Rust enum FisHatasi, { tur, ... } olarak gelir) */
export type FisHatasi =
  | { tur: "GecersizSeviye"; seviye: number } // seviye 1..1.000.000.000 dışında
  | { tur: "GecersizYildiz"; yildiz: number } // yıldız 0–3 dışında
  | { tur: "BosKod" } // kod boş
  | { tur: "GecersizKod"; kod: string }; // kod KRP-SSS-YXXXXXX biçiminde değil

/** native.ts hataları: Rust hataları + Rust'a ulaşılamayan durumlar */
export type NativeHata =
  | FisHatasi
  | { tur: "YalnizUygulamada" } // tarayıcıda çalışıyor, bu özellik yalnız uygulamada var
  | { tur: "Bilinmeyen"; mesaj: string }; // beklenmeyen hata (komut bulunamadı vb.)

/** native.ts çağrılarının sonucu: ya veri ya tipli hata (istisna fırlatmaz) */
export type NativeSonuc<T> = { ok: true; veri: T } | { ok: false; hata: NativeHata };

/** Uygulamanın çalıştığı platform ("web": tarayıcı, Rust yok) */
export type Platform = "android" | "ios" | "macos" | "windows" | "linux" | "web";

/** Platforma göre desteği değişebilen özellikler (docs/platform-destegi.md) */
export type Ozellik = "adisyonKodu" | "fisCoz" | "ses" | "kayit";
