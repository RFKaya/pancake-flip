<div align="center">

<a href="https://www.istinye.edu.tr" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/isu-logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="public/isu-logo.svg">
    <img alt="İstinye Üniversitesi" src="public/isu-logo.svg" width="280" />
  </picture>
</a>

<br><br>

# 🥞 Pancake Flip!

**Tavada krep döküp çevirdiğin, müşterilerin siparişlerini hazırladığın ve sonu olmayan seviyelerle ilerlediğin sevimli bir mobil yemek oyunu.**

<sub>İstinye Üniversitesi · Meslek Yüksekokulu · MYO063 Mobil Programlama</sub>

<p>
  <a href="https://www.istinye.edu.tr"><img alt="İSTİNYE ÜNİVERSİTESİ İSTANBUL" src="https://img.shields.io/badge/%C4%B0ST%C4%B0NYE%20%C3%9CN%C4%B0VERS%C4%B0TES%C4%B0-%C4%B0STANBUL-002855?style=for-the-badge"></a>
  <a href="#akademik-bilgiler"><img alt="MYO063 MOBİL PROGRAMLAMA" src="https://img.shields.io/badge/MYO063-MOB%C4%B0L%20PROGRAMLAMA-B45309?style=for-the-badge"></a>
  <a href="#akademik-bilgiler"><img alt="DÖNEM 2026-2027 GÜZ" src="https://img.shields.io/badge/D%C3%96NEM-2026--2027%20G%C3%9CZ-2563eb?style=for-the-badge"></a>
</p>
<p>
  <a href="https://v2.tauri.app/"><img alt="Tauri v2" src="https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white"></a>
  <a href="https://astro.build/"><img alt="Astro 7" src="https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white"></a>
  <a href="https://svelte.dev/"><img alt="Svelte 5" src="https://img.shields.io/badge/Svelte-5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"></a>
  <a href="https://www.rust-lang.org/"><img alt="Rust" src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white"></a>
  <a href="https://bun.sh/"><img alt="Bun" src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white"></a>
  <a href="LICENSE"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache--2.0-blue?style=for-the-badge"></a>
</p>

</div>

---

## İçindekiler

- [Oyun Hakkında](#oyun-hakkında)
- [Oynanış](#oynanış)
- [Özellikler](#özellikler)
- [Ekranlar](#ekranlar)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Mimari](#mimari)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Proje Yapısı](#proje-yapısı)
- [Geliştirme Süreci](#geliştirme-süreci)
- [Dokümantasyon](#dokümantasyon)
- [Akademik Bilgiler](#akademik-bilgiler)
- [Lisans](#lisans)

---

## Oyun Hakkında

Pancake Flip!, dikey (9:16), tek elle oynanan bir krep dükkânı oyunudur. Oyuncu küçük bir mutfakta tek başına çalışır: müşteriler sipariş fişleriyle gelir, oyuncu krepleri tavada pişirir, doğru anda çevirir, tabağa alır, malzemeleri sırayla koyar ve tabağı servis eder.

Oyunun **bölümü ve sonu yoktur**: ilerleme sonsuz bir **LEVEL** sistemidir. Her başarılı servis seviye çubuğunu doldurur; seviye atladıkça yeni malzemeler, müşteri tipleri ve mekanikler açılır, zorluk ise sonsuza kadar artmak yerine bir platoya yaklaşır.

Görsel yön: sevimli, sıcak renkli, "2.5D" görünümlü bir mutfak. Oyun motoru kullanılmaz; her şey Svelte, CSS ve kendi çizimlerimizle yapılır.

> Projenin fikri ve brif: [`docs/proje-fikri.md`](docs/proje-fikri.md) · Oyun kuralları: [`docs/oyun-tasarimi.md`](docs/oyun-tasarimi.md) · Sonsuz seviye sistemi: [`docs/sonsuz-seviye.md`](docs/sonsuz-seviye.md)

---

## Oynanış

**Döngü:** müşteri gelir → sipariş fişi duvara asılır → krepleri pişir → malzemeleri sırayla koy → **Ver** → coin ve ilerleme → LEVEL UP → sonraki müşteri.

| Hareket | Tavada ne olur |
|---|---|
| **Basılı tut** | Hamur dökülür; ne kadar uzun tutarsan krep o kadar kalın olur |
| **Yukarı kaydır** | Krep havada döner, ikinci yüzü pişmeye başlar (Level 3'ten itibaren) |
| **Aşağı kaydır** | Pişen krep tabağa kayar |
| **Malzeme düğmesi** | Seçilen malzeme tabaktaki kulenin en üstüne konur |
| **Ver** / **Boşalt** | Tabağı müşteriye verir / tabağı boşaltır |

Sipariş, aşağıdan yukarı okunan bir krep kulesidir (ör. *krep · çikolata · krep*). Tabak, kartla karşılaştırılır ve sonuç **PERFECT / GREAT / GOOD / OLMADI** olarak değerlendirilir. Pişme zamanlaması, hamur miktarı ve sıra doğruluğu sonucu etkiler. Müşterilerin bir sabır çubuğu vardır.

---

## Özellikler

- **Sonsuz seviye:** Seviye başına gereken müşteri sayısı ve zorluk, ayarlanabilir eğrilerden gelir (`src/lib/veri/seviye.json`). Kilometre taşlarında (10, 25, 50, 100, 250, 500, 1000) özel başlıklar çıkar; seviye atlama oyunu durdurmaz.
- **Kademeli açılışlar:** Çevirme (3), çikolata (5), çilek dilimi (8), çilek sosu ve çocuk müşteri (10), tereyağı (12), aynı anda 2 müşteri + 2. tava (15), kalınlık tercihi (20), eleştirmen (30), VIP ve fındık (50), 3 müşteri (75), yoğun saat (150)… Tam liste: [`docs/sonsuz-seviye.md`](docs/sonsuz-seviye.md#4-açılışlar-milestonelar).
- **Fişlerim (adisyonlar):** Kilometre taşlarında ve her 10. seviyede bir adisyon kaydedilir. Kod, Tauri uygulamasında **Rust** komutu `fis_olustur` ile `KRP-BBB-YXXXXXX` biçiminde üretilir; tarayıcıda çalışırken `WEB-…` yedek kodu kullanılır.
- **Canlı lobi:** Ana ekran oyunun kendi sahnesidir (aynı tava, tabak, duvar); büyük **OYNA** düğmesi sayfa/kamera değiştirmez, aynı sahne lobi durumundan oyun durumuna geçer.
- **Kayıt cihazda:** İlerleme, coin ve adisyonlar yalnızca `localStorage`'da, sürümlü JSON olarak tutulur; bozuk veya eski kayıtla oyun çökmez. Kişisel veri toplanmaz.
- **Geliştirici modu (🛠):** Oyunda seviye seçme, ±1/±10, MAX, ilerlemeyi sıfırlama; test seviyesi gerçek kaydı bozmaz (`bun run dev`'de açık, yayında `?dev=1`).
- **Ses ve tema:** Web Audio ile üretilen kısa efekt sesleri (ses dosyası yok); gece / gündüz teması.
- **Bilgi sayfaları:** Hakkında, İletişim, Kullanım Koşulları ve Gizlilik; Türkçe, İngilizce, Arapça ve Farsça (sağdan sola) olarak.

---

## Ekranlar

| Rota | Ekran |
|---|---|
| `/` | **Restoran sahnesi**: lobi durumu (LEVEL, coin, `?`, `⚙`, büyük **OYNA**) ve oyun durumu (sipariş fişleri, tava(lar), tabak, malzeme düğmeleri) aynı sayfada |
| `/fislerim` | **Fişlerim**: kaydedilen adisyonlar, en yenisi üstte |
| `/profil` | **Profil**: yerel ad, adisyon sayısı, bilgi sayfalarına bağlantılar |
| `/hakkinda`, `/iletisim`, `/kosullar`, `/gizlilik` | Bilgi sayfaları (`/en/…`, `/ar/…`, `/fa/…` sürümleriyle) |

Alt menü: **Oyna · Fişlerim · Profil**. Sayfa ağacı ve responsive kurallar: [`docs/mimari-agac.md`](docs/mimari-agac.md).

---

## Teknoloji Yığını

| Katman | Teknoloji | Projede kullanımı |
|---|---|---|
| Uygulama kabuğu | [Tauri v2](https://v2.tauri.app/) (Rust) | Masaüstü pencere (420×820, dikey) ve `fis_olustur` komutu |
| Web çatısı | [Astro 7](https://astro.build/) (`output: static`) | Dosya tabanlı rotalar, `ClientRouter` ile sayfa geçişleri, i18n |
| Arayüz | [Svelte 5](https://svelte.dev/) (Runes) | Lobi, oyun ekranı, Fişlerim, Profil |
| Oyun mantığı | TypeScript | `src/lib/oyun/` altında saf, test edilen kurallar |
| İçerik | [MDX](https://mdxjs.com/) | Çok dilli bilgi sayfaları |
| Paket yöneticisi ve test | [Bun](https://bun.sh/) | `bun install`, `bun test` |

Oyun motoru veya ek çalışma zamanı bağımlılığı kullanılmaz. Hedef platform Tauri masaüstü uygulaması ve tarayıcıdır; Android derlemesi planlanan bir görevdir ([`docs/gelistirme-plani.md`](docs/gelistirme-plani.md)).

---

## Mimari

- **Kurallar saf TypeScript'te**, ekranlar yalnızca gösterir: sipariş üretimi, pişirme, değerlendirme, ekonomi, seviye ve oturum mantığı `src/lib/oyun/*.ts` içindedir ve `bun test` ile test edilir.
- **Oyun sayıları JSON'da:** süreler, fiyatlar, seviye eğrileri, malzeme ve müşteri tanımları `src/lib/veri/*.json` dosyalarındadır; denge ayarı JSON düzenleyerek yapılır.
- **Tek oyun döngüsü:** `requestAnimationFrame` ve `dt` ile; animasyonlar `transform` / `opacity` ile yapılır.
- **Tohumlu rastgelelik:** aynı tohum aynı siparişleri üretir.
- **Rust köprüsü:** `src/lib/fisler.svelte.ts`, Tauri içindeyse `invoke("fis_olustur")`, değilse `WEB-` yedeğini kullanır.
- **Kayıt anahtarları:** `pancakeflip-ilerleme` (seviye, coin, müşteri), `pancakeflip-kayit` (adisyonlar).

Ayrıntılar: [`docs/oyun-mimarisi.md`](docs/oyun-mimarisi.md), [`docs/sonsuz-seviye.md`](docs/sonsuz-seviye.md).

---

## Kurulum ve Çalıştırma

**Gereksinimler:** [Bun](https://bun.sh/), [Rust ve Cargo](https://rustup.rs/) ve işletim sisteminize göre [Tauri önkoşulları](https://v2.tauri.app/start/prerequisites/) (yalnızca Tauri uygulaması için).

```bash
git clone https://github.com/RFKaya/pancake-flip.git
cd pancake-flip
bun install
```

| Komut | Ne yapar |
|---|---|
| `bun run dev` | Web geliştirme sunucusu: <http://127.0.0.1:1420> |
| `bun run tauri dev` | Tauri masaüstü penceresinde çalıştırır (ilk derleme uzun sürer) |
| `bun run build` | Statik sürümü `dist/` klasörüne derler |
| `bun run preview` | Derlenen sürümü yerelde sunar |
| `bun test` | Oyun mantığı testleri |
| `cargo test` (`src-tauri/` içinde) | Rust adisyon kodu testleri |

Ayrıntılı kurulum notları: [`docs/kurulum.md`](docs/kurulum.md).

---

## Proje Yapısı

| Yer | İçerik |
|---|---|
| `src/pages/` | Rotalar (`index.astro`, `fislerim.astro`, bilgi sayfaları) |
| `src/components/` | Svelte ekranları; oyun ekranı bileşenleri `src/components/oyun/` |
| `src/lib/oyun/` | Saf oyun mantığı ve testleri |
| `src/lib/veri/` | Oyun verileri (JSON) |
| `src/styles/app.css` | Renk token'ları (bkz. [`docs/branding.md`](docs/branding.md)) |
| `src-tauri/` | Tauri yapılandırması ve Rust kodu |

Tam klasör ağacı README'ye kopyalanmaz: [`docs/klasor-mimarisi.md`](docs/klasor-mimarisi.md).

---

## Geliştirme Süreci

- `master`'a doğrudan commit atılmaz; her iş `feature/…`, `fix/…` veya `docs/…` dalında yapılır ve PR ile birleştirilir.
- Commit mesajları `feat:`, `fix:`, `docs:` … ile başlar.
- Her PR öncesi `bun test` ve `bun run build` (0 hata) çalıştırılır.
- Birden fazla kişi/ajan aynı anda çalıştığı için ortak dosya ve iş bölümü kuralları uygulanır.

Kurallar: [`AGENTS.md`](AGENTS.md) · Ortak çalışma düzeni: [`docs/ortak-gelistirme.md`](docs/ortak-gelistirme.md) · Görev planı: [`docs/gelistirme-plani.md`](docs/gelistirme-plani.md)

---

## Dokümantasyon

| Belge | Konu |
|---|---|
| [`docs/proje-fikri.md`](docs/proje-fikri.md) | Proje fikri ve adisyon kodu biçimi |
| [`docs/oyun-tasarimi.md`](docs/oyun-tasarimi.md) | Oyun kuralları (GDD) |
| [`docs/sonsuz-seviye.md`](docs/sonsuz-seviye.md) | Sonsuz seviye, açılışlar, geliştirici modu |
| [`docs/oyun-mimarisi.md`](docs/oyun-mimarisi.md) | Oyun kod mimarisi |
| [`docs/mimari-agac.md`](docs/mimari-agac.md) | Sayfa ağacı ve responsive düzen |
| [`docs/klasor-mimarisi.md`](docs/klasor-mimarisi.md) | Klasör yapısı |
| [`docs/branding.md`](docs/branding.md) | Marka renkleri ve tipografi |
| [`docs/gelistirme-plani.md`](docs/gelistirme-plani.md) | Görevler ve kabul kriterleri |
| [`docs/ortak-gelistirme.md`](docs/ortak-gelistirme.md) | Ortak geliştirme düzeni |
| [`docs/kurulum.md`](docs/kurulum.md) · [`docs/kurallar.md`](docs/kurallar.md) · [`docs/teslim.md`](docs/teslim.md) · [`docs/kaynaklar.md`](docs/kaynaklar.md) | Kurulum, kurallar, teslim, kaynaklar |
| [`docs/tasks/week-3/`](docs/tasks/week-3/) | Haftalık görevler (eğitmenin dosyaları) |

---

## Akademik Bilgiler

<div align="center">

[![İSÜ](https://img.shields.io/badge/İSTİNYE_ÜNİVERSİTESİ-İSTANBUL-0080BB?style=for-the-badge&logo=google-chrome&logoColor=white)](https://www.istinye.edu.tr)
[![Qrofessor](https://img.shields.io/badge/Qrofessor-qrofessor.com-4361EE?style=for-the-badge&logo=google-chrome&logoColor=white)](https://qrofessor.com)

</div>

| Bilgi | Detay |
|:---|:---|
| **Kurum** | [**İstinye Üniversitesi**](https://www.istinye.edu.tr) |
| **Birim / Program** | **Meslek Yüksekokulu** — Bilişim Güvenliği Teknolojisi |
| **Ders Kodu & Adı** | `MYO063` — **Mobil Programlama** *(App Development)* |
| **Dönem** | `2026–2027 Güz` |
| **Ders Saati & Derslik** | Her Çarşamba `15:30 – 17:10` · **T-1B03** *(PC Lab.)* |
| **Öğretim Görevlisi** | **Öğr. Gör. Keyvan Arasteh Abbasabad** ([qrofessor.com ↗](https://qrofessor.com) · [GitHub ↗](https://github.com/keyvanarasteh) · [LinkedIn ↗](https://www.linkedin.com/in/keyvanarasteh/)) |
| **Eğitim Platformu** | [**qrofessor.com ↗**](https://qrofessor.com) *(Qrofessor Akademik Hub)* |
| **Blackboard Kursu** | Kurs Kodu: `2026–2027–1–11283–1` |
| **Şablon Depo** | [`keyvanarasteh/hello-mobil`](https://github.com/keyvanarasteh/hello-mobil) |
| **Proje Deposu** | [`RFKaya/pancake-flip`](https://github.com/RFKaya/pancake-flip) |

### Geliştiriciler

| Ad Soyad | Öğrenci No | GitHub |
|---|---|---|
| Rauf Fatih Kaya | `2520191004` | [@RFKaya](https://github.com/RFKaya) |
| Ada Mert Kızılırmak | `2520191019` | [@RedRiveRR](https://github.com/RedRiveRR) |

---

## Lisans

Bu proje [Apache License 2.0](LICENSE) ile lisanslanmıştır.
