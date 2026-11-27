import { describe, expect, test } from "bun:test";
import type { OgreticiBaglam } from "../types";
import { ilerlemeCoz } from "./ilerlemeKaydi";
import { OGRETICI, ogreticiGecmisi, ogreticiMalzemeId, ogreticiSec, testOgreticiGecmisi } from "./ogretici";

function baglam(ayar: Partial<OgreticiBaglam> = {}): OgreticiBaglam {
  return {
    seviye: 1,
    gorulen: [],
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
  test("ilk hamur, çevirme ve tabağa alma yalnızca ilgili tava durumunda görünür", () => {
    const dokulen = [OGRETICI.dok];
    const cevrilen = [...dokulen, OGRETICI.cevir];

    expect(ogreticiSec(baglam())).toMatchObject({ id: OGRETICI.dok, hedef: { tur: "tava", sira: 0 } });
    expect(ogreticiSec(baglam({ tavalar: ["dokuyor"] }))?.id).toBe(OGRETICI.dok);
    expect(ogreticiSec(baglam({ tavalar: ["birak"] }))?.baslik).toBe("Şimdi bırak");
    expect(ogreticiSec(baglam({ tavalar: ["fazla"] }))?.baslik).toBe("Hamur fazla oldu");
    expect(ogreticiSec(baglam({ gorulen: dokulen, tavalar: ["mesgul"] }))).toBeNull();
    expect(ogreticiSec(baglam({ gorulen: dokulen, tavalar: ["cevir"] }))?.id).toBe(OGRETICI.cevir);
    expect(ogreticiSec(baglam({ gorulen: cevrilen, tavalar: ["cevir"] }))).toBeNull();
    expect(ogreticiSec(baglam({ gorulen: cevrilen, tavalar: ["tabaga"] }))?.id).toBe(OGRETICI.tabak);
    expect(ogreticiSec(baglam({ gorulen: [...cevrilen, OGRETICI.tabak], tavalar: ["tabaga"] }))).toBeNull();
  });

  test("ilk otomatik teslimde tabak vurgulanır ve teslimden sonra ipucu tekrarlanmaz", () => {
    const gorulen = [OGRETICI.dok, OGRETICI.cevir, OGRETICI.tabak];

    expect(ogreticiSec(baglam({ gorulen }))).toBeNull();
    expect(ogreticiSec(baglam({ gorulen, teslimde: true }))).toMatchObject({ id: OGRETICI.teslim, hedef: { tur: "tabak" } });
    expect(ogreticiSec(baglam({ gorulen: [...gorulen, OGRETICI.teslim], teslimde: true }))).toBeNull();
  });

  test("aynı seviyede sos ve müşteri açılışlarını sırayla tanıtır", () => {
    const seviye = 10;
    const gorulen = testOgreticiGecmisi(seviye);
    const sosAcilisi = "acilis:malzeme:cilek-sosu";
    const cocukAcilisi = "acilis:musteri:cocuk";

    expect(ogreticiSec(baglam({ seviye, gorulen }))).toMatchObject({ id: sosAcilisi, sureli: true });
    expect(ogreticiSec(baglam({ seviye, gorulen: [...gorulen, sosAcilisi] }))).toMatchObject({ id: cocukAcilisi, sureli: true });
    expect(ogreticiSec(baglam({ seviye, gorulen: [...gorulen, sosAcilisi, cocukAcilisi] }))).toBeNull();
  });

  test("malzeme açıldıktan sonra düğmesini tarifte ilk gerektiğinde vurgular", () => {
    const seviye = 5;
    const gorulen = [...testOgreticiGecmisi(seviye), "acilis:malzeme:cikolata"];
    const id = ogreticiMalzemeId("cikolata");

    expect(ogreticiSec(baglam({ seviye, gorulen, siradaki: "krep" }))).toBeNull();
    expect(ogreticiSec(baglam({ seviye, gorulen, siradaki: "cikolata" }))).toMatchObject({ id, hedef: { tur: "malzeme", id: "cikolata" } });
    expect(ogreticiSec(baglam({ seviye, gorulen: [...gorulen, id], siradaki: "cikolata" }))).toBeNull();
  });

  test("kalınlık öğreticisi ilk ince veya kalın siparişte kullanılabilir tavayı seçer", () => {
    const seviye = 20;
    const gorulen = [...testOgreticiGecmisi(seviye), "acilis:mekanik:tercih"];
    const ayar = { seviye, gorulen };
    const normal = { id: 1, tercih: "normal" } as const;
    const ince = { id: 2, tercih: "ince" } as const;
    const kalin = { id: 3, tercih: "kalin" } as const;

    expect(ogreticiSec(baglam({ ...ayar, hedef: normal }))).toBeNull();
    expect(ogreticiSec(baglam({ ...ayar, hedef: ince, tavalar: ["mesgul", "mesgul"] }))).toBeNull();
    expect(ogreticiSec(baglam({ ...ayar, hedef: ince, tavalar: ["mesgul", "bos"] }))).toMatchObject({ id: OGRETICI.kalinlik, hedef: { tur: "tava", sira: 1 } });
    expect(ogreticiSec(baglam({ ...ayar, hedef: kalin, tavalar: ["birak", "bos"] }))).toMatchObject({ id: OGRETICI.kalinlik, baslik: "Şimdi bırak", hedef: { tur: "tava", sira: 0 } });
    expect(ogreticiSec(baglam({ ...ayar, hedef: kalin, gorulen: [...gorulen, OGRETICI.kalinlik] }))).toBeNull();
  });

  test("ikinci tava ve seri bonusu kendi kullanım anında tekrar gösterilir", () => {
    const seviye = 15;
    const ayar = { seviye, gorulen: [...testOgreticiGecmisi(seviye), "acilis:mekanik:coklu-musteri", "acilis:mekanik:combo"] };

    expect(ogreticiSec(baglam({ ...ayar, tavalar: ["bos", "bos"] }))).toBeNull();
    expect(ogreticiSec(baglam({ ...ayar, tavalar: ["bos", "dokuyor"] }))).toMatchObject({ id: OGRETICI.ikinciTava, hedef: { tur: "tava", sira: 1 } });
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
    expect(ogreticiSec(baglam({ seviye: eski.seviye, gorulen }))).toBeNull();
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
});
