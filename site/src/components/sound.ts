"use client";

// Short tones made in the browser: no audio files to download or license.
// Only ever played after a tap, which is when browsers allow sound.

export type Sound = "right" | "wrong" | "reveal";

// Each sound is a few notes: [frequency in Hz, start in s, length in s].
const NOTES: Record<Sound, [number, number, number][]> = {
  right: [[523, 0, 0.12], [784, 0.1, 0.22]],
  wrong: [[196, 0, 0.18]],
  reveal: [[440, 0, 0.06]],
};

let ctx: AudioContext | null = null;

export function playSound(kind: Sound, enabled: boolean) {
  if (!enabled || typeof window === "undefined" || !("AudioContext" in window)) return;
  ctx ??= new AudioContext();
  const now = ctx.currentTime;
  for (const [freq, start, length] of NOTES[kind]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.15, now + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + length + 0.02);
  }
}
