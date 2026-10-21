# 16 — Batch 02 Denetimi

Görev: ayrı görev kağıdı yok ([`tasks/week-4/README.md`](../tasks/week-4/README.md): "derste duyurulacak"); eksikler eğitmenin Hafta 05 durum raporundan · Dal: `feature/16-batch-02-denetimi`

> Not: [`16-uyari-temizligi.md`](16-uyari-temizligi.md) aynı numarayla daha önce açılmış bir düzeltme kaydıdır (#72); Görev 16 değildir. Kapsam dışında kaldığı için yeniden adlandırılmadı.

## Araç ve model

Claude Code (masaüstü uygulaması), model Claude Opus 5.5.

## Şartname

- **Amaç:** Batch 02'yi kapatmak: Tauri penceresine en küçük boyut, Batch 02 ilerleme belgesi, `v0.2.0-batch-02` etiketi.
- **Kapsam dışı:** Oyun kodu ve sayıları; AGENTS.md dil kuralı ve yönetim paneli (ayrı görevler); eğitmenin #71 PR'ı (bu PR açıkken ayrıca birleşti); `16-uyari-temizligi.md` adının değiştirilmesi.
- **Kabul ölçütleri:** `tauri.conf.json` içinde `minWidth` / `minHeight`; oyun bu boyutta taşmadan sığıyor; `docs/ilerleme-batch-02.md` 09.1–16 matrisi kanıtlarla; `bun test`, `bun run check`, `bun run build`, `cargo test` temiz; etiket PR birleştikten sonra, öğrenciye sorularak atılır.
- **Dokunulacak dosyalar:** `src-tauri/tauri.conf.json`, `docs/mimari-agac.md`, `docs/ilerleme-batch-02.md` (yeni), `docs/gelistirme-plani.md`, `docs/istemler/README.md`, bu günlük, `docs/istemler/img/16-oyun-360x640.png`, `AGENTS.md` ve `README.md` (belge indeksleri).
- **Doğrulama adımları:** dört komut; tarayıcıda 360×640 görünümde lobi ve servis ekranı, `scrollWidth` / `scrollHeight` ölçümü.

## İstem

```text
Görev 16'ya başla: tauri.conf.json minWidth/minHeight, docs/ilerleme-batch-02.md ve istem günlüğü. Ayrı dal ve PR aç. Etiketi PR birleşince bana sorarak at.
```

Öncesinde araca eğitmenin Hafta 05 raporu okutuldu ve "neler eksik?" diye soruldu; eksik listesi bu görevin kapsamını belirledi.

## Plan

İstem dosyaları ve yöntemi açıkça saydığı için ayrı plan onayı beklenmedi; istemin kendisi onay sayıldı.

1. En küçük boyut **360×640**: en küçük yaygın 9:16 telefon. [`mimari-agac.md`](../mimari-agac.md) telefon sınıfını 375–430 px veriyor; 360 bunun hemen altında, oyun alanı 9:16 olduğu için yükseklik 640. Önce tarayıcıda bu boyutta denenir, sığıyorsa yazılır.
2. `docs/ilerleme-batch-02.md`: Batch 01'in [`teslim.md`](../teslim.md) düzeni (kontrol matrisi, doğrulama, etiket). Her görevin kanıtı repodaki dosya, PR ve günlükten.
3. Plan tablosuna 16. satır; belge indekslerine yeni belge.
4. Etiket bu PR'da atılmaz; birleşince öğrenciye sorulur.

## Düzeltmeler

- İlerleme belgesinin ilk taslağı "her PR diğer üyenin onayıyla birleşti" diyordu. GitHub'dan bakılınca #61–#67'nin kural seti etkinleşmeden önce onaysız birleştiği görüldü; cümle buna göre düzeltildi.
- Yerel `node_modules` kilit dosyasının gerisinde kaldığı için `bun run check` bağımlılık kurmayı önerdi ve `svelte-check` `bun` tiplerini bulamadı. Yeni paket eklenmedi; `bun install --frozen-lockfile` ile kilit dosyasına eşitlendi, iki komut da temiz çıktı.

## Doğrulama

```text
$ bun test
99 pass, 0 fail (8 dosya)

$ bun run check
Result (69 files): 0 errors, 0 warnings, 0 hints

$ bunx svelte-check --threshold warning
0 ERRORS 0 WARNINGS

$ bun run build
56 page(s) built ... Complete!

$ cd src-tauri && cargo test
test result: ok. 12 passed; 0 failed   (#71 birleştikten sonra master ile yeniden; önce 7)

$ cd src-tauri && cargo check
Finished `dev` profile
```

Tarayıcı (127.0.0.1:1420, görünüm 360×640): lobi tam görünüyor; OYNA ile servis ekranı açılıyor, tava, tabak ve fiş sığıyor; `scrollWidth` 360, `scrollHeight` 640 (kaydırma yok). Gerçek Tauri penceresinde küçültme sınırı elle denenmedi; öğrenci `bun run tauri dev` ile pencereyi küçülterek 360×640'ta durduğunu görebilir.

![Servis ekranı 360×640](img/16-oyun-360x640.png)
