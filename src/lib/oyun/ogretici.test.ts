import { describe, expect, test } from "bun:test";
import type { OgreticiBaglam } from "../types";
import { ilerlemeCoz } from "./ilerlemeKaydi";
import { OGRETICI, ogreticiGecmisi, ogreticiMalzemeId, ogreticiSec, testOgreticiGecmisi } from "./ogretici";

function baglam(ayar: Partial<OgreticiBaglam> = {}): OgreticiBaglam {
  return {
    seviye: 1,
    gorulen: [],
    seviyeOgretildi: false,
    krepBekleniyor: true,
    tavalar: ["bos"],
    siradaki: null,
    hedef: null,
    fisler: [],
    teslimde: false,
    yogunSaat: false,
    seri: 0,
    ...ayar,
  };
}

describe("oyun öğreticisi", () => {
  test("hamur, çevirme ve tabağa alma yalnızca ilgili tava durumunda görünür", () => {
    expect(ogreticiSec(baglam())).toMatchObject({ id: OGRETICI.dok, baslik: "Hamuru dök", hedef: { tur: "tava", sira: 0 }, yavaslat: false });
    expect(ogreticiSec(baglam({ tavalar: ["dokuyor"] }))).toMatchObject({ id: OGRETICI.dok, yavaslat: false });
    const birak = ogreticiSec(baglam({ tavalar: ["birak"] }));
    expect(birak).toMatchObject({ id: OGRETICI.dok, baslik: "Şimdi bırak" });
    expect(birak?.yavaslat).toBeUndefined();
    expect(ogreticiSec(baglam({ tavalar: ["fazla"] }))).toMatchObject({ id: OGRETICI.dok, baslik: "Fazla hamur", yavaslat: false });
    expect(ogreticiSec(baglam({ tavalar: ["mesgul"] }))).toBeNull();
    const cevir = ogreticiSec(baglam({ tavalar: ["cevir"] }));
    expect(cevir).toMatchObject({ id: OGRETICI.cevir, baslik: "Krep pişti" });
    expect(cevir?.yavaslat).toBeUndefined();
    const tabaga = ogreticiSec(baglam({ tavalar: ["tabaga"] }));
    expect(tabaga).toMatchObject({ id: OGRETICI.tabak, baslik: "Tabağa al" });
    expect(tabaga?.yavaslat).toBeUndefined();
    expect(ogreticiSec(baglam({ krepBekleniyor: false }))).toBeNull();
    expect(ogreticiSec(baglam({ krepBekleniyor: false, tavalar: ["cevir"] }))?.id).toBe(OGRETICI.cevir);
  });

  test("başarısız denemeden sonra öğretici tekrarlanır, ilk teslimden sonra yalnızca o seviyede kapanır", () => {
    const seviye = 2;
    const gorulen = [OGRETICI.dok, OGRETICI.cevir, OGRETICI.tabak, OGRETICI.teslim];
    const deneme = ["bos", "birak", "cevir", "mesgul", "bos", "birak", "cevir", "tabaga"] as const;
    const ipuclari = deneme.map((durum) => ogreticiSec(baglam({ seviye, gorulen, tavalar: [durum] }))?.id);

    expect(ipuclari).toEqual([OGRETICI.dok, OGRETICI.dok, OGRETICI.cevir, undefined, OGRETICI.dok, OGRETICI.dok, OGRETICI.cevir, OGRETICI.tabak]);
    expect(ogreticiSec(baglam({ seviye, gorulen, teslimde: true }))).toMatchObject({ id: OGRETICI.teslim, baslik: "Sipariş hazır", hedef: { tur: "tabak" } });
    for (const durum of ["bos", "cevir", "tabaga"] as const) {
      expect(ogreticiSec(baglam({ seviye, gorulen, seviyeOgretildi: true, tavalar: [durum] }))).toBeNull();
    }
    expect(ogreticiSec(baglam({ seviye, gorulen, seviyeOgretildi: true, teslimde: true }))).toBeNull();
    expect(ogreticiSec(baglam({ seviye: 3, gorulen: [...testOgreticiGecmisi(3), "acilis:mekanik:katmanli-tarif"] }))?.id).toBe(OGRETICI.dok);
  });

  test("aynı seviyede sos ve müşteri açılışlarını sırayla tanıtır", () => {
    const seviye = 10;
    const gorulen = testOgreticiGecmisi(seviye);
    const sosAcilisi = "acilis:malzeme:cilek-sosu";
    const cocukAcilisi = "acilis:musteri:cocuk";

    expect(ogreticiSec(baglam({ seviye, gorulen, seviyeOgretildi: true }))).toMatchObject({ id: sosAcilisi, sureli: true });
    expect(ogreticiSec(baglam({ seviye, gorulen: [...gorulen, sosAcilisi], seviyeOgretildi: true }))).toMatchObject({ id: cocukAcilisi, sureli: true });
    expect(ogreticiSec(baglam({ seviye, gorulen: [...gorulen, sosAcilisi, cocukAcilisi], seviyeOgretildi: true }))).toBeNull();
  });

  test("malzeme açıldıktan sonra düğmesini tarifte ilk gerektiğinde vurgular", () => {
    const seviye = 5;
    const gorulen = [...testOgreticiGecmisi(seviye), "acilis:malzeme:cikolata"];
    const ayar = { seviye, gorulen, krepBekleniyor: false };
    const id = ogreticiMalzemeId("cikolata");

    expect(ogreticiSec(baglam({ ...ayar, krepBekleniyor: true, siradaki: "krep" }))?.id).toBe(OGRETICI.dok);
    expect(ogreticiSec(baglam({ ...ayar, siradaki: "cikolata" }))).toMatchObject({ id, hedef: { tur: "malzeme", id: "cikolata" } });
    expect(ogreticiSec(baglam({ ...ayar, gorulen: [...gorulen, id], siradaki: "cikolata" }))).toBeNull();
  });

  test("kalınlık öğreticisi ilk ince veya kalın siparişte kullanılabilir tavayı seçer", () => {
    const seviye = 20;
    const gorulen = [...testOgreticiGecmisi(seviye), "acilis:mekanik:tercih"];
    const ayar = { seviye, gorulen, seviyeOgretildi: true };
    const normal = { id: 1, tercih: "normal" } as const;
    const ince = { id: 2, tercih: "ince" } as const;
    const kalin = { id: 3, tercih: "kalin" } as const;

    expect(ogreticiSec(baglam({ ...ayar, hedef: normal }))).toBeNull();
    expect(ogreticiSec(baglam({ ...ayar, hedef: ince, tavalar: ["mesgul", "mesgul"] }))).toBeNull();
    expect(ogreticiSec(baglam({ ...ayar, hedef: ince, tavalar: ["mesgul", "bos"] }))).toMatchObject({
      id: OGRETICI.kalinlik, hedef: { tur: "tava", sira: 1 }, yavaslat: false,
    });
    expect(ogreticiSec(baglam({ ...ayar, hedef: ince, tavalar: ["dokuyor", "bos"] }))).toMatchObject({ id: OGRETICI.kalinlik, yavaslat: false });
    const birak = ogreticiSec(baglam({ ...ayar, hedef: kalin, tavalar: ["birak", "bos"] }));
    expect(birak).toMatchObject({ id: OGRETICI.kalinlik, baslik: "Şimdi bırak", hedef: { tur: "tava", sira: 0 } });
    expect(birak?.yavaslat).toBeUndefined();
    expect(ogreticiSec(baglam({ ...ayar, hedef: kalin, tavalar: ["fazla", "bos"] }))).toMatchObject({ id: OGRETICI.kalinlik, yavaslat: false });
    expect(ogreticiSec(baglam({ ...ayar, hedef: kalin, gorulen: [...gorulen, OGRETICI.kalinlik] }))).toBeNull();
  });

  test("ikinci tava ve seri bonusu kendi kullanım anında tekrar gösterilir", () => {
    const seviye = 15;
    const ayar = { seviye, gorulen: [...testOgreticiGecmisi(seviye), "acilis:mekanik:coklu-musteri", "acilis:mekanik:combo"], seviyeOgretildi: true };

    expect(ogreticiSec(baglam({ ...ayar, tavalar: ["bos", "bos"] }))).toBeNull();
    expect(ogreticiSec(baglam({ ...ayar, tavalar: ["bos", "dokuyor"] }))).toMatchObject({
      id: OGRETICI.ikinciTava, hedef: { tur: "tava", sira: 1 }, yavaslat: false,
    });
    const birak = ogreticiSec(baglam({ ...ayar, tavalar: ["bos", "birak"] }));
    expect(birak).toMatchObject({ id: OGRETICI.ikinciTava, baslik: "Şimdi bırak" });
    expect(birak?.yavaslat).toBeUndefined();
    expect(ogreticiSec(baglam({ ...ayar, tavalar: ["bos", "fazla"] }))).toMatchObject({ id: OGRETICI.ikinciTava, yavaslat: false });
    expect(ogreticiSec(baglam({ ...ayar, seri: 2 }))).toMatchObject({ id: OGRETICI.combo, sureli: true, hedef: { tur: "seri" } });
  });
});

describe("öğretici kaydı", () => {
  test("eski kayıt mevcut seviyeyi korur ve daha önce açılan dersleri atlar", () => {
    const yeni = ilerlemeCoz(null);
    const eski = ilerlemeCoz(JSON.stringify({ surum: 1, seviye: 10, toplamMusteri: 25, toplamCoin: 150 }));
    const gorulen = ogreticiGecmisi(eski);

    expect(ogreticiGecmisi(yeni)).toEqual([]);
    expect(eski).toMatchObject({ seviye: 10, toplamMusteri: 25, toplamCoin: 150 });
    expect(gorulen).toContain(OGRETICI.teslim);
    expect(gorulen).toContain(ogreticiMalzemeId("cilek-sosu"));
    expect(gorulen).toContain("musteri:cocuk");
    expect(gorulen).not.toContain(ogreticiMalzemeId("tereyagi"));
    expect(ogreticiSec(baglam({ seviye: eski.seviye, gorulen, seviyeOgretildi: true }))).toBeNull();
  });

  test("kayıt geçerli benzersiz kimlikleri tutar, bozuk veya eksik alana güvenli varsayılan uygular", () => {
    const temelKayit = { surum: 1, seviye: 10, toplamMusteri: 25, toplamCoin: 150 };
    const bozuk = ilerlemeCoz(JSON.stringify({ ...temelKayit, ogretici: "tamamlandı" }));
    const karisik = ilerlemeCoz(JSON.stringify({ ...temelKayit, ogretici: [OGRETICI.dok, "olmayan-adim", 9, null, OGRETICI.dok] }));
    const bos = ilerlemeCoz(JSON.stringify({ ...temelKayit, ogretici: [] }));

    expect(bozuk.ogretici).toBeUndefined();
    expect(ogreticiGecmisi(bozuk)).toContain(OGRETICI.teslim);
    expect(ogreticiGecmisi(karisik)).toEqual([OGRETICI.dok]);
    expect(karisik.toplamCoin).toBe(150);
    expect(ogreticiGecmisi(bos)).toEqual([]);
    expect(ogreticiGecmisi(ilerlemeCoz("{"))).toEqual([]);
  });

  test("oyuncunun güncel seviyede teslim yapıp yapmadığı kayıtta korunur", () => {
    const temelKayit = { surum: 1, seviye: 10, ilerleme: 1 };

    for (const seviyeOgretildi of [true, false]) {
      const kayit = ilerlemeCoz(JSON.stringify({ ...temelKayit, seviyeOgretildi }));
      expect(kayit.seviye).toBe(10);
      expect(kayit.ilerleme).toBe(1);
      expect(kayit.seviyeOgretildi).toBe(seviyeOgretildi);
    }
    expect(ilerlemeCoz(JSON.stringify(temelKayit)).seviyeOgretildi).toBeUndefined();
    expect(ilerlemeCoz(JSON.stringify({ ...temelKayit, seviyeOgretildi: "evet" })).seviyeOgretildi).toBeUndefined();
  });
});
