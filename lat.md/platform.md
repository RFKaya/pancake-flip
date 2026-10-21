# Platform Desteği

Beş platform hedeflenir: Android, iOS, macOS, Windows ve Linux. Platform bilgisi yalnız `native.ts` içindedir; desteklenmeyen özellik arayüzde hiç görünmez.

## Özellik × platform

Özelliklerin platformlara göre durumu; tablo `native.ts` içindeki destek tablosuyla aynıdır.

| Özellik | Masaüstü ve mobil | Tarayıcı (geliştirme) |
|---|---|---|
| Oyun, tema, dört dil, bilgi sayfaları | destekleniyor | destekleniyor |
| `adisyonKodu` (fiş kodu üretme) | Rust `fis_olustur` | `WEB-` yedeği |
| `fisCoz` (kodu çözme) | Rust `fis_coz` | yok, bölüm çizilmez |
| `ses` (Web Audio) | platforma göre farklı yolla | destekleniyor |
| `kayit` (localStorage) | destekleniyor | destekleniyor |

Tablo `native.ts → DESTEK` ile aynıdır ve yeni özellikte birlikte güncellenir ([[src/lib/native.ts#destekleniyorMu]], [[docs/platform-destegi.md]]).

## Tarayıcı yedekleri

Tarayıcı beş platformdan biri değildir; geliştirme ve önizleme içindir. Rust yokken `fisOlustur` aynı girdi denetimiyle `WEB-SSS-Y…` üretir; `fisCoz` `YalnizUygulamada` hatası döner ve arayüz bu bölümü hiç çizmez ([[src/lib/native.ts#fisCoz]]).

## Ses kilidi

Mobil WebView ses motorunu ancak bir dokunuştan sonra açar. Ses motoru ilk ses istendiğinde kurulur, askıdaysa `resume` edilir; ilk ses OYNA dokunuşudur, böylece kısıt kullanıcı eylemiyle aşılır ([[src/lib/oyun/ses.ts]]).
