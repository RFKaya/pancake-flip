// Web Audio ile kısa sentez sesler (dosya ve bağımlılık yok). Yalnızca istemcide çalışır.
export type SesTuru = "hamur" | "cevir" | "malzeme" | "cop" | "yanik" | "kapi" | "perfect" | "great" | "good" | "olmadi" | "coin";

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
      case "coin": not(988, 0, 0.08, "square", 0.05); not(1319, 0.08, 0.16, "square", 0.05); break;
    }
  } catch {
    // ses desteklenmiyorsa sessizce devam et
  }
}
