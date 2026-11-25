# 26 — Yönetim Paneli 4/4: Kayıtlar

Dal: `feature/admin-panel-kayitlar`.

## Araç ve model

Codex masaüstü uygulaması, GPT-6.

## Şartname

- **Amaç:** Oyuncular, Fişler, Şüpheli Kayıtlar ve Denetim Günlüğü ekranlarını mevcut yerel arka uca bağlamak.
- **Kapsam dışı:** Oyun davranışı ve sayıları, yeni bağımlılık, Rust/veritabanı değişikliği, tam ilerleme sıfırlama, yeni hile algılama kuralları ve rol yönetimi.
- **Kabul ölçütleri:** İzinlere bağlı dört ekran; arka uçta arama, süzgeç ve sayfalama; oyuncu detayı ve gerekçeli seviye ayarı; fiş detayı ve Rust ile kod çözme; şüpheli kayıt durumu güncelleme; salt okunur denetim ayrıntıları. Listeler `yukleyici.ts` üzerinden yüklenir, dört liste hâli ve `?durum=` desteklenir. Metinler sözlükten, renkler mevcut CSS değişkenlerinden gelir. Test, tip denetimi ve build geçer.
- **Dokunulacak dosyalar:** `src/components/admin/{YonetimPaneli,Oyuncular,OyuncuDetayi,Fisler,FisDetayi,SupheliKayitlar,DenetimGunlugu,Sayfalama}.svelte`; `src/lib/types/yonetim.ts`; `src/lib/{native,yonetim,admin-sozluk,yukleyici,yonetim.test,yukleyici.test}.ts`; `docs/{komutlar,platform-destegi,mimari-agac,veri-modeli,gelistirme-notlari,gelistirme-plani}.md`; `docs/istemler/README.md`; bu günlük.
- **Doğrulama adımları:** `bun test`, `bun run check`, `bunx svelte-check --threshold warning`, `bun run build`; masaüstü/390×844, gündüz/gece, izinler, sayfalama, liste hâlleri, seviye gerekçesi ve hata sonrası tekrar deneme.

## İstem

Öğrenci: “Yönetim paneli 4/4 — Oyuncular, Fişler, Şüpheli Kayıtlar, Denetim Günlüğü. Dal: feature/admin-panel-kayitlar. Önce şartnameyi ve planı sun.”

## Plan ve onay

Önce şartname ve dosya listesi sunuldu. Öğrenci onayı: “yap da aradan çıksın. maksat onaylanmış olsun”.

1. Önce tipler, ardından `native.ts` ve ortak yükleyici.
2. Dört ekranı mevcut panel, sözlük ve ortak UI parçalarıyla kur.
3. Seviye ayarı ve inceleme durumunu izinlerle bağla; başarılı işlemden sonra yeniden yükle.
4. Doğrula, belgeleri ve görev kutusunu güncelle; tek PR hazırla.

Görev bu oturumda Codex tarafından yürütülüyor; başlangıçta açık PR ve “Kimde ne var” kaydı yoktu. `master` temiz ve `56fac81` commit'indeydi.

## Düzeltmeler ve kararlar

Fişlerin arka uçtaki anahtarı `kod`; `bolum` alanı arayüzde seviye olarak gösterilir. Kod çözme, kriptografik doğrulama değildir. `FraudFlag.durum = yaptirim`, oyuncu hesabını otomatik engellemez. Eski panelin sahte alanları taşınmaz.

- Oturum izniyle değişen menü `$derived` oldu; çıkışta sekme özete döner. İlk Svelte denetiminde oturum değişkeninin tanım sırası ve kullanılmayan bir CSS seçicisi yakalandı, düzeltildi.
- Liste istekleri sıra numarası taşır; eski istek yeni sonucun üstüne yazamaz. Sayfalama arka uçta, 25 kayıtla yapılır.
- `yukleyici.ts` içindeki eski fiş store'u yalnız ihtiyaç olduğunda yüklenir; yönetim yükleyicisi Bun'da Svelte runtime gerektirmeden sınanabilir.
- UTC tarih üst sınırı arka ucun saniye hassasiyetindeki ISO biçimiyle aynı tutuldu; son saniyenin dışlanmaması için sınır testi eklendi.
- Yeni dosyalar Git'e eklenince `diff --cached --check` boşluk hatalarını da yakaladı; üretim taslağından kalan satır sonu boşlukları temizlendi.
- E-posta ön yüzde `Reveal:PII` iznine göre maskelenir; mevcut arka uçtaki alan erişimi değiştirilmedi (ayrıntı: [platform desteği](../platform-destegi.md)).

## Doğrulama

12.11.2026:

```text
bun test                              129 pass, 0 fail (10 dosya)
bun run check                         79 dosya; 0 errors, 0 warnings, 0 hints
bunx svelte-check --threshold warning  0 errors, 0 warnings
bun run build                         58 sayfa; çıkış 0
git diff --check                      çıktı yok
git diff --cached --check             çıktı yok (yeni dosyalar dahil)
Dil kuralı (git grep, günlük 19)      eşleşme yok; çıkış 1
```

Yeni testler: seviye sınırı/NaN/kesir/gerekçe, boş değer gösterimi, sıfır yıldız süzgeci, UTC gün sonu; web'de özel kaynakların engellenmesi, sorgunun Rust'a taşınması, zorlanan liste hâlleri ve tekrar deneme, seviye komutunun alan hatası, inceleme güncellemesinin yetki hatası.

**Elle, sahte Tauri sınırıyla:** Gerçek kaynak bileşenlerini çalıştıran Astro sunucusunun önüne yalnız localhost'ta geçici bir test sunucusu kuruldu; `auth_me`, `crud_index`, `player_set_level`, `crud_update`, `fis_coz` yanıtları sahteydi. Gerçek veritabanına yazılmadı; test sunucusu depoya eklenmedi.

- 26 oyuncu: ikinci sayfada yalnız 26. oyuncu, önceki/sonraki düğmeleri doğru.
- Oyuncu detayı: seviye 3 → 12; önce arka uç alan hatası gösterildi, sonraki başarılı deneme tabloyu yeniledi.
- Fiş detayı: kod çözüldü ve kayıtla uyum gösterildi; sıfır yıldız filtresi boş hâl verdi.
- Şüpheli kayıt: kanıt açıldı, Açık → Temiz güncellendi ve tablo yenilendi.
- Denetim detayı: aktör/hedef/gerekçe ve önce/sonra JSON görüldü; düzenleme yok.
- Viewer: Denetim Günlüğü menüsü yok; seviye ayarı ve inceleme kaydetme düğmesi yok; e-posta maskeli.
- Dört ekranda `?durum=hata` → hata, **Tekrar dene** → dolu liste. `bos`, `yukleniyor`, `ornek` hâlleri de görüldü.
- 390×844: dört ekranda sayfa genişliğini aşan taşma yok, tablolar kendi içinde kayıyor. Gündüz/gece ve 1280 px masaüstü görünümü kontrol edildi.
- Normal tarayıcı `/admin`: dört yeni menü görünmüyor; içerik özeti çalışıyor.

**Denenmeyen:** Gerçek Tauri/SQLite ve mobil cihazda elle deneme yapılmadı. Rust değişmediği için `cargo test` çalıştırılmadı. Öğrencinin gerçek uygulamada aynı seviye ayarının denetim kaydını kontrol etmesi gerekir.
