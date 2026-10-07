// Sonsuz oyun oturumu: müşteri slotları, sabır, ilerleme, seviye atlama (docs/sonsuz-seviye.md)
// Saf mantık: zamanı dışarıdan dt ile alır, rastgeleliği dışarıdan Rng ile alır. Bölüm / "oyun bitti" kavramı yoktur.
import type { Musteri, MusteriTipi, SeviyeAyari, Sonuc, TabakParcasi } from "../../types/oyun";
import { degerlendir, type Degerlendirme } from "./degerlendirme";
import { gelirHesapla, siparisFiyati, siparisMaliyeti } from "./ekonomi";
import { sabirHesapla } from "./musteri";
import type { Rng } from "./rng";
import { acilislar, ilerlemeEkle, kilometreTasi, seviyeAyari, seviyeSinirla, type Acilis } from "./seviye";
import { siparisUret } from "./siparis";
import { AYAR, MALZEMELER, SEVIYE, TIPLER } from "./veri";

export interface Oturum {
  seviye: number;
  ilerleme: number; // sonraki seviyeye doğru biriken başarılı müşteri puanı
  toplamMusteri: number; // başarıyla servis edilen toplam müşteri
  toplamCoin: number;
  seri: number; // üst üste başarılı müşteri
  mukemmelSeri: number; // üst üste PERFECT
  musteriler: Musteri[]; // şu an bekleyenler (en fazla sv.eszamanli)
  sonrakiId: number;
  gelmeSayac: number; // sn: sıradaki müşteriye kalan
  yogunKalan: number; // sn: "yoğun saat" kalan süresi (0 = kapalı)
  yogunSayac: number; // yoğun saatten beri servis edilen müşteri
  sv: SeviyeAyari; // geçerli seviyenin parametreleri (seviye değişince yenilenir)
}

export type OturumOlayi =
  | { tur: "geldi"; musteri: Musteri }
  | { tur: "gitti"; musteri: Musteri }
  | { tur: "yogunBitti" };

export interface SeviyeAtlama {
  seviye: number;
  acilanlar: Acilis[];
  kilometre: { baslik: string; alt: string } | null;
}

export interface VerSonucu {
  musteri: Musteri;
  tip: MusteriTipi;
  degerlendirme: Degerlendirme;
  sonuc: Sonuc;
  net: number;
  kazanc: number; // kasaya eklenen coin (negatif olmaz)
  ilerlemeEkle: number;
  seviyeAtladi: SeviyeAtlama[];
  yogunBasladi: boolean;
}

export interface OturumBaslangic {
  seviye?: number;
  ilerleme?: number;
  toplamMusteri?: number;
  toplamCoin?: number;
}

export function yeniOturum(b: OturumBaslangic = {}): Oturum {
  const seviye = seviyeSinirla(b.seviye ?? 1);
  return {
    seviye,
    ilerleme: Math.max(0, b.ilerleme ?? 0),
    toplamMusteri: Math.max(0, b.toplamMusteri ?? 0),
    toplamCoin: Math.max(0, b.toplamCoin ?? 0),
    seri: 0,
    mukemmelSeri: 0,
    musteriler: [],
    sonrakiId: 1,
    gelmeSayac: SEVIYE.ilkMusteriGecikmesi,
    yogunKalan: 0,
    yogunSayac: 0,
    sv: seviyeAyari(seviye),
  };
}

/** Geliştirici modu: doğrudan bir seviyeye geç; ilerleme, müşteriler ve sayaçlar sıfırlanır, her şey o seviyenin parametrelerini alır. */
export function oturumSeviyeAyarla(o: Oturum, seviye: number) {
  o.seviye = seviyeSinirla(seviye);
  o.ilerleme = 0;
  o.musteriler = [];
  o.seri = 0;
  o.mukemmelSeri = 0;
  o.gelmeSayac = SEVIYE.ilkMusteriGecikmesi;
  o.yogunKalan = 0;
  o.yogunSayac = 0;
  o.sv = seviyeAyari(o.seviye);
}

export const sabirOrani = (m: Musteri) => Math.max(0, Math.min(1, m.sabir / m.sabirToplam));

function musteriUret(o: Oturum, rng: Rng): Musteri {
  const tipId = rng.agirlikliSec(o.sv.musteriAgirlik);
  const tip = TIPLER.find((t) => t.id === tipId) as MusteriTipi;
  const siparis = siparisUret(o.sv, MALZEMELER, tip, AYAR, rng);
  const sabirToplam = sabirHesapla(siparis.d, o.seviye, tip);
  return { id: o.sonrakiId++, tip: tip.id, siparis, sabirToplam, sabir: sabirToplam };
}

/** Sıradaki müşteri için bekleme süresi: boş dükkânda kısa, doluyken seviyenin gelme aralığı (yoğun saatte yarısı) */
const gelmeSuresi = (o: Oturum) =>
  o.sv.gelmeAraligi * (o.yogunKalan > 0 ? SEVIYE.yogunSaat.gelmeCarpani : 1);

function dukkanBosaldi(o: Oturum) {
  if (!o.musteriler.length) o.gelmeSayac = Math.min(o.gelmeSayac, SEVIYE.musteriArasi);
}

/** Oturumu dt saniye ilerletir: sabır azalır, sabrı biten gider, boş slotlara yeni müşteri gelir. */
export function oturumIlerlet(o: Oturum, dt: number, rng: Rng): OturumOlayi[] {
  const olay: OturumOlayi[] = [];

  if (o.yogunKalan > 0) {
    o.yogunKalan = Math.max(0, o.yogunKalan - dt);
    if (o.yogunKalan === 0) olay.push({ tur: "yogunBitti" });
  }

  for (const m of [...o.musteriler]) {
    m.sabir -= dt;
    if (m.sabir <= 0) {
      o.musteriler = o.musteriler.filter((x) => x.id !== m.id);
      o.seri = 0;
      o.mukemmelSeri = 0;
      olay.push({ tur: "gitti", musteri: m });
      dukkanBosaldi(o);
    }
  }

  if (o.musteriler.length < o.sv.eszamanli) {
    o.gelmeSayac -= dt;
    if (o.gelmeSayac <= 0) {
      const m = musteriUret(o, rng);
      o.musteriler.push(m);
      o.gelmeSayac = gelmeSuresi(o);
      olay.push({ tur: "geldi", musteri: m });
    }
  }
  return olay;
}

/**
 * Tabağı müşteriye verir. Tabak, bekleyen müşterilerden siparişine EN ÇOK benzeyene gider
 * (eşitlikte sabrı en az kalan). Bekleyen yoksa ya da tabak boşsa null döner ve hiçbir şey değişmez.
 */
export function musteriyeVer(o: Oturum, tabak: TabakParcasi[]): VerSonucu | null {
  if (!tabak.length || !o.musteriler.length) return null;

  let secilen: { m: Musteri; tip: MusteriTipi; d: Degerlendirme } | null = null;
  for (const m of o.musteriler) {
    const tip = TIPLER.find((t) => t.id === m.tip) as MusteriTipi;
    const d = degerlendir(m.siparis.parcalar, tabak, tip.ceza, AYAR, m.siparis.tercih);
    if (!secilen || d.kalite > secilen.d.kalite || (d.kalite === secilen.d.kalite && sabirOrani(m) < sabirOrani(secilen.m))) {
      secilen = { m, tip, d };
    }
  }
  const { m, tip, d } = secilen as NonNullable<typeof secilen>;
  o.musteriler = o.musteriler.filter((x) => x.id !== m.id);

  const sonuc = d.sonuc;
  const basarili = sonuc !== "olmadi";
  let puan = SEVIYE.ilerleme[sonuc];
  if (basarili) {
    o.seri++;
    o.toplamMusteri++;
    if (sonuc === "perfect") {
      o.mukemmelSeri++;
      if (o.mukemmelSeri % SEVIYE.ilerleme.seri.esik === 0) puan += SEVIYE.ilerleme.seri.bonus;
    } else o.mukemmelSeri = 0;
  } else {
    o.seri = 0;
    o.mukemmelSeri = 0;
  }

  const yogun = o.yogunKalan > 0 ? SEVIYE.yogunSaat.kazancCarpani : 1;
  const gelir = gelirHesapla({
    fiyat: siparisFiyati(m.siparis, MALZEMELER),
    sonuc,
    tip,
    sabirOrani: sabirOrani(m),
    combo: Math.max(1, o.seri),
    seviye: o.seviye,
    ayar: AYAR,
  });
  const net = gelir.toplam * yogun - siparisMaliyeti(m.siparis.parcalar, MALZEMELER);
  const kazanc = Math.max(0, Math.round(net));
  o.toplamCoin += kazanc;

  const r = ilerlemeEkle(o.seviye, o.ilerleme, puan);
  o.ilerleme = r.ilerleme;
  const seviyeAtladi: SeviyeAtlama[] = r.atlanan.map((s) => ({
    seviye: s,
    acilanlar: acilislar(s),
    kilometre: kilometreTasi(s),
  }));
  if (r.atlanan.length) {
    o.seviye = r.seviye;
    o.sv = seviyeAyari(o.seviye);
  }

  let yogunBasladi = false;
  if (basarili && o.sv.yogunSaatAcik) {
    o.yogunSayac++;
    if (o.yogunSayac >= SEVIYE.yogunSaat.aralik && o.yogunKalan <= 0) {
      o.yogunSayac = 0;
      o.yogunKalan = SEVIYE.yogunSaat.sure;
      yogunBasladi = true;
    }
  }

  dukkanBosaldi(o);
  return { musteri: m, tip, degerlendirme: d, sonuc, net, kazanc, ilerlemeEkle: puan, seviyeAtladi, yogunBasladi };
}
