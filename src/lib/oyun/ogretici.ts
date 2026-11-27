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
  cocuk: "Çocuklar tatlı sipariş verir. Fişteki malzemeleri sırayla ekle.",
  elestirmen: "Eleştirmenin sabrı daha kısa. Fişindeki sırayı izle ve bekletme.",
  vip: "VIP müşteriler daha çok öder ve daha az bekler. Sabır çubuğuna dikkat et.",
};

function tanitim(a: Acilis): OgreticiIpucu {
  const ortak = { id: acilisId(a), ikon: a.ikon, baslik: `${a.ad} açıldı`, sureli: true };
  if (a.tur === "malzeme") return { ...ortak, hedef: malzemeButonu(a.id), metin: "Siparişte sırası geldiğinde bu malzemeye dokun." };
  if (a.tur === "musteri") return { ...ortak, baslik: `Yeni müşteri · ${a.ad}`, hedef: fis(), metin: musteriMetni[a.id] ?? "Yeni müşterinin siparişine ve sabır çubuğuna bak." };
  switch (a.id) {
    case katman: return { ...ortak, hedef: fis(), metin: "Fiş istediğinde aynı tabağa birden fazla krep koy." };
    case "coklu-musteri": return { ...ortak, hedef: tava(1), metin: "Bir krep pişerken sağ tavada ikinciyi hazırla. Müşterilerin sabır çubuklarını izle." };
    case "tercih": return { ...ortak, hedef: fis(), metin: "Fişteki kalınlığa bak, hamuru tavada işaretli çizgiye kadar doldur." };
    case "uc-musteri": return { ...ortak, hedef: fis(), metin: "Üç fiş birikebilir. Sabrı en az kalan müşterinin tarifine öncelik ver." };
    case "ileri-siparis": return { ...ortak, hedef: fis(), metin: "Uzun tariflerde fişteki simgeleri soldan sağa takip et." };
    case "yogun-saat": return { ...ortak, hedef: { tur: "yogun" }, metin: "Yoğun saatte müşteriler daha sık gelir, teslimler daha çok kazandırır." };
    case combo: return { ...ortak, hedef: { tur: "seri" }, metin: "Müşterileri peş peşe memnun ederek ek coin kazan." };
    default: return { ...ortak, hedef: fis(), metin: "Yeni sipariş bilgisi için fişleri kontrol et." };
  }
}

const dokuyor = (durum: TavaOgreticiDurumu | undefined) => durum === "dokuyor" || durum === "birak" || durum === "fazla";

function dokumIpucu(id: string, ikon: string, sira: number, durum: TavaOgreticiDurumu, baslik: string, metin: string): OgreticiIpucu {
  const ortak = { id, ikon, hedef: tava(sira) };
  if (durum === "fazla") return { ...ortak, baslik: "Hamur fazla oldu", metin: "Bırak ve bir sonraki döküşte ölçü yeşil olur olmaz bırak." };
  if (durum === "birak") return { ...ortak, baslik: "Şimdi bırak", metin: "Hamur yeterli. Parmağını ya da fare düğmesini kaldır." };
  return { ...ortak, baslik, metin };
}

export function ogreticiSec(b: OgreticiBaglam): OgreticiIpucu | null {
  const gormedi = (id: string) => !b.gorulen.includes(id);
  if (b.teslimde) {
    return gormedi(teslim) ? { id: teslim, ikon: "🍽️", baslik: "İlk sipariş hazır", metin: "Tabak fişteki tarifle eşleşince müşteriye kendiliğinden gider.", hedef: { tur: "tabak" } } : null;
  }

  const ilkTava = b.tavalar[0];
  if (gormedi(dok) && (ilkTava === "bos" || dokuyor(ilkTava))) return dokumIpucu(dok, "👆", 0, ilkTava, "Hamuru dök", "Tavaya basılı tut. Ölçü yeşile gelince bırak.");
  if (gormedi(cevir) && ilkTava === "cevir") {
    return { id: cevir, ikon: "↑", baslik: "Krebi çevir", metin: "İlk yüz pişti. Tavanın üstünde yukarı kaydır.", hedef: tava(0) };
  }
  if (gormedi(tabak) && ilkTava === "tabaga") {
    return { id: tabak, ikon: "↓", baslik: "Tabağa al", metin: "İki yüz de pişti. Tavanın üstünde aşağı kaydır.", hedef: tava(0) };
  }

  const acilis = acilislar.find((a) => a.seviye <= b.seviye && gormedi(acilisId(a)));
  if (acilis) return tanitim(acilis);

  const malzeme = b.siradaki && acilislar.find((a) => a.tur === "malzeme" && a.id === b.siradaki);
  if (malzeme && gormedi(ogreticiMalzemeId(malzeme.id))) {
    return { id: ogreticiMalzemeId(malzeme.id), ikon: malzeme.ikon, baslik: `${malzeme.ad} ekle`, metin: "Fişte bu malzemenin sırası geldi. Vurgulanan düğmeye dokun.", hedef: malzemeButonu(malzeme.id) };
  }

  const sagTava = b.tavalar[1];
  if (gormedi(ikinciTava) && dokuyor(sagTava)) return dokumIpucu(ikinciTava, "🥞", 1, sagTava, "İkinci tavayı kullan", "Sağ tavada da ölçü yeşile gelince bırak.");

  const tercih = b.hedef?.tercih;
  if (tercih && tercih !== "normal" && gormedi(kalinlik)) {
    const sira = b.tavalar.findIndex(dokuyor);
    const bos = b.tavalar.indexOf("bos");
    if (sira >= 0 || bos >= 0) {
      const i = sira >= 0 ? sira : bos;
      return dokumIpucu(kalinlik, "📏", i, b.tavalar[i], `${tercih === "ince" ? "İnce" : "Kalın"} krep hazırla`, "Tavaya basılı tut, fişin istediği ölçü yeşile gelince bırak.");
    }
  }

  const ozel = b.fisler.find((m) => m.tip !== "normal" && gormedi(musteriId(m.tip)));
  if (ozel) {
    const a = acilislar.find((a) => a.tur === "musteri" && a.id === ozel.tip);
    if (a) return { ...tanitim(a), id: musteriId(a.id), baslik: `${a.ad} siparişi`, hedef: fis(ozel.id) };
  }

  const uzun = b.fisler.find((m) => m.krep > oncekiKrepSiniri || m.parca > oncekiKrepSiniri * 2 - 1);
  if (uzun && b.seviye >= ileriSeviye && gormedi(ileri)) {
    return { id: ileri, ikon: "📜", baslik: "Uzun tarif", metin: "Fişteki simgeleri soldan sağa takip et. İşaretlenen parçalar tabakta.", hedef: fis(uzun.id), sureli: true };
  }

  const kule = b.fisler.find((m) => m.krep > 1);
  if (kule && gormedi(katman)) return { id: katman, ikon: "🥞", baslik: "Krepleri üst üste koy", metin: "Fişte birden çok krep var. Sırayı takip ederek aynı tabağa koy.", hedef: fis(kule.id), sureli: true };
  if (b.fisler.length >= 3 && gormedi(ucFis)) return { id: ucFis, ikon: "👥", baslik: "Üç sipariş bekliyor", metin: "Sabrı en az kalan müşteriye önce servis et.", hedef: fis(), sureli: true };
  if (b.fisler.length >= 2 && gormedi(ikiFis)) return { id: ikiFis, ikon: "👥", baslik: "İki sipariş bekliyor", metin: "Bir fişi tamamla, sonra diğerine geç. İki tavada aynı anda pişirebilirsin.", hedef: fis(), sureli: true };
  if (b.seviye >= AYAR.combo.baslangicSeviye && b.seri >= 2 && gormedi(combo)) return { id: combo, ikon: "🔥", baslik: "Serini koru", metin: "Her başarılı teslim serini sürdürür. Müşteri ayrılırsa seri sıfırlanır.", hedef: { tur: "seri" }, sureli: true };
  if (b.yogunSaat && gormedi(yogun)) return { id: yogun, ikon: "🔥", baslik: "Yoğun saat başladı", metin: "Bekleyenleri iki tavayla yetiştir. Bu sürede siparişler daha çok kazandırır.", hedef: { tur: "yogun" }, sureli: true };
  return null;
}
