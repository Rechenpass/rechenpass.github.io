import { html } from '../../html.js';
import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { useStore, seedExamples } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { Segmented } from '../../components/Segmented.js';
import { Filters } from './Filters.js';
import { ExerciseCard } from './ExerciseCard.js';
import { ExerciseForm } from './ExerciseForm.js';
import { PHASES } from '../../constants.js';

export function ExercisesPage({ sub, onSub }) {
  const state = useStore();
  const [editing, setEditing] = useState(null); // null | 'new' | exercise
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [filters, setFilters] = useState({ search: '', region: '', muscle: '', group: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1600); };

  // Scroll-Position der Liste merken und nach dem Schließen des Formulars wiederherstellen.
  const scrollRef = useRef(0);
  const openEditor = (target) => { scrollRef.current = window.scrollY; setEditing(target); };
  useEffect(() => { if (!editing) window.scrollTo(0, scrollRef.current); }, [editing]);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return state.exercises.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (filters.region && !(e.bodyRegions || []).includes(filters.region)) return false;
      if (filters.muscle && !(e.primaryMuscles || []).includes(filters.muscle)) return false;
      if (filters.group && e.group !== filters.group) return false;
      if (phaseFilter !== 'all' && e.phase !== phaseFilter) return false;
      return true;
    });
  }, [state.exercises, filters, phaseFilter]);

  if (editing) {
    return html`<${ExerciseForm}
      initial=${editing === 'new' ? null : editing}
      onClose=${() => setEditing(null)}
      onSaved=${showToast} />`;
  }

  const grouped = PHASES
    .map((p) => ({ phase: p, items: visible.filter((e) => e.phase === p.key) }))
    .filter((g) => g.items.length > 0);

  return html`<div class="screen">
    <header class="screen-header">
      <${Segmented}
        options=${[{ value: 'exercises', label: 'Übungen' }, { value: 'plans', label: 'Pläne' }]}
        value=${sub} onChange=${onSub} />
      <button class="iconbtn primary" onClick=${() => openEditor('new')} aria-label="Neue Übung">
        <${Icon} name="plus" />
      </button>
    </header>

    <div class="screen-body">
      <${Segmented}
        options=${[{ value: 'all', label: 'Alle' }, ...PHASES.map((p) => ({ value: p.key, label: p.label }))]}
        value=${phaseFilter} onChange=${setPhaseFilter} />

      <${Filters} filters=${filters} onChange=${setFilters} />

      ${state.exercises.length === 0
        ? html`
          <div class="empty">
            <div class="empty-emoji">🏋️</div>
            <p>Noch keine Übungen im Pool. Lege deine erste Übung an oder lade ein paar Beispiele zum Ausprobieren.</p>
            <div class="empty-actions">
              <button class="btn primary" onClick=${() => openEditor('new')}>Erste Übung anlegen</button>
              <button class="btn" onClick=${seedExamples}>Beispiel-Übungen laden</button>
            </div>
          </div>`
        : visible.length === 0
        ? html`<div class="empty"><p>Keine Übung passt zu den aktuellen Filtern.</p></div>`
        : html`
          <div class="exercise-count">${visible.length} ${visible.length === 1 ? 'Übung' : 'Übungen'}</div>
          ${grouped.map((g) => html`
            <section class="phase-section" key=${g.phase.key}>
              <h3 class="phase-title">${g.phase.label}</h3>
              <div class="card-list">
                ${g.items.map((e) => html`<${ExerciseCard} key=${e.id} exercise=${e} onClick=${() => openEditor(e)} />`)}
              </div>
            </section>`)}`}
    </div>
    ${toast ? html`<div class="added-toast">${toast}</div>` : null}
  </div>`;
}
