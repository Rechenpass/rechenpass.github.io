import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { AutoTextarea } from '../../components/AutoTextarea.js';
import { addYoga, updateYoga, deleteYoga } from '../../store.js';
import { confirmAsk } from '../../components/confirmHost.js';
import { isoDate, todayInput, parseDateInput } from '../../dateUtils.js';

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

export function YogaForm({ initial, initialDate, onClose }) {
  const [d, setD] = useState(() => (initial
    ? { ...initial, date: isoDate(initial.date) }
    : { date: initialDate != null ? isoDate(initialDate) : todayInput(), durationMin: null, note: '' }));
  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));

  const save = () => {
    const data = { date: parseDateInput(d.date), durationMin: d.durationMin, note: (d.note || '').trim() };
    if (initial && initial.id) updateYoga(initial.id, data); else addYoga(data);
    onClose();
  };

  const remove = () => confirmAsk({
    title: 'Yoga-Session löschen?', message: 'Diese Session wirklich löschen?', confirmLabel: 'Löschen',
    onConfirm: () => { deleteYoga(initial.id); onClose(); },
  });

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onClose} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>${initial && initial.id ? 'Yoga bearbeiten' : 'Yoga-Session erfassen'}</h2>
      <button class="textbtn primary" onClick=${save}>Speichern</button>
    </header>
    <div class="screen-body">
      <label class="field">
        <span class="field-label">Datum</span>
        <input class="input" type="date" value=${d.date} onInput=${(e) => set({ date: e.target.value })} />
      </label>

      <${DurationField} totalMin=${d.durationMin} onChange=${(v) => set({ durationMin: v })} />

      <label class="field">
        <span class="field-label">Notiz <span class="muted">(optional)</span></span>
        <${AutoTextarea} rows=${3} value=${d.note} onInput=${(e) => set({ note: e.target.value })} />
      </label>

      ${initial && initial.id ? html`
        <button class="btn danger-outline full" onClick=${remove}><${Icon} name="trash" size=${18} /> Session löschen</button>` : null}
    </div>
  </div>`;
}
