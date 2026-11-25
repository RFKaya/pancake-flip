# 27 — README oynanış videosu

Tarih: 12.11.2026 · Dal: `feature/27-readme-oynanis-videosu`

## Araç ve model

Codex masaüstü uygulaması, GPT-6; tarayıcı incelemesi ve Bun.

## Şartname

- **Amaç:** README üzerinden gerçek oynanış kaydını izlemek veya indirmek.
- **Kapsam dışı:** Oyun kodu, sayılar, bağımlılıklar ve eğitmenin görev dosyaları.
- **Kabul ölçütleri:** Gerçek MP4 ve geçerli README bağlantıları; içindekiler bağlantısı; build ve test başarılı.
- **Dokunulacak dosyalar:** `README.md`, `docs/gorseller/oynanis.mp4`, `docs/klasor-mimarisi.md`, `docs/gelistirme-plani.md`, `lat.md/gorevler.md`, bu günlük ve `docs/istemler/README.md`.
- **Doğrulama adımları:** Video metadata ve farklı zamanlardaki kareleri incele; kaynak ve kopya hash değerlerini karşılaştır; bağlantıları kontrol et; `bun test`, `bun run check`, `bun run build`, `git diff --check` çalıştır.

## İstem

Kullanıcı README oynanış videosu görevini istedi. Önce kaydı ajanın almasını istedi; araç sorunlarından sonra kendisi kaydedip yerel MP4 yolunu paylaştı: "kaydettim bak bakim".

## Plan ve onay

README'ye video bölümü ve içindekiler bağlantısı, ayrı feature dalı, görev ve günlük güncellemeleri, doğrulama ve PR planı sunuldu. Kullanıcı "sen çeksene" ve "Devam et" diyerek çalışmanın sürdürülmesini istedi; ardından kayıt işini kendisi üstlendi.

## Düzeltmeler

- Ajanın Windows ve Chrome kayıt denemeleri tamamlanmadı. Geçici yardımcılar yalnızca göz ardı edilen `dist/` içinde; ürün koduna ve bağımlılıklara eklenmedi.
- Kullanıcının 23:04:39 tarihli ekran kaydı aynen kopyalandı; kurgu veya yapay oynanış yok.
- MP4: 33,3 saniye, 480×1148, 9.786.232 bayt. Başlangıç, dökme, çevirme, tabağa alma ve LEVEL 4 bildirimi farklı zaman karelerinde görüldü. Üst LEVEL/para alanı kadraj dışında; README bunu açıklar. Ses dinlenmedi.
- Açık yönetim paneli PR #84 ile ortak dosyalarda yalnız bu görevin satırları değiştirildi; panel çalışması kapsam dışıdır. Günlük dizininde #84'ün 26 numaralı kaydı korunarak birleştirilmelidir.

## Doğrulama

- `bun test`: 120 geçti, 0 kaldı.
- `bun run check`: 78 dosya; 0 hata, 0 uyarı, 0 ipucu.
- `bun run build`: 58 sayfa, Complete, çıkış 0.
- Kaynak ve kopya SHA256: `103715F0F3EF59F9561598B40C51B7D52CC11802B67C7FA49E56C60CCC52212B`.
- `git diff --check`: temiz. Video, poster ve içindekiler hedefleri mevcut.
- Videonun 1, 6, 12, 18, 24 ve 31,3 saniyelerindeki kareleri incelendi; oyun dışı pencere veya kişisel bilgi görülmedi. Tam sesli izleme ve Tauri testi yapılmadı.
