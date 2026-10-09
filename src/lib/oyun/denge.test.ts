// Denge güvenceleri: seviye.json / ayarlar.json ayarlanırken oyunun "oynanabilir" kalmasını sınar.
// Süreler formülle değil, gerçek tava durum makinesi (pisirme.ts) adım adım çalıştırılarak ölçülür.
import { describe, expect, test } from "bun:test";
import type { Kalinlik, MusteriTipi } from "../types";
import { sabirHesapla } from "./musteri";
import { baglamOlustur, cevirKalitesi, pismeDurumu, servisEdilebilir, tavaBirak, tavaCevir, tavaDokBasla, tavaIlerlet, tavaServis, yeniTava } from "./pisirme";
import { rngOlustur } from "./rng";
import { seviyeAyari } from "./seviye";
import { siparisUret } from "./siparis";
import { AYAR, MALZEMELER, TIPLER } from "./veri";

const DT = 1 / 60; // oyun döngüsü: bir kare
const SEVIYELER = [1, 3, 5, 8, 15, 20, 31, 50, 75, 100, 200, 500, 1000, 1e5, 1e9];
const KALINLIKLAR: Kalinlik[] = ["ince", "normal", "kalin"];

/**
 * Kusursuz oyuncu: hamuru tam hedefte bırakır, yüz PİŞMİŞ olur olmaz çevirir / kaydırır.
 * Dökmenin başından krebin tabağa inişine kadar geçen süreyi (sn) döner; krep yanarsa ya da geçersiz olursa hata verir.
 */
function idealKrepSuresi(seviye: number, kalinlik: Kalinlik): number {
  const c = baglamOlustur(seviye, AYAR);
  const t = yeniTava();
  let sure = 0;
  const ilerlet = () => {
    if (tavaIlerlet(t, DT, c).includes("yandi")) throw new Error(`seviye ${seviye} ${kalinlik}: kusursuz oyuncuda krep yandı`);
    sure += DT;
  };
  tavaDokBasla(t);
  while (t.hamur.miktar < AYAR.hamur.hedef[kalinlik]) ilerlet();
  const dokum = tavaBirak(t, { ...c, tercihAcik: c.tercihAcik || kalinlik !== "normal" });
  if (dokum?.kalinlik !== kalinlik) throw new Error(`seviye ${seviye}: hedefte bırakılan ${kalinlik} hamur ${dokum?.kalinlik} oldu`);
  while (!tavaCevir(t, c)) ilerlet();
  while (!servisEdilebilir(t, c)) ilerlet();
  tavaServis(t, c);
  while (t.faz !== "bos") ilerlet();
  return sure;
}

describe("denge: her sipariş müşterinin sabrı içinde yapılabilir", () => {
  // Malzeme düğmesine basıp tabağa düşmesi için oyuncuya tanınan süre (sn); gerçek oyunda dokunuş anlıktır
  const MALZEME_SN = 0.4;
  // Kusursuz oyuncu sabrın en fazla 2/3'ünü kullanmalı: gerçek oyuncunun gecikmesine ve hatasına pay kalsın
  const PAY = 1.5;

  test("kusursuz krep süresi her seviyede ve kalınlıkta sonlu; tava hiç yanmaz", () => {
    for (const s of SEVIYELER) {
      for (const k of KALINLIKLAR) {
        const sure = idealKrepSuresi(s, k);
        expect(sure).toBeGreaterThan(0);
        expect(sure).toBeLessThan(10);
      }
    }
  });

  test("her seviyede, her açık müşteri tipinin 200 siparişi sabrın 2/3'ünden kısa sürede hazırlanır", () => {
    const rng = rngOlustur(2026);
    for (const s of SEVIYELER) {
      const sv = seviyeAyari(s);
      const krepSuresi = Object.fromEntries(KALINLIKLAR.map((k) => [k, idealKrepSuresi(s, k)])) as Record<Kalinlik, number>;
      for (const tip of TIPLER.filter((t) => t.id in sv.musteriAgirlik) as MusteriTipi[]) {
        for (let i = 0; i < 200; i++) {
          const siparis = siparisUret(sv, MALZEMELER, tip, AYAR, rng);
          const krep = siparis.parcalar.filter((p) => p === "krep").length;
          // Tavalar aynı anda pişirir; malzemeler sırayla konur
          const gereken = Math.ceil(krep / sv.tava) * krepSuresi[siparis.tercih ?? "normal"] + (siparis.parcalar.length - krep) * MALZEME_SN;
          const sabir = sabirHesapla(siparis.d, s, tip);
          if (sabir < gereken * PAY) {
            throw new Error(`seviye ${s} ${tip.id}: ${siparis.parcalar.join(",")} (${siparis.tercih ?? "normal"}) ${gereken.toFixed(1)} sn ister, sabır ${sabir.toFixed(1)} sn`);
          }
        }
      }
    }
  });
});

describe("denge: pişme pencereleri her seviyede insan eliyle yakalanabilir", () => {
  // Pişmiş yüzü yanmadan çevirmek / kaydırmak için en az bu kadar süre kalmalı (tepki + kaydırma jesti)
  const EN_AZ_PISMIS_SN = 0.4;
  // MÜKEMMEL çevirme penceresi en az bu kadar kare sürmeli; daha dar bir pencere 60 fps'te kare zamanlamasına kalır
  const EN_AZ_MUKEMMEL_KARE = 3;

  /** Hamuru hedefte döker ve yayılmayı bitirir: tava 1. yüzü pişirmeye başlar */
  function pisirmeyeBasla(seviye: number, kalinlik: Kalinlik) {
    const c = { ...baglamOlustur(seviye, AYAR), tercihAcik: true };
    const t = yeniTava();
    tavaDokBasla(t);
    while (t.hamur.miktar < AYAR.hamur.hedef[kalinlik]) tavaIlerlet(t, DT, c);
    tavaBirak(t, c);
    while (t.faz !== "pisir") tavaIlerlet(t, DT, c);
    return { t, c };
  }

  /** Aktif yüzün PİŞMİŞ kaldığı süre (sn): pişmiş olduğu ilk kareden yanana kadar */
  function pismisSuresi(t: ReturnType<typeof yeniTava>, c: ReturnType<typeof baglamOlustur>): number {
    let sure = 0;
    while (t.faz === "pisir") {
      if (pismeDurumu(t.p[t.yuz], AYAR) === "pismis") sure += DT;
      tavaIlerlet(t, DT, c);
    }
    return sure;
  }

  test("her seviyede ve kalınlıkta iki yüz de en az 0,4 sn PİŞMİŞ kalır (yanmadan çevrilip alınabilir)", () => {
    for (const s of SEVIYELER) {
      for (const k of KALINLIKLAR) {
        const bir = pisirmeyeBasla(s, k);
        expect(pismisSuresi(bir.t, bir.c)).toBeGreaterThanOrEqual(EN_AZ_PISMIS_SN);

        const iki = pisirmeyeBasla(s, k);
        while (!tavaCevir(iki.t, iki.c)) tavaIlerlet(iki.t, DT, iki.c);
        while (iki.t.faz === "ucus") tavaIlerlet(iki.t, DT, iki.c);
        expect(iki.t.yuz).toBe(1);
        expect(pismisSuresi(iki.t, iki.c)).toBeGreaterThanOrEqual(EN_AZ_PISMIS_SN);
      }
    }
  });

  test("MÜKEMMEL çevirme penceresi her seviyede ve kalınlıkta en az 3 kare sürer", () => {
    for (const s of SEVIYELER) {
      for (const k of KALINLIKLAR) {
        const { t, c } = pisirmeyeBasla(s, k);
        let kare = 0;
        while (t.faz === "pisir") {
          if (pismeDurumu(t.p[0], AYAR) === "pismis" && cevirKalitesi(t.p[0], s, AYAR) === "mukemmel") kare++;
          tavaIlerlet(t, DT, c);
        }
        if (kare < EN_AZ_MUKEMMEL_KARE) throw new Error(`seviye ${s} ${k}: mükemmel çevirme yalnızca ${kare} kare`);
      }
    }
  });
});
