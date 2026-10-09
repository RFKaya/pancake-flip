// Tipli örnek veri: her ana tipten en az 6 gerçekçi kayıt (docs/veri-modeli.md).
// Oyun bunları kullanmaz; geliştirme sırasında ekranları doldurmak (örn. Fişlerim'de ?durum=ornek) ve testler içindir.
// Malzeme ve müşteri tipi kayıtlarının asılları JSON'dadır: malzemeler.json (8), musteriler.json (4).
import type { Fis, Musteri, Siparis } from "../types";

/** Altı sipariş: tek krepten çok katlıya, kalınlık tercihli ve tercihsiz */
export const ornekSiparisler: Siparis[] = [
  { parcalar: ["krep"], d: 1 },
  { parcalar: ["krep", "krep"], d: 2, tercih: "ince" },
  { parcalar: ["krep", "cikolata", "krep"], d: 3 },
  { parcalar: ["krep", "cilek-dilimi", "krep", "cilek-sosu"], d: 4.5, tercih: "normal" },
  { parcalar: ["krep", "muz", "krep", "tereyagi"], d: 5, tercih: "kalin" },
  { parcalar: ["krep", "bal", "krep", "findik", "krep"], d: 7 },
];

/** Altı müşteri: dört müşteri tipinin hepsinden, farklı sabır durumlarında */
export const ornekMusteriler: Musteri[] = [
  { id: 1, tip: "normal", siparis: ornekSiparisler[0], sabirToplam: 30, sabir: 30 },
  { id: 2, tip: "cocuk", siparis: ornekSiparisler[2], sabirToplam: 42, sabir: 35 },
  { id: 3, tip: "normal", siparis: ornekSiparisler[1], sabirToplam: 28, sabir: 12 },
  { id: 4, tip: "elestirmen", siparis: ornekSiparisler[3], sabirToplam: 25, sabir: 20 },
  { id: 5, tip: "vip", siparis: ornekSiparisler[4], sabirToplam: 22, sabir: 6 },
  { id: 6, tip: "cocuk", siparis: ornekSiparisler[5], sabirToplam: 40, sabir: 40 },
];

/** Altı fiş: en yenisi başta (Fişlerim sırası); kilometre taşları ve her 10. seviye */
export const ornekFisler: Fis[] = [
  { kod: "KRP-060-3B41D07", bolum: 60, yildiz: 3, net: 2310, kasa: 9870, tarih: "2026-10-09T18:40:00.000Z" },
  { kod: "KRP-050-35E2A19", bolum: 50, yildiz: 3, net: 2140, kasa: 7560, tarih: "2026-10-08T21:15:00.000Z" },
  { kod: "KRP-040-2C0F3B8", bolum: 40, yildiz: 2, net: 1720, kasa: 5420, tarih: "2026-10-07T19:02:00.000Z" },
  { kod: "KRP-030-2A7D551", bolum: 30, yildiz: 2, net: 1490, kasa: 3700, tarih: "2026-10-06T17:30:00.000Z" },
  { kod: "KRP-025-19C4E6A", bolum: 25, yildiz: 1, net: 980, kasa: 2210, tarih: "2026-10-05T16:45:00.000Z" },
  { kod: "KRP-010-3A9F1C2", bolum: 10, yildiz: 3, net: 1230, kasa: 1230, tarih: "2026-10-04T15:20:00.000Z" },
];
