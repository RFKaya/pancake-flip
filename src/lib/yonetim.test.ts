import { describe, expect, test } from "bun:test";
import { yonetimSozlugu } from "./admin-sozluk";
import { panelOzeti, yonetimCikis, yonetimGiris, yonetimKayit, yonetimOturumu, destekleniyorMu } from "./native";
import { MALZEMELER, SEVIYE, TIPLER } from "./oyun/veri";
import type { NativeHata } from "./types";
import { dagilimYuzdeleri, hataMetni, icerikOzeti, seviyeYaz, yuzdeYaz } from "./yonetim";

const m = yonetimSozlugu();

describe("yönetim paneli hesapları", () => {
  test("içerik özeti JSON verisiyle aynı", () => {
    expect(icerikOzeti()).toEqual({
      malzeme: MALZEMELER.length,
      musteriTipi: TIPLER.length,
      mekanik: SEVIYE.mekanikler.length,
      kilometreTasi: SEVIYE.kilometreTaslari.length,
      seviyeSiniri: SEVIYE.seviyeSiniri,
    });
  });

  test("dağılımda en kalabalık aralık %100, boş dağılım sıfır", () => {
    const d = [
      { aralik: "1–9", sayi: 4 },
      { aralik: "10–49", sayi: 2 },
      { aralik: "50–99", sayi: 0 },
    ];
    expect(dagilimYuzdeleri(d)).toEqual([100, 50, 0]);
    expect(dagilimYuzdeleri(d.map((x) => ({ ...x, sayi: 0 })))).toEqual([0, 0, 0]);
    expect(dagilimYuzdeleri([])).toEqual([]);
  });

  test("oran ve seviye biçimi", () => {
    expect(yuzdeYaz(0.374)).toBe("%37");
    expect(yuzdeYaz(0)).toBe("%0");
    expect(seviyeYaz(null)).toBe("—");
    expect(seviyeYaz(12.6)).toBe("13");
  });

  test("hata metni: arka uç iletisi alan hatalarıyla birleşir; diğerleri sözlükten", () => {
    expect(hataMetni({ tur: "ArkaUc", kod: "forbidden", mesaj: "İzin yok." }, m)).toBe("İzin yok.");
    expect(
      hataMetni({ tur: "ArkaUc", kod: "validation", mesaj: "Geçersiz.", alanlar: [{ field: "password", message: "Parola kısa." }] }, m),
    ).toBe("Geçersiz. Parola kısa.");
    expect(hataMetni({ tur: "YalnizUygulamada" }, m)).toBe(m.hata.yalnizUygulamada);
    expect(hataMetni({ tur: "Bilinmeyen", mesaj: "x" }, m)).toBe(m.hata.bilinmeyen);
  });
});

describe("yönetim komutlarının tarayıcı yedeği (Rust yokken)", () => {
  test("özellik tablosu paneli tarayıcıda gizler", () => {
    expect(destekleniyorMu("yonetim")).toBe(false);
  });

  test("komutlar istisna değil YalnizUygulamada döner", async () => {
    const beklenen: { ok: false; hata: NativeHata } = { ok: false, hata: { tur: "YalnizUygulamada" } };
    expect(await yonetimOturumu()).toEqual(beklenen);
    expect(await yonetimGiris("a@b.co", "gizli-parola")).toEqual(beklenen);
    expect(await yonetimKayit("Ad", "a@b.co", "gizli-parola")).toEqual(beklenen);
    expect(await yonetimCikis()).toEqual(beklenen);
    expect(await panelOzeti()).toEqual(beklenen);
  });
});
