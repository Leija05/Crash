const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

function playTone(frequency, duration, type = "sawtooth") {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, c.currentTime);
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {}
}

export function playCriticalAlert() {
  playTone(880, 0.15, "square");
  setTimeout(() => playTone(660, 0.15, "square"), 200);
  setTimeout(() => playTone(880, 0.25, "square"), 400);
}

export function playAck() {
  playTone(1047, 0.08, "sine");
  setTimeout(() => playTone(1319, 0.12, "sine"), 100);
}

export function playWarning() {
  playTone(440, 0.1, "triangle");
  setTimeout(() => playTone(440, 0.1, "triangle"), 300);
}
