# 19 — Ajan Dil Kuralı: Çince ve Japonca Karakter Yok

Görev: eğitmenin Hafta 05 raporu, "lat.md" bölümü madde 5 ("Ajanın Çince ya da Japonca karakter yazmaması için kural ekleyin") · Dal: `feature/ajan-dil-kurali`

## Araç ve model

Claude Code (masaüstü uygulaması), model Claude Opus 5.5.

## Şartname

- **Amaç:** Ajanların kodda, belgede ve yanıtlarda Çince ya da Japonca karakter yazmasını AGENTS.md kuralıyla yasaklamak ve kuralın denetlenebilir olmasını sağlamak.
- **Kapsam dışı:** Uygulamanın Arapça ve Farsça sayfaları (bilinçli çok dillilik); CLAUDE.md ve GEMINI.md (zaten yalnız AGENTS.md'ye yönlendiriyor); otomatik CI denetimi; yeni bağımlılık.
- **Kabul ölçütleri:** AGENTS.md §6'da kural; Arapça/Farsça metinler kuralın dışında; tek satırlık denetim komutu repoda 0 eşleşme verir, Çince/Japonca örnek metinde eşleşme verir, Arapça ve Türkçe harflerde vermez; `bun run build` 0 hata.
- **Dokunulacak dosyalar:** `AGENTS.md`, bu günlük, `docs/istemler/README.md`.
- **Doğrulama adımları:** denetim komutu repoda ve örnek dosyada; `bun run build`.

## İstem

```text
AGENTS.md'ye Çince/Japonca karakter yazmama kuralını ekle; ayrı dal ve PR aç.
```

## Plan

İstem dosyayı ve yöntemi açıkça söylediği için ayrı plan onayı beklenmedi; istemin kendisi onay sayıldı.

1. Kural §6 "Kırmızı Çizgiler"e eklenir: kuralı çiğneyen çıktı kabul edilmez; kod yazım kuralı değil, her çıktıya uygulanan bir sınırdır.
2. Kapsam: kod, yorum, belge, commit/PR metni ve öğrenciye yanıt. Uygulama `ar` ve `fa` dillerinde de yayımlandığı için (85 dosyada Arapça harf var) yalnız Çince ve Japonca hedeflenir; bu sayfalar açıkça kuralın dışında tutulur.
3. Denetim için yeni araç eklenmez; `git grep` ile Unicode aralığı taranır. Komut bu günlükte durur, AGENTS.md buraya bağlanır (DRY).

## Düzeltmeler

- İlk taslakta kurala "kod adları Türkçe ASCII ya da İngilizcedir" cümlesi eklenmişti. Bu, istenmeyen ve AGENTS.md'de karşılığı olmayan yeni bir adlandırma kuralı olacaktı; çıkarıldı.
- Günlüğün ilk taslağı örnek Çince/Japonca satırları aynen içeriyordu; bu, denetim komutunun repoda eşleşme bulmasına yol açacaktı. Örnekler tarifle değiştirildi.
- Denetim komutu ilk denemede PNG simgelerini "eşleşti" diye listeledi (ikili dosyaların baytları aralığa düşüyor). `-I` ile ikili dosyalar atlandı.

## Doğrulama

Denetim komutu (Git Bash; repo kökünde). Taranan aralıklar: Hiragana ve Katakana (U+3040–30FF), Han ek A (U+3400–4DBF), Han (U+4E00–9FFF), uyumluluk Han (U+F900–FAFF), yarım genişlikli Katakana (U+FF66–FF9F).

```bash
git grep -I -nP "[\x{3040}-\x{30FF}\x{3400}-\x{4DBF}\x{4E00}-\x{9FFF}\x{F900}-\x{FAFF}\x{FF66}-\x{FF9F}]"
```

Çıktı yoksa (çıkış kodu 1) kural sağlanıyor.

```text
$ git grep -I -nP "[…]"          # repo, 22.10.2026
(çıktı yok, çıkış kodu 1)

$ git grep --no-index -I -nP "[…]" -- cjk.txt   # repo dışında, 4 satırlık örnek dosya
cjk.txt:1:…                       # Çince (Han) iki karakterli satır: eşleşti
cjk.txt:2:…                       # Japonca Katakana satırı: eşleşti
                                  # Arapça ("merhaba") ve Türkçe (çğüşöı) satırları eşleşmedi

$ bun run build
56 page(s) built ... Complete!
```

Örnek dosya repoya konmadı ve bu günlükte örnek karakterler yazılmadı; böylece denetim komutu repoda temiz kalır.
