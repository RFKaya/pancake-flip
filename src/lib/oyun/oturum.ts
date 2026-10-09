// Sonsuz oyun oturumu: müşteri slotları, sabır, ilerleme, seviye atlama (docs/sonsuz-seviye.md)
// Saf mantık: zamanı dışarıdan dt ile alır, rastgeleliği dışarıdan Rng ile alır. Bölüm / "oyun bitti" kavramı yoktur.
import type { Acilis, Musteri, MusteriTipi, SeviyeAyari, Sonuc, TabakParcasi } from "../types";
import { degerlendir, type Degerlendirme } from "./degerlendirme";
import { gelirHesapla, siparisFiyati, siparisMaliyeti } from "./ekonomi";
import { sabirHesapla } from "./musteri";
import type { Rng } from "./rng";
import { acilislar, ilerlemeEkle, kilometreTasi, seviyeAyari, seviyeSinirla } from "./seviye";
import { siparisUret } from "./siparis";
import { AYAR, MALZEMELER, SEVIYE, TIPLER } from "./veri";

export interface Oturum {
  seviye: number;
  ilerleme: number; // sonraki seviyeye doğru biriken başarılı müşteri puanı
  toplamMusteri: number; // başarıyla servis edilen toplam müşteri
  toplamCoin: number;
  seri: number; // üst üste başarılı müşteri
  mukemmelSeri: number; // üst üste PERFECT
  enIyiSeri: number; // bütün oyunlarda ulaşılan en uzun seri (rekor; kayda yazılır)
  toplamMukemmel: number; // PERFECT servis edilen toplam müşteri
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
  enIyiSeri?: number;
  toplamMukemmel?: number;
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
    enIyiSeri: Math.max(0, b.enIyiSeri ?? 0),
    toplamMukemmel: Math.max(0, b.toplamMukemmel ?? 0),
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

/** Tabaktaki i. parça, siparişin i. parçasını tam karşılıyor mu? (malzeme; krepte pişme ve kalınlık da) */
function parcaUyar(m: Musteri, parca: TabakParcasi, i: number): boolean {
  if (parca.malzeme !== m.siparis.parcalar[i]) return false;
  if (parca.malzeme !== "krep") return true;
  return parca.pisme === "iyi" && (parca.kalinlik ?? "normal") === (m.siparis.tercih ?? "normal");
}

/** Tabak bu müşterinin siparişinin geçerli bir başlangıcı mı (henüz eksik olabilir)? */
const onekUyar = (m: Musteri, tabak: TabakParcasi[]) =>
  tabak.length <= m.siparis.parcalar.length && tabak.every((p, i) => parcaUyar(m, p, i));

export type TabakDurumu =
  | { durum: "bos" }
  | { durum: "hazirlaniyor" } // bir siparişin doğru başlangıcı (ya da bekleyen müşteri yok)
  | { durum: "dogru"; musteri: Musteri } // bir siparişin birebir aynısı → otomatik servis
  | { durum: "yanlis"; musteri: Musteri; degerlendirme: Degerlendirme }; // hiçbir siparişe dönüşemez → atılmalı

/**
 * Temel tarif kuralı (docs/sonsuz-seviye.md §1.1): tabak yalnızca bir siparişin BİREBİR aynısıysa doğrudur —
 * kat sayısı, malzemeler, sıra, her krebin pişmiş olması ve istenen kalınlık. Eksik / fazla / yanlış hiçbir şey kabul edilmez.
 */
export function tabakDurumu(o: Oturum, tabak: TabakParcasi[]): TabakDurumu {
  if (!tabak.length) return { durum: "bos" };
  const tam = o.musteriler
    .filter((m) => tabak.length === m.siparis.parcalar.length && onekUyar(m, tabak))
    .sort((a, b) => sabirOrani(a) - sabirOrani(b));
  if (tam.length) return { durum: "dogru", musteri: tam[0] };
  if (!o.musteriler.length || o.musteriler.some((m) => onekUyar(m, tabak))) return { durum: "hazirlaniyor" };
  // Yanlış: neden yazısı için tabağa en yakın sipariş
  let en: { m: Musteri; d: Degerlendirme } | null = null;
  for (const m of o.musteriler) {
    const d = degerlendir(m.siparis.parcalar, tabak, 1, AYAR, m.siparis.tercih);
    if (!en || d.kalite > en.d.kalite) en = { m, d };
  }
  const { m, d } = en as NonNullable<typeof en>;
  return { durum: "yanlis", musteri: m, degerlendirme: d };
}

/**
 * Tabağı, siparişi BİREBİR karşılanan müşteriye verir (eşitlikte sabrı en az kalan). Tabak hiçbir siparişle
 * birebir aynı değilse (yanlış ya da eksik) null döner ve HİÇBİR ŞEY değişmez: müşteri kalır, ilerleme / coin artmaz.
 * Krepler kusursuz (döküm + çevirme) ise PERFECT, değilse GREAT.
 */
export function musteriyeVer(o: Oturum, tabak: TabakParcasi[]): VerSonucu | null {
  const durum = tabakDurumu(o, tabak);
  if (durum.durum !== "dogru") return null;
  const m = durum.musteri;
  const tip = TIPLER.find((t) => t.id === m.tip) as MusteriTipi;
  const d = degerlendir(m.siparis.parcalar, tabak, tip.ceza, AYAR, m.siparis.tercih);
  o.musteriler = o.musteriler.filter((x) => x.id !== m.id);

  const sonuc: Sonuc = tabak.every((p) => p.malzeme !== "krep" || p.usta) ? "perfect" : "great";
  let puan = SEVIYE.ilerleme[sonuc];
  o.seri++;
  o.enIyiSeri = Math.max(o.enIyiSeri, o.seri);
  o.toplamMusteri++;
  if (sonuc === "perfect") {
    o.toplamMukemmel++;
    o.mukemmelSeri++;
    if (o.mukemmelSeri % SEVIYE.ilerleme.seri.esik === 0) puan += SEVIYE.ilerleme.seri.bonus;
  } else o.mukemmelSeri = 0;

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
  if (o.sv.yogunSaatAcik) {
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
