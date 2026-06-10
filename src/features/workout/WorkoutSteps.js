import { html } from '../../html.js';
import { useState } from 'preact/hooks';
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

// Satz-Übung: Zielwert anzeigen, tatsächliche Wdh./Gewicht erfassen, „Satz fertig“.
export function RepsWorkStep({ step, onNext }) {
  const [reps, setReps] = useState(step.targetReps || 0);
  const [weight, setWeight] = useState(step.weight ?? 0);
  return html`<div class="work-body">
    <div class="work-target">
      <div class="big-number">${step.targetReps ?? '—'}</div>
      <div class="big-label">Wiederholungen${step.setCount > 1 ? ` · Satz ${step.setIndex}/${step.setCount}` : ''}</div>
    </div>
    <div class="log-row">
      <${Stepper} label="Geschafft (Wdh.)" value=${reps} onChange=${setReps} step=${1} />
      ${step.weighted ? html`<${Stepper} label="Gewicht (kg)" value=${weight} onChange=${setWeight} step=${0.5} />` : null}
    </div>
    <button class="btn primary full big-btn" onClick=${() => onNext({ reps, weight: step.weighted ? weight : null })}>
      <${Icon} name="check" size=${20} /> Satz fertig
    </button>
  </div>`;
}

// Zeit-Übung: Countdown, am Ende automatisch weiter; früher „Fertig“ möglich.
export function TimeWorkStep({ step, onNext }) {
  const finish = () => { beep(); vibrate(200); onNext({ durationSec: step.targetDurationSec }); };
  const { remaining, running, pause, resume } = useCountdown(step.targetDurationSec || 0, finish);
  return html`<div class="work-body">
    <div class=${'timer' + (remaining <= 5 ? ' ending' : '')}>${formatClock(remaining)}</div>
    <div class="big-label">${step.setCount > 1 ? `Satz ${step.setIndex}/${step.setCount} · ` : ''}halten / ausführen</div>
    <div class="timer-controls">
      ${running
        ? html`<button class="btn" onClick=${pause}><${Icon} name="pause" size=${18} /> Pause</button>`
        : html`<button class="btn" onClick=${resume}><${Icon} name="play" size=${18} /> Weiter</button>`}
      <button class="btn primary" onClick=${() => onNext({ durationSec: (step.targetDurationSec || 0) - remaining })}>
        <${Icon} name="check" size=${18} /> Fertig
      </button>
    </div>
  </div>`;
}

// Pause: Countdown, zeigt was als Nächstes kommt, „Überspringen“ möglich.
export function RestStep({ step, onNext }) {
  const done = () => { beep(660); vibrate(150); onNext(null); };
  const { remaining, running, pause, resume } = useCountdown(step.restSec || 0, done);
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
