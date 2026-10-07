// Sipariş grameri ve üretici (docs/oyun-tasarimi.md §3 ve §6)
// Sipariş := Krep (Ara Krep)* Üst ; Ara := boş | Dolgu | Sos ; Üst := boş | Sos | Topping | Sos Topping
import type { Ayarlar, Bolum, Malzeme, MusteriTipi, Siparis } from "../../types/oyun";
import type { Rng } from "./rng";

export function zorlukHesapla(parcalar: string[], malzemeler: Malzeme[], ayar: Ayarlar): number {
  const kategori = (id: string) => malzemeler.find((m) => m.id === id)?.kategori;
  let d = 0;
  for (const id of parcalar) {
    const k = kategori(id);
    if (k) d += ayar.zorlukAgirlik[k];
  }
  return d;
}

function bir(
  bolum: Bolum,
  malzemeler: Malzeme[],
  tip: MusteriTipi,
  ayar: Ayarlar,
  rng: Rng
): string[] {
  const menu = malzemeler.filter(
    (m) => bolum.menu.includes(m.id) && (!tip.tatliMi || m.tatli)
  );
  const dolgular = menu.filter((m) => m.kategori === "dolgu");
  const soslar = menu.filter((m) => m.kategori === "sos");
  const toppingler = menu.filter((m) => m.kategori === "topping");

  let krepMax = bolum.krep[1];
  if (tip.dMax !== undefined) krepMax = Math.min(krepMax, tip.id === "cocuk" ? 2 : krepMax);
  const n = rng.tamsayi(bolum.krep[0], Math.max(bolum.krep[0], krepMax));

  const parcalar: string[] = ["krep"];
  for (let i = 1; i < n; i++) {
    const secenekler: ("bos" | "dolgu" | "sos")[] = ["bos"];
    if (dolgular.length) secenekler.push("dolgu");
    if (soslar.length) secenekler.push("sos");
    const secim = rng.sec(secenekler);
    if (secim === "dolgu") parcalar.push(rng.sec(dolgular).id);
    if (secim === "sos") parcalar.push(rng.sec(soslar).id);
    parcalar.push("krep");
  }

  const ust: ("bos" | "sos" | "topping" | "sostopping")[] = ["bos"];
  if (soslar.length) ust.push("sos");
  if (toppingler.length) ust.push("topping");
  if (soslar.length && toppingler.length) ust.push("sostopping");
  const u = rng.sec(ust);
  if (u === "sos" || u === "sostopping") parcalar.push(rng.sec(soslar).id);
  if (u === "topping" || u === "sostopping") parcalar.push(rng.sec(toppingler).id);
  void ayar;
  return parcalar;
}

/** Bölüm ve müşteri tipine uygun bir sipariş üretir; D aralığı tutmazsa 20 kez dener, sonra en yakını alır. */
export function siparisUret(
  bolum: Bolum,
  malzemeler: Malzeme[],
  tip: MusteriTipi,
  ayar: Ayarlar,
  rng: Rng
): Siparis {
  const dMin = bolum.d[0];
  const dMax = tip.dMax !== undefined ? Math.min(bolum.d[1], tip.dMax) : bolum.d[1];
  let enIyi: Siparis | null = null;
  let enIyiFark = Infinity;
  for (let deneme = 0; deneme < 20; deneme++) {
    const parcalar = bir(bolum, malzemeler, tip, ayar, rng);
    const d = zorlukHesapla(parcalar, malzemeler, ayar);
    const fark = d < dMin ? dMin - d : d > dMax ? d - dMax : 0;
    if (fark === 0) return { parcalar, d };
    if (fark < enIyiFark) {
      enIyiFark = fark;
      enIyi = { parcalar, d };
    }
  }
  return enIyi as Siparis;
}
