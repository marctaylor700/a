/**
 * Eyeshine — WebAudio synth bed (no sample files).
 */
import { GAME_ID } from './config.js';

export function createAudio() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ctx = null;
  let master = null;
  let muted = false;
  let droneGain = null;
  let droneNodes = [];

  function ac() {
    if (muted) return null;
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
      master = ctx.createGain();
      master.gain.value = 0.72;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function brown(c) {
    const n = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.02) * 0.986;
      d[i] = last * 3.4;
    }
    return buf;
  }

  function noiseBurst(c, dur, freq, vol, type) {
    const t0 = c.currentTime;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.6;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  function tone(freq, dur, type, vol, slide) {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  function stopDrone() {
    if (!droneGain) return;
    try {
      droneGain.gain.exponentialRampToValueAtTime(0.001, (ctx?.currentTime || 0) + 0.2);
    } catch { /* ignore */ }
    const nodes = droneNodes;
    droneNodes = [];
    const g = droneGain;
    droneGain = null;
    setTimeout(() => {
      for (const n of nodes) {
        try { n.stop(); } catch { /* already stopped */ }
        try { n.disconnect(); } catch { /* ignore */ }
      }
      try { g.disconnect(); } catch { /* ignore */ }
    }, 260);
  }

  return {
    resume() { ac(); },

    setMuted(b) {
      muted = !!b;
      if (muted) stopDrone();
    },

    footstep() {
      const c = ac();
      if (!c) return;
      noiseBurst(c, 0.045, 170, 0.045, 'bandpass');
      tone(88, 0.04, 'sine', 0.03, 60);
    },

    greet() {
      tone(784, 0.09, 'sine', 0.055, 988);
      setTimeout(() => tone(1174, 0.12, 'triangle', 0.04), 70);
    },

    fruit() {
      tone(720, 0.07, 'sine', 0.05, 1180);
    },

    growl() {
      const c = ac();
      if (!c) return;
      tone(72, 0.42, 'sawtooth', 0.045, 46);
      noiseBurst(c, 0.38, 90, 0.06, 'lowpass');
    },

    win() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.05), i * 110));
    },

    lose() {
      tone(196, 0.45, 'sawtooth', 0.05, 52);
    },

    drone(on) {
      if (!on) {
        stopDrone();
        return;
      }
      const c = ac();
      if (!c || droneGain) return;
      droneGain = c.createGain();
      droneGain.gain.value = reduce ? 0.01 : 0.038;
      droneGain.connect(master);

      const o1 = c.createOscillator();
      o1.type = 'sine';
      o1.frequency.value = 46;
      o1.connect(droneGain);

      const o2 = c.createOscillator();
      o2.type = 'triangle';
      o2.frequency.value = 69.3;
      const o2g = c.createGain();
      o2g.gain.value = 0.28;
      o2.connect(o2g);
      o2g.connect(droneGain);

      const noise = c.createBufferSource();
      noise.buffer = brown(c);
      noise.loop = true;
      const nf = c.createBiquadFilter();
      nf.type = 'lowpass';
      nf.frequency.value = 260;
      const ng = c.createGain();
      ng.gain.value = 0.14;
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(droneGain);

      o1.start();
      o2.start();
      noise.start();
      droneNodes = [o1, o2, noise];
    },

    get id() { return GAME_ID; },
  };
}
