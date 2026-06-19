import { html } from '../../html.js';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useStore } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { Filters } from '../exercises/Filters.js';
import { PHASES } from '../../constants.js';

export function ExercisePicker({ onAdd, onClose, addedCount }) {
  const state = useStore();
  const [filters, setFilters] = useState({ search: '', regions: [], muscles: [], groups: [], phases: [] });
  const [toast, setToast] = useState('');

  // Beim Öffnen oben bei den Filtern starten (nicht an der Scroll-Position des Editors hängen bleiben).
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const { regions, muscles, groups, phases } = filters;
    return state.exercises.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (regions.length && !regions.some((r) => (e.bodyRegions || []).includes(r))) return false;
      if (muscles.length && !muscles.some((m) => (e.primaryMuscles || []).includes(m))) return false;
      if (groups.length && !groups.includes(e.group)) return false;
      if (phases.length && !phases.includes(e.phase)) return false;
      return true;
    });
  }, [state.exercises, filters]);

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
        <${Filters} filters=${filters} onChange=${setFilters} />
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
