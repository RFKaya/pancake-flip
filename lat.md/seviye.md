# Sonsuz Seviye

Bölüm yoktur; ilerleme sonsuz LEVEL'dir. Zorluk doyuma giden bir eğridir, açılışlar seviye numarasından hesaplanır ve kayda yazılmaz.

## Zorluk eğrisi

`zorluk(L) = 1 − e^(−(L−1)/70)`; L1'de 0, L50'de ≈0,51, L200'de ≈0,94, L500'den sonra 1'e yaklaşır. Aynı değer bütün sürekli parametreleri besler: çevirme penceresi, hamur toleransı, pişme hızı, sabır ve gelme aralığı ([[src/lib/oyun/seviye.ts#zorluk]]).

Sürekli olmayan kısım `kademeler` listesidir: krep sayısı aralığı, D aralığı, aynı anda müşteri sayısı ve tava sayısı. Son kademeden sonra yeni mekanik gelmez; baskı çeşitlilikten ve hızdan gelir.

## Seviye başına müşteri

Gereken müşteri sayısı ayarlanabilir noktalardan log ölçeğinde doğrusal geçişle bulunur: 1, 1, 2, 2, 3, 4, 5, 8, 10, 15, 20, 25 (L1…L1000). Son noktadan sonra her seviye ikilemesinde yavaşça artar ve 40'ta kesilir ([[src/lib/oyun/seviye.ts#gerekenMusteri]]).

Bu yüzden seviye başına süre sonsuza kadar uzamaz; denge ayarı `seviye.json → gerekenMusteri.noktalar` listesini düzenlemektir.

## Açılışlar ve kademeler

Açılışlar malzeme ve müşteri JSON'larındaki `acilis` alanı ile `seviye.json → mekanikler` listesinden gelir ([[src/lib/oyun/seviye.ts#seviyeAyari]]).

Seviye sırası: 5 çikolata, 8 çilek dilimi, 10 çilek sosu ve çocuk, 12 tereyağı, 15 ikinci müşteri + ikinci tava + combo, 18 muz, 20 kalınlık tercihleri, 25 bal, 30 eleştirmen, 50 VIP ve fındık, 75 üçüncü müşteri, 100 gelişmiş siparişler, 150 yoğun saat.

Kilometre taşları (10, 25, 50, 100, 250, 500, 1000) başlık bildirimi gösterir ve adisyon üretir; oyunu durdurmaz. Toplam malzeme sabittir.

## Geliştirici modu

🛠 düğmesi geliştirme sunucusunda her zaman, üretim derlemesinde `?dev=1` ile görünür. Panel seviyeyi anında değiştirir (SET LEVEL, ±1/±10, 1…MAX 9999), oyunu duraklatır ve o seviyenin parametrelerini tablo olarak gösterir ([[src/components/oyun/GelistiriciPaneli.svelte]]).

Test seviyesi gerçek kaydı bozmaz (`TEST` rozeti); "Kayda uygula" test seviyesini yazar, "Kaydı sil" gerçek kaydı temizler.
