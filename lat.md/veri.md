# Veri ve Kayıt

Tipler `src/lib/types/` altında tek yerde, oyun sayıları `src/lib/veri/*.json` içinde durur. Cihazda iki localStorage anahtarı vardır ve ikisi de sürümlüdür.

## Tip sözleşmesi

Her tip ailesi ayrı dosyadadır ve `index.ts` hepsini dışa aktarır: `Malzeme`, `Siparis`, `Musteri`, `TabakParcasi`, `Fis`, `SeviyeYapilandirmasi`, `Ayarlar` ve arayüz durumları ([[src/lib/types/index.ts]]). Bileşen ya da store içinde tip tanımlanmaz; `any` kullanılmaz.

## Veri dosyaları

`malzemeler.json` 8 malzeme, `musteriler.json` 4 tip, `seviye.json` eğriler ve açılışlar, `ayarlar.json` süre-para sayıları, `sahne.json` görsel ölçüler içerir ([[src/lib/veri]]). Denge ayarı JSON düzenlemektir; kodda sabit oyun sayısı yoktur.

## Cihazdaki kayıt

`pancakeflip-ilerleme` seviye ve sayaçları tutar; açılan malzemeler seviyeden hesaplandığı için kayda yazılmaz ([[src/lib/ilerleme.svelte.ts#ilerleme]]). `pancakeflip-kayit` adisyonları tutar; bozuk veri güvenli başlangıca döner ([[src/lib/oyun/ilerlemeKaydi.ts#ilerlemeCoz]]).

## Yönetim verisi

Yönetim panelinin verisi cihazdaki SQLite dosyasındadır; oyunun cihaz kaydı (`localStorage`) ile karışmaz. Tablolar `docs/backend.md` içindedir, ön yüz tipleri `src/lib/types/yonetim.ts` dosyasındadır.

Tarayıcıda liste ekranları oyunun JSON verisini okur. Uygulamada malzeme ve müşteri tipi düzenlemeleri ile yayınlanan ayarlar veritabanına yazılır; oyun JSON'dan okumaya devam ettiği için bu değişiklikler oyuna yansımaz ([[src/lib/native.ts#kayitListesi]], [[docs/backend.md]]).

Müşteri tipinin `sabir` alanı saniye değil çarpandır; süre `sabirHesapla` ile hesaplanır ([[src/lib/oyun/musteri.ts#sabirHesapla]]).

## Adisyon kodları

Biçim `KRP-SSS-YXXXXXX`: seviye en az üç hane, yıldız ve saatten altı haneli hex. Kodu Rust üretir, tarayıcıda `WEB-` yedeği kullanılır ([[src/lib/native.ts#fisOlustur]]). Fişin net değeri önceki fişlerden bu yana kazanılan coindir; böylece toplam kasa aşılmaz ([[src/lib/oyun/fis.ts#fisNeti]]).

Adisyon her kilometre taşında ve her 10. seviyede kesilir, test modunda kesilmez ([[src/lib/fisler.svelte.ts#fisKaydet]]).
