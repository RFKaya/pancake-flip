import { afterEach, describe, expect, test } from "bun:test";
import { kayitGuncelle, kayitListesi, oyuncuSeviyeAyarla } from "./native";
import { yonetimKayitlariniYukle } from "./yukleyici";
import type { KayitKaynagi } from "./types";

const eskiler = ["window", "isTauri", "navigator"].map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)] as const);
afterEach(() => {
  for (const [k, eski] of eskiler) {
    if (eski) Object.defineProperty(globalThis, k, eski);
    else Reflect.deleteProperty(globalThis, k);
  }
});

// Tauri sınırında sahte invoke; modül taklidi veya gerçek veritabanı yok.
function ortam(durum: string, invoke: (komut: string, girdi: Record<string, unknown>) => Promise<unknown>, uygulama = true) {
  Object.defineProperty(globalThis, "isTauri", { configurable: true, value: uygulama });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { search: durum }, __TAURI_INTERNALS__: { invoke } } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: "Windows", maxTouchPoints: 0 } });
}

describe("yönetim kayıt yükleyicisi ve native sınırı", () => {
  test("web'de özel kaynaklar örnek istense bile veri döndürmez", async () => {
    ortam("?durum=ornek", async () => { throw new Error("Çağrılmamalı"); }, false);
    for (const k of ["Player", "Fis", "FraudFlag", "AuditLog"] as KayitKaynagi[]) {
      expect(await kayitListesi(k)).toEqual({ ok: false, hata: { tur: "YalnizUygulamada" } });
      expect(await yonetimKayitlariniYukle(k)).toEqual({ ok: false, hata: { tur: "YalnizUygulamada" } });
    }
    expect((await oyuncuSeviyeAyarla("u1", 3, "destek")).ok).toBe(false);
  });
  test("kaynak, süzgeç ve sayfa Rust'a eksiksiz gider", async () => {
    const sorgu = { page: 2, pageSize: 25, filters: { yildiz: 0 } };
    ortam("", async (komut, girdi) => {
      expect(komut).toBe("crud_index"); expect(girdi).toEqual({ resource: "Fis", query: sorgu });
      return { items: [], page: 2, pageSize: 25, total: 30 };
    });
    expect(await yonetimKayitlariniYukle("Fis", sorgu)).toEqual({ ok: true, veri: { items: [], page: 2, pageSize: 25, total: 30 } });
  });
  test("zorlanan ilk hata ardından tekrar gerçek veriyi getirir", async () => {
    let cagrilar = 0;
    ortam("?durum=hata", async () => { cagrilar++; return { items: [], total: 0, page: 1, pageSize: 25 }; });
    expect((await yonetimKayitlariniYukle("Player", {}, 0)).ok).toBe(false); expect(cagrilar).toBe(0);
    expect((await yonetimKayitlariniYukle("Player", {}, 1)).ok).toBe(true); expect(cagrilar).toBe(1);
  });
  test("boş ve örnek liste sadece okumadır; yükleniyor beklemede kalır", async () => {
    let cagrilar = 0;
    const invoke = async () => { cagrilar++; return null; };
    ortam("?durum=bos", invoke);
    const bos = await yonetimKayitlariniYukle("AuditLog"); expect(bos.ok && bos.veri.items).toEqual([]);
    ortam("?durum=ornek", invoke);
    const ornek = await yonetimKayitlariniYukle("FraudFlag"); expect(ornek.ok && ornek.veri.items.length).toBe(1);
    ortam("?durum=yukleniyor", invoke);
    const p = yonetimKayitlariniYukle("Player");
    expect(await Promise.race([p, Promise.resolve("bekliyor")])).toBe("bekliyor"); expect(cagrilar).toBe(0);
  });
  test("seviye ayarı doğru komut/gerekçeyle gider; alan hatası tiplidir", async () => {
    ortam("", async (komut, girdi) => {
      expect(komut).toBe("player_set_level"); expect(girdi).toEqual({ playerId: "u1", seviye: 12, neden: "destek talebi" });
      throw { code: "validation", message: "Geçersiz", errors: [{ field: "neden", message: "Gerekçe gerekli" }] };
    });
    expect(await oyuncuSeviyeAyarla("u1", 12, "  destek talebi  ")).toEqual({ ok: false, hata: { tur: "ArkaUc", kod: "validation", mesaj: "Geçersiz", alanlar: [{ field: "neden", message: "Gerekçe gerekli" }] } });
  });
  test("inceleme güncellemesi yalnız durum alanını gönderir, yetki hatasını korur", async () => {
    ortam("", async (komut, girdi) => {
      expect(komut).toBe("crud_update"); expect(girdi).toEqual({ resource: "FraudFlag", id: "f1", data: { durum: "temiz" } });
      throw { code: "forbidden", message: "Yetki yok" };
    });
    expect(await kayitGuncelle("FraudFlag", "f1", { durum: "temiz" })).toEqual({ ok: false, hata: { tur: "ArkaUc", kod: "forbidden", mesaj: "Yetki yok" } });
  });
});
