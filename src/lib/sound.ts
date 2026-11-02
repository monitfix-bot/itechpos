"use client";

// Web Audio API synthesizer for tactile POS sound effects (no external CDN or heavy library)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playPosSound(type: "beep" | "tab" | "success" | "warn") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === "beep") {
      // Crisp 880Hz (A5) barcode scanner beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === "tab") {
      // Soft 659Hz (E5) gentle tactile click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "success") {
      // Upbeat 4-note victory chord (C5 - E5 - G5 - C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.08;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.07, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.22);
      });
    } else if (type === "warn") {
      // Double low buzz
      [220, 196].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.1;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.08, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.12);
      });
    }
  } catch (e) {
    // Graceful fallback if user hasn't interacted with page yet
  }
}
