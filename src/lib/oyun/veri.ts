// JSON veri dosyalarının tipli erişimi (oyun sayıları src/lib/veri/*.json içindedir)
import ayarJson from "../veri/ayarlar.json";
import malzemelerJson from "../veri/malzemeler.json";
import tiplerJson from "../veri/musteriler.json";
import seviyeJson from "../veri/seviye.json";
import type { Ayarlar, Malzeme, MusteriTipi, SeviyeYapilandirmasi } from "../types";

export const AYAR = ayarJson as Ayarlar;
export const MALZEMELER = malzemelerJson as Malzeme[];
export const TIPLER = tiplerJson as MusteriTipi[];
export const SEVIYE = seviyeJson as unknown as SeviyeYapilandirmasi;

export const malzeme = (id: string) => MALZEMELER.find((m) => m.id === id) as Malzeme;
export const tip = (id: string) => TIPLER.find((t) => t.id === id) as MusteriTipi;
