# Arayüz

Uygulama dikey (9:16) tek sahne etrafında kurulur: lobi ve oyun aynı restoran sahnesinin iki durumudur. Bilgi sayfaları dört dilde, oyun ekranları yalnız Türkçedir.

## Ekranlar ve rotalar

Kök `/` restoran sahnesi; `/fislerim` adisyonlar, `/profil` karne ve ayarlar, `/rehber` malzeme rehberi ve detayıdır. `/admin` yönetim paneli, `/izinler` sistem izinleri ekranıdır ([[#Yönetim paneli]], [[#İzinler ekranı]]).

Bilgi sayfaları dört dilde `/hakkinda`, `/iletisim`, `/kosullar`, `/gizlilik`; diğer dillerde `/en/...` öneki kullanılır ([[docs/mimari-agac.md]]).

Alt menü üç sekmedir: Oyna, Fişlerim, Profil. Ayrı bir `/oyna` rotası yoktur; oyun aynı sayfada başlar ([[src/components/AppNav.svelte]]).

## Lobi ve oyun aynı sahne

`OYNA` sayfa değiştirmez: aynı sahne oyun durumuna geçer, alt menü aşağı kayar ve malzeme çubuğu yerini alır. Oyun `client:only="svelte"` ile yüklenir; `requestAnimationFrame` ve `window` kullandığı için sunucuda çalışmaz ([[src/components/oyun/Restoran.svelte]]).

Sahne katmanlıdır: duvar, masalar, raf, müşteriler, tezgâh, tava ve tabak. Müşteri hem duvarda hem sipariş fişinde aynı karakterle çizilir; yüzü sabır oranına göre değişir ([[src/components/oyun/Karakter.svelte]]).

## Yönetim paneli

`/admin` oyuncu menüsü olmayan ayrı bir kabuktur; uygulamada Profil'deki bağlantıyla açılır. Giriş ve oyuncu verisi yalnız uygulamada (yerel arka uç) vardır; tarayıcıda içerik ekranları JSON'dan salt okunur görünür.

Kabuk oturumu denetler: oturum yoksa giriş / hesap oluşturma, varsa kenar menüsü ve seçili ekran görünür. İlk kayıt olan hesap yönetici olur ([[src/components/admin/YonetimPaneli.svelte]], [[docs/backend.md]]).

Ekranlar şunlardır:

- **Panel Özeti:** oyuncu istatistikleri ve seviye dağılımı (uygulamada), içerik sayıları (her yerde).
- **Malzemeler, Müşteri Tipleri:** liste ve arama her yerde; ekle, düzenle ve sil uygulamada ve izne göre ([[src/components/admin/Malzemeler.svelte]]).
- **Seviye Eğrisi, Kilometre Taşları, Simülatör:** oyunun kendi kurallarından hesaplanır, tarayıcıda da çalışır ([[src/components/admin/Simulator.svelte]]).
- **Denge Ayarları:** sayı alanları; uygulamada düzenleme taslak sürüm olarak kaydedilir.
- **Sürümler:** taslağı yayınla, yayındakini nedenle geri al; yalnız uygulamada ve tarayıcıda menüde yoktur ([[src/components/admin/Surumler.svelte]]).

Düğmeler `izinVar(oturum, "Eylem:Kaynak")` ile gizlenir ya da gösterilir; asıl denetim yine Rust arka ucundadır ([[src/lib/yonetim.ts#izinVar]]). Oyuncular, Fişler, Şüpheli Kayıtlar ve Denetim Günlüğü ekranları henüz yoktur ([[gorevler#Açık işler]]).

## İzinler ekranı

`/izinler` bildirim izninin durumunu gösterir, izin ister ve test bildirimi gönderir. Hiçbir menüde bağlantısı yoktur; adresle açılır. Tarayıcıda izin listesi ve düğmeler çizilmez, yalnız açıklama kalır.

İzin komutları yalnız `native.ts` üzerinden çağrılır ve `destekleniyorMu("izin")` ile korunur ([[src/components/Izinler.svelte]], [[docs/izinler.md]], [[platform#Özellik × platform]]).

## Dil, yön ve tema

Bilgi sayfaları ve rehber dört dilde (tr varsayılan, en, ar, fa); Arapça ve Farsça sağdan sola `dir="rtl"` ile çizilir ([[src/lib/i18n.ts#dilBul]]). Oyun, Fişlerim ve Profil ekranlarının yalnız Türkçe sürümü vardır; alt menü bu yüzden Türkçe sayfalara bağlıdır.

Tema `<html data-tema>` ile gündüz/gece arasında geçer; seçim `localStorage` içinde tutulur ve açılışta yanıp sönmeyi önlemek için satır içi betikle uygulanır ([[src/lib/tema.svelte.ts#tema]]).

## Dokunma ve erişilebilirlik

Jestler pointer olaylarıyla çalışır: basılı tut hamur döker, yukarı kaydırma çevirir, aşağı kaydırma tabağa alır. Oyun alanında `touch-action: none` ve `user-select: none` vardır; düğmeler en az 44×44 px ve ikonlar `aria-label` taşır ([[src/components/oyun/Tava.svelte]]).
