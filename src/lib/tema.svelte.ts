// Adım 15: Tema (gece / gündüz) — seçim localStorage'da saklanır
import type { Tema } from "./types";
export type { Tema };

const ANAHTAR = "tema";

class TemaYonetici {
  mod = $state<Tema>(
    typeof document !== "undefined" && document.documentElement.dataset.tema === "gece"
      ? "gece"
      : "gunduz"
  );

  degistir() {
    this.mod = this.mod === "gece" ? "gunduz" : "gece";
    if (typeof document !== "undefined") {
      document.documentElement.dataset.tema = this.mod;
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ANAHTAR, this.mod);
    }
  }
}

export const tema = new TemaYonetici();
