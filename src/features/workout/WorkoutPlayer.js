import { html } from '../../html.js';
import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { phaseLabel } from '../../constants.js';
import { saveSession } from '../../store.js';
import { buildSteps, totalSets, formatClock } from './workoutEngine.js';
import { RepsWorkStep, TimeWorkStep, RestStep, PrepCountdown } from './WorkoutSteps.js';
import { WorkoutSummary } from './WorkoutSummary.js';
import { WorkoutReview } from './WorkoutReview.js';
import { beep } from './workoutRuntime.js';
import { confirmAsk } from '../../components/confirmHost.js';

function phaseClass(phase) {
  return phase === 'WarmUp' ? 'warmup' : phase === 'CoolDown' ? 'cooldown' : 'training';
}

export function WorkoutPlayer({ plan, date, onExit }) {
  const [steps, setSteps] = useState(() => buildSteps(plan));
  const [i, setI] = useState(0);
  const [entries, setEntries] = useState([]);
  const [finished, setFinished] = useState(null);
  const startRef = useRef(Date.now());
  const advanceLock = useRef(-1);
  const [reviewEntries, setReviewEntries] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [descOpen, setDescOpen] = useState(false); // Beschreibung wird nur auf Tipp als Sheet gezeigt
  const [prep, setPrep] = useState(true); // #29: 10-Sek-Countdown vor dem Start
  const [toast, setToast] = useState(null); // kurzes Feedback (z. B. Extra-Satz)
  // Gesamtzeit läuft sekündlich mit (Wanduhr ab Start – passt zur gespeicherten durationSec).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // #34: Bildschirm während des Trainings wach halten (Wake Lock; bei iOS ab 16.4).
  useEffect(() => {
    let lock = null;
    let released = false;
    const acquire = async () => {
      try { if (navigator.wakeLock) lock = await navigator.wakeLock.request('screen'); } catch (e) { /* egal */ }
    };
    const onVis = () => { if (document.visibilityState === 'visible' && !released) acquire(); };
    acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVis);
      try { lock && lock.release(); } catch (e) { /* egal */ }
    };
  }, []);

  // #31: höherer Signalton zu Beginn jeder Übung/Pause (nicht während des Vor-Countdowns).
  useEffect(() => {
    if (!prep) beep(1046, 110);
  }, [i, prep]);

  const confirmSave = (editedEntries) => {
    const session = {
      planId: plan.id, planName: plan.name, date: date != null ? date : startRef.current,
      durationSec: Math.round((Date.now() - startRef.current) / 1000), entries: editedEntries,
    };
    saveSession(session);
    setReviewEntries(null);
    setFinished(session);
  };
  const cancelReview = () => confirmAsk({
    title: 'Training verwerfen?', message: 'Es wird nicht gespeichert.', confirmLabel: 'Verwerfen', onConfirm: onExit,
  });

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

  if (prep) {
    return html`<${PrepCountdown} planName=${plan.name}
      onDone=${() => setPrep(false)} onSkip=${() => setPrep(false)}
      onQuit=${() => confirmAsk({ title: 'Workout abbrechen?', message: 'Der Fortschritt wird nicht gespeichert.', confirmLabel: 'Verwerfen', onConfirm: onExit })} />`;
  }

  const step = steps[i];
  // #33: Fortschritt je Phase (Warm-Up/Training/Cool-Down) für den unterteilten Balken.
  const workSteps = steps.filter((s) => s.kind === 'work');
  const phaseSegs = ['WarmUp', 'Training', 'CoolDown']
    .map((ph) => ({ phase: ph, total: workSteps.filter((s) => s.phase === ph).length, done: entries.filter((e) => e.phase === ph).length }))
    .filter((p) => p.total > 0);
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

  // #36: spontan einen weiteren Satz der aktuellen Übung direkt dahinter einschieben.
  const addSet = () => {
    const cur = steps[i];
    if (!cur || cur.kind !== 'work') return;
    const newStep = { ...cur, setIndex: (cur.setCount || 1) + 1, extra: true };
    setSteps((prev) => { const ns = [...prev]; ns.splice(i + 1, 0, newStep); return ns; });
    setToast('Extra-Satz hinzugefügt');
    setTimeout(() => setToast(null), 1600);
  };

  const quit = () => confirmAsk({
    title: 'Workout abbrechen?', message: 'Der Fortschritt wird nicht gespeichert.', confirmLabel: 'Verwerfen', onConfirm: onExit,
  });

  return html`<div class="screen workout">
    <header class="screen-header">
      <button class="iconbtn" onClick=${quit} aria-label="Abbrechen"><${Icon} name="x" /></button>
      <h2>${plan.name}</h2>
      <div class="work-meta">
        <span class="work-time"><${Icon} name="clock" size=${14} /> ${formatClock(elapsed)}</span>
      </div>
    </header>
    <div class="progress-bar">
      ${phaseSegs.map((p) => html`<div class=${'pb-seg ' + phaseClass(p.phase)} style=${`flex:${p.total}`} key=${p.phase}>
        <div class="pb-seg-fill" style=${`width:${Math.round((p.done / p.total) * 100)}%`}></div>
      </div>`)}
    </div>

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
          ? html`<${TimeWorkStep} key=${i} step=${step} onNext=${handleNext} onSkip=${() => handleNext(null)} />`
          : html`<${RepsWorkStep} key=${i} step=${step} onNext=${handleNext} onSkip=${() => handleNext(null)} onAddSet=${addSet} />`}
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
    ${toast ? html`<div class="added-toast">${toast}</div>` : null}
  </div>`;
}
