# Pancake Flip! Bilgi Grafiği

Bu klasör oyunun ne yaptığını ve neden öyle yaptığını anlatır; kodun kopyası değil, kuralların ve kararların haritasıdır. Kaynak belgeler `docs/` altında, oyun sayıları JSON'dadır.

## Harita

Grafiğin dosyaları ve kapsamları; her giriş ilgili bölümün köküdür.

- [[mimari]] — Katmanlar, native kapısı, oyun döngüsü, değişmez kararlar
- [[oyun-mekanigi]] — Hamur, pişme, çevirme, tabak eşleşmesi, para
- [[seviye]] — Sonsuz seviye eğrisi, açılışlar, geliştirici modu
- [[veri]] — Tip sözleşmesi, JSON veri, cihaz kaydı, adisyon kodları
- [[arayuz]] — Ekranlar, lobi/oyun sahnesi, dil-yön-tema, dokunma
- [[platform]] — Özellik × platform tablosu ve tarayıcı yedekleri
- [[testler]] — Test şartnameleri ve `@lat:` bağları
- [[gorevler]] — Aşamalar, açık işler, çalışma akışı

## Kullanım

Ajanlar bu grafiği `lat search` ve `lat section` ile okur; kaynak koddaki `@lat:` işaretleri bölümleri koda bağlar. Grafik yalnız uygulanmış davranışı anlatır; plan ve öneriler `docs/` içinde kalır.

Değişiklikten sonra `lat check` çalıştırılır: bağlantılar, giriş paragrafları ve test bağları doğrulanır.
