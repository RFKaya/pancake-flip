// Sonsuz seviye tipleri (sayılar: src/lib/veri/seviye.json; kurallar: docs/sonsuz-seviye.md)

/** Bir seviyenin bütün oyun parametreleri (seviye numarasından hesaplanır) */
export interface SeviyeAyari {
  seviye: number; // seviye numarası (1'den başlar)
  zorluk: number; // 0..1, doyuma giden normalize zorluk
  gerekenMusteri: number; // sonraki seviyeye geçmek için servis edilecek müşteri
  menu: string[]; // açık malzeme id'leri (krep hariç)
  krep: [number, number]; // siparişteki krep sayısı aralığı [en az, en çok]
  d: [number, number]; // sipariş zorluk puanı aralığı
  tava: number; // tava sayısı
  eszamanli: number; // aynı anda bekleyebilecek müşteri sayısı
  cevirmeAcik: boolean; // krep çevrilebiliyor mu
  tercihAcik: boolean; // kalınlık tercihi (ince / kalın) açık mı
  yogunSaatAcik: boolean; // yoğun saat olayı açık mı
  ipucu: boolean; // dokunma ipuçları gösterilsin mi
  cevirPencere: number; // çevirme zaman penceresi (sn)
  hamurTolerans: number; // döküm hedefindeki tolerans
  pisirmeHizi: number; // pişme hızı çarpanı
  sabirCarpani: number; // müşteri sabrı çarpanı
  gelmeAraligi: number; // müşteriler arası bekleme (sn)
  tercihOlasiligi: number; // siparişte kalınlık tercihi çıkma olasılığı (0..1)
  musteriAgirlik: Record<string, number>; // müşteri tipi id → görülme ağırlığı
}

/** seviye.json dosyasının yapısı */
export interface SeviyeYapilandirmasi {
  seviyeSiniri: number; // ulaşılabilecek en yüksek seviye
  devHizliSeviyeler: number[]; // geliştirici modundaki hızlı geçiş düğmeleri
  devEnYuksek: number; // geliştirici modunda girilebilecek en yüksek seviye
  gerekenMusteri: { noktalar: [number, number][]; ileriArtis: number; tavan: number }; // seviye → gereken müşteri eğrisi
  zorluk: { olcek: number }; // zorluk eğrisinin ölçeği
  ilerleme: { perfect: number; great: number; good: number; olmadi: number; seri: { esik: number; bonus: number } }; // sonuca göre ilerleme puanı
  egriler: Record<"cevirPencere" | "hamurTolerans" | "pisirmeHizi" | "sabirCarpani" | "gelmeAraligi" | "ozelMusteriCarpani" | "tercihOlasiligi", [number, number]>; // [kolay, zor] uçları
  sabirMin: number; // sabrın inebileceği en düşük değer (sn)
  musteriArasi: number; // müşteriler arası temel bekleme (sn)
  ilkMusteriGecikmesi: number; // oyun başında ilk müşterinin gelme süresi (sn)
  ipucuSeviyesi: number; // ipuçlarının kapandığı seviye
  yogunSaat: { aralik: number; sure: number; gelmeCarpani: number; kazancCarpani: number }; // yoğun saat olayı
  kademeler: { seviye: number; krep: [number, number]; d: [number, number]; eszamanli: number; tava: number }[]; // seviye eşiklerindeki sipariş kademeleri
  mekanikler: { seviye: number; id: string; ad: string; ikon: string }[]; // seviyeyle açılan mekanikler
  kilometreTaslari: { seviye: number; baslik: string; alt: string }[]; // fiş kesilen kilometre taşları
}

/** Bir seviyede açılan yenilik (malzeme, müşteri tipi ya da mekanik) */
export interface Acilis {
  tur: "malzeme" | "musteri" | "mekanik"; // yeniliğin türü
  id: string; // yeniliğin kimliği
  ad: string; // oyuncuya görünen ad
  ikon: string; // emoji
  seviye: number; // açıldığı seviye
}

/** Cihazda saklanan ilerleme kaydı (localStorage "pancakeflip-ilerleme") */
export interface IlerlemeVerisi {
  surum: 1; // kayıt biçiminin sürümü
  seviye: number; // oyuncunun seviyesi
  ilerleme: number; // sonraki seviyeye doğru servis edilen müşteri
  toplamMusteri: number; // bugüne kadar servis edilen müşteri
  toplamCoin: number; // kasadaki toplam coin
  enYuksekSeviye: number; // ulaşılan en yüksek seviye
  enIyiSeri: number; // en uzun seri rekoru (eski kayıtlarda yok → 0)
  toplamMukemmel: number; // PERFECT servis sayısı (eski kayıtlarda yok → 0)
}
