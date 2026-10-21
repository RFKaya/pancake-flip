# 16 — Derleme Uyarılarının Temizliği

Dal: `fix/uyari-temizligi` · Tarih: 21.10.2026 · Kaynak: kullanıcı isteği (hata düzeltmesi + PR)

## Araç ve model

AutoClaw masaüstü ajanı (Windows 11, Bun 1.4.3, Node 24).

## Şartname

- **Amaç:** `bunx svelte-check` ve `bun run check` çıktısındaki uyarıları gidermek. Davranış değişmemeli; oyun, menü ve temel akışlar aynı kalmalı.
- **Kapsam dışı:** Oyun kuralları ve sayıları, arayüz metinleri, yeni bağımlılık, alt menünün dillere ayrılması. (Oyun, Fişlerim ve Profil ekranlarının yalnız Türkçe sayfası var: `/en/fislerim` gibi adresler üretilmiyor. Menüyü dil önekli yapmak 404'e götürürdü; bu yüzden menü bilinçli olarak Türkçe sayfalara bağlı kalıyor.)
- **Kabul ölçütleri:** `svelte-check` 0 hata 0 uyarı; `bun run check` 0 / 0 / 0; `bun test` 99/99; `bun run build` 56 sayfa, 0 hata; alt menü vurgusu ve oyun lobisi elle doğrulanmış.
- **Dokunulan dosyalar:** `src/components/AppNav.svelte`, `src/components/oyun/Restoran.svelte`, `src/components/react/CanliRozet.tsx`, `tsconfig.json`, bu günlük.
- **Doğrulama adımları:** `bunx svelte-check --threshold warning`, `bun run check`, `bun test`, `bun run build`; tarayıcıda lobi → OYNA → dök → çevir akışı ve sekmeler arası gezinme.

## İstem

```text
https://github.com/RFKaya/pancake-flip bunu klasöre çek sonra bi çalıştır test et
...
hata düzelttiysen pr aç githuba
```

## Plan (değişiklikten önce)

1. **AppNav.svelte** — `let yol = $state(currentPath)` uyarısı (`state_referenced_locally`): sunucudan gelen yol yalnız ilk boyama içindir. `untrack(() => currentPath)` ile niyet açık hâle gelir; abonelik kurulmaz, `onMount` gezinmeleri izlemeye devam eder.
2. **Restoran.svelte** — aynı desen `baslangic` için: `$state(untrack(() => baslangic === "oyun"))`.
3. **CanliRozet.tsx** — kullanılmayan `React` içe aktarımı kaldırılır (`ts(6133)` ipucu).
4. **tsconfig.json** — `baseUrl` TypeScript 7'de kalkıyor; `paths` göreli yazılır (`./src/lib/*`). `$lib` takma adı aynı kalır.

## Düzeltmeler

- `baseUrl` ilk denemede yalnız silindiğinde `paths` göreli olmadığı için yeni bir uyarı çıktı ("Non-relative paths are not allowed when 'baseUrl' is not set"). Değer `./src/lib/*` yapıldı; uyarı kalmadı.
- Dosyalar CRLF satır sonu kullanıyor; düzenlemeler satır sonlarını koruyacak şekilde yapıldı, diff yalnız hedeflenen satırları içeriyor.
- Geliştirme sunucusu `tsconfig.json` değişince kendini yeniden başlattı; ilk sayfa yüklemesi bu sırada boş göründü, sunucu temiz başlatılınca lobi normal çizildi (kod kaynaklı değil).

## Doğrulama

```text
$ bunx svelte-check --threshold warning
svelte-check found 0 errors and 0 warnings

$ bun run check
Result (67 files): 0 errors, 0 warnings, 0 hints

$ bun test
99 pass, 0 fail (8 dosya)

$ bun run build
56 page(s) built ... Complete!
```

Tarayıcı (127.0.0.1:1420):

- Lobi çiziliyor; `OYNA` ile oyun açılıyor, `dök → yayil → pisir` geçişleri doğru.
- `/fislerim` → “Fişlerim” sekmesi `aria-current="page"`, `/` → “Oyna” sekmesi işaretli; ClientRouter geçişlerinde vurgu güncelleniyor.
- Sayfa geçişinden sonra oyun bileşeni yeniden bağlanıyor (`.oyna`, `.alan` var).
