import { describe, expect, test } from "bun:test";
import type { Fis } from "../types";
import { fislerCoz, fisNeti } from "./fis";

const fis = (bolum: number, kasa?: number): Fis => ({ kod: `WEB-${bolum}`, bolum, yildiz: 3, net: 0, kasa, tarih: "2026-10-07T12:00:00.000Z" });

describe("fiş kazancı (fisNeti)", () => {
  test("ilk fişin kazancı kasanın tamamıdır", () => {
    expect(fisNeti(120, [])).toBe(120);
  });

  test("sonraki fiş yalnızca önceki fişten bu yana kazanılanı yazar, kasanın tamamını değil", () => {
    // Fişler en yeni başta saklanır: önceki fiş listenin ilk elemanı
    expect(fisNeti(5030, [fis(10, 5012)])).toBe(18);
    expect(fisNeti(900, [fis(20, 700), fis(10, 300)])).toBe(200);
  });

  test("ardışık fişlerin kazançları toplamı kasaya eşittir (Fişlerim toplamı şişmez)", () => {
    const fisler: Fis[] = [];
    for (const kasa of [40, 310, 310, 1275, 4000]) {
      const net = fisNeti(kasa, fisler);
      fisler.unshift({ ...fis(fisler.length + 1, kasa), net });
    }
    expect(fisler.reduce((t, f) => t + f.net, 0)).toBe(4000);
    expect(fisler.map((f) => f.net)).toEqual([2725, 965, 0, 270, 40]);
  });

  test("kasası olmayan eski fişler atlanır; hiçbiri yoksa kazanç kasanın tamamıdır", () => {
    expect(fisNeti(500, [fis(30), fis(20, 350), fis(10)])).toBe(150);
    expect(fisNeti(500, [fis(30), fis(20)])).toBe(500);
  });

  test("ilerleme sıfırlanınca (kasa azaldı) kazanç negatif olmaz, yeni kasa yazılır", () => {
    expect(fisNeti(80, [fis(40, 9000)])).toBe(80);
  });

  test("ondalık ya da negatif kasa güvenli tam sayıya döner", () => {
    expect(fisNeti(10.6, [])).toBe(11);
    expect(fisNeti(-5, [fis(10, 100)])).toBe(0);
  });
});

describe("adisyon kaydı (fislerCoz)", () => {
  const f1 = { kod: "WEB-020-3ABC", bolum: 20, yildiz: 3, net: 19, kasa: 5043, tarih: "2026-10-07T17:30:00.000Z" };
  const f2 = { kod: "KRP-010-Y1234567", bolum: 10, yildiz: 3, net: 5024, kasa: 5024, tarih: "2026-10-07T17:20:00.000Z" };

  test("kayıttaki fişler sırası korunarak geri gelir", () => {
    expect(fislerCoz(JSON.stringify({ surum: 1, fisler: [f1, f2] }))).toEqual([f1, f2]);
  });

  test("eski (bölüm modeli) kayıt: coin / bolumler alanları olsa da olmasa da fişler okunur; kasası olmayan fiş kasasız kalır", () => {
    const eskiFis = { kod: "KRP-003-Y0000001", bolum: 3, yildiz: 2, net: 41, tarih: "2026-10-07T14:00:00.000Z" };
    expect(fislerCoz(JSON.stringify({ surum: 1, coin: 120, bolumler: { "3": { yildiz: 2, enIyiNet: 41 } }, fisler: [eskiFis] }))).toEqual([eskiFis]);
    expect(fislerCoz(JSON.stringify({ surum: 1, fisler: [eskiFis] }))).toEqual([eskiFis]);
  });

  test("boş, bozuk JSON, başka sürüm ya da fişsiz kayıt → boş liste (çökmez)", () => {
    for (const ham of [null, "", "{", "null", "[]", JSON.stringify({ surum: 2, fisler: [f1] }), JSON.stringify({ surum: 1, coin: 5, bolumler: {} })]) {
      expect(fislerCoz(ham)).toEqual([]);
    }
  });

  test("kodu, seviyesi ya da tarihi olmayan girdi atlanır; bozuk yıldız / kazanç 0 sayılır (toplam NaN olmaz)", () => {
    const fisler = fislerCoz(JSON.stringify({
      surum: 1,
      fisler: [null, 7, { ...f1, kod: 5 }, { ...f1, bolum: "20" }, { ...f1, tarih: undefined }, { ...f2, yildiz: "üç", net: "çok", kasa: null }],
    }));
    expect(fisler).toEqual([{ kod: f2.kod, bolum: 10, yildiz: 0, net: 0, tarih: f2.tarih }]);
    expect(Number.isNaN(fisler.reduce((t, f) => t + f.net, 0))).toBe(false);
  });
});
