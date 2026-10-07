# Geliştirme Planı ve Görev Listesi — Pancake Flip!

> Bu belge **ne zaman, hangi sırayla, hangi dalda** ne yapılacağını tanımlar. Oyun kuralları [`oyun-tasarimi.md`](oyun-tasarimi.md)'de, kod yapısı [`oyun-mimarisi.md`](oyun-mimarisi.md)'de, hocanın haftalık görevleri [`tasks/week-3/`](tasks/week-3/) altında. Hocanın görev dosyasıyla bu plan çelişirse **hocanınki geçerlidir**.
>
> Yapay zeka ajanına (Claude Sonnet) verilecek talimat: [`sonnet-talimati.md`](sonnet-talimati.md)

---

## 0. Her görevin iş akışı (değişmez)

1. `master` güncel → görevin **kendi dalı** açılır (aşağıdaki tabloda yazılı). Bir dal = bir görev = bir PR.
2. Geliştirme küçük adımlarla yapılır. Her adımdan sonra `bun run build` (0 hata), mantık değiştiyse `bun test`.
3. Commit mesajları `feat:` / `fix:` / `docs:` ile başlar.
4. `git push -u origin <dal>` → GitHub'da PR açılır. PR açıklaması: ne yapıldı (2–3 cümle) + yapay zekaya verilen görev + test sonucu.
5. **Ajan** PR'ı açar, build/test yeşilse kendisi **merge eder** (öğrencinin açık talimatı, 2026-10-07). Öğrenci istediği zaman "Files changed" sekmesinden inceleyebilir.
6. Bu belgedeki ilgili kutu aynı PR'da işaretlenir (`[x]`).

Etiketler: Hafta 3 sonu `v0.1.0-batch-01` (Görev 09), MVP sonu `v0.2.0-mvp`, tam sürüm `v1.0.0`.

---

## Faz 0 — Hafta 3 teslimi (son tarih: 9 Ekim 2026 23:59)

> Bu fazda **oyun kodu yazılmaz.** Hafta 3 notu tamamen bu görevlerden gelir. Oyuna başlamak teslimi riske atar.

| Durum | Görev | Dal | Hocanın dosyası |
|---|---|---|---|
| [x] | 02 Proje fikri + oyun planı | `feature/proje-fikri` | [02](tasks/week-3/02-proje-fikriniz.task.md) |
| [ ] | 04 AGENTS.md, CLAUDE.md, GEMINI.md | `feature/agents-md` | [04](tasks/week-3/04-agents.task.md) |
| [ ] | 05 Markalama, renk, ikon | `feature/branding` | [05](tasks/week-3/05-branding.task.md) |
| [ ] | 07 Mimari ağaç, responsive | `feature/mimari-agac` | [07](tasks/week-3/07-hedefler-agac-yapisi.task.md) |
| [ ] | 06 Bilgi sayfaları (4 dil) | `feature/bilgi-sayfalari` | [06](tasks/week-3/06-info-pages.task.md) |
| [ ] | 03 README | `feature/readme` | [03](tasks/week-3/03-readme.task.md) |
| [ ] | 08 İleri AGENTS.md | `feature/agents-pro` | [08](tasks/week-3/08-agents-pro.task.md) |
| [ ] | 09 Denetim + `v0.1.0-batch-01` etiketi | `feature/batch-01-denetim` | [09](tasks/week-3/09-progress-batch-01.task.md) |

Görev 01 ve 01.2 öğrencinin işidir (fork, collaborator daveti, form, ZIP); 01.2'nin PR şartı yukarıdaki PR'larla karşılanır.

### Faz 0 için projeye özgü kararlar
Puan kriterleri hocanın dosyalarında; burada yalnızca **bizim projeye ait** kararlar var.

**04 / 08 AGENTS.md**
- Proje adı: "Pancake Flip!". Hocanın şablonu kullanılır.
- Doküman tablosuna bütün `docs/*.md` dosyaları girer: `proje-fikri`, `oyun-tasarimi`, `oyun-mimarisi`, `gelistirme-plani`, `sonnet-talimati`, `klasor-mimarisi`, `branding`, `mimari-agac`, `kurulum`, `kurallar`, `teslim`, `kaynaklar` ve `tasks/`.
- Ek kurallar: "Oyun değerleri JSON'da, kodda sabit sayı yok", "`docs/tasks/` hocanındır, düzenlenmez", "yeni bağımlılık için öğrenciye sor".

**05 Markalama**
- Ton: sıcak, iştah açıcı, sevimli. Krem zemin, karamel ana renk, çilek vurgu, nane (başarı).
- Başlangıç önerisi (kontrast ≥ 4,5:1 olduğu **ölçülerek** doğrulanmalı, gerekirse koyulaştırılmalı):

| Token | Gündüz | Gece |
|---|---|---|
| `--zemin` | `#FFF8EC` | `#1E1510` |
| `--kart` | `#FFFFFF` | `#2A1F18` |
| `--metin` | `#3B2416` | `#FDF3E3` |
| `--renk-ana` (karamel) | `#B45309` | `#F59E0B` |
| `--vurgu` (çilek) | `#BE123C` | `#FB7185` |
| `--basari` (nane) | `#0F766E` | `#2DD4BF` |

- `AppHeader` logosu: "pancake<span>flip</span>". Pencere başlığı "Pancake Flip!", `productName` "pancake-flip", pencere 420×820 dikey kalır. Identifier: `edu.istinye.pancakeflip`.
- İkon: üst üste 3 krep + damlayan sos, düz renkli, 1024×1024 PNG. Önce SVG çizilir, PNG'ye çevrilir (yeni bağımlılık eklemeden: `bunx` ile geçici bir araç ya da tarayıcıda canvas ile dışa aktarma). Sonra `bun run tauri icon` ile bütün platform ikonları üretilir (Android ve iOS klasörleri dahil).
- Passo kırmızısı `#e4002b` ve "PassoKlon" yazıları bu görevde kaldırılır.

**07 Mimari ağaç**: sayfa ağacı şu rotalarla yazılır (servis ekranı dahil):
```
/                Bölümler (liste, filtre)
/bolum/[id]      Bölüm detayı (seçim, "Servise başla")
/servis/[id]     Servis (oyun) + Sonuç & adisyon kodu (Rust)
/fislerim        Fişlerim (Rust kodları geçmişi)
/mutfak          Yükseltmeler, malzeme rehberi, dekor
/profil          İstatistik, ayarlar, bilgi sayfalarına linkler
/hakkinda /iletisim /kosullar /gizlilik   (4 dil)
```
`klasor-mimarisi.md`'ye `src/lib/veri/` ve `src/lib/oyun/` birer satırla eklenir.

**06 Bilgi sayfaları**
- Dil yapısı önerisi: Astro'nun yerleşik `i18n` yönlendirmesi (`tr` varsayılan, `en`, `ar`, `fa`). `/en/hakkinda` gibi rotalar; `Layout.astro` dili ve `dir="rtl"` değerini rotadan alır. Yeni bağımlılık gerekmez.
- Hakkında: oyunun kısa anlatımı + etkileşimli bileşen (ör. tıklayınca dönen krep / mini "kendi kuleni yap" önizlemesi).
- Gizlilik: verilerin yalnızca cihazda `localStorage`'da tutulduğu ([oyun-tasarimi.md §14](oyun-tasarimi.md#14-kayıt-save)), KVKK.
- Profil sayfasından dört sayfaya link.

**03 README**: Başlık "Pancake Flip!", kısa tanıtım, en az 3 çalışan badge, kurulum, lisans, öğrenci adı ve numarası. Klasör ağacı kopyalanmaz, link verilir.

**09 Denetim**: Hocanın 9 maddelik matrisi doldurulur. Etiket `master` üzerinde, bütün PR'lar merge edildikten sonra atılır. Ekran görüntülerini öğrenci alır.

---

## Faz 1 — MVP (vize hedefi: "Bölüm 1–20 oynanır")

Her görevin sonunda oyun **çalışır durumda** olmalı. Bir görev bitmeden sonrakine geçilmez.

### G1 · Veri ve saf mantık — `feature/oyun-veri`
- **Amaç:** Arayüz olmadan bütün kuralların test edilebilir hâli.
- **Yapılacaklar:** `src/types/oyun.ts`; `src/lib/veri/` JSON'ları (malzemeler, müşteriler, yükseltmeler, 50 bölümün tamamı); `rng.ts`, `siparis.ts`, `pisirme.ts`, `degerlendirme.ts`, `ekonomi.ts`, `musteri.ts`, `kuyruk.ts` ve testleri; `package.json`'a `"test": "bun test"`.
- **Bitti sayılır:** `bun test` yeşil, `bun run build` 0 hata, hiçbir ekran değişmedi.
- **Test:** 1.000 farklı tohumla üretilen siparişlerin hepsi gramere uyuyor ve D aralığında (ya da en yakın); [§9.2](oyun-tasarimi.md#92-bir-siparişin-geliri) örneği net +29 veriyor; değerlendirmede eksik / fazla / yanlış / sıra / pişme vakaları ayrı ayrı doğru sonucu veriyor.

### G2 · Bölüm ekranları — `feature/bolum-ekranlari`
- **Amaç:** Şablonun liste ve detay ekranlarını oyuna çevirmek.
- **Yapılacaklar:** `/` → Bölümler (ızgara, yıldız, kilit, filtre); `/bolum/[id]` → detay (hedefler, yeni mekanik, menü, müşteri tipleri, "Servise başla" → `/servis/[id]` yer tutucu); alt menü sekmeleri; kilit ve yıldız için geçici kayıt okuması. Yerine geçen Passo dosyaları (Kesfet, EtkinlikDetay, `etkinlik/[id]`, `data.ts`) silinir.
- **Bitti sayılır:** Liste ve detay 375–430 px'de düzgün; Bölüm 1 açık, diğerleri kilitli; build 0 hata.
- **Test:** Filtreler; 50 detay sayfasının statik üretimi; gece teması; geri tuşu.

### G3 · Servis çekirdeği — `feature/servis-cekirdek`
- **Amaç:** Bölüm 1–3 baştan sona oynanabilsin.
- **Yapılacaklar:** `/servis/[id]` (`tamEkran`, `client:only`); `motor.ts`, `servis.svelte.ts`, `jest.ts`; Tava (halka, renk, yukarı kaydırma), Tabak (kule görseli, çöp), Malzeme rafı, tek müşteri slotu, sipariş kartı (✓ / kırmızı), "Ver"; değerlendirme sonucu yazısı (PERFECT / GREAT / GOOD / OLMADI + 2 satır neden).
- **Bitti sayılır:** Bölüm 1–3 tarayıcıda mobil görünümde ve `tauri dev`'de oynanıyor; doğru tabak PERFECT, eksik tabak GOOD/OLMADI veriyor.
- **Test:** Erken çevirme (çiğ), geç çevirme (fazla), yanık (otomatik çöp), çöp kutusu (basılı tutma), 60 fps hissi (DevTools Performance).

### G4 · Müşteri sistemi — `feature/musteri-sistemi`
- **Amaç:** Zaman baskısı ve önceliklendirme.
- **Yapılacaklar:** Kuyruk ve gelme aralığı; 3 slot; sabır halkası ve 5 yüz; Bölüm 10'dan sonra gitme; tipler: Normal, Çocuk, Aceleci, Cömert, Eleştirmen; 👀 kaçma riski; A/O/İ pişme dereceleri (Bölüm 8+); ikinci tava (Bölüm 12+).
- **Bitti sayılır:** Bölüm 1–20 sonuna kadar oynanabiliyor (henüz para yok).
- **Test:** Bölüm 9'da müşteri gitmiyor, 10'da gidiyor; Çocuk siparişleri D ≤ 4; 👀 müşteri geç servis edilince kaçıyor; iki tava aynı anda çalışıyor.

### G5 · Servis sonucu ve Rust adisyonu — `feature/servis-sonucu`
- **Amaç:** Şablonun "kod üretme" ekranı; ekonomi.
- **Yapılacaklar:** Ödeme, bahşiş, combo, maliyet (uçan "−2"); üst çubukta coin ve combo; servis sonu → `SonucPenceresi` (yıldızlar, döküm); Rust `fis_olustur` + `fisler.svelte.ts`; `/fislerim` (Biletlerim yerine; Passo dosyaları silinir).
- **Bitti sayılır:** `tauri dev`'de servis bitince `KRP-007-3A9F1C2` biçiminde kod çıkıyor ve Fişlerim'de görünüyor; tarayıcıda `WEB-` yedeği çalışıyor.
- **Test:** Yıldız eşikleri; combo artışı / sıfırlanması; `cargo test` formatı.

### G6 · Kayıt ve ilerleme — `feature/kayit-ilerleme`
- **Amaç:** Kalıcı ilerleme ve harcama.
- **Yapılacaklar:** `kayit.svelte.ts` (sürümlü); kilit açma (≥ 1 yıldız); `/mutfak` (Tava ve Sos şişesi yükseltmeleri, malzeme rehberi); Profil (istatistik, ses / titreşim / ipucu / dokunarak çevir ayarları, kaydı sıfırla). `sepet.svelte.ts` ve `/sepet` silinir.
- **Bitti sayılır:** Uygulama kapatılıp açılınca her şey yerinde; yükseltme pişirmeyi gerçekten hızlandırıyor.
- **Test:** Bozuk / eski kayıtla açılış (çökmemeli); coin yetmezken satın alma engelli.

### G7 · Öğretici ve his — `feature/ogretici-geribildirim`
- **Amaç:** "30 saniyede öğren" ve PERFECT tatmini.
- **Yapılacaklar:** Bölüm 1, 3, 5, 8, 12 öğreticileri (el ikonu, kelimesiz); PERFECT animasyonu, konfeti, uçan coin; Web Audio sesleri; titreşim; otomatik duraklatma; duraklatma menüsü (devam / yeniden / çık).
- **Bitti sayılır:** Oyunu hiç görmemiş biri Bölüm 1'i metin okumadan bitirebiliyor (öğrenci bir arkadaşıyla dener).
- **Test:** Arka plana alınca duruyor; sessiz ayarında ses yok.

### G8 · MVP dengesi — `feature/mvp-denge`
- **Amaç:** 1–20 eğlenceli ve adil.
- **Yapılacaklar:** Öğrenci 1–20'yi oynar, notlarını verir; değerler **yalnızca JSON'da** ayarlanır; hatalar düzeltilir. Görülen yeni bilgiler ilgili `docs/*.md` dosyasına yazılır.
- **Bitti sayılır:** Her bölüm en az bir kez ⭐⭐ ile geçildi; çökme yok. `master`'a `v0.2.0-mvp` etiketi.

---

## Faz 2 — Tam sürüm (final hedefi)

Sıra [oyun-tasarimi.md §15.2](oyun-tasarimi.md#152-tam-sürüm-final-hedefi-önem-sırasıyla)'deki önem sırasıdır.

| Durum | Görev | Dal |
|---|---|---|
| [ ] | F1 İkinci tabak + iki tabaklı sipariş | `feature/ikinci-tabak` |
| [ ] | F2 Kararsız, VIP, Şüpheli müşteriler | `feature/ileri-musteriler` |
| [ ] | F3 Bölüm 21–50, dondurma, dalgalar, özel bölümler | `feature/bolum-21-50` |
| [ ] | F4 Bahşiş kavanozu, bekleme köşesi, dekor | `feature/yukseltme-dekor` |
| [ ] | F5 Oyun içi 4 dil + RTL | `feature/oyun-i18n` |
| [ ] | F6 Başarımlar, günlük görev | `feature/basarimlar` |
| [ ] | F7 Android derlemesi (`bun run tauri android init/build`) | `feature/android` |
| [ ] | F8 Sonsuz Servis | `feature/sonsuz-servis` |
| [ ] | Son denetim + `v1.0.0` | `feature/final-denetim` |

Her F görevi aynı kalıpla yazılır (amaç, yapılacaklar, bitti sayılır, test) ve görev başlarken bu belgeye eklenir.

---

## Öğrencinin kendi yapması gerekenler

- [ ] Blackboard formu (7 Ekim 23:59, **tek deneme**)
- [ ] Hocayı (`keyvanarasteh`) collaborator olarak davet etmek
- [ ] Her PR'ı inceleyip merge etmek
- [ ] `bun run tauri dev` ekran görüntüleri
- [ ] 9 Ekim 23:59 öncesi GitHub → Code → Download ZIP → Blackboard'a yükleme
- [ ] Hocaya sorulacaklar (Telegram, Soru-Cevap başlığı): (1) Blackboard'a PR linki de eklenecek mi, yalnızca ZIP mi? (2) Repo adı `hello-mobil` dışında olabilir mi (Görev 01 puan tablosu `hello-mobil` diyor)?
