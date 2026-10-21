---
lat:
  require-code-mention: true
---

# Test Şartnameleri

`bun test` ile çalışan 99 test kuralları arayüzden bağımsız doğrular. Her şartname bir test dosyasına `@lat:` işaretiyle bağlanır; `lat check` kopuk bağı hata sayar.

## Sipariş üretici

Üretilen her sipariş dilbilgisine uyar, yalnız açık malzemeleri kullanır, zorluk puanı aralıkta kalır ve tabağa sığar.

## Değerlendirme ve ekonomi

Eksik, fazla, yanlış ve sıra hataları ayrı ayrı doğru sonucu verir; ödeme, bahşiş ve combo hesabı tasarımdaki örnek sayılarla uyuşur.

## Hamur, çevirme ve tava durumu

Döküm miktarı hedef pencerelere, çevirme kalitesi pişme değerine göre sınıflanır; tava tam döngüyü ve hatalı yolları doğru yürütür.

## Sonsuz seviye eğrileri

Eğriler uç seviyelerde (1…10⁹) saçmalamaz: süreler pozitif, açılışlar tek yönlü, üretilen siparişler yapılabilir ve zorluk platosu korunur.

## Oturum akışı ve uzun simülasyon

Müşteri gelişi, sabır, servis, seviye atlama ve seri bonusu doğrulanır; 20 000 müşterilik bot simülasyonu çökmeden ilerler.

## Sabır ve pişme dengesi

Her seviyede üretilen sipariş müşterinin sabrı içinde bitirilebilir ve pişme pencereleri insan eliyle yakalanabilir.

## Fiş kazancı ve adisyon kaydı

Fişin neti toplam kasayı aşmaz; bozuk ya da eksik adisyon kaydı çökmeden güvenli listeye döner.

## İlerleme kaydı

Bozuk, eksik ya da eski sürümlü ilerleme kaydı güvenli başlangıç değerine çözülür ve sayaçlar korunur.

## Tarayıcı yedeği

Rust yokken platform `web` döner, adisyon kodu `WEB-` biçiminde üretilir, geçersiz girdi tipli hata verir ve kod çözme kapalıdır.

## Örnek veri tutarlılığı

`src/lib/veri/ornek.ts` içindeki örnek sipariş, müşteri ve fişler tiplere ve gerçek oyun verisine uyar.
