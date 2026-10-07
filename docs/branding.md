# Pancake Flip! — Marka ve Tasarım Kılavuzu

Ton: sıcak, iştah açıcı, sevimli. Krem zemin, karamel ana renk, çilek vurgu, nane (başarı).
Bu belge **tek doğru kaynaktır**; değerler [`src/styles/app.css`](../src/styles/app.css) içinde `:root` ve `:root[data-tema="gece"]` altında birebir aynıdır. Koda ad-hoc renk yazılmaz, yalnızca bu değişkenler kullanılır.

## 1. Marka Renk Paleti

Kontrast, WCAG göreli parlaklık formülüyle **ölçülmüştür**; metin için hedef ≥ 4,5:1.

| Token | Açık (gündüz) | Koyu (gece) | Kullanım yeri | Kontrast (açık / koyu) |
|---|---|---|---|---|
| `--renk-ana` (karamel) | `#B45309` | `#F59E0B` | Butonlar, aktif sekme, marka vurgusu | 4,76 / 8,36 (zemin üzerinde) |
| `--renk-ana-yazi` | `#FFFFFF` | `#1E1510` | `--renk-ana` zemin üstündeki yazı | 5,02 / 8,36 |
| `--renk-koyu` | `#3B2416` | `#120C08` | Üst bar arka planı | `--ust-yazi` ile 13,72 / 17,66 |
| `--renk-logo` | `#F59E0B` | `#F59E0B` | Logodaki "flip" yazısı (üst bar üstünde) | 6,74 / 9,04 |
| `--ust-yazi` | `#FFF8EC` | `#FFF8EC` | Üst bar yazısı ve ikonları | 13,72 / 17,66 |
| `--zemin` | `#FFF8EC` | `#1E1510` | Sayfa genel arka planı | — |
| `--kart` | `#FFFFFF` | `#2A1F18` | Liste kartları, form alanları | — |
| `--yazi` | `#3B2416` | `#FDF3E3` | Başlıklar ve okunabilir metin | 13,72 / 16,33 (zemin), 14,48 / 14,61 (kart) |
| `--yazi-soluk` | `#7A5A45` | `#C9B09A` | Açıklamalar, etiketler | 5,89 / 8,68 (zemin), 6,22 / 7,77 (kart) |
| `--kenar` | `#EBD9C3` | `#4A3628` | Çizgiler, kart sınırları (metin değil) | — |
| `--vurgu` (çilek) | `#BE123C` | `#FB7185` | Hata, kırmızı uyarı, kaçırılan sipariş | 5,95 / 6,67 (zemin), 6,29 / 5,97 (kart) |
| `--basari` (nane) | `#0F766E` | `#2DD4BF` | Başarı, onay işareti, PERFECT | 5,18 / 9,64 (zemin), 5,47 / 8,63 (kart) |

### Oyun renkleri (gündüz ve gece aynı)

Krebin pişme rengi ve tava halkasının gri bölgesi. Halkanın diğer bölgeleri mevcut tokenlardır: sarı `--krep-az`, yeşil `--basari`, turuncu `--renk-ana`, kırmızı `--vurgu`. Pişme durumu yalnızca renkle değil, harf ve duman/damla ile de belli edilir.

| Token | Hex | Kullanım yeri |
|---|---|---|
| `--krep-cig` | `#F3E3C3` | Çiğ krep (soluk krem) |
| `--krep-az` | `#F2D272` | Az pişmiş krep, halkada sarı bölge |
| `--krep-orta` | `#D99A2B` | Tam kıvam krep (altın) |
| `--krep-iyi` | `#A8641C` | İyi pişmiş krep (kahve) |
| `--krep-fazla` | `#5A3216` | Fazla pişmiş krep (koyu kahve) |
| `--krep-yanik` | `#1F1511` | Yanık krep |
| `--halka-gri` | `#B8A99A` | Tava halkasında çiğ bölge |

## 2. Tipografi ve Yuvarlaklık

- **Yazı Tipi (Font):** System UI (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`)
- **Köşe Yuvarlaklığı (`--radius`):** `14px`

## 3. Logo ve İkon Tanımı

- **Logo metni:** `pancake<span>flip</span>` ([`AppHeader.svelte`](../src/components/AppHeader.svelte)); pencere başlığı "Pancake Flip!", `productName` "pancake-flip", identifier `edu.istinye.pancakeflip`.
- **Sembol:** üst üste 3 krep, üstte damlayan karamel sos ve çilek, düz renkli.
- **Logo dosyası:** [`public/logo.svg`](../public/logo.svg) (ikonun kaynağı; renkleri yukarıdaki paletten alınmıştır).
- **Web:** `public/favicon.png` (256 px), `public/apple-touch-icon.png` (180 px).
- **Tauri ikonları:** kaynak `src-tauri/icons/app-icon.png` (1024×1024, şeffaf arka plan); `bun run tauri icon src-tauri/icons/app-icon.png` ile Windows, macOS, Linux, Android (`icons/android/`) ve iOS (`icons/ios/`) setleri üretilir.
- **Slogan:** Müşteri bekliyor, krep yanıyor: çevir, diz, yetiştir!

> Not: Planda metin tokenı `--metin` olarak geçer; hocanın şablonu ve puan tablosu `--yazi` adını kullandığı için **`--yazi`** esas alındı.
