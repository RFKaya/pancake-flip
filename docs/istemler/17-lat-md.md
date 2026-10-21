# 17 — lat.md Bilgi Grafiği İskeleti

Dal: `docs/lat-md` · Tarih: 21.10.2026 · Kaynak: ders yönergesi (hoca)

## Araç ve model

AutoClaw masaüstü ajanı (Windows 11, Bun 1.4.3, Node 24), `lat.md` 0.13.3.

## Şartname

- **Amaç:** Ders yönergesindeki adımları uygulamak: `npm install -g lat.md`, proje kökünde `lat init`, çıkan `lat.md/` klasörünü depoya eklemek.
- **Kapsam dışı:** Grafiğin içeriğini doldurmak (proje bilgisini `lat.md/` altına taşımak), ajan kancaları/kuralları (`lat init` bu depoda "No agents selected" dedi; etkileşimli çalıştırılırsa ajan dosyalarına yönerge eklenebilir), oyun kodu.
- **Kabul ölçütleri:** `lat.md/` depoda; `.lat-build` ve önbellek sürüm kontrolüne girmiyor; `lat check` temiz; `bun run build` etkilenmemiş.
- **Dokunulan dosyalar:** `lat.md/lat.md` (yeni), `lat.md/.gitignore` (yeni), `.gitignore`, `docs/istemler/17-lat-md.md`, `docs/istemler/README.md`.
- **Doğrulama adımları:** `lat check`, `bun run build`, `git status` ile önbelleğin dışarıda olduğunun kontrolü.

## İstem

```text
npm install -g lat.md
sonra proje ana klasorunde lat init calistirin diyor hoca
...
reponuzda lat.md yukleyin
```

## Plan (değişiklikten önce)

1. `npm install -g lat.md` → 0.13.3.
2. Proje kökünde `lat init` (etkileşimsiz çalıştı; `lat.md/` iskeleti + `.gitignore`'a `.lat-build` satırı).
3. Üretilen dosyaları incele: `lat.md/lat.md` (grafik açıklaması), `lat.md/.gitignore`, `lat.md/.cache/lat_init.json` (önbellek).
4. Önbellek depoya girmesin: `lat.md/.gitignore` içine `.cache/` satırı.
5. `lat check` ile doğrula, `docs/istemler` dizinine bu kaydı ekle, dal + PR.

## Düzeltmeler

- `lat init` çıktısındaki "No agents selected" satırı, ajan yönergelerinin (AGENTS.md / CLAUDE.md kancaları) yazılmadığını gösteriyor. Bu bilinçli kabul edildi: depoda `AGENTS.md` hoca kurallarıyla dolu ve otomatik eklenen metin onunla çakışabilirdi. Gerekirse `lat init` etkileşimli çalıştırılıp ajan seçilebilir.
- `lat.md/.cache/lat_init.json` CLI tarafından okunmuyor (paket içinde `lat_init` referansı yok); bu yüzden sürüm kontrolü dışında bırakıldı.

## Doğrulama

```text
$ lat --version
0.13.3

$ lat init
Created lat.md/
  Added .lat-build to .gitignore

$ lat check
All checks passed in 91ms

$ bun run build
56 page(s) built ... Complete!
```

- `git status` → `lat.md/.cache` görünmüyor (`.gitignore` ile dışarıda).
- Depoya eklenen dosyalar: `lat.md/lat.md`, `lat.md/.gitignore`, kök `.gitignore` (+`.lat-build`).
