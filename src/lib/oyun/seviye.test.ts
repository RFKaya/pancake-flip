import { describe, expect, test } from "bun:test";
import malzemeler from "../veri/malzemeler.json";
import seviyeJson from "../veri/seviye.json";
import type { Malzeme } from "../../types/oyun";
import {
  acilislar, gerekenMusteri, ilerlemeEkle, kilometreTasi, sayiKisalt, seviyeAyari, seviyeSinirla, sonrakiAcilis, zorluk,
} from "./seviye";
import { sabirHesapla } from "./musteri";
import { rngOlustur } from "./rng";
import { siparisUret } from "./siparis";
import { AYAR, MALZEMELER, TIPLER } from "./veri";

const M = malzemeler as Malzeme[];
// Spec'teki ve ötesindeki uç değerler: 1000 ve 1e9 "sonsuz"a yakın davranışı yoklar
const UC = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50, 75, 100, 150, 250, 500, 1000, 5000, 100000, 1e6, 1e9];

describe("gerekenMusteri (seviye başına müşteri sayısı)", () => {
  test("ilk seviyeler hızlı: 1,1,2,2,3", () => {
    expect([1, 2, 3, 4, 5].map(gerekenMusteri)).toEqual([1, 1, 2, 2, 3]);
  });
  test("noktalar tam tutar: 20→5, 50→8, 100→10, 200→15, 500→20", () => {
    expect(gerekenMusteri(20)).toBe(5);
    expect(gerekenMusteri(50)).toBe(8);
    expect(gerekenMusteri(100)).toBe(10);
    expect(gerekenMusteri(200)).toBe(15);
    expect(gerekenMusteri(500)).toBe(20);
  });
  test("hiç düşmez, her zaman tam sayı ≥ 1 ve tavanı aşmaz", () => {
    let onceki = 0;
    for (let L = 1; L <= 20000; L++) {
      const g = gerekenMusteri(L);
      expect(Number.isInteger(g)).toBe(true);
      expect(g).toBeGreaterThanOrEqual(onceki);
      expect(g).toBeLessThanOrEqual(seviyeJson.gerekenMusteri.tavan);
      onceki = g;
    }
    expect(gerekenMusteri(1e9)).toBe(seviyeJson.gerekenMusteri.tavan);
  });
});

describe("zorluk (normalize, doyuma giden)", () => {
  test("seviye 1'de 0; artar; asla 1'i geçmez; NaN üretmez", () => {
    expect(zorluk(1)).toBe(0);
    let onceki = -1;
    for (const L of UC) {
      const d = zorluk(L);
      expect(Number.isNaN(d)).toBe(false);
      expect(d).toBeGreaterThanOrEqual(onceki);
      expect(d).toBeLessThanOrEqual(1);
      onceki = d;
    }
  });
  test("lineer değil: 500. seviye 50.'nin 10 katı zor değil; 1000'den sonra plato", () => {
    expect(zorluk(500) / zorluk(50)).toBeLessThan(3);
    expect(zorluk(5000) - zorluk(1000)).toBeLessThan(0.001);
    expect(zorluk(1e9)).toBeLessThanOrEqual(1);
  });
});

describe("seviyeAyari: uç seviyelerde saçmalamaz", () => {
  test("zamanlayıcılar pozitif, aralıklar tutarlı, sınırlar aşılmaz", () => {
    for (const L of UC) {
      const sv = seviyeAyari(L);
      expect(sv.cevirPencere).toBeGreaterThan(0);
      expect(sv.hamurTolerans).toBeGreaterThan(0);
      expect(sv.pisirmeHizi).toBeGreaterThanOrEqual(1);
      expect(sv.pisirmeHizi).toBeLessThanOrEqual(seviyeJson.egriler.pisirmeHizi[1]);
      expect(sv.sabirCarpani).toBeGreaterThan(0);
      expect(sv.gelmeAraligi).toBeGreaterThan(0);
      expect(sv.krep[0]).toBeGreaterThanOrEqual(1);
      expect(sv.krep[1]).toBeGreaterThanOrEqual(sv.krep[0]);
      expect(sv.d[1]).toBeGreaterThanOrEqual(sv.d[0]);
      expect(sv.tava).toBeLessThanOrEqual(2);
      expect(sv.eszamanli).toBeLessThanOrEqual(3);
      expect(sv.menu.length).toBeLessThanOrEqual(M.length - 1);
      expect(sv.tercihOlasiligi).toBeLessThanOrEqual(1);
      expect(Object.values(sv.musteriAgirlik).every((w) => w > 0)).toBe(true);
      // en kötü ihtimalle üretilen sipariş için sabır asla negatif/sıfır ya da absürt küçük olmaz
      for (const tip of TIPLER) expect(sabirHesapla(1, L, tip)).toBeGreaterThanOrEqual(seviyeJson.sabirMin);
    }
  });

  test("açılışlar yalnızca artar: menü ve müşteri tipleri hiç kapanmaz; sonsuz malzeme açılmaz", () => {
    let menu = 0;
    let tipler = 0;
    for (let L = 1; L <= 2000; L++) {
      const sv = seviyeAyari(L);
      expect(sv.menu.length).toBeGreaterThanOrEqual(menu);
      expect(Object.keys(sv.musteriAgirlik).length).toBeGreaterThanOrEqual(tipler);
      menu = sv.menu.length;
      tipler = Object.keys(sv.musteriAgirlik).length;
    }
    expect(seviyeAyari(1e9).menu).toEqual(seviyeAyari(1000).menu);
  });

  test("seviye 1: yalnızca sade krep, çevirme baştan zorunlu, tek müşteri; 15'te 2 müşteri + 2 tava", () => {
    const s1 = seviyeAyari(1);
    expect(s1.menu).toEqual([]);
    expect(s1.krep).toEqual([1, 1]);
    expect(s1.cevirmeAcik).toBe(true);
    expect(s1.eszamanli).toBe(1);
    expect(seviyeAyari(3).cevirmeAcik).toBe(true);
    expect(seviyeAyari(4).menu).toEqual([]);
    expect(seviyeAyari(5).menu).toEqual(["cikolata"]);
    expect(seviyeAyari(10).menu).toContain("cilek-sosu");
    expect(seviyeAyari(14).eszamanli).toBe(1);
    expect(seviyeAyari(15)).toMatchObject({ eszamanli: 2, tava: 2 });
    expect(seviyeAyari(19).tercihAcik).toBe(false);
    expect(seviyeAyari(20).tercihAcik).toBe(true);
    expect(seviyeAyari(9).musteriAgirlik.cocuk).toBeUndefined();
    expect(seviyeAyari(10).musteriAgirlik.cocuk).toBeGreaterThan(0);
    expect(seviyeAyari(29).musteriAgirlik.elestirmen).toBeUndefined();
    expect(seviyeAyari(30).musteriAgirlik.elestirmen).toBeGreaterThan(0);
    expect(seviyeAyari(49).musteriAgirlik.vip).toBeUndefined();
    expect(seviyeAyari(50).musteriAgirlik.vip).toBeGreaterThan(0);
    expect(seviyeAyari(75).eszamanli).toBe(3);
    expect(seviyeAyari(149).yogunSaatAcik).toBe(false);
    expect(seviyeAyari(150).yogunSaatAcik).toBe(true);
  });

  test("zorluk artıkça müşteri sabrı kısalır, ama 0'a inmez", () => {
    const normal = TIPLER[0];
    expect(sabirHesapla(5, 1, normal)).toBeGreaterThan(sabirHesapla(5, 50, normal));
    expect(sabirHesapla(5, 50, normal)).toBeGreaterThan(sabirHesapla(5, 500, normal));
    expect(sabirHesapla(5, 1e9, normal)).toBeGreaterThan(10);
  });
});

describe("üretilen siparişler yapılabilir ve sınırlı", () => {
  test("her uç seviyede 300 tohum: tabağa sığar, yalnızca açık malzeme, D sınırı içinde (tip kaydırmasıyla)", () => {
    for (const L of UC) {
      const sv = seviyeAyari(L);
      for (const tip of TIPLER) {
        if (!sv.musteriAgirlik[tip.id]) continue;
        for (let tohum = 1; tohum <= 300; tohum++) {
          const s = siparisUret(sv, MALZEMELER, tip, AYAR, rngOlustur(tohum * 7 + L));
          expect(s.parcalar.length).toBeGreaterThanOrEqual(1);
          expect(s.parcalar.length).toBeLessThanOrEqual(AYAR.tabakMax);
          expect(s.parcalar.every((id) => id === "krep" || sv.menu.includes(id))).toBe(true);
          expect(s.d).toBeGreaterThan(0);
          expect(s.d).toBeLessThanOrEqual(sv.d[1] + tip.dKaydirma + 2); // fallback en fazla birkaç puan taşar
          if (tip.dMax !== undefined) expect(s.d).toBeLessThanOrEqual(tip.dMax);
        }
      }
    }
  });
});

describe("ilerleme ve seviye atlama", () => {
  test("yeterli puanla seviye atlar, artan puan taşınır", () => {
    expect(ilerlemeEkle(1, 0, 1)).toEqual({ seviye: 2, ilerleme: 0, atlanan: [2] });
    expect(ilerlemeEkle(3, 0, 1)).toEqual({ seviye: 3, ilerleme: 1, atlanan: [] });
    expect(ilerlemeEkle(3, 1, 1)).toEqual({ seviye: 4, ilerleme: 0, atlanan: [4] });
    expect(ilerlemeEkle(3, 1, 2)).toEqual({ seviye: 4, ilerleme: 1, atlanan: [4] });
    expect(ilerlemeEkle(1, 0, 3)).toEqual({ seviye: 3, ilerleme: 1, atlanan: [2, 3] });
  });
  test("seviye hiç düşmez; negatif girdiyi yok sayar", () => {
    expect(ilerlemeEkle(50, 3, -5).seviye).toBe(50);
    expect(ilerlemeEkle(50, -3, 0).ilerleme).toBe(0);
  });
  test("1'den 1000'e giden bütün yol: toplam müşteri = gerekenMusteri toplamı", () => {
    let s = 1;
    let i = 0;
    let musteri = 0;
    while (s < 1000) {
      musteri++;
      const r = ilerlemeEkle(s, i, 1);
      s = r.seviye;
      i = r.ilerleme;
    }
    let beklenen = 0;
    for (let L = 1; L < 1000; L++) beklenen += gerekenMusteri(L);
    expect(musteri).toBe(beklenen);
  });
});

describe("seviye sınırlama ve biçimlendirme", () => {
  test("geçersiz girdi güvenli seviyeye döner", () => {
    expect(seviyeSinirla(NaN)).toBe(1);
    expect(seviyeSinirla(-5)).toBe(1);
    expect(seviyeSinirla(0)).toBe(1);
    expect(seviyeSinirla(37.9)).toBe(37);
    expect(seviyeSinirla(Infinity)).toBe(seviyeJson.seviyeSiniri);
    expect(seviyeSinirla(1e30)).toBe(seviyeJson.seviyeSiniri);
  });
  test("büyük sayılar ekrana sığar", () => {
    expect(sayiKisalt(37)).toBe("37");
    expect(sayiKisalt(99999)).toBe("99999");
    expect(sayiKisalt(100000)).toBe("100K");
    expect(sayiKisalt(1234567)).toBe("1.2M");
    expect(sayiKisalt(1e9)).toBe("1B");
    expect(sayiKisalt(1e15).length).toBeLessThanOrEqual(8);
    expect(sayiKisalt(NaN)).toBe("∞");
  });
  test("açılış bildirimleri ve kilometre taşları", () => {
    expect(acilislar(5).map((a) => a.id)).toEqual(["cikolata"]);
    expect(acilislar(10).map((a) => a.id).sort()).toEqual(["cilek-sosu", "cocuk"]);
    expect(acilislar(6)).toEqual([]);
    expect(sonrakiAcilis(1).map((a) => a.id)).toEqual(["cikolata"]);
    expect(sonrakiAcilis(1e9)).toEqual([]);
    expect([10, 25, 50, 100, 250, 500].map((L) => kilometreTasi(L)?.baslik)).toEqual([
      "YENİ MÜŞTERİLER!", "YENİ SOSLAR!", "VIP MÜŞTERİLER!", "MASTER CHEF!", "PANCAKE LEGEND!", "PANCAKE GOD!",
    ]);
    expect(kilometreTasi(501)).toBeNull();
  });
});
