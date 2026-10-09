# Veri Modeli

Uygulamanın veri sözleşmesi [`src/lib/types/`](../src/lib/types/) altındadır; her tip ailesi ayrı dosyada durur ve `index.ts` hepsini dışa aktarır:

```ts
import type { Fis, Malzeme, Musteri } from "$lib/types";
```

**Kural:** Yeni veri alanı önce `src/lib/types/` içinde tanımlanır, sonra kullanılır. Bileşen ya da store içinde tip tanımlanmaz. Oyun sayıları JSON'da kalır ([`AGENTS.md`](../AGENTS.md)).

## Kayıtlar nerede

| Tip | Kayıtlar | Sayı |
|---|---|---|
| `Malzeme` | [`src/lib/veri/malzemeler.json`](../src/lib/veri/malzemeler.json) | 8 |
| `MusteriTipi` | [`src/lib/veri/musteriler.json`](../src/lib/veri/musteriler.json) | 4 |
| `Siparis`, `Musteri`, `Fis` | [`src/lib/veri/ornek.ts`](../src/lib/veri/ornek.ts) (tipli örnek veri) | 6'şar |
| `SeviyeYapilandirmasi` | [`src/lib/veri/seviye.json`](../src/lib/veri/seviye.json) | 1 |
| `Ayarlar` | [`src/lib/veri/ayarlar.json`](../src/lib/veri/ayarlar.json) | 1 |
| `IlerlemeVerisi`, `Fis[]` | Cihazda: localStorage `pancakeflip-ilerleme`, `pancakeflip-kayit` | — |

Örnek verinin tiplere ve oyun verisine uyduğunu [`src/lib/oyun/ornek.test.ts`](../src/lib/oyun/ornek.test.ts) denetler.

## İlişkiler

```
MusteriTipi 1 ──< Musteri            (Musteri.tip = MusteriTipi.id)
Musteri     1 ─── 1 Siparis          (Musteri.siparis)
Siparis     1 ──< Malzeme            (Siparis.parcalar[] = Malzeme.id, alttan üste)
Tabak       = TabakParcasi[]         (TabakParcasi.malzeme = Malzeme.id; tabak bir siparişin birebir aynısı olunca servis edilir)
Servis      → Sonuc                  (perfect / great / good / olmadi)
Seviye      → Fis                    (kilometre taşı ya da her 10. seviyede bir Fis; Fis.bolum = seviye)
IlerlemeVerisi                       (oyuncunun seviyesi, ilerlemesi ve sayaçları; tek kayıt)
```

## Tipler

### Malzeme (`malzeme.ts`)

| Alan | Tip | Zorunlu | Açıklama |
|---|---|:-:|---|
| `id` | `string` | ✓ | Benzersiz kimlik (`cikolata`); siparişte ve `/rehber/<id>` adresinde |
| `ad` | `string` | ✓ | Türkçe ad |
| `kategori` | `Kategori` | ✓ | `krep` / `dolgu` / `sos` / `topping` |
| `acilis` | `number` | ✓ | Açıldığı seviye |
| `maliyet` | `number` | ✓ | Tabağa konunca düşülen coin |
| `deger` | `number` | ✓ | Siparişte kazandırdığı coin |
| `ikon` | `string` | ✓ | Emoji |
| `renkDegiskeni` | `string` | ✓ | Kabın rengi (`app.css` değişkeni) |
| `tatli` | `boolean` |  | Tatlı mı (çocuk müşteri tatlı ister) |

### Siparis ve Sonuc (`siparis.ts`)

| Alan | Tip | Zorunlu | Açıklama |
|---|---|:-:|---|
| `parcalar` | `string[]` | ✓ | Malzeme id'leri, alttan üste |
| `d` | `number` | ✓ | Zorluk puanı |
| `tercih` | `Kalinlik` |  | `ince` / `normal` / `kalin`; yoksa fark etmez |

`Sonuc`: `perfect` / `great` / `good` / `olmadi`.

### MusteriTipi ve Musteri (`musteri.ts`)

| Alan (MusteriTipi) | Tip | Zorunlu | Açıklama |
|---|---|:-:|---|
| `id`, `ad`, `ikon` | `string` | ✓ | Kimlik, ad, emoji |
| `acilis` | `number` | ✓ | Açıldığı seviye |
| `agirlik` | `number` | ✓ | Görülme ağırlığı (normal = 1) |
| `sabir`, `odeme`, `bahsis`, `ceza` | `number` | ✓ | Sabır süresi ve para çarpanları |
| `dKaydirma` | `number` | ✓ | Sipariş zorluğuna eklenen kaydırma |
| `dMax` | `number` |  | Zorluk üst sınırı |
| `tatliMi` | `boolean` |  | Yalnız tatlı ister mi |

| Alan (Musteri) | Tip | Zorunlu | Açıklama |
|---|---|:-:|---|
| `id` | `number` | ✓ | Sahnedeki numara |
| `tip` | `string` | ✓ | `MusteriTipi.id` |
| `siparis` | `Siparis` | ✓ | İstediği tabak |
| `sabirToplam`, `sabir` | `number` | ✓ | Başlangıç ve kalan sabır (sn) |

### TabakParcasi ve pişme durumları (`tabak.ts`)

| Alan | Tip | Zorunlu | Açıklama |
|---|---|:-:|---|
| `malzeme` | `string` | ✓ | `Malzeme.id` |
| `pisme` | `PismeBolgesi` |  | Yalnız krep: `cig` / `az` / `orta` / `iyi` / `fazla` / `yanik` |
| `kalinlik` | `Kalinlik` |  | Yalnız krep |
| `usta` | `boolean` |  | Yalnız krep: kusursuz döküm ve çevirme (PERFECT) |

`PismeDurumu` (oyuncuya görünen): `cig` / `pismis` / `yanik`. `CevirKalitesi`: `kacti` / `erken` / `iyi` / `mukemmel` / `gec`.

### Fis (`fis.ts`)

| Alan | Tip | Zorunlu | Açıklama |
|---|---|:-:|---|
| `kod` | `string` | ✓ | Rust'tan `KRP-SSS-YXXXXXX`, tarayıcıda `WEB-…` |
| `bolum` | `number` | ✓ | Fişin kesildiği seviye |
| `yildiz` | `number` | ✓ | 0–3 (`Yildiz`) |
| `net` | `number` | ✓ | Önceki fişten bu yana kazanılan coin |
| `kasa` | `number` |  | Fiş anındaki toplam coin (eski fişlerde yok) |
| `tarih` | `string` | ✓ | ISO 8601 |

### Seviye ve ilerleme (`seviye.ts`)

- `SeviyeAyari`: bir seviyenin bütün oyun parametreleri (gereken müşteri, menü, tava sayısı, açık mekanikler, eğrilerden gelen hız ve sabır değerleri); seviye numarasından hesaplanır.
- `SeviyeYapilandirmasi`: `seviye.json` dosyasının yapısı.
- `Acilis`: bir seviyede açılan yenilik (`tur`: `malzeme` / `musteri` / `mekanik`, `id`, `ad`, `ikon`, `seviye`).
- `IlerlemeVerisi`: cihazdaki kayıt (`surum: 1`, `seviye`, `ilerleme`, `toplamMusteri`, `toplamCoin`, `enYuksekSeviye`, `enIyiSeri`, `toplamMukemmel`).

### Ayarlar (`ayarlar.ts`)

`ayarlar.json` dosyasının yapısı: pişme, hamur, süreler, cezalar, ödeme çarpanları ve ruh hâli eşikleri. Her alanın açıklaması tip dosyasında yazılıdır.

### Arayüz tipleri (`arayuz.ts`)

Oyun kuralı değil, yalnız görünüm durumu: `Tema` (`gunduz` / `gece`), `Ayrilan` (tepki gösteren ayrılan müşteri), `Fx` (tavadaki kısa ömürlü efekt), `SonucMesaji` (tabaktaki sonuç damgası), `SeviyeBildirimi` (seviye şeridi), `DusenParca`, `UcanPara` ve `KazancEtiketi` (servis animasyonları).

## Mantık modüllerinin iç tipleri

Saf oyun kurallarının kendi çalışma durumu (`Oturum`, `Tava`, `Hamur`, `Degerlendirme`, `Rng` gibi) o kuralı yazan modülde, `src/lib/oyun/*.ts` içinde kalır: bunlar saklanan ya da ekranlar arasında taşınan veri değil, bir kuralın ara hesabıdır. Bileşenler ve store'lar bu modüllerin dışa aktardığı işlevleri kullanır, tip tanımlamaz.
