import { html } from '../../html.js';
import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';

// Abschluss-Kontrolle: alle erfassten Werte prüfen/korrigieren, ERST dann speichern.
// Darstellung als kleine Tabelle je Übung: Einheiten einmal als Spaltenüberschrift, jeder Satz
// eine ausgerichtete Zeile (Satz · Wdh. · kg). Feste Spaltenbreiten → Felder überall gleich breit.
export function WorkoutReview({ entries, onConfirm, onCancel, editMode }) {
  const [rows, setRows] = useState(() => entries.map((e) => ({ ...e })));
  const update = (idx, patch) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  // nach Übung gruppieren, Reihenfolge bleibt erhalten
  const groups = [];
  const byEx = {};
  rows.forEach((row, idx) => {
    let g = byEx[row.exerciseId];
    if (!g) { g = { name: row.exerciseName, type: row.type, rows: [] }; byEx[row.exerciseId] = g; groups.push(g); }
    g.rows.push({ row, idx });
  });

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onCancel} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>${editMode ? 'Werte bearbeiten' : 'Training prüfen'}</h2>
    </header>
    <div class="screen-body">
      <p class="muted">${editMode ? 'Passe die erfassten Werte an und speichere.' : 'Stimmt alles? Du kannst die Werte noch anpassen. Wähle dann „Speichern & abschließen“.'}</p>

      ${groups.map((g) => {
        const isTime = g.type === 'time';
        const hasWeight = !isTime && g.rows.some(({ row }) => row.weight != null);
        const cols = isTime || !hasWeight ? 1 : 2;
        return html`
        <div class="stats-section review-card" key=${g.name}>
          <h3>${g.name}</h3>
          <div class=${'review-grid cols-' + cols}>
            <span></span>
            ${isTime
              ? html`<span class="review-head">Sek.</span>`
              : html`<span class="review-head">Wdh.</span>${hasWeight ? html`<span class="review-head">kg</span>` : null}`}
            ${g.rows.map(({ row, idx }) => {
              const setLabel = g.rows.length > 1 ? 'Satz ' + row.setIndex : 'Satz';
              return html`<${Fragment} key=${idx}>
                <span class="review-set">${setLabel}</span>
                ${isTime
                  ? html`<input class="review-input" type="number" inputmode="numeric" min="0" aria-label=${setLabel + ', Sekunden'}
                      value=${row.durationSec ?? ''} onInput=${(e) => update(idx, { durationSec: num(e.target.value) })} />`
                  : html`
                    <input class="review-input" type="number" inputmode="numeric" min="0" aria-label=${setLabel + ', Wiederholungen'}
                      value=${row.reps ?? ''} onInput=${(e) => update(idx, { reps: num(e.target.value) })} />
                    ${hasWeight ? html`
                      <input class="review-input" type="number" inputmode="decimal" min="0" step="0.5" aria-label=${setLabel + ', Kilogramm'}
                        value=${row.weight ?? ''} onInput=${(e) => update(idx, { weight: num(e.target.value) })} />` : null}`}
              </${Fragment}>`;
            })}
          </div>
        </div>`;
      })}

      <button class="btn primary full big-btn" onClick=${() => onConfirm(rows)}>
        <${Icon} name="check" size=${20} /> ${editMode ? 'Speichern' : 'Speichern & abschließen'}
      </button>
      <button class="btn full" onClick=${onCancel}>${editMode ? 'Abbrechen' : 'Training verwerfen'}</button>
    </div>
  </div>`;
}
