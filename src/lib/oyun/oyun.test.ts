import { describe, expect, test } from "bun:test";
import ayar from "../veri/ayarlar.json";
import bolumler from "../veri/bolumler.json";
import malzemeler from "../veri/malzemeler.json";
import tipler from "../veri/musteriler.json";
import type { Ayarlar, Bolum, Malzeme, MusteriTipi, TabakParcasi } from "../../types/oyun";
import { degerlendir } from "./degerlendirme";
import { gelirHesapla, siparisFiyati, siparisMaliyeti } from "./ekonomi";
import { kuyrukUret } from "./kuyruk";
import { hamurSonucu, hamurToleransi } from "./hamur";
import { bolgeBul, cevirKalitesi, cevirPenceresi, krepParcasi, tavaBirak, tavaCevir, tavaDokBasla, tavaIlerlet, tavaServis, yeniTava, type Tava } from "./pisirme";
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

describe("hamur dökme", () => {
  test("tolerans bölümle daralır ve tabanda kalır", () => {
    expect(hamurToleransi(1, A)).toBeGreaterThan(hamurToleransi(5, A));
    expect(hamurToleransi(5, A)).toBeGreaterThan(hamurToleransi(10, A));
    expect(hamurToleransi(99, A)).toBe(A.hamur.tolerans.min);
  });
  test("az → ince, ideal → normal (PERFECT POUR), fazla → kalın", () => {
    expect(hamurSonucu(0.3, 1, A)).toEqual({ kalinlik: "ince", mukemmel: false });
    expect(hamurSonucu(1, 1, A)).toEqual({ kalinlik: "normal", mukemmel: true });
    expect(hamurSonucu(1.7, 1, A)).toEqual({ kalinlik: "kalin", mukemmel: false });
  });
  test("ilk bölümde 0,6–1,4 arası hep ideal; son bölümde 0,6 değil", () => {
    expect(hamurSonucu(0.6, 1, A).mukemmel).toBe(true);
    expect(hamurSonucu(1.4, 1, A).mukemmel).toBe(true);
    expect(hamurSonucu(0.6, 20, A).mukemmel).toBe(false);
  });
});

describe("çevirme penceresi", () => {
  test("ideal ortada mükemmel, uçlarda erken/geç, çok erken kaçtı", () => {
    expect(cevirKalitesi(1, 1, A)).toBe("mukemmel");
    expect(cevirKalitesi(0.35, 1, A)).toBe("erken");
    expect(cevirKalitesi(1.55, 1, A)).toBe("gec");
    expect(cevirKalitesi(0.1, 1, A)).toBe("kacti");
  });
  test("pencere bölümle daralır: aynı p bölüm 1'de mükemmel, 20'de değil", () => {
    expect(cevirPenceresi(1, A)).toBeGreaterThan(cevirPenceresi(5, A));
    expect(cevirKalitesi(1.15, 1, A)).toBe("mukemmel");
    expect(cevirKalitesi(1.15, 20, A)).not.toBe("mukemmel");
  });
  test("kusursuz krep 'iyi', çiğ-çiğ 'cig', iki yüz de fazla 'fazla'", () => {
    expect(krepParcasi([1, 1], "normal", 10, A).pisme).toBe("iyi");
    expect(krepParcasi([0.3, 0.3], "normal", 10, A).pisme).toBe("cig");
    expect(krepParcasi([1.6, 1.6], "normal", 10, A).pisme).toBe("fazla");
  });
});

describe("tava durum makinesi", () => {
  const C = { ayar: A, bolumNo: 1 };
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
    expect(parca).toEqual({ malzeme: "krep", pisme: "iyi", kalinlik: "normal" });
    expect(kos(t, 0.6)).toContain("tabaga");
    expect(t.faz).toBe("bos");
  });

  test("kazara dokunuş (az hamur) tavayı boş bırakır", () => {
    const t = yeniTava();
    tavaDokBasla(t);
    kos(t, 0.05);
    expect(tavaBirak(t, C)).toBeNull();
    expect(t.faz).toBe("bos");
  });

  test("basılı tutmaya devam edersen hamur taşar ve kalın krep olur", () => {
    const t = yeniTava();
    tavaDokBasla(t);
    expect(kos(t, 2)).toContain("tasti");
    expect(t.kalinlik).toBe("kalin");
    expect(["yayil", "pisir"]).toContain(t.faz);
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
    tavaCevir(t, C);
    expect(tavaCevir(t, C)).toBeNull();
  });
});
