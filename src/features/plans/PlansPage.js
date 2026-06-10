import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { useStore } from '../../store.js';
import { Icon } from '../../components/Icon.js';
import { Segmented } from '../../components/Segmented.js';
import { PlanEditor } from './PlanEditor.js';
import { phaseCounts, estimateMinutes } from './planUtils.js';

export function PlansPage({ sub, onSub }) {
  const state = useStore();
  const [editing, setEditing] = useState(null); // null | 'new' | plan

  if (editing) {
    return html`<${PlanEditor} initial=${editing === 'new' ? null : editing} onClose=${() => setEditing(null)} />`;
  }

  return html`<div class="screen">
    <header class="screen-header">
      <${Segmented}
        options=${[{ value: 'exercises', label: 'Übungen' }, { value: 'plans', label: 'Pläne' }]}
        value=${sub} onChange=${onSub} />
      <button class="iconbtn primary" onClick=${() => setEditing('new')} aria-label="Neuer Plan"><${Icon} name="plus" /></button>
    </header>
    <div class="screen-body">
      ${state.plans.length === 0 ? html`
        <div class="empty">
          <div class="empty-emoji">📋</div>
          <p>Noch keine Trainingspläne. Stelle dir aus deinem Übungspool einen Plan zusammen.</p>
          ${state.exercises.length === 0 ? html`<p class="muted">Tipp: Lege zuerst unter „Bibliothek“ ein paar Übungen an.</p>` : null}
          <button class="btn primary" onClick=${() => setEditing('new')}>Ersten Plan erstellen</button>
        </div>
      ` : html`
        <div class="card-list">
          ${state.plans.map((p) => {
            const c = phaseCounts(p.items);
            return html`<button class="card plan-card" key=${p.id} onClick=${() => setEditing(p)}>
              <div class="card-title">${p.name}</div>
              <div class="plan-meta">${p.items.length} ${p.items.length === 1 ? 'Übung' : 'Übungen'} · ca. ${estimateMinutes(p.items)} min</div>
              <div class="phase-pills">
                ${c.WarmUp ? html`<span class="phase-pill warmup">Warm-Up ${c.WarmUp}</span>` : null}
                ${c.Training ? html`<span class="phase-pill training">Training ${c.Training}</span>` : null}
                ${c.CoolDown ? html`<span class="phase-pill cooldown">Cool-Down ${c.CoolDown}</span>` : null}
              </div>
            </button>`;
          })}
        </div>
      `}
    </div>
  </div>`;
}
