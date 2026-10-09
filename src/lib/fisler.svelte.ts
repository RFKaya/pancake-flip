// Seviye adisyonu: kod src/lib/native.ts üzerinden (Tauri'de Rust fis_olustur, tarayıcıda WEB- yedeği; docs/komutlar.md)
import { kayit } from "./kayit.svelte";
import { fisOlustur } from "./native";
import { fisNeti } from "./oyun/fis";

/**
 * Kodu üretir, kayda ekler ve döndürür. `kasa` o anki toplam coin'dir; fişe yazılan kazanç (net) bir önceki fişten
 * bu yana kazanılandır (fisNeti). Kod beklendikten sonra kayıt tek seferde okunup yazılır, böylece aynı anda kesilen
 * iki fiş birbirinin kasasını görür. Komut hata dönerse fiş kesilmez ve hata fırlatılır (çağıran yakalar).
 */
export async function fisKaydet(seviye: number, yildiz: number, kasa: number): Promise<string> {
  const sonuc = await fisOlustur(seviye, yildiz);
  if (!sonuc.ok) throw new Error(`fis_olustur: ${JSON.stringify(sonuc.hata)}`);
  const { kod } = sonuc.veri;
  kayit.yukle();
  const net = fisNeti(kasa, kayit.fisler());
  kayit.fisEkle({ kod, bolum: seviye, yildiz, net, kasa: Math.max(0, Math.round(kasa)), tarih: new Date().toISOString() });
  return kod;
}
