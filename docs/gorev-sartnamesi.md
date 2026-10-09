# Görev Şartnamesi (şablon)

Her görevin başında bu şablon kopyalanır ve doldurulur; doldurulan şartname o görevin istem günlüğüne ([`istemler/`](istemler/README.md)) yapıştırılır. Örnek satırlar Pancake Flip! içindir; kendi görevine göre değiştir.

## Amaç

Görev bitince oyuncu ya da geliştirici neyi farklı görecek? Tek iki cümle.

- Örnek: "Fişlerim ekranı fişleri ortak kart bileşeniyle gösterir; fiş yokken boş durum ekranı çıkar."

## Kapsam dışı

Bu görevde bilerek **dokunulmayacak** şeyler. Ajan bunların dışına çıkarsa durdurulur.

- Örnek: oyun kuralları (`src/lib/oyun/*.ts`), seviye ve ödül sayıları (`src/lib/veri/*.json`), tava ve tabak görünümü (`Tava.svelte`, `Restoran.svelte`).
- Örnek: yeni npm / cargo bağımlılığı (gerekirse önce sorulur).

## Kabul ölçütleri

İşaretlenebilir, ölçülebilir maddeler. Her biri "evet / hayır" ile cevaplanır.

- [ ] Örnek: `/rehber` sayfasında en az 6 kart görünür.
- [ ] Örnek: Arapça ve Farsça sayfada kart sağdan sola dizilir, taşma yoktur.
- [ ] `bun run build` 0 hata; `bun test` geçer.

## Dokunulacak dosyalar

Ajanın değiştirmesine izin verilen dosyalar. Listede olmayan dosya değişirse PR'dan önce sorulur.

- Örnek: `src/lib/components/ui/Kart.svelte` (yeni), `src/lib/types/ui.ts` (yeni), `src/components/Fislerim.svelte`.

## Doğrulama adımları

Görev bittiğinde elle yapılacak denemeler ve çalıştırılacak komutlar.

1. Örnek: `bun run build` ve `bun test` çalıştır; çıktıyı günlüğe yapıştır.
2. Örnek: `bun run dev` ile 390×844 boyutta `/rehber`'i aç; Tab ile kartlarda gez, Enter ile aç; ekran görüntüsü al.
3. Örnek: oyunda bir sipariş teslim et; oyunun görev öncesiyle aynı çalıştığını kontrol et.
