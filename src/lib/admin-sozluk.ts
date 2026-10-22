// Yönetim paneli metinleri: bileşenler metin yazmaz, buradan okur. Panel şimdilik yalnız Türkçe;
// başka bir dil eklenince aynı biçimde bir nesne daha yazılır ve yonetimSozlugu o dili döndürür.
import type { Dil } from "./i18n";

const tr = {
  sayfaBasligi: "Yönetim — Pancake Flip!",
  baslik: "Yönetim Paneli",
  menuEtiketi: "Yönetim bölümleri",
  menu: {
    ozet: "Panel Özeti",
  },
  oyunaDon: "Oyuna dön",
  temaDegistir: "Temayı değiştir",
  cikis: "Çıkış",
  roller: "Roller",
  oturumYukleniyor: "Oturum denetleniyor",
  giris: {
    baslik: "Yönetici girişi",
    aciklama: "Bu cihazdaki yerel arka uca kayıtlı hesabınla gir.",
    ilkHesap: "Bu cihazda açılan ilk hesap yönetici olur; sonraki hesaplara rolü bir yönetici verir.",
    girisSekmesi: "Giriş",
    kayitSekmesi: "Hesap oluştur",
    ad: "Ad soyad",
    eposta: "E-posta",
    parola: "Parola",
    parolaKurali: "8–128 karakter.",
    girisYap: "Giriş yap",
    kayitOl: "Hesap oluştur",
    gonderiliyor: "Gönderiliyor…",
  },
  ozet: {
    baslik: "Panel Özeti",
    aciklama: "Oyuncu kayıtları ve oyun içeriğinin özeti.",
    yukleniyor: "Panel özeti yükleniyor",
    oyuncular: "Oyuncular",
    ortalamaSeviye: "Ortalama seviye",
    medyan: "medyan",
    enYuksekSeviye: "En yüksek seviye",
    toplamServis: "Toplam servis",
    perfectOrani: "PERFECT oranı",
    dagilim: "Seviye dağılımı",
    dagilimAciklama: "Oyuncuların bulunduğu seviye aralıkları.",
    oyuncuBirim: "oyuncu",
    bosBaslik: "Henüz oyuncu kaydı yok",
    bosAciklama: "Oyuncular ilerlemesini kaydettikçe istatistikler burada görünür.",
    icerik: "Oyun içeriği",
    icerikAciklama: "Oyunun veri dosyalarından okunur.",
    malzeme: "Malzeme",
    musteriTipi: "Müşteri tipi",
    mekanik: "Mekanik",
    kilometreTasi: "Kilometre taşı",
    seviyeSiniri: "Seviye sınırı",
  },
  hata: {
    baslik: "Bir şeyler ters gitti",
    tekrar: "Tekrar dene",
    bilinmeyen: "Beklenmeyen bir hata oluştu.",
    yalnizUygulamada: "Bu bölüm yalnız uygulamada çalışır.",
  },
};

export type YonetimMetni = typeof tr;

const sozluk: Partial<Record<Dil, YonetimMetni>> = { tr };

/** İstenen dilin metinleri; o dil henüz yoksa Türkçe */
export function yonetimSozlugu(dil: Dil = "tr"): YonetimMetni {
  return sozluk[dil] ?? tr;
}
