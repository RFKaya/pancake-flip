// Adisyon (fiş) kaydı: sürümlü localStorage. Bozuk ya da eski kayıtla çökmez; çözümü oyun/fis.ts → fislerCoz.
// Seviye ilerlemesi ayrı bir anahtardadır (ilerleme.svelte.ts).
import type { Fis } from "../types/oyun";
import { fislerCoz } from "./oyun/fis";

const ANAHTAR = "pancakeflip-kayit";

function oku(): Fis[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return fislerCoz(localStorage.getItem(ANAHTAR));
  } catch {
    return [];
  }
}

class Kayit {
  #fisler = $state<Fis[]>([]);

  yukle() {
    this.#fisler = oku();
  }

  /** Kayıttaki adisyonlar, en yeni başta (bozuk girdiler çözülürken atlanır) */
  fisler(): Fis[] {
    return this.#fisler;
  }

  /** Yeni adisyonu listenin başına ekler. Sayfa doğrudan açılmış olabilir: önce diskteki kayıt okunur, üstüne yazılmaz. */
  fisEkle(fis: Fis) {
    this.yukle();
    this.#fisler = [fis, ...this.#fisler];
    try {
      // coin / bolumler: kaldırılan bölüm modelinin alanları. Eski sürümler bunlar olmadan kaydı geçersiz sayıp
      // fişleri silerdi; aynı tarayıcıda eski bir dal açılırsa fişler kaybolmasın diye boş değerleriyle yazılır.
      localStorage.setItem(ANAHTAR, JSON.stringify({ surum: 1, coin: 0, bolumler: {}, fisler: this.#fisler }));
    } catch {
      // depolama kapalıysa oyun yine de çalışır
    }
  }
}

export const kayit = new Kayit();
