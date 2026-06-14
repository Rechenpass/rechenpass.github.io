import { html } from '../../html.js';
import { useStore } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { estimateMinutes } from '../plans/planUtils.js';

// Reine Auswahl-Seite für Krafttrainings. Das Workout wird über App (Vollbild) ausgelöst.
// Rad-Fahrten werden separat über das Dashboard erfasst – keine Kraft/Rad-Umschaltung mehr.
export function WorkoutPage({ onStartWorkout }) {
  const state = useStore();

  return html`<div class="screen">
    <header class="screen-header"><h2>Training</h2></header>
    <div class="screen-body">
      ${state.plans.length === 0
        ? html`<div class="empty">
            <div class="empty-emoji">▶️</div>
            <p>Noch keine Trainingspläne. Erstelle zuerst unter „Bibliothek → Pläne“ einen Plan, dann kannst du ihn hier starten.</p>
          </div>`
        : html`
          <p class="muted">Wähle ein Krafttraining aus:</p>
          <div class="card-list">
            ${state.plans.map((p) => html`
              <button class="card" key=${p.id} onClick=${() => onStartWorkout(p)}>
                <div class="start-row">
                  <div class="pi-main">
                    <div class="card-title">${p.name}</div>
                    <div class="plan-meta">${p.items.length} ${p.items.length === 1 ? 'Übung' : 'Übungen'} · ca. ${estimateMinutes(p.items)} min</div>
                  </div>
                  <span class="start-icon"><${Icon} name="play" size=${22} /></span>
                </div>
              </button>`)}
          </div>`}
    </div>
  </div>`;
}
