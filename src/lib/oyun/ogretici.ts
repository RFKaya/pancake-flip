import type { Acilis, IlerlemeVerisi, OgreticiBaglam, OgreticiIpucu, TavaOgreticiDurumu } from "../types";
import { tumAcilislar } from "./seviye";
import { AYAR, SEVIYE } from "./veri";

export const OGRETICI = {
  dok: "ilk-dokum",
  cevir: "ilk-cevirme",
  tabak: "ilk-tabak",
  teslim: "ilk-teslim",
  katman: "katmanli-tarif",
  ikinciTava: "ikinci-tava",
  ikiFis: "iki-fis",
  kalinlik: "kalinlik",
  ucFis: "uc-fis",
  ileri: "ileri-tarif",
  yogun: "yogun-saat",
  combo: "combo",
} as const;

const { dok, cevir, tabak, teslim, katman, ikinciTava, ikiFis, kalinlik, ucFis, ileri, yogun, combo } = OGRETICI;
const temel = [dok, cevir, tabak, teslim];
const tava = (sira: number) => ({ tur: "tava", sira } as const);
const fis = (musteri?: number) => ({ tur: "fis", musteri } as const);
const malzemeButonu = (id: string) => ({ tur: "malzeme", id } as const);
const ilkKatman = SEVIYE.kademeler.find((k) => k.krep[1] > 1);
const ileriSeviye = SEVIYE.mekanikler.find((a) => a.id === "ileri-siparis")?.seviye ?? Infinity;
const oncekiKrepSiniri = SEVIYE.kademeler.filter((k) => k.seviye < ileriSeviye).at(-1)?.krep[1] ?? Infinity;

const acilislar = [
  ...(ilkKatman ? [{ tur: "mekanik", id: katman, ad: "Birden fazla krep", ikon: "🥞", seviye: ilkKatman.seviye } as const] : []),
  ...tumAcilislar(),
  { tur: "mekanik", id: combo, ad: "Seri bonusu", ikon: "🔥", seviye: AYAR.combo.baslangicSeviye } as const,
].sort((a, b) => a.seviye - b.seviye);

export const ogreticiMalzemeId = (id: string) => `malzeme:${id}`;
const musteriId = (id: string) => `musteri:${id}`;
const acilisId = (a: Acilis) => `acilis:${a.tur}:${a.id}`;

const mekanikAdimlari: Record<string, string[]> = {
  [katman]: [katman],
  "coklu-musteri": [ikinciTava, ikiFis],
  tercih: [kalinlik],
  "uc-musteri": [ucFis],
  "ileri-siparis": [ileri],
  "yogun-saat": [yogun],
  [combo]: [combo],
};

function acilisAdimlari(a: Acilis): string[] {
  if (a.tur === "malzeme") return [ogreticiMalzemeId(a.id)];
  if (a.tur === "musteri") return [musteriId(a.id)];
  return mekanikAdimlari[a.id] ?? [];
}

const gecerliKimlikler = new Set([
  ...temel,
  ...acilislar.flatMap((a) => [acilisId(a), ...acilisAdimlari(a)]),
]);
const gorulenAcilislar = (seviye: number) =>
  acilislar.filter((a) => a.seviye <= seviye).flatMap((a) => [acilisId(a), ...acilisAdimlari(a)]);

export function ogreticiKaydiCoz(deger: unknown): string[] | undefined {
  if (!Array.isArray(deger)) return undefined;
  return [...new Set(deger.filter((id): id is string => typeof id === "string" && gecerliKimlikler.has(id)))];
}

/** Eski sürümde tamamlanma listesi yoksa oyuncuya geçmiş seviyelerin derslerini tekrar açma. */
export function ogreticiGecmisi(kayit: IlerlemeVerisi): string[] {
  if (kayit.ogretici) return kayit.ogretici;
  const seviye = kayit.enYuksekSeviye;
  return [
    ...(kayit.toplamMusteri > 0 || seviye > 1 ? temel : []),
    ...gorulenAcilislar(seviye),
  ];
}

/** Seviye testinde önceki dersleri atla; seçilen seviyenin derslerini yeniden göster. */
export function testOgreticiGecmisi(seviye: number): string[] {
  return [
    ...(seviye > 1 ? temel : []),
    ...gorulenAcilislar(seviye - 1),
  ];
}

const musteriMetni: Record<string, string> = {
  cocuk: "Tatlı ister. Fişe bak.",
  elestirmen: "Sabrı kısa. Bekletme.",
  vip: "İyi öder, az bekler.",
};

function tanitim(a: Acilis): OgreticiIpucu {
  const ortak = { id: acilisId(a), ikon: a.ikon, baslik: `${a.ad} açıldı`, sureli: true };
  if (a.tur === "malzeme") return { ...ortak, hedef: malzemeButonu(a.id), metin: "Fişte sırası gelince ekle." };
  if (a.tur === "musteri") return { ...ortak, baslik: `Yeni müşteri · ${a.ad}`, hedef: fis(), metin: musteriMetni[a.id] ?? "Fişe ve sabır çubuğuna bak." };
  switch (a.id) {
    case katman: return { ...ortak, hedef: fis(), metin: "Krepleri aynı tabağa koy." };
    case "coklu-musteri": return { ...ortak, hedef: tava(1), metin: "İki tavada aynı anda pişir." };
    case "tercih": return { ...ortak, hedef: fis(), metin: "Fişteki kalınlığı tuttur." };
    case "uc-musteri": return { ...ortak, hedef: fis(), metin: "En az sabrı kalana öncelik ver." };
    case "ileri-siparis": return { ...ortak, hedef: fis(), metin: "Fişi soldan sağa takip et." };
    case "yogun-saat": return { ...ortak, hedef: { tur: "yogun" }, metin: "Daha çok müşteri, daha çok kazanç." };
    case combo: return { ...ortak, hedef: { tur: "seri" }, metin: "Peş peşe servisle ek coin kazan." };
    default: return { ...ortak, hedef: fis(), metin: "Yeni siparişler için fişe bak." };
  }
}

const dokuyor = (durum: TavaOgreticiDurumu | undefined) => durum === "dokuyor" || durum === "birak" || durum === "fazla";

function dokumIpucu(id: string, ikon: string, sira: number, durum: TavaOgreticiDurumu, baslik: string, metin: string): OgreticiIpucu {
  const ortak = { id, ikon, hedef: tava(sira) };
  if (durum === "fazla") return { ...ortak, baslik: "Fazla hamur", metin: "Bırak ve tekrar dene.", yavaslat: false };
  if (durum === "birak") return { ...ortak, baslik: "Şimdi bırak", metin: "Ölçü tamam." };
  return { ...ortak, baslik, metin, yavaslat: false };
}

export function ogreticiSec(b: OgreticiBaglam): OgreticiIpucu | null {
  const gormedi = (id: string) => !b.gorulen.includes(id);
  if (b.teslimde) {
    return b.seviyeOgretildi ? null : { id: teslim, ikon: "🍽️", baslik: "Sipariş hazır", metin: "Tabak müşteriye gidiyor.", hedef: { tur: "tabak" } };
  }

  if (!b.seviyeOgretildi) {
    const cevrilecek = b.tavalar.indexOf("cevir");
    if (cevrilecek >= 0) return { id: cevir, ikon: "↑", baslik: "Krep pişti", metin: "Arkasını pişirmek için yukarı kaydır.", hedef: tava(cevrilecek) };
    const hazir = b.tavalar.indexOf("tabaga");
    if (hazir >= 0) return { id: tabak, ikon: "↓", baslik: "Tabağa al", metin: "Aşağı kaydır.", hedef: tava(hazir) };
  }

  const dokulen = b.tavalar.findIndex(dokuyor);
  const acilis = dokulen < 0 && acilislar.find((a) => a.seviye <= b.seviye && gormedi(acilisId(a)));
  if (acilis) return tanitim(acilis);

  const malzeme = b.siradaki && acilislar.find((a) => a.tur === "malzeme" && a.id === b.siradaki);
  if (dokulen < 0 && malzeme && gormedi(ogreticiMalzemeId(malzeme.id))) {
    return { id: ogreticiMalzemeId(malzeme.id), ikon: malzeme.ikon, baslik: `${malzeme.ad} ekle`, metin: "Parlayan düğmeye dokun.", hedef: malzemeButonu(malzeme.id) };
  }

  if (!b.seviyeOgretildi && dokulen >= 0) return dokumIpucu(dok, "👆", dokulen, b.tavalar[dokulen], "Hamuru dök", "Ölçü yeşil olana dek basılı tut.");

  const sagTava = b.tavalar[1];
  if (gormedi(ikinciTava) && dokuyor(sagTava)) return dokumIpucu(ikinciTava, "🥞", 1, sagTava, "İkinci tava", "Ölçü yeşile gelince bırak.");

  const tercih = b.hedef?.tercih;
  if (tercih && tercih !== "normal" && gormedi(kalinlik)) {
    const sira = b.tavalar.findIndex(dokuyor);
    const bos = b.tavalar.indexOf("bos");
    if (sira >= 0 || bos >= 0) {
      const i = sira >= 0 ? sira : bos;
      return dokumIpucu(kalinlik, "📏", i, b.tavalar[i], `${tercih === "ince" ? "İnce" : "Kalın"} krep hazırla`, "İşaretli ölçüyü tuttur.");
    }
  }

  const ozel = b.fisler.find((m) => m.tip !== "normal" && gormedi(musteriId(m.tip)));
  if (ozel) {
    const a = acilislar.find((a) => a.tur === "musteri" && a.id === ozel.tip);
    if (a) return { ...tanitim(a), id: musteriId(a.id), baslik: `${a.ad} siparişi`, hedef: fis(ozel.id) };
  }

  const uzun = b.fisler.find((m) => m.krep > oncekiKrepSiniri || m.parca > oncekiKrepSiniri * 2 - 1);
  if (uzun && b.seviye >= ileriSeviye && gormedi(ileri)) {
    return { id: ileri, ikon: "📜", baslik: "Uzun tarif", metin: "Fişi soldan sağa takip et.", hedef: fis(uzun.id), sureli: true };
  }

  const kule = b.fisler.find((m) => m.krep > 1);
  if (kule && gormedi(katman)) return { id: katman, ikon: "🥞", baslik: "Krepleri üst üste koy", metin: "Fişteki sırayı izle.", hedef: fis(kule.id), sureli: true };
  if (b.fisler.length >= 3 && gormedi(ucFis)) return { id: ucFis, ikon: "👥", baslik: "Üç sipariş bekliyor", metin: "Sabrı en az kalan müşteriye önce servis et.", hedef: fis(), sureli: true };
  if (b.fisler.length >= 2 && gormedi(ikiFis)) return { id: ikiFis, ikon: "👥", baslik: "İki sipariş bekliyor", metin: "Önce bir fişi tamamla.", hedef: fis(), sureli: true };
  if (b.seviye >= AYAR.combo.baslangicSeviye && b.seri >= 2 && gormedi(combo)) return { id: combo, ikon: "🔥", baslik: "Serini koru", metin: "Müşteri giderse seri sıfırlanır.", hedef: { tur: "seri" }, sureli: true };
  if (b.yogunSaat && gormedi(yogun)) return { id: yogun, ikon: "🔥", baslik: "Yoğun saat başladı", metin: "Teslimler daha çok kazandırır.", hedef: { tur: "yogun" }, sureli: true };
  const bos = b.tavalar.indexOf("bos");
  if (!b.seviyeOgretildi && b.krepBekleniyor && bos >= 0 && !b.tavalar.some((durum) => durum !== "bos")) return dokumIpucu(dok, "👆", bos, "bos", "Hamuru dök", "Tavaya basılı tut.");
  return null;
}
