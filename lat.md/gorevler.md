# Görevler ve Durum

Ders planı fazlara ayrılır; her görev kendi dalında ve PR ile yapılır. Bu bölüm bugünkü durumu ve açık işleri tutar; ayrıntılı plan `docs/gelistirme-plani.md` dosyasındadır.

## Tamamlananlar

Hafta 3 teslimi (Faz 0) kapandı ve `v0.1.0-batch-01` etiketi atıldı; Hafta 4 görevleri 10–16 birleşti ve `v0.2.0-batch-02` etiketi atıldı. Hafta 5'te dil kuralı, lat.md, yönetim panelinin ilk üç aşaması ve izinler geldi.

| Aşama | Durum |
|---|---|
| Faz 0 — Hafta 3 (8 görev) | tamam, etiketli (`v0.1.0-batch-01`) |
| 09.1 master koruması | tamam, kural seti etkin (PR #61, #69, #70) |
| 10–16 — Hafta 4 | tamam, etiketli (`v0.2.0-batch-02`, PR #62–#67, #74) |
| Oyun çekirdeği, sonsuz seviye, fişler, rehber, profil | uygulandı |
| Derleme uyarıları, lat.md | tamam (PR #72, #73) |
| AGENTS.md Çince/Japonca karakter yasağı | tamam (PR #75) |
| Yönetim paneli 1/4, 2/4, 3/4 | tamam (PR #76, #77, #78) |
| Yetkiler: bildirim izni ve `/izinler` | tamam (eğitmen PR #79, belge uyumu PR #80) |

## Açık işler

Bugün açık olan işler, bekleyen kararlar ve planlanan özellikler aşağıdadır.

- Yönetim paneli 4/4: Oyuncular, Fişler, Şüpheli Kayıtlar, Denetim Günlüğü. Hafta 5 son tarihi 27.10.2026 geçti; henüz başlamadı.
- Panelde yayınlanan ayarlar oyuna yansımaz: oyun JSON'dan okur, panel veritabanına yazar ([[mimari#Yerel arka uç]]).
- Gerçek Tauri uygulamasında panel ve `/izinler` elle denenmedi; PR'lar yalnız tarayıcıda ve sahte `invoke` ile doğrulandı.
- Teslim: güncel `master` üzerinden ZIP indirilip Blackboard'a yüklenmeli.
- README'ye oynanış videosu eklenecek; ekran görüntüleri README'de, video elle kaydedilmeli.
- Planlanan: F1 ikinci tabak, F2 ileri müşteriler, F4 dekor, F5 oyun içi dört dil + RTL, F6 başarımlar, F7 Android derlemesi, F8 sonsuz servis.

## Çalışma akışı

Sıra değişmez: şartname → plan onayı → değişiklik → doğrulama → istem günlüğü. Dal adı `feature/…`, `fix/…` ya da `docs/…` olur; `master`'a doğrudan commit atılmaz ve bir dal bir PR'dır ([[AGENTS.md]], [[docs/gelistirme-plani.md]]).

PR'lar `master` korumasıyla girer: 1 onay gerekir ([[docs/kurallar.md]]). İş bitmeden `bun run check`, `bun test` ve `bun run build` yeşil olmalıdır. Her görevin kaydı `docs/istemler/NN-kisa-ad.md` dosyasına yazılır.
