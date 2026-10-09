# Platform Desteği

Uygulama beş platformun hepsinde çalışır: Android, iOS, macOS, Windows, Linux (paketler: [`mimari-agac.md`](mimari-agac.md) §2). Bir özellik bir platformda farklı yolla destekleniyorsa o yolla yapılır; hiç desteklenmiyorsa o platformda arayüzde **hiç görünmez** (devre dışı düğme ya da hata mesajı bırakılmaz).

Bileşenler platform adını kendileri sorgulamaz. Platform ve destek bilgisi yalnız [`src/lib/native.ts`](../src/lib/native.ts) içindedir: `platform()` ve `destekleniyorMu(ozellik)`. Bu tablo `native.ts` içindeki `DESTEK` tablosuyla aynıdır; **yeni özellik eklenirken ikisi birlikte güncellenir.**

## Özellik × platform

| Özellik (`Ozellik`) | Android | iOS | macOS | Windows | Linux | Tarayıcı (`web`, geliştirme) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Oyun (dokunma, sürükleme, animasyon) | destekleniyor | destekleniyor | destekleniyor | destekleniyor | destekleniyor | destekleniyor |
| `adisyonKodu`: fiş kodu üretme (Rust `fis_olustur`) | destekleniyor | destekleniyor | destekleniyor | destekleniyor | destekleniyor | farklı yolla |
| `fisCoz`: adisyon kodu çözme (Rust `fis_coz`) | destekleniyor | destekleniyor | destekleniyor | destekleniyor | destekleniyor | yok |
| `ses`: ses efektleri (Web Audio) | farklı yolla | farklı yolla | destekleniyor | destekleniyor | destekleniyor | destekleniyor |
| `kayit`: ilerleme ve fişlerin cihazda saklanması (localStorage) | destekleniyor | destekleniyor | destekleniyor | destekleniyor | destekleniyor | destekleniyor |
| Gece / gündüz teması, dört dil, bilgi sayfaları | destekleniyor | destekleniyor | destekleniyor | destekleniyor | destekleniyor | destekleniyor |

## "Farklı yolla" ve "yok" satırlarında ne yapıldı

| Özellik | Platform | Ne yapıldı |
|---|---|---|
| `adisyonKodu` | Tarayıcı | Rust yok; `native.ts` aynı girdi denetimiyle `WEB-SSS-Y…` biçiminde yedek kod üretir. Fiş yine kesilir. |
| `fisCoz` | Tarayıcı | Rust yok; `destekleniyorMu("fisCoz")` `false` döner ve Fişlerim'deki **Adisyon kodu çöz** bölümü hiç çizilmez (`{#if cozucuVar}`). `fisCoz()` doğrudan çağrılırsa `YalnizUygulamada` hatası döner, çökmez. |
| `ses` | Android, iOS | Mobil WebView'lar sesi ancak bir dokunuştan sonra açar. Ses motoru (`ses.ts`) ilk ses istendiğinde kurulur, askıdaysa yeniden başlatılır (`resume`); ilk ses OYNA dokunuşunun sesidir, böylece kısıt dokunuşla aşılır. Öncesinde ses çalınmaz, hata verilmez. Ayar Profil → Ses'te her platformda aynıdır. |

Tarayıcı beş platformdan biri değildir; `bun run dev` ile geliştirme ve önizleme için kullanılır. Rust yokken ekranların çökmediği `src/lib/native.test.ts` ile denetlenir.
