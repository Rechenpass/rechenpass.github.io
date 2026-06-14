import { html } from '../../html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { useCountdown, beep, vibrate } from './workoutRuntime.js';
import { formatClock } from './workoutEngine.js';

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

// #36: Sekundär-Aktionen unter dem Haupt-Button: Satz überspringen / Extra-Satz einschieben.
// Extra-Satz nur bei Satz/Wdh.-Übungen (onAddSet gesetzt); bei Zeit-Übungen steht „Überspringen" allein mittig.
function ExtraActions({ onSkip, onAddSet }) {
  return html`<div class="work-extra-actions">
    <button onClick=${onSkip}>Überspringen</button>
    ${onAddSet ? html`<button onClick=${onAddSet}>+ Extra-Satz</button>` : null}
  </div>`;
}

// Satz-Übung: Zielwert anzeigen, tatsächliche Wdh./Gewicht erfassen, „Satz fertig“.
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
    <${ExtraActions} onSkip=${onSkip} onAddSet=${onAddSet} />
  </div>`;
}

// Zeit-Übung: Countdown, am Ende automatisch weiter; früher „Fertig” möglich.
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

  // #31: Countdown-Ticks in den letzten 3 Sekunden.
  useEffect(() => {
    if (remaining > 0 && remaining <= 5) beep(600, 70);
  }, [remaining]);

  return html`<div class="work-body">
    <div class=${'timer' + (remaining <= 5 ? ' ending' : '')}>${formatClock(remaining)}</div>
    ${sideHint ? html`<div class="half-hint">↔ Seite / Richtung wechseln</div>` : null}
    ${step.extra ? html`<div class="big-label">Extra-Satz</div>` : (step.setCount > 1 ? html`<div class="big-label">Satz ${step.setIndex}/${step.setCount}</div>` : null)}
    <div class="timer-controls">
      ${running
        ? html`<button class="btn" onClick=${pause}><${Icon} name="pause" size=${18} /> Pause</button>`
        : html`<button class="btn" onClick=${resume}><${Icon} name="play" size=${18} /> Weiter</button>`}
      <button class="btn primary" onClick=${() => onNext({ durationSec: (step.targetDurationSec || 0) - remaining })}>
        <${Icon} name="check" size=${18} /> Fertig
      </button>
    </div>
    <${ExtraActions} onSkip=${onSkip} />
  </div>`;
}

// Pause: Countdown, zeigt was als Nächstes kommt, „Überspringen“ möglich.
export function RestStep({ step, onNext }) {
  const done = () => { beep(660); vibrate(150); onNext(null); };
  const { remaining, running, pause, resume } = useCountdown(step.restSec || 0, done);
  useEffect(() => { if (remaining > 0 && remaining <= 5) beep(600, 70); }, [remaining]);
  return html`<div class="work-body">
    <div class="rest-title">Pause</div>
    <div class=${'timer' + (remaining <= 5 ? ' ending' : '')}>${formatClock(remaining)}</div>
    <div class="rest-next">${step.nextLabel}: <b>${step.nextName}</b></div>
    <div class="timer-controls">
      ${running
        ? html`<button class="btn" onClick=${pause}><${Icon} name="pause" size=${18} /> Pause</button>`
        : html`<button class="btn" onClick=${resume}><${Icon} name="play" size=${18} /> Weiter</button>`}
      <button class="btn primary" onClick=${() => onNext(null)}>Überspringen</button>
    </div>
  </div>`;
}

// #29: 10-Sekunden-Countdown vor dem Start, bevor die erste (Warm-Up-)Übung läuft.
export function PrepCountdown({ planName, onDone, onSkip, onQuit }) {
  const { remaining } = useCountdown(10, onDone);
  useEffect(() => { if (remaining > 0 && remaining <= 5) beep(600, 70); }, [remaining]);
  return html`<div class="screen workout">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onQuit} aria-label="Abbrechen"><${Icon} name="x" /></button>
      <h2>${planName}</h2>
    </header>
    <div class="screen-body workout-body">
      <div class="work-body">
        <div class="rest-title">Gleich geht's los</div>
        <div class="timer">${remaining}</div>
        <div class="big-label">Mach dich bereit …</div>
        <button class="btn" onClick=${onSkip}>Überspringen</button>
      </div>
    </div>
  </div>`;
}
