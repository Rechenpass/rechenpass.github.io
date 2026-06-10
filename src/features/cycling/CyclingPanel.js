import { html } from '../../html.js';
import { useStore } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { formatDate } from '../../dateUtils.js';

export function rideSummary(r) {
  const parts = [];
  if (r.distanceKm != null) parts.push(r.distanceKm + ' km');
  if (r.elevationM != null) parts.push(r.elevationM + ' hm');
  if (r.durationMin != null) parts.push(r.durationMin + ' min');
  if (r.type === 'indoor') {
    if (r.avgWatt != null) parts.push(r.avgWatt + ' W');
    if (r.kcal != null) parts.push(r.kcal + ' kcal');
  }
  return parts.join(' · ') || 'keine Werte';
}

// onEdit('new') zum Anlegen, onEdit(ride) zum Bearbeiten. Das Formular zeigt die
// Seite oben (WorkoutPage) als Vollbild – darum hier kein eigenes Formular.
export function CyclingPanel({ onEdit }) {
  const state = useStore();
  const rides = [...(state.rides || [])].sort((a, b) => b.date - a.date);

  return html`<div class="cycling-panel">
    <button class="btn primary full" onClick=${() => onEdit('new')}>
      <${Icon} name="plus" size=${18} /> Fahrt erfassen
    </button>
    ${rides.length === 0
      ? html`<div class="empty">
          <div class="empty-emoji">🚴</div>
          <p>Noch keine Fahrten erfasst. Trage deine erste Radausfahrt oder dein Indoor-Training ein.</p>
        </div>`
      : html`<div class="card-list">
          ${rides.map((r) => html`
            <button class="card ride-card" key=${r.id} onClick=${() => onEdit(r)}>
              <div class="card-main">
                <div class="card-title">${r.type === 'indoor' && r.name ? r.name : (r.type === 'indoor' ? 'Indoor-Training' : 'Radausfahrt')}</div>
                <div class="card-sub">${rideSummary(r)}</div>
              </div>
              <div class="card-side">
                <span class=${'badge ride-' + r.type}>${r.type === 'indoor' ? 'Indoor' : 'Outdoor'}</span>
                <span class="meta">${formatDate(r.date)}</span>
              </div>
            </button>`)}
        </div>`}
  </div>`;
}
