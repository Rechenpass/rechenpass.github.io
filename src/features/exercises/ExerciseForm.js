import { html } from '../../html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { Segmented } from '../../components/Segmented.js';
import { MuscleSelect } from './MuscleSelect.js';
import { GROUPS, PHASES, REGIONS, SETS_OPTIONS, REPS_OPTIONS, DURATION_OPTIONS } from '../../constants.js';
import { addExercise, updateExercise, deleteExercise } from '../../store.js';

const emptyDraft = () => ({
  name: '', description: '',
  group: 'Bodyweight', phase: 'Training', bodyRegions: ['Oberkörper'],
  primaryMuscles: [], secondaryMuscles: [],
  type: 'reps', defaultSets: 3, defaultReps: 10, defaultDurationSec: 30,
});

export function ExerciseForm({ initial, onClose, onSaved }) {
  const [d, setD] = useState(() => (initial ? { ...emptyDraft(), ...initial } : emptyDraft()));
  const [error, setError] = useState('');
  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));

  // Primäre Muskelgruppe ist nur im Training Pflicht – bei Warm-Up/Cool-Down optional.
  const primaryOptional = ['WarmUp', 'CoolDown'].includes(d.phase);

  const save = () => {
    if (!d.name.trim()) return setError('Bitte gib einen Namen ein.');
    if (!d.bodyRegions || d.bodyRegions.length === 0) return setError('Bitte mindestens eine Körperregion wählen.');
    if (!primaryOptional && d.primaryMuscles.length === 0) return setError('Bitte mindestens eine primäre Muskelgruppe wählen.');
    const data = {
      name: d.name.trim(),
      description: d.description.trim(),
      group: d.group,
      phase: d.phase,
      bodyRegions: d.bodyRegions,
      primaryMuscles: d.primaryMuscles,
      secondaryMuscles: d.secondaryMuscles,
      type: d.type,
      defaultSets: d.type === 'reps' ? Number(d.defaultSets) : undefined,
      defaultReps: d.type === 'reps' ? Number(d.defaultReps) : undefined,
      defaultDurationSec: d.type === 'time' ? Number(d.defaultDurationSec) : undefined,
    };
    if (initial && initial.id) updateExercise(initial.id, data);
    else addExercise(data);
    if (onSaved) onSaved(initial && initial.id ? 'Übung aktualisiert' : 'Übung gespeichert');
    onClose();
  };

  const remove = () => {
    if (confirm('Diese Übung wirklich löschen?')) {
      deleteExercise(initial.id);
      onClose();
    }
  };

  return html`<div class="screen">
    <header class="screen-header">
      <button class="iconbtn" onClick=${onClose} aria-label="Zurück"><${Icon} name="back" /></button>
      <h2>${initial && initial.id ? 'Übung bearbeiten' : 'Neue Übung'}</h2>
      <button class="textbtn primary" onClick=${save}>Speichern</button>
    </header>

    <div class="screen-body">
      ${error ? html`<div class="banner error">${error}</div>` : null}

      <label class="field">
        <span class="field-label">Name</span>
        <input class="input" type="text" value=${d.name} placeholder="z. B. Liegestütze"
          onInput=${(e) => set({ name: e.target.value })} />
      </label>

      <label class="field">
        <span class="field-label">Beschreibung / Ausführung</span>
        <textarea class="input" rows="4" placeholder="Wie wird die Übung korrekt ausgeführt?"
          value=${d.description} onInput=${(e) => set({ description: e.target.value })}></textarea>
      </label>

      <div class="field">
        <span class="field-label">Trainingsart</span>
        <${Segmented} options=${GROUPS} value=${d.group} onChange=${(v) => set({ group: v })} wrap />
      </div>

      <div class="field">
        <span class="field-label">Phase</span>
        <${Segmented} options=${PHASES.map((p) => ({ value: p.key, label: p.label }))}
          value=${d.phase} onChange=${(v) => set({ phase: v })} />
      </div>

      <div class="field">
        <span class="field-label">Körperregion <span class="muted">(Mehrfachauswahl)</span></span>
        <div class="chips">
          ${REGIONS.map((r) => {
            const sel = d.bodyRegions.includes(r);
            return html`<button
              type="button" key=${r}
              class=${'chip' + (sel ? ' active' : '')}
              onClick=${() => set({ bodyRegions: sel ? d.bodyRegions.filter((x) => x !== r) : [...d.bodyRegions, r] })}
            >${r}</button>`;
          })}
        </div>
      </div>

      <div class="field">
        <span class="field-label">Primäre Muskelgruppen <span class="muted">${primaryOptional ? '(optional)' : `(${d.primaryMuscles.length}${d.primaryMuscles.length > 5 ? ' gewählt' : '/5'})`}</span></span>
        <${MuscleSelect} value=${d.primaryMuscles} onChange=${(v) => set({ primaryMuscles: v })} max=${5} />
      </div>

      <div class="field">
        <span class="field-label">Sekundäre Muskelgruppen <span class="muted">(${d.secondaryMuscles.length}${d.secondaryMuscles.length > 5 ? ' gewählt' : '/5'})</span></span>
        <${MuscleSelect} value=${d.secondaryMuscles} onChange=${(v) => set({ secondaryMuscles: v })} max=${5} />
      </div>

      <div class="field">
        <span class="field-label">Art der Übung</span>
        <${Segmented}
          options=${[{ value: 'reps', label: 'Sätze × Wdh.' }, { value: 'time', label: 'Zeit' }]}
          value=${d.type} onChange=${(v) => set({ type: v })} />
      </div>

      ${d.type === 'reps'
        ? html`
          <div class="field-row">
            <label class="field">
              <span class="field-label">Sätze</span>
              <select class="input" value=${d.defaultSets} onChange=${(e) => set({ defaultSets: Number(e.target.value) })}>
                ${SETS_OPTIONS.map((n) => html`<option value=${n}>${n}</option>`)}
              </select>
            </label>
            <label class="field">
              <span class="field-label">Wiederholungen</span>
              <select class="input" value=${d.defaultReps} onChange=${(e) => set({ defaultReps: Number(e.target.value) })}>
                ${REPS_OPTIONS.map((n) => html`<option value=${n}>${n}</option>`)}
              </select>
            </label>
          </div>
          <p class="hint">Standardwerte – im Trainingsplan später pro Übung anpassbar.</p>`
        : html`
          <label class="field">
            <span class="field-label">Dauer</span>
            <select class="input" value=${d.defaultDurationSec} onChange=${(e) => set({ defaultDurationSec: Number(e.target.value) })}>
              ${DURATION_OPTIONS.map((n) => html`<option value=${n}>${n} Sekunden</option>`)}
            </select>
          </label>
          <p class="hint">Standardwert – im Trainingsplan später anpassbar.</p>`}

      ${initial && initial.id
        ? html`<button class="btn danger-outline full" onClick=${remove}>
            <${Icon} name="trash" size=${18} /> Übung löschen
          </button>`
        : null}
    </div>
  </div>`;
}
