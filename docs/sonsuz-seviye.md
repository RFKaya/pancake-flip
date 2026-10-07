# Sonsuz Seviye Sistemi — Pancake Flip!

> Oyunun ilerleme omurgası **bölüm değil, sonsuz LEVEL**'dir. Eski "7 bölüm → oyun biter" yapısı kaldırıldı. Bu belge yeni sistemin tek kaynağıdır; sayılar [`src/lib/veri/seviye.json`](../src/lib/veri/seviye.json), kurallar [`src/lib/oyun/seviye.ts`](../src/lib/oyun/seviye.ts) ve [`oturum.ts`](../src/lib/oyun/oturum.ts)'tedir. Oyunun geri kalan kuralları için [`oyun-tasarimi.md`](oyun-tasarimi.md).

## 1. Akış

```
Müşteri gelir → sipariş hazırlanır → Ver → +coin, +1 müşteri → ilerleme çubuğu dolar → LEVEL UP → yeni parametreler → sonraki müşteri
```

Bölüm sonu ekranı, "tamamlandı" penceresi ya da oyun sonu **yoktur**. Seviye atlama kısa bir bildirimdir (`✨ LEVEL 25 ✨`), oyunu durdurmaz. Kilometre taşlarında (10, 25, 50, 100, 250, 500, 1000) başlık da çıkar: *YENİ MÜŞTERİLER!*, *YENİ SOSLAR!*, *VIP MÜŞTERİLER!*, *MASTER CHEF!*, *PANCAKE LEGEND!*, *PANCAKE GOD!*, *SONSUZ USTA!*. Bunlar bitiş değil, başarımdır; 501, 502… devam eder.

## 2. İlerleme: `gerekenMusteri(seviye)`

Her başarılı müşteri ilerlemeye katkı verir (`seviye.json` → `ilerleme`): PERFECT/GREAT/GOOD = +1, OLMADI = 0, giden müşteri = 0 (seri de sıfırlanır). İyi oynamak daha verimlidir: **üst üste her 5. PERFECT +1 bonus ilerleme** verir; ayrıca combo çarpanı (15. seviyeden) ve PERFECT bonusu coini artırır.

Gereken müşteri sayısı, ayarlanabilir **noktalardan** log-seviye ölçeğinde doğrusal geçişle bulunur (tam sayıya aşağı yuvarlanır):

| Seviye | 1 | 2 | 3 | 5 | 10 | 20 | 50 | 100 | 200 | 500 | 1000 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Gereken müşteri | 1 | 1 | 2 | 3 | 4 | 5 | 8 | 10 | 15 | 20 | 25 |

Son noktadan sonra her seviye ikilemesinde (+`ileriArtis` = 2) yavaşça artar ve `tavan` (40) ile kesilir. Yani seviye başına süre sonsuza kadar uzamaz. Denge ayarı = JSON'daki `noktalar` listesini düzenlemek.

## 3. Zorluk: seviye ile ayrı, doyuma giden bir eğri

`zorluk(L) = 1 − e^(−(L−1)/70)` → 0 (L1), 0,29 (L25), 0,51 (L50), 0,76 (L100), 0,94 (L200), ≈1 (L500+). Sonsuza kadar büyümez; 1'e yaklaşır (plato). L500, L50'nin ≈2 katı zordur, 10 katı değil.

Her sürekli parametre `seviye.json → egriler` içinde **[kolay uç, zor uç]** çiftidir ve `değer = kolay + (zor − kolay) × zorluk` ile hesaplanır. Zor uçlar bilinçli olarak yapılabilir seçilmiştir (süreler asla 0'a, sabır negatife inmez):

| Parametre | Kolay (L1) | Zor (plato) | Etkisi |
|---|---|---|---|
| `cevirPencere` | 0,40 | 0,08 | çevirme / servis zamanlaması penceresi |
| `hamurTolerans` | 0,45 | 0,12 | ideal hamur miktarı toleransı |
| `pisirmeHizi` | ×1,0 | ×1,8 | krep pişme hızı |
| `sabirCarpani` | ×3,0 | ×0,85 | müşteri sabrı (taban: `sabirMin` = 8 sn) |
| `gelmeAraligi` | 10 sn | 4 sn | birden fazla slotta yeni müşteri sıklığı |
| `ozelMusteriCarpani` | ×1 | ×2 | özel müşteri tiplerinin görülme ağırlığı |
| `tercihOlasiligi` | %25 | %50 | kalınlık tercihi isteyen müşteri oranı |

Sabır: `(10 + 5·D) × sabirCarpani × tipÇarpanı` (D = sipariş zorluk puanı).

Basamaklı (sürekli olmayan) kısım `kademeler` listesidir: bir seviyeden itibaren geçerli **krep sayısı aralığı, D aralığı, aynı anda müşteri sayısı ve tava sayısı**. Son kademeden sonrası plato: yeni mekanik gelmez, çeşitlilik ve optimizasyon baskısı artar (daha çok kombinasyon, daha hızlı müşteri, daha dar pencere).

## 4. Açılışlar (milestone'lar)

Malzeme ve müşteri açılışları ilgili JSON'daki `acilis` (seviye) alanındadır; mekanikler `seviye.json → mekanikler`.

| Seviye | Yenilik |
|---|---|
| 1 | Sade krep, tek müşteri, çevirme **yok** (ilk yüz pişince aşağı kaydır) |
| 3 | 🔄 Çevirme |
| 5 | 🍫 Çikolata |
| 8 | 🍒 Çilek dilimi |
| 10 | 🍓 Çilek sosu, 🧒 Çocuk müşteri |
| 12 | 🧈 Tereyağı |
| 15 | 👥 2 müşteri aynı anda + 2. tava, combo |
| 18 | 🍌 Muz |
| 20 | 📏 Kalınlık tercihleri (müşteri ince/kalın krep ister) |
| 25 | 🍯 Bal (sos) |
| 30 | 🧐 Eleştirmen müşteri (katı, iyi öder) |
| 50 | 🤵 VIP müşteri, 🌰 Fındık (gelişmiş topping) |
| 75 | 3 müşteri aynı anda |
| 100 | Gelişmiş siparişler (5 krep'e kadar, D 5–12) |
| 150 | 🔥 Yoğun saat: her 20 müşteride 20 sn boyunca müşteriler 2× sık gelir, kazanç ×1,5 |

Toplam malzeme sayısı sabittir (7 + krep); sonsuz malzeme açılmaz.

> Not: ilk tasarım notunda VIP hem 50. hem 75. seviyede geçiyordu; kilometre taşı metni (50) esas alındı, 75'te 3. müşteri slotu açılır.

## 5. Sonsuz üretim

Seviye dosyası yoktur. `seviyeAyari(seviye)` (saf fonksiyon) → zorluk → açık malzemeler → kademe → sipariş üretici (`siparis.ts`, tohumlu) → müşteri sabrı. Aynı seviye numarası her zaman aynı kuralları verir; `seviyeSinirla` girdiyi `[1, 1 000 000 000]` aralığına çeker, ekrandaki büyük sayılar `sayiKisalt` ile kısalır (100K, 1.2M…).

## 6. Kayıt

[`src/lib/ilerleme.svelte.ts`](../src/lib/ilerleme.svelte.ts), anahtar `pancakeflip-ilerleme` (sürümlü, bozuk veriyle çökmez): `seviye`, `ilerleme`, `toplamMusteri`, `toplamCoin`, `enYuksekSeviye`. Açılan malzemeler ve mekanikler seviyeden **hesaplanır**, kayda yazılmaz (bayatlayamaz). Kayıt her servisten sonra yazılır. Fişlerim: her kilometre taşında ve her 10. seviyede bir adisyon (`fis_olustur`, kodun "bölüm" alanı seviyedir, yıldız = 3, net = toplam coin) eklenir; test seviyesinde eklenmez. Eski bölüm kaydı (`kayit.svelte.ts`) artık kullanılmaz; Fişlerim (G5) yeni modele uyarlanana kadar yerinde bırakıldı.

## 7. Geliştirici modu

Oyun ekranında sağ üstteki 🛠 düğmesi (geliştirme sunucusunda `bun run dev` her zaman görünür; yayın derlemesinde adrese `?dev=1` eklenince açılır, `?dev=0` kapatır).

- **Set Level**: sayı yaz → *SET LEVEL*. Ayrıca −1/+1, −10/+10, hızlı seçimler (1, 10, 50, 100, 500, 1000), MAX (9999), *RESET PROGRESSION*.
- Seviye değişince seviyenin bütün parametreleri (zorluk, malzemeler, müşteri tipleri, sipariş, süreler, açılışlar) anında o seviyeye geçer; panel açıkken oyun duraklar ve parametreleri tablo olarak gösterir.
- **Test durumu**: seviye değişikliği gerçek kaydı **bozmaz** (üstte `TEST` rozeti, kayıt yazılmaz). *Kayda uygula* test seviyesini gerçek kayda yazar; *Testten çık* kayda döner; *Kaydı sil* gerçek kaydı siler (onay sorar).

## 8. Test

`bun test` → [`seviye.test.ts`](../src/lib/oyun/seviye.test.ts) (eğriler, uç seviyeler 1…10⁹, açılışlar, sipariş yapılabilirliği, sabır > 0, plato) ve [`oturum.test.ts`](../src/lib/oyun/oturum.test.ts) (müşteri akışı, giden müşteri, seviye atlama, seri bonusu, yoğun saat, 20 000 müşterilik bot simülasyonu).
