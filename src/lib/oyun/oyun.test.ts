import { describe, expect, test } from "bun:test";
import ayar from "../veri/ayarlar.json";
import malzemeler from "../veri/malzemeler.json";
import tipler from "../veri/musteriler.json";
import type { Ayarlar, Malzeme, MusteriTipi, TabakParcasi } from "../../types/oyun";
import { degerlendir } from "./degerlendirme";
import { gelirHesapla, siparisFiyati, siparisMaliyeti } from "./ekonomi";
import { hamurIcinde, hamurSonucu, hamurToleransi } from "./hamur";
import { baglamOlustur, bolgeBul, cevirKalitesi, cevirPenceresi, krepParcasi, pismeDurumu, servisEdilebilir, tavaBirak, tavaCevir, tavaDokBasla, tavaIlerlet, tavaServis, yeniTava, type Tava } from "./pisirme";
import { rngOlustur } from "./rng";
import { seviyeAyari } from "./seviye";
import { siparisUret } from "./siparis";

const A = ayar as Ayarlar;
const M = malzemeler as Malzeme[];
const T = tipler as MusteriTipi[];
const SEVIYELER = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50, 75, 100, 250, 500, 1000, 100000];
const tabak = (...ids: string[]): TabakParcasi[] =>
  ids.map((malzeme) => (malzeme === "krep" ? { malzeme, pisme: "orta" as const } : { malzeme }));

describe("sipariş üretici", () => {
  test("her seviyede 1.000 tohumda grameri bozmaz, açık malzemeleri ve krep aralığını aşmaz", () => {
    for (const seviye of SEVIYELER) {
      const sv = seviyeAyari(seviye);
      for (let tohum = 1; tohum <= 1000; tohum++) {
        const rng = rngOlustur(tohum);
        const s = siparisUret(sv, M, T[0], A, rng);
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
        expect(krepSayisi).toBeGreaterThanOrEqual(sv.krep[0]);
        expect(krepSayisi).toBeLessThanOrEqual(sv.krep[1]);
        expect(s.parcalar.every((id) => id === "krep" || sv.menu.includes(id))).toBe(true);
        expect(s.parcalar.length).toBeLessThanOrEqual(A.tabakMax);
        if (s.tercih) expect(sv.tercihAcik).toBe(true);
      }
    }
  });

  test("aynı tohum aynı siparişi üretir", () => {
    const sv = seviyeAyari(100);
    expect(siparisUret(sv, M, T[0], A, rngOlustur(42))).toEqual(siparisUret(sv, M, T[0], A, rngOlustur(42)));
  });

  test("çocuk siparişleri D ≤ 4, en fazla 2 krep ve yalnızca tatlı", () => {
    const cocuk = T.find((t) => t.id === "cocuk")!;
    for (const seviye of [10, 50, 500]) {
      for (let tohum = 1; tohum <= 300; tohum++) {
        const s = siparisUret(seviyeAyari(seviye), M, cocuk, A, rngOlustur(tohum));
        expect(s.d).toBeLessThanOrEqual(4);
        expect(s.parcalar.filter((id) => id === "krep").length).toBeLessThanOrEqual(2);
        expect(s.parcalar.every((id) => id === "krep" || M.find((m) => m.id === id)!.tatli)).toBe(true);
      }
    }
  });

  test("tercih (ince/kalın) yalnızca 20. seviyeden sonra çıkar", () => {
    let var20 = false;
    for (let tohum = 1; tohum <= 300; tohum++) {
      expect(siparisUret(seviyeAyari(19), M, T[0], A, rngOlustur(tohum)).tercih).toBeUndefined();
      if (siparisUret(seviyeAyari(20), M, T[0], A, rngOlustur(tohum)).tercih) var20 = true;
    }
    expect(var20).toBe(true);
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
  test("kalınlık tercihi: istenmeyen kalınlıktaki her krep −10", () => {
    const ince: TabakParcasi[] = [{ malzeme: "krep", pisme: "iyi", kalinlik: "ince" }];
    const normal: TabakParcasi[] = [{ malzeme: "krep", pisme: "iyi", kalinlik: "normal" }];
    expect(degerlendir(["krep"], ince, 1, A, "ince").kalite).toBe(100);
    const d = degerlendir(["krep"], normal, 1, A, "ince");
    expect(d.hatalar).toEqual([{ tur: "kalinlik", sira: 1, istenen: "ince" }]);
    expect(d.kalite).toBe(90);
    expect(degerlendir(["krep"], normal, 1, A).kalite).toBe(100); // tercih yoksa fark etmez
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
    const g = gelirHesapla({ fiyat, sonuc: "perfect", tip: T[0], sabirOrani: 1, combo: 1, seviye: 20, ayar: A });
    expect(g.odeme).toBe(23);
    expect(Math.round(g.bahsis)).toBe(7);
    const net = g.toplam - siparisMaliyeti(siparis.parcalar, M);
    expect(Math.round(net)).toBe(29);
  });
});

describe("hamur dökme", () => {
  test("tolerans ±%10 ile başlar, seviyeyle biraz daralır, ±%7'nin altına inmez", () => {
    expect(hamurToleransi(1)).toBeCloseTo(0.1, 5);
    expect(hamurToleransi(1)).toBeGreaterThan(hamurToleransi(50));
    expect(hamurToleransi(50)).toBeGreaterThan(hamurToleransi(200));
    expect(hamurToleransi(1e6)).toBeCloseTo(0.07, 5);
  });
  test("hedef ±tolerans: 0,90 ve 1,10 doğru (yeşil), 0,89 ve 1,11 yanlış (sınırlar dahil)", () => {
    expect(hamurIcinde(1, 1, 1)).toBe(true);
    expect(hamurIcinde(0.9, 1, 1)).toBe(true);
    expect(hamurIcinde(1.1, 1, 1)).toBe(true);
    expect(hamurIcinde(0.89, 1, 1)).toBe(false);
    expect(hamurIcinde(1.11, 1, 1)).toBe(false);
  });
  test("tercih yokken yalnızca normal hedef geçerli; az/fazla döküm geçersiz krep (null)", () => {
    expect(hamurSonucu(1, 1, A)).toEqual({ kalinlik: "normal", mukemmel: true, az: false });
    expect(hamurSonucu(0.94, 1, A)).toEqual({ kalinlik: "normal", mukemmel: false, az: false });
    expect(hamurSonucu(0.5, 1, A)).toEqual({ kalinlik: null, mukemmel: false, az: true });
    expect(hamurSonucu(1.5, 1, A)).toEqual({ kalinlik: null, mukemmel: false, az: false });
    expect(hamurSonucu(0.7, 1, A).kalinlik).toBeNull();
  });
  test("tercihler açıkken ince / normal / kalın hedefleri ayrı ayrı geçerli", () => {
    expect(hamurSonucu(A.hamur.hedef.ince, 20, A, true).kalinlik).toBe("ince");
    expect(hamurSonucu(A.hamur.hedef.normal, 20, A, true).kalinlik).toBe("normal");
    expect(hamurSonucu(A.hamur.hedef.kalin, 20, A, true).kalinlik).toBe("kalin");
    expect(hamurSonucu(0.85, 20, A, true).kalinlik).toBeNull();
  });
});

describe("çevirme penceresi", () => {
  test("ideal ortada mükemmel, uçlarda erken/geç, çok erken kaçtı", () => {
    expect(cevirKalitesi(1, 1, A)).toBe("mukemmel");
    expect(cevirKalitesi(0.35, 1, A)).toBe("erken");
    expect(cevirKalitesi(1.55, 1, A)).toBe("gec");
    expect(cevirKalitesi(0.1, 1, A)).toBe("kacti");
  });
  test("pencere seviyeyle daralır: aynı p seviye 1'de mükemmel, 100'de değil; tabanın altına inmez", () => {
    expect(cevirPenceresi(1)).toBeGreaterThan(cevirPenceresi(10));
    expect(cevirKalitesi(1.15, 1, A)).toBe("mukemmel");
    expect(cevirKalitesi(1.15, 100, A)).not.toBe("mukemmel");
    expect(cevirPenceresi(1e9)).toBeCloseTo(0.08, 5);
    expect(cevirPenceresi(1e9)).toBeGreaterThan(0);
  });
  test("krep parçası: iki yüz pişmiş → 'iyi'; biri çiğ → 'cig'; biri yanık → 'yanik'; usta yalnızca pişmişte", () => {
    expect(krepParcasi([1, 1], "normal", A, true)).toEqual({ malzeme: "krep", pisme: "iyi", kalinlik: "normal", usta: true });
    expect(krepParcasi([0.3, 1], "normal", A, true)).toEqual({ malzeme: "krep", pisme: "cig", kalinlik: "normal", usta: false });
    expect(krepParcasi([1, 1.8], "normal", A).pisme).toBe("yanik");
  });
});

describe("pişme: oyuncuya üç durum (ÇİĞ / PİŞMİŞ / YANIK)", () => {
  test("eşikler ayarlar.json'dan; sınırlar dahil", () => {
    const { pismisP, yanikP } = A.pisirme;
    expect(pismeDurumu(0, A)).toBe("cig");
    expect(pismeDurumu(pismisP - 0.001, A)).toBe("cig");
    expect(pismeDurumu(pismisP, A)).toBe("pismis");
    expect(pismeDurumu(1, A)).toBe("pismis");
    expect(pismeDurumu(yanikP - 0.001, A)).toBe("pismis");
    expect(pismeDurumu(yanikP, A)).toBe("yanik");
  });
});

describe("tava durum makinesi", () => {
  const C = baglamOlustur(3, A); // 3. seviyeden itibaren çevirme açık
  const kos = (t: Tava, sn: number) => {
    const olaylar: string[] = [];
    for (let i = 0; i < Math.round(sn / 0.01); i++) olaylar.push(...tavaIlerlet(t, 0.01, C));
    return olaylar;
  };

  test("tam döngü: dök → yayıl → pişir → çevir → pişir → tabağa", () => {
    const t = yeniTava();
    expect(tavaDokBasla(t)).toBe(true);
    kos(t, 0.9); // ≈ ideal miktar
    expect(tavaBirak(t, C)?.mukemmel).toBe(true);
    expect(kos(t, 0.5)).toContain("yayildi");
    expect(t.faz).toBe("pisir");
    kos(t, A.pisirme.yuzSuresi); // p ≈ 1
    expect(tavaCevir(t, C)).toBe("mukemmel");
    expect(t.faz).toBe("ucus");
    expect(kos(t, 1.2)).toContain("indi");
    expect(t.yuz).toBe(1);
    kos(t, A.pisirme.yuzSuresi / A.pisirme.ikinciYuzHiz);
    const parca = tavaServis(t, C);
    expect(parca).toEqual({ malzeme: "krep", pisme: "iyi", kalinlik: "normal", usta: true });
    expect(kos(t, 0.6)).toContain("tabaga");
    expect(t.faz).toBe("bos");
  });

  test("seviye 1'de bile krep çevrilmeden tabağa alınamaz: iki yüzü de pişmeli", () => {
    const C1 = baglamOlustur(1, A);
    expect(C1.cevirmeAcik).toBe(true);
    const t = yeniTava();
    tavaDokBasla(t);
    for (let i = 0; i < 90; i++) tavaIlerlet(t, 0.01, C1);
    tavaBirak(t, C1);
    for (let i = 0; i < 50; i++) tavaIlerlet(t, 0.01, C1);
    for (let i = 0; i < Math.round(A.pisirme.yuzSuresi / 0.01); i++) tavaIlerlet(t, 0.01, C1);
    expect(tavaServis(t, C1)).toBeNull(); // 1. yüz pişse de ters yüz çiğ: servis yok
    expect(t.faz).toBe("pisir");
    expect(tavaCevir(t, C1)).not.toBeNull();
  });

  test("kazara dokunuş (az hamur) tavayı boş bırakır", () => {
    const t = yeniTava();
    tavaDokBasla(t);
    kos(t, 0.05);
    expect(tavaBirak(t, C)).toBeNull();
    expect(t.faz).toBe("bos");
  });

  test("basılı tutmaya devam edersen hamur taşar: geçersiz krep, tava boşalır", () => {
    const t = yeniTava();
    tavaDokBasla(t);
    expect(kos(t, 2)).toContain("tasti");
    expect(t.faz).toBe("bos");
  });

  test("az ya da çok hamur (hedefin ±toleransı dışında) krep yapmaz: tava boşalır", () => {
    for (const sn of [0.5, 1.15]) {
      const t = yeniTava();
      tavaDokBasla(t);
      kos(t, sn);
      const s = tavaBirak(t, C)!;
      expect(s.kalinlik).toBeNull();
      expect(s.az).toBe(sn < 0.9);
      expect(t.faz).toBe("bos");
    }
  });

  test("ÇİĞ yüz çevrilemez ve tabağa alınamaz; PİŞMİŞ olunca çevrilir; 2. yüz çiğken de alınamaz", () => {
    const t = yeniTava();
    tavaDokBasla(t);
    kos(t, 0.9);
    tavaBirak(t, C);
    kos(t, 0.5);
    expect(pismeDurumu(t.p[0], A)).toBe("cig");
    expect(tavaCevir(t, C)).toBeNull();
    expect(tavaServis(t, C)).toBeNull();
    expect(t.faz).toBe("pisir");
    kos(t, A.pisirme.yuzSuresi);
    expect(pismeDurumu(t.p[0], A)).toBe("pismis");
    expect(tavaCevir(t, C)).not.toBeNull();
    kos(t, 1.2);
    expect(t.yuz).toBe(1);
    expect(servisEdilebilir(t, C)).toBe(false);
    expect(tavaServis(t, C)).toBeNull();
    kos(t, A.pisirme.yuzSuresi / A.pisirme.ikinciYuzHiz);
    expect(servisEdilebilir(t, C)).toBe(true);
  });

  test("çok bekleyen krep yanar, bekleme sonunda çöpe gider; çevirme/servis geçersiz", () => {
    const t = yeniTava();
    tavaDokBasla(t);
    kos(t, 0.9);
    tavaBirak(t, C);
    const olay = kos(t, 6);
    expect(olay).toContain("yandi");
    expect(olay).toContain("cop");
    expect(t.faz).toBe("bos");
    expect(tavaCevir(t, C)).toBeNull();
    expect(tavaServis(t, C)).toBeNull();
  });

  test("1. yüz pişmeden aşağı kaydırma servis etmez; havadayken çevrilemez", () => {
    const t = yeniTava();
    tavaDokBasla(t);
    kos(t, 0.9);
    tavaBirak(t, C);
    kos(t, 0.6);
    expect(tavaServis(t, C)).toBeNull();
    kos(t, 1.5);
    expect(tavaCevir(t, C)).not.toBeNull();
    expect(tavaCevir(t, C)).toBeNull();
  });
});
