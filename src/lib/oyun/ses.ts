// Web Audio ile kısa sentez sesler (dosya ve bağımlılık yok). Yalnızca istemcide çalışır.
// Hedef: sevimli + tatmin edici + temiz. Sesler kısa, yumuşak (sine / triangle, süzülmüş gürültü), aynı "aile"dendir.
//
// Mikser: her ses bir veri yoluna (bus) gider: sfx · ortam (sürekli cızırtı/dökme) · arayuz · muzik.
// Hepsi tek bir sıkıştırıcıdan (compressor) geçer, böylece üst üste binen sesler patlamaz.
// Öncelik (ses gücü): başarı > çevirme > tabağa düşme > malzeme > müşteri > coin > ortam > arayüz.
// Spam koruması: her sesin kısa bir bekleme süresi (cooldown) ve küçük perde / ses farkı vardır.

export type SesTuru =
  // hamur, pişme
  | "yayil" | "tik" | "ding" | "yanik" | "puf"
  // çevirme
  | "whoosh" | "kalk" | "whip" | "plap" | "mukemmelCevir" | "womp" | "boop"
  // tabak ve malzeme
  | "plop" | "boing" | "squish" | "meyve" | "serpme" | "krema" | "bonk"
  // ödül
  | "great" | "perfect" | "coin" | "levelup" | "parilti"
  // müşteri
  | "musteri" | "yay" | "sabirsiz" | "homurtu" | "uzgun"
  // arayüz
  | "tikla";

type Yol = "sfx" | "ortam" | "arayuz" | "muzik";
type DonguAdi = "dok" | "cizirti";

/** Kullanıcı ayarı (Profil → Ses). Müzik yolu hazır; henüz müzik yok. */
export const sesDurumu = { acik: true, sfx: 1, muzik: 1 };
const ANAHTAR = "pancakeflip-ses";

export function sesYukle() {
  try {
    const h = JSON.parse(localStorage.getItem(ANAHTAR) ?? "{}");
    if (typeof h.acik === "boolean") sesDurumu.acik = h.acik;
    if (typeof h.sfx === "number") sesDurumu.sfx = Math.min(1, Math.max(0, h.sfx));
    if (typeof h.muzik === "number") sesDurumu.muzik = Math.min(1, Math.max(0, h.muzik));
  } catch {
    // bozuk kayıt: varsayılanlar
  }
  yollariGuncelle();
}

export function sesKaydet() {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(sesDurumu));
  } catch {
    // depolama yoksa sessizce devam et
  }
  yollariGuncelle();
}

let ctx: AudioContext | null = null;
let ana: GainNode;
const yollar = {} as Record<Yol, GainNode>;

function yollariGuncelle() {
  if (!ctx) return;
  ana.gain.value = sesDurumu.acik ? 0.9 : 0;
  yollar.sfx.gain.value = sesDurumu.sfx;
  yollar.ortam.gain.value = sesDurumu.sfx * 0.7;
  yollar.arayuz.gain.value = sesDurumu.sfx * 0.8;
  yollar.muzik.gain.value = sesDurumu.muzik;
}

function ctxHazirla(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    ana = ctx.createGain();
    const sik = ctx.createDynamicsCompressor();
    sik.threshold.value = -16;
    sik.knee.value = 18;
    sik.ratio.value = 5;
    sik.attack.value = 0.003;
    sik.release.value = 0.15;
    ana.connect(sik).connect(ctx.destination);
    for (const y of ["sfx", "ortam", "arayuz", "muzik"] as Yol[]) {
      yollar[y] = ctx.createGain();
      yollar[y].connect(ana);
    }
    yollariGuncelle();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// ---- Sentez yardımcıları: o an çalan sesin yolu, perdesi ve gücü modül değişkenlerinde tutulur ----
let hedefYol: GainNode;
let perde = 1;
let guc = 1;

function not(frekans: number, baslangic: number, sure: number, tur: OscillatorType = "sine", ses = 0.12) {
  kayanNot(frekans, frekans, baslangic, sure, tur, ses);
}

/** Frekansı kayan nota (plop, boop, pop için) */
function kayanNot(f1: number, f2: number, baslangic: number, sure: number, tur: OscillatorType = "sine", ses = 0.14) {
  if (!ctx) return;
  const t0 = ctx.currentTime + baslangic;
  const osc = ctx.createOscillator();
  const kazanc = ctx.createGain();
  osc.type = tur;
  osc.frequency.setValueAtTime(f1 * perde, t0);
  if (f1 !== f2) osc.frequency.exponentialRampToValueAtTime(f2 * perde, t0 + sure);
  kazanc.gain.setValueAtTime(0.0001, t0);
  kazanc.gain.linearRampToValueAtTime(ses * guc, t0 + 0.004); // tık sesi olmasın
  kazanc.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
  osc.connect(kazanc).connect(hedefYol);
  osc.start(t0);
  osc.stop(t0 + sure + 0.02);
}

let gurultu: AudioBuffer | null = null;
function gurultuTamponu() {
  if (!ctx) return null;
  if (!gurultu) {
    gurultu = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = gurultu.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return gurultu;
}

/** Süzülmüş gürültü patlaması: whoosh, püf, serpme için (frekans f1'den f2'ye kayar) */
function gurultuPatla(f1: number, f2: number, baslangic: number, sure: number, ses = 0.08, tur: BiquadFilterType = "bandpass", q = 1.2) {
  if (!ctx) return;
  const kaynak = ctx.createBufferSource();
  kaynak.buffer = gurultuTamponu();
  kaynak.loop = true;
  const suzgec = ctx.createBiquadFilter();
  suzgec.type = tur;
  suzgec.Q.value = q;
  const t0 = ctx.currentTime + baslangic;
  suzgec.frequency.setValueAtTime(f1 * perde, t0);
  suzgec.frequency.exponentialRampToValueAtTime(f2 * perde, t0 + sure);
  const kazanc = ctx.createGain();
  kazanc.gain.setValueAtTime(0.0001, t0);
  kazanc.gain.exponentialRampToValueAtTime(ses * guc, t0 + sure * 0.25);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
  kaynak.connect(suzgec).connect(kazanc).connect(hedefYol);
  kaynak.start(t0);
  kaynak.stop(t0 + sure + 0.02);
}

// ---- Sesler ----
type Tarif = { yol: Yol; guc: number; bekle: number; oynat: () => void };

const T: Record<SesTuru, Tarif> = {
  // Hamur / pişme (ortam: düşük öncelik)
  yayil: { yol: "sfx", guc: 0.5, bekle: 80, oynat: () => { kayanNot(330, 150, 0, 0.08, "sine", 0.16); gurultuPatla(900, 350, 0, 0.06, 0.03, "lowpass"); } },
  tik: { yol: "sfx", guc: 0.5, bekle: 120, oynat: () => { not(1568, 0, 0.07, "sine", 0.1); not(2093, 0.045, 0.1, "sine", 0.07); } },
  ding: { yol: "sfx", guc: 0.55, bekle: 200, oynat: () => { not(1760, 0, 0.28, "sine", 0.1); not(2637, 0, 0.16, "sine", 0.04); } },
  yanik: { yol: "sfx", guc: 0.8, bekle: 400, oynat: () => { gurultuPatla(1800, 350, 0, 0.26, 0.2, "lowpass"); kayanNot(260, 110, 0.14, 0.34, "triangle", 0.2); } },
  puf: { yol: "sfx", guc: 0.5, bekle: 100, oynat: () => gurultuPatla(1200, 300, 0, 0.26, 0.1, "lowpass") },

  // Çevirme: whoosh → havada whoop → whip → PLAP
  whoosh: { yol: "sfx", guc: 0.9, bekle: 120, oynat: () => { gurultuPatla(450, 3200, 0, 0.3, 0.2); kayanNot(260, 520, 0, 0.18, "sine", 0.08); } },
  kalk: { yol: "sfx", guc: 0.7, bekle: 150, oynat: () => kayanNot(320, 680, 0, 0.16, "sine", 0.12) },
  whip: { yol: "sfx", guc: 0.5, bekle: 150, oynat: () => gurultuPatla(3500, 7000, 0, 0.08, 0.1, "highpass") },
  plap: { yol: "sfx", guc: 1, bekle: 80, oynat: () => { kayanNot(280, 105, 0, 0.13, "sine", 0.4); kayanNot(560, 220, 0, 0.05, "triangle", 0.14); gurultuPatla(1500, 400, 0, 0.07, 0.1, "lowpass"); } },
  mukemmelCevir: {
    yol: "sfx", guc: 1, bekle: 150,
    oynat: () => {
      const v = [1047, 1175, 1319][Math.floor(Math.random() * 3)];
      [v, v * 1.26, v * 1.5, v * 2].forEach((f, i) => not(f, 0.05 + i * 0.06, 0.2, "triangle", 0.12));
      not(v * 3, 0.2, 0.25, "sine", 0.05);
    },
  },
  womp: { yol: "sfx", guc: 0.7, bekle: 200, oynat: () => { kayanNot(340, 230, 0, 0.18, "triangle", 0.2); kayanNot(260, 150, 0.15, 0.26, "triangle", 0.2); } },
  boop: { yol: "sfx", guc: 0.6, bekle: 150, oynat: () => kayanNot(460, 320, 0, 0.13, "sine", 0.22) },

  // Tabak ve malzemeler
  plop: { yol: "sfx", guc: 0.9, bekle: 80, oynat: () => { kayanNot(230, 85, 0, 0.16, "sine", 0.36); gurultuPatla(900, 300, 0, 0.06, 0.07, "lowpass"); } },
  boing: { yol: "sfx", guc: 0.5, bekle: 100, oynat: () => { kayanNot(300, 520, 0.07, 0.1, "sine", 0.1); kayanNot(520, 330, 0.17, 0.12, "sine", 0.08); } },
  squish: { yol: "sfx", guc: 0.6, bekle: 70, oynat: () => { gurultuPatla(1100, 320, 0, 0.12, 0.09, "lowpass"); kayanNot(260, 170, 0, 0.1, "sine", 0.16); } },
  meyve: { yol: "sfx", guc: 0.6, bekle: 70, oynat: () => { kayanNot(480, 920, 0, 0.07, "sine", 0.18); gurultuPatla(2400, 1200, 0, 0.03, 0.04, "bandpass"); } },
  serpme: { yol: "sfx", guc: 0.5, bekle: 70, oynat: () => { for (let i = 0; i < 4; i++) gurultuPatla(5200 + i * 500, 3800, i * 0.028, 0.03, 0.07, "highpass"); not(1200, 0, 0.04, "triangle", 0.05); } },
  krema: { yol: "sfx", guc: 0.6, bekle: 70, oynat: () => { gurultuPatla(2200, 600, 0, 0.16, 0.08, "lowpass"); kayanNot(400, 520, 0, 0.1, "sine", 0.08); } },
  bonk: { yol: "sfx", guc: 0.8, bekle: 150, oynat: () => { kayanNot(230, 105, 0, 0.12, "triangle", 0.34); not(820, 0, 0.03, "sine", 0.1); kayanNot(170, 135, 0.09, 0.1, "sine", 0.1); } },

  // Ödüller
  great: { yol: "sfx", guc: 0.9, bekle: 200, oynat: () => { not(784, 0, 0.18, "triangle", 0.16); not(1047, 0.1, 0.3, "triangle", 0.16); not(2093, 0.1, 0.2, "sine", 0.05); } },
  perfect: {
    yol: "sfx", guc: 1, bekle: 200,
    oynat: () => {
      [784, 988, 1175, 1568].forEach((f, i) => not(f, i * 0.07, 0.24, "triangle", 0.15));
      [2093, 2637, 3136].forEach((f, i) => not(f, 0.22 + i * 0.05, 0.18, "sine", 0.05));
    },
  },
  coin: { yol: "sfx", guc: 0.55, bekle: 45, oynat: () => { not(1568, 0, 0.05, "triangle", 0.1); not(2349, 0.045, 0.14, "sine", 0.1); } },
  levelup: {
    yol: "sfx", guc: 1.1, bekle: 600,
    oynat: () => {
      [523, 659, 784, 1047].forEach((f, i) => not(f, i * 0.1, 0.26, "triangle", 0.17));
      kayanNot(130, 60, 0.4, 0.22, "sine", 0.22);
      [1047, 1319, 1568, 2093].forEach((f) => not(f, 0.42, 0.7, "sine", 0.07));
      [2637, 3136, 3951].forEach((f, i) => not(f, 0.52 + i * 0.07, 0.2, "sine", 0.05));
    },
  },
  parilti: { yol: "sfx", guc: 0.6, bekle: 150, oynat: () => [1319, 1568, 2093].forEach((f, i) => not(f, i * 0.06, 0.16, "sine", 0.08)) },

  // Müşteri: konuşma yok, kısa karakter sesleri
  musteri: { yol: "sfx", guc: 0.55, bekle: 200, oynat: () => { kayanNot(520, 860, 0, 0.08, "sine", 0.16); kayanNot(780, 1040, 0.07, 0.08, "sine", 0.1); } },
  yay: { yol: "sfx", guc: 0.6, bekle: 250, oynat: () => { kayanNot(700, 1100, 0, 0.08, "sine", 0.16); kayanNot(900, 1450, 0.1, 0.1, "sine", 0.16); } },
  sabirsiz: { yol: "sfx", guc: 0.45, bekle: 600, oynat: () => { not(640, 0, 0.035, "triangle", 0.12); not(600, 0.1, 0.035, "triangle", 0.1); } },
  homurtu: { yol: "sfx", guc: 0.55, bekle: 600, oynat: () => { kayanNot(150, 110, 0, 0.22, "triangle", 0.2); kayanNot(135, 95, 0.2, 0.24, "triangle", 0.18); } },
  uzgun: { yol: "sfx", guc: 0.6, bekle: 300, oynat: () => { kayanNot(520, 330, 0, 0.16, "sine", 0.18); kayanNot(400, 220, 0.16, 0.24, "sine", 0.16); } },

  tikla: { yol: "arayuz", guc: 0.5, bekle: 60, oynat: () => kayanNot(760, 560, 0, 0.05, "sine", 0.14) },
};

const sonCalinma = new Map<SesTuru, number>();

/** Tek seferlik ses. Aynı ses çok sık tetiklenirse (cooldown içinde) yok sayılır; perde ve güç hafifçe oynar. */
export function cal(tur: SesTuru) {
  if (!sesDurumu.acik || typeof window === "undefined") return;
  try {
    if (!ctxHazirla()) return;
    const tarif = T[tur];
    const simdi = performance.now();
    if (simdi - (sonCalinma.get(tur) ?? -1e9) < tarif.bekle) return;
    sonCalinma.set(tur, simdi);
    hedefYol = yollar[tarif.yol];
    perde = 1 + (Math.random() - 0.5) * 0.06; // ±%3: çizgi film gibi değil, yalnızca canlı
    guc = tarif.guc * (1 + (Math.random() - 0.5) * 0.14);
    tarif.oynat();
  } catch (e) {
    // ses desteklenmiyorsa oyun sessizce devam eder; geliştirirken hata konsola düşer
    if (import.meta.env.DEV) console.warn("ses:", tur, e);
  }
}

/** Coin yağmuru: miktar kadar kısa tıngırtı (uzun jingle yok) */
export function coinYagmuru(n: number) {
  for (let i = 0; i < Math.min(8, n); i++) setTimeout(() => cal("coin"), i * 65);
}

// ---- Sürekli sesler (hamur dökme, cızırtı): her tava kendi seviyesini bildirir, ses en yükseğe uyar ----
type Dongu = { gain: GainNode; seviyeler: Map<number, number> };
const donguler = new Map<DonguAdi, Dongu>();

function donguKur(ad: DonguAdi): Dongu | null {
  if (!ctxHazirla() || !ctx) return null;
  let d = donguler.get(ad);
  if (d) return d;
  const kaynak = ctx.createBufferSource();
  kaynak.buffer = gurultuTamponu();
  kaynak.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  const lfo = ctx.createOscillator();
  const lfoGuc = ctx.createGain();
  if (ad === "dok") {
    // yumuşak "şhhh": orta frekanslı süzülmüş gürültü, yavaş dalgalanma (akışkan)
    const bant = ctx.createBiquadFilter();
    bant.type = "bandpass";
    bant.frequency.value = 1500;
    bant.Q.value = 0.7;
    lfo.frequency.value = 6;
    lfoGuc.gain.value = 260;
    lfo.connect(lfoGuc).connect(bant.frequency);
    kaynak.connect(bant).connect(gain);
  } else {
    // hafif cızırtı: yüksek frekans, titreşen genlik
    const yuksek = ctx.createBiquadFilter();
    yuksek.type = "highpass";
    yuksek.frequency.value = 4800;
    const mod = ctx.createGain();
    mod.gain.value = 0.6;
    lfo.type = "square";
    lfo.frequency.value = 17;
    lfoGuc.gain.value = 0.4;
    lfo.connect(lfoGuc).connect(mod.gain);
    kaynak.connect(yuksek).connect(mod).connect(gain);
  }
  gain.connect(yollar[ad === "dok" ? "sfx" : "ortam"]);
  kaynak.start();
  lfo.start();
  d = { gain, seviyeler: new Map() };
  donguler.set(ad, d);
  return d;
}

const DONGU_GUCU: Record<DonguAdi, number> = { dok: 0.2, cizirti: 0.06 };

/** `kimlik`'li tava için döngü seviyesini (0–1) ayarla; 0 = sessiz. Değişimler kısa yumuşatmayla (fade) uygulanır. */
export function donguAyarla(ad: DonguAdi, kimlik: number, seviye: number) {
  if (typeof window === "undefined") return;
  let d = donguler.get(ad);
  if (!d) {
    if (seviye <= 0 || !sesDurumu.acik) return;
    try {
      d = donguKur(ad) ?? undefined;
    } catch {
      return;
    }
    if (!d) return;
  }
  if (seviye <= 0) d.seviyeler.delete(kimlik);
  else d.seviyeler.set(kimlik, seviye);
  const en = Math.max(0, ...d.seviyeler.values());
  d.gain.gain.setTargetAtTime(sesDurumu.acik ? en * DONGU_GUCU[ad] : 0, ctx!.currentTime, ad === "dok" ? 0.025 : 0.12);
}
