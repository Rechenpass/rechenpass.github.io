import { html } from '../../html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { useStore } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { Segmented } from '../../components/Segmented.js';
import { PlanEditor } from './PlanEditor.js';
import { groupItemsByPhase, estimateMinutes } from './planUtils.js';

const PILL = { WarmUp: 'warmup', Training: 'training', CoolDown: 'cooldown' };

export function PlansPage({ sub, onSub }) {
  const state = useStore();
  const [editing, setEditing] = useState(null); // null | 'new' | plan

  // Scroll-Position der Liste merken und nach dem Schließen des Editors wiederherstellen.
  const scrollRef = useRef(0);
  const openEditor = (target) => { scrollRef.current = window.scrollY; setEditing(target); };
  useEffect(() => { if (!editing) window.scrollTo(0, scrollRef.current); }, [editing]);

  if (editing) {
    return html`<${PlanEditor} initial=${editing === 'new' ? null : editing} onClose=${() => setEditing(null)} />`;
  }

  return html`<div class="screen">
    <header class="screen-header">
      <${Segmented}
        options=${[{ value: 'exercises', label: 'Übungen' }, { value: 'plans', label: 'Pläne' }]}
        value=${sub} onChange=${onSub} />
      <button class="iconbtn primary" onClick=${() => openEditor('new')} aria-label="Neuer Plan"><${Icon} name="plus" /></button>
    </header>
    <div class="screen-body">
      ${state.plans.length === 0 ? html`
        <div class="empty">
          <div class="empty-emoji">📋</div>
          <p>Noch keine Trainingspläne. Stelle dir aus deinem Übungspool einen Plan zusammen.</p>
          ${state.exercises.length === 0 ? html`<p class="muted">Tipp: Lege zuerst unter „Bibliothek“ ein paar Übungen an.</p>` : null}
          <button class="btn primary" onClick=${() => openEditor('new')}>Ersten Plan erstellen</button>
        </div>
      ` : html`
        <div class="card-list">
          ${state.plans.map((p) => {
            const groups = groupItemsByPhase(p.items);
            return html`<button class="card plan-card" key=${p.id} onClick=${() => openEditor(p)}>
              <div class="card-title">${p.name}</div>
              <div class="plan-meta">${p.items.length} ${p.items.length === 1 ? 'Übung' : 'Übungen'} · ca. ${estimateMinutes(p.items)} min</div>
              <div class="plan-phases">
                ${groups.map((g) => html`<div class="plan-phase" key=${g.phase.key}>
                  <div class="plan-phase-head">
                    <span class=${'phase-pill ' + PILL[g.phase.key]}>${g.phase.label}</span>
                    <span class="plan-phase-count">${g.entries.length} ${g.entries.length === 1 ? 'Übung' : 'Übungen'}</span>
                  </div>
                  <div class="plan-phase-exs">${g.entries.map((e) => (e.exercise ? e.exercise.name : 'Gelöschte Übung')).join(', ')}</div>
                </div>`)}
              </div>
            </button>`;
          })}
        </div>
      `}
    </div>
  </div>`;
}
