import { html } from '../../html.js';
import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { ExercisePicker } from '../plans/ExercisePicker.js';

// Abschluss-Kontrolle: alle erfassten Werte prüfen/korrigieren, ERST dann speichern.
// Darstellung als kleine Tabelle je Übung: Einheiten einmal als Spaltenüberschrift, jeder Satz
// eine ausgerichtete Zeile (Satz · Wdh. · kg). Feste Spaltenbreiten → Felder überall gleich breit.
// Zusätzlich lassen sich hier noch nachträglich Übungen (die nicht im Plan standen) und Sätze ergänzen.
export function WorkoutReview({ entries, onConfirm, onCancel, editMode }) {
  const [rows, setRows] = useState(() => entries.map((e) => ({ ...e })));
  const [picking, setPicking] = useState(false);
  const update = (idx, patch) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  // Aus einer Übung eine Erfassungs-Zeile bauen (mit den Standardwerten der Übung).
  const makeRow = (ex, setIndex) => ({
    exerciseId: ex.id, exerciseName: ex.name, group: ex.group, phase: ex.phase, type: ex.type,
    primaryMuscles: ex.primaryMuscles || [], secondaryMuscles: ex.secondaryMuscles || [], bodyRegions: ex.bodyRegions || [],
    setIndex,
    reps: ex.type === 'time' ? null : (ex.defaultReps ?? null),
    weight: ex.group === 'Kurzhantel' ? 0 : null,
    durationSec: ex.type === 'time' ? (ex.defaultDurationSec ?? null) : null,
    added: true,
  });

  // Zusätzliche Übung übernehmen: mit ihrer Standard-Satzzahl (mind. 1) als neue Gruppe anhängen.
  const addExercise = (ex) => {
    const n = Math.max(1, ex.type === 'time' ? 1 : (ex.defaultSets || 1));
    setRows((rs) => [...rs, ...Array.from({ length: n }, (_, i) => makeRow(ex, i + 1))]);
    setPicking(false);
  };

  // Einen weiteren Satz an eine Übung anhängen (direkt hinter deren letztem Satz).
  const addSet = (exerciseId) => setRows((rs) => {
    const grp = rs.filter((r) => r.exerciseId === exerciseId);
    const last = grp[grp.length - 1];
    const newRow = { ...last, setIndex: grp.length + 1, added: true };
    const lastIdx = rs.map((r) => r.exerciseId).lastIndexOf(exerciseId);
    const out = [...rs];
    out.splice(lastIdx + 1, 0, newRow);
    return out;
  });

  // Eine komplett nachträglich hinzugefügte Übung wieder entfernen.
  const removeExercise = (exerciseId) => setRows((rs) => rs.filter((r) => r.exerciseId !== exerciseId));

  if (picking) {
    return html`<${ExercisePicker} onAdd=${addExercise} onClose=${() => setPicking(false)} />`;
  }

  // nach Übung gruppieren, Reihenfolge bleibt erhalten
  const groups = [];
  const byEx = {};
  rows.forEach((row, idx) => {
    let g = byEx[row.exerciseId];
    if (!g) { g = { id: row.exerciseId, name: row.exerciseName, type: row.type, rows: [], allAdded: true }; byEx[row.exerciseId] = g; groups.push(g); }
    g.rows.push({ row, idx });
    if (!row.added) g.allAdded = false;
  });

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onCancel} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>${editMode ? 'Werte bearbeiten' : 'Training prüfen'}</h2>
    </header>
    <div class="screen-body">
      <p class="muted">${editMode ? 'Passe die erfassten Werte an und speichere.' : 'Stimmt alles? Du kannst die Werte noch anpassen oder eine Übung ergänzen. Wähle dann „Speichern & abschließen“.'}</p>

      ${groups.map((g) => {
        const isTime = g.type === 'time';
        const hasWeight = !isTime && g.rows.some(({ row }) => row.weight != null);
        const cols = isTime || !hasWeight ? 1 : 2;
        return html`
        <div class="stats-section review-card" key=${g.id}>
          <div class="review-card-head">
            <h3>${g.name}</h3>
            ${g.allAdded ? html`<button type="button" class="link-btn" onClick=${() => removeExercise(g.id)}>Entfernen</button>` : null}
          </div>
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
          <button type="button" class="btn addset-btn" onClick=${() => addSet(g.id)}><${Icon} name="plus" size=${16} /> Satz</button>
        </div>`;
      })}

      <button type="button" class="btn full addex-btn" onClick=${() => setPicking(true)}>
        <${Icon} name="plus" size=${18} /> Zusätzliche Übung
      </button>

      <button class="btn primary full big-btn" onClick=${() => onConfirm(rows.map(({ added, ...r }) => r))}>
        <${Icon} name="check" size=${20} /> ${editMode ? 'Speichern' : 'Speichern & abschließen'}
      </button>
      <button class="btn full" onClick=${onCancel}>${editMode ? 'Abbrechen' : 'Training verwerfen'}</button>
    </div>
  </div>`;
}
