import { html } from '../../html.js';

export function ExerciseCard({ exercise, onClick }) {
  const e = exercise;
  const meta = e.type === 'reps'
    ? `${e.defaultSets ?? '–'} × ${e.defaultReps ?? '–'}`
    : `${e.defaultDurationSec ?? '–'} s`;
  const groupClass = 'badge group-' + (e.group || '').toLowerCase();
  return html`<button class="card exercise-card" onClick=${onClick}>
    <div class="card-main">
      <div class="card-title">${e.name}</div>
      <div class="card-sub">${e.primaryMuscles && e.primaryMuscles.length ? e.primaryMuscles.join(', ') : '—'}</div>
    </div>
    <div class="card-side">
      <span class=${groupClass}>${e.group}</span>
      <span class="meta">${meta}</span>
    </div>
  </button>`;
}
