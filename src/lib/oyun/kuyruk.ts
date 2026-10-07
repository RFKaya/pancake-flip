// Servis başında bütün müşteri kuyruğunu önceden üretir (docs/oyun-tasarimi.md §6.2)
import type { Ayarlar, Bolum, Malzeme, Musteri, MusteriTipi } from "../../types/oyun";
import { sabirHesapla } from "./musteri";
import { rngOlustur } from "./rng";
import { siparisUret } from "./siparis";

export function kuyrukUret(
  bolum: Bolum,
  malzemeler: Malzeme[],
  tipler: MusteriTipi[],
  ayar: Ayarlar,
  tohum: number
): Musteri[] {
  const rng = rngOlustur(tohum);
  const aralik = Math.max(ayar.gelmeAraligi.min, ayar.gelmeAraligi.baslangic - ayar.gelmeAraligi.azalma * bolum.id);
  const kuyruk: Musteri[] = [];
  let zaman = 0.6;
  for (let i = 0; i < bolum.musteriSayisi; i++) {
    const tipId = rng.agirlikliSec(bolum.musteriAgirlik);
    const tip = tipler.find((t) => t.id === tipId) as MusteriTipi;
    const siparis = siparisUret(bolum, malzemeler, tip, ayar, rng);
    const sabirToplam = sabirHesapla(siparis.d, bolum.id, tip, ayar);
    kuyruk.push({ id: i + 1, tip: tip.id, siparis, gelisZamani: zaman, sabirToplam, sabir: sabirToplam });
    zaman += aralik;
  }
  return kuyruk;
}
