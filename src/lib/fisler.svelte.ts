// Seviye adisyonu: Tauri'de Rust fis_olustur, tarayıcıda WEB- yedeği (docs/oyun-mimarisi.md §5, §7)
import { invoke, isTauri } from "@tauri-apps/api/core";
import { kayit } from "./kayit.svelte";
import { fisNeti } from "./oyun/fis";

async function fisKoduAl(bolumId: number, yildiz: number): Promise<string> {
  if (typeof window !== "undefined" && isTauri()) {
    // Rust tarafındaki bolum_id parametresi JS'te camelCase yazılır: bolumId
    return invoke<string>("fis_olustur", { bolumId, yildiz });
  }
  return `WEB-${String(bolumId).padStart(3, "0")}-${yildiz}${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Kodu üretir, kayda ekler ve döndürür. `kasa` o anki toplam coin'dir; fişe yazılan kazanç (net) bir önceki fişten
 * bu yana kazanılandır (fisNeti). Kod beklendikten sonra kayıt tek seferde okunup yazılır, böylece aynı anda kesilen
 * iki fiş birbirinin kasasını görür.
 */
export async function fisKaydet(bolumId: number, yildiz: number, kasa: number): Promise<string> {
  const kod = await fisKoduAl(bolumId, yildiz);
  kayit.yukle();
  const net = fisNeti(kasa, kayit.fisler());
  kayit.fisEkle({ kod, bolum: bolumId, yildiz, net, kasa: Math.max(0, Math.round(kasa)), tarih: new Date().toISOString() });
  return kod;
}
