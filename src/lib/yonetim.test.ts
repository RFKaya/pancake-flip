import { describe, expect, test } from "bun:test";
import { yonetimSozlugu } from "./admin-sozluk";
import {
  destekleniyorMu,
  icerikGeriAl,
  icerikYayinla,
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
import { gerekenMusteri, tumAcilislar } from "./oyun/seviye";
import { AYAR, MALZEMELER, SEVIYE, TIPLER } from "./oyun/veri";
import type { NativeHata, YonetimOturumu } from "./types";
import {
  alanGruplari,
  dagilimYuzdeleri,
  dengeDogrula,
  egriSatirlari,
  hataMetni,
  ornekSiparisler,
  sayiAlanlari,
  seviyeDuraklari,
  sonrakiSurum,
  surumSirala,
  yolaYaz,
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

describe("ayar ekranları: eğri, çizelge, simülatör, denge, sürümler", () => {
  test("eğri satırları oyunun kurallarıyla aynı; zorluk artarak gider, sınırı geçen seviye yok", () => {
    const satirlar = egriSatirlari();
    expect(satirlar[0]).toMatchObject({ seviye: 1, gerekenMusteri: gerekenMusteri(1), zorluk: 0 });
    for (let i = 1; i < satirlar.length; i++) expect(satirlar[i].zorluk).toBeGreaterThanOrEqual(satirlar[i - 1].zorluk);
    expect(satirlar.every((s) => s.seviye <= SEVIYE.seviyeSiniri)).toBe(true);
  });

  test("duraklar seviyeye göre sıralı; her kilometre taşı ve her açılış bir kez", () => {
    const d = seviyeDuraklari();
    expect(d.map((x) => x.seviye)).toEqual([...d.map((x) => x.seviye)].sort((a, b) => a - b));
    expect(d.filter((x) => x.kilometreTasi).length).toBe(SEVIYE.kilometreTaslari.length);
    expect(d.reduce((n, x) => n + x.acilislar.length, 0)).toBe(tumAcilislar().length);
  });

  test("örnek siparişler: aynı tohum aynı sonuç, yalnız açık müşteri tipleri, sabır alt sınırın üstünde", () => {
    expect(ornekSiparisler(30, 7)).toEqual(ornekSiparisler(30, 7));
    expect(ornekSiparisler(1, 1).map((o) => o.tip.id)).toEqual(TIPLER.filter((t) => t.acilis <= 1).map((t) => t.id));
    for (const o of ornekSiparisler(500, 3)) {
      expect(o.siparis.parcalar[0]).toBe("krep");
      expect(o.fiyat).toBeGreaterThan(0);
      expect(o.sabir).toBeGreaterThanOrEqual(SEVIYE.sabirMin);
    }
  });

  test("sayı alanları ve yola yazma: iç içe yol, asıl nesne değişmez", () => {
    const n = { a: 1, b: { c: 2, d: [3] }, e: "x" };
    expect(sayiAlanlari(n)).toEqual([{ yol: "a", deger: 1 }, { yol: "b.c", deger: 2 }]);
    expect(alanGruplari(sayiAlanlari(n))).toEqual([["", [{ yol: "a", deger: 1 }]], ["b", [{ yol: "b.c", deger: 2 }]]]);
    const y = yolaYaz(n, "b.c", 9);
    expect(y.b.c).toBe(9);
    expect(n.b.c).toBe(2);
  });

  test("denge doğrulama: oyunun ayarı geçer; kalite sırası ve eksi değer yakalanır", () => {
    expect(dengeDogrula(AYAR, m)).toEqual({});
    const bozuk = yolaYaz(yolaYaz(AYAR, "kalite.good", 95), "tabakMax", -1);
    expect(dengeDogrula(bozuk, m)).toEqual({ "kalite.perfect": m.denge.kaliteSirasi, tabakMax: m.form.sifirVeUstuSayi });
  });

  test("sonraki sürüm numarası kapsama göre ve yayındaki sürümü de hesaba katar", () => {
    const s = (kapsam: "ayarlar" | "seviye", surum: number) => ({ id: `${kapsam}-${surum}`, kapsam, surum, durum: "taslak" as const, yayinlayan: null, yayinTarihi: null, not: null, veri: {} });
    expect(sonrakiSurum([], "ayarlar", 1)).toBe(2);
    expect(sonrakiSurum([s("ayarlar", 3), s("seviye", 7)], "ayarlar", 1)).toBe(4);
    expect(surumSirala([s("seviye", 1), s("ayarlar", 2), s("ayarlar", 5)]).map((x) => x.id)).toEqual(["ayarlar-5", "ayarlar-2", "seviye-1"]);
  });
});

describe("yönetim komutlarının tarayıcı yedeği (Rust yokken)", () => {
  test("ayarlar JSON'dan, sürümler boş; yayın ve geri alma YalnizUygulamada", async () => {
    const a = await kayitListesi("GameConfig");
    if (a.ok) expect(a.veri.items.find((x) => x.key === "ayarlar")?.data).toEqual(AYAR);
    const v = await kayitListesi("ContentVersion");
    if (v.ok) expect(v.veri.items).toEqual([]);
    const yalniz: { ok: false; hata: NativeHata } = { ok: false, hata: { tur: "YalnizUygulamada" } };
    expect(await icerikYayinla("x")).toEqual(yalniz);
    expect(await icerikGeriAl("ayarlar", "deneme")).toEqual(yalniz);
  });

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
