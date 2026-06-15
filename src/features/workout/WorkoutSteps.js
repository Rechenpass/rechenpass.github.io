import { html } from '../../html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { useCountdown, beep, vibrate } from './workoutRuntime.js';
import { formatClock } from './workoutEngine.js';

const PHASE_COLOR = { WarmUp: '#b45309', Training: '#2563eb', CoolDown: '#0f766e' };
const RING_RED = '#ef4444';

// Kreisförmiger Countdown-Ring um die Timer-Zahl: leert sich im Takt der Sekunden.
// Die Farbe gibt der Aufrufer vor – Phasenfarbe auf den hellen Zeit-Übungs-Screens, Weiß auf den
// blauen Pause-/Countdown-Screens; in den letzten 5 Sek. Rot. Die Zahl in der Mitte bleibt ruhig.
function TimerRing({ frac, label, color, track }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const off = C * (1 - Math.max(0, Math.min(1, frac || 0)));
  return html`<svg class="timer-ring" viewBox="0 0 120 120" width="168" height="168" aria-hidden="true">
    <circle cx="60" cy="60" r=${R} fill="none" stroke=${track} stroke-width="8" />
    <circle cx="60" cy="60" r=${R} fill="none" stroke=${color} stroke-width="8" stroke-linecap="round"
      stroke-dasharray=${C} stroke-dashoffset=${off} transform="rotate(-90 60 60)" class="timer-ring-arc" />
    <text x="60" y="61" text-anchor="middle" dominant-baseline="central" class="timer-ring-text">${label}</text>
  </svg>`;
}

function Stepper({ label, value, onChange, step = 1, min = 0, suffix = '' }) {
  const round = (n) => Number(n.toFixed(2));
  return html`<div class="stepper">
    <span class="stepper-label">${label}</span>
    <div class="stepper-row">
      <button type="button" class="step-btn" onClick=${() => onChange(round(Math.max(min, value - step)))}>−</button>
      <span class="stepper-value">${value}${suffix}</span>
      <button type="button" class="step-btn" onClick=${() => onChange(round(value + step))}>+</button>
    </div>
  </div>`;
}

// Satz-Übung: Zielwert anzeigen, tatsächliche Wdh./Gewicht erfassen, „Satz fertig“.
// Darunter Button-Gruppe „Extrasatz“ (nur bei Wdh.-Übungen) + „Überspringen“ im Pause-Look.
export function RepsWorkStep({ step, onNext, onSkip, onAddSet }) {
  const [reps, setReps] = useState(step.targetReps || 0);
  const [weight, setWeight] = useState(step.weight ?? 0);
  return html`<div class="work-body">
    <div class="work-target">
      <div class="big-number">${step.targetReps ?? '—'}</div>
      <div class="big-label">Wiederholungen${step.extra ? ' · Extra-Satz' : (step.setCount > 1 ? ` · Satz ${step.setIndex}/${step.setCount}` : '')}</div>
    </div>
    <div class="log-row">
      <${Stepper} label="Geschafft (Wdh.)" value=${reps} onChange=${setReps} step=${1} />
      ${step.weighted ? html`<${Stepper} label="Gewicht (kg)" value=${weight} onChange=${setWeight} step=${0.5} />` : null}
    </div>
    <button class="btn primary full big-btn" onClick=${() => onNext({ reps, weight: step.weighted ? weight : null })}>
      <${Icon} name="check" size=${20} /> Satz fertig
    </button>
    <div class="work-btn-row">
      ${onAddSet ? html`<button class="btn" onClick=${onAddSet}><${Icon} name="plus" size=${18} /> Extrasatz</button>` : null}
      <button class="btn" onClick=${onSkip}>Überspringen</button>
    </div>
  </div>`;
}

// Zeit-Übung: Countdown im Ring (Phasenfarbe, letzte 5 Sek. rot), am Ende automatisch weiter.
export function TimeWorkStep({ step, onNext, onSkip }) {
  const finish = () => { beep(); vibrate(200); onNext({ durationSec: step.targetDurationSec }); };
  const { remaining, running, pause, resume } = useCountdown(step.targetDurationSec || 0, finish);

  const halfFired = useRef(false);
  const [sideHint, setSideHint] = useState(false);
  const halfAt = Math.ceil((step.targetDurationSec || 0) / 2);

  useEffect(() => {
    if (!step.halfSignal || halfFired.current || remaining <= 0) return;
    if (remaining <= halfAt) {
      halfFired.current = true;
      beep(440, 90);
      setTimeout(() => beep(440, 90), 180);
      vibrate([80, 60, 80]);
      setSideHint(true);
      setTimeout(() => setSideHint(false), 3000);
    }
  }, [remaining]);

  // #31: Countdown-Ticks in den letzten 5 Sekunden.
  useEffect(() => {
    if (remaining > 0 && remaining <= 5) beep(600, 70);
  }, [remaining]);

  const ending = remaining <= 5;
  return html`<div class="work-body">
    <${TimerRing} frac=${remaining / (step.targetDurationSec || 1)} label=${formatClock(remaining)}
      color=${ending ? RING_RED : (PHASE_COLOR[step.phase] || '#2563eb')} track="#e5e7eb" />
    ${sideHint ? html`<div class="half-hint">↔ Seite / Richtung wechseln</div>` : null}
    ${step.extra ? html`<div class="big-label">Extra-Satz</div>` : (step.setCount > 1 ? html`<div class="big-label">Satz ${step.setIndex}/${step.setCount}</div>` : null)}
    <div class="work-btn-row">
      ${running
        ? html`<button class="btn" onClick=${pause}><${Icon} name="pause" size=${18} /> Pause</button>`
        : html`<button class="btn" onClick=${resume}><${Icon} name="play" size=${18} /> Weiter</button>`}
      <button class="btn" onClick=${onSkip}>Überspringen</button>
    </div>
  </div>`;
}

// Pause: Countdown im Ring (weiß auf Blau, letzte 5 Sek. rot), zeigt was als Nächstes kommt.
export function RestStep({ step, onNext }) {
  const done = () => { beep(660); vibrate(150); onNext(null); };
  const { remaining, running, pause, resume } = useCountdown(step.restSec || 0, done);
  useEffect(() => { if (remaining > 0 && remaining <= 5) beep(600, 70); }, [remaining]);
  const ending = remaining <= 5;
  return html`<div class="work-body">
    <div class="rest-title">Pause</div>
    <${TimerRing} frac=${remaining / (step.restSec || 1)} label=${formatClock(remaining)}
      color=${ending ? RING_RED : '#ffffff'} track="rgba(255,255,255,.28)" />
    <div class="rest-next">
      <span class="rest-next-label">${step.nextLabel}</span>
      <span class="rest-next-name">${step.nextName}</span>
    </div>
    <div class="work-btn-row rest-actions">
      ${running
        ? html`<button class="btn" onClick=${pause}><${Icon} name="pause" size=${18} /> Pause</button>`
        : html`<button class="btn" onClick=${resume}><${Icon} name="play" size=${18} /> Weiter</button>`}
      <button class="btn" onClick=${() => onNext(null)}>Überspringen</button>
    </div>
  </div>`;
}

// #29: 10-Sekunden-Countdown vor dem Start, bevor die erste (Warm-Up-)Übung läuft.
export function PrepCountdown({ planName, seconds = 10, onDone, onSkip, onQuit }) {
  const { remaining } = useCountdown(seconds, onDone);
  useEffect(() => { if (remaining > 0 && remaining <= 5) beep(600, 70); }, [remaining]);
  const ending = remaining <= 5;
  return html`<div class="screen workout timer-blue">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onQuit} aria-label="Abbrechen"><${Icon} name="x" /></button>
      <h2>${planName}</h2>
    </header>
    <div class="screen-body workout-body">
      <div class="work-body">
        <div class="rest-title">Gleich geht's los</div>
        <${TimerRing} frac=${remaining / (seconds || 1)} label=${remaining}
          color=${ending ? RING_RED : '#ffffff'} track="rgba(255,255,255,.28)" />
        <div class="big-label">Mach dich bereit …</div>
        <button class="btn" onClick=${onSkip}>Überspringen</button>
      </div>
    </div>
  </div>`;
}
