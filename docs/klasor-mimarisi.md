# Klasör Mimarisi ve Dizin Rehberi

Bu belge, projenin temel dizin yapısını, önemli klasörlerin sorumluluklarını ve bunların ne zaman / nasıl kullanılacağını açıklar.

> 📌 **Dokümantasyon Kuralı:**
> Dizin yapısı yalnızca bu belgede tutulur; `README.md` veya `AGENTS.md` içine kopyalanmaz, buraya link verilir.
> Proje geliştikçe her münferit dosyayı buraya eklemeyin; ana klasörleri ve sorumluluk sınırlarını koruyun.

---

## 📂 Temel Dizin Mimarisi

```
pancake-flip/
├── package.json             # Bağımlılıklar, scriptler ve motor tanımları
├── astro.config.mjs         # Astro entegrasyonları (Svelte, React, MDX) ve Vite port ayarları
├── tsconfig.json            # TypeScript yapılandırması ve $lib alias'ı
├── .gitignore               # Versiyon kontrol dışı bırakılan dosyalar
│
├── public/                  # Statik varlıklar (Derlenmeyen logolar, favicon, görseller)
├── src-tauri/               # Rust Tauri çekirdeği (Pencere, yetkiler, native komutlar)
│   ├── tauri.conf.json      # Masaüstü/mobil pencere ayarları ve frontendDist hedefi
│   ├── Cargo.toml           # Rust kütüphaneleri ve bağımlılıkları
│   └── src/lib.rs           # Rust backend komutları ve uygulama giriş noktası
│
├── src/                     # Ön yüz kaynak kodları (Frontend)
│   ├── layouts/             # Sayfa iskeletleri (Layout.astro, ortak header/nav, ClientRouter)
│   ├── pages/               # Dosya tabanlı rota sistemi (URL rotaları: .astro, .mdx)
│   ├── components/          # Yeniden kullanılabilir UI bileşenleri (.svelte, .tsx)
│   ├── lib/                 # İş mantığı, mock veri, Svelte 5 state store'ları ($state)
│   │   ├── veri/            # Oyun değerleri (JSON): malzemeler, müşteriler, bölümler, yükseltmeler
│   │   └── oyun/            # Saf TypeScript oyun kuralları (Svelte yok, testlenebilir)
│   ├── types/               # TypeScript tip tanımları ve arayüzler (.ts)
│   └── styles/              # Global tema değişkenleri ve CSS stilleri (app.css)
│
└── docs/                    # Proje dokümantasyonu, görevler ve mimari rehberler
```

---

## 🛠️ Klasörlerin Kullanımı ve Sorumlulukları

### 1. `package.json` & `astro.config.mjs` (Kök Konfigürasyon)
- **`package.json`:** Projenin bağımlılıklarını (`dependencies`) ve `bun run dev`, `bun run build` gibi komutlarını barındırır.
- **`astro.config.mjs`:** Svelte, React, MDX gibi entegrasyonların ve Vite ayarlarının (Tauri portu `1420`, `$lib` aliası) yapıldığı merkezdir.

### 2. `public/` (Statik Varlıklar)
- **Ne konur?** Doğrudan derleme sürecine girmeden tarayıcıya sunulacak dosyalar (logolar, `favicon.png`, `robots.txt`, resimler).
- **Nasıl kullanılır?** Kod içinde `/logo.svg` veya `/favicon.png` şeklinde kök dizinden çağrılır.

### 3. `src-tauri/` (Native Çekirdek)
- **Ne konur?** Rust backend kodları (`src/lib.rs`), Cargo paketleri (`Cargo.toml`) ve uygulama pencere/izin ayarları (`tauri.conf.json`).
- **Ne zaman kullanılır?** İşletim sistemiyle konuşacak native kodlar (bilet oluşturma, dosya sistemi, bildirimler) yazılırken.

### 4. `src/layouts/` (Sayfa İskeletleri)
- **Ne konur?** Sayfaların ortak şablonları (`Layout.astro`).
- **Ne zaman kullanılır?** Üst bar, alt gezinme menüsü, tema kontrolü (`document.documentElement.dataset.tema`) ve yumuşak sayfa geçişleri (`<ClientRouter />`) burada tanımlanır. Sayfalar bu layout'u sarmalar.

### 5. `src/pages/` (Dosya Tabanlı Rotalar)
- **Ne konur?** Kullanıcının tarayıcıda veya mobil ekranda gezeceği sayfalar (`index.astro`, `biletlerim.astro`, `etkinlik/[id].astro`, `hakkinda.mdx`).
- **Kural:** Dosya adı doğrudan URL yolu olur. İçerik ağırlıklı sayfalar için `.mdx`, dinamik veya bileşen içeren sayfalar için `.astro` kullanılır.

### 6. `src/components/` (Yeniden Kullanılabilir UI Bileşenleri)
- **Ne konur?** Butonlar, kartlar, formlar, üst/alt barlar (`.svelte` veya `.tsx`).
- **Kural:** Birden fazla sayfada tekrar eden veya bağımsız bir işlevi olan görsel parçalar burada toplanır. Svelte veya React ile yazılabilir.

### 7. `src/lib/` (Durum ve İş Mantığı)
- **Ne konur?** Svelte 5 `$state` store'ları (sepet, biletler, tema), mock veriler (`data.ts`) ve Rust invoke çağrıları.
- **Nasıl import edilir?** `$lib/data` veya `$lib/sepet.svelte` şeklinde doğrudan alias ile çağrılır.

### 8. `src/types/` (Tip Tanımları)
- **Ne konur?** Projede kullanılan TypeScript arayüzleri (`interface`) ve tipleri (`type`). Veri modelleri karmaşıklaştıkça tipler bu klasörde toplanır.

### 9. `src/styles/` (Tasarım ve Stiller)
- **Ne konur?** `app.css` ve tema tanımları.
- **Kural:** Renkler CSS değişkeni (`--renk-ana`, `--zemin`, `--kart`) olarak burada tanımlanır; ad-hoc renk yazılmaz.

### 10. `docs/` (Dokümantasyon)
- **Ne konur?** Mimari kararlar, marka renkleri, görev kılavuzları ve proje planları.
