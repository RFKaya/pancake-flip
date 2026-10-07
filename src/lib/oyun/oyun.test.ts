import { describe, expect, test } from "bun:test";
import ayar from "../veri/ayarlar.json";
import bolumler from "../veri/bolumler.json";
import malzemeler from "../veri/malzemeler.json";
import tipler from "../veri/musteriler.json";
import type { Ayarlar, Bolum, Malzeme, MusteriTipi, TabakParcasi } from "../../types/oyun";
import { degerlendir } from "./degerlendirme";
import { gelirHesapla, siparisFiyati, siparisMaliyeti } from "./ekonomi";
import { kuyrukUret } from "./kuyruk";
import { bolgeBul } from "./pisirme";
import { rngOlustur } from "./rng";
import { siparisUret } from "./siparis";

const A = ayar as Ayarlar;
const M = malzemeler as Malzeme[];
const T = tipler as MusteriTipi[];
const B = bolumler as unknown as Bolum[];
const tabak = (...ids: string[]): TabakParcasi[] =>
  ids.map((malzeme) => (malzeme === "krep" ? { malzeme, pisme: "orta" as const } : { malzeme }));

describe("sipariş üretici", () => {
  test("1.000 tohumda grameri bozmaz ve D aralığında kalır (7 bölüm)", () => {
    for (const bolum of B) {
      for (let tohum = 1; tohum <= 1000; tohum++) {
        const rng = rngOlustur(tohum);
        const tip = T[0];
        const s = siparisUret(bolum, M, tip, A, rng);
        expect(s.parcalar[0]).toBe("krep");
        const kategori = (id: string) => M.find((m) => m.id === id)!.kategori;
        // dolgu en altta/üstte olamaz; topping yalnızca en üstte; en fazla 1 topping
        s.parcalar.forEach((id, i) => {
          if (kategori(id) === "dolgu") {
            expect(s.parcalar[i - 1]).toBe("krep");
            expect(s.parcalar[i + 1]).toBe("krep");
          }
          if (kategori(id) === "topping") expect(i).toBe(s.parcalar.length - 1);
        });
        const krepSayisi = s.parcalar.filter((id) => id === "krep").length;
        expect(krepSayisi).toBeGreaterThanOrEqual(bolum.krep[0]);
        expect(krepSayisi).toBeLessThanOrEqual(bolum.krep[1]);
        expect(s.parcalar.every((id) => id === "krep" || bolum.menu.includes(id))).toBe(true);
      }
    }
  });

  test("tüm bölümlerde 500 tohumla kuyruk üretilir; her müşterinin tipi tanımlıdır", () => {
    for (const bolum of B) {
      for (let tohum = 1; tohum <= 500; tohum++) {
        const k = kuyrukUret(bolum, M, T, A, tohum);
        expect(k.length).toBe(bolum.musteriSayisi);
        for (const m of k) {
          expect(T.some((t) => t.id === m.tip)).toBe(true);
          expect(m.sabirToplam).toBeGreaterThan(0);
        }
      }
    }
  });

  test("aynı tohum aynı kuyruğu üretir", () => {
    const a = kuyrukUret(B[6], M, T, A, 42);
    const b = kuyrukUret(B[6], M, T, A, 42);
    expect(a).toEqual(b);
  });

  test("çocuk siparişleri D ≤ 4, en fazla 2 krep ve yalnızca tatlı", () => {
    const cocuk = T[1];
    for (let tohum = 1; tohum <= 300; tohum++) {
      const s = siparisUret(B[6], M, cocuk, A, rngOlustur(tohum));
      expect(s.d).toBeLessThanOrEqual(4);
      expect(s.parcalar.filter((id) => id === "krep").length).toBeLessThanOrEqual(2);
      expect(s.parcalar.every((id) => id !== "tereyagi")).toBe(true);
    }
  });
});

describe("pişme bölgeleri", () => {
  test("sınırlar", () => {
    expect(bolgeBul(0.1, A)).toBe("cig");
    expect(bolgeBul(0.4, A)).toBe("az");
    expect(bolgeBul(0.7, A)).toBe("orta");
    expect(bolgeBul(0.9, A)).toBe("iyi");
    expect(bolgeBul(1.1, A)).toBe("fazla");
    expect(bolgeBul(1.2, A)).toBe("yanik");
  });
});

describe("değerlendirme", () => {
  const beklenen = ["krep", "cikolata", "krep", "cilek-sosu"];
  test("doğru tabak PERFECT", () => {
    const d = degerlendir(beklenen, tabak("krep", "cikolata", "krep", "cilek-sosu"), 1, A);
    expect(d.sonuc).toBe("perfect");
    expect(d.kalite).toBe(100);
    expect(d.dogru.every(Boolean)).toBe(true);
  });
  test("eksik parça −25 → GOOD", () => {
    const d = degerlendir(beklenen, tabak("krep", "cikolata", "krep"), 1, A);
    expect(d.hatalar).toEqual([{ tur: "eksik", malzeme: "cilek-sosu" }]);
    expect(d.kalite).toBe(75);
    expect(d.sonuc).toBe("good");
  });
  test("fazla parça −20 → GREAT", () => {
    const d = degerlendir(beklenen, tabak("krep", "cikolata", "krep", "cilek-sosu", "tereyagi"), 1, A);
    expect(d.hatalar).toEqual([{ tur: "fazla", malzeme: "tereyagi" }]);
    expect(d.kalite).toBe(80);
    expect(d.sonuc).toBe("great");
  });
  test("yanlış malzeme −25", () => {
    const d = degerlendir(beklenen, tabak("krep", "cilek-dilimi", "krep", "cilek-sosu"), 1, A);
    expect(d.hatalar[0]).toEqual({ tur: "yanlis", malzeme: "cilek-dilimi", beklenen: "cikolata" });
    expect(d.kalite).toBe(75);
  });
  test("komşu iki parçanın yer değişmesi sıra hatası −10", () => {
    const d = degerlendir(["krep", "krep", "cikolata"], tabak("krep", "cikolata", "krep"), 1, A);
    expect(d.hatalar).toEqual([{ tur: "sira" }]);
    expect(d.kalite).toBe(90);
  });
  test("çiğ krep −25, fazla pişmiş krep −25", () => {
    const cig: TabakParcasi[] = [{ malzeme: "krep", pisme: "cig" }];
    expect(degerlendir(["krep"], cig, 1, A).kalite).toBe(75);
    const fazla: TabakParcasi[] = [{ malzeme: "krep", pisme: "fazla" }];
    expect(degerlendir(["krep"], fazla, 1, A).kalite).toBe(75);
  });
  test("çocuk hata cezası ×0,5", () => {
    expect(degerlendir(beklenen, tabak("krep", "cikolata", "krep"), 0.5, A).kalite).toBe(88);
  });
});

describe("ekonomi", () => {
  test("tasarım belgesi §9.2 örneği: net +29", () => {
    const siparis = { parcalar: ["krep", "cikolata", "krep", "cilek-sosu"], d: 5 };
    const fiyat = siparisFiyati(siparis, M);
    expect(fiyat).toBe(23);
    const g = gelirHesapla({ fiyat, sonuc: "perfect", tip: T[0], sabirOrani: 1, combo: 1, bolumNo: 6, ayar: A });
    expect(g.odeme).toBe(23);
    expect(Math.round(g.bahsis)).toBe(7);
    const net = g.toplam - siparisMaliyeti(siparis.parcalar, M);
    expect(Math.round(net)).toBe(29);
  });
});
