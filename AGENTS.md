# AGENTS.md — Pancake Flip!

Bu belge, bu depoda çalışan tüm yapay zeka ajanları (Antigravity, Claude, Cursor, Gemini) için bağlayıcı geliştirme kurallarını içerir.

Proje: "Pancake Flip!", krep dükkânında zamana karşı sipariş hazırlanan dikey (9:16) mobil oyun. İstinye Üniversitesi MYO063 Mobil Programlama dersi ödevidir; hocanın kuralları her şeyin üstündedir.

## 1. Dokümantasyon ve Tek Kaynak Kuralı (DRY Docs)

- **Dokümanlar Tekrarlanmaz, Link Edilir:** Ajan hiçbir zaman dizin ağaçlarını, kuralları veya renk tablolarını dosyalar arasında kopyalamaz. İlgili konularda daima `docs/` altındaki tek doğru kaynağa link verir.
- Aşağıdaki belgeler bağlayıcı standartlardır:

| Doküman | Kapsam | Bağlayıcı Kural |
|---|---|---|
| [`docs/proje-fikri.md`](docs/proje-fikri.md) | Proje Konsepti | İş mantığı ve veri modelleri projenin amacına uygun olmalı. |
| [`docs/oyun-tasarimi.md`](docs/oyun-tasarimi.md) | Oyun kuralları ve sayılar | Tasarımda olmayan özellik eklenmez; sayı değişirse bu belge de güncellenir. |
| [`docs/sonsuz-seviye.md`](docs/sonsuz-seviye.md) | Sonsuz LEVEL ilerlemesi, zorluk eğrisi, geliştirici modu | Bölüm yoktur; ilerleme LEVEL'dir. Seviye sayıları `seviye.json`'dadır. |
| [`docs/veri-modeli.md`](docs/veri-modeli.md) | Veri sözleşmesi (tipler, alanlar, ilişkiler) | Yeni veri alanı önce `src/lib/types/` içinde tanımlanır. |
| [`docs/oyun-mimarisi.md`](docs/oyun-mimarisi.md) | Oyun kod mimarisi | Kurallar saf TypeScript'te, bileşenler yalnızca gösterir. |
| [`docs/gelistirme-plani.md`](docs/gelistirme-plani.md) | Görevler, dallar, kabul kriterleri | Oturum başına tek görev; bitince kutu `[x]` yapılır. |
| [`docs/sonnet-talimati.md`](docs/sonnet-talimati.md) | Ajan oturum talimatı | Her oturumun başında okunur ve birebir uygulanır. |
| [`docs/ortak-gelistirme.md`](docs/ortak-gelistirme.md) | Birden fazla kişi/ajan ile ortak çalışma | Her oturumun başında oku: fetch/pull, açık PR kontrolü, sıcak dosyalar, "kimde ne var" tablosu. |
| [`docs/klasor-mimarisi.md`](docs/klasor-mimarisi.md) | Dizin & Dosya Yapısı | Klasör mimarisi yalnızca bu belgede tanımlanır. Yeni dosya eklerken bu hiyerarşiye uy. |
| [`docs/branding.md`](docs/branding.md) | Marka Kimliği ve Renkler | UI geliştirirken ad-hoc renk uydurma, `branding.md` ve CSS değişkenlerini kullan. |
| [`docs/mimari-agac.md`](docs/mimari-agac.md) | Sayfa & Özellik Haritası | Yeni sayfa veya yönlendirme eklerken mimari ağaca sadık kal. |
| [`docs/gelistirme-notlari.md`](docs/gelistirme-notlari.md) | Geliştirme notları | Liste hâlleri `?durum=` ile elle denenir; yeni liste ekranı veriyi `src/lib/yukleyici.ts` üzerinden alır. |
| [`docs/kurulum.md`](docs/kurulum.md) | Kurulum | Ortam kurulumu bu belgeye göre yapılır. |
| [`docs/kurallar.md`](docs/kurallar.md) | Git akışı ve kod kuralları | Ayrıntılı kurallar burada tutulur. |
| [`docs/teslim.md`](docs/teslim.md) | Teslim süreci | Teslim adımları bu belgeye göre izlenir. |
| [`docs/gorev-sartnamesi.md`](docs/gorev-sartnamesi.md) | Görev şartnamesi şablonu | Her görev bu şablonla başlar (Amaç, Kapsam dışı, Kabul ölçütleri, Dokunulacak dosyalar, Doğrulama adımları). |
| [`docs/istemler/README.md`](docs/istemler/README.md) | İstem günlüğü | Her görev için `docs/istemler/NN-kisa-ad.md` kaydı tutulur: araç/model, istem, plan, düzeltmeler, doğrulama. |
| [`docs/ajan-uyum-testi.md`](docs/ajan-uyum-testi.md) | Ajan uyum testi kaydı | Kurallara uyum bu belgedeki komutlarla doğrulanır ve sonuç kayda geçirilir. |
| [`docs/kaynaklar.md`](docs/kaynaklar.md) | Kaynaklar | Dış kaynaklar burada toplanır. |
| [`docs/tasks/`](docs/tasks/) | Hocanın görev dosyaları | **Hocanındır, düzenlenmez.** Çelişkide hocanınki geçerlidir. |

## 2. Teknoloji Yığını ve Çalıştırma

- **Çekirdek:** Tauri v2 (Rust) + Astro (Statik)
- **Arayüz:** Svelte 5 (Runes: `$state`, `$derived`, `$props`), React 19 bileşenleri, MDX dokümantasyonu
- **Oyun motoru yok:** Oyun Svelte + CSS/SVG ile yapılır.
- **Paket Yöneticisi:** Bun
- **Geliştirme Sunucusu:** `bun run dev` (127.0.0.1:1420)
- **Tauri Uygulaması:** `bun run tauri dev`
- **Derleme / Doğrulama:** `bun run build`
- **Test:** `bun test` (mantık kodu eklendikten sonra)

## 3. Git ve Geliştirme Disiplini (Zorunlu)

1. **Doğrudan `master`/`main`'e commit atılmaz!**
   - Her yeni özellik veya düzeltme için `feature/<ozellik-adi>` veya `fix/<hata-adi>` dalı açılmalıdır.
   - Bir dal = bir görev = bir Pull Request (PR). Değişiklikler test edildikten sonra PR ile ana dala birleştirilir.
   - Force-push yapılmaz, geçmiş yeniden yazılmaz.
2. **Kanıtsız Teslim Yapılmaz:**
   - Her değişiklikten sonra `bun run build` çalıştırılmalı ve derlemenin 0 hata ile tamamlandığı doğrulanmalıdır.
3. **Kapsam Koruma (Scope Guard):**
   - Yalnızca görevin gerektirdiği dosyalar düzenlenmelidir. İstenmeyen dosyalarda "temizlik" veya izinsiz büyük refactoring yapılmaz.
4. **Commit mesajları** `feat:`, `fix:` veya `docs:` ile başlar.
5. **PR güvenliği:** `master` korumalıdır; dışarıdan gelen PR'ların nasıl inceleneceği [`docs/kurallar.md` → PR güvenliği](docs/kurallar.md#pr-güvenliği) bölümündedir.

## 4. Çalışma Döngüsü

Her görev şu sırayla yapılır; adım atlanmaz:

1. **Şartname:** görev [`docs/gorev-sartnamesi.md`](docs/gorev-sartnamesi.md) şablonuyla doldurulur.
2. **Plan önce:** ajan değişiklik yapmadan önce planını (değişecek dosyalar, yaklaşım, riskler) sunar ve **onay bekler**. Onay gelmeden dosya değiştirilmez.
3. **Değişiklik:** onaydan sonra yalnız şartnamedeki dosyalar değiştirilir; her görev kendi dalında (`feature/NN-kisa-ad`) ve tek PR ile yapılır.
4. **Doğrulama:** `bun run build` 0 hata vermeden ve `bun test` geçmeden iş "bitti" denmez. Elle deneme adımları yapılır.
5. **Günlük:** istem, plan, düzeltmeler ve doğrulama sonucu `docs/istemler/NN-kisa-ad.md` dosyasına yazılır.

## 5. Kod Yazım Kuralları

- Svelte kodlarında Svelte 5 Runes (`$state`, `$derived`, `$props`, `$effect`) kullanılır. Eski Svelte 4 sözdizimi (`export let`, `$:`) kullanılmaz.
- Sayfa bileşenlerinde SSR güvenliği gözetilmeli; `window`, `localStorage` ve `requestAnimationFrame` erişimleri yalnızca istemcide veya korumalı (`typeof window !== 'undefined'`) yapılmalıdır. Oyun ekranı `client:only="svelte"` ile yüklenir.
- **Oyun değerleri JSON'da:** Süre, fiyat, olasılık gibi sayılar kodda sabit yazılmaz; `src/lib/veri/*.json` içinde durur.
- **Veri tipleri tek yerde:** Yeni veri alanı önce `src/lib/types/` içinde tanımlanır ([`docs/veri-modeli.md`](docs/veri-modeli.md)); bileşen ya da store içinde tip tanımlanmaz, `any` kullanılmaz.
- **Kurallar saf TypeScript'te** (`src/lib/oyun/*.ts`); Svelte bileşenleri yalnızca gösterir ve dokunmayı iletir.
- Renkler yalnızca CSS değişkenleriyle kullanılır ([`docs/branding.md`](docs/branding.md)); ad-hoc hex yazılmaz.

## 6. Kırmızı Çizgiler

- **Yeni bağımlılık (npm / cargo) eklenmez.** Gerekli görülürse dur ve öğrenciye sor.
- `docs/tasks/` klasörü düzenlenmez.
- Başka oyunlardan veya markalardan görsel, ses ya da isim kopyalanmaz; yer tutucu olarak emoji, CSS şekilleri ve kendi çizilen SVG kullanılır.
- Blackboard'a, forma veya GitHub ayarlarına hiçbir şey gönderilmez.
