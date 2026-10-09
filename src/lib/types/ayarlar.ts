// Oyun ayarları (sayılar: src/lib/veri/ayarlar.json; anlamları: docs/oyun-tasarimi.md)
import type { Kalinlik } from "./siparis";

export interface Ayarlar {
  pismeSuresi: number; // bir krebin temel pişme süresi (sn)
  pisirme: {
    yuzSuresi: number; // bir yüzün pişme süresi (sn)
    ikinciYuzHiz: number; // ikinci yüzün pişme hızı çarpanı
    hizArtis: number; // seviyeyle pişme hızı artışı
    hizMax: number; // pişme hızının üst sınırı
    pismisP: number; // bir yüz bu değerden itibaren "pişmiş" (yanikP'ye kadar)
    fazlaP: number; // "fazla pişmiş" eşiği
    yanikP: number; // "yanık" eşiği
    kacirP: number; // çevirmenin kaçırıldığı eşik
    puanDusus: number; // eşik aşılınca puan düşüşü
    anticipSn: number; // çevirme öncesi hazırlanma süresi (sn)
    ucusSn: number; // çevirmede krebin havada kalma süresi (sn)
    kaymaSn: number; // tavadan tabağa kayma süresi (sn)
    kalinHiz: Record<Kalinlik, number>; // kalınlığa göre pişme hızı çarpanı
    kalinKalite: Record<Kalinlik, number>; // kalınlığa göre kalite çarpanı
  };
  hamur: {
    dokmeSn: number; // tam doluma kadar döküm süresi (sn)
    max: number; // tavaya dökülebilecek en çok hamur
    min: number; // geçerli krep için en az hamur
    hedef: Record<Kalinlik, number>; // her kalınlık için ideal hamur miktarı (tolerans seviyeden)
    yayPx: number; // hamurun yayılma yarıçapı (px)
    yayilSn: number; // yayılma süresi (sn)
  };
  bolgeler: { cig: number; az: number; orta: number; iyi: number; fazla: number }; // pişme bölgelerinin sınırları
  yanikBekleme: number; // yanık krebin tavada kalma süresi (sn)
  sosSuresi: number; // sos koyma süresi (sn)
  dolguSuresi: number; // dolgu koyma süresi (sn)
  toppingSuresi: number; // topping koyma süresi (sn)
  copBasma: number; // çöp kutusu basma süresi (sn)
  tabakMax: number; // tabakta en çok kaç parça olabilir
  cevirmePx: number; // çevirme hareketi için gereken kaydırma (px)
  cevirmeMs: number; // çevirme hareketinin en uzun süresi (ms)
  perfectBonus: number; // PERFECT servis bonusu (coin)
  combo: { adim: number; max: number; baslangicSeviye: number }; // seri çarpanı
  cikisSuresi: number; // memnun müşterinin ayrılma süresi (sn)
  mesajSuresi: number; // sonuç mesajının ekranda kalma süresi (sn)
  zorlukAgirlik: { krep: number; dolgu: number; sos: number; topping: number }; // kategoriye göre sipariş zorluk ağırlığı
  hataCezasi: { eksik: number; fazla: number; yanlis: number; sira: number; pisme: number; tercih: number }; // hata türüne göre puan cezası
  kalite: { perfect: number; great: number; good: number }; // sonuç katmanlarının puan eşikleri
  odemeCarpani: { perfect: number; great: number; good: number; olmadi: number }; // sonuca göre ödeme çarpanı
  ruhHali: { esik: number; yuz: string; bahsis: number }[]; // sabır oranına göre yüz ifadesi ve bahşiş
}
