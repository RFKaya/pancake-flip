// Rust'a (Tauri) giden tek kapı: bileşenler ve store'lar Tauri'yi doğrudan çağırmaz, yalnız bu dosyayı kullanır.
// Sonuçlar tiplidir (NativeSonuc): istisna fırlatılmaz. Tarayıcıda (Rust yokken) ekran çökmez: makul bir yedek sonuç ya da
// "YalnizUygulamada" hatası döner. Platform bilgisi de buradan alınır (docs/platform-destegi.md).
import { invoke, isTauri } from "@tauri-apps/api/core";
import { AYAR, MALZEMELER, SEVIYE, TIPLER } from "./oyun/veri";
import type {
  Adisyon,
  AlanHatasi,
  ArkaUcKodu,
  FisBilgisi,
  FisHatasi,
  IcerikKapsami,
  IcerikSurumu,
  ListeSorgusu,
  NativeSonuc,
  Ozellik,
  PanelOzeti,
  Platform,
  Sayfa,
  YonetimKaynagi,
  YonetimKaynaklari,
  YonetimOturumu,
} from "./types";

/** Tauri uygulamasının içinde miyiz (tarayıcıda false) */
export function uygulamadaMi(): boolean {
  return typeof window !== "undefined" && isTauri();
}

/** Çalışılan platform. Uygulamada işletim sistemi tarayıcı motorunun kimliğinden okunur; tarayıcıda "web". */
export function platform(): Platform {
  if (!uygulamadaMi()) return "web";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh|Mac OS X/i.test(ua)) return navigator.maxTouchPoints > 1 ? "ios" : "macos";
  if (/Windows/i.test(ua)) return "windows";
  return "linux";
}

/** Özellik × platform tablosu (docs/platform-destegi.md ile aynı). Bileşenler platform adını kendileri sorgulamaz. */
const DESTEK: Record<Ozellik, Record<Platform, boolean>> = {
  adisyonKodu: { android: true, ios: true, macos: true, windows: true, linux: true, web: true }, // web: WEB- yedek kodu
  fisCoz: { android: true, ios: true, macos: true, windows: true, linux: true, web: false }, // yalnız Rust
  ses: { android: true, ios: true, macos: true, windows: true, linux: true, web: true },
  kayit: { android: true, ios: true, macos: true, windows: true, linux: true, web: true },
  yonetim: { android: true, ios: true, macos: true, windows: true, linux: true, web: false }, // yerel arka uç (SQLite) yalnız Rust'ta
};

/** Bu özellik şu anki platformda destekleniyor mu (desteklenmiyorsa arayüzde hiç gösterilmez) */
export function destekleniyorMu(ozellik: Ozellik): boolean {
  return DESTEK[ozellik][platform()];
}

/** Rust'tan gelen hata nesnesi FisHatasi mı */
function fisHatasiMi(x: unknown): x is FisHatasi {
  return typeof x === "object" && x !== null && "tur" in x && typeof (x as { tur: unknown }).tur === "string";
}

/** Yerel arka uçtan gelen hata nesnesi ({ code, message, errors? }, src-tauri/src/backend/error.rs) mı */
function arkaUcHatasiMi(x: unknown): x is { code: ArkaUcKodu; message: string; errors?: AlanHatasi[] } {
  return typeof x === "object" && x !== null && typeof (x as { code?: unknown }).code === "string" && typeof (x as { message?: unknown }).message === "string";
}

async function cagir<T>(komut: string, girdi: Record<string, unknown>): Promise<NativeSonuc<T>> {
  try {
    return { ok: true, veri: await invoke<T>(komut, girdi) };
  } catch (e) {
    if (fisHatasiMi(e)) return { ok: false, hata: e };
    if (arkaUcHatasiMi(e)) return { ok: false, hata: { tur: "ArkaUc", kod: e.code, mesaj: e.message, ...(e.errors ? { alanlar: e.errors } : {}) } };
    return { ok: false, hata: { tur: "Bilinmeyen", mesaj: String(e) } };
  }
}

// @lat: [[mimari#native.ts tek kapı]]
/** Seviye adisyonu üretir. Tarayıcı yedeği: aynı biçimde "WEB-SSS-Y…" kodu (girdi denetimi aynı). */
export async function fisOlustur(seviye: number, yildiz: number): Promise<NativeSonuc<Adisyon>> {
  if (uygulamadaMi()) return cagir<Adisyon>("fis_olustur", { seviye, yildiz });
  if (!Number.isInteger(seviye) || seviye < 1) return { ok: false, hata: { tur: "GecersizSeviye", seviye } };
  if (!Number.isInteger(yildiz) || yildiz < 0 || yildiz > 3) return { ok: false, hata: { tur: "GecersizYildiz", yildiz } };
  const kod = `WEB-${String(seviye).padStart(3, "0")}-${yildiz}${Date.now().toString(36).toUpperCase()}`;
  return { ok: true, veri: { kod, seviye, yildiz } };
}

/** Adisyon kodunu Rust'ta çözer. Tarayıcıda yalnız uygulamada olduğunu bildirir (arayüz bu özelliği zaten göstermez). */
export async function fisCoz(kod: string): Promise<NativeSonuc<FisBilgisi>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<FisBilgisi>("fis_coz", { kod });
}

// Yönetim paneli: yerel arka uç komutları (docs/backend.md). Tarayıcıda Rust olmadığı için hepsi YalnizUygulamada döner;
// arayüz destekleniyorMu("yonetim") false iken bu bölümleri zaten çizmez.

/** Oturumdaki kullanıcı (auth_me); oturum yoksa null */
export async function yonetimOturumu(): Promise<NativeSonuc<YonetimOturumu | null>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<YonetimOturumu | null>("auth_me", {});
}

/** E-posta ve parolayla giriş (auth_login) */
export async function yonetimGiris(eposta: string, parola: string): Promise<NativeSonuc<YonetimOturumu>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<YonetimOturumu>("auth_login", { email: eposta, password: parola });
}

/** Yeni hesap (auth_register); veritabanındaki ilk hesap yönetici ("admin") olur */
export async function yonetimKayit(ad: string, eposta: string, parola: string): Promise<NativeSonuc<YonetimOturumu>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<YonetimOturumu>("auth_register", { name: ad, email: eposta, password: parola });
}

/** Oturumu kapatır (auth_logout) */
export async function yonetimCikis(): Promise<NativeSonuc<null>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<null>("auth_logout", {});
}

/** Oyuncu istatistikleri (pancake_dashboard; "ViewAny:Player" izni gerekir) */
export async function panelOzeti(): Promise<NativeSonuc<PanelOzeti>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<PanelOzeti>("pancake_dashboard", {});
}

/** Tarayıcı yedeğinde listelenen kayıtlar: oyunun JSON verisi (salt okunur) */
const JSON_KAYITLARI: { [K in YonetimKaynagi]: YonetimKaynaklari[K][] } = {
  Malzeme: MALZEMELER,
  MusteriTipi: TIPLER,
  GameConfig: [
    { key: "seviye", version: 1, data: SEVIYE, updatedAt: null },
    { key: "ayarlar", version: 1, data: AYAR, updatedAt: null },
  ],
  ContentVersion: [], // sürümler yalnız yerel veritabanında
};

/** Kaynağın kayıtları (crud_index; "ViewAny:<Kaynak>"). Tarayıcıda JSON verisinin tamamı tek sayfa olarak döner. */
export async function kayitListesi<K extends YonetimKaynagi>(kaynak: K, sorgu: ListeSorgusu = {}): Promise<NativeSonuc<Sayfa<YonetimKaynaklari[K]>>> {
  if (!uygulamadaMi()) {
    const items = JSON_KAYITLARI[kaynak].map((k) => ({ ...k }));
    return { ok: true, veri: { items, total: items.length, page: 1, pageSize: items.length } };
  }
  return cagir<Sayfa<YonetimKaynaklari[K]>>("crud_index", { resource: kaynak, query: sorgu });
}

/** Yeni kayıt (crud_store; "Create:<Kaynak>") */
export async function kayitEkle<K extends YonetimKaynagi>(kaynak: K, veri: YonetimKaynaklari[K]): Promise<NativeSonuc<YonetimKaynaklari[K]>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<YonetimKaynaklari[K]>("crud_store", { resource: kaynak, data: veri });
}

/** Kaydı kısmen günceller: yalnız gönderilen alanlar değişir, null gönderilen isteğe bağlı alan silinir (crud_update; "Update:<Kaynak>") */
export async function kayitGuncelle<K extends YonetimKaynagi>(
  kaynak: K,
  id: string,
  veri: { [A in keyof YonetimKaynaklari[K]]?: YonetimKaynaklari[K][A] | null },
): Promise<NativeSonuc<YonetimKaynaklari[K]>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<YonetimKaynaklari[K]>("crud_update", { resource: kaynak, id, data: veri });
}

/** Kaydı siler; neden denetim günlüğüne yazılır (crud_destroy; "Delete:<Kaynak>") */
export async function kayitSil(kaynak: YonetimKaynagi, id: string, neden?: string): Promise<NativeSonuc<null>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<null>("crud_destroy", { resource: kaynak, id, reason: neden ?? null });
}

/** Taslak içerik sürümünü doğrulayıp yayınlar; aynı kapsamdaki önceki yayın "geri-alindi" olur (content_publish; "Publish:ContentVersion") */
export async function icerikYayinla(id: string, not?: string): Promise<NativeSonuc<IcerikSurumu>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<IcerikSurumu>("content_publish", { id, not: not ?? null });
}

/** Kapsamın yayındaki sürümünü bir öncekine döndürür; neden zorunludur (content_rollback; "Publish:ContentVersion") */
export async function icerikGeriAl(kapsam: IcerikKapsami, neden: string): Promise<NativeSonuc<IcerikSurumu>> {
  if (!uygulamadaMi()) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  return cagir<IcerikSurumu>("content_rollback", { kapsam, neden });
}
