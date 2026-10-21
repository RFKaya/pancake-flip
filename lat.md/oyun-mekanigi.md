# Oyun Mekaniği

Bir servis dört adımdır: hamuru hedefe dök, iki yüzü pişir, tabağı siparişin birebir aynısı yap, otomatik servis. Kurallar saf fonksiyonlarda, sayılar JSON'dadır.

## Hamur dökme ve kalınlık

Dökerken tavada hedef halka çıkar; miktar hedefin ± payı içindeyse krep olur. Payın yarısı içinde İDEAL (MÜKEMMEL'e katkı), pay içinde kenarda BİRAZ AZ/FAZLA (geçerli, katkısız), payın dışında tava boşalır. Aynı miktar her zaman aynı sonucu verir ([[src/lib/oyun/hamur.ts#hamurSonucu]]).

Hedefler `ayarlar.json` içinde: ince 0,7 · normal 1 · kalın 1,35. İnce ve kalın yalnız kalınlık tercihleri açıkken (20. seviye) geçerlidir. Hiçbir kalınlığın payı normalinkinden dar değildir; tercihler açıkken pay komşu pencereye girmeyecek kadar sınırlanır ([[src/lib/oyun/hamur.ts#hamurPayi]]).

## Pişme ve çevirme

Her yüz ÇİĞ → PİŞMİŞ → YANIK sırasını izler; eşikler `ayarlar.json → pisirme` içindedir ve oyuncuya yalnız bu üç durum gösterilir ([[src/lib/oyun/pisirme.ts#pismeDurumu]]). Yalnız PİŞMİŞ yüz çevrilebilir ya da tabağa alınabilir; yanık krep alınamaz ve kendiliğinden çöpe gider.

Çevirme kalitesi ilk yüzün ideal pişme noktasına uzaklığına göre kaçtı / erken / iyi / mükemmel / geç olur. Pencere seviyeyle daralır (0,40 → 0,08) ama sıfıra inmez ([[src/lib/oyun/pisirme.ts#cevirKalitesi]], [[seviye#Zorluk eğrisi]]).

Tava bir durum makinesidir: boş → doku → yayil → pisir → ucus → pisir → kayma. Aşamaları tek adımda [[src/lib/oyun/pisirme.ts#tavaIlerlet]] yürütür; dökme taşarsa, krep yanarsa ya da servis edilirse tava boşalır.

## Tabak ve otomatik servis

Tabak bir siparişin birebir aynısı olunca servis kendiliğinden olur: kat sayısı, malzemeler, sıra, her krebin pişmiş olması ve istenen kalınlık tutmalıdır ([[src/lib/oyun/oturum.ts#tabakDurumu]]). "Ver" düğmesi yoktur; birden çok müşteri uyuyorsa sabrı en az kalan alır.

Eksik, fazla, yanlış, çiğ ya da yanık tek parça varsa sipariş tamamlanmaz: coin, ilerleme ve müşteri sayısı artmaz, tabak atılır. Nedeni oyuncuya yazı olarak gösterilir ([[src/lib/oyun/degerlendirme.ts#degerlendir]]). Teslimde krepler kısa süre tabakta görünür, sonra müşteriye uçar ve tabak boşalır ([[src/lib/oyun/oturum.ts#musteriyeVer]]).

Tabağa en fazla `tabakMax` (12) parça konur; sınır `ayarlar.json` içindedir.

## Para, combo ve ilerleme

Servis sonucu iki değerdir: kreplerin hepsi kusursuz (döküm + çevirme) ise PERFECT, değilse GREAT. Ödeme `fiyat × sonuç çarpanı × müşteri tipi` ile hesaplanır; bahşiş müşterinin sabır oranından gelir ([[src/lib/oyun/ekonomi.ts#gelirHesapla]]).

Combo 15. seviyeden sonra devreye girer ve üst sınırı vardır; yoğun saatte kazanç çarpanı uygulanır. İlerleme puanı PERFECT, GREAT ve GOOD için 1, OLMADI için 0'dır; üst üste her 5 PERFECT +1 bonus verir ([[src/lib/oyun/seviye.ts#ilerlemeEkle]]).

Net kazanç, servis sırasında konan malzemelerin maliyeti düşülerek bulunur ve negatife inmez ([[src/lib/oyun/ekonomi.ts#siparisMaliyeti]]).
