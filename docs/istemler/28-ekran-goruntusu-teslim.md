# 28 — Vize ekran görüntüsü otomasyonu ve teslim paketleri

Tarih: 12.11.2026 · Dal: `feature/28-ekran-goruntusu-teslim`

## Araç ve model

Codex masaüstü uygulaması, GPT-6; Bun ve kurulu Chrome.

## Şartname

- **Amaç:** Hocanın istediği üç boyutta otomatik görüntüleri üretmek; `screenshots.zip` ve güncel kaynaklardan `proje.zip` dosyalarını masaüstüne bırakmak.
- **Kapsam dışı:** Oyun kuralları, yeni bağımlılıklar, gerçek oyuncu verileri, Blackboard yüklemesi ve GitHub ana dalına birleştirme. Tauri yerel ekranları web görüntüsü olarak taklit edilmez.
- **Kabul ölçütleri:** Tüm derlenen web rotaları ve web yönetim sekmeleri üç boyutta; kayıtsız izole Chrome profili; görüntü/taşma raporu; kaynakta otomasyon; bağımlılık/build içermeyen ZIP; build ve test başarılı.
- **Dokunulacak dosyalar:** `scripts/ekran-goruntuleri.mjs`, `package.json`, `.gitignore`, `docs/teslim.md`, `docs/klasor-mimarisi.md`, `docs/gelistirme-plani.md`, `docs/istemler/README.md`, `lat.md/gorevler.md`, bu günlük. `screenshots/` ve ZIP'ler üretilen, Git dışında kalan çıktılardır. Yerel birleştirmede #84 ve #85 kaynakları korunur.
- **Doğrulama:** `bun run screenshots`, görüntü incelemesi, `bun test`, `bun run check`, `bun run build`, `git diff --check`; ZIP içerik ve PNG boyutu denetimi.

## İstem

"bana yükleyeceğim screenshot zip ve proje zip dosyalarını oluştursana masaüstüne at ben alırım oradan."

## Plan ve onay

Yeni bağımlılık eklemeden Chrome ile tüm web sayfalarını üç boyutta yakalama, görüntüleri inceleme, kendi dalında otomasyon ve teslim belgeleri, iki ZIP'i masaüstüne bırakma planı sunuldu. Kullanıcı script'in ne olduğunu sorduktan sonra "tm yap abi" diyerek onayladı.

## Düzeltmeler

- #84 başka takım üyesi tarafından onaylı; yerel birleşik sürümde 129 test ve 58 sayfalık build başarılı. Otomatik onay denetimi, bu istek açıkça uzak ana dala birleştirmeyi yetkilendirmediği için GitHub merge işlemini reddetti. Uzak ana dala dokunulmadı; #84 ve #85 yalnız teslim dalında bir araya getirildi. Ortak günlük dizinindeki iki satır korundu.
- Görüntü kapsamı ve web/Tauri ayrımı [teslim belgesinde](../teslim.md#vize-teslimi) açıklanır.
- İlk çalıştırma: 58 rota, 80 senaryo × 3 boyut = 240 PNG; 0 yükleme/taşma/metin kesilmesi uyarısı. Görsel incelemede sabit alt menü uzun tam sayfa PNG'lerde ara metni örtüyordu. Betik menüyü yalnız çekimde belgenin sonuna yerleştirecek şekilde düzeltildi; ürün CSS'i değiştirilmedi. Yönetim menüsü seçili sekmeye kaydırılır.

## Doğrulama

- `bun test`: 129 geçti, 0 kaldı (birleşik kaynaklar).
- `bun run check`: 80 dosya; 0 hata, 0 uyarı, 0 ipucu.
- `bun run build`: 58 sayfa, Complete, çıkış 0.
- Son çekim, görüntü incelemesi ve ZIP denetimi sürüyor.
