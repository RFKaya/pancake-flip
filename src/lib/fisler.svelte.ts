// Servis sonu adisyonu: Tauri'de Rust fis_olustur, tarayıcıda WEB- yedeği (docs/oyun-mimarisi.md §5, §7)
import { invoke, isTauri } from "@tauri-apps/api/core";
import { kayit } from "./kayit.svelte";

async function fisKoduAl(bolumId: number, yildiz: number): Promise<string> {
  if (typeof window !== "undefined" && isTauri()) {
    // Rust tarafındaki bolum_id parametresi JS'te camelCase yazılır: bolumId
    return invoke<string>("fis_olustur", { bolumId, yildiz });
  }
  return `WEB-${String(bolumId).padStart(3, "0")}-${yildiz}${Date.now().toString(36).toUpperCase()}`;
}

/** Kodu üretir, kayda ekler ve döndürür */
export async function fisKaydet(bolumId: number, yildiz: number, net: number): Promise<string> {
  const kod = await fisKoduAl(bolumId, yildiz);
  kayit.fisEkle({ kod, bolum: bolumId, yildiz, net: Math.round(net), tarih: new Date().toISOString() });
  return kod;
}
