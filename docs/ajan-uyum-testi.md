# Ajan Uyum Testi Kaydı

Bu belge, [`AGENTS.md`](../AGENTS.md) kurallarının depoda gerçekten uygulandığını gösteren test kaydıdır. Aşağıdaki komutlar bu tarihte çalıştırıldı ve çıktılar olduğu gibi yazıldı.

| | |
|---|---|
| Tarih | 09.10.2026, 20:00 (UTC+3) |
| Depo | [`RFKaya/pancake-flip`](https://github.com/RFKaya/pancake-flip) |
| Dal | `fix/batch-01-final-compliance` |
| Test anındaki commit | `dc99bb3` (`master` ucu; bu dalın değişiklikleri henüz commit edilmemişti) |
| Araçlar | Bun 1.4.2, cargo 1.94.1, Windows 11 |
| Amaç | Görev 08: ajan kurallarının (git disiplini, tek kaynak dokümantasyon, Svelte 5, kapsam ve bağımlılık koruması, derleme kanıtı) uygulandığını kayda geçirmek |

## Test Matrisi

| # | Kural | Nasıl denetlendi | Sonuç | Durum |
|:-:|---|---|---|:-:|
| A1 | `fix/` ya da `feature/` dalı kullanılır | `git branch --show-current` | `fix/batch-01-final-compliance` | ✅ |
| A2 | `master`'a doğrudan öğrenci commit'i yok | `git log --first-parent --no-merges --format="%an" origin/master \| sort \| uniq -c` | Birleştirme dışı 15 commit'in tamamı eğitmen/şablon (`Keyvan Arasteh` 12, `keyvanarasteh` 3); öğrenci değişiklikleri yalnızca PR birleştirmeleriyle (54 "Merge pull request") geldi | ✅ |
| A3 | Commit mesajları conventional | `git log --no-merges --format="%s" -80 origin/master \| grep -vcE "^(feat\|fix\|docs\|chore\|refactor\|test\|style\|perf\|build\|ci)(\(.+\))?!?: "` | 0 uymayan (son 80 commit) | ✅ |
| A4 | PR akışı | Bu değişiklik `fix/batch-01-final-compliance` dalından tek PR ile `master`'a gelir | PR, teslim kaydında bağlantılıdır ([`teslim.md`](teslim.md)) | ✅ |
| A5 | Force-push / geçmiş yeniden yazma yok | Önceki `master` uçlarının hâlâ ata olduğu: `git merge-base --is-ancestor <uç> origin/master` (`e3732c6`, `3fb1356`, `007f96f`, `90617c1`, `9368ca4`) | Beşi de ata; geçmiş doğrusal | ✅ |
| B1 | Sayfa/özellik haritası tek kaynakta | [`mimari-agac.md`](mimari-agac.md) | Ağaçta yalnızca `src/pages/` içindeki gerçek rotalar var; `/mutfak` ve şablon rotaları kaldırıldı | ✅ |
| B2 | Dizin yapısı tek kaynakta | [`klasor-mimarisi.md`](klasor-mimarisi.md); `mimari-agac.md` buna link verir | Yeni dizin ağacı kopyası eklenmedi | ✅ |
| B3 | Oyun kod mimarisi tek kaynakta | [`oyun-mimarisi.md`](oyun-mimarisi.md) | Değiştirilmedi, kopyalanmadı | ✅ |
| B4 | Her `docs/*.md` AGENTS.md'de dizinli | `for f in docs/*.md; do grep -q "docs/$(basename $f)" AGENTS.md ...` | 14/14 dizinli; bu belge de dizine eklendi (15) | ✅ |
| C1 | Svelte 4 sözdizimi yok | `grep -rnE "^\s*export let \|^\s*\$:" --include=*.svelte src \| wc -l` | 0 (tüm `src`) | ✅ |
| C2 | Bu görevde Svelte dosyası değişmedi | `git status --porcelain` | Yalnızca `docs/` ve `AGENTS.md` | ✅ |
| D1 | Kapsam: yalnızca Görev 07/08/09 dosyaları | `git status --porcelain` | `docs/mimari-agac.md`, `docs/ajan-uyum-testi.md`, `AGENTS.md`, `docs/teslim.md`, `docs/kanit/` | ✅ |
| D2 | Oyun kodu, `docs/tasks/` ve eğitmen dosyası değişmedi | `git diff --name-only HEAD -- src docs/tasks` | 0 dosya; `docs/k1/01.review.md` değişmedi | ✅ |
| E1 | Yeni npm / Bun bağımlılığı yok | `git diff --name-only HEAD -- package.json bun.lock` | 0 dosya | ✅ |
| E2 | Yeni Cargo bağımlılığı yok | `git diff --name-only HEAD -- src-tauri/Cargo.toml src-tauri/Cargo.lock` | 0 dosya | ✅ |
| F1 | Birim testleri | `bun test` | 91 geçti, 0 kaldı (405209 beklenti, 6 dosya) | ✅ |
| F2 | Derleme 0 hata | `bun run build` | 19 sayfa, `Complete!`, 0 hata; ekran görüntüsü: [`kanit/batch-01-build.png`](kanit/batch-01-build.png) | ✅ |
| F3 | Rust testleri | `cd src-tauri && cargo test` | 2 geçti, 0 kaldı (diğer iki hedefte test yok: 0/0) | ✅ |
| F4 | Tip denetimi | `bunx svelte-check` | 7 hata, 3 uyarı; hepsi aşağıdaki **önceden var olan** taban listesinde, yeni sorun yok | ✅ |
| F5 | Tauri uygulaması açılır | `bun run tauri dev` | Rust derlemesi 23,4 sn; "Pancake Flip!" penceresi açıldı; ekran görüntüsü: [`kanit/tauri-dev-batch-01.png`](kanit/tauri-dev-batch-01.png) | ✅ |

## svelte-check Tabanı (önceden var olan, bu görevle ilgisiz)

Bu 7 hata ve 3 uyarı bu görevden önce de vardı; ortam tip bildirimleri ve iki bilinen Svelte uyarısından kaynaklanır. Görev kapsamı dışında oldukları için düzeltilmedi.

| Tür | Dosya | Mesaj (özet) |
|---|---|---|
| Hata | `astro.config.mjs` | `node:url` için tip bildirimi yok |
| Hata ×6 | `src/lib/oyun/*.test.ts` (denge, fis, ilerlemeKaydi, oturum, oyun, seviye) | `bun:test` modülü için tip bildirimi yok (testler `bun test` ile çalışıyor) |
| Uyarı | `src/components/AppNav.svelte` | `currentPath` yalnızca ilk değeri yakalar |
| Uyarı | `src/components/oyun/Restoran.svelte` | `baslangic` yalnızca ilk değeri yakalar |
| Uyarı | `tsconfig.json` | `baseUrl` seçeneği TypeScript 7'de kalkacak |

## Genel Sonuç

**Geçti.** A–F başlıklarındaki 20 denetimin hepsi sağlandı. Bu görevde yeni hata, yeni uyarı ya da yeni bağımlılık yok; oyun kodu ve arayüz değişmedi.

## Bilinen Sınırlar

- Force-push olmadığı, eski `master` uçlarının yeni geçmişte ata olmasıyla dolaylı olarak doğrulandı; GitHub'ın push olay geçmişi ayrıca incelenmedi.
- Test anında bu dalın commit'i henüz yoktu; commit, PR ve birleştirme bilgisi [`teslim.md`](teslim.md) ve PR açıklamasındadır.
- Tauri ekran görüntüsü `tauri dev` (geliştirme) modunda alındı; alttaki küçük koyu araç çubuğu Astro'nun yalnızca geliştirmede görünen araç çubuğudur, 🛠 düğmesi de geliştirici modudur.

Sonuç olarak AGENTS.md'de tanımlı, burada test edilen kuralların tümü sağlanmaktadır.
