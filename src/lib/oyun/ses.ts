// Web Audio ile kısa sentez sesler (dosya ve bağımlılık yok). Yalnızca istemcide çalışır.
export type SesTuru = "hamur" | "cevir" | "malzeme" | "cop" | "yanik" | "kapi" | "perfect" | "great" | "good" | "olmadi" | "coin"
  | "dok" | "cizirti" | "whoosh" | "plap" | "pop" | "ding" | "flop" | "parilti" | "puf";

let ctx: AudioContext | null = null;
export const sesDurumu = { acik: true };

function not(frekans: number, baslangic: number, sure: number, tur: OscillatorType = "sine", ses = 0.12) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const kazanc = ctx.createGain();
  osc.type = tur;
  osc.frequency.setValueAtTime(frekans, ctx.currentTime + baslangic);
  kazanc.gain.setValueAtTime(ses, ctx.currentTime + baslangic);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + baslangic + sure);
  osc.connect(kazanc).connect(ctx.destination);
  osc.start(ctx.currentTime + baslangic);
  osc.stop(ctx.currentTime + baslangic + sure + 0.02);
}

let gurultu: AudioBuffer | null = null;

/** Süzülmüş gürültü patlaması: whoosh, cızırtı, püf için (frekans f1'den f2'ye kayar) */
function gurultuPatla(f1: number, f2: number, baslangic: number, sure: number, ses = 0.08, tur: BiquadFilterType = "bandpass") {
  if (!ctx) return;
  if (!gurultu) {
    gurultu = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = gurultu.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const kaynak = ctx.createBufferSource();
  kaynak.buffer = gurultu;
  kaynak.loop = true;
  const suzgec = ctx.createBiquadFilter();
  suzgec.type = tur;
  suzgec.Q.value = 1.2;
  const t0 = ctx.currentTime + baslangic;
  suzgec.frequency.setValueAtTime(f1, t0);
  suzgec.frequency.exponentialRampToValueAtTime(f2, t0 + sure);
  const kazanc = ctx.createGain();
  kazanc.gain.setValueAtTime(0.0001, t0);
  kazanc.gain.exponentialRampToValueAtTime(ses, t0 + sure * 0.25);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
  kaynak.connect(suzgec).connect(kazanc).connect(ctx.destination);
  kaynak.start(t0);
  kaynak.stop(t0 + sure + 0.02);
}

/** Frekansı kayan nota (pop, plap, flop için) */
function kayanNot(f1: number, f2: number, baslangic: number, sure: number, tur: OscillatorType = "sine", ses = 0.14) {
  if (!ctx) return;
  const t0 = ctx.currentTime + baslangic;
  const osc = ctx.createOscillator();
  const kazanc = ctx.createGain();
  osc.type = tur;
  osc.frequency.setValueAtTime(f1, t0);
  osc.frequency.exponentialRampToValueAtTime(f2, t0 + sure);
  kazanc.gain.setValueAtTime(ses, t0);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
  osc.connect(kazanc).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + sure + 0.02);
}

export function cal(tur: SesTuru) {
  if (!sesDurumu.acik || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    switch (tur) {
      case "hamur": not(180, 0, 0.18, "sawtooth", 0.06); not(120, 0.05, 0.2, "sawtooth", 0.05); break;
      case "cevir": not(300, 0, 0.12, "triangle"); not(520, 0.08, 0.14, "triangle"); not(200, 0.2, 0.1, "sine", 0.15); break;
      case "malzeme": not(440, 0, 0.08, "square", 0.05); break;
      case "cop": not(150, 0, 0.2, "sawtooth", 0.07); break;
      case "yanik": not(110, 0, 0.35, "sawtooth", 0.08); break;
      case "kapi": not(880, 0, 0.12, "sine", 0.08); not(660, 0.12, 0.2, "sine", 0.08); break;
      case "perfect": [523, 659, 784, 1047].forEach((f, i) => not(f, i * 0.09, 0.2, "triangle", 0.12)); break;
      case "great": [523, 659, 784].forEach((f, i) => not(f, i * 0.09, 0.18, "triangle", 0.1)); break;
      case "good": not(440, 0, 0.15, "triangle"); not(494, 0.12, 0.18, "triangle"); break;
      case "olmadi": not(220, 0, 0.2, "sawtooth", 0.08); not(165, 0.18, 0.3, "sawtooth", 0.08); break;
      case "dok": kayanNot(260 + Math.random() * 60, 150, 0, 0.09, "sine", 0.05); gurultuPatla(900, 500, 0, 0.1, 0.025); break;
      case "cizirti": gurultuPatla(5200 + Math.random() * 1500, 3000, 0, 0.16, 0.035, "highpass"); break;
      case "whoosh": gurultuPatla(500, 3200, 0, 0.32, 0.12); break;
      case "plap": kayanNot(240, 90, 0, 0.14, "sine", 0.22); gurultuPatla(1400, 400, 0, 0.08, 0.07); break;
      case "pop": kayanNot(420, 900, 0, 0.09, "sine", 0.14); break;
      case "ding": not(1568, 0, 0.22, "sine", 0.06); break;
      case "flop": kayanNot(180, 70, 0, 0.2, "sine", 0.25); gurultuPatla(700, 250, 0, 0.12, 0.06); break;
      case "parilti": [1319, 1568, 2093].forEach((f, i) => not(f, i * 0.06, 0.16, "sine", 0.06)); break;
      case "puf": gurultuPatla(1200, 300, 0, 0.3, 0.07, "lowpass"); break;
      case "coin": not(988, 0, 0.08, "square", 0.05); not(1319, 0.08, 0.16, "square", 0.05); break;
    }
  } catch {
    // ses desteklenmiyorsa sessizce devam et
  }
}
