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

// Kurzer Signalton (Web Audio). Muss durch eine Nutzer-Geste „entsperrt“ werden.
let audioCtx;
export function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* kein Audio verfügbar – egal */ }
}

export function beep(freq = 880, ms = 160) {
  try {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume(); // iOS: Context kann zwischendurch einschlafen
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

export function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* egal */ }
}
