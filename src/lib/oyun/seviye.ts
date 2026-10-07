// Sonsuz seviye sistemi: seviye numarasından her şey hesaplanır; seviye dosyası yoktur (docs/sonsuz-seviye.md).
// Zorluk sonsuza kadar büyümez: 0..1 arasında bir doyum eğrisidir ve her parametre kolay uç ↔ zor uç arasında gezinir.
import type { SeviyeAyari } from "../../types/oyun";
import { MALZEMELER, SEVIYE, TIPLER } from "./veri";

const log2 = Math.log2;
const dogrusal = ([kolay, zor]: [number, number], d: number) => kolay + (zor - kolay) * d;

/** Seviyeyi güvenli bir tam sayıya çevirir: NaN → 1, ondalık → aşağı, [1, seviyeSiniri] aralığı */
export function seviyeSinirla(x: number): number {
  if (!Number.isFinite(x)) return x === Infinity ? SEVIYE.seviyeSiniri : 1;
  return Math.min(SEVIYE.seviyeSiniri, Math.max(1, Math.floor(x)));
}

/** Bu seviyeyi geçmek için kaç başarılı müşteri gerekir? Noktalar arası log-seviye ölçeğinde doğrusal, sonrası yavaş artar, tavanı vardır. */
export function gerekenMusteri(seviye: number): number {
  const { noktalar, ileriArtis, tavan } = SEVIYE.gerekenMusteri;
  const L = seviyeSinirla(seviye);
  const [sonL, sonY] = noktalar[noktalar.length - 1];
  let v: number;
  if (L >= sonL) {
    v = sonY + ileriArtis * log2(L / sonL);
  } else {
    let i = 0;
    while (i < noktalar.length - 2 && L >= noktalar[i + 1][0]) i++;
    const [l0, y0] = noktalar[i];
    const [l1, y1] = noktalar[i + 1];
    v = y0 + ((y1 - y0) * (log2(L) - log2(l0))) / (log2(l1) - log2(l0));
  }
  return Math.min(tavan, Math.max(1, Math.floor(v + 1e-9)));
}

/** Normalize zorluk: 0 (seviye 1) → 1'e yaklaşır, asla geçmez. 1 − e^(−(L−1)/ölçek) */
export function zorluk(seviye: number): number {
  return 1 - Math.exp(-(seviyeSinirla(seviye) - 1) / SEVIYE.zorluk.olcek);
}

export const cevirPencereDegeri = (seviye: number) => dogrusal(SEVIYE.egriler.cevirPencere, zorluk(seviye));
export const hamurToleransDegeri = (seviye: number) => dogrusal(SEVIYE.egriler.hamurTolerans, zorluk(seviye));
export const pisirmeHiziDegeri = (seviye: number) => dogrusal(SEVIYE.egriler.pisirmeHizi, zorluk(seviye));
export const sabirCarpaniDegeri = (seviye: number) => dogrusal(SEVIYE.egriler.sabirCarpani, zorluk(seviye));
export const gelmeAraligiDegeri = (seviye: number) => dogrusal(SEVIYE.egriler.gelmeAraligi, zorluk(seviye));

export const mekanikAcik = (id: string, seviye: number) =>
  SEVIYE.mekanikler.some((m) => m.id === id && m.seviye <= seviye);

/** Seviyenin kademesi: seviyesi ≤ L olan en son kademe (son kademeden sonrası plato) */
function kademe(seviye: number) {
  let k = SEVIYE.kademeler[0];
  for (const x of SEVIYE.kademeler) if (x.seviye <= seviye) k = x;
  return k;
}

/** Bir seviyenin bütün parametreleri. Sipariş, müşteri, zamanlayıcı ve açılışlar buradan okunur. */
export function seviyeAyari(seviye: number): SeviyeAyari {
  const L = seviyeSinirla(seviye);
  const d = zorluk(L);
  const k = kademe(L);
  const ozel = dogrusal(SEVIYE.egriler.ozelMusteriCarpani, d);
  const musteriAgirlik: Record<string, number> = {};
  for (const t of TIPLER) if (t.acilis <= L) musteriAgirlik[t.id] = t.id === "normal" ? t.agirlik : t.agirlik * ozel;
  return {
    seviye: L,
    zorluk: d,
    gerekenMusteri: gerekenMusteri(L),
    menu: MALZEMELER.filter((m) => m.kategori !== "krep" && m.acilis <= L).map((m) => m.id),
    krep: k.krep,
    d: k.d,
    tava: k.tava,
    eszamanli: k.eszamanli,
    cevirmeAcik: mekanikAcik("cevirme", L),
    tercihAcik: mekanikAcik("tercih", L),
    yogunSaatAcik: mekanikAcik("yogun-saat", L),
    ipucu: L <= SEVIYE.ipucuSeviyesi,
    cevirPencere: cevirPencereDegeri(L),
    hamurTolerans: hamurToleransDegeri(L),
    pisirmeHizi: pisirmeHiziDegeri(L),
    sabirCarpani: sabirCarpaniDegeri(L),
    gelmeAraligi: gelmeAraligiDegeri(L),
    tercihOlasiligi: dogrusal(SEVIYE.egriler.tercihOlasiligi, d),
    musteriAgirlik,
  };
}

export interface Acilis {
  tur: "malzeme" | "musteri" | "mekanik";
  id: string;
  ad: string;
  ikon: string;
  seviye: number;
}

function tumAcilislar(): Acilis[] {
  return [
    ...MALZEMELER.filter((m) => m.kategori !== "krep").map((m) => ({ tur: "malzeme" as const, id: m.id, ad: m.ad, ikon: m.ikon, seviye: m.acilis })),
    ...TIPLER.filter((t) => t.id !== "normal").map((t) => ({ tur: "musteri" as const, id: t.id, ad: t.ad, ikon: t.ikon, seviye: t.acilis })),
    ...SEVIYE.mekanikler.filter((m) => m.id !== "temel").map((m) => ({ tur: "mekanik" as const, id: m.id, ad: m.ad, ikon: m.ikon, seviye: m.seviye })),
  ];
}

/** Tam bu seviyede açılan yenilikler (seviye atlama bildirimi için) */
export const acilislar = (seviye: number): Acilis[] => tumAcilislar().filter((a) => a.seviye === seviye);

/** Bu seviyeden sonra açılacak en yakın yenilik(ler) */
export function sonrakiAcilis(seviye: number): Acilis[] {
  const hepsi = tumAcilislar().filter((a) => a.seviye > seviye);
  if (!hepsi.length) return [];
  const en = Math.min(...hepsi.map((a) => a.seviye));
  return hepsi.filter((a) => a.seviye === en);
}

export const kilometreTasi = (seviye: number) => SEVIYE.kilometreTaslari.find((k) => k.seviye === seviye) ?? null;

export interface IlerlemeSonucu {
  seviye: number;
  ilerleme: number;
  atlanan: number[]; // atlanan her seviyenin yeni numarası
}

/** İlerleme puanı ekler; gerekirse bir ya da daha fazla seviye atlar, artan puan sonraki seviyeye taşınır. */
export function ilerlemeEkle(seviye: number, ilerleme: number, puan: number): IlerlemeSonucu {
  let s = seviyeSinirla(seviye);
  let i = Math.max(0, ilerleme) + Math.max(0, puan);
  const atlanan: number[] = [];
  while (s < SEVIYE.seviyeSiniri && i >= gerekenMusteri(s) - 1e-9) {
    i -= gerekenMusteri(s);
    s++;
    atlanan.push(s);
  }
  if (s >= SEVIYE.seviyeSiniri) i = 0;
  return { seviye: s, ilerleme: Math.max(0, i), atlanan };
}

/** Büyük sayıları ekrana sığdırır: 12 345 → 12,3B yerine 12.3K gibi (seviye için 100 000'e kadar tam yazılır) */
export function sayiKisalt(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  const a = Math.abs(n);
  if (a < 100000) return String(Math.round(n));
  const birimler: [number, string][] = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [deger, ek] of birimler) {
    if (a >= deger) return `${(n / deger).toFixed(1).replace(/\.0$/, "")}${ek}`;
  }
  return String(Math.round(n));
}
