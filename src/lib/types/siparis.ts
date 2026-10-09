// Sipariş ve servis sonucu tipleri

/** Krebin kalınlığı (döküm sırasındaki hamur miktarı) */
export type Kalinlik = "ince" | "normal" | "kalin";

/** Bir servisin sonucu: puan katmanı ya da red */
export type Sonuc = "perfect" | "great" | "good" | "olmadi";

export interface Siparis {
  parcalar: string[]; // tabağa konma sırasıyla (alttan üste) malzeme id'leri
  d: number; // siparişin zorluk puanı (ödeme ve sabır hesabında kullanılır)
  tercih?: Kalinlik; // müşterinin istediği krep kalınlığı; yoksa fark etmez
}
