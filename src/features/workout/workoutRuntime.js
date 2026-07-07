import { useState, useEffect, useRef } from 'preact/hooks';

// Countdown-Hook: zählt von `seconds` herunter, ruft am Ende `onDone` genau einmal auf.
// Robust gegen Hintergrund-Drosselung (rechnet gegen einen festen Endzeitpunkt).
export function useCountdown(seconds, onDone) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const remRef = useRef(seconds);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Neuer Schritt → zurücksetzen
  useEffect(() => {
    remRef.current = seconds;
    setRemaining(seconds);
    setRunning(true);
    doneRef.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!running) return undefined;
    const end = Date.now() + remRef.current * 1000;
    const id = setInterval(() => {
      const leftMs = end - Date.now();
      const left = leftMs <= 0 ? 0 : Math.ceil(leftMs / 1000);
      remRef.current = left;
      setRemaining(left);
      if (leftMs <= 0) {
        clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          if (onDoneRef.current) onDoneRef.current();
        }
      }
    }, 200);
    return () => clearInterval(id);
  }, [running, seconds]);

  return {
    remaining,
    running,
    pause: () => setRunning(false),
    resume: () => setRunning(true),
  };
}

// ---- Signaltöne (Web Audio) ----
// iOS-Härtung gegen Aussetzer: Spielt eine andere App/Benachrichtigung (z. B. WhatsApp)
// einen Ton, unterbricht iOS die Audio-Sitzung (Zustand 'suspended' ODER 'interrupted')
// und unsere Timer-Töne (Pause-Ticks, Halbzeit) fallen still aus. Gegenmaßnahmen:
//  1) Ein leiser Dauer-Ton hält die Sitzung über das ganze Training wach.
//  2) Bei jeder Zustandsänderung / Rückkehr in den Vordergrund wird sie wieder aufgeweckt.
//  3) beep() spielt den Ton erst, wenn die Sitzung wirklich wach ist (resume() wirkt verzögert).
//  4) Ein Watchdog-Intervall weckt die Sitzung auch dann wieder auf, wenn iOS bei einer
//     Benachrichtigung IM VORDERGRUND unterbricht – da feuert am Ende kein Event.
let audioCtx;
let keepAlive;            // leiser Dauer-Ton (BufferSource), hält die iOS-Audio-Sitzung wach
let watchdog;            // Intervall, das die Sitzung regelmäßig wieder aufweckt
let listenersAttached = false;
let soundOn = true;        // Signaltöne an/aus (aus den Einstellungen, beim Trainingsstart gesetzt)

// Töne global an-/abschalten.
export function setSoundEnabled(on) { soundOn = !!on; }

// Leisen Dauer-Ton starten – immer frisch, denn nach einer Unterbrechung ist der alte „tot".
function startKeepAlive() {
  if (!audioCtx) return;
  try { if (keepAlive) keepAlive.stop(); } catch (e) { /* egal */ }
  keepAlive = null;
  try {
    const buf = audioCtx.createBuffer(1, 1, audioCtx.sampleRate); // 1 Sample Stille
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(audioCtx.destination);
    src.start(0);
    keepAlive = src;
  } catch (e) { /* egal */ }
}

// Sitzung aufwecken: läuft sie, nichts tun; sonst resume() und den Dauer-Ton neu starten.
function wake() {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'running') {
      if (!keepAlive) startKeepAlive();
      return;
    }
    const p = audioCtx.resume();
    if (p && p.then) p.then(startKeepAlive).catch(() => {});
    else startKeepAlive();
  } catch (e) { /* egal */ }
}

function onVisible() { if (document.visibilityState === 'visible') wake(); }
function onStateChange() { wake(); }

// Durch eine Nutzer-Geste aufrufen (Trainingsstart): entsperrt Audio + Wachhalter + Watchdog.
export function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (!listenersAttached) {
      document.addEventListener('visibilitychange', onVisible);
      if (audioCtx.addEventListener) audioCtx.addEventListener('statechange', onStateChange);
      listenersAttached = true;
    }
    wake();
    if (!watchdog) watchdog = setInterval(wake, 800);
  } catch (e) { /* kein Audio verfügbar – egal */ }
}

// Beim Verlassen des Trainings aufrufen: Watchdog + Dauer-Ton stoppen, Listener lösen (Akku schonen).
export function releaseAudio() {
  if (watchdog) { clearInterval(watchdog); watchdog = null; }
  try { if (keepAlive) keepAlive.stop(); } catch (e) { /* egal */ }
  keepAlive = null;
  try {
    document.removeEventListener('visibilitychange', onVisible);
    if (audioCtx && audioCtx.removeEventListener) audioCtx.removeEventListener('statechange', onStateChange);
  } catch (e) { /* egal */ }
  listenersAttached = false;
}

function playTone(freq, ms) {
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.start(t);
    o.stop(t + ms / 1000);
  } catch (e) { /* egal */ }
}

export function beep(freq = 880, ms = 160) {
  if (!audioCtx || !soundOn) return;
  if (audioCtx.state === 'running') { playTone(freq, ms); return; }
  // Sitzung schläft (z. B. nach einer Benachrichtigung) → aufwecken, dann spielen.
  try {
    const p = audioCtx.resume();
    if (p && p.then) p.then(() => playTone(freq, ms)).catch(() => {});
    else playTone(freq, ms);
    startKeepAlive();
  } catch (e) { /* egal */ }
}

export function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* egal */ }
}
