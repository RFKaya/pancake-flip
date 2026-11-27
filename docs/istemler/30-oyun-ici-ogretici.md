# Oyun içi öğretici

## Araç ve model

Codex, GPT-6. Oyun akışı, açılışlar, kart ve regresyon testleri ayrı incelemelerle doğrulandı.

## Şartname

### Amaç

Oyuncuya ilk krebi hazırlarken ve yeni bir özellik açıldığında oyun içinde kısa yönlendirme gösterilir. Oyuncu tavayı, tabağı, sipariş fişini ve yeni malzeme düğmelerini kullanarak öğrenir.

### Kapsam dışı

Platform paketleri, yeni bağımlılıklar ve G7'nin diğer geliştirme kalemleri bu görevin dışındadır.

### Kabul ölçütleri

- [x] İlk döküm, çevirme, tabağa alma ve otomatik teslim uygun anda gösterilir.
- [x] Hareket geçerli olduğunda öğretici ilerler. Ağır çekimde oyun %30 hızda çalışır. Dökümde ağır çekim hedef ölçüde başlar.
- [x] Aynı seviyedeki açılışlar sırayla gösterilir. İlk kullanım yönlendirmesi gerçek siparişe ve ilgili kontrole bağlanır.
- [x] Yeniden açılışta tamamlanan adımlar hatırlanır. Geliştirici seviyesi gerçek kaydı etkilemez.
- [x] Derleme ve Bun testleri geçer.

### Dokunulan dosyalar

- Restoran, tava ve öğretici kartı `src/components/oyun/` altında.
- Öğretici seçimi, ilerleme çözümü ve odaklı testler `src/lib/oyun/` altında.
- İlerleme kaydı `src/lib/ilerleme.svelte.ts`, tipler `src/lib/types/`, sahne zamanları `src/lib/veri/sahne.json` altında.
- Oyun efektleri ve tava döngülerinin hızı `src/lib/oyun/ses.ts` içinde ayarlanır.
- Tasarım, sonsuz seviye, veri modeli, geliştirme planı ve istem günlüğü `docs/` altında.

### Doğrulama adımları

1. `bun run build` ve `bun test` çalıştır.
2. Yerel oyunda kısa basmayı ve yanlış yön kaydırmayı dene. Ardından ilk siparişi tamamla, sayfayı yenile ve öğretici kaydının durduğunu kontrol et.
3. Geliştirici panelinde Seviye 10'u aç. Sos ve müşteri tanıtımlarının sırasını ve gerçek kayıt değerini doğrula.

## İstem

İlk pancakenin hamurunu dökerken, ters çevirirken ve benzer ilk kullanım anlarında oyunu ağır çekime al. Yeni özelliklerde oyuncuya ne yapacağını söyle. Değişiklikten sonra oyunu test için aç.

Ağır çekimde hafif yakınlaşma ve yavaşlayan sesler ekle. Hamur normal hızda aksın, bırakma anı ağır çekime girsin.

## Plan

Hamur, çevirme ve servis koşullarını mevcut oyun kurallarına bağla. Gerçek hareket penceresinde hız katsayısını tavaya ve müşteri zamanına uygula. Seviye verilerinden tanıtımları bul ve ilk kullanım adımlarını kaydet. Oyunu bağımsız bir test profiliyle Seviye 1'de aç. Kullanıcı planı `yap` yanıtıyla onayladı.

## Düzeltmeler

- İlk teslimin var olan otomatik hareketi yavaşlatıldı ve kartta açıklandı.
- Fazla hamur döküldüğünde metin tekrar denemeyi anlatır. Pişmenin çiğ evrelerinde oyun normal hıza döner.
- Bırakma ölçüsüne gelene kadar tava normal hızda çalışır. Ağır çekimde hafif yakınlaşma ve daha pes, uzun oyun sesleri devreye girer.
- Yakınlaşma %3,5 oldu ve kart metinleri kısaldı. Temel yönergeler her seviyede ilk başarılı siparişe kadar, hatalı denemeler dahil, tekrarlanır.
- Ağır çekimde arka planın renk doygunluğu %76'ya düşer. Tava ve tabaktaki krep doğal renkleriyle çizilir.
- İkinci tava ve seri bonusu aynı seviyede ayrı tanıtılır. Geliştirici seviyesi değiştirilirse bekleyen teslim iptal edilir.

## Doğrulama

- `bun run build` 58 statik sayfayı başarıyla derledi.
- `bun test` 138 test geçirdi. Dokuz öğretici testi seçimi, tekrarları, açılış sırasını ve kayıt uyumunu kapsar.
- `bun run svelte-check --tsconfig ./tsconfig.json` 0 hata ve 0 uyarıyla tamamlandı.
- Chromium'da 390×844 görünümde kısa basma ve hatalı kaydırma, geçerli hamur, çevirme, tabağa alma, otomatik servis ve yenileme denendi.
- İlk döküm hedefe yaklaşık 0,7 saniyede ulaştı. Bu anda yakınlaşma başladı ve bırakma sesinin Web Audio frekansı düştü. Geçerli bırakıştan sonra ağır çekim sona erdi.
- Bir krep bilerek yakıldı. Yeni denemede döküm, çevirme ve tabağa alma yönergeleri tekrar çıktı. Başarılı teslimden sonra Seviye 2 öğreticisi başladı ve bu davranış yenilemeden sonra korundu.
- Chromium, ağır çekimde arka plan filtresinin tava ve tabak altında kaldığını ve normal hızda kaybolduğunu doğruladı. Pişmiş yüz 390×844 görüntüde incelendi.
- Seviye 10 testinde çilek sosu ve çocuk müşteri kartları sırayla gösterildi. Geliştirici testi gerçek ilerleme kaydını değiştirmedi.
