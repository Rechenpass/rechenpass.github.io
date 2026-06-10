import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { PlanItemCard } from './PlanItemCard.js';
import { ExercisePicker } from './ExercisePicker.js';
import { savePlan, deletePlan, createPlanItem, getExercise } from '../../store.js';
import { groupItemsByPhase } from './planUtils.js';

export function PlanEditor({ initial, onClose }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [items, setItems] = useState(() => (initial ? initial.items.map((it) => ({ ...it })) : []));
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');

  const addExercise = (ex) => setItems((arr) => [...arr, createPlanItem(ex)]);
  const updateItem = (updated) => setItems((arr) => arr.map((it) => (it.id === updated.id ? updated : it)));
  const removeItem = (id) => setItems((arr) => arr.filter((it) => it.id !== id));

  const move = (id, dir) => setItems((arr) => {
    const next = [...arr];
    const idx = next.findIndex((it) => it.id === id);
    if (idx < 0) return arr;
    const phaseOf = (it) => { const ex = getExercise(it.exerciseId); return ex ? ex.phase : 'Training'; };
    const myPhase = phaseOf(next[idx]);
    let j = dir === 'up' ? idx - 1 : idx + 1;
    while (j >= 0 && j < next.length && phaseOf(next[j]) !== myPhase) j += dir === 'up' ? -1 : 1;
    if (j < 0 || j >= next.length) return arr;
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });

  const save = () => {
    if (!name.trim()) return setError('Bitte gib dem Plan einen Namen.');
    if (items.length === 0) return setError('Füge mindestens eine Übung hinzu.');
    savePlan({ id: initial ? initial.id : undefined, name: name.trim(), items });
    onClose();
  };

  const remove = () => {
    if (confirm('Diesen Plan wirklich löschen?')) {
      deletePlan(initial.id);
      onClose();
    }
  };

  if (picking) {
    return html`<${ExercisePicker} onAdd=${addExercise} addedCount=${items.length} onClose=${() => setPicking(false)} />`;
  }

  const groups = groupItemsByPhase(items);

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onClose} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>${initial ? 'Plan bearbeiten' : 'Neuer Plan'}</h2>
      <button class="textbtn primary" onClick=${save}>Speichern</button>
    </header>
    <div class="screen-body">
      ${error ? html`<div class="banner error">${error}</div>` : null}

      <label class="field">
        <span class="field-label">Name des Plans</span>
        <input class="input plan-name-input" type="text" placeholder="z. B. Ganzkörper A"
          value=${name} onInput=${(e) => setName(e.target.value)} />
      </label>

      ${items.length === 0 ? html`
        <div class="empty">
          <div class="empty-emoji">📋</div>
          <p>Noch keine Übungen im Plan. Füge welche aus deinem Pool hinzu.</p>
        </div>
      ` : groups.map((g) => html`
        <section class="phase-section" key=${g.phase.key}>
          <h3 class="phase-title">${g.phase.label}</h3>
          <div class="card-list">
            ${g.entries.map((entry, i) => html`
              <${PlanItemCard} key=${entry.item.id}
                item=${entry.item}
                onChange=${updateItem}
                onRemove=${() => removeItem(entry.item.id)}
                onMove=${(dir) => move(entry.item.id, dir)}
                canUp=${i > 0}
                canDown=${i < g.entries.length - 1} />`)}
          </div>
        </section>`)}

      <button class="btn primary full" onClick=${() => setPicking(true)}>
        <${Icon} name="plus" size=${18} /> Übung hinzufügen
      </button>

      ${initial ? html`
        <button class="btn danger-outline full" onClick=${remove}>
          <${Icon} name="trash" size=${18} /> Plan löschen
        </button>` : null}
    </div>
  </div>`;
}
