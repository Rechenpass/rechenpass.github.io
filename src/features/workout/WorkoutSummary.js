import { html } from '../../html.js';
import { formatClock } from './workoutEngine.js';

export function WorkoutSummary({ session, onClose }) {
  const sets = session.entries.length;
  const exercises = new Set(session.entries.map((e) => e.exerciseId)).size;
  return html`<div class="screen">
    <header class="screen-header"><h2>Geschafft 💪</h2></header>
    <div class="screen-body">
      <div class="summary-hero">
        <div class="summary-emoji">🎉</div>
        <div class="summary-plan">${session.planName}</div>
      </div>
      <div class="summary-stats">
        <div class="stat"><div class="stat-num">${formatClock(session.durationSec)}</div><div class="stat-label">Dauer (min)</div></div>
        <div class="stat"><div class="stat-num">${exercises}</div><div class="stat-label">Übungen</div></div>
        <div class="stat"><div class="stat-num">${sets}</div><div class="stat-label">Sätze</div></div>
      </div>
      <p class="hint" style="text-align:center">Dein Training wurde gespeichert und fließt später in die Statistik ein.</p>
      <button class="btn primary full" onClick=${onClose}>Fertig</button>
    </div>
  </div>`;
}
