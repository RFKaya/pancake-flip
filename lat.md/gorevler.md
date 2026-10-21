# Görevler ve Durum

Ders planı fazlara ayrılır; her görev kendi dalında ve PR ile yapılır. Bu bölüm bugünkü durumu ve açık işleri tutar; ayrıntılı plan `docs/gelistirme-plani.md` dosyasındadır.

## Tamamlananlar

Hafta 3 teslimi (Faz 0) sekiz görevle kapandı ve `v0.1.0-batch-01` etiketi atıldı; Hafta 4 görevleri 10–15, PR #62–#67 ile birleşti. Oyun artık sonsuz seviye, adisyon, rehber ve profil ekranlarıyla çalışıyor.

| Aşama | Durum |
|---|---|
| Faz 0 — Hafta 3 (8 görev) | tamam, etiketli |
| 09.1 master koruması | belge tamam, GitHub ayarları açık |
| 10–15 — Hafta 4 | tamam (PR #62–#67) |
| Oyun çekirdeği, sonsuz seviye, fişler, rehber, profil | uygulandı |
| 16 uyarı temizliği · 17 lat.md | PR #72 ve #73 açık |

## Açık işler

Bugün açık olan işler, bekleyen kararlar ve planlanan özellikler aşağıdadır.

- PR #72: derleme uyarılarının temizliği (`fix/uyari-temizligi`).
- PR #73: lat.md altyapısı ve bu bilgi grafiği (`docs/lat-md`).
- 09.1: GitHub Rulesets ekran görüntüsü ve doğrudan push reddi kanıtı bekliyor; depo sahibi yapmalı.
- Teslim: güncel `master` üzerinden ZIP indirilip Blackboard'a yüklenmeli.
- Planlanan: F1 ikinci tabak, F2 ileri müşteriler, F4 dekor, F5 oyun içi dört dil + RTL, F6 başarımlar, F7 Android derlemesi, F8 sonsuz servis.

## Çalışma akışı

Sıra değişmez: şartname → plan onayı → değişiklik → doğrulama → istem günlüğü. Dal adı `feature/…`, `fix/…` ya da `docs/…` olur; `master`'a doğrudan commit atılmaz ve bir dal bir PR'dır ([[AGENTS.md]], [[docs/gelistirme-plani.md]]).

İş bitmeden `bun run check`, `bun test` ve `bun run build` yeşil olmalıdır. Her görevin kaydı `docs/istemler/NN-kisa-ad.md` dosyasına, kural özeti `docs/kurallar.md` içine yazılır.
