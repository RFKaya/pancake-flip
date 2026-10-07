// Sonsuz seviye kaydı (sürümlü localStorage). Eski bölüm kaydı (kayit.svelte.ts) bununla ilgilenmez.
// Açılan malzeme ve mekanikler kayda yazılmaz: seviyeden hesaplanır (seviye.ts), böylece bayatlayamaz.
import type { Oturum } from "./oyun/oturum";
import { seviyeSinirla } from "./oyun/seviye";

const ANAHTAR = "pancakeflip-ilerleme";
const DEV_ANAHTAR = "pancakeflip-dev";

export interface IlerlemeVerisi {
  surum: 1;
  seviye: number; // playerLevel
  ilerleme: number; // progressToNextLevel
  toplamMusteri: number; // totalCustomersServed
  toplamCoin: number; // totalCoins
  enYuksekSeviye: number;
}

const bos = (): IlerlemeVerisi => ({ surum: 1, seviye: 1, ilerleme: 0, toplamMusteri: 0, toplamCoin: 0, enYuksekSeviye: 1 });
const sayi = (x: unknown, varsayilan: number) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : varsayilan);

function oku(): IlerlemeVerisi {
  if (typeof window === "undefined") return bos();
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return bos();
    const v = JSON.parse(ham);
    if (v?.surum !== 1) return bos();
    const seviye = seviyeSinirla(sayi(v.seviye, 1));
    return {
      surum: 1,
      seviye,
      ilerleme: sayi(v.ilerleme, 0),
      toplamMusteri: sayi(v.toplamMusteri, 0),
      toplamCoin: sayi(v.toplamCoin, 0),
      enYuksekSeviye: Math.max(seviye, seviyeSinirla(sayi(v.enYuksekSeviye, 1))),
    };
  } catch {
    return bos();
  }
}

class Ilerleme {
  veri = $state<IlerlemeVerisi>(bos());

  yukle() {
    this.veri = oku();
  }

  #yaz() {
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(this.veri));
    } catch {
      // depolama kapalıysa oyun yine de çalışır
    }
  }

  /** Oturumun durumunu kayda yazar (normal oyun; test seviyesinde çağrılmaz) */
  oturumKaydet(o: Oturum) {
    this.veri = {
      surum: 1,
      seviye: o.seviye,
      ilerleme: o.ilerleme,
      toplamMusteri: o.toplamMusteri,
      toplamCoin: o.toplamCoin,
      enYuksekSeviye: Math.max(this.veri.enYuksekSeviye, o.seviye),
    };
    this.#yaz();
  }

  /** Geliştirici: test seviyesini gerçek kayda uygular (toplamlar korunur, yalnızca seviye ve ilerleme değişir) */
  seviyeUygula(seviye: number, ilerleme = 0) {
    const s = seviyeSinirla(seviye);
    this.veri = { ...this.veri, seviye: s, ilerleme, enYuksekSeviye: Math.max(this.veri.enYuksekSeviye, s) };
    this.#yaz();
  }

  sifirla() {
    this.veri = bos();
    this.#yaz();
  }
}

export const ilerleme = new Ilerleme();

/** Geliştirici modu: geliştirme sunucusunda her zaman açık; yayında `?dev=1` ile açılır, `?dev=0` ile kapanır. */
export function gelistiriciModuAcik(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("dev");
    if (q === "1") localStorage.setItem(DEV_ANAHTAR, "1");
    if (q === "0") localStorage.removeItem(DEV_ANAHTAR);
    return import.meta.env.DEV || localStorage.getItem(DEV_ANAHTAR) === "1";
  } catch {
    return import.meta.env.DEV;
  }
}
