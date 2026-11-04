# Rust Komutları

Rust komutları [`src-tauri/src/lib.rs`](../src-tauri/src/lib.rs) içindedir. Ön yüz onları **yalnız** [`src/lib/native.ts`](../src/lib/native.ts) üzerinden çağırır; bileşenlerde ve store'larda doğrudan Tauri çağrısı yoktur. Sonuç ve hata tipleri [`src/lib/types/native.ts`](../src/lib/types/native.ts) içindedir ve Rust yapılarıyla aynı alanlara sahiptir.

Her komut başarıda alanları belli bir yapı, başarısızlıkta türü belli bir hata döner; düz metin dönmez, geçersiz girdide panik yapmaz. `native.ts` bunu istisna fırlatmayan bir sonuca çevirir:

```ts
type NativeSonuc<T> = { ok: true; veri: T } | { ok: false; hata: NativeHata };
```

## `fis_olustur`

Seviye adisyonu (fiş) kodu üretir. Oyunda kilometre taşlarında ve her 10. seviyede çağrılır ([`fisler.svelte.ts`](../src/lib/fisler.svelte.ts)).

| | |
|---|---|
| Ön yüz | `fisOlustur(seviye, yildiz)` |
| Girdi | `seviye: number` (1 – 1.000.000.000), `yildiz: number` (0–3) |
| Başarı | `Adisyon { kod, seviye, yildiz }`; kod `KRP-SSS-YXXXXXX` (seviye en az 3 hane, yıldız, zamandan 6 haneli hex) |
| Hatalar | `GecersizSeviye { seviye }`, `GecersizYildiz { yildiz }` |
| Tarayıcı yedeği | Aynı girdi denetimi; kod `WEB-SSS-Y…` |

## `fis_coz`

Bir adisyon kodunu parçalarına ayırır. Fişlerim ekranındaki **Adisyon kodu çöz** bölümünde kullanılır (`/fislerim?kod=KRP-…` bağlantısı kodu doldurup hemen çözer).

| | |
|---|---|
| Ön yüz | `fisCoz(kod)` |
| Girdi | `kod: string` (baştaki / sondaki boşluk kırpılır) |
| Başarı | `FisBilgisi { kod, seviye, yildiz, damga }` |
| Hatalar | `BosKod`, `GecersizKod { kod }` (biçim `KRP-SSS-YXXXXXX` değil), `GecersizSeviye { seviye }` |
| Tarayıcı yedeği | `YalnizUygulamada`; bu yüzden bölüm tarayıcıda hiç gösterilmez ([`platform-destegi.md`](platform-destegi.md)) |

## Yönetim paneli (yerel arka uç)

Yerel arka ucun komutları ve tabloları [`backend.md`](backend.md)'dedir. Yönetim paneli (`/admin`) bunları yine yalnız `native.ts` üzerinden çağırır; sonuç tipleri [`src/lib/types/yonetim.ts`](../src/lib/types/yonetim.ts) içindedir.

| `native.ts` | Rust komutu | Sonuç |
|---|---|---|
| `yonetimOturumu()` | `auth_me` | `YonetimOturumu \| null` (oturum yoksa `null`) |
| `yonetimGiris(eposta, parola)` | `auth_login` | `YonetimOturumu` |
| `yonetimKayit(ad, eposta, parola)` | `auth_register` | `YonetimOturumu` (ilk hesap yönetici olur) |
| `yonetimCikis()` | `auth_logout` | `null` |
| `panelOzeti()` | `pancake_dashboard` | `PanelOzeti` (`ViewAny:Player` izni gerekir) |
| `kayitListesi(kaynak, sorgu?)` | `crud_index` | `Sayfa<…>`; kaynaklar: `Malzeme`, `MusteriTipi`, `GameConfig`, `ContentVersion` |
| `kayitEkle(kaynak, veri)` | `crud_store` | eklenen kayıt |
| `kayitGuncelle(kaynak, id, veri)` | `crud_update` | güncel kayıt (yalnız gönderilen alanlar değişir; `null` isteğe bağlı alanı siler) |
| `kayitSil(kaynak, id, neden?)` | `crud_destroy` | `null` (neden denetim günlüğüne) |
| `icerikYayinla(id, not?)` | `content_publish` | yayınlanan `IcerikSurumu` (arka uç içeriği doğrular) |
| `icerikGeriAl(kapsam, neden)` | `content_rollback` | yayına dönen önceki `IcerikSurumu` |

Tarayıcıda hepsi `YalnizUygulamada` döner; tek istisna `kayitListesi`: oyunun JSON verisini salt okunur tek sayfa olarak döndürür (`ContentVersion` için boş liste).

## Hata biçimi

Rust hataları `{ "tur": "...", ... }` JSON nesnesi olarak gelir (`#[serde(tag = "tur")]`):

```json
{ "tur": "GecersizYildiz", "yildiz": 9 }
{ "tur": "BosKod" }
{ "tur": "GecersizKod", "kod": "WEB-010-3ABC" }
```

Yerel arka uç komutlarının hataları `{ "code", "message", "errors"? }` biçiminde gelir (`src-tauri/src/backend/error.rs`); `native.ts` bunları `{ tur: "ArkaUc", kod, mesaj, alanlar? }` hatasına çevirir. İletiler Türkçedir ve arayüzde olduğu gibi gösterilir.

`native.ts` ayrıca iki hata ekler: `YalnizUygulamada` (tarayıcıda, Rust yok) ve `Bilinmeyen { mesaj }` (beklenmeyen durum). Arayüzde hatalar `ui/HataDurumu` ile gösterilir.

## Testler

- Rust: `cd src-tauri && cargo test` — kod biçimi, geçerli ve geçersiz girdi, kod çözme, bozuk kodlar, hata JSON biçimi.
- Ön yüz yedeği: `bun test` → [`src/lib/native.test.ts`](../src/lib/native.test.ts).
