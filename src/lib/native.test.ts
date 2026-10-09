import { describe, expect, test } from "bun:test";
import { destekleniyorMu, fisCoz, fisOlustur, platform, uygulamadaMi } from "./native";

// bun test'te Tauri yok: native.ts'in tarayıcı yedeği denetlenir (Rust tarafının testleri: src-tauri/src/lib.rs)
describe("native.ts tarayıcı yedeği (Rust yokken)", () => {
  test("platform web, uygulama dışı", () => {
    expect(uygulamadaMi()).toBe(false);
    expect(platform()).toBe("web");
  });

  test("fisOlustur geçerli girdide WEB- kodu döner, biçim seviye ve yıldızı taşır", async () => {
    const s = await fisOlustur(10, 3);
    expect(s.ok).toBe(true);
    if (s.ok) {
      expect(s.veri.seviye).toBe(10);
      expect(s.veri.yildiz).toBe(3);
      expect(s.veri.kod).toMatch(/^WEB-010-3[0-9A-Z]+$/);
    }
  });

  test("fisOlustur geçersiz girdide istisna değil tipli hata döner", async () => {
    expect(await fisOlustur(0, 3)).toEqual({ ok: false, hata: { tur: "GecersizSeviye", seviye: 0 } });
    expect(await fisOlustur(5, 9)).toEqual({ ok: false, hata: { tur: "GecersizYildiz", yildiz: 9 } });
  });

  test("fisCoz tarayıcıda YalnizUygulamada; özellik tablosu bunu gizler", async () => {
    expect(await fisCoz("KRP-007-3A9F1C2")).toEqual({ ok: false, hata: { tur: "YalnizUygulamada" } });
    expect(destekleniyorMu("fisCoz")).toBe(false);
    expect(destekleniyorMu("adisyonKodu")).toBe(true);
  });
});
