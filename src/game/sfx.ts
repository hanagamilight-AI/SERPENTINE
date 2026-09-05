/* Tiny chiptune synth — no assets, lazy AudioContext (created on first user gesture). */

let ctx: AudioContext | null = null;
let muted = false;

export function setSfxMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  slide?: number;
  delay?: number;
}

function tone(freq: number, dur: number, opts: ToneOpts = {}) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  try {
    const { type = 'square', vol = 0.045, slide = 0, delay = 0 } = opts;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0004, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  } catch {
    /* audio is decoration — never break the game */
  }
}

export const sfx = {
  eat() {
    tone(540, 0.09, { slide: 260 });
  },
  bonus() {
    tone(660, 0.07);
    tone(880, 0.08, { delay: 0.07 });
    tone(1320, 0.13, { delay: 0.14 });
  },
  die() {
    tone(300, 0.3, { type: 'sawtooth', vol: 0.055, slide: -240 });
    tone(140, 0.42, { type: 'triangle', vol: 0.06, slide: -95, delay: 0.09 });
  },
  start() {
    tone(440, 0.07);
    tone(660, 0.1, { delay: 0.08 });
  },
  pause() {
    tone(340, 0.09, { type: 'triangle', slide: -90 });
  },
  level() {
    tone(587, 0.06, { vol: 0.04 });
    tone(784, 0.1, { vol: 0.045, delay: 0.065 });
  },
};
