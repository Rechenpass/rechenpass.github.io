import { html } from '../../html.js';
import { useStore } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { Segmented } from '../../components/Segmented.js';
import { estimateMinutes } from '../plans/planUtils.js';
import { CyclingPanel } from '../cycling/CyclingPanel.js';

// Reine Auswahl-Seite. Workout/Fahrt werden über App (Vollbild) ausgelöst;
// `mode` wird von App gehalten, damit der Rad/Kraft-Zustand erhalten bleibt.
export function WorkoutPage({ mode, onMode, onStartWorkout, onEditRide }) {
  const state = useStore();

  return html`<div class="screen">
    <header class="screen-header"><h2>Training</h2></header>
    <div class="screen-body">
      <${Segmented}
        options=${[{ value: 'kraft', label: 'Kraft' }, { value: 'rad', label: 'Rad' }]}
        value=${mode} onChange=${onMode} />

      ${mode === 'kraft'
        ? (state.plans.length === 0
          ? html`<div class="empty">
              <div class="empty-emoji">▶️</div>
              <p>Noch keine Trainingspläne. Erstelle zuerst unter „Bibliothek → Pläne“ einen Plan, dann kannst du ihn hier starten.</p>
            </div>`
          : html`
            <p class="muted">Wähle einen Plan zum Starten:</p>
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
            </div>`)
        : html`<${CyclingPanel} onEdit=${onEditRide} />`}
    </div>
  </div>`;
}
