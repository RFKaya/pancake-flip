# 23 — Yetkiler (izinler): bildirim izni ve `/izinler`

## İstem
qLar izin desenini örnek alarak izin altyapısı ekle: permissions_status (asla diyalog açmaz) ve
permission_request; gerçek izin bildirim ("Günlük krep hatırlatması / oyun bildirimi"). /izinler ekranı; Rust yalnız native.ts üzerinden.

## Uygulandı
permissions.rs, lib.rs (tauri-plugin-notification + komut kaydı), Cargo.toml, capabilities/default.json
(notification:default), native.ts, types/izin.ts, /izinler sayfası + Izinler.svelte, docs/izinler.md.

## Doğrulama
bun run build ve cargo check sonucu PR'da belirtildi. Canlı bildirim masaüstü/cihaz derlemesinde görünür.

## Not
Öğretim görevlisi tarafından başlangıç (scaffold) olarak gönderildi; öğrenci inceleyip merge eder.

## Belge ve kural uyumu (`feature/izin-belge-uyumu`)

Araç ve model: Claude Code (masaüstü uygulaması), model Claude Sonnet 5.5.

PR #79 (eğitmenin başlangıç PR'ı) incelenip birleştirildikten sonra AGENTS.md'ye uymayan yerler kapatıldı:

- `izin` özelliği `Ozellik` tipine, `native.ts` içindeki `DESTEK` tablosuna ve `platform-destegi.md`'ye eklendi (tarayıcıda yok).
- `izinDurumu`, `izinIste`, `bildirimGonder` ham `invoke` yerine `cagir` ile `NativeSonuc` döner; tarayıcıda `YalnizUygulamada` (`native.test.ts`).
- `Izinler.svelte` kendi `__TAURI_INTERNALS__` denetimi yerine `destekleniyorMu("izin")` kullanır; sabit renk yedekleri projenin CSS değişkenleriyle değiştirildi.
- `komutlar.md`, `mimari-agac.md`, `gelistirme-plani.md` ve bu günlük güncellendi (günlük `yetkiler.md` adından `23-izinler.md`'ye taşındı).

Doğrulama: `bun test` 120 geçti, `bun run build` 58 sayfa, `bunx astro check` 0 hata. Bu değişiklikte Rust'a dokunulmadı. Uygulamada (Tauri) elle denenmedi.
