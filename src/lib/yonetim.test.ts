import { describe, expect, test } from "bun:test";
import { yonetimSozlugu } from "./admin-sozluk";
import {
  destekleniyorMu,
  kayitEkle,
  kayitGuncelle,
  kayitListesi,
  kayitSil,
  panelOzeti,
  yonetimCikis,
  yonetimGiris,
  yonetimKayit,
  yonetimOturumu,
} from "./native";
import { MALZEMELER, SEVIYE, TIPLER } from "./oyun/veri";
import type { NativeHata, YonetimOturumu } from "./types";
import {
  dagilimYuzdeleri,
  hataMetni,
  icerikOzeti,
  izinVar,
  kimlikGecerli,
  malzemeDogrula,
  malzemeNeti,
  malzemeSuz,
  musteriTipiDogrula,
  musteriTipiSuz,
  seviyeYaz,
  yuzdeYaz,
} from "./yonetim";

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

describe("katalog: izin, süzme ve doğrulama", () => {
  const oturum = (permissions: string[], superAdmin = false): YonetimOturumu => ({
    user: { id: 2, name: "Tasarımcı", email: "t@ornek.com", status: "active", lastLoginAt: null, createdAt: "2026-10-22T10:00:00Z" },
    roles: superAdmin ? ["admin"] : ["game_designer"],
    superAdmin,
    permissions,
  });

  test("izin: oturum yoksa hiç, admin her şey, diğerleri listedeki izin", () => {
    expect(izinVar(null, "Update:Malzeme")).toBe(false);
    expect(izinVar(oturum([], true), "Delete:MusteriTipi")).toBe(true);
    expect(izinVar(oturum(["Update:Malzeme"]), "Update:Malzeme")).toBe(true);
    expect(izinVar(oturum(["Update:Malzeme"]), "Delete:Malzeme")).toBe(false);
  });

  test("malzeme süzme: kategori, büyük/küçük harf duyarsız arama, açılışa göre sıra", () => {
    const hepsi = malzemeSuz(MALZEMELER, "", "hepsi");
    expect(hepsi).toHaveLength(MALZEMELER.length);
    expect(hepsi.map((x) => x.acilis)).toEqual([...hepsi.map((x) => x.acilis)].sort((a, b) => a - b));
    expect(malzemeSuz(MALZEMELER, "", "sos").every((x) => x.kategori === "sos")).toBe(true);
    expect(malzemeSuz(MALZEMELER, "ÇİKOLATA", "hepsi").map((x) => x.id)).toEqual(["cikolata"]);
    expect(malzemeSuz(MALZEMELER, "yok-boyle", "hepsi")).toEqual([]);
    expect(musteriTipiSuz(TIPLER, "vip").map((x) => x.id)).toEqual(["vip"]);
  });

  test("net katkı ve kimlik biçimi", () => {
    expect(malzemeNeti({ deger: 6, maliyet: 2 })).toBe(4);
    expect(malzemeNeti({ deger: 2, maliyet: 2 })).toBe(0);
    expect(kimlikGecerli("cilek-sosu")).toBe(true);
    for (const kotu of ["", "Cilek", "cilek_sosu", "-cilek", "cilek-", "çilek"]) expect(kimlikGecerli(kotu)).toBe(false);
  });

  test("oyunun kendi verisi doğrulamadan geçer", () => {
    for (const x of MALZEMELER) expect(malzemeDogrula(x, false, [], m)).toEqual({});
    for (const x of TIPLER) expect(musteriTipiDogrula(x, false, [], m)).toEqual({});
  });

  test("malzeme doğrulama: yeni kimlik biçimi ve tekrar, sayı alanları", () => {
    const krep = MALZEMELER[0];
    expect(malzemeDogrula({ ...krep, id: "krep" }, true, ["krep"], m)).toEqual({ id: m.form.kimlikVar });
    expect(malzemeDogrula({ ...krep, id: "Yeni Krep" }, true, [], m)).toEqual({ id: m.form.kimlikBicimi });
    const h = malzemeDogrula({ ...krep, ad: " ", acilis: 0, maliyet: -1, deger: 1.5 }, false, [], m);
    expect(Object.keys(h).sort()).toEqual(["acilis", "ad", "deger", "maliyet"]);
  });

  test("müşteri tipi doğrulama: sabır sıfır olamaz, dMax isteğe bağlı", () => {
    const normal = TIPLER[0];
    expect(musteriTipiDogrula({ ...normal, sabir: 0 }, false, [], m)).toEqual({ sabir: m.form.sifirdanBuyuk });
    expect(musteriTipiDogrula({ ...normal, dMax: undefined }, false, [], m)).toEqual({});
    expect(musteriTipiDogrula({ ...normal, dMax: 0, odeme: -1 }, false, [], m)).toEqual({ dMax: m.form.enAzBirTamSayi, odeme: m.form.sifirVeUstuSayi });
  });
});

describe("yönetim komutlarının tarayıcı yedeği (Rust yokken)", () => {
  test("kayıt listesi tarayıcıda oyunun JSON verisini döner; yazma komutları YalnizUygulamada", async () => {
    const l = await kayitListesi("Malzeme");
    expect(l.ok).toBe(true);
    if (l.ok) expect(l.veri.items).toEqual(MALZEMELER);
    const t = await kayitListesi("MusteriTipi");
    if (t.ok) expect(t.veri.total).toBe(TIPLER.length);
    const yalniz: { ok: false; hata: NativeHata } = { ok: false, hata: { tur: "YalnizUygulamada" } };
    expect(await kayitEkle("Malzeme", MALZEMELER[0])).toEqual(yalniz);
    expect(await kayitGuncelle("MusteriTipi", "vip", { sabir: 10 })).toEqual(yalniz);
    expect(await kayitSil("Malzeme", "krep")).toEqual(yalniz);
  });

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
