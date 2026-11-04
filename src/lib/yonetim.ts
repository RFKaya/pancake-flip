// Yönetim paneli hesapları: saf fonksiyonlar (bileşenler yalnızca gösterir). Oyuncu verisi native.ts'ten, içerik JSON'dan gelir.
import type { YonetimMetni } from "./admin-sozluk";
import { siparisFiyati } from "./oyun/ekonomi";
import { sabirHesapla } from "./oyun/musteri";
import { rngOlustur } from "./oyun/rng";
import { seviyeAyari, tumAcilislar } from "./oyun/seviye";
import { siparisUret } from "./oyun/siparis";
import { AYAR, MALZEMELER, SEVIYE, TIPLER } from "./oyun/veri";
import type {
  Ayarlar,
  EgriSatiri,
  FormHatalari,
  IcerikKapsami,
  IcerikOzeti,
  IcerikSurumu,
  Kategori,
  Malzeme,
  MusteriTipi,
  NativeHata,
  OrnekSiparis,
  PanelOzeti,
  SayiAlani,
  SeviyeDurak,
  YonetimOturumu,
} from "./types";

/** Oyun içeriğinin sayıları (src/lib/veri/*.json); tarayıcıda da çalışır */
export function icerikOzeti(): IcerikOzeti {
  return {
    malzeme: MALZEMELER.length,
    musteriTipi: TIPLER.length,
    mekanik: SEVIYE.mekanikler.length,
    kilometreTasi: SEVIYE.kilometreTaslari.length,
    seviyeSiniri: SEVIYE.seviyeSiniri,
  };
}

/** Dağılım çubuklarının genişliği: en kalabalık aralık %100, boş aralık %0 */
export function dagilimYuzdeleri(dagilim: PanelOzeti["dagilim"]): number[] {
  const enCok = Math.max(0, ...dagilim.map((d) => d.sayi));
  return dagilim.map((d) => (enCok > 0 ? Math.round((d.sayi / enCok) * 100) : 0));
}

/** 0–1 oranını "%37" biçiminde yazar */
export const yuzdeYaz = (oran: number) => `%${Math.round(oran * 100)}`;

/** Seviyeyi tam sayı ve binlik ayraçla yazar; değer yoksa "—" */
export const seviyeYaz = (n: number | null) => (n === null ? "—" : Math.round(n).toLocaleString("tr-TR"));

/** Oturumdaki kullanıcının "Eylem:Kaynak" izni var mı ("admin" rolü her izni geçer; arka uç yine kendisi denetler) */
export function izinVar(oturum: YonetimOturumu | null, izin: string): boolean {
  return oturum !== null && (oturum.superAdmin || oturum.permissions.includes(izin));
}

/** Malzeme kategorileri (types/malzeme.ts → Kategori), listede ve formda bu sırayla */
export const KATEGORILER: Kategori[] = ["krep", "dolgu", "sos", "topping"];

/** Malzeme kabı için seçilebilecek renk değişkenleri (app.css); oyundaki malzemelerin kullandıkları ilk sırada */
export const RENK_DEGISKENLERI = [...new Set([...MALZEMELER.map((x) => x.renkDegiskeni), "--renk-ana", "--renk-logo", "--vurgu", "--basari", "--yazi"])];

/** Malzemenin siparişe net katkısı: değer − maliyet (0 ya da eksi ise malzeme zarar ettirir) */
export const malzemeNeti = (x: Pick<Malzeme, "deger" | "maliyet">) => x.deger - x.maliyet;

const icinde = (metin: string, aranan: string) => metin.toLocaleLowerCase("tr-TR").includes(aranan);

/** Malzemeleri arama metnine (id ya da ad) ve kategoriye göre süzer; açılış seviyesine göre sıralar */
export function malzemeSuz(liste: Malzeme[], arama: string, kategori: Kategori | "hepsi"): Malzeme[] {
  const a = arama.trim().toLocaleLowerCase("tr-TR");
  return liste
    .filter((x) => (kategori === "hepsi" || x.kategori === kategori) && (a === "" || icinde(x.id, a) || icinde(x.ad, a)))
    .sort((x, y) => x.acilis - y.acilis || x.ad.localeCompare(y.ad, "tr"));
}

/** Müşteri tiplerini arama metnine göre süzer; açılış seviyesine göre sıralar */
export function musteriTipiSuz(liste: MusteriTipi[], arama: string): MusteriTipi[] {
  const a = arama.trim().toLocaleLowerCase("tr-TR");
  return liste.filter((x) => a === "" || icinde(x.id, a) || icinde(x.ad, a)).sort((x, y) => x.acilis - y.acilis);
}

/** Kimlik biçimi: küçük harf, rakam ve tire (adreslerde ve siparişlerde kullanılır: "cilek-sosu") */
export const kimlikGecerli = (id: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);

const tamSayiMi = (n: unknown, enAz: number) => typeof n === "number" && Number.isInteger(n) && n >= enAz;
const sayiMi = (n: unknown, enAz: number) => typeof n === "number" && Number.isFinite(n) && n >= enAz;

function kimlikDenetle(h: FormHatalari, id: string, yeni: boolean, mevcutIdler: string[], m: YonetimMetni) {
  if (!yeni) return;
  if (!kimlikGecerli(id)) h.id = m.form.kimlikBicimi;
  else if (mevcutIdler.includes(id)) h.id = m.form.kimlikVar;
}

/** Malzeme formunu denetler (arka uç yalnız tür ve zorunluluğa bakar; bu kurallar oyunun beklediği değerlerdir) */
export function malzemeDogrula(x: Malzeme, yeni: boolean, mevcutIdler: string[], m: YonetimMetni): FormHatalari {
  const h: FormHatalari = {};
  kimlikDenetle(h, x.id, yeni, mevcutIdler, m);
  if (x.ad.trim() === "") h.ad = m.form.zorunlu;
  if (!KATEGORILER.includes(x.kategori)) h.kategori = m.form.zorunlu;
  if (!tamSayiMi(x.acilis, 1)) h.acilis = m.form.enAzBirTamSayi;
  if (!tamSayiMi(x.maliyet, 0)) h.maliyet = m.form.sifirVeUstuTamSayi;
  if (!tamSayiMi(x.deger, 0)) h.deger = m.form.sifirVeUstuTamSayi;
  if (x.ikon.trim() === "") h.ikon = m.form.zorunlu;
  if (!x.renkDegiskeni.startsWith("--")) h.renkDegiskeni = m.form.zorunlu;
  return h;
}

/** Müşteri tipi formunu denetler */
export function musteriTipiDogrula(x: MusteriTipi, yeni: boolean, mevcutIdler: string[], m: YonetimMetni): FormHatalari {
  const h: FormHatalari = {};
  kimlikDenetle(h, x.id, yeni, mevcutIdler, m);
  if (x.ad.trim() === "") h.ad = m.form.zorunlu;
  if (x.ikon.trim() === "") h.ikon = m.form.zorunlu;
  if (!tamSayiMi(x.acilis, 1)) h.acilis = m.form.enAzBirTamSayi;
  for (const alan of ["agirlik", "odeme", "bahsis", "ceza"] as const) if (!sayiMi(x[alan], 0)) h[alan] = m.form.sifirVeUstuSayi;
  if (!sayiMi(x.sabir, 0) || x.sabir === 0) h.sabir = m.form.sifirdanBuyuk;
  if (!tamSayiMi(x.dKaydirma, 0)) h.dKaydirma = m.form.sifirVeUstuTamSayi;
  // Arka uç boş isteğe bağlı alanı null döndürür; null da "sınır yok" demektir
  if (x.dMax != null && !tamSayiMi(x.dMax, 1)) h.dMax = m.form.enAzBirTamSayi;
  return h;
}

// ---- Seviye eğrisi, kilometre taşları ve simülatör: oyunun kendi kurallarıyla (src/lib/oyun) hesaplanır ----

/** Eğri tablosunda gösterilen seviyeler: başta sık, sonra seyrek; seviye sınırını geçmez */
export const ornekSeviyeler = () =>
  [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 50, 75, 100, 250, 500, 1000, 10000, 1e6, 1e9].filter((l) => l <= SEVIYE.seviyeSiniri);

/** Seviye eğrisi tablosu: her örnek seviyede oyunun kullandığı değerler */
export function egriSatirlari(seviyeler = ornekSeviyeler()): EgriSatiri[] {
  return seviyeler.map((l) => {
    const sv = seviyeAyari(l);
    return {
      seviye: sv.seviye,
      gerekenMusteri: sv.gerekenMusteri,
      zorluk: sv.zorluk,
      cevirPencere: sv.cevirPencere,
      hamurTolerans: sv.hamurTolerans,
      sabirCarpani: sv.sabirCarpani,
      gelmeAraligi: sv.gelmeAraligi,
      tava: sv.tava,
      eszamanli: sv.eszamanli,
    };
  });
}

/** Seviye seviye zaman çizelgesi: kilometre taşları ve açılışlar, seviyeye göre sıralı */
export function seviyeDuraklari(): SeviyeDurak[] {
  const duraklar = new Map<number, SeviyeDurak>();
  const durak = (seviye: number) => {
    if (!duraklar.has(seviye)) duraklar.set(seviye, { seviye, kilometreTasi: null, acilislar: [] });
    return duraklar.get(seviye) as SeviyeDurak;
  };
  for (const k of SEVIYE.kilometreTaslari) durak(k.seviye).kilometreTasi = { baslik: k.baslik, alt: k.alt };
  for (const a of tumAcilislar()) durak(a.seviye).acilislar.push(a);
  return [...duraklar.values()].sort((a, b) => a.seviye - b.seviye);
}

/** Simülatör: bu seviyede açık her müşteri tipi için tohumla tekrarlanabilir bir örnek sipariş */
export function ornekSiparisler(seviye: number, tohum: number): OrnekSiparis[] {
  const sv = seviyeAyari(seviye);
  const rng = rngOlustur(tohum);
  return TIPLER.filter((t) => t.acilis <= sv.seviye).map((tip) => {
    const siparis = siparisUret(sv, MALZEMELER, tip, AYAR, rng);
    return { tip, siparis, fiyat: siparisFiyati(siparis, MALZEMELER), sabir: sabirHesapla(siparis.d, sv.seviye, tip) };
  });
}

// ---- Denge ayarları ve sürümler ----

/** Nesnedeki bütün sayı alanları (iç içe nesneler dahil, listeler hariç), noktalı yol sırasıyla */
export function sayiAlanlari(nesne: unknown, onEk = ""): SayiAlani[] {
  if (typeof nesne !== "object" || nesne === null || Array.isArray(nesne)) return [];
  return Object.entries(nesne).flatMap(([k, v]) => {
    const yol = onEk ? `${onEk}.${k}` : k;
    if (typeof v === "number") return [{ yol, deger: v }];
    return sayiAlanlari(v, yol);
  });
}

/** Sayı alanlarını yolun ilk parçasına göre gruplar ("kalite.perfect" → "kalite"); iç içe olmayan alanlar "" grubunda toplanır; sıra korunur */
export function alanGruplari(alanlar: SayiAlani[]): [string, SayiAlani[]][] {
  const gruplar = new Map<string, SayiAlani[]>();
  for (const a of alanlar) {
    const grup = a.yol.includes(".") ? a.yol.split(".")[0] : "";
    gruplar.set(grup, [...(gruplar.get(grup) ?? []), a]);
  }
  return [...gruplar.entries()];
}

/** Noktalı yoldaki sayıyı değiştirilmiş yeni bir kopya döndürür (asıl nesne değişmez) */
export function yolaYaz<T>(nesne: T, yol: string, deger: number): T {
  const kopya = structuredClone(nesne) as Record<string, unknown>;
  const parcalar = yol.split(".");
  let hedef = kopya;
  for (const p of parcalar.slice(0, -1)) hedef = hedef[p] as Record<string, unknown>;
  hedef[parcalar[parcalar.length - 1]] = deger;
  return kopya as T;
}

/** Denge ayarlarını denetler: her sayı sonlu ve 0 ya da büyük; kalite eşikleri perfect ≥ great ≥ good (arka uç da bunu ister) */
export function dengeDogrula(ayar: Ayarlar, m: YonetimMetni): FormHatalari {
  const h: FormHatalari = {};
  for (const a of sayiAlanlari(ayar)) if (!Number.isFinite(a.deger) || a.deger < 0) h[a.yol] = m.form.sifirVeUstuSayi;
  const k = ayar.kalite;
  if (!(k.perfect >= k.great && k.great >= k.good)) h["kalite.perfect"] = m.denge.kaliteSirasi;
  return h;
}

/** Kapsamın bir sonraki sürüm numarası: kayıtlı sürümlerin ve yayındaki ayarın en büyüğünden bir fazla */
export function sonrakiSurum(surumler: IcerikSurumu[], kapsam: IcerikKapsami, yayindaki = 0): number {
  return Math.max(yayindaki, ...surumler.filter((s) => s.kapsam === kapsam).map((s) => s.surum), 0) + 1;
}

/** Sürümler yeniden eskiye: önce kapsam, sonra sürüm numarası */
export const surumSirala = (surumler: IcerikSurumu[]) =>
  [...surumler].sort((a, b) => a.kapsam.localeCompare(b.kapsam) || b.surum - a.surum);

/** native.ts hatasını kullanıcıya gösterilecek cümleye çevirir (arka uç iletileri zaten Türkçe gelir) */
export function hataMetni(hata: NativeHata, m: YonetimMetni): string {
  if (hata.tur === "ArkaUc") {
    const alanlar = hata.alanlar?.map((a) => a.message).join(" ");
    return alanlar ? `${hata.mesaj} ${alanlar}` : hata.mesaj;
  }
  if (hata.tur === "YalnizUygulamada") return m.hata.yalnizUygulamada;
  return m.hata.bilinmeyen;
}
