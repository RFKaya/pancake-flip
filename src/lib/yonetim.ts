// Yönetim paneli hesapları: saf fonksiyonlar (bileşenler yalnızca gösterir). Oyuncu verisi native.ts'ten, içerik JSON'dan gelir.
import type { YonetimMetni } from "./admin-sozluk";
import { MALZEMELER, SEVIYE, TIPLER } from "./oyun/veri";
import type { IcerikOzeti, NativeHata, PanelOzeti } from "./types";

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

/** native.ts hatasını kullanıcıya gösterilecek cümleye çevirir (arka uç iletileri zaten Türkçe gelir) */
export function hataMetni(hata: NativeHata, m: YonetimMetni): string {
  if (hata.tur === "ArkaUc") {
    const alanlar = hata.alanlar?.map((a) => a.message).join(" ");
    return alanlar ? `${hata.mesaj} ${alanlar}` : hata.mesaj;
  }
  if (hata.tur === "YalnizUygulamada") return m.hata.yalnizUygulamada;
  return m.hata.bilinmeyen;
}
