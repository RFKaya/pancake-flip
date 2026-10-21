# Arayüz

Uygulama dikey (9:16) tek sahne etrafında kurulur: lobi ve oyun aynı restoran sahnesinin iki durumudur. Bilgi sayfaları dört dilde, oyun ekranları yalnız Türkçedir.

## Ekranlar ve rotalar

Kök `/` restoran sahnesi; `/fislerim` adisyonlar, `/profil` karne ve ayarlar, `/rehber` malzeme rehberi ve detayıdır. Bilgi sayfaları dört dilde `/hakkinda`, `/iletisim`, `/kosullar`, `/gizlilik`; diğer dillerde `/en/...` öneki kullanılır ([[docs/mimari-agac.md]]).

Alt menü üç sekmedir: Oyna, Fişlerim, Profil. Ayrı bir `/oyna` rotası yoktur; oyun aynı sayfada başlar ([[src/components/AppNav.svelte]]).

## Lobi ve oyun aynı sahne

`OYNA` sayfa değiştirmez: aynı sahne oyun durumuna geçer, alt menü aşağı kayar ve malzeme çubuğu yerini alır. Oyun `client:only="svelte"` ile yüklenir; `requestAnimationFrame` ve `window` kullandığı için sunucuda çalışmaz ([[src/components/oyun/Restoran.svelte]]).

Sahne katmanlıdır: duvar, masalar, raf, müşteriler, tezgâh, tava ve tabak. Müşteri hem duvarda hem sipariş fişinde aynı karakterle çizilir; yüzü sabır oranına göre değişir ([[src/components/oyun/Karakter.svelte]]).

## Dil, yön ve tema

Bilgi sayfaları ve rehber dört dilde (tr varsayılan, en, ar, fa); Arapça ve Farsça sağdan sola `dir="rtl"` ile çizilir ([[src/lib/i18n.ts#dilBul]]). Oyun, Fişlerim ve Profil ekranlarının yalnız Türkçe sürümü vardır; alt menü bu yüzden Türkçe sayfalara bağlıdır.

Tema `<html data-tema>` ile gündüz/gece arasında geçer; seçim `localStorage` içinde tutulur ve açılışta yanıp sönmeyi önlemek için satır içi betikle uygulanır ([[src/lib/tema.svelte.ts#tema]]).

## Dokunma ve erişilebilirlik

Jestler pointer olaylarıyla çalışır: basılı tut hamur döker, yukarı kaydırma çevirir, aşağı kaydırma tabağa alır. Oyun alanında `touch-action: none` ve `user-select: none` vardır; düğmeler en az 44×44 px ve ikonlar `aria-label` taşır ([[src/components/oyun/Tava.svelte]]).
