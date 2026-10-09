// Malzeme veri tipi (kayıtlar: src/lib/veri/malzemeler.json)

/** Malzemenin türü; tabağa konma ve fiyat kuralları buna göre değişir */
export type Kategori = "krep" | "dolgu" | "sos" | "topping";

export interface Malzeme {
  id: string; // benzersiz kimlik (örn. "cikolata"); siparişlerde ve adreslerde kullanılır
  ad: string; // oyuncuya görünen Türkçe ad
  kategori: Kategori; // malzeme türü
  acilis: number; // açıldığı seviye
  maliyet: number; // tabağa konduğunda düşülen coin
  deger: number; // siparişte kazandırdığı coin
  ikon: string; // menüde ve fişte görünen emoji
  renkDegiskeni: string; // kabın rengi: app.css değişkeninin adı (örn. "--vurgu")
  tatli?: boolean; // tatlı mı (çocuk müşteri tatlı ister); yoksa tatlı değil
}
