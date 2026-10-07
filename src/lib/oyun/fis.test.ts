import { describe, expect, test } from "bun:test";
import type { Fis } from "../../types/oyun";
import { fisNeti } from "./fis";

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
