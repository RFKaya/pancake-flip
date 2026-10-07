# Proje Fikri: Pancake Flip!

- **Öğrenci Adı Soyadı:** [Ad Soyad]
- **Öğrenci Numarası:** [Öğrenci No]
- **İlham Alınan Konsept:** Kendi fikrim. Restoran zaman yönetimi oyunları (ör. "Cooking Fever" türü) ile listedeki 5. fikir "Yemeksepeti / Restoran Menü" birleşimi.
- **Slogan:** Müşteri bekliyor, krep yanıyor: çevir, diz, yetiştir!

---

## 1. Proje Özeti

Pancake Flip!, oyuncunun küçük bir krep dükkânında müşterilerin siparişlerini zamana karşı hazırladığı dikey (9:16) bir mobil oyundur. Oyuncu krepleri tavada pişirip doğru anda çevirir, araya dolgu ve sos koyar, en üste topping ekler ve tabağı müşteriye verir. 50 bölüm boyunca yeni malzemeler, müşteri tipleri ve aynı anda yönetilecek daha çok iş açılır.

**Neden özgün bir fikir?** Listedeki 40 fikrin hiçbiri oyun değil. Bu proje, şablonun Liste → Detay/Seçim → Kayıt/Kod akışını korur, ama "ürün satın alma" yerine "bir servisi oynayıp adisyon kodu alma" deneyimi sunar. Böylece hem şablonun bütün parçaları (Svelte arayüz, Rust komutu, kayıtlar ekranı, profil, tema) kullanılır hem de mobil dokunmatik etkileşim (dokunma, kaydırma, zamanlama) ders kapsamında denenmiş olur.

Oyunun ayrıntılı tasarımı: [`oyun-tasarimi.md`](oyun-tasarimi.md)

---

## 2. Temel Ekranlar ve İşlevler

1. **Ana Liste Ekranı: Bölümler** (şablondaki "Keşfet")
   - 50 bölüm bir ızgarada listelenir. Her kartta bölüm no, kazanılan yıldızlar (0–3), kilit durumu ve özel bölüm işareti vardır.
   - Filtreler: Tümü / Yıldızı eksik / Özel bölümler.
2. **Detay ve Seçim Ekranı: Bölüm Detayı** (şablondaki "Etkinlik Detayı")
   - Bölümün hedefleri (⭐ / ⭐⭐ / ⭐⭐⭐ için gereken coin), bu bölümde açılan yeni mekanik, menüdeki malzemeler, gelecek müşteri tipleri.
   - **"Servise başla"** düğmesi oyun ekranını açar. Servis bitince sonuç ekranına geçilir.
3. **Kayıt / Kod Üretme Ekranı: Servis Sonucu ve Adisyon** (şablondaki "Sepet → Bilet kodu")
   - Kazanılan yıldızlar ve kazanç dökümü (ödeme, bahşiş, combo, malzeme maliyeti) gösterilir.
   - "Adisyonu kaydet" düğmesi Rust komutunu çağırır. Rust bir **adisyon kodu** üretir, kod **Fişlerim** ekranında (şablondaki "Biletlerim") saklanır.
4. **Profil ve Ayarlar** (+ **Mutfak**, şablondaki "Sepet" sekmesinin yerine)
   - Profil: toplam istatistikler (servis, PERFECT sayısı, en iyi combo), dil, gece/gündüz teması, ses, titreşim, ipucu, kaydı sıfırlama.
   - Mutfak: coin ile alınan yükseltmeler (tava, sos şişesi), malzeme rehberi, kozmetik dekor.

---

## 3. Veri Modeli ve Rust Kod Formatı

**Adisyon kodu formatı:** `KRP-BBB-YXXXXXX`

| Parça | Anlamı | Örnek |
|---|---|---|
| `KRP` | Sabit önek (krep) | `KRP` |
| `BBB` | Bölüm numarası, 3 haneli | `007` |
| `Y` | Kazanılan yıldız (0–3) | `3` |
| `XXXXXX` | Zaman damgasından türetilen 6 haneli onaltılık (hex) sayı | `A9F1C2` |

Örnek: **`KRP-007-3A9F1C2`** → 7. bölüm, 3 yıldız.

Rust komutu (şablondaki `bilet_olustur` yerine):
```rust
#[tauri::command]
fn fis_olustur(bolum_id: u32, yildiz: u8) -> String
// format!("KRP-{:03}-{}{:06X}", bolum_id, yildiz.min(3), zaman % 0xFF_FFFF)
```
Tauri dışında, tarayıcıda (`bun run dev`) çalışırken şablondaki gibi JavaScript ile `WEB-` önekli yedek bir kod üretilir.

**Temel veri tipleri:** `Malzeme`, `MusteriTipi`, `Bolum`, `Siparis`, `Fis`, `Kayit`. Hepsi `src/lib/veri/*.json` ve `src/types/` altında tanımlanır, ayrıntısı [`oyun-mimarisi.md`](oyun-mimarisi.md) dosyasındadır.

---

## 4. Hedef Kitle

- **Kim:** 13–35 yaş arası, telefonda kısa oturumlarla (2–5 dakika) oyun oynayan kullanıcılar. Otobüste, ders arasında, sırada beklerken.
- **Neden:** Kuralları 30 saniyede öğrenilen ama hız, dikkat ve önceliklendirme becerisini giderek zorlayan bir oyun arıyorlar. Her servis kısa, sonucu ve ilerlemesi (yıldızlar, yeni malzemeler, adisyon kodları) hemen görülüyor.
- **Hedef platformlar:** Android (birincil, dikey ekran) ve Windows (masaüstü pencere, 9:16).
