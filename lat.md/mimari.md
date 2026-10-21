# Mimari

Tek kod tabanı üç katmandan oluşur: Astro statik sayfaları, Svelte 5 adaları ve Tauri v2 kabuğu. Rust yalnız adisyon komutlarını sağlar; oyunun bütün kuralları saf TypeScript'tedir.

## Katmanlar

Astro `output: 'static'` ile 56 sayfa üretir; etkileşimli parçalar `client:load` ve `client:only` adalarıdır. Tauri aynı çıktıyı yerel WebView'da 420×820 dikey pencerede gösterir. Paket yöneticisi Bun'dır (`bun run dev`, `bun test`, `bun run build`).

- Sayfalar ve rotalar: `src/pages/` (Türkçe kökte, `en`, `ar`, `fa` önekli).
- Bileşenler: `src/components/` (Svelte 5 Runes) ve ortak kart/durum bileşenleri `src/lib/components/ui/`.
- Saf mantık: `src/lib/oyun/` (Svelte'e bağımlı değil, test edilebilir).
- Veri: `src/lib/veri/*.json`; tipler: `src/lib/types/`.
- Doğrulama: `bun run check`, `bun test`, `bun run build`.

## native.ts tek kapı

Tauri `invoke` ve `isTauri` yalnız [[src/lib/native.ts]] içinde kullanılır. `fisOlustur` ve `fisCoz` istisna fırlatmaz; `{ ok: true, veri }` ya da `{ ok: false, hata }` döner. Tarayıcıda Rust yokken `WEB-` yedeği üretilir, kod çözme kapalıdır ([[platform#Tarayıcı yedekleri]]).

Bileşenler platform adını kendileri sorgulamaz; `destekleniyorMu(ozellik)` kullanır ([[src/lib/native.ts#destekleniyorMu]]).

## Tek oyun döngüsü

Oyun tek `requestAnimationFrame` döngüsünde ilerler; `dt` en fazla 0,1 sn'dir ve bütün zamanlayıcılar bu `dt` ile yürür. `setTimeout` oyun mantığı için kullanılmaz, böylece duraklatma ve sekme değişimi tek yerden yönetilir ([[src/components/oyun/Restoran.svelte]]).

Bileşenler yalnız gösterir ve dokunmayı iletir; kurallar saf fonksiyonlarda kalır ([[oyun-mekanigi#Tabak ve otomatik servis]]). Rastgelelik tek tohumlu üreteçten gelir ([[src/lib/oyun/rng.ts]]); aynı tohum aynı servisi verir.

## Değişmez kararlar

Projenin değişmeyen kısa kural listesi; yeni özellik bunlara uyar.

- Oyun motoru yok: sahne CSS/SVG ve Svelte ile çizilir; yeni çalışma zamanı bağımlılığı eklenmez.
- Oyun sayıları kodda sabit değildir; süre, fiyat ve olasılıklar JSON'dadır ([[veri#Veri dosyaları]]).
- Yeni veri alanı önce `src/lib/types/` içinde tanımlanır ([[veri#Tip sözleşmesi]]).
- Renkler yalnız CSS değişkenleridir; marka kuralları `docs/branding.md` dosyasındadır.
- Doküman tekrarı yoktur: ayrıntı `docs/` altındaki tek kaynağa bağlanır ([[AGENTS.md]]).
