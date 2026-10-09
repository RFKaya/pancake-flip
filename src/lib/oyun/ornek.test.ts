import { describe, expect, test } from "bun:test";
import { ornekFisler, ornekMusteriler, ornekSiparisler } from "../veri/ornek";
import { fislerCoz } from "./fis";
import { MALZEMELER, TIPLER } from "./veri";

describe("örnek veri (src/lib/veri/ornek.ts)", () => {
  test("her ana tipten en az 6 kayıt", () => {
    expect(ornekSiparisler.length).toBeGreaterThanOrEqual(6);
    expect(ornekMusteriler.length).toBeGreaterThanOrEqual(6);
    expect(ornekFisler.length).toBeGreaterThanOrEqual(6);
    expect(MALZEMELER.length).toBeGreaterThanOrEqual(6);
  });

  test("siparişler yalnız gerçek malzeme kimliklerini kullanır ve krepten başlar", () => {
    const idler = new Set(MALZEMELER.map((m) => m.id));
    for (const s of ornekSiparisler) {
      expect(s.parcalar[0]).toBe("krep");
      for (const p of s.parcalar) expect(idler.has(p)).toBe(true);
    }
  });

  test("müşteriler gerçek müşteri tiplerinden; kalan sabır toplamı aşmaz", () => {
    const tipler = new Set(TIPLER.map((t) => t.id));
    for (const m of ornekMusteriler) {
      expect(tipler.has(m.tip)).toBe(true);
      expect(m.sabir).toBeLessThanOrEqual(m.sabirToplam);
    }
  });

  test("fişler KRP biçiminde, yıldızı 0–3 ve fiş kaydı çözücüsünden kayıpsız geçer", () => {
    for (const f of ornekFisler) {
      expect(f.kod).toMatch(/^KRP-\d{3}-[0-3][0-9A-F]{6}$/);
      expect(f.yildiz).toBeGreaterThanOrEqual(0);
      expect(f.yildiz).toBeLessThanOrEqual(3);
    }
    const ham = JSON.stringify({ surum: 1, coin: 0, bolumler: {}, fisler: ornekFisler });
    expect(fislerCoz(ham)).toEqual(ornekFisler);
  });
});
