import { getExercise } from '../../store.js';

const PHASE_ORDER = { WarmUp: 0, Training: 1, CoolDown: 2 };

// Wandelt einen Plan in eine flache Schritt-Liste um (Arbeits- und Pausen-Schritte),
// sortiert nach Phase (Warm-Up → Training → Cool-Down), gelöschte Übungen werden übersprungen.
export function buildSteps(plan) {
  const ordered = plan.items
    .map((it, idx) => ({ it, idx, ex: getExercise(it.exerciseId) }))
    .filter((x) => x.ex)
    .sort((a, b) => (PHASE_ORDER[a.ex.phase] - PHASE_ORDER[b.ex.phase]) || (a.idx - b.idx));

  const total = ordered.length;
  const steps = [];

  ordered.forEach(({ it, ex }, exIndex) => {
    const sets = it.sets || 1;
    const weighted = ex.group === 'Kurzhantel' || it.weight != null;
    const meta = {
      itemId: it.id, exerciseId: ex.id, exerciseName: ex.name, description: ex.description || '',
      phase: ex.phase, type: ex.type, group: ex.group,
      primaryMuscles: ex.primaryMuscles || [], secondaryMuscles: ex.secondaryMuscles || [], bodyRegions: ex.bodyRegions || [],
      setCount: sets, weighted, weight: it.weight ?? null,
      exerciseNo: exIndex + 1, exerciseTotal: total,
    };
    for (let s = 1; s <= sets; s++) {
      steps.push({ kind: 'work', ...meta, setIndex: s, targetReps: it.reps ?? null, targetDurationSec: it.durationSec ?? null });
      if (s < sets && (it.restBetweenSetsSec || 0) > 0) {
        steps.push({ kind: 'rest', restKind: 'set', restSec: it.restBetweenSetsSec, phase: ex.phase, nextName: ex.name, nextLabel: `Satz ${s + 1} von ${sets}` });
      }
    }
    if (exIndex < total - 1 && (it.restAfterExerciseSec || 0) > 0) {
      const nextEx = ordered[exIndex + 1].ex;
      steps.push({ kind: 'rest', restKind: 'exercise', restSec: it.restAfterExerciseSec, phase: ex.phase, nextName: nextEx.name, nextLabel: 'Nächste Übung' });
    }
  });

  return steps;
}

export function totalSets(steps) {
  return steps.filter((s) => s.kind === 'work').length;
}

export function formatClock(totalSec) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
