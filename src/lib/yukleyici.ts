// Liste ekranlarının tek yükleme noktası (Malzeme rehberi, Fişlerim). Ekranlar veriyi yalnız buradan alır ve dört hâlden
// birini gösterir: yükleniyor, hata, boş, dolu. Geliştirme için hâl adres çubuğundan zorlanabilir: docs/gelistirme-notlari.md
import { MALZEMELER } from "./oyun/veri";
import type { Fis, Malzeme, ZorlananDurum } from "./types";
import { ornekFisler } from "./veri/ornek";
import { destekleniyorMu, kayitListesi } from "./native";
import type { KayitKaynagi, ListeSorgusu, NativeSonuc, Sayfa, YonetimKaynaklari } from "./types";

/** Yalnız elle liste denemelerinde kullanılır; hiçbir zaman veritabanına yazılmaz. */
const YONETIM_ORNEKLERI: { [K in KayitKaynagi]: YonetimKaynaklari[K][] } = {
  Player: [{ id: "ornek-oyuncu", ad: "Örnek oyuncu", eposta: null, kayitTarihi: null, sonOyun: null, durum: "aktif", ilerleme: { seviye: 1 } }],
  Fis: [{ kod: "KRP-001-3ABCDEF", playerId: "ornek-oyuncu", bolum: 1, yildiz: 3, net: 10, kasa: 10, tarih: null }],
  FraudFlag: [{ id: "ornek-inceleme", playerId: "ornek-oyuncu", neden: "Örnek inceleme", kanit: null, durum: "acik", tarih: null }],
  AuditLog: [{ id: "ornek-denetim", at: null, actorId: null, action: "Player.setLevel", entity: "Player", entityId: "ornek-oyuncu", reason: "Örnek işlem", before: { seviye: 1 }, after: { seviye: 2 } }],
};

/** Yönetim listelerinin tek yükleme noktası; web'de örnekler dahil oyuncu verisi sunulmaz. */
export async function yonetimKayitlariniYukle<K extends KayitKaynagi>(kaynak: K, sorgu: ListeSorgusu = {}, deneme = 0): Promise<NativeSonuc<Sayfa<YonetimKaynaklari[K]>>> {
  if (!destekleniyorMu("yonetim")) return { ok: false, hata: { tur: "YalnizUygulamada" } };
  const z = zorlananDurum();
  if (z === "yukleniyor") return hicBitmeyen();
  if (z === "hata" && deneme === 0) return { ok: false, hata: { tur: "Bilinmeyen", mesaj: "Zorlanan liste hatası" } };
  if (z === "bos" || z === "ornek") {
    const items = z === "bos" ? [] : YONETIM_ORNEKLERI[kaynak];
    return { ok: true, veri: { items, total: items.length, page: 1, pageSize: 25 } };
  }
  return kayitListesi(kaynak, sorgu);
}

/** Adresteki ?durum=yukleniyor|hata|bos|ornek değeri (yoksa null) */
export function zorlananDurum(): ZorlananDurum | null {
  if (typeof window === "undefined") return null;
  const d = new URLSearchParams(window.location.search).get("durum");
  return d === "yukleniyor" || d === "hata" || d === "bos" || d === "ornek" ? d : null;
}

/** Hiç bitmeyen yükleme (yalnız ?durum=yukleniyor için) */
const hicBitmeyen = () => new Promise<never>(() => {});

/**
 * Zorlanan hâli uygular. `deneme` kaçıncı yükleme olduğunu söyler (0 = ilk): ?durum=hata yalnız ilk denemede hata verir,
 * böylece "Tekrar dene" düğmesi gerçekten listeyi getirir.
 */
async function zorla<T>(deneme: number, ornek: T[] | null, gercek: () => T[] | Promise<T[]>): Promise<T[]> {
  const z = zorlananDurum();
  if (z === "yukleniyor") return hicBitmeyen();
  if (z === "hata" && deneme === 0) throw new Error("Zorlanan hata (?durum=hata)");
  if (z === "bos") return [];
  if (z === "ornek" && ornek) return ornek;
  return gercek();
}

/** Malzeme rehberinin verisi: oyunun malzemeleri (src/lib/veri/malzemeler.json) */
export function malzemeleriYukle(deneme = 0): Promise<Malzeme[]> {
  return zorla(deneme, null, () => MALZEMELER);
}

/** Fişlerim'in verisi: cihazdaki adisyonlar, en yeni başta; ?durum=ornek ile src/lib/veri/ornek.ts fişleri */
export function fisleriYukle(deneme = 0): Promise<Fis[]> {
  return zorla(deneme, ornekFisler, async () => {
    const { kayit } = await import("./kayit.svelte");
    kayit.yukle();
    return kayit.fisler();
  });
}
