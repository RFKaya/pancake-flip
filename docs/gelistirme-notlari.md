# Geliştirme Notları

## Liste hâllerini elle denemek

Liste ekranları veriyi tek yükleme noktasından alır ([`src/lib/yukleyici.ts`](../src/lib/yukleyici.ts)) ve dört hâlden birini gösterir: yükleniyor, hata, boş, dolu. Geliştirme sırasında hâl adres çubuğundan zorlanır:

| Adres eki | Sonuç |
|---|---|
| `?durum=yukleniyor` | Yükleme hiç bitmez; iskelet (`ui/Yukleniyor`) görünür. |
| `?durum=hata` | İlk yükleme hata verir (`ui/HataDurumu`); **Tekrar dene** ikinci denemede listeyi getirir. |
| `?durum=bos` | Liste boş gelir (`ui/BosDurum`). |
| `?durum=ornek` | Yalnız Fişlerim: cihazdaki fişler yerine [`src/lib/veri/ornek.ts`](../src/lib/veri/ornek.ts) fişleri. |
| *(yok)* | Gerçek veri. |

Örnekler (`bun run dev` açıkken):

- `http://localhost:1420/rehber?durum=hata` → hata, sonra **Tekrar dene** → 8 malzeme.
- `http://localhost:1420/ar/rehber?durum=bos` → Arapça boş hâl.
- `http://localhost:1420/fislerim?durum=ornek` → 6 örnek fiş.

Arama boş sonuç verirse (`/rehber?q=xyz`) boş hâl **Aramayı temizle** düğmesiyle gelir. Arama metni adreste (`?q=`) tutulur; detay ekranından geri dönünce kaybolmaz.

`?durum=` yalnız istemcide okunur ve oyun kurallarına, kayda dokunmaz. Yayında kimse bu eki kullanmazsa her şey gerçek veriyle çalışır.
