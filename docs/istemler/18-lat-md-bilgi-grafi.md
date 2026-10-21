# 18 — Proje Bilgi Grafiği (lat.md)

Dal: `docs/lat-md` (PR #73 üzerine) · Tarih: 21.10.2026 · Kaynak: kullanıcı isteği (profesyonel lat.md dokümantasyonu)

## Araç ve model

AutoClaw masaüstü ajanı (Windows 11, Bun 1.4.3, Node 24), `lat.md` 0.13.3.

## Şartname

- **Amaç:** Projenin tamamını anlatan, `lat check` ile doğrulanan bir `lat.md/` bilgi grafiği kurmak: mimari, oyun mekaniği, seviye sistemi, veri/kayıt, arayüz, platform desteği, test şartnameleri ve görev/durum.
- **Kapsam dışı:** Oyun kodunun davranışı (yalnız yorum satırı eklendi), `docs/` belgelerinin yerini almak (grafik onlara bağlanır, kopyalamaz), yeni bağımlılık.
- **Kabul ölçütleri:** `lat check` temiz; 8 içerik dosyası + indeks; her bölümün ≤250 karakterlik giriş paragrafı; test şartnameleri `@lat:` ile kodda bağlı; `bun test` 99/99, `bun run check` 0 hata, `bun run build` 56 sayfa.
- **Dokunulan dosyalar:** `lat.md/*.md` (9 dosya), `src/lib/**` ve `src/components/oyun/Restoran.svelte` (yalnız `@lat:` yorumları), `docs/istemler/18-lat-md-bilgi-grafi.md`, `docs/istemler/README.md`.
- **Doğrulama adımları:** `lat check`, `bun test`, `bun run check`, `bun run build`.

## İstem

```text
bu skill'i oku ve projemizi en profesyonel sekilde lat md kullanarak dakuman ve gorevler ve durum ve tum gereken parcalari olustur
.agents\skills\lat-md\SKILL.md
```

## Plan (değişiklikten önce)

1. `lat.md` yazım kılavuzunu oku (`.agents/skills/lat-md/SKILL.md`; depoda yok, paketin `templates/skill/SKILL.md` dosyası kullanıldı).
2. `docs/` belgelerinden ve koddan doğrulanmış bilgi topla: mimari, mekanik, seviye, veri, arayüz, platform, test, görev durumu.
3. 8 dosya + indeks yaz: `mimari`, `oyun-mekanigi`, `seviye`, `veri`, `arayuz`, `platform`, `testler`, `gorevler`.
4. Test şartnamelerini `require-code-mention: true` ile yaz; her yaprak bölüm için test dosyasına bir `@lat:` yorumu ekle.
5. Çekirdek modüllere bölüm bağları ekle (davranış değişmeden).
6. `lat check` ile doğrula; hataları düzelt; sonra test/check/build.

## Düzeltmeler

- `lat check` ilk turda 9 hata verdi: indeks `[[dosya]] — açıklama` biçimini istedi, üç bölümde giriş paragrafı yoktu (tablo/listeyle başlıyordu) ve dört paragraf 250 karakteri aşıyordu. İndeks liste biçimine çevrildi, giriş paragrafları eklendi, uzun paragraflar bölündü.
- Bölüm adlarında iki nokta (`Tek kapı: native.ts`, `Denge: …`) wiki bağlantısı ayrıştırmasını riske attığı için adlar sadeleştirildi (`native.ts tek kapı`, `Sabır ve pişme dengesi`).
- `.agents/skills/lat-md/SKILL.md` bu makinede yok; kılavuz `lat.md` paketinin `templates/skill/SKILL.md` dosyasından okundu ve `.zwork/` altına kopyalandı (sürüm kontrolüne girmez).

## Doğrulama

```text
$ lat check
All checks passed in 518ms

$ bun test
99 pass, 0 fail (8 dosya)

$ bun run check
Result (67 files): 0 errors, 0 warnings, 1 hint

$ bun run build
56 page(s) built ... Complete!
```

- Grafik: 9 dosya, 47 bölüm (başlıklar dahil), 20 `@lat:` kod bağı (18 dosya).
- `bun run check` çıktısındaki tek ipucu, PR #72'nin düzelttiği `CanliRozet.tsx` React importudur; bu dal master'dan ayrıldığı için beklenir.
