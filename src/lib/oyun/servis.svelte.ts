// Canlı servis durumu ($state) ve oyuncu eylemleri (docs/oyun-mimarisi.md §5)
import ayarJson from "../veri/ayarlar.json";
import bolumlerJson from "../veri/bolumler.json";
import malzemelerJson from "../veri/malzemeler.json";
import tiplerJson from "../veri/musteriler.json";
import type { Ayarlar, Bolum, Malzeme, Musteri, MusteriTipi, Sonuc, TabakParcasi } from "../../types/oyun";
import { degerlendir, type Hata } from "./degerlendirme";
import { gelirHesapla, idealNet, siparisFiyati, siparisMaliyeti, yildizHesapla } from "./ekonomi";
import { kuyrukUret } from "./kuyruk";
import { ruhHali } from "./musteri";
import { bolgeBul, tavaIlerlet, yeniTava, type Tava } from "./pisirme";
import { cal } from "./ses";

export const AYAR = ayarJson as Ayarlar;
export const MALZEMELER = malzemelerJson as Malzeme[];
export const TIPLER = tiplerJson as MusteriTipi[];
export const BOLUMLER = bolumlerJson as unknown as Bolum[];

export const malzeme = (id: string) => MALZEMELER.find((m) => m.id === id) as Malzeme;
export const tip = (id: string) => TIPLER.find((t) => t.id === id) as MusteriTipi;

export interface Slot {
  musteri: Musteri;
  durum: "bekliyor" | "ayrildi";
  sonuc?: Sonuc;
  yuz?: string;
  cikisSn: number;
}

export interface Mesaj {
  ana: string;
  alt: string[];
  sonuc: Sonuc | "yanik" | "bilgi";
  kalan: number;
}

const SONUC_YAZI: Record<Sonuc, string> = {
  perfect: "PERFECT!",
  great: "GREAT",
  good: "GOOD",
  olmadi: "OLMADI",
};

function nedenMetni(h: Hata): string {
  switch (h.tur) {
    case "eksik": return `Eksik: ${malzeme(h.malzeme).ad}`;
    case "fazla": return `Fazla: ${malzeme(h.malzeme).ad}`;
    case "yanlis": return `${malzeme(h.malzeme).ad} yerine ${malzeme(h.beklenen).ad} olmalıydı`;
    case "sira": return "Sıra hatası";
    case "cig": return `${h.sira}. krep çiğ`;
    case "fazlaPismis": return `${h.sira}. krep fazla pişti`;
  }
}

export class ServisDurumu {
  readonly bolum: Bolum;
  readonly kuyruk: Musteri[];
  readonly ideal: number;

  zaman = $state(0);
  duraklatildi = $state(false);
  bitti = $state(false);
  yildiz = $state<0 | 1 | 2 | 3>(0);

  slotlar = $state<(Slot | null)[]>([]);
  tavalar = $state<Tava[]>([]);
  tabak = $state<{ parcalar: TabakParcasi[]; mesgul: number }>({ parcalar: [], mesgul: 0 });
  net = $state(0);
  combo = $state(1);
  servisEdilen = $state(0);
  perfectSayisi = $state(0);
  mesaj = $state<Mesaj | null>(null);
  copTutuluyor = $state(false);
  copSn = $state(0);
  ilkVerildi = $state(false);
  dokunarakCevir = $state(false);
  ipucu = $state(true);

  private sonrakiMusteri = 0;

  constructor(bolumNo: number, tohum = Math.floor(Math.random() * 1e9)) {
    this.bolum = BOLUMLER.find((b) => b.id === bolumNo) ?? BOLUMLER[0];
    this.kuyruk = kuyrukUret(this.bolum, MALZEMELER, TIPLER, AYAR, tohum);
    this.ideal = idealNet(
      this.kuyruk.map((m) => ({ siparis: m.siparis, tip: tip(m.tip) })),
      MALZEMELER,
      AYAR
    );
    this.slotlar = Array.from({ length: this.bolum.eszamanli }, () => null);
    this.tavalar = Array.from({ length: this.bolum.tava }, () => yeniTava());
  }

  /** Sıradaki bekleyen müşterinin beklenen malzemesi (ipucu için), yoksa null */
  get siradaki(): string | null {
    const slot = this.slotlar.find((s) => s && s.durum === "bekliyor");
    if (!slot) return null;
    const beklenen = slot.musteri.siparis.parcalar;
    const t = this.tabak.parcalar;
    for (let i = 0; i < t.length; i++) if (t[i].malzeme !== beklenen[i]) return null;
    return beklenen[t.length] ?? null;
  }

  duraklat() { if (!this.bitti) this.duraklatildi = true; }
  surdur() { this.duraklatildi = false; }

  private mesajVer(ana: string, alt: string[], sonuc: Mesaj["sonuc"]) {
    this.mesaj = { ana, alt, sonuc, kalan: AYAR.mesajSuresi };
  }

  ilerle(dt: number) {
    if (this.duraklatildi || this.bitti) return;
    this.zaman += dt;

    // Müşteri gelişi
    const bos = this.slotlar.indexOf(null);
    const sonraki = this.kuyruk[this.sonrakiMusteri];
    if (sonraki && bos !== -1 && sonraki.gelisZamani <= this.zaman) {
      this.slotlar[bos] = { musteri: sonraki, durum: "bekliyor", cikisSn: 0 };
      this.sonrakiMusteri++;
      cal("kapi");
    }

    // Sabır ve çıkış
    const donuk = this.bolum.id <= AYAR.sabirDondurmaBolumu && !this.ilkVerildi;
    for (let i = 0; i < this.slotlar.length; i++) {
      const s = this.slotlar[i];
      if (!s) continue;
      if (s.durum === "bekliyor") {
        if (!donuk) {
          const taban = s.musteri.sabirToplam * AYAR.sabirTaban;
          s.musteri.sabir = Math.max(taban, s.musteri.sabir - dt);
        }
      } else {
        s.cikisSn -= dt;
        if (s.cikisSn <= 0) this.slotlar[i] = null;
      }
    }

    // Tavalar
    for (const tava of this.tavalar) {
      if (tavaIlerlet(tava, dt, AYAR)) {
        this.net -= malzeme("krep").maliyet;
        Object.assign(tava, yeniTava());
        this.mesajVer("Yanık krep çöpe gitti", ["−" + malzeme("krep").maliyet], "yanik");
        cal("yanik");
      }
    }

    // Tabak meşguliyeti ve çöp kutusu
    if (this.tabak.mesgul > 0) this.tabak.mesgul = Math.max(0, this.tabak.mesgul - dt);
    if (this.copTutuluyor) {
      this.copSn += dt;
      if (this.copSn >= AYAR.copBasma) this.tabagiBosalt();
    }

    if (this.mesaj) {
      this.mesaj.kalan -= dt;
      if (this.mesaj.kalan <= 0) this.mesaj = null;
    }

    // Servis bitti mi?
    if (this.sonrakiMusteri >= this.kuyruk.length && this.slotlar.every((s) => s === null)) {
      this.bitti = true;
      this.yildiz = this.net > 0 ? yildizHesapla(this.net, this.ideal, AYAR) : 0;
    }
  }

  tavayaDokun(i: number) {
    const tava = this.tavalar[i];
    if (!tava || this.duraklatildi || this.bitti) return;
    if (tava.durum === "bos") {
      tava.durum = "pisiyor";
      tava.p = 0;
      cal("hamur");
    } else if (tava.durum === "pisiyor" && this.dokunarakCevir) {
      this.tavayiCevir(i);
    }
  }

  tavayiCevir(i: number) {
    const tava = this.tavalar[i];
    if (!tava || tava.durum !== "pisiyor" || this.duraklatildi || this.bitti) return;
    if (this.tabak.parcalar.length >= AYAR.tabakMax) return;
    this.tabak.parcalar.push({ malzeme: "krep", pisme: bolgeBul(tava.p, AYAR) });
    this.net -= malzeme("krep").maliyet;
    Object.assign(tava, yeniTava());
    cal("cevir");
  }

  malzemeKoy(id: string) {
    if (this.duraklatildi || this.bitti) return;
    if (this.tabak.mesgul > 0 || this.tabak.parcalar.length >= AYAR.tabakMax) return;
    const m = malzeme(id);
    this.tabak.parcalar.push({ malzeme: id });
    this.net -= m.maliyet;
    this.tabak.mesgul =
      m.kategori === "sos" ? AYAR.sosSuresi : m.kategori === "dolgu" ? AYAR.dolguSuresi : AYAR.toppingSuresi;
    cal("malzeme");
  }

  copBasla() { if (this.tabak.parcalar.length) this.copTutuluyor = true; }
  copBirak() { this.copTutuluyor = false; this.copSn = 0; }

  tabagiBosalt() {
    this.copBirak();
    if (!this.tabak.parcalar.length) return;
    // Bölüm 1–5'te çöp ücretsiz: kullanılan malzemenin maliyeti geri verilir
    if (this.bolum.id <= 5) {
      this.net += siparisMaliyeti(this.tabak.parcalar.map((p) => p.malzeme), MALZEMELER);
    }
    this.tabak.parcalar = [];
    this.tabak.mesgul = 0;
    cal("cop");
  }

  musteriyeVer(slotIndex: number) {
    const slot = this.slotlar[slotIndex];
    if (!slot || slot.durum !== "bekliyor" || this.duraklatildi || this.bitti) return;
    if (!this.tabak.parcalar.length) return;

    const t = tip(slot.musteri.tip);
    const siparis = slot.musteri.siparis;
    const d = degerlendir(siparis.parcalar, this.tabak.parcalar, t.ceza, AYAR);
    const oran = slot.musteri.sabir / slot.musteri.sabirToplam;
    const g = gelirHesapla({
      fiyat: siparisFiyati(siparis, MALZEMELER),
      sonuc: d.sonuc, tip: t, sabirOrani: oran, combo: this.combo, bolumNo: this.bolum.id, ayar: AYAR,
    });
    this.net += g.toplam;
    if (d.sonuc === "perfect" || d.sonuc === "great") this.combo += 1;
    else if (d.sonuc === "olmadi") this.combo = 1;
    if (d.sonuc === "perfect") this.perfectSayisi++;

    slot.durum = "ayrildi";
    slot.sonuc = d.sonuc;
    slot.yuz = d.sonuc === "olmadi" ? "😖" : ruhHali(oran, AYAR).yuz;
    slot.cikisSn = AYAR.cikisSuresi;
    this.servisEdilen++;
    this.ilkVerildi = true;
    this.tabak.parcalar = [];
    this.tabak.mesgul = 0;

    this.mesajVer(SONUC_YAZI[d.sonuc], d.hatalar.slice(0, 2).map(nedenMetni), d.sonuc);
    cal(d.sonuc);
  }
}
