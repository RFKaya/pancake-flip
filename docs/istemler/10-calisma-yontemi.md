# 10 — Çalışma Yöntemi

Görev: [`tasks/week-4/10-calisma-yontemi.task.md`](../tasks/week-4/10-calisma-yontemi.task.md) · Dal: `feature/10-calisma-yontemi`

## Araç ve model

Claude Code (terminal ajanı), model Claude Opus 5.5.

## Şartname

- **Amaç:** Bu repoda bundan sonraki her görevin "şartname → plan → değişiklik → doğrulama" döngüsüyle yapılmasını sağlayan belgeleri kurmak.
- **Kapsam dışı:** Uygulama kodu (`src/`, `src-tauri/`), `docs/tasks/`, bağımlılıklar.
- **Kabul ölçütleri:** `docs/gorev-sartnamesi.md` beş başlıkla var; `docs/istemler/README.md` ve bu kayıt var; `AGENTS.md`'de "Çalışma döngüsü" bölümü ve iki yeni indeks satırı var; yeni bir oturumda ajan döngüyü anlatıyor; `bun run build` 0 hata.
- **Dokunulacak dosyalar:** `docs/gorev-sartnamesi.md` (yeni), `docs/istemler/README.md` (yeni), `docs/istemler/10-calisma-yontemi.md` (yeni), `AGENTS.md`, `docs/ortak-gelistirme.md` (yalnız bölüm numarası bağlantısı), `docs/sonnet-talimati.md` (kural testinden sonra, döngüye yönlendirme).
- **Doğrulama adımları:** `bun run build`, `bun test`; yeni oturumda kural testi.

## İstem

Görev dosyasındaki istem, köşeli parantez gerektirmediği için olduğu gibi verildi:

```text
Bu repoda bundan sonra her görevi şu döngüyle yapacağız: şartname, plan, değişiklik, doğrulama.
1. `docs/gorev-sartnamesi.md` adında, benim her görevde dolduracağım kısa bir şablon oluştur. Başlıklar: Amaç, Kapsam dışı, Kabul ölçütleri, Dokunulacak dosyalar, Doğrulama adımları.
2. `docs/istemler/README.md` oluştur: her görev için `NN-kisa-ad.md` dosyası açılır; içinde araç ve model, istem, plan, düzeltmeler ve doğrulama sonucu yazar.
3. `AGENTS.md` dosyasına "Çalışma döngüsü" bölümü ekle: önce plan sun ve onayımı bekle; onaydan sonra değiştir; her görev ayrı dalda ve PR ile; `bun run build` 0 hata vermeden bitti deme.
4. Yeni belgeleri `AGENTS.md` doküman indeksine ekle.
Önce planını göster, ben onaylayınca uygula.

Son olarak: `bun run build` 0 hata vermeli. Bitince hangi dosyaları neden değiştirdiğini madde madde özetle ve benim elle denemem gereken adımları yaz.
```

## Plan (değişiklikten önce sunuldu)

1. `docs/gorev-sartnamesi.md`: beş başlıklı şablon; her başlığın altında Pancake Flip!'e özgü örnek satırlar (Fişlerim kartı, `/rehber`, oyun dosyalarının kapsam dışı tutulması).
2. `docs/istemler/README.md`: dosya adı kuralı (`NN-kisa-ad.md`, görseller `img/`), her kayıttaki altı başlık, kayıt tablosu.
3. `AGENTS.md`: §3 (Git) ile §4 (Kod yazım) arasına "Çalışma Döngüsü" bölümü; sonraki bölümler bir numara kayar. Doküman indeksine iki satır.
4. Bölüm numarası kayacağı için `AGENTS.md §4–5` diye atıf yapan belge aranır ve düzeltilir.
5. `bun run build` ve `bun test`; ardından yeni bir oturumda kural testi.

Onay: kullanıcı Hafta 04 görevlerinin yapılmasını onayladı ("yapılması gerekenleri yapıp tamamla"); bağımlılık, liste yeri ve birleştirme kararları ayrıca soruldu ve onaylandı.

## Düzeltmeler

- `AGENTS.md`'ye yeni bölüm eklenince "Kod Yazım Kuralları" §5'e, "Kırmızı Çizgiler" §6'ya kaydı. `docs/ortak-gelistirme.md` içindeki "ayrıntı AGENTS.md §4–5" atfı "§5–6" olarak düzeltildi; başka atıf yok (`grep` ile kontrol edildi).

- Kural testinde yeni oturum, `docs/sonnet-talimati.md`'deki eski çalışma akışında şartname ve plan onayı adımlarının olmadığını buldu. `sonnet-talimati.md` "ÇALIŞMA ŞEKLİ" bölümüne `AGENTS.md` §4 döngüsüne yönlendiren iki satır eklendi.

## Doğrulama

```text
$ bun run build
… 19 page(s) built in 2.26s
… Complete!
$ bun test
 91 pass
 0 fail
```

### Kural testi (yeni oturum)

Bu konuşmanın bağlamını taşımayan yeni bir ajan oturumu açıldı (Claude Code, aynı model). Oturuma yalnız depo yolu ve şu soru verildi; dosya değiştirmesi yasaklandı:

```text
Bu repoda bir görevi hangi sırayla yaparsın?
```

Yanıtın özeti (kaynak gösterimleriyle birlikte, kısaltılmış):

```text
Ana sıra AGENTS.md §4 "Çalışma Döngüsü"nden ("Her görev şu sırayla yapılır; adım atlanmaz"):
0. Hazırlık: AGENTS.md → gelistirme-plani.md → görev dosyası; git status, fetch, master'ı çek,
   açık PR'lara bak (ortak-gelistirme.md §1–4).
1. Şartname: görev docs/gorev-sartnamesi.md şablonuyla doldurulur
   (Amaç, Kapsam dışı, Kabul ölçütleri, Dokunulacak dosyalar, Doğrulama adımları). [AGENTS.md §4.1]
2. Önce plan: değişecek dosyalar, yaklaşım, riskler sunulur; onay gelmeden hiçbir dosya
   değiştirilmez. [AGENTS.md §4.2]
3. Değişiklik: kendi dalında (feature/NN-kisa-ad), yalnız şartnamedeki dosyalar; master'a
   commit yok, force-push yok. [AGENTS.md §3, §4.3]
4. Doğrulama: bun run build 0 hata, mantık değiştiyse bun test; elle deneme. [AGENTS.md §3.2, §4.4]
5. Günlük: istem, plan, düzeltmeler, doğrulama docs/istemler/NN-kisa-ad.md'ye. [AGENTS.md §4.5]
6. Kapanış: PR açılır.
Dikkat: AGENTS.md §4 şartname ve plan onayını zorunlu tutuyor; sonnet-talimati.md'deki eski akışta
bu iki adım yok. İkisi birlikte uygulanmalı.
Okunan dosyalar: AGENTS.md, CLAUDE.md, GEMINI.md, docs/sonnet-talimati.md, docs/ortak-gelistirme.md,
docs/gorev-sartnamesi.md, docs/istemler/README.md
```

**Sonuç:** Yeni oturum döngüyü `AGENTS.md`'deki sırayla anlattı; kural çalışıyor.
