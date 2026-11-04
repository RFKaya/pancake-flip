# 21 — Yönetim Paneli 2/4: Malzemeler ve Müşteri Tipleri

Görev: eğitmenin Hafta 05 raporu, "Yönetim paneli ana projeye" (plan: [20](20-admin-panel-iskelet.md)) · Dal: `feature/admin-panel-katalog` (#76'nın dalı üzerinde)

## Araç ve model

Claude Code (masaüstü uygulaması), model Claude Opus 5.5.

## Şartname

- **Amaç:** Eski paneldeki Malzemeler ve Müşteri Tipleri ekranlarını taşımak: liste, arama, süzgeç; uygulamada izne göre ekleme, düzenleme, silme.
- **Kapsam dışı:** Diğer ekranlar; yeni bağımlılık; düzenlenen değerlerin oyuna aktarılması (oyun JSON'u kullanmaya devam eder, ekranda notla belirtilir).
- **Kabul ölçütleri:** metinler sözlükte; sabit renk yok; Rust yalnız `native.ts` (`crud_index/store/update/destroy`); tarayıcıda liste JSON'dan, düzenleme düğmeleri hiç çizilmez; form doğrulaması `src/lib/yonetim.ts`'te ve testli; dört hâl (yükleniyor / hata / boş / dolu, arama boş).
- **Dokunulan dosyalar:** `src/components/admin/{Malzemeler,MusteriTipleri,MalzemeFormu,MusteriTipiFormu,Pencere,SilmeOnayi,YonetimPaneli}.svelte`, `src/lib/{native,yonetim,admin-sozluk,yonetim.test}.ts`, `src/lib/types/{yonetim,musteri}.ts`, bu günlük.

## İstem

```text
PR2'ye başla: Malzemeler ve Müşteri Tipleri ekranları. #76'nın dalından devam et.
```

## Düzeltmeler

- Arka uç boş isteğe bağlı alanları `null` döndürüyor; `dMax` doğrulaması `null`'ı hata sayıyordu, "sınır yok" olarak düzeltildi. Güncellemede boş bırakılan `dMax` açıkça `null` gönderiliyor ki eski sınır silinsin.
- Müşteri tipinin `sabir` alanı ilk taslakta "Sabır (sn)" diye yazılmıştı; `oyun/musteri.ts` okununca bunun çarpan olduğu görüldü (normal 1, çocuk 1,4). Etiket "Sabır çarpanı" yapıldı, `types/musteri.ts` yorumu da düzeltildi.
- Tarayıcıdaki "Düzenleme yalnız uygulamada yapılır" cümlesi platform kuralına (desteklenmeyen özellik için ileti bırakılmaz) aykırı olduğu için kaldırıldı.

## Doğrulama

```text
$ bun test                              → 112 pass, 0 fail (yeni 7 test)
$ bun run check                         → 0 errors, 0 warnings, 0 hints
$ bunx svelte-check --threshold warning → 0 errors, 0 warnings
```

Tarayıcı (`/admin`): tarayıcı hâlinde 8 malzeme JSON'dan, düzenleme düğmesi yok. Sahte Tauri `invoke` ile: yeni malzemede geçersiz kimlik ("Muz Ezmesi") alan hatası, değer ≤ maliyet zarar uyarısı; düzeltilince `crud_store` doğru veriyle gidiyor ve satır ekleniyor; silme `crud_destroy` ile nedeni gönderiyor; müşteri tipinde sabır 0 alan hatası, boş "Zorluk üst sınırı" `dMax: null` olarak `crud_update` ile gidiyor. Gerçek Tauri uygulamasında denenmedi.
