# 25 — README'ye Ekran Görüntüleri (video bekliyor)

Dal: `feature/readme-gorsel-video` · Tarih: 12.11.2026 · Kaynak: PR #81 ("README'ye görsel ve video görevi ekle"), kullanıcı isteği

## Araç ve model

Claude Code (masaüstü uygulaması), model Claude Sonnet 5.5.

## Şartname

- **Amaç:** README'de oyunu gösteren ekran görüntüleri olsun; bakan kişi oyunu çalıştırmadan lobi, servis, rehber, profil, gece teması ve yönetim panelini görsün.
- **Kapsam dışı:** Oynanış videosu (aşağıya bak), oyun ve panel kodu, yeni bağımlılık, hocanın `docs/tasks/` dosyaları.
- **Kabul ölçütleri:** `docs/gorseller/` altında 6 görüntü; README'de "Ekran Görüntüleri" bölümü ve içindekiler satırı; görsel yolları çözülür; görüntülerde geliştirme araç çubuğu ve kişisel bilgi yok; `astro build` 0 hata.
- **Dokunulan dosyalar:** `README.md`, `docs/gorseller/*.png` (yeni), `docs/klasor-mimarisi.md`, `docs/gelistirme-plani.md`, `lat.md/gorevler.md`, bu günlük, `docs/istemler/README.md`.
- **Doğrulama adımları:** görüntüleri tek tek aç ve kontrol et; README'deki yolların dosya olarak var olduğunu denetle; `astro build`.

## İstem

```text
rfkaya şu anda yapamıyor her şeyi biz yapıcaz yani sen yap bitir
```

Öncesinde araç planı sundu: ekran görüntüleri + GIF/video; video için MP4'ü öğrencinin kaydetmesi önerildi.

## Plan (değişiklikten önce)

1. Yerel geliştirme sunucusunu aç (`astro dev`, 127.0.0.1:1420), 420×820 dikey görünümde sayfaları gez.
2. Görüntüleri `docs/gorseller/` altına kaydet; README'ye üçerli iki satırlık tablo olarak koy.
3. Videoyu yapma: araç ekran kaydı alamıyor (Chrome eklentisi bağlı değildi, `ffmpeg` yok); görev planda açık kalır.

## Düzeltmeler

- Chrome eklentisi bağlı olmadığı için ekran görüntüleri başsız (headless) Chrome'un uzaktan hata ayıklama arayüzüyle (CDP) alındı. Geçici bir Node betiğiydi, yeni bağımlılık yok ve repoya konmadı.
- İlk çekimde görüntülerin altında Astro'nun geliştirme araç çubuğu görünüyordu; betik çekmeden önce onu sayfadan kaldıracak şekilde değiştirilip hepsi yeniden çekildi.
- Aynı görevi plan tablosunda ikiye böldüm: görseller `[x]`, video `[ ]`. Tek satırı yarım işle işaretlemek yerine açık işi görünür tuttum.

## Doğrulama

```text
görüntüler                  → 6 dosya, hepsi açıldı ve gözle kontrol edildi (lobi, servis, rehber, profil, gece, panel)
README görsel yolları       → 6/6 dosya var
astro build                 → Complete
```

Görüntüler tarayıcıdan alındı; gerçek Tauri penceresinde alınmadı. Yönetim paneli görüntüsü tarayıcı görünümüdür (giriş ve oyuncu verisi yok, yalnız "Oyun içeriği").

## Video neden yok

Oynanış videosu için ekran kaydı gerekir; bu makinede bunu alacak araç yok (Chrome eklentisi bağlı değil, `ffmpeg` kurulu değil). Plan tablosunda ayrı bir açık iş olarak duruyor. Kaydı bir kişi elle alıp (ör. Windows `Win+G` ya da telefondan) README'ye bağlantı olarak ekleyebilir; büyük MP4'ü repoya koymak yerine bağlantı önerilir.
