import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';

// Abschluss-Kontrolle: alle erfassten Werte prüfen/korrigieren, ERST dann speichern.
export function WorkoutReview({ entries, onConfirm, onCancel, editMode }) {
  const [rows, setRows] = useState(() => entries.map((e) => ({ ...e })));
  const update = (idx, patch) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  // nach Übung gruppieren, Reihenfolge bleibt erhalten
  const groups = [];
  const byEx = {};
  rows.forEach((row, idx) => {
    let g = byEx[row.exerciseId];
    if (!g) { g = { name: row.exerciseName, rows: [] }; byEx[row.exerciseId] = g; groups.push(g); }
    g.rows.push({ row, idx });
  });

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onCancel} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>${editMode ? 'Werte bearbeiten' : 'Training prüfen'}</h2>
    </header>
    <div class="screen-body">
      <p class="muted">${editMode ? 'Passe die erfassten Werte an und speichere.' : 'Stimmt alles? Du kannst die Werte noch anpassen. Wähle dann „Speichern & abschließen“.'}</p>

      ${groups.map((g) => html`
        <div class="stats-section review-card" key=${g.name}>
          <h3>${g.name}</h3>
          ${g.rows.map(({ row, idx }) => html`
            <div class="review-row" key=${idx}>
              <span class="review-set">${g.rows.length > 1 ? 'Satz ' + row.setIndex : 'Satz'}</span>
              ${row.type === 'time'
                ? html`<label class="review-field">
                    <input type="number" inputmode="numeric" min="0" value=${row.durationSec ?? ''}
                      onInput=${(e) => update(idx, { durationSec: num(e.target.value) })} />
                    <span>Sek.</span>
                  </label>`
                : html`
                  <label class="review-field">
                    <input type="number" inputmode="numeric" min="0" value=${row.reps ?? ''}
                      onInput=${(e) => update(idx, { reps: num(e.target.value) })} />
                    <span>Wdh.</span>
                  </label>
                  ${row.weight != null ? html`
                    <label class="review-field">
                      <input type="number" inputmode="decimal" min="0" step="0.5" value=${row.weight ?? ''}
                        onInput=${(e) => update(idx, { weight: num(e.target.value) })} />
                      <span>kg</span>
                    </label>` : null}`}
            </div>`)}
        </div>`)}

      <button class="btn primary full big-btn" onClick=${() => onConfirm(rows)}>
        <${Icon} name="check" size=${20} /> ${editMode ? 'Speichern' : 'Speichern & abschließen'}
      </button>
      <button class="btn full" onClick=${onCancel}>${editMode ? 'Abbrechen' : 'Training verwerfen'}</button>
    </div>
  </div>`;
}
