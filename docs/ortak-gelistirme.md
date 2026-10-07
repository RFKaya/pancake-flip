# Ortak Geliştirme Rehberi — Pancake Flip!

> Bu belge, projede **birden fazla kişi ve yapay zeka ajanı** (Claude, Gemini, Cursor…) aynı anda çalışırken çakışmayı önlemek ve hızlı ilerlemek içindir. Ajan kuralları [`AGENTS.md`](../AGENTS.md)'dedir; bu belge onları tekrar etmez, **çalışma düzenini** anlatır. Oyun kuralları [`oyun-tasarimi.md`](oyun-tasarimi.md), kod yapısı [`oyun-mimarisi.md`](oyun-mimarisi.md), görev listesi [`gelistirme-plani.md`](gelistirme-plani.md).

---

## 1. Altın kurallar (kısa)

1. **Başlamadan önce eşitle:** `git fetch --all --prune && git checkout master && git pull` ve `gh pr list` (açık PR'lara bak).
2. **Bir dal = bir görev = bir PR.** Küçük tut. Dal adı: `feature/<ad>`, `fix/<ad>`, `docs/<ad>`.
3. **`master`'a doğrudan commit yok. Force-push yok.** Başkasının dalına dokunma.
4. **Aynı dosyaya dokunan açık PR varsa** o PR bitene kadar bekle ya da PR açıklamasında konuş (aşağıdaki §4).
5. **Merge'den önce** `bun test` ve `bun run build` yeşil olmalı; `gh pr view <no> --json mergeable` çakışmasız dönmeli.
6. **Yeni bağımlılık ekleme** (npm/cargo). Gerekirse önce öğrenciye sor.
7. `docs/tasks/` hocanındır, düzenlenmez.

---

## 2. Günlük akış

```bash
# 1) Eşitle
git fetch --all --prune
git checkout master && git pull
gh pr list                       # kim neye dokunuyor?

# 2) Dal aç
git checkout -b feature/<kisa-ad>

# 3) Küçük adımlarla çalış; her adımdan sonra
bun test                         # mantık değiştiyse
bun run build                    # 0 hata şart

# 4) Commit (feat: / fix: / docs: ile başlar, Türkçe olabilir)
git add <dosyalar>               # `git add -A` yerine ne eklediğini bil
git commit -m "feat: ..."

# 5) Göndermeden önce master'daki yeni işleri al
git fetch && git rebase origin/master   # çakışma olursa çöz, force-push GEREKMEZ (dal sana ait ve henüz PR'da değilse)
git push -u origin feature/<kisa-ad>

# 6) PR aç, yeşilse merge et
gh pr create --base master --title "..." --body "..."
gh pr merge <no> --merge --delete-branch
git checkout master && git pull
```

> Dalın PR'a dönüştükten sonra başkası tarafından incelendiyse `rebase` yerine `git merge origin/master` kullan; geçmişi yeniden yazma.

**PR açıklaması kalıbı:**
```
## Ne yapıldı
(2-3 cümle)
## Yapay zekaya verilen görev
(bu oturumda verilen görev, 1-2 cümle)
## Test
(çalıştırılan komutlar ve sonuçları, elle denenenler, DENENMEYENLER)
```
Denenmeyen yerleri **dürüstçe yaz**: bir sonraki kişi onu bilmeli.

---

## 3. Proje bir bakışta (güncel durum)

- **Teknoloji:** Tauri v2 (Rust) + Astro (static, port 1420) + Svelte 5 (Runes) + React 19 + MDX, paket yöneticisi **Bun**. Oyun motoru yok.
- **Oyun:** Dikey (9:16) krep oyunu. Ekranda hedef sipariş kartı, yüzlü tava, büyük tabak, malzeme düğmeleri, ilerleme çubuğu.
  Tavada basılı tut = hamur dök, yukarı kaydır = çevir, aşağı kaydır = tabağa al (bkz. [`oyun-tasarimi.md`](oyun-tasarimi.md) §4). Bölüm 6–7'de 2 tava. Bölümler 1–7 oynanır. Müşteri/sabır sistemi **şu an yok** (bkz. [`oyun-tasarimi.md`](oyun-tasarimi.md) en üstteki not).
- **Nerede ne var** (dosya listesi değil, sorumluluklar; ağaç için [`klasor-mimarisi.md`](klasor-mimarisi.md)):

| Konu | Yer |
|---|---|
| Oyun kuralları (saf TypeScript, Svelte yok, testli) | `src/lib/oyun/*.ts` (+ `oyun.test.ts`) |
| Oyun sayıları (süre, fiyat, bölümler) | `src/lib/veri/*.json` — **kodda sabit sayı yazma** |
| JSON'a tipli erişim | `src/lib/oyun/veri.ts` |
| Tipler | `src/types/oyun.ts` |
| Oyun ekranı | `src/components/oyun/ServisEkrani.svelte` (düzen, sipariş fişi, tabak) + `Tava.svelte` (tava jestleri ve efektler) → rota `/servis/[id]` |
| Bölümler listesi | `src/components/Bolumler.svelte` → rota `/` |
| Kayıt (localStorage, sürümlü) | `src/lib/kayit.svelte.ts` |
| Bilgi sayfaları (4 dil) | `src/pages/{hakkinda,iletisim,kosullar,gizlilik}`, `src/pages/{en,ar,fa}/`, `src/lib/i18n.ts`, `src/components/bilgi/` |
| Renkler / tema | `src/styles/app.css` ↔ [`branding.md`](branding.md) (aynı değerler) |
| Rust komutları | `src-tauri/src/lib.rs` |

- **Passo kalıntıları:** Biletlerim, Sepet, `data.ts`, `sepet.svelte.ts`, `biletler.svelte.ts` ve Rust `bilet_olustur` silindi. Şablondan kalan son parça README'deki Passo anlatımıdır (Görev 03).

---

## 4. Çakışmayı önleme

**Sıcak noktalar** — çok kişinin dokunma ihtimali yüksek, küçük ve hızlı PR'larla değiştir:

| Dosya | Neden sıcak |
|---|---|
| `src/components/oyun/ServisEkrani.svelte` | Oyunun bütün arayüzü tek dosyada. Büyük bir değişiklikten önce açık PR'lara bak. |
| `src/lib/kayit.svelte.ts`, `src/types/oyun.ts` | Herkesin eklediği ortak yer. Sadece **ekleme** yap, mevcut alanları yeniden adlandırma. |
| `src/styles/app.css` + `docs/branding.md` | İkisi birebir aynı kalmalı; renk eklerken ikisini birlikte güncelle. |
| `src/lib/veri/*.json` | Denge ayarı. Sayıyı değiştirirsen `oyun-tasarimi.md`'deki değeri de aynı PR'da güncelle. |
| `docs/gelistirme-plani.md` | Görev kutuları. Yalnızca kendi görevinin kutusunu işaretle. |

**İş bölümü önerisi** (çakışmayı azaltan ayrım):

- Biri **arayüz/his** (`src/components`, `src/styles`, animasyon, ses), diğeri **mantık/native** (`src/lib/oyun`, `src/lib/veri`, `src-tauri`) üzerinde çalışsın.
- Arayüze bağlama gerektiren mantık işleri için mantığı ayrı PR'da gönder, bağlamayı arayüz sahibi yapsın (PR açıklamasına bağlama örneğini yaz).

**Görev sahiplenme:** Başlamadan önce bu belgenin altındaki "Kimde ne var" tablosuna bir satır ekleyip küçük bir `docs:` PR'ı ile gönder (ya da öğrenciye haber ver). İş bitince satırı sil.

### Kimde ne var

| Kişi | Görev | Dal / PR | Dokunduğu yerler |
|---|---|---|---|

> Tablo güncel tutulur; eskimiş satır en kötü bilgidir.

---

## 5. Kodlama kuralları (özet; ayrıntı AGENTS.md §4–5)

- **Svelte 5 Runes:** `$state`, `$derived`, `$props`, `$effect`. `export let` ve `$:` yok.
- **Kurallar saf TS'te, bileşenler yalnızca gösterir.** Yeni oyun kuralı = `src/lib/oyun/*.ts` + test.
- **Renk yalnızca CSS değişkeniyle** (`var(--...)`). Ad-hoc hex yazma; gerekiyorsa `app.css` ve `branding.md`'ye token ekle.
- **SSR güvenliği:** `window`, `localStorage`, `requestAnimationFrame` yalnızca istemcide (`typeof window !== "undefined"`). Oyun ekranı `client:only="svelte"`. (Node 25'te SSR'de `localStorage` nesnesi vardır ama `getItem` yoktur; bu yüzden `typeof localStorage` değil `typeof window` kontrol edilir.)
- **Animasyon** yalnızca `transform` ve `opacity` ile; aynı anda az parçacık. Hedef 60 fps.
- **Oyun mantığında `setTimeout` yok**; tek döngü `requestAnimationFrame` + `dt`.
- **Placeholder görsel serbest** (emoji, CSS, kendi SVG'miz). Başka oyunlardan veya markalardan görsel/ses/isim kopyalanmaz.

---

## 6. Test ve doğrulama

| Ne | Komut | Ne zaman |
|---|---|---|
| Mantık testleri (Bun gömülü) | `bun test` | `src/lib/oyun` veya `veri` değişince |
| Derleme | `bun run build` | Her adımdan sonra, **0 hata** |
| Tip/Svelte uyarıları | `bunx svelte-check` | Büyük değişiklikte. `astro.config.mjs` (`node:url`) ve `bun:test` hataları **önceden vardır**, yeni hata ekleme. |
| Rust | `cargo test` (`src-tauri`) | `lib.rs` değişince |
| Elle | `bun run dev` → `http://127.0.0.1:1420` → DevTools cihaz modu **390×844** | Her arayüz değişikliğinde |
| Masaüstü penceresi | `bun run tauri dev` | Rust gerektirir; ilk derleme uzun sürer |

**Elle test ipuçları**
- Yeni bölümleri denerken kilit sorunu olursa tarayıcı konsolunda: `localStorage.removeItem("pancakeflip-kayit")`.
- Bölüm 1: yalnızca krep. Bölüm 3'ten itibaren çikolata, 5'te çilek sosu, 6'da çilek dilimi, 7'de tereyağı.

---

## 7. Bilinen tuzaklar (zaman kaybettirir)

1. **Windows + CRLF:** Git `LF → CRLF` uyarısı verir; normaldir. Betikle dosya düzenlerken `\r\n` farkına dikkat et (metin eşleştirme tutmayabilir).
2. **Windows kabuğu:** Bash tool'unda `/dev/null`, ileri bölü kullan; PowerShell'de `&&` çalışmaz.
3. **Gizli tarayıcı paneli:** Claude'un tarayıcı panelinde oyun, panel gizliyken `requestAnimationFrame` çalışmadığı için **durur**. Test ederken panelin görünür olduğundan emin ol (`preview_start` ile aç).
4. **`bun run dev` zaten çalışıyorsa** ikincisi "Another astro dev server is already running" der; mevcut sunucuyu kullan.
5. **Betik/`sed` ile çok satırlı düzenleme** sessizce başarısız olabilir (örnek: Profil bilgi linkleri CSS'i eklendi ama işaretleme eklenmedi). Düzenlemeden sonra **sonucu doğrula** (`grep`, `git diff`).
6. **Aynı tohum aynı servis:** Üretici tohumludur; hata ayıklarken `rngOlustur(sabir tohum)` kullan.
7. **`kayit.yukle()`** servis sayfasında da çağrılır; kayıt okumadan yazma, diskteki kaydı ezer (bu hata bir kez yaşandı).

---

## 8. Yapay zeka ajanları için kısa talimat

Bu repoda bir ajan olarak çalışıyorsan:

1. Önce [`AGENTS.md`](../AGENTS.md) ve bu belgeyi oku. Kuralları tekrar sorma.
2. İşe başlamadan **fetch/pull + `gh pr list`** yap; çakışma ihtimalini §4'e göre değerlendir.
3. Oturum başına **tek görev**. Görev dışına çıkma, büyük refactor yapma.
4. Bitirince: test + build yeşil → PR aç → **çakışma yoksa merge et** → `master`'a dön ve `pull` yap. Öğrenci bunu açıkça istedi.
5. Başkasının açık PR'ını merge etmeden önce diff'ini oku, birleşik halini yerelde `bun test` + `bun run build` ile doğrula.
6. Yeni, kalıcı bir bilgi öğrenirsen ilgili `docs/*.md` dosyasına yaz (bu belge dahil). Belgeleri kopyalama, link ver.
7. Emin değilsen, geri dönüşü zor bir işte (dosya silme, veri formatı) **önce öğrenciye sor**.
