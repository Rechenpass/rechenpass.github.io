import { html } from '../../html.js';
import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { phaseLabel } from '../../constants.js';
import { saveSession } from '../../store.js';
import { buildSteps, totalSets, formatClock } from './workoutEngine.js';
import { RepsWorkStep, TimeWorkStep, RestStep } from './WorkoutSteps.js';
import { WorkoutSummary } from './WorkoutSummary.js';
import { WorkoutReview } from './WorkoutReview.js';

function phaseClass(phase) {
  return phase === 'WarmUp' ? 'warmup' : phase === 'CoolDown' ? 'cooldown' : 'training';
}

export function WorkoutPlayer({ plan, onExit }) {
  const steps = useMemo(() => buildSteps(plan), [plan]);
  const [i, setI] = useState(0);
  const [entries, setEntries] = useState([]);
  const [finished, setFinished] = useState(null);
  const startRef = useRef(Date.now());
  const advanceLock = useRef(-1);
  const [reviewEntries, setReviewEntries] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [descOpen, setDescOpen] = useState(false); // Beschreibung wird nur auf Tipp als Sheet gezeigt
  // Gesamtzeit läuft sekündlich mit (Wanduhr ab Start – passt zur gespeicherten durationSec).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const confirmSave = (editedEntries) => {
    const session = {
      planId: plan.id, planName: plan.name, date: startRef.current,
      durationSec: Math.round((Date.now() - startRef.current) / 1000), entries: editedEntries,
    };
    saveSession(session);
    setReviewEntries(null);
    setFinished(session);
  };
  const cancelReview = () => {
    if (confirm('Training verwerfen? Es wird nicht gespeichert.')) onExit();
  };

  if (steps.length === 0) {
    return html`<div class="screen">
      <header class="screen-header"><h2>Training</h2></header>
      <div class="screen-body"><div class="empty">
        <p>Dieser Plan enthält keine ausführbaren Übungen.</p>
        <button class="btn primary" onClick=${onExit}>Zurück</button>
      </div></div>
    </div>`;
  }

  if (finished) {
    return html`<${WorkoutSummary} session=${finished} onClose=${onExit} />`;
  }

  if (reviewEntries) {
    return html`<${WorkoutReview} entries=${reviewEntries} onConfirm=${confirmSave} onCancel=${cancelReview} />`;
  }

  const step = steps[i];
  const setsTotal = totalSets(steps);
  const setsDone = entries.length;
  const progress = setsTotal ? Math.round((setsDone / setsTotal) * 100) : 0;
  const elapsed = Math.floor((now - startRef.current) / 1000);

  const handleNext = (partial) => {
    if (advanceLock.current === i) return; // Doppel-Auslösung (Timer + Tippen) verhindern
    advanceLock.current = i;
    setDescOpen(false); // Beschreibungs-Sheet beim Weiterschalten schließen

    let nextEntries = entries;
    if (partial) {
      const s = steps[i];
      nextEntries = [...entries, {
        exerciseId: s.exerciseId, exerciseName: s.exerciseName, group: s.group, phase: s.phase, type: s.type,
        primaryMuscles: s.primaryMuscles, secondaryMuscles: s.secondaryMuscles, bodyRegions: s.bodyRegions,
        setIndex: s.setIndex, reps: partial.reps ?? null, weight: partial.weight ?? null, durationSec: partial.durationSec ?? null,
      }];
      setEntries(nextEntries);
    }

    if (i + 1 >= steps.length) {
      setReviewEntries(nextEntries); // erst prüfen, dann speichern
    } else {
      setI(i + 1);
    }
  };

  const quit = () => {
    if (confirm('Workout abbrechen? Der Fortschritt wird nicht gespeichert.')) onExit();
  };

  return html`<div class="screen workout">
    <header class="screen-header">
      <button class="iconbtn" onClick=${quit} aria-label="Abbrechen"><${Icon} name="x" /></button>
      <h2>${plan.name}</h2>
      <div class="work-meta">
        <span class="work-time"><${Icon} name="clock" size=${14} /> ${formatClock(elapsed)}</span>
        <span class="work-count">${setsDone}/${setsTotal} Sätze</span>
      </div>
    </header>
    <div class="progress-bar"><div class="progress-fill" style=${`width:${progress}%`}></div></div>

    <div class="screen-body workout-body">
      <div class="work-head">
        <span class=${'phase-pill ' + phaseClass(step.phase)}>${phaseLabel(step.phase)}</span>
        ${step.kind === 'work' ? html`<span class="work-exno">Übung ${step.exerciseNo}/${step.exerciseTotal}</span>` : null}
      </div>

      ${step.kind === 'work' ? html`
        <div class="work-name-row">
          <h2 class="work-name">${step.exerciseName}</h2>
          ${step.description
            ? html`<button class="iconbtn small desc-info-btn" onClick=${() => setDescOpen(true)} aria-label="Beschreibung anzeigen">
                <${Icon} name="info" size=${20} />
              </button>`
            : null}
        </div>
        ${step.type === 'time'
          ? html`<${TimeWorkStep} key=${i} step=${step} onNext=${handleNext} />`
          : html`<${RepsWorkStep} key=${i} step=${step} onNext=${handleNext} />`}
      ` : html`
        <${RestStep} key=${i} step=${step} onNext=${handleNext} />
      `}
    </div>

    ${descOpen && step.kind === 'work' && step.description
      ? html`<div class="modal-overlay" onClick=${() => setDescOpen(false)}>
          <div class="modal-sheet" onClick=${(ev) => ev.stopPropagation()}>
            <div class="sheet-head">
              <div class="desc-sheet-title">${step.exerciseName}</div>
              <button class="iconbtn small" onClick=${() => setDescOpen(false)} aria-label="Schließen"><${Icon} name="x" size=${18} /></button>
            </div>
            <p class="desc-text">${step.description}</p>
          </div>
        </div>`
      : null}
  </div>`;
}
