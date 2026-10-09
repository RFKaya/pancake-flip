import { describe, expect, test } from "bun:test";
import { bosIlerleme, ilerlemeCoz, ilerlemeKirp } from "./ilerlemeKaydi";
import { yeniOturum } from "./oturum";
import { gerekenMusteri, ilerlemeEkle } from "./seviye";
import { SEVIYE } from "./veri";

const kayit = (v: Record<string, unknown>) => JSON.stringify({ surum: 1, seviye: 1, ilerleme: 0, toplamMusteri: 0, toplamCoin: 0, enYuksekSeviye: 1, ...v });

describe("ilerleme kaydı (ilerlemeCoz)", () => {
  test("geçerli kayıt aynen geri gelir", () => {
    const v = { surum: 1 as const, seviye: 20, ilerleme: 3, toplamMusteri: 140, toplamCoin: 5043, enYuksekSeviye: 25, enIyiSeri: 17, toplamMukemmel: 88 };
    expect(ilerlemeCoz(JSON.stringify(v))).toEqual(v);
  });

  test("boş, bozuk JSON ya da başka sürüm → sıfır kayıt (çökmez)", () => {
    for (const ham of [null, "", "{", "null", "[]", JSON.stringify({ surum: 2, seviye: 50 })]) {
      expect(ilerlemeCoz(ham)).toEqual(bosIlerleme());
    }
  });

  test("geçersiz sayılar güvenli değerlere döner; en yüksek seviye geçerli seviyenin altına inmez", () => {
    const v = ilerlemeCoz(kayit({ seviye: 12.7, ilerleme: -4, toplamMusteri: "çok", toplamCoin: null, enYuksekSeviye: 3 }));
    expect(v).toEqual({ surum: 1, seviye: 12, ilerleme: 0, toplamMusteri: 0, toplamCoin: 0, enYuksekSeviye: 12, enIyiSeri: 0, toplamMukemmel: 0 });
  });

  test("istatistik alanları olmayan eski kayıt: rekor ve PERFECT sayısı 0 başlar, diğer alanlar korunur", () => {
    const eski = { surum: 1 as const, seviye: 30, ilerleme: 2, toplamMusteri: 250, toplamCoin: 4000, enYuksekSeviye: 30 };
    expect(ilerlemeCoz(JSON.stringify(eski))).toEqual({ ...eski, enIyiSeri: 0, toplamMukemmel: 0 });
  });

  test("bozuk istatistik değerleri 0 olur; ondalık değer aşağı yuvarlanır", () => {
    expect(ilerlemeCoz(kayit({ enIyiSeri: "çok", toplamMukemmel: -5 }))).toMatchObject({ enIyiSeri: 0, toplamMukemmel: 0 });
    expect(ilerlemeCoz(kayit({ enIyiSeri: 7.9, toplamMukemmel: 12.2 }))).toMatchObject({ enIyiSeri: 7, toplamMukemmel: 12 });
  });

  test("seviyenin gerektirdiğini aşan ilerleme kırpılır: ekranda '40 / 3' görünmez, tek servis tek seviye atlatır", () => {
    const v = ilerlemeCoz(kayit({ seviye: 9, ilerleme: 40 }));
    expect(gerekenMusteri(9)).toBe(3);
    expect(v.ilerleme).toBe(2);
    // Kırpılmasaydı tek müşteri 9 → 19 atlatırdı; kırpılınca yalnızca 10'a geçer
    expect(ilerlemeEkle(9, 40, 1).atlanan.length).toBe(10);
    expect(ilerlemeEkle(v.seviye, v.ilerleme, 1).atlanan).toEqual([10]);
  });

  test("tam sınırdaki ilerleme de kırpılır; altındaki dokunulmaz; son seviyede ilerleme 0", () => {
    for (const s of [1, 2, 9, 20, 100, 5000]) {
      const g = gerekenMusteri(s);
      expect(ilerlemeKirp(s, g)).toBe(g - 1);
      expect(ilerlemeKirp(s, g - 1)).toBe(g - 1);
      expect(ilerlemeKirp(s, 0)).toBe(0);
    }
    expect(ilerlemeKirp(SEVIYE.seviyeSiniri, 7)).toBe(0);
  });

  test("çözülen kayıtla başlayan oturum geçerli bir yerden devam eder", () => {
    const o = yeniOturum({ ...ilerlemeCoz(kayit({ seviye: 50, ilerleme: 999, toplamMusteri: 400, toplamCoin: 9000 })) });
    expect(o.seviye).toBe(50);
    expect(o.ilerleme).toBeLessThan(o.sv.gerekenMusteri);
    expect(o.toplamCoin).toBe(9000);
  });
});
