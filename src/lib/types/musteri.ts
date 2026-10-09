// Müşteri tipleri (kayıtlar: src/lib/veri/musteriler.json) ve sahnedeki müşteri
import type { Siparis } from "./siparis";

export interface MusteriTipi {
  id: string; // benzersiz kimlik (örn. "cocuk")
  ad: string; // oyuncuya görünen ad
  ikon: string; // fişte görünen emoji
  acilis: number; // açıldığı seviye
  agirlik: number; // açıldıktan sonra görülme ağırlığı (normal = 1)
  sabir: number; // temel sabır süresi (sn)
  odeme: number; // ödeme çarpanı
  bahsis: number; // bahşiş çarpanı
  ceza: number; // kaçırılınca kesilen coin çarpanı
  dKaydirma: number; // sipariş zorluğuna eklenen kaydırma
  dMax?: number; // sipariş zorluğu üst sınırı; yoksa sınır yok
  tatliMi?: boolean; // yalnız tatlı malzeme ister mi
}

export interface Musteri {
  id: number; // sahnede benzersiz numara (geliş sırası)
  tip: string; // MusteriTipi.id
  siparis: Siparis; // istediği tabak
  sabirToplam: number; // başlangıç sabrı (sn)
  sabir: number; // kalan sabır (sn)
}
