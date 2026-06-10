import { PHASES } from '../../constants.js';
import { getExercise } from '../../store.js';

// Plan-Einträge nach Phase gruppieren, Reihenfolge innerhalb der Phase bleibt erhalten.
export function groupItemsByPhase(items) {
  const withEx = items.map((it) => ({ item: it, exercise: getExercise(it.exerciseId) }));
  return PHASES
    .map((p) => ({
      phase: p,
      entries: withEx.filter((x) => (x.exercise ? x.exercise.phase : 'Training') === p.key),
    }))
    .filter((g) => g.entries.length > 0);
}

export function phaseCounts(items) {
  const counts = { WarmUp: 0, Training: 0, CoolDown: 0 };
  for (const it of items) {
    const ex = getExercise(it.exerciseId);
    const ph = ex ? ex.phase : 'Training';
    counts[ph] = (counts[ph] || 0) + 1;
  }
  return counts;
}

// Grobe Zeitschätzung in Minuten (ca. 3 s pro Wiederholung).
export function estimateMinutes(items) {
  let sec = 0;
  for (const it of items) {
    const ex = getExercise(it.exerciseId);
    const sets = it.sets || 1;
    const work = ex && ex.type === 'time'
      ? (it.durationSec || 0) * sets
      : (it.reps || 0) * 3 * sets;
    const betweenSets = Math.max(0, sets - 1) * (it.restBetweenSetsSec || 0);
    sec += work + betweenSets + (it.restAfterExerciseSec || 0);
  }
  return Math.max(1, Math.round(sec / 60));
}
