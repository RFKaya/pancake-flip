// Sipariş grameri ve üretici (docs/oyun-tasarimi.md §3 ve §6)
// Sipariş := Krep (Ara Krep)* Üst ; Ara := boş | Dolgu | Sos ; Üst := boş | Sos | Topping | Sos Topping
import type { Ayarlar, Malzeme, MusteriTipi, Siparis, SeviyeAyari } from "../../types/oyun";
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

type Kosul = Pick<SeviyeAyari, "menu" | "krep" | "d">;

function bir(
  sv: Kosul,
  malzemeler: Malzeme[],
  tip: MusteriTipi,
  ayar: Ayarlar,
  rng: Rng
): string[] {
  const menu = malzemeler.filter(
    (m) => sv.menu.includes(m.id) && (!tip.tatliMi || m.tatli)
  );
  const dolgular = menu.filter((m) => m.kategori === "dolgu");
  const soslar = menu.filter((m) => m.kategori === "sos");
  const toppingler = menu.filter((m) => m.kategori === "topping");

  let krepMax = sv.krep[1];
  if (tip.dMax !== undefined) krepMax = Math.min(krepMax, tip.id === "cocuk" ? 2 : krepMax);
  const n = rng.tamsayi(sv.krep[0], Math.max(sv.krep[0], krepMax));

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

/** Seviyeye ve müşteri tipine uygun bir sipariş üretir; D aralığı tutmazsa 20 kez dener, sonra en yakını alır. */
export function siparisUret(
  sv: SeviyeAyari,
  malzemeler: Malzeme[],
  tip: MusteriTipi,
  ayar: Ayarlar,
  rng: Rng
): Siparis {
  const sert = tip.dMax ?? Infinity; // müşteri tipinin aşılamaz üst sınırı (çocuk: 4)
  const dMax = Math.min(sv.d[1] + tip.dKaydirma, sert);
  const dMin = Math.min(sv.d[0] + tip.dKaydirma, dMax);
  let enIyi: Siparis = { parcalar: ["krep"], d: zorlukHesapla(["krep"], malzemeler, ayar) };
  let enIyiFark = Infinity;
  for (let deneme = 0; deneme < 20; deneme++) {
    const parcalar = bir(sv, malzemeler, tip, ayar, rng);
    const d = zorlukHesapla(parcalar, malzemeler, ayar);
    if (d > sert) continue;
    const fark = d < dMin ? dMin - d : d > dMax ? d - dMax : 0;
    if (fark === 0 || fark < enIyiFark) {
      enIyiFark = fark;
      enIyi = { parcalar, d };
      if (fark === 0) break;
    }
  }
  const siparis = enIyi;
  // Seviye 20'den itibaren bazı müşteriler krep kalınlığı ister (ince ya da kalın)
  if (sv.tercihAcik && rng.sonraki() < sv.tercihOlasiligi) siparis.tercih = rng.sec(["ince", "kalin"] as const);
  return siparis;
}
