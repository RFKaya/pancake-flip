# Oyun Tasarım Belgesi (GDD) — Pancake Flip!

> Bu belge oyunun **nasıl oynandığını** tanımlayan tek kaynaktır. Proje konsepti için [`proje-fikri.md`](proje-fikri.md), kod yapısı için [`oyun-mimarisi.md`](oyun-mimarisi.md), görev sırası için [`gelistirme-plani.md`](gelistirme-plani.md) dosyasına bakın. Buradaki sayılar başlangıç değerleridir; hepsi `src/lib/veri/*.json` dosyalarında tutulur ve oyun test edildikçe ayarlanır.

**Öncelik sırası (her kararda):** EĞLENCE > NETLİK > TEPKİ HIZI > İLERLEME > KARMAŞIKLIK

---

## 1. Oyunun özü

Oyuncu küçük bir krep dükkânında tek başına çalışır. Müşteriler gelir, her biri bir **krep kulesi** ister. Oyuncu krepleri tavada pişirir, doğru anda çevirip tabağa atar, araya dolgu ve sos koyar, en üste topping ekler ve tabağı müşteriye verir.

Hedeflenen his:
> "Müşteri bekliyor, krep pişiyor, öbürünün sosunu da koymam lazım. Önce hangisini yetiştireyim? Tam zamanında yetiştirdim. **PERFECT!**"

- **30 saniyede öğrenilir:** Dokun (hamur dök), yukarı kaydır (çevir), dokun (malzeme koy), dokun (müşteriye ver). Hepsi bu.
- **Zor ustalaşılır:** Ustalık; aynı anda birden fazla tavayı, tabağı ve müşteriyi idare etmekten, doğru öncelikleri seçmekten gelir.
- Görsel dil: sevimli, renkli, hafif abartılı, 2D/"2.5D" cartoon. Krepler kalın ve oyuncak gibi. Sos akışı, çevirme zıplaması ve müşteri yüz ifadeleri animasyonlu.
- Ekran: **9:16 dikey**, tek elle oynanır.

### 1.1 Brif'ten bilinçli sapmalar (neden?)

| Brif'te | Bu tasarımda | Gerekçe |
|---|---|---|
| 3D / 2.5D | CSS + SVG ile 2D, gölge ve gradyanla "2.5D" görünüm | Proje Tauri + Astro + Svelte şablonu; oyun motoru yok. Yeni bağımlılık eklemeden yapılabilir. |
| ScriptableObject / data asset | JSON dosyaları (`src/lib/veri/`) | Aynı veri odaklı yaklaşımın web karşılığı. |
| Coin + XP + skor | Yalnızca **Coin** ve **Yıldız** | Oyuncunun izlediği sayı az olsun. İlerlemeyi yıldızlar yönetiyor; ayrı bir XP'ye gerek yok. |
| Malzeme satın alma + stok | MVP'de yalnızca **kullanım maliyeti** | Stok yönetimi ekranı eğlenceyi bölüyor. Stok, ileri bölümlerde bir zaman baskısı mekaniği olarak (Bölüm 13) geri gelebilir. |
| Tava + Ocak yükseltmesi | Tek "Tava" yükseltmesi | İkisi de aynı şeyi yapıyordu. |
| Tabak yükseltmesi (kapasite) | 2. tava ve 2. tabak bölüm ilerlemesiyle açılır | Zorluk eğrisi parayla değil tasarımla kontrol edilsin (pay-to-win yok). |
| Referans video | Elimizde yok | Tasarım brif metnine göre yapıldı. |

---

## 2. Çekirdek döngü

### 2.1 Bir bölüm (servis)

Bölüm = bir **servis**. Önceden belirli sayıda müşteri gelir (ör. 6). Hepsi hizmet aldığında ya da ayrıldığında servis biter. Sonuç ekranında yıldız, kazanç ve **adisyon kodu** (Rust) gösterilir.

### 2.2 Saniye saniye (Bölüm 6, örnek)

| Zaman | Ne oluyor | Oyuncu ne yapıyor |
|---|---|---|
| 0 sn | Kapı zili. Müşteri A gelir, üstünde sipariş kartı: `Krep · Çikolata · Krep · Çilek sosu` (aşağıdan yukarı). Sabır halkası yeşil. | Kartı okur. |
| 1 sn | | Tavaya dokunur, hamur dökülür (cız sesi). Tava halkası dolmaya başlar. |
| 4 sn | Halka "pişti" bölgesine girer, krep altın rengi olur, hafif "ding". | Tavada yukarı kaydırır, krep havada döner ve tabağa düşer (plop). |
| 4.5 sn | | Tavaya tekrar dokunur (2. krep pişiyor). Bu sırada rafta **Çikolata**ya dokunur, tabaktaki krebin üstüne sürülür. Kartta ilk iki satır ✓ olur. |
| 6 sn | Müşteri B gelir: `Krep · Krep` | Göz ucuyla bakar, önce A'yı bitirmeye karar verir. |
| 8 sn | 2. krep pişti. | Kaydırır, tabağa düşer. **Çilek sosu**na dokunur, sos 0,8 sn'de dökülür. Kartın hepsi ✓. |
| 9 sn | | Müşteri A'ya dokunur, tabak kayarak gider. **PERFECT!** yazısı, coinler sayaca uçar, A'nın yüzü 😊. Combo 2. |
| 9.5 sn | A ayrılır, slotu boşalır. | Tavaya dokunur, B için krep... |

### 2.3 Döngüdeki temel kararlar
1. **Hangi müşteri önce?** Sabrı azalan mı, kısa siparişli mi, yüksek ödeyen mi?
2. **Tava boşta kalmasın:** Krep pişerken malzeme koy.
3. **Riskli an:** Krep yanmak üzereyken sos dökülüyor. Önce hangisi?

---

## 3. Krep kulesi (sipariş = sıralı yığın)

Her sipariş, **aşağıdan yukarı** okunan sıralı bir listedir. Oyuncunun yaptığı her işlem tabağın **en üstüne** bir şey ekler. Değerlendirme yalnızca "tabaktaki sıra, kartın sırasıyla aynı mı?" sorusuna bakar. Bu kural basit, net ve kartta görsel olarak gösterilebilir.

| Kategori | Nereye gelir | Örnek | İşlem süresi |
|---|---|---|---|
| **Krep** | Her yerde (en alt her zaman krep) | Krep | Tavada pişirme + çevirme |
| **Dolgu** | İki krebin arasına | Çikolata, Çilek dilimi, Muz, Krema, Beyaz çikolata | 0,3 sn |
| **Sos** | Bir krebin üstüne (arada ya da en üstte) | Çilek sosu, Bal, Karamel, Ahududu sosu | 0,8 sn (yükseltmeyle 0,3 sn'ye iner) |
| **Topping** | Yalnızca en üste, en son | Tereyağı, Fındık, Hindistan cevizi, Dondurma | 0,3 sn |

Sipariş grameri (üretici bunun dışına çıkamaz):
```
Sipariş := Krep (Ara Krep)* Üst
Ara     := (boş) | Dolgu | Sos
Üst     := (boş) | Sos | Topping | Sos Topping
```

Basit örnek: `Krep · Krep · Çikolata · Krep · Çilek sosu`
İleri örnek: `Krep · Çikolata · Krep · Çilek · Krep · Karamel · Krep · Bal · Fındık`

**Tabak kuralları**
- Tabakta en fazla 12 parça olur.
- **Geri alma yok.** Hatalı tabak için **çöp kutusu** var: üzerine 0,5 sn basılı tutunca tabak boşalır, kullanılan malzemelerin maliyeti kaybedilir (Bölüm 1–5'te çöp ücretsizdir).
- Tabağı vermek için tabak doluyken müşteriye dokunulur. Kartın altında "Ver ▶" parlar; yanlışlıkla dokunmaya karşı tek bir dokunuş yeterli ama hedef büyük.

---

## 4. Pişirme ve çevirme

Tavaya dokununca hamur dökülür ve **pişme değeri** `p` 0'dan yukarı çıkar. Tavanın etrafındaki halka bu değeri gösterir, krep de renk değiştirir.

| `p` aralığı | Durum | Krep rengi | Halka |
|---|---|---|---|
| 0,00 – 0,30 | Çiğ | Soluk krem | Gri |
| 0,30 – 0,55 | Az pişmiş | Açık sarı | Sarı bölge |
| 0,55 – 0,80 | Orta (tam kıvam) | Altın | Yeşil bölge |
| 0,80 – 1,00 | İyi pişmiş | Kahve | Turuncu bölge |
| 1,00 – 1,15 | Fazla pişmiş | Koyu kahve, tütüyor | Kırmızı, yanıp söner |
| > 1,15 | Yanık | Siyah | Duman: krep 1,5 sn sonra kendiliğinden çöpe gider (maliyet kaybı) |

- Başlangıç hızı: `p`, 6 sn'de 1,00'e ulaşır. **Tava yükseltmesi yalnızca çiğ evreyi kısaltır**, bölgelerin süresi aynı kalır. Böylece yükseltme oyunu hızlandırır ama tepki penceresini daraltmaz.
- **Çevirme:** Tavanın üzerinde yukarı kaydırma (≥40 px, 600 ms içinde). Krep zıplar, döner ve **seçili tabağa** düşer. Ayarlardan "dokunarak çevir" seçeneği de açılabilir (erişilebilirlik).
- **Bölüm 1–7:** Sipariş pişme derecesi istemez. 0,30–1,00 arası her şey "pişti" sayılır.
- **Bölüm 8+:** Kartta pişme derecesi gösterilir: **A** (az, sarı nokta), **O** (orta, altın nokta), **İ** (iyi, kahve nokta). Harf ve renk birlikte kullanılır (renk körlüğü için). Bir siparişteki bütün krepler aynı dereceyi ister.
- **Tam isabet:** Bölgenin tam ortasında (±0,04) çevirince küçük parıltı ve +1 coin. İsteğe bağlı bir ustalık ödülüdür.
- **Başarısızlık her zaman görünür olmalı:** Çiğ çevrilen krepte hamur damlar, fazla pişmiş krepten duman çıkar. Sonuç ekranında "2. krep fazla pişti" gibi tek satırlık bir açıklama gösterilir.

---

## 5. Malzemeler

Her bölümün bir **menüsü** vardır: rafta en fazla **8 malzeme düğmesi** (2×4) görünür. Açık olan her şey aynı anda rafa konmaz. Bu, telefon ekranını sade tutar.

| Malzeme | Kategori | Açılış | Kullanım maliyeti | Satış değeri | Not |
|---|---|---|---|---|---|
| Krep (hamur) | Krep | 1 | 1 | 6 | |
| Çikolata | Dolgu | 3 | 2 | 6 | |
| Çilek sosu | Sos | 5 | 2 | 5 | |
| Çilek dilimi | Dolgu | 6 | 3 | 7 | |
| Tereyağı | Topping | 7 | 1 | 3 | |
| Muz | Dolgu | 9 | 2 | 6 | Çocukların favorisi |
| Bal | Sos | 11 | 2 | 5 | |
| Krema | Dolgu | 13 | 2 | 6 | |
| Fındık | Topping | 15 | 1 | 4 | |
| Karamel | Sos | 17 | 2 | 6 | |
| Beyaz çikolata | Dolgu | 23 | 3 | 7 | Çikolatayla karışmasın diye farklı renk ve ikon |
| Hindistan cevizi | Topping | 28 | 1 | 4 | |
| Ahududu sosu | Sos | 29 | 3 | 7 | Çilek sosundan belirgin biçimde farklı ton |
| Dondurma | Topping | 32 | 4 | 10 | **Erir:** konduktan sonra 8 sn içinde verilmezse kalite −25 |

- Kullanım maliyeti, malzeme tabağa konduğu anda düşülür (küçük "−2" yazısı uçar). Bu, "her şeyi bol bol kullanmayayım" hissini verir.
- Sipariş fiyatı = içindeki parçaların satış değerlerinin toplamı. Ortalama kâr marjı yaklaşık %65.

---

## 6. Sipariş üretimi ve zorluk puanı

### 6.1 Zorluk puanı (D)
```
D = 1,0 × krep sayısı
  + 1,5 × dolgu sayısı
  + 1,5 × sos sayısı
  + 1,0 × topping sayısı
  + 1,0 × (pişme derecesi isteniyorsa)
  + özel ek (dondurma +1, kararsız müşteri +1, iki tabaklı sipariş +2)
```
Örnek: `Krep · Çikolata · Krep · Çilek sosu` = 2 + 1,5 + 1,5 = **5**.

### 6.2 Üretici (pseudo)
```
girdi: bölüm ayarı {menü, krepMin, krepMax, dMin, dMax, pişmeTalebi, müşteriAğırlıkları}, rng
1. Müşteri tipini ağırlığa göre seç.
2. Hedef D'yi [dMin, dMax] içinden seç; tipe göre kaydır (Çocuk ≤ 4, VIP +3).
3. krep sayısı n ∈ [krepMin, krepMax].
4. Her ara (n−1 adet) için: boş / dolgu / sos seç (menüdeki malzemelerden).
5. Üst kısmı seç: boş / sos / topping / sos+topping.
6. Pişme talebi açıksa derece seç (Bölüm 8–20: %70 O, %15 A, %15 İ; sonrası eşit).
7. D'yi hesapla. Aralıkta değilse 20 kez yeniden dene, olmazsa en yakını al.
```
- Rastgele sayı üreteci **tohumlu** (seed) olur. Aynı tohum aynı servisi üretir, bu da testi kolaylaştırır.
- Servis başlarken **bütün müşteri kuyruğu önceden üretilir.** Böylece yıldız hedefleri, o servisin gerçek siparişlerinden hesaplanabilir (Bölüm 9.4).
- Kurallar: Aynı siparişte en fazla 1 topping olur. Dolgu en altta ya da en üstte olamaz. Çocuk siparişleri en fazla 2 kreptir ve yalnızca tatlı malzeme içerir (çikolata, muz, çilek).

---

## 7. Müşteriler

### 7.1 Sabır ve ruh hali
```
sabır (sn) = (10 + 5 × D) × hız(bölüm) × tipÇarpanı × (1 + bekleme köşesi yükseltmesi)
hız(b)     = max(0,65 ; 1 − 0,007 × (b − 1))
```

| Kalan sabır | Yüz | Bahşiş oranı |
|---|---|---|
| > %80 | 😊 Çok memnun | %30 |
| %60–80 | 🙂 Memnun | %20 |
| %40–60 | 😐 Normal | %10 |
| %20–40 | 😠 Sinirli | %0 |
| < %20 | 🤬 Gitmek üzere | %0 |
| %0 | Gider (Bölüm 10'dan itibaren) | — |

- **Bölüm 1–9:** Sabır %1'in altına inmez, müşteri asla gitmez (sadece bahşiş azalır).
- **Bölüm 1–3:** Öğretici sırasında sabır, ilk tabak verilene kadar donar.
- Giden müşteri: o siparişin geliri yok, combo sıfırlanır, tabaktaki malzeme ziyan olur. **Oyun bitmez.**

### 7.2 Müşteri tipleri

| Tip | Açılış | Sabır | Ödeme | Bahşiş | Hata cezası | Sipariş | Görsel ipucu |
|---|---|---|---|---|---|---|---|
| Normal | 1 | ×1,0 | ×1,0 | ×1,0 | ×1,0 | Bölüm aralığı | Çeşitli yüzler |
| Çocuk | 4 | ×1,4 | ×0,8 | ×1,2 | ×0,5 | Kısa ve tatlı (D ≤ 4) | Küçük boy, balon |
| Aceleci | 10 | ×0,6 | ×1,4 | ×1,0 | ×1,0 | Kısa–orta | Saat ikonu, ayak vuruyor |
| Cömert | 16 | ×1,1 | ×1,0 | ×2,0 | ×1,0 | D + 2 | Şapka, gülen yüz |
| Eleştirmen | 18 | ×1,0 | ×1,5 | ×1,0 | ×1,5 | Orta–uzun | Gözlük ve not defteri |
| Kararsız | 24 | ×1,2 | ×1,1 | ×1,0 | ×1,0 | Orta (D + 1) | Düşünce balonu "?" |
| VIP | 26 | ×1,2 | ×2,5 | ×1,5 | ×2,0 | Uzun (D + 3), aynı anda en fazla 1 | Altın çerçeve |
| Şüpheli | 31 | ×0,9 | ×1,3 | ×1,0 | ×1,0 | Orta | Güneş gözlüğü, 👀 |

**Kararsız müşteri:** Sabrının ilk yarısında bir kez fikir değiştirir. Yalnızca **üst kısmı** (en üstteki sos ya da topping) değiştirir, böylece yarım tabak boşa gitmez. Değişen satır kartta 2 sn yanıp söner, müşterinin üstünde "!" çıkar.

### 7.3 Ödemeden kaçma: görünür bir risk

Rastgele ceza değil, **önceden işaret verilen** bir risktir:
- Riskli müşterinin kartında baştan bir **👀** işareti vardır.
- Sabrı %40'ın üstündeyken servis edilirse normal öder, üstüne "Yakaladın!" +5 coin alınır.
- Sabrı %40'ın altına düştükten sonra servis edilirse **ödemeden kaçar** (malzeme maliyeti kaybedilir, combo sıfırlanır).

| Bölüm | Normal müşterilerde 👀 olasılığı | Şüpheli tip |
|---|---|---|
| 1–10 | %0 | Yok |
| 11–20 | %1 | Yok |
| 21–30 | %2 | Yok |
| 31+ | %3 | Var (her zaman 👀; geç kalınırsa %50 kaçar) |

---

## 8. Değerlendirme: PERFECT / GREAT / GOOD / OLMADI

Tabak verildiğinde beklenen liste ile tabak karşılaştırılır (sıralı düzenleme mesafesi, Damerau–Levenshtein). Her fark bir hata türüne çevrilir:

| Hata | Kalite cezası |
|---|---|
| Eksik parça | −25 |
| Fazla parça | −20 |
| Yanlış malzeme (yerinde başka şey) | −25 |
| Sıra hatası (iki komşu parça yer değiştirmiş) | −10 |
| Pişme bir kademe farklı (krep başına, en fazla −30) | −10 |
| Çiğ ya da fazla pişmiş krep (krep başına) | −25 |
| Dondurma erimiş | −25 |

`Kalite = 100 − (toplam ceza × müşteri tipinin hata cezası çarpanı)`

| Kalite | Sonuç | Ödeme çarpanı | Combo |
|---|---|---|---|
| 100 | **PERFECT!** (büyük yazı, konfeti, özel ses, +5 coin) | ×1,0 | +1 |
| 80–99 | **GREAT** | ×0,9 | +1 |
| 50–79 | **GOOD** | ×0,7 | aynı kalır |
| < 50 | **OLMADI** (müşteri yüzünü buruşturur) | ×0,3 | sıfırlanır |

Sonuç yazısının altında **en fazla 2 satır** neden gösterilir: "Eksik: Çilek sosu", "2. krep fazla pişmiş". Oyuncu neden puan kaybettiğini her zaman anlamalı.

---

## 9. Combo, coin ve yıldızlar

### 9.1 Combo
- PERFECT ve GREAT combo'yu 1 artırır. GOOD combo'yu değiştirmez. OLMADI, giden müşteri ya da kaçan müşteri combo'yu 1'e düşürür.
- Etkisi: her combo adımı ödemeye **+%10** ekler, en fazla **+%50** (combo 6).
- Göstergede "COMBO 4 · +%30" yazar. Bölüm 6'da açılır.

### 9.2 Bir siparişin geliri
```
Fiyat   = Σ satış değeri
Ödeme   = Fiyat × sonuç çarpanı × tip ödeme çarpanı
Bahşiş  = Fiyat × ruh hali bahşiş oranı × tip bahşiş çarpanı × (1 + kavanoz yükseltmesi)
Combo   = (Ödeme + Bahşiş) × 0,10 × (combo − 1)
Net     = Ödeme + Bahşiş + Combo (+ PERFECT bonusu) − kullanılan malzeme maliyeti
```
Örnek: `Krep · Çikolata · Krep · Çilek sosu`, PERFECT, müşteri 😊, combo 1.
Fiyat 6+6+6+5 = 23 → Ödeme 23, Bahşiş 6,9 ≈ 7, PERFECT +5, maliyet 1+2+1+2 = 6 → **Net +29**.

### 9.3 Yükseltmeler (Mutfak ekranı, Bölüm 5'ten sonra açılır)

| Yükseltme | Sv 1 | Sv 2 | Sv 3 | Etki |
|---|---|---|---|---|
| Tava | 200 | 500 | 1100 | Çiğ evre −%15 / −%30 / −%45 |
| Sos şişesi | 150 | 400 | 900 | Sos dökme 0,8 → 0,6 / 0,45 / 0,3 sn |
| Bahşiş kavanozu | 150 | 400 | 900 | Bahşiş +%5 / +%10 / +%15 |
| Bekleme köşesi | 250 | 600 | 1300 | Müşteri sabrı +%5 / +%10 / +%15 |

Toplam: yaklaşık 6.900 coin. Tahmini gelir eğrisine göre oyuncu bu yükseltmeleri kabaca Bölüm 25'e kadar alabilir. Kalan coin **kozmetik dekorasyona** (100–1.500 coin: duvar rengi, tezgâh, tabak deseni, tabela, bitkiler) harcanır. Dekor oyunu etkilemez.

İkinci tava (Bölüm 12) ve ikinci tabak (Bölüm 22) **satın alınmaz**, bölümle açılır.

### 9.4 Yıldızlar
- Servis başında kuyruk bilindiği için o servisin **ideal net kazancı** `M` hesaplanır (hepsi PERFECT, 😊, combo yok varsayımıyla).
- ⭐ = `M × 0,40`, ⭐⭐ = `M × 0,65`, ⭐⭐⭐ = `M × 0,85`
- Sonraki bölüm **en az 1 yıldızla** açılır. 0 yıldızda "Tekrar dene" çıkar. Kazanılan coin her durumda **cüzdanda kalır** (bölüm neti negatifse 0 sayılır). Böylece kayıp hissi azalır.

### 9.5 Kabaca gelir tahmini (ayar için)
| Bölüm | Ortalama D | Müşteri | Servis başına net |
|---|---|---|---|
| 1 | 1 | 3 | ~20 |
| 10 | 5 | 7 | ~200 |
| 20 | 7,5 | 10 | ~420 |
| 30 | 10 | 12 | ~660 |
| 50 | 13 | 16 | ~1.100 |

---

## 10. Hatalar ve başarısızlık tasarımı

| Hata | Sonuç | Oyuncu nasıl anlar |
|---|---|---|
| Yanlış / eksik / fazla parça | Kalite düşer → daha az coin, combo riski | Kartta yanlış satır kırmızı, sonuç altında açıklama |
| Fazla pişme / çiğ | Kalite düşer | Krep rengi ve duman / hamur damlası |
| Yanık | Krep otomatik çöpe, maliyet kaybı | Duman bulutu ve "yanık" sesi |
| Müşteri gitti | Gelir yok, combo sıfırlanır | Kapı sesi, boş slotta 💨 |
| Ödemeden kaçtı | Malzeme kaybı, combo sıfırlanır | Koşan karakter animasyonu, "Kaçtı!" |

Normal bölümlerde **game over yoktur.** Her 10. bölüm **özel bölümdür** ve kendi başarısızlık koşulu vardır:

| Bölüm | Özel bölüm | Başarısızlık koşulu |
|---|---|---|
| 10 | Kahvaltı Telaşı | 3 veya daha fazla müşteri giderse |
| 20 | Eleştirmen Gecesi | 3 eleştirmenden 2'si GREAT altı alırsa |
| 30 | VIP Davet | Herhangi bir VIP "OLMADI" alırsa |
| 40 | Yoğun Saat | 4 veya daha fazla müşteri giderse |
| 50 | Büyük Açılış | ⭐⭐ altında kalınırsa |

---

## 11. Zorluk eğrisi

Zorluk dört ayrı vanadan gelir. Her bölüm **en fazla bir vanayı belirgin biçimde açar** ve yeni bir mekanik gelen bölümde diğer vanalar biraz gevşetilir ("yeni şeyi öğrenirken nefes al").

| Vana | Formül / değer | Bölüm 1 | Bölüm 25 | Bölüm 50 |
|---|---|---|---|---|
| Sipariş karmaşıklığı | D aralığı (tablo) | 1 | 6–11 | 10–17 |
| Paralellik | aynı anda müşteri / tava / tabak | 1 / 1 / 1 | 3 / 2 / 2 | 3 / 2 / 2 |
| Zaman baskısı | `hız(b) = max(0,65 ; 1 − 0,007(b−1))` | 1,00 | 0,83 | 0,66 |
| Gelme sıklığı | `aralık(b) = max(4 ; 12 − 0,16 b)` sn | 11,8 | 8 | 4 |
| Müşteri sayısı | Bölüm tablosundaki değer (3'ten 16'ya) | 3 | 11 | 16 |
| Davranış | tip ağırlıkları, kaçma riski | — | 6 tip | 8 tip |

Sabırdaki `5 × D` terimi, uzun siparişlerin orantılı olarak daha çok süre almasını sağlar. Zorluk, "imkânsız sipariş"ten değil, **aynı anda yapılacak iş sayısından** gelir.

---

## 12. 50 bölümlük ilerleme

Kısaltmalar: **Eşz.** = aynı anda en fazla müşteri, **T/T** = tava/tabak sayısı. ★ = özel bölüm.

| # | Yeni / değişen | Müşteri | Eşz. | Krep (min–max) | D aralığı | T/T |
|---|---|---|---|---|---|---|
| 1 | Öğretici: dök → çevir → ver. Tek krep | 3 | 1 | 1–1 | 1 | 1/1 |
| 2 | 2 katman krep | 3 | 1 | 1–2 | 1–2 | 1/1 |
| 3 | **Çikolata** (dolgu) | 4 | 1 | 2–2 | 2–3,5 | 1/1 |
| 4 | **Çocuk** müşteri; 3 krep | 4 | 1 | 1–3 | 2–4 | 1/1 |
| 5 | **Sos sistemi: Çilek sosu**; Mutfak açılır | 5 | 1 | 1–3 | 2–5 | 1/1 |
| 6 | **Aynı anda 2 müşteri**; **Combo**; Çilek dilimi | 5 | 2 | 1–3 | 2–5 | 1/1 |
| 7 | **Topping: Tereyağı** ("en üst" kuralı) | 6 | 2 | 1–3 | 2–6 | 1/1 |
| 8 | **Pişme derecesi** (A / O / İ); siparişler kısa tutulur | 6 | 2 | 1–2 | 2–5 | 1/1 |
| 9 | Muz | 6 | 2 | 1–3 | 3–6 | 1/1 |
| 10 ★ | **Kahvaltı Telaşı**: müşteriler artık **gidebilir**; **Aceleci** müşteri | 7 | 2 | 1–3 | 3–6 | 1/1 |
| 11 | Bal; 👀 kaçma riski %1 | 7 | 2 | 1–3 | 3–7 | 1/1 |
| 12 | **İkinci tava** | 7 | 2 | 2–3 | 3–7 | 2/1 |
| 13 | Krema | 8 | 2 | 2–3 | 4–7 | 2/1 |
| 14 | **Aynı anda 3 müşteri** | 8 | 3 | 1–3 | 3–7 | 2/1 |
| 15 | **4 krep katmanı**; Fındık | 8 | 3 | 2–4 | 4–8 | 2/1 |
| 16 | **Cömert** müşteri | 9 | 3 | 2–4 | 4–8 | 2/1 |
| 17 | Karamel | 9 | 3 | 2–4 | 4–9 | 2/1 |
| 18 | **Eleştirmen** | 9 | 3 | 2–4 | 5–9 | 2/1 |
| 19 | Pişme dağılımı eşitlenir (daha çok A ve İ) | 10 | 3 | 2–4 | 5–9 | 2/1 |
| 20 ★ | **Eleştirmen Gecesi** | 10 | 3 | 2–4 | 5–10 | 2/1 |
| 21 | 👀 kaçma riski %2 | 10 | 3 | 2–4 | 5–10 | 2/1 |
| 22 | **İkinci tabak** (iki sipariş paralel) | 10 | 3 | 2–4 | 5–10 | 2/2 |
| 23 | Beyaz çikolata | 11 | 3 | 2–4 | 5–10 | 2/2 |
| 24 | **Kararsız** müşteri | 11 | 3 | 2–4 | 6–10 | 2/2 |
| 25 | **5 krep katmanı** | 11 | 3 | 2–5 | 6–11 | 2/2 |
| 26 | **VIP** | 11 | 3 | 2–5 | 6–11 | 2/2 |
| 27 | **İki tabaklı sipariş** (bir müşteri 2 ayrı kule ister) | 12 | 3 | 2–5 | 6–12 | 2/2 |
| 28 | Hindistan cevizi | 12 | 3 | 2–5 | 7–12 | 2/2 |
| 29 | Ahududu sosu (çilek sosuyla karıştırma tuzağı) | 12 | 3 | 2–5 | 7–12 | 2/2 |
| 30 ★ | **VIP Davet** | 12 | 3 | 3–5 | 7–13 | 2/2 |
| 31 | **Şüpheli** müşteri; 👀 riski %3 | 13 | 3 | 3–5 | 7–13 | 2/2 |
| 32 | **Dondurma** (erir, 8 sn) | 13 | 3 | 3–5 | 8–13 | 2/2 |
| 33 | Gelme aralığı kısalır | 13 | 3 | 3–5 | 8–13 | 2/2 |
| 34 | Karışık müşteri ağırlıkları (Aceleci artar) | 13 | 3 | 3–5 | 8–14 | 2/2 |
| 35 | **Dalgalar**: müşteriler 2'li gruplar halinde gelir | 14 | 3 | 3–5 | 8–14 | 2/2 |
| 36 | Kararsız oranı artar | 14 | 3 | 3–5 | 8–14 | 2/2 |
| 37 | VIP sıklaşır | 14 | 3 | 3–5 | 9–14 | 2/2 |
| 38 | Tüm soslar menüde (benzer renk dikkati) | 14 | 3 | 3–5 | 9–15 | 2/2 |
| 39 | Tüm toppingler menüde | 15 | 3 | 3–5 | 9–15 | 2/2 |
| 40 ★ | **Yoğun Saat** | 15 | 3 | 3–5 | 9–15 | 2/2 |
| 41 | İki tabaklı sipariş sıklaşır | 15 | 3 | 3–5 | 9–15 | 2/2 |
| 42 | Eleştirmen + Kararsız aynı serviste | 15 | 3 | 3–5 | 10–15 | 2/2 |
| 43 | Dondurma sıklaşır | 15 | 3 | 3–5 | 10–16 | 2/2 |
| 44 | Şüpheli sıklaşır | 16 | 3 | 3–5 | 10–16 | 2/2 |
| 45 | Dalgalar 3'lü olur | 16 | 3 | 3–5 | 10–16 | 2/2 |
| 46 | Pişme dereceleri karışık + kısa sabır | 16 | 3 | 3–5 | 10–16 | 2/2 |
| 47 | Tam menü (8 düğme, en zorlu kombinasyon) | 16 | 3 | 3–5 | 10–17 | 2/2 |
| 48 | Bütün müşteri tipleri | 16 | 3 | 3–5 | 10–17 | 2/2 |
| 49 | "Prova": 50'nin hafif sürümü | 16 | 3 | 3–5 | 10–17 | 2/2 |
| 50 ★ | **Büyük Açılış** | 16 | 3 | 3–5 | 10–17 | 2/2 |

50 bölümden sonrası (Full sürüm): **Sonsuz Servis** modu. Ayarlar 50'deki değerlerde sabit kalır, müşteriler bitmez, en yüksek skor kaydedilir.

---

## 13. Arayüz ve kullanıcı deneyimi (UI/UX)

### 13.1 Servis ekranı (dikey, 390×844 referans)
```
┌────────────────────────────────────┐
│ ⏸   🪙 1.240    6/12 👤   COMBO 3  │  Üst çubuk (~6%)
├────────────────────────────────────┤
│  [😊 A]      [😐 B]      [🙂 C]    │  Müşteri alanı (~32%)
│  ┌────┐      ┌────┐      ┌────┐    │  - portre + sabır halkası
│  │🍯  │      │🧈  │      │    │    │  - sipariş kartı (aşağıdan
│  │🥞 ✓│      │🥞  │      │🥞  │    │    yukarı mini kule)
│  │🍫 ✓│      │🥞  │      │🍓  │    │  - pişme noktası (A/O/İ)
│  │🥞 ✓│      │ O● │      │🥞  │    │  - "Ver ▶" ipucu
│  └────┘      └────┘      └────┘    │
├────────────────────────────────────┤
│   (TAVA 1)  (TAVA 2)   [TABAK 1]   │  Tezgâh (~32%)
│    ◔ halka   ◑ halka    kule       │  - seçili tabak çerçeveli
│                         [TABAK 2]🗑│  - çöp kutusu köşede
├────────────────────────────────────┤
│  [🍫][🍓][🍌][🍦]                  │  Malzeme rafı (~30%)
│  [🍯][🍮][🥜][🧈]                  │  - 2×4, başparmak bölgesi
└────────────────────────────────────┘
```
- Dokunma hedefleri ≥ 48 px. En sık kullanılan şeyler (raf, tava) ekranın alt yarısında.
- Seçili tabağın siparişi kartta işaretlenir: konulan parçalar ✓, yanlışlar kırmızı.
- **Yardım ipucu** (Bölüm 1–10 açık, sonra ayardan): sıradaki doğru malzeme rafta hafifçe parlar.
- En fazla 3 müşteri, 2 tava, 2 tabak, 8 malzeme. Ekranda bundan fazlası olmaz.

### 13.2 Uygulama ekranları (şablondaki karşılıkları)
| Ekran | Şablondaki karşılığı | İçerik |
|---|---|---|
| Bölümler (ana liste) | Keşfet | Bölüm ızgarası, yıldızlar, kilit, filtre (Tümü / Yıldızı eksik / Özel) |
| Bölüm detayı (seçim) | Etkinlik detayı | Hedef yıldızlar, yeni mekanik kartı, menü, müşteri tipleri, "Servise başla" |
| Servis | — (yeni) | Oyun ekranı, alt menü gizli |
| Sonuç + adisyon kodu | Satın alma + Rust kodu | Yıldız, kazanç dökümü, Rust'ın ürettiği `KRP-…` kodu |
| Fişlerim | Biletlerim | Geçmiş servislerin adisyonları |
| Mutfak | Sepet | Yükseltmeler, malzeme rehberi, dekor |
| Profil | Profil | İstatistik, dil, tema, ses, titreşim, kayıt sıfırla |
| Bilgi sayfaları | — | Hakkında, İletişim, Koşullar, Gizlilik (4 dil) |

Kesin rota ağacı Görev 07'de `docs/mimari-agac.md` içine yazılır.

### 13.3 Öğretici (metinsiz, yaptırarak)
| Bölüm | Gösterilen | Kelime |
|---|---|---|
| 1 | El ikonu tavaya dokunur → yukarı kaydırır → müşteriye dokunur | "Dokun", "Kaydır", "Ver" |
| 3 | El, rafta çikolataya dokunur | — |
| 5 | Sos şişesi parlar, döküm animasyonu | — |
| 7 | Topping, kulenin tepesine iner | — |
| 8 | Tava halkasında 3 renkli bölge yanar, karttaki nokta titreşir | "A · O · İ" |
| 12 | İki tava aynı anda parlar | — |
| 22 | İki tabak; dokununca seçim çerçevesi | — |

Her öğretici adımı, oyuncu doğru hareketi yapana kadar bekler. Okumak gerekmez.

### 13.4 Ses ve geri bildirim
- Sesler: hamur dökme (cız), çevirme (vınn), tabağa düşme (plop), malzeme (pıt), sos (şıırr), coin (çın), PERFECT (kısa melodi), sinirli müşteri (hıh), kapı (çan).
- MVP'de ses dosyası yok: Web Audio API ile kısa sentez sesler (bağımlılık eklemeden).
- Titreşim: Android'de `navigator.vibrate` varsa PERFECT ve yanıkta kısa titreşim.
- PERFECT anı: büyük yazı yay gibi büyüyüp küçülür, 12–20 konfeti parçası, coinler sayaca uçar, sayaç kısa süre büyür.
- Uygulama arka plana geçerse servis **otomatik duraklar**.

---

## 14. Kayıt (save)

Yalnızca cihazda, `localStorage`'da tek bir sürümlü JSON tutulur:
```json
{
  "surum": 1,
  "coin": 1240,
  "bolumler": { "1": { "yildiz": 3, "enIyiNet": 31 } },
  "yukseltmeler": { "tava": 1, "sos": 0, "kavanoz": 0, "bekleme": 0 },
  "dekor": ["duvar-mint"],
  "fisler": [{ "kod": "KRP-007-3A9F1C2", "bolum": 7, "yildiz": 3, "net": 412, "tarih": "2026-10-07T15:30" }],
  "istatistik": { "perfect": 58, "servis": 21 },
  "ayarlar": { "dil": "tr", "tema": "gunduz", "ses": true, "titresim": true, "ipucu": true, "dokunarakCevir": false }
}
```
- Sürüm alanı ileride kayıt formatı değişirse dönüştürme yapmak içindir.
- Gizlilik sayfası (Görev 06) bu verinin yalnızca cihazda tutulduğunu ve KVKK kapsamında kişisel veri toplanmadığını söyler.

---

## 15. MVP ve tam sürüm

### 15.1 MVP (vize hedefi): "Bölüm 1–20 oynanır"
- Servis ekranı: 2 tava, 1 tabak, 3 müşteri, 8'lik raf
- Pişirme ve çevirme, A/O/İ dereceleri
- Bölüm 1–20 için malzemeler (Çikolata, Çilek sosu, Çilek, Tereyağı, Muz, Bal, Krema, Fındık, Karamel)
- Müşteri tipleri: Normal, Çocuk, Aceleci, Cömert, Eleştirmen. Müşteri gitme. 👀 kaçma riski
- Değerlendirme, PERFECT/GREAT/GOOD/OLMADI, combo, yıldızlar
- Sonuç ekranı + **Rust adisyon kodu** + Fişlerim
- Mutfak: Tava ve Sos şişesi yükseltmeleri
- Kayıt (localStorage), Bölümler listesi, Bölüm detayı
- Bölüm 1, 3, 5, 8, 12 öğreticileri
- Placeholder sesler, temel animasyonlar

### 15.2 Tam sürüm (final hedefi), önem sırasıyla
1. Bölüm 21–50 ve özel bölümler
2. İkinci tabak, iki tabaklı sipariş
3. Kararsız, VIP, Şüpheli müşteriler
4. Dondurma (erime)
5. Bahşiş kavanozu ve Bekleme köşesi yükseltmeleri
6. Kozmetik dekorasyon
7. Oyun içi metinlerin 4 dile çevrilmesi (TR, EN, AR, FA; AR ve FA sağdan sola)
8. Başarımlar (ör. "100 PERFECT", "Hiç yakmadan 10 servis")
9. Günlük görev ve seri (streak)
10. Sonsuz Servis modu
11. Stok mekaniği (ileri bölümlerde malzeme biter, 3 sn'lik "yeniden doldur")

### 15.3 Gelir modeli (yalnızca not, uygulanmayacak)
Ders projesi olduğu için gelir modeli yok. İleride düşünülürse: kozmetik dekor paketleri ve isteğe bağlı "reklam izle, servis sonunda coin ×2". Enerji sistemi ve zorunlu reklam **yok**.
