// Sound, made only from the Web Audio oscillator: no audio files, no network.
// Every effect is a short blip or slide built from a fresh oscillator, so nothing
// is loaded and nothing is kept. A browser that refuses audio (or a silent run)
// simply hears nothing; the game never waits on sound.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      context = new AC();
    } catch {
      context = null;
    }
    return context;
  }

  /** A tone that slides from `from` to `to` Hz over `seconds`, at `gain` volume. */
  function tone(from, to, seconds, gain, type) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(from, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), ctx.currentTime + seconds);
      amp.gain.setValueAtTime(gain, ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + seconds);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  /** The turkey's gobble: two quick descending chirps. */
  function gobble() {
    tone(520, 300, 0.09, 0.12, 'square');
    setTimeout(() => tone(480, 260, 0.09, 0.1, 'square'), 90);
  }

  /** A coin-like chirp for a corn cob. */
  function corn() {
    tone(880, 1320, 0.12, 0.1, 'sine');
  }

  /** A low thud for a hit. */
  function hit() {
    tone(220, 60, 0.25, 0.2, 'sawtooth');
  }

  /** A rising alarm when the farmer spots the turkey. */
  function spotted() {
    tone(440, 880, 0.18, 0.12, 'triangle');
  }

  /** A short whoosh for a thrown knife. */
  function whoosh() {
    tone(900, 300, 0.16, 0.06, 'sawtooth');
  }

  /** A warm chord for escaping. */
  function escaped() {
    tone(523, 523, 0.22, 0.12, 'sine');
    setTimeout(() => tone(659, 659, 0.22, 0.12, 'sine'), 140);
    setTimeout(() => tone(784, 784, 0.34, 0.14, 'sine'), 280);
  }

  function setMuted(value) {
    muted = value;
  }

  return { gobble, corn, hit, spotted, whoosh, escaped, setMuted };
}
