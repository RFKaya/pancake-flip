import { describe, expect, test } from "bun:test";
import type { Kalinlik, TabakParcasi } from "../types";
import { musteriyeVer, oturumIlerlet, oturumSeviyeAyarla, sabirOrani, tabakDurumu, yeniOturum, type Oturum } from "./oturum";
import { rngOlustur } from "./rng";
import { gerekenMusteri } from "./seviye";
import { MALZEMELER } from "./veri";

const kategoriOf = (id: string) => MALZEMELER.find((m) => m.id === id)!.kategori;

/** Müşterinin siparişini birebir doğru, pişmiş ve kusursuz (usta) kreplerden oluşan tabağa çevirir */
const mukemmelTabak = (parcalar: string[], tercih: Kalinlik = "normal"): TabakParcasi[] =>
  parcalar.map((malzeme) => (malzeme === "krep" ? { malzeme, pisme: "iyi" as const, kalinlik: tercih, usta: true } : { malzeme }));

/** Müşteri gelene kadar zamanı ilerletir */
function musteriBekle(o: Oturum, rng = rngOlustur(1), azami = 30) {
  for (let t = 0; t < azami && o.musteriler.length < Math.min(1, o.sv.eszamanli); t += 0.1) oturumIlerlet(o, 0.1, rng);
}

describe("oturum: müşteri gelişi ve sabır", () => {
  test("başta müşteri yok, kısa sürede ilk müşteri gelir", () => {
    const o = yeniOturum();
    const rng = rngOlustur(7);
    expect(o.musteriler.length).toBe(0);
    const olaylar = oturumIlerlet(o, 0.5, rng);
    expect(olaylar.some((x) => x.tur === "geldi")).toBe(true);
    expect(o.musteriler.length).toBe(1);
    expect(o.musteriler[0].sabir).toBeGreaterThan(0);
  });

  test("slot sayısını aşmaz: seviye 1'de 1, 15'te 2, 75'te 3 müşteri", () => {
    for (const [seviye, beklenen] of [[1, 1], [15, 2], [75, 3], [1000, 3]] as const) {
      const o = yeniOturum({ seviye });
      const rng = rngOlustur(3);
      let enFazla = 0;
      for (let t = 0; t < 120; t += 0.05) {
        oturumIlerlet(o, 0.05, rng);
        // sabır azalmasın diye yenile: yalnızca slot sınırını ölçüyoruz
        for (const m of o.musteriler) m.sabir = m.sabirToplam;
        enFazla = Math.max(enFazla, o.musteriler.length);
      }
      expect(enFazla).toBe(beklenen);
    }
  });

  test("sabrı biten müşteri gider: ilerleme artmaz, seri sıfırlanır; sonra yenisi gelir", () => {
    const o = yeniOturum();
    const rng = rngOlustur(11);
    o.seri = 4;
    musteriBekle(o, rng);
    const ilk = o.musteriler[0];
    let gitti = false;
    for (let t = 0; t < 200 && !gitti; t += 0.1) gitti = oturumIlerlet(o, 0.1, rng).some((x) => x.tur === "gitti");
    expect(gitti).toBe(true);
    expect(o.ilerleme).toBe(0);
    expect(o.seviye).toBe(1);
    expect(o.seri).toBe(0);
    musteriBekle(o, rng);
    expect(o.musteriler[0].id).not.toBe(ilk.id);
  });

  test("büyük dt (arka plan dönüşü) oturumu bozmaz", () => {
    const o = yeniOturum({ seviye: 100 });
    const rng = rngOlustur(5);
    for (let i = 0; i < 50; i++) oturumIlerlet(o, 1000, rng);
    expect(o.musteriler.length).toBeLessThanOrEqual(o.sv.eszamanli);
    expect(o.musteriler.every((m) => m.sabir > 0)).toBe(true);
  });
});

describe("oturum: servis ve ilerleme", () => {
  test("seviye 1: 1 doğru müşteri → seviye 2, coin kazanılır, level-up bilgisi döner", () => {
    const o = yeniOturum();
    musteriBekle(o);
    const m = o.musteriler[0];
    const r = musteriyeVer(o, mukemmelTabak(m.siparis.parcalar))!;
    expect(r.sonuc).toBe("perfect");
    expect(r.ilerlemeEkle).toBe(1);
    expect(r.seviyeAtladi.map((s) => s.seviye)).toEqual([2]);
    expect(o.seviye).toBe(2);
    expect(o.ilerleme).toBe(0);
    expect(o.toplamMusteri).toBe(1);
    expect(r.kazanc).toBeGreaterThan(0);
    expect(o.toplamCoin).toBe(r.kazanc);
    expect(o.musteriler.length).toBe(0);
    expect(o.sv.seviye).toBe(2);
  });

  test("yanlış tabak ASLA teslim edilmez: müşteri kalır, ilerleme / coin / seri değişmez", () => {
    const o = yeniOturum({ seviye: 5 });
    musteriBekle(o);
    o.seri = 3;
    const m = o.musteriler[0];
    expect(musteriyeVer(o, [{ malzeme: "tereyagi" }, { malzeme: "tereyagi" }, { malzeme: "tereyagi" }])).toBeNull();
    expect(o.musteriler.map((x) => x.id)).toEqual([m.id]);
    expect(o.ilerleme).toBe(0);
    expect(o.seviye).toBe(5);
    expect(o.seri).toBe(3);
    expect(o.toplamMusteri).toBe(0);
    expect(o.toplamCoin).toBe(0);
  });

  test("tarif kuralı: kat sayısı, eksik/fazla/yanlış malzeme, çiğ/yanık krep, kalınlık → yanlış; eksik ama doğru gidiş → hazırlanıyor", () => {
    const o = yeniOturum({ seviye: 5 });
    musteriBekle(o);
    const m = o.musteriler[0];
    m.siparis = { parcalar: ["krep", "cikolata", "krep", "cikolata", "krep"], d: 6 };
    const dogru = mukemmelTabak(m.siparis.parcalar);
    const durum = (t: TabakParcasi[]) => tabakDurumu(o, t).durum;

    expect(durum([])).toBe("bos");
    expect(durum(dogru.slice(0, 3))).toBe("hazirlaniyor"); // 2 kat: henüz bitmedi, teslim edilmez
    expect(musteriyeVer(o, dogru.slice(0, 3))).toBeNull();
    expect(durum([...dogru, ...mukemmelTabak(["krep"])])).toBe("yanlis"); // fazla kat
    expect(durum(dogru.map((p) => (p.malzeme === "cikolata" ? { malzeme: "cilek-dilimi" } : p)))).toBe("yanlis"); // yanlış malzeme
    expect(durum([dogru[0], dogru[2]])).toBe("yanlis"); // eksik malzeme (krep krep)
    expect(durum([{ ...dogru[0], pisme: "cig" }])).toBe("yanlis"); // çiğ krep
    expect(durum([{ ...dogru[0], pisme: "yanik" }])).toBe("yanlis"); // yanık krep
    expect(durum([{ ...dogru[0], kalinlik: "kalin" }])).toBe("yanlis"); // istenmeyen kalınlık
    for (const yanlis of [[...dogru, ...mukemmelTabak(["krep"])], [{ ...dogru[0], pisme: "cig" as const }]]) {
      expect(musteriyeVer(o, yanlis)).toBeNull();
    }
    expect(o.musteriler.length).toBe(1);
    expect(o.toplamMusteri + o.ilerleme + o.toplamCoin).toBe(0);
    expect(durum(dogru)).toBe("dogru");
  });

  test("tercihli siparişte yalnızca istenen kalınlık kabul edilir", () => {
    const o = yeniOturum({ seviye: 20 });
    musteriBekle(o);
    const m = o.musteriler[0];
    m.siparis = { parcalar: ["krep"], d: 1, tercih: "ince" };
    expect(tabakDurumu(o, mukemmelTabak(["krep"])).durum).toBe("yanlis");
    expect(tabakDurumu(o, [{ malzeme: "krep", pisme: "iyi", kalinlik: "ince", usta: true }]).durum).toBe("dogru");
  });

  test("doğru tabak bir kez teslim edilir; aynı tabakla ikinci deneme ödül vermez (çift servis yok)", () => {
    const o = yeniOturum({ seviye: 5 });
    musteriBekle(o);
    const tabak = mukemmelTabak(o.musteriler[0].siparis.parcalar);
    const r = musteriyeVer(o, tabak)!;
    expect(r).not.toBeNull();
    const sonra = { coin: o.toplamCoin, musteri: o.toplamMusteri, ilerleme: o.ilerleme, seviye: o.seviye };
    expect(musteriyeVer(o, tabak)).toBeNull();
    expect({ coin: o.toplamCoin, musteri: o.toplamMusteri, ilerleme: o.ilerleme, seviye: o.seviye }).toEqual(sonra);
  });

  test("kusursuz olmayan (usta değil) ama doğru krep GREAT olur, yine de ilerleme verir", () => {
    const o = yeniOturum({ seviye: 5 });
    musteriBekle(o);
    const tabak = mukemmelTabak(o.musteriler[0].siparis.parcalar).map((p) => (p.malzeme === "krep" ? { ...p, usta: false } : p));
    const r = musteriyeVer(o, tabak)!;
    expect(r.sonuc).toBe("great");
    expect(r.ilerlemeEkle).toBeGreaterThan(0);
    expect(o.toplamMusteri).toBe(1);
  });

  test("boş tabak ya da bekleyen müşteri yokken hiçbir şey olmaz", () => {
    const o = yeniOturum();
    expect(musteriyeVer(o, mukemmelTabak(["krep"]))).toBeNull();
    musteriBekle(o);
    expect(musteriyeVer(o, [])).toBeNull();
    expect(o.musteriler.length).toBe(1);
  });

  test("birden fazla müşteri: tabak, siparişi birebir tutan müşteriye gider", () => {
    const o = yeniOturum({ seviye: 40 });
    const rng = rngOlustur(21);
    for (let t = 0; t < 60 && o.musteriler.length < 2; t += 0.1) {
      oturumIlerlet(o, 0.1, rng);
      for (const m of o.musteriler) m.sabir = m.sabirToplam;
    }
    expect(o.musteriler.length).toBe(2);
    const [a, b] = o.musteriler;
    a.siparis = { parcalar: ["krep"], d: 1 };
    b.siparis = { parcalar: ["krep", "krep"], d: 2 };
    const r = musteriyeVer(o, mukemmelTabak(["krep", "krep"]))!;
    expect(r.musteri.id).toBe(b.id);
    expect(o.musteriler.map((m) => m.id)).toEqual([a.id]);
  });

  test("PERFECT serisi: her 5. üst üste PERFECT +1 bonus ilerleme", () => {
    const o = yeniOturum({ seviye: 200 }); // bir seviyede 15 müşteri var
    const rng = rngOlustur(4);
    const ilerlemeler: number[] = [];
    for (let i = 0; i < 5; i++) {
      for (let t = 0; t < 60 && !o.musteriler.length; t += 0.1) oturumIlerlet(o, 0.1, rng);
      const m = o.musteriler[0];
      const tip = m.tip;
      // tercih ya da tip cezası perfect'i bozmasın: tercihli krep kalınlığını uydur
      const tabak = mukemmelTabak(m.siparis.parcalar).map((p) => (p.malzeme === "krep" && m.siparis.tercih ? { ...p, kalinlik: m.siparis.tercih } : p));
      const r = musteriyeVer(o, tabak)!;
      expect(r.sonuc).toBe("perfect");
      expect(tip.length).toBeGreaterThan(0);
      ilerlemeler.push(r.ilerlemeEkle);
    }
    expect(ilerlemeler).toEqual([1, 1, 1, 1, 2]);
  });

  test("seviye ataması (geliştirici): 100'e geçince her şey o seviyeye uyar", () => {
    const o = yeniOturum();
    musteriBekle(o);
    oturumSeviyeAyarla(o, 100);
    expect(o.seviye).toBe(100);
    expect(o.ilerleme).toBe(0);
    expect(o.musteriler.length).toBe(0);
    expect(o.sv.seviye).toBe(100);
    expect(o.sv.eszamanli).toBe(3);
    expect(o.sv.menu.length).toBe(7);
    expect(o.sv.gerekenMusteri).toBe(gerekenMusteri(100));
    oturumSeviyeAyarla(o, NaN);
    expect(o.seviye).toBe(1);
  });

  test("yoğun saat 150. seviyeden sonra tetiklenir ve biter", () => {
    const o = yeniOturum({ seviye: 150 });
    const rng = rngOlustur(9);
    let basladi = false;
    for (let i = 0; i < 25 && !basladi; i++) {
      for (let t = 0; t < 60 && !o.musteriler.length; t += 0.1) oturumIlerlet(o, 0.1, rng);
      const m = o.musteriler[0];
      basladi = musteriyeVer(o, mukemmelTabak(m.siparis.parcalar, m.siparis.tercih))!.yogunBasladi;
    }
    expect(basladi).toBe(true);
    expect(o.yogunKalan).toBeGreaterThan(0);
    let bitti = false;
    for (let t = 0; t < 60 && !bitti; t += 0.5) bitti = oturumIlerlet(o, 0.5, rng).some((x) => x.tur === "yogunBitti");
    expect(bitti).toBe(true);
    expect(o.yogunKalan).toBe(0);
  });
});

describe("oturum: uzun simülasyon (bot) — saçmalamıyor", () => {
  test("20.000 müşteri mükemmel servis: seviye tutarlı artar, hiçbir değer bozulmaz", () => {
    const o = yeniOturum();
    const rng = rngOlustur(2026);
    let toplam = 0;
    for (let i = 0; i < 20000; i++) {
      for (let t = 0; t < 60 && !o.musteriler.length; t += 0.1) oturumIlerlet(o, 0.1, rng);
      const m = o.musteriler[0];
      expect(sabirOrani(m)).toBeGreaterThan(0);
      expect(m.siparis.parcalar.length).toBeLessThanOrEqual(12);
      expect(m.siparis.parcalar.every((id) => id === "krep" || o.sv.menu.includes(id))).toBe(true);
      const tabak = mukemmelTabak(m.siparis.parcalar).map((p) => (p.malzeme === "krep" && m.siparis.tercih ? { ...p, kalinlik: m.siparis.tercih } : p));
      const r = musteriyeVer(o, tabak)!;
      toplam++;
      expect(r.sonuc).toBe("perfect");
      expect(Number.isFinite(o.toplamCoin)).toBe(true);
      expect(o.ilerleme).toBeGreaterThanOrEqual(0);
      expect(o.ilerleme).toBeLessThan(gerekenMusteri(o.seviye));
    }
    expect(o.toplamMusteri).toBe(toplam);
    expect(o.seviye).toBeGreaterThan(100);
    expect(o.musteriler.every((m) => kategoriOf("krep") === "krep" && m.sabir > 0)).toBe(true);
  });
});

describe("oturum: oyuncu istatistikleri (en uzun seri, PERFECT sayısı)", () => {
  /** Bekleyen ilk müşteriye doğru tabak verir; usta=false ise GREAT olur */
  function servisEt(o: Oturum, usta = true) {
    musteriBekle(o);
    const tabak = mukemmelTabak(o.musteriler[0].siparis.parcalar, o.musteriler[0].siparis.tercih).map((p) => (p.malzeme === "krep" ? { ...p, usta } : p));
    return musteriyeVer(o, tabak)!;
  }

  test("PERFECT sayısı yalnızca PERFECT serviste artar; seri her doğru serviste artar", () => {
    const o = yeniOturum({ seviye: 5 });
    expect(servisEt(o).sonuc).toBe("perfect");
    expect(servisEt(o, false).sonuc).toBe("great");
    expect(servisEt(o).sonuc).toBe("perfect");
    expect(o.toplamMukemmel).toBe(2);
    expect(o.seri).toBe(3);
    expect(o.enIyiSeri).toBe(3);
  });

  test("müşteri kaçınca seri sıfırlanır ama en uzun seri rekoru kalır", () => {
    const o = yeniOturum({ seviye: 5 });
    for (let i = 0; i < 4; i++) servisEt(o);
    musteriBekle(o);
    const rng = rngOlustur(9);
    while (o.seri > 0) oturumIlerlet(o, 1, rng);
    expect(o.seri).toBe(0);
    expect(o.enIyiSeri).toBe(4);
    servisEt(o);
    expect(o.seri).toBe(1);
    expect(o.enIyiSeri).toBe(4);
  });

  test("yanlış tabak ve aynı tabakla ikinci deneme istatistikleri değiştirmez", () => {
    const o = yeniOturum({ seviye: 5 });
    musteriBekle(o);
    const siparis = o.musteriler[0].siparis;
    expect(musteriyeVer(o, mukemmelTabak([...siparis.parcalar, "krep"], siparis.tercih))).toBeNull();
    expect({ seri: o.seri, enIyiSeri: o.enIyiSeri, toplamMukemmel: o.toplamMukemmel }).toEqual({ seri: 0, enIyiSeri: 0, toplamMukemmel: 0 });
    const tabak = mukemmelTabak(siparis.parcalar, siparis.tercih);
    musteriyeVer(o, tabak);
    musteriyeVer(o, tabak);
    expect({ seri: o.seri, enIyiSeri: o.enIyiSeri, toplamMukemmel: o.toplamMukemmel }).toEqual({ seri: 1, enIyiSeri: 1, toplamMukemmel: 1 });
  });

  test("yeni oturum kayıttaki rekoru ve PERFECT sayısını devralır; seri sıfırdan başlar", () => {
    const o = yeniOturum({ seviye: 5, enIyiSeri: 12, toplamMukemmel: 40 });
    expect(o.seri).toBe(0);
    servisEt(o);
    expect(o.enIyiSeri).toBe(12);
    expect(o.toplamMukemmel).toBe(41);
    expect(yeniOturum({ enIyiSeri: -3, toplamMukemmel: -1 })).toMatchObject({ enIyiSeri: 0, toplamMukemmel: 0 });
  });
});
