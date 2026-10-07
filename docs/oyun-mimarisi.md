# Oyun Teknik Mimarisi — Pancake Flip!

> Bu belge oyunun **kod tarafındaki** modüllerini, veri dosyalarını ve teknik kararlarını tanımlar. Oyun kuralları için [`oyun-tasarimi.md`](oyun-tasarimi.md), klasörlerin genel görevleri için [`klasor-mimarisi.md`](klasor-mimarisi.md), sayfa ağacı için [`mimari-agac.md`](mimari-agac.md) dosyasına bakın. Bu belge onları tekrar etmez.

> **Sonsuz seviye (7 Ekim 2026):** Bölüm sistemi kaldırıldı; ilerleme artık sonsuz LEVEL'dir. Müşteri, sabır, zorluk eğrisi, açılışlar ve geliştirici modu için tek kaynak: [`sonsuz-seviye.md`](sonsuz-seviye.md). Bu belgedeki bölüm tabloları (§4 `Bolum`, `kuyruk.ts`) tarihsel taslaktır; çelişkide `sonsuz-seviye.md` geçerlidir.

> **Güncel durum (7 Ekim 2026):** Oyun şu an **tek arayüzle** çalışır: hedef sipariş kartı, yüzlü tava, büyük tabak ve ilerleme çubuğu (`src/components/oyun/ServisEkrani.svelte`). Müşteri slotları, sabır halkası ve süre baskısı (bu belgenin §7 ve ilgili kısımları) **henüz uygulanmadı**; eski müşterili ekran kaldırıldı. Karar verilirse G4'te geri getirilir. Kurallar (§3, §4, §6, §8) ve ekonomi (§9) geçerlidir.

---

## 1. Mevcut durum (7 Ekim 2026 analizi)

Repo, hocanın `hello-mobil` şablonunun ("PassoKlon") birebir kopyası.

| Konu | Durum | Ne yapacağız |
|---|---|---|
| Çatı | Tauri v2 + Astro (static, port 1420) + Svelte 5 (Runes) + React 19 + MDX, paket yöneticisi Bun | Aynen korunur. **Yeni çalışma zamanı bağımlılığı eklenmez.** |
| `src/layouts/Layout.astro` | Üst bar + alt menü + tema betiği + `ClientRouter` | Korunur; servis ekranında üst bar ve alt menüyü gizlemek için bir `tamEkran` özelliği eklenir. |
| `src/components/AppNav.svelte` | 5 sekmeli alt menü | Sekmeler: Bölümler, Fişlerim, Mutfak, Profil, Rehber |
| `src/components/Kesfet.svelte` | Arama + kategori filtresi + kart listesi | **Bolumler.svelte** için örnek alınır. |
| `src/pages/etkinlik/[id].astro` | `getStaticPaths` ile dinamik detay | **bolum/[id].astro** ve **servis/[id].astro** için aynı desen |
| `src/lib/biletler.svelte.ts` | Rust `invoke` + `isTauri()` yedeği + `localStorage` | **fisler.svelte.ts** için birebir desen |
| `src/lib/tema.svelte.ts` | Gece/gündüz teması | Aynen kullanılır. |
| `src-tauri/src/lib.rs` | `bilet_olustur(etkinlik_id)` → `PSK-…` | `fis_olustur(bolum_id, yildiz)` → `KRP-…` ([proje-fikri.md](proje-fikri.md#3-veri-modeli-ve-rust-kod-formatı)) |
| `src/lib/data.ts`, `sepet.svelte.ts`, `Sepet/Biletlerim/EtkinlikDetay.svelte` | Passo'ya özgü | Yeni ekranlar çalıştıktan sonra silinir (aynı PR'da değil, yerine geçen ekranın PR'ında). |
| `src/components/react/CanliRozet.tsx` | React örnek bileşen | Görev 06'daki etkileşimli bileşen için örnek olarak kalabilir. |
| Test altyapısı | Yok | `bun test` (Bun'a gömülü, bağımlılık gerekmez) |
| `src/types/` | Belgede var, klasör yok | Oyun tipleri için oluşturulur. |

---

## 2. Tasarım ilkeleri

1. **Saf mantık, ince arayüz.** Kuralların hepsi (sipariş üretme, değerlendirme, pişme, ekonomi) Svelte'e bağımlı olmayan saf TypeScript fonksiyonlarıdır. Bu sayede `bun test` ile test edilebilirler. Svelte bileşenleri yalnızca durumu gösterir ve dokunmaları iletir.
2. **Veri odaklı.** Malzeme, müşteri tipi, bölüm ve yükseltme değerleri kodda değil, `src/lib/veri/*.json` dosyalarındadır. Denge ayarı = JSON düzenlemek.
3. **Tek oyun döngüsü.** Bir `requestAnimationFrame` döngüsü `dt` (saniye, en fazla 0,1) ile bütün zamanlayıcıları ilerletir. `setTimeout` ile oyun mantığı yazılmaz; böylece duraklatma tek yerden çalışır.
4. **Tohumlu rastgelelik.** Bütün rastgele kararlar tek bir tohumlu üreteçten (`rng.ts`) gelir. Aynı tohum = aynı servis.
5. **Akıcılık.** Animasyonlar yalnızca `transform` ve `opacity` ile yapılır. Aynı anda en fazla ~20 parçacık. Android WebView'de 60 fps hedeflenir.

---

## 3. Yeni klasör ve dosyalar

Yalnızca yeni eklenen yerler (genel klasör ağacı [`klasor-mimarisi.md`](klasor-mimarisi.md)'de; `src/lib/veri/` ve `src/lib/oyun/` alt klasörleri orada da bir satırla belirtilecek):

```
src/types/oyun.ts                 # Malzeme, MusteriTipi, Bolum, Siparis, Tava, Tabak, Musteri, Fis, Kayit
src/lib/veri/                     # JSON: malzemeler, musteriler, bolumler, yukseltmeler, dekor
src/lib/oyun/                     # saf mantık (+ *.test.ts)
  rng.ts                          # tohumlu üreteç (mulberry32)
  siparis.ts                      # sipariş grameri, üretici, D hesabı
  pisirme.ts                      # tava durum makinesi (dök→yayıl→1. yüz→çevir→2. yüz→kay), çevirme penceresi, pişme bölgeleri
  hamur.ts                        # hamur miktarı, tolerans (PERFECT POUR)
  degerlendirme.ts                # Damerau-Levenshtein, hata listesi, kalite, sonuç
  ekonomi.ts                      # fiyat, ödeme, bahşiş, combo, net, yıldız eşikleri
  musteri.ts                      # sabır, ruh hali, tip davranışları, kaçma kararı
  seviye.ts                       # SONSUZ SEVİYE: gerekenMusteri, zorluk eğrisi, seviyeAyari, açılışlar, ilerlemeEkle
  oturum.ts                       # müşteri slotları, sabır, Ver → ilerleme/coin/seviye atlama (kuyruk.ts'in yerini aldı)
  servis.svelte.ts                # canlı servis durumu ($state sınıfı) + eylemler
  motor.ts                        # rAF döngüsü, duraklatma, görünürlük olayı
  jest.ts                         # (eski) dokunma / yukarı kaydırma; tava jestleri artık Tava.svelte içinde
  ses.ts                          # Web Audio ile sentez sesler
src/lib/kayit.svelte.ts           # sürümlü localStorage kaydı
src/lib/fisler.svelte.ts          # Rust fis_olustur + Fişlerim listesi
src/components/oyun/              # ServisEkrani, MusteriSlotu, SiparisKarti, Tava, Tabak,
                                  # MalzemeRafi, UstCubuk, SonucPenceresi, Geribildirim, Ogretici
src/components/                   # Bolumler, BolumDetay, Fislerim, Mutfak (Profil güncellenir)
```

---

## 4. Veri dosyaları (şema)

```ts
// src/types/oyun.ts (özet)
type Kategori = "krep" | "dolgu" | "sos" | "topping";
type PismeDerecesi = "az" | "orta" | "iyi";

interface Malzeme { id: string; ad: string; kategori: Kategori; acilis: number;
  maliyet: number; deger: number; ikon: string; renkDegiskeni: string; eriyor?: number }

interface MusteriTipi { id: string; acilis: number; sabir: number; odeme: number;
  bahsis: number; ceza: number; dKaydirma: number; dMax?: number; tatliMi?: boolean }

interface Bolum { id: number; musteriSayisi: number; eszamanli: 1|2|3;
  krep: [number, number]; d: [number, number]; tava: 1|2; tabak: 1|2;
  menu: string[];                       // en fazla 8 malzeme id'si
  pisme: "yok" | "agirlikli" | "esit";
  musteriAgirlik: Record<string, number>;
  kacmaRiski: number;                   // 0, 0.01, 0.02, 0.03
  yeni?: string;                        // bölüm detayında gösterilen yenilik anahtarı
  ogretici?: string;                    // öğretici senaryosu anahtarı
  ozel?: { ad: string; kosul: { tur: "gidenMax" | "elestirmenGreat" | "vipOlmadi" | "minYildiz"; deger: number } } }

interface SiparisParcasi { malzeme: string }      // aşağıdan yukarı
interface Siparis { parcalar: SiparisParcasi[]; pisme?: PismeDerecesi; d: number; tabakSayisi: 1|2 }
```

- `bolumler.json`, [oyun-tasarimi.md §12](oyun-tasarimi.md#12-50-bölümlük-ilerleme) tablosunun birebir verisidir. Tablo değişirse önce tasarım belgesi, sonra JSON güncellenir.
- Metinler (malzeme adları vb.) JSON'da **anahtar** olarak tutulur; Türkçe karşılıklar `src/lib/i18n/tr.ts` içindedir. Böylece tam sürümde dil eklemek kolaylaşır.

---

## 5. Servis durumu ve akış

```
ServisDurumu ($state)
├─ zaman, duraklatildi, bitti
├─ kuyruk: Musteri[]          (önceden üretilmiş; gelisZamani'na göre slota iner)
├─ slotlar: (Musteri|null)[3]
├─ tavalar: Tava[]            { durum: "bos"|"pisiyor"|"yanik", p, krepId }
├─ tabaklar: Tabak[]          { parcalar: {malzeme, pisme?}[], meşgulSn (sos dökme) }
├─ seciliTabak
├─ combo, coin (servis içi), olaylar[] (geri bildirim kuyruğu)
└─ istatistik

Eylemler: tavayaDokun(i) · tavayiCevir(i) · malzemeKoy(id) · tabakSec(i) · tabagiBosalt(i) · musteriyeVer(slot)
Her kare: motor → servis.ilerle(dt) → pisirme.ilerle / musteri.sabirAzalt / kuyruktan çıkar / bitti mi?
```

- `olaylar[]` kuyruğu ("perfect", "coin", "yanik", "gitti"…) arayüzdeki animasyon ve sesleri tetikler. Mantık, animasyonu beklemez.
- Servis bitince `SonucPenceresi` açılır, `fisler.fisKaydet(bolumId, yildiz, net)` çağrılır, kayda yazılır.

---

## 6. Dokunma ve mobil ayrıntılar

- `pointerdown/pointermove/pointerup` kullanılır (fare ve dokunmayı birlikte kapsar). Yukarı kaydırma: ≥ 40 px dikey hareket ve < 600 ms (`ayarlar.json` → `cevirmeMs`).
- Oyun alanında `touch-action: none`, `user-select: none`, `-webkit-tap-highlight-color: transparent`.
- Servis sayfası `client:only="svelte"` ile yüklenir (rAF ve `window` kullanır; SSR'de çalışmaz).
- `document.visibilitychange` → otomatik duraklatma.
- Güvenli alan: `env(safe-area-inset-*)` (şablonda zaten kullanılıyor).
- Tauri pencere boyutu dikey kalır (Görev 05'te `tauri.conf.json`).

---

## 7. Rust tarafı

```rust
#[tauri::command]
fn fis_olustur(bolum_id: u32, yildiz: u8) -> String {
    let zaman = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
    format!("KRP-{:03}-{}{:06X}", bolum_id, yildiz.min(3), zaman % 0xFF_FFFF)
}
```
- `invoke_handler` içinde `bilet_olustur` yerine `fis_olustur` kaydedilir.
- Format, `lib.rs` içinde küçük bir `#[cfg(test)]` testiyle doğrulanır (`cargo test`, öğrencinin bilgisayarında).
- JS tarafı: `invoke<string>("fis_olustur", { bolumId, yildiz })` (Rust'taki `bolum_id`, JS'te `bolumId` yazılır).

---

## 8. Test stratejisi

| Katman | Araç | Ne test edilir |
|---|---|---|
| Saf mantık | `bun test` | Üretici grameri hiç bozmaz (1.000 tohum), D hesabı, değerlendirme (eksik/fazla/yanlış/sıra), pişme bölgeleri, ekonomi örnekleri ([oyun-tasarimi.md §9.2](oyun-tasarimi.md#92-bir-siparişin-geliri) örneği birebir), kayıt göçü |
| Derleme | `bun run build` | 0 hata (her PR'da zorunlu) |
| Tip | `bunx svelte-check` | (zaten devDependency) uyarıları azaltmak |
| Rust | `cargo test` (src-tauri) | Adisyon kodu formatı |
| Elle | `bun run dev` + tarayıcı mobil görünümü (390×844), `bun run tauri dev` | Her oyun görevindeki "Test" maddeleri |

`package.json` içine yalnızca script eklenir: `"test": "bun test"`.
