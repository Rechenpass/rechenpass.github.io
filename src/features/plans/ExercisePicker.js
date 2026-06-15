import { html } from '../../html.js';
import { useState, useMemo } from 'preact/hooks';
import { useStore } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { Segmented } from '../../components/Segmented.js';
import { PHASES } from '../../constants.js';

export function ExercisePicker({ onAdd, onClose, addedCount }) {
  const state = useStore();
  const [search, setSearch] = useState('');
  const [phase, setPhase] = useState('all');
  const [toast, setToast] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.exercises.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (phase !== 'all' && e.phase !== phase) return false;
      return true;
    });
  }, [state.exercises, search, phase]);

  const grouped = PHASES
    .map((p) => ({ phase: p, items: visible.filter((e) => e.phase === p.key) }))
    .filter((g) => g.items.length > 0);

  const add = (ex) => {
    onAdd(ex);
    setToast(`„${ex.name}“ hinzugefügt`);
    setTimeout(() => setToast(''), 1200);
  };

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onClose} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>Übung hinzufügen</h2>
      <button class="textbtn primary" onClick=${onClose}>Fertig${addedCount ? ` (${addedCount})` : ''}</button>
    </header>
    <div class="screen-body">
      ${state.exercises.length === 0 ? html`
        <div class="empty">
          <div class="empty-emoji">🏋️</div>
          <p>Keine Übungen im Pool. Lege zuerst unter „Bibliothek“ welche an.</p>
        </div>
      ` : html`
        <${Segmented}
          options=${[{ value: 'all', label: 'Alle' }, ...PHASES.map((p) => ({ value: p.key, label: p.label }))]}
          value=${phase} onChange=${setPhase} />
        <div class="search">
          <${Icon} name="search" size=${18} />
          <input class="search-input" type="search" placeholder="Übung suchen …" value=${search} onInput=${(e) => setSearch(e.target.value)} />
        </div>
        ${grouped.length === 0
          ? html`<div class="empty"><p>Keine Übung gefunden.</p></div>`
          : grouped.map((g) => html`
            <section class="phase-section" key=${g.phase.key}>
              <h3 class="phase-title">${g.phase.label}</h3>
              <div class="card-list">
                ${g.items.map((e) => html`
                  <button class="card pick-row" key=${e.id} onClick=${() => add(e)} aria-label=${`„${e.name}" hinzufügen`}>
                    <div class="card-main">
                      <div class="card-title">${e.name}</div>
                      <div class="card-sub">${(e.primaryMuscles || []).join(', ') || '—'} · ${e.type === 'time' ? `${e.defaultDurationSec ?? '–'} s` : `${e.defaultSets ?? '–'}×${e.defaultReps ?? '–'}`}</div>
                    </div>
                    <span class="pick-add"><${Icon} name="plus" size=${20} /></span>
                  </button>`)}
              </div>
            </section>`)}
      `}
    </div>
    ${toast ? html`<div class="added-toast">${toast}</div>` : null}
  </div>`;
}
