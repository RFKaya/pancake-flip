# Pancake Flip! — Mimari Ağaç Yapısı ve Kapsam

Dizin yapısı (ana klasörler) için tek kaynak: [`klasor-mimarisi.md`](klasor-mimarisi.md). Oyun kod mimarisi: [`oyun-mimarisi.md`](oyun-mimarisi.md). Ekranların işlevi: [`proje-fikri.md`](proje-fikri.md).

> Bu ağaç projenin **bugünkü** rotalarını gösterir; kaynak `src/pages/` klasörüdür. Ağaçta olmayan bir rota projede yoktur; yeni sayfa eklenirse önce bu ağaç güncellenir.

---

## 1. Sayfa ve Özellik Ağacı (Site & Feature Map)

```
Pancake Flip!
├── / (Ana ekran)
│   └── Restoran sahnesi, LOBİ durumu: aynı tava/tabak/duvar, LEVEL rozeti, coin, ? ve ⚙, büyük "OYNA". OYNA sayfa değiştirmez; aynı sahne OYUN durumuna geçer (fişler ve malzeme çubuğu kısa süre içinde belirir, kamera/tava yerinde kalır)
│
│   └── (aynı sayfada) OYUN durumu: sonsuz oyun, bölüm yok, bkz. sonsuz-seviye.md
│   ├── Tava(lar), tabak, malzeme rafı, müşteri fişleri + sabır çubuğu, LEVEL ve ilerleme çubuğu
│   ├── LEVEL UP bildirimi (oyunu durdurmaz); geliştirici modu 🛠 (seviye ayarlama)
│   └── Fiş/adisyon: kilometre taşlarında ve her 10. seviyede Rust `fis_olustur` → KRP-… kodu
│
├── /fislerim (Fişlerim)
│   └── Rust tarafından üretilen adisyon kodları ve geçmişi
│
├── /profil (Profil ve Ayarlar)
│   ├── Şef karnesi: seviye ve ilerleme, en yüksek seviye, servis edilen müşteri, en iyi seri, PERFECT sayısı, fiş sayısı, kasa
│   ├── Hesap (ad, yalnızca cihazda) ve ses ayarları
│   └── Bilgi sayfalarına linkler
│
└── Bilgi ve Yasal Sayfalar (4 dil: tr varsayılan, en, ar, fa)
    ├── /hakkinda (MDX + etkileşimli bileşen)
    ├── /iletisim (reaktif form)
    ├── /kosullar (MDX)
    └── /gizlilik (MDX, veriler yalnızca cihazda)
```

Alt menü sekmeleri: Oyna · Fişlerim · Profil. Ayrı bir `/oyna` rotası yoktur: OYNA'ya basınca alt menü aşağı kayıp aynı yerdeki malzeme çubuğuna yer açar. Diğer dillerde rotalar `/en/hakkinda` gibi öne ek alır.

---

## 2. Hedef Platform Matrisi

| Platform Grubu | Hedef Sistemler | Paket Formatı | Öncelik |
|---|---|---|---|
| **Masaüstü** | Windows (10 / 11 x64) | `.msi`, `.exe` | Birincil (geliştirme ve test ortamı) |
| **Mobil** | Android (Telefon & Tablet) | `.apk`, `.aab` | Birincil (dikey ekran) |
| **Masaüstü** | macOS (Apple Silicon / Intel) | `.dmg`, `.app` | Teorik (Tauri destekler, test edilmez) |
| **Masaüstü** | Linux (Ubuntu / Debian) | `.deb`, `.AppImage` | Teorik |
| **Mobil** | iOS (iPhone & iPad) | `.ipa` (Xcode) | Teorik (Mac ve Xcode gerekir) |

Platform ikon setleri [`branding.md`](branding.md)'de anlatıldığı gibi beşi için de üretilmiştir.

---

## 3. Ekran Boyutları (Responsive ve Adaptive)

Oyun **dikey (9:16)** tasarlanmıştır. Geniş ekranda oyun alanı büyütülmez, ortalanır; ek alan liste ve kartlara verilir.

| Sınıf | Genişlik | Düzen | Gezinme |
|---|---|---|---|
| **Telefon** | 375–430 px | Tek sütun, bölüm ızgarası 4 sütun, kartlar tam genişlik | Alt menü (`alt-menu`) sabit, `safe-area-inset-bottom` payı |
| **Tablet** | 768–1024 px | 2 sütunlu liste/detay, bölüm ızgarası 6 sütun, içerik `max-width: 720px` ortalı | Alt menü sabit kalır |
| **Masaüstü** | 1200 px ve üstü | 3 sütunlu kart ızgarası, bölüm ızgarası 8 sütun, içerik `max-width: 1100px` ortalı | Alt menü üst çubuğa taşınır (yatay sekmeler) |
| **Büyük ekran** | 1600 px ve üstü | Düzen 1100 px'te kalır, iki yanda boşluk (zemin rengi) | Masaüstü ile aynı |
| **Servis ekranı** (tüm boyutlar) | — | Oyun alanı 9:16 oranında, `max-width: 480px`, yatay ortalı; yüksekliği pencereye sığar | Alt menü yok; duraklatma düğmesi |

- Tauri penceresi varsayılan olarak **420×820** açılır ([`tauri.conf.json`](../src-tauri/tauri.conf.json)).
- Izgara `display: grid` + `grid-template-columns: repeat(auto-fill, minmax(...))` ile kurulur; kırılma noktaları `@media (min-width: 768px)` ve `(min-width: 1200px)`.
- Dokunmatik hedefler en az 44×44 px'tir.
