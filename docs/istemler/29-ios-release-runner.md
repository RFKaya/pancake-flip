# 29 · Deneme sürümü için iOS derlemesi

## Araç ve model

- OpenAI Codex, GPT-6.

## Şartname

- **Amaç.** [PR #87](https://github.com/RFKaya/pancake-flip/pull/87) için beş platformda paket üretimini doğrulamak ve `v0.0.1-deneme` sürümünü GitHub Releases üzerinden yayımlamak.
- **Kapsam dışı.** Oyun kodu, uygulama sürüm numarası, bağımlılıklar ve depo ayarları.
- **Kabul ölçütleri.** PR'ın beş paketleme işi başarılı olur. Birleştirmeden sonra yayınlanan sürümde Windows, macOS, Linux, Android ve iOS dosyaları görünür.
- **Dosyalar.** `.github/workflows/release.yml` ve bu günlük.
- **Doğrulama.** Yerel derleme ve testler, GitHub Actions iş durumları ve deneme sürümü dosyaları.

## İstem

Öğretmenin PR'ını incele ve Releases üzerinden istenen deneme sürümünü hazırla.

## Plan ve onay

Rauf, kapasite sorunu için planı ve teslimin tamamlanmasını onayladı. iOS işini `macos-15-intel` çalıştırıcısına al, PR'da beş işi doğrula, sonra birleştir ve deneme etiketini gönder.

## Düzeltmeler

GitHub, iOS işine üç denemede de ARM64 macOS çalıştırıcısı atayamadı. iOS işi Intel çalıştırıcıya taşındı. Uygulama hedefi `aarch64-apple-ios` olarak kaldı.

## Doğrulama

- Mevcut birleştirme önizlemesinin uygulama kaynakları yerelde derlendi ve 129 test geçti.
- Düzeltme dalında `bun run build`, `bun test --only-failures` (120 test) ve `git diff --check` geçti.
- Önceki PR koşusunda Windows, macOS, Linux ve Android paketleri üretildi. Windows paketi açılış kontrolünden geçti. Android paketini Actions imza denetimi doğruladı.
- Yeni çalıştırıcının sonucu [PR kontrollerinde](https://github.com/RFKaya/pancake-flip/pull/87/checks), yayın dosyaları [deneme sürümünde](https://github.com/RFKaya/pancake-flip/releases/tag/v0.0.1-deneme) izlenir.
