/**
 * ZTO Photobooth — synthesized sound effects (Web Audio, no asset files needed)
 */

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        ctx = new Ctor();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
}

/** Call from a user gesture to unlock audio on kiosks / iPads. */
export function unlockAudio() { ac(); }

/** Short countdown blip. */
export function beep(freq = 880, duration = 0.12, volume = 0.25) {
    const a = ac();
    if (!a) return;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g).connect(a.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
}

/** DSLR-style mechanical shutter: two filtered noise clicks (mirror up / curtain). */
export function shutter(volume = 0.6) {
    const a = ac();
    if (!a) return;
    const click = (at: number, len: number, freq: number, vol: number) => {
        const frames = Math.floor(a.sampleRate * len);
        const buf = a.createBuffer(1, frames, a.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 3);
        const src = a.createBufferSource();
        src.buffer = buf;
        const bp = a.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = freq;
        bp.Q.value = 0.9;
        const g = a.createGain();
        g.gain.value = vol;
        src.connect(bp).connect(g).connect(a.destination);
        src.start(a.currentTime + at);
    };
    click(0, 0.05, 2400, volume);
    click(0.075, 0.07, 1500, volume * 0.8);
}
