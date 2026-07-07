import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { Segmented } from '../../components/Segmented.js';
import { AutoTextarea } from '../../components/AutoTextarea.js';
import { addRide, updateRide, deleteRide } from '../../store.js';
import { confirmAsk } from '../../components/confirmHost.js';
import { isoDate, todayInput, parseDateInput } from '../../dateUtils.js';

function NumberField({ label, value, onChange, step, placeholder }) {
  return html`<label class="field">
    <span class="field-label">${label}</span>
    <input class="input" type="number" inputmode="decimal" min="0" step=${step || 1} placeholder=${placeholder || ''}
      value=${value ?? ''} onInput=${(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
  </label>`;
}

// Dauer als Stunden + Minuten; gespeichert wird die Gesamt-Minutenzahl (durationMin).
function DurationField({ totalMin, onChange }) {
  const h = Math.floor((totalMin || 0) / 60);
  const m = (totalMin || 0) % 60;
  const upd = (nh, nm) => { const t = nh * 60 + nm; onChange(t > 0 ? t : null); };
  return html`<div class="field">
    <span class="field-label">Dauer</span>
    <div class="dur-row">
      <input class="input" type="number" inputmode="numeric" min="0" placeholder="0"
        value=${h || ''} onInput=${(e) => upd(Math.max(0, Number(e.target.value) || 0), m)} />
      <span class="dur-unit">Std</span>
      <input class="input" type="number" inputmode="numeric" min="0" max="59" placeholder="0"
        value=${m || ''} onInput=${(e) => upd(h, Math.max(0, Number(e.target.value) || 0))} />
      <span class="dur-unit">Min</span>
    </div>
  </div>`;
}

const emptyDraft = () => ({
  type: 'outdoor', date: todayInput(),
  distanceKm: null, elevationM: null, durationMin: null,
  avgWatt: null, kcal: null, name: '', note: '',
});

export function RideForm({ initial, initialType, initialDate, onClose }) {
  const [d, setD] = useState(() => (initial
    ? { ...emptyDraft(), ...initial, date: isoDate(initial.date) }
    : { ...emptyDraft(), ...(initialType ? { type: initialType } : {}), ...(initialDate != null ? { date: isoDate(initialDate) } : {}) }));
  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));
  const isIndoor = d.type === 'indoor';

  const save = () => {
    const data = {
      type: d.type,
      date: parseDateInput(d.date),
      distanceKm: d.distanceKm, elevationM: d.elevationM, durationMin: d.durationMin,
      avgWatt: isIndoor ? d.avgWatt : null,
      kcal: isIndoor ? d.kcal : null,
      name: isIndoor ? (d.name || '').trim() : '',
      note: (d.note || '').trim(),
    };
    if (initial && initial.id) updateRide(initial.id, data); else addRide(data);
    onClose();
  };

  const remove = () => confirmAsk({
    title: 'Fahrt löschen?', message: 'Diese Fahrt wirklich löschen?', confirmLabel: 'Löschen',
    onConfirm: () => { deleteRide(initial.id); onClose(); },
  });

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onClose} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>${initial && initial.id ? 'Fahrt bearbeiten' : 'Fahrt erfassen'}</h2>
      <button class="textbtn primary" onClick=${save}>Speichern</button>
    </header>
    <div class="screen-body">
      <div class="field">
        <span class="field-label">Art</span>
        <${Segmented}
          options=${[{ value: 'outdoor', label: 'Radausfahrt' }, { value: 'indoor', label: 'Indoor-Training' }]}
          value=${d.type} onChange=${(v) => set({ type: v })} />
      </div>

      <label class="field">
        <span class="field-label">Datum</span>
        <input class="input" type="date" value=${d.date} onInput=${(e) => set({ date: e.target.value })} />
      </label>

      <div class="field-row">
        <${NumberField} label="Strecke (km)" value=${d.distanceKm} step=${0.1} onChange=${(v) => set({ distanceKm: v })} />
        <${NumberField} label="Höhenmeter (m)" value=${d.elevationM} step=${1} onChange=${(v) => set({ elevationM: v })} />
      </div>

      <${DurationField} totalMin=${d.durationMin} onChange=${(v) => set({ durationMin: v })} />

      ${isIndoor ? html`
        <div class="field-row">
          <${NumberField} label="Ø Watt" value=${d.avgWatt} step=${1} onChange=${(v) => set({ avgWatt: v })} />
          <div class="field"></div>
        </div>` : null}

      ${isIndoor ? html`
        <div class="field-row">
          <${NumberField} label="Kalorien (kcal)" value=${d.kcal} step=${1} onChange=${(v) => set({ kcal: v })} />
          <div class="field"></div>
        </div>
        <label class="field">
          <span class="field-label">Name / Programm <span class="muted">(optional)</span></span>
          <input class="input" type="text" placeholder="z. B. Intervalle, Zwift-Strecke …" value=${d.name}
            onInput=${(e) => set({ name: e.target.value })} />
        </label>` : null}

      <label class="field">
        <span class="field-label">Notiz <span class="muted">(optional)</span></span>
        <${AutoTextarea} rows=${2} value=${d.note} onInput=${(e) => set({ note: e.target.value })} />
      </label>

      ${!isIndoor ? html`<p class="hint">Für Outdoor-Fahrten sind km und Höhenmeter typisch – Pflicht ist aber nichts.</p>` : null}

      ${initial && initial.id ? html`
        <button class="btn danger-outline full" onClick=${remove}><${Icon} name="trash" size=${18} /> Fahrt löschen</button>` : null}
    </div>
  </div>`;
}
