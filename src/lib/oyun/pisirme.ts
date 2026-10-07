// Tava durum makinesi: hamur dök → yayıl → 1. yüz → çevir (uçuş) → 2. yüz → tabağa kay (docs/oyun-tasarimi.md §4)
import type { Ayarlar, CevirKalitesi, Kalinlik, PismeBolgesi, TabakParcasi } from "../../types/oyun";
import { hamurDok, hamurSonucu, hamurYay, yeniHamur, type Hamur } from "./hamur";
import { cevirPencereDegeri, mekanikAcik, pisirmeHiziDegeri } from "./seviye";

export type TavaFaz = "bos" | "doku" | "yayil" | "pisir" | "ucus" | "kayma" | "yanik";
export type TavaOlay = "tasti" | "yayildi" | "indi" | "yandi" | "cop" | "tabaga";

export interface Tava {
  faz: TavaFaz;
  yuz: 0 | 1; // şu an pişen yüz
  p: [number, number]; // iki yüzün pişme değeri (1 = ideal)
  t: number; // bu fazda geçen süre
  landT: number; // son inişten beri geçen süre (zıplama animasyonu için)
  hamur: Hamur;
  kalinlik: Kalinlik;
  cevirme: CevirKalitesi | null; // 1. yüzü çevirme sonucu
  egim: number; // iniş eğimi (derece, işaretli)
  kayik: number; // iniş kayması (-1..1)
}

export interface Baglam {
  ayar: Ayarlar;
  seviye: number;
  /** Çevirme (3. seviyeden beri) kapalıyken krep ilk yüzü pişince doğrudan tabağa kayar */
  cevirmeAcik: boolean;
}

export const baglamOlustur = (seviye: number, ayar: Ayarlar): Baglam => ({
  ayar,
  seviye,
  cevirmeAcik: mekanikAcik("cevirme", seviye),
});

export const yeniTava = (): Tava => ({
  faz: "bos",
  yuz: 0,
  p: [0, 0],
  t: 0,
  landT: 99,
  hamur: yeniHamur(),
  kalinlik: "normal",
  cevirme: null,
  egim: 0,
  kayik: 0,
});

export function bolgeBul(p: number, ayar: Ayarlar): PismeBolgesi {
  const b = ayar.bolgeler;
  if (p < b.cig) return "cig";
  if (p < b.az) return "az";
  if (p < b.orta) return "orta";
  if (p < b.iyi) return "iyi";
  if (p < b.fazla) return "fazla";
  return "yanik";
}

/** Seviye yükseldikçe pişme hızlanır (doyuma ulaşır) */
export const hizCarpani = (seviye: number) => pisirmeHiziDegeri(seviye);

/** Çevirme penceresinin genişliği (p birimi); ilk seviyelerde çok geniş, ileride sabit bir tabana yaklaşır */
export const cevirPenceresi = (seviye: number): number => cevirPencereDegeri(seviye);

export function cevirKalitesi(p: number, seviye: number, ayar: Ayarlar): CevirKalitesi {
  const w = cevirPenceresi(seviye);
  const sap = p - 1;
  if (p < ayar.pisirme.kacirP) return "kacti";
  if (Math.abs(sap) <= w / 2) return "mukemmel";
  if (Math.abs(sap) <= w) return "iyi";
  return sap < 0 ? "erken" : "gec";
}

/** Bir yüzün 0..1 puanı: mükemmel pencerede 1, uzaklaştıkça doğrusal düşer */
export function yuzPuani(p: number, seviye: number, ayar: Ayarlar): number {
  const w = cevirPenceresi(seviye);
  const uzak = Math.max(0, Math.abs(p - 1) - w / 2);
  return Math.max(0, 1 - uzak / (w * ayar.pisirme.puanDusus));
}

/** Tabağa konacak krep parçası; pişme bölgesi iki yüzün puanından ve kalınlıktan çıkar. */
export function krepParcasi(p: [number, number], kalinlik: Kalinlik, seviye: number, ayar: Ayarlar): TabakParcasi {
  const k = ((yuzPuani(p[0], seviye, ayar) + yuzPuani(p[1], seviye, ayar)) / 2) * ayar.pisirme.kalinKalite[kalinlik];
  const pisme: PismeBolgesi = k >= 0.8 ? "iyi" : k >= 0.5 ? "orta" : p[0] + p[1] < 2 ? "cig" : "fazla";
  return { malzeme: "krep", pisme, kalinlik };
}

/** Dokunma başladı: tava boşsa hamur akmaya başlar */
export function tavaDokBasla(t: Tava): boolean {
  if (t.faz !== "bos") return false;
  Object.assign(t, yeniTava(), { faz: "doku" as TavaFaz });
  return true;
}

/** Basılıyken parmak hareketi hamuru yayar */
export function tavaHareket(t: Tava, px: number, c: Baglam) {
  if (t.faz === "doku") hamurYay(t.hamur, px, c.ayar);
}

/** Parmak kalktı: hamur durur ve yayılır. Kazara dokunuşta (çok az hamur) tava boşalır. */
export function tavaBirak(t: Tava, c: Baglam): { kalinlik: Kalinlik; mukemmel: boolean } | null {
  if (t.faz !== "doku") return null;
  if (t.hamur.miktar < c.ayar.hamur.min) {
    t.faz = "bos";
    return null;
  }
  const s = hamurSonucu(t.hamur.miktar, c.seviye);
  t.kalinlik = s.kalinlik;
  t.faz = "yayil";
  t.t = 0;
  return s;
}

/** Yukarı swipe: 1. yüz pişiyorsa çevirir. Havadayken/boşken/yanıkken ya da çevirme kapalıyken null döner. */
export function tavaCevir(t: Tava, c: Baglam): CevirKalitesi | null {
  if (t.faz !== "pisir" || t.yuz !== 0 || !c.cevirmeAcik) return null;
  const k = cevirKalitesi(t.p[0], c.seviye, c.ayar);
  const yon = t.p[0] < 1 ? -1 : 1;
  t.cevirme = k;
  t.egim = k === "mukemmel" ? 0 : k === "iyi" ? 4 * yon : k === "kacti" ? 20 : 11 * yon;
  t.kayik = k === "mukemmel" ? 0 : k === "iyi" ? 0.08 * yon : k === "kacti" ? 0.8 : 0.3 * yon;
  t.faz = "ucus";
  t.t = 0;
  return k;
}

/** Krep tabağa kaydırılabilir mi? 2. yüz pişiyorsa; çevirme kapalıyken 1. yüz pişiyorsa. */
export const servisEdilebilir = (t: Tava, c: Baglam): boolean =>
  t.faz === "pisir" && (t.yuz === 1 || !c.cevirmeAcik);

/** Aşağı swipe: krepi tabağa kaydırır; tabağa konacak parçayı döner. */
export function tavaServis(t: Tava, c: Baglam): TabakParcasi | null {
  if (!servisEdilebilir(t, c)) return null;
  const p: [number, number] = t.yuz === 1 ? t.p : [t.p[0], t.p[0]];
  t.faz = "kayma";
  t.t = 0;
  return krepParcasi(p, t.kalinlik, c.seviye, c.ayar);
}

/** Tavayı dt saniye ilerletir; olan olayları döner (ses, parçacık, tabağa konma için). */
export function tavaIlerlet(t: Tava, dt: number, c: Baglam): TavaOlay[] {
  const { ayar } = c;
  const pis = ayar.pisirme;
  const olay: TavaOlay[] = [];
  t.t += dt;
  t.landT += dt;
  switch (t.faz) {
    case "doku":
      if (hamurDok(t.hamur, dt, ayar)) {
        tavaBirak(t, c);
        olay.push("tasti");
      }
      break;
    case "yayil":
      t.hamur.yay = Math.min(1, t.hamur.yay + dt / ayar.hamur.yayilSn);
      if (t.hamur.yay >= 1) {
        t.faz = "pisir";
        t.t = 0;
        t.yuz = 0;
        olay.push("yayildi");
      }
      break;
    case "pisir": {
      const hiz = hizCarpani(c.seviye) * pis.kalinHiz[t.kalinlik] * (t.yuz === 1 ? pis.ikinciYuzHiz : 1);
      t.p[t.yuz] += (dt / pis.yuzSuresi) * hiz;
      if (t.p[t.yuz] > pis.yanikP) {
        t.faz = "yanik";
        t.t = 0;
        olay.push("yandi");
      }
      break;
    }
    case "ucus":
      if (t.t >= pis.anticipSn + pis.ucusSn) {
        t.faz = "pisir";
        t.t = 0;
        t.yuz = 1;
        t.p[1] = 0;
        t.landT = 0;
        olay.push("indi");
      }
      break;
    case "kayma":
      if (t.t >= pis.kaymaSn) {
        Object.assign(t, yeniTava());
        olay.push("tabaga");
      }
      break;
    case "yanik":
      if (t.t >= ayar.yanikBekleme) {
        Object.assign(t, yeniTava());
        olay.push("cop");
      }
      break;
  }
  return olay;
}
