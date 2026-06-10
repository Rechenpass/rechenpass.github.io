import { html } from '../../html.js';
import { Icon } from '../../components/Icon.js';
import { getExercise } from '../../store.js';
import { SETS_OPTIONS, REPS_OPTIONS, DURATION_OPTIONS, REST_OPTIONS } from '../../constants.js';

function MiniSelect({ label, value, options, onChange, suffix }) {
  return html`<div class="mini-field">
    <span class="mini-label">${label}</span>
    <select class="mini-input" value=${value} onChange=${(e) => onChange(Number(e.target.value))}>
      ${options.map((n) => html`<option value=${n}>${n}${suffix || ''}</option>`)}
    </select>
  </div>`;
}

export function PlanItemCard({ item, onChange, onRemove, onMove, canUp, canDown }) {
  const ex = getExercise(item.exerciseId);
  const set = (patch) => onChange({ ...item, ...patch });
  const isTime = ex && ex.type === 'time';
  const isKurzhantel = ex && ex.group === 'Kurzhantel';
  const sets = item.sets || 1;

  return html`<div class="plan-item">
    <div class="plan-item-head">
      <div class="pi-main">
        <div class="pi-title">${ex ? ex.name : 'Übung gelöscht'}</div>
        <div class="pi-sub">${ex ? `${(ex.primaryMuscles || []).join(', ') || '—'} · ${ex.group}` : 'nicht mehr im Pool'}</div>
      </div>
      <div class="pi-actions">
        <button class="iconbtn" disabled=${!canUp} onClick=${() => onMove('up')} aria-label="nach oben"><${Icon} name="up" size=${18} /></button>
        <button class="iconbtn" disabled=${!canDown} onClick=${() => onMove('down')} aria-label="nach unten"><${Icon} name="down" size=${18} /></button>
        <button class="iconbtn" onClick=${onRemove} aria-label="entfernen"><${Icon} name="x" size=${18} /></button>
      </div>
    </div>

    ${ex ? html`
      <div class="plan-item-controls">
        <${MiniSelect} label="Sätze" value=${sets} options=${SETS_OPTIONS} onChange=${(v) => set({ sets: v })} />
        <div class="mini-sep">×</div>
        ${isTime
          ? html`<${MiniSelect} label="Dauer" value=${item.durationSec || 30} options=${DURATION_OPTIONS} onChange=${(v) => set({ durationSec: v })} suffix=${' s'} />`
          : html`<${MiniSelect} label="Wdh." value=${item.reps || 1} options=${REPS_OPTIONS} onChange=${(v) => set({ reps: v })} />`}
        ${isKurzhantel ? html`
          <div class="mini-field">
            <span class="mini-label">Gewicht</span>
            <input class="mini-input w-weight" type="number" inputmode="decimal" min="0" step="0.5" placeholder="kg"
              value=${item.weight ?? ''} onInput=${(e) => set({ weight: e.target.value === '' ? null : Number(e.target.value) })} />
          </div>` : null}
      </div>

      <div class="plan-item-controls">
        ${sets > 1 ? html`
          <${MiniSelect} label="Pause / Satz" value=${item.restBetweenSetsSec ?? 0} options=${REST_OPTIONS} onChange=${(v) => set({ restBetweenSetsSec: v })} suffix=${' s'} />` : null}
        <${MiniSelect} label="Pause danach" value=${item.restAfterExerciseSec ?? 0} options=${REST_OPTIONS} onChange=${(v) => set({ restAfterExerciseSec: v })} suffix=${' s'} />
      </div>
    ` : html`
      <button class="btn danger-outline" onClick=${onRemove}><${Icon} name="trash" size=${16} /> Entfernen</button>
    `}
  </div>`;
}
