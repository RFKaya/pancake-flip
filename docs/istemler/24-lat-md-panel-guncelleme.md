# 24 — lat.md Güncellemesi: Yönetim Paneli ve İzinler

Dal: `docs/lat-md-panel-guncelleme` · Tarih: 04.11.2026 · Kaynak: kullanıcı onayıyla (önceki oturumda plan sunuldu, "yap" denildi)

## Araç ve model

Claude Code (masaüstü uygulaması), model Claude Sonnet 5.5.

## Şartname

- **Amaç:** `lat.md/` bilgi grafiğini #76–#80 sonrası gerçek duruma getirmek: yönetim paneli ekranları, yerel arka uç, `/izinler`, platform tablosundaki `yonetim` ve `izin`, güncel test sayısı ve görev durumu.
- **Kapsam dışı:** Oyun ve panel kodunun davranışı (yalnız test dosyasına `@lat:` yorumları eklendi), yönetim paneli 4/4, `docs/` belgelerinin yerini almak (grafik onlara bağlanır, kopyalamaz), yeni bağımlılık.
- **Kabul ölçütleri:** `lat.md` kurallarının hepsi sağlanır (bağlantılar çözülür, her bölümün girişi ≤250 karakter, her test şartnamesi kodda `@lat:` ile anılır); anlatılanlar kodla ve `docs/` ile çelişmez; `bun test` ve build bozulmaz.
- **Dokunulan dosyalar:** `lat.md/arayuz.md`, `mimari.md`, `veri.md`, `platform.md`, `testler.md`, `gorevler.md`, `lat.md/lat.md` (harita), `src/lib/yonetim.test.ts` (yalnız `@lat:` yorumları), bu günlük, `docs/istemler/README.md`.
- **Doğrulama adımları:** `lat check`; olmazsa eşdeğer denetim; build ve `astro check`.

## İstem

```text
yap
```

Öncesinde aracın sunduğu plan: yeni dal, `arayuz`/`platform`/`testler` güncellemesi, bu günlük, `lat check` ve build.

## Plan (değişiklikten önce)

1. Güncel `master`'dan dal aç; `lat.md/` içeriğini kodla ve `docs/` ile karşılaştır.
2. Yeni bölümler: `arayuz` → Yönetim paneli ve İzinler ekranı; `mimari` → Yerel arka uç; `veri` → Yönetim verisi; `testler` → üç yeni şartname.
3. Eskiyen yerler: `mimari` (Rust "yalnız adisyon", sayfa sayısı), `platform` (iki yeni özellik satırı), `testler` (test sayısı), `gorevler` (tamamlananlar ve açık işler).
4. Yeni test şartnamelerini `src/lib/yonetim.test.ts` içindeki `describe` bloklarına `@lat:` ile bağla.
5. Doğrula, günlüğü yaz, tek `docs:` PR'ı aç.

## Düzeltmeler

- `lat` komutu bu makinede yok. `npx` ile paketi indirmek istendi ve izin verilmedi; bu yüzden aşılmaya çalışılmadı. Yerine `lat.md`'nin aynı kurallarını (bağlantı çözümü, sembol varlığı, giriş paragrafı ≤250, test şartnamelerinin kodda anılması) denetleyen küçük bir yerel betik yazıldı ve çalıştırıldı. Betik repoya konmadı.
- Betiğin ilk sürümünde iki hata vardı (şablon dizgisinde `\b` kaçışı; giriş uzunluğu bağlantılar sayılarak ölçülüyordu). Eski, daha önce `lat check`'ten geçmiş bölümler "hatalı" çıkınca fark edildi ve betik bu bölümlerle kalibre edildi.
- İlk taslakta `arayuz` ve `mimari`'de iki giriş paragrafı sınırı aşıyordu; ikiye bölündü.
- `gorevler.md`'de "PR'ı yazarı birleştirir" cümlesi gözlemden çıkarılmıştı, kurallarda yazmıyor; çıkarıldı.

## Doğrulama

Yerel denetim betiği: bağlantılar, giriş paragrafları ve `@lat:` bağları geçti. Gerçek `lat check` çalıştırılmadı; bu, PR'da açıkça belirtildi.

Build ve tip denetimi aşağıdaki "Sonuçlar" bölümündedir.

## Sonuçlar

```text
Yerel lat.md denetimi (12.11.2026, master #80 dahil)  → bağlantılar, giriş paragrafları, @lat bağları geçti
astro build                                          → 58 page(s) built, Complete!
astro check                                          → 0 errors, 0 warnings, 0 hints
test sayısı (test( çağrıları, 9 dosya)               → 120 (lat.md/testler.md ile aynı)
```

Yapılamayanlar: gerçek `lat check` (komut bu makinede yok), `bun test` ve `bun run check` (bu makinede `bun` yok; `astro check` ve test sayısı sayımı ile dolaylı denendi). Kod davranışı değişmediği için testlerin sonucu etkilenmez; tek kod değişikliği `yonetim.test.ts` içine eklenen dört `@lat:` yorumudur.
