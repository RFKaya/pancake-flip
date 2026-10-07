// Sürümlü localStorage kaydı (docs/oyun-tasarimi.md §14). Bozuk ya da eski kayıtla çökmez.
const ANAHTAR = "pancakeflip-kayit";

interface KayitVerisi {
  surum: 1;
  coin: number;
  bolumler: Record<string, { yildiz: number; enIyiNet: number }>;
}

const bos = (): KayitVerisi => ({ surum: 1, coin: 0, bolumler: {} });

function oku(): KayitVerisi {
  if (typeof localStorage === "undefined") return bos();
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return bos();
    const v = JSON.parse(ham);
    if (v?.surum !== 1 || typeof v.coin !== "number" || typeof v.bolumler !== "object") return bos();
    return v as KayitVerisi;
  } catch {
    return bos();
  }
}

class Kayit {
  veri = $state<KayitVerisi>(bos());

  yukle() {
    this.veri = oku();
  }

  yildiz(bolumNo: number) {
    return this.veri.bolumler[String(bolumNo)]?.yildiz ?? 0;
  }

  /** Bölüm 1 her zaman açık; sonraki bölüm, öncekinde en az 1 yıldızla açılır */
  acik(bolumNo: number) {
    if (import.meta.env.DEV) return true; // geliştirme sunucusunda (bun run dev) test için hepsi açık
    return bolumNo <= 1 || this.yildiz(bolumNo - 1) >= 1;
  }

  servisKaydet(bolumNo: number, yildiz: number, net: number) {
    // Servis sayfası doğrudan açılmış olabilir (yenileme, uygulama yeniden açılışı): bellekteki boş
    // varsayılanın üstüne yazıp eski ilerlemeyi silmemek için önce diskteki kayıt okunur.
    this.yukle();
    const onceki = this.veri.bolumler[String(bolumNo)];
    this.veri.bolumler[String(bolumNo)] = {
      yildiz: Math.max(onceki?.yildiz ?? 0, yildiz),
      enIyiNet: Math.max(onceki?.enIyiNet ?? 0, Math.round(net)),
    };
    this.veri.coin += Math.max(0, Math.round(net));
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(this.veri));
    } catch {
      // depolama kapalıysa oyun yine de çalışır
    }
  }
}

export const kayit = new Kayit();
