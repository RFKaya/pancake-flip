// Rust'a (Tauri) giden tek kapı: bileşenler ve store'lar Tauri'yi doğrudan çağırmaz, yalnız bu dosyayı kullanır.
// Sonuçlar tiplidir (NativeSonuc): istisna fırlatılmaz. Tarayıcıda (Rust yokken) ekran çökmez: makul bir yedek sonuç ya da
// "YalnizUygulamada" hatası döner. Platform bilgisi de buradan alınır (docs/platform-destegi.md).
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Adisyon, FisBilgisi, FisHatasi, NativeSonuc, Ozellik, Platform } from "./types";

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
};

/** Bu özellik şu anki platformda destekleniyor mu (desteklenmiyorsa arayüzde hiç gösterilmez) */
export function destekleniyorMu(ozellik: Ozellik): boolean {
  return DESTEK[ozellik][platform()];
}

/** Rust'tan gelen hata nesnesi FisHatasi mı */
function fisHatasiMi(x: unknown): x is FisHatasi {
  return typeof x === "object" && x !== null && "tur" in x && typeof (x as { tur: unknown }).tur === "string";
}

async function cagir<T>(komut: string, girdi: Record<string, unknown>): Promise<NativeSonuc<T>> {
  try {
    return { ok: true, veri: await invoke<T>(komut, girdi) };
  } catch (e) {
    if (fisHatasiMi(e)) return { ok: false, hata: e };
    return { ok: false, hata: { tur: "Bilinmeyen", mesaj: String(e) } };
  }
}

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
