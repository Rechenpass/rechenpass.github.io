import { html } from '../../html.js';
import { useState, useMemo } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { MUSCLES_BY_REGION, REGIONS, GROUPS } from '../../constants.js';

// Filter: Name (Suche), Körperregion (Dropdown), Trainingsart (Dropdown), Muskelgruppe (Bottom-Sheet mit Suche).
export function Filters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const [muscleSheet, setMuscleSheet] = useState(false);

  return html`<div class="filters">
    <div class="search">
      <${Icon} name="search" size=${18} />
      <input
        class="search-input" type="search" placeholder="Übung suchen …"
        value=${filters.search} onInput=${(e) => set({ search: e.target.value })}
      />
    </div>
    <div class="filter-row">
      <select class="input small" value=${filters.region} onChange=${(e) => set({ region: e.target.value })}>
        <option value="">Alle Regionen</option>
        ${REGIONS.map((r) => html`<option value=${r}>${r}</option>`)}
      </select>
      <select class="input small" value=${filters.group} onChange=${(e) => set({ group: e.target.value })}>
        <option value="">Alle Arten</option>
        ${GROUPS.map((g) => html`<option value=${g}>${g}</option>`)}
      </select>
    </div>
    <button
      type="button" class="input small select-trigger" aria-haspopup="dialog"
      onClick=${() => setMuscleSheet(true)}
    >
      <span class=${'st-label' + (filters.muscle ? '' : ' placeholder')}>${filters.muscle || 'Alle Muskelgruppen'}</span>
      <${Icon} name="down" size=${16} />
    </button>

    ${muscleSheet
      ? html`<${MuscleSheet}
          value=${filters.muscle}
          onSelect=${(m) => { set({ muscle: m }); setMuscleSheet(false); }}
          onClose=${() => setMuscleSheet(false)}
        />`
      : null}
  </div>`;
}

// Bottom-Sheet zur Auswahl EINER Muskelgruppe (Filter). Suche oben, Chips nach Region gruppiert.
function MuscleSheet({ value, onSelect, onClose }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const groups = useMemo(
    () =>
      REGIONS.map((region) => ({
        region,
        muscles: MUSCLES_BY_REGION[region].filter((m) => m.toLowerCase().includes(needle)),
      })).filter((g) => g.muscles.length > 0),
    [needle]
  );

  return html`<div class="modal-overlay" onClick=${onClose}>
    <div class="modal-sheet muscle-sheet" onClick=${(ev) => ev.stopPropagation()}>
      <div class="sheet-head">
        <div class="modal-title">Muskelgruppe</div>
        <button class="iconbtn small" onClick=${onClose} aria-label="Schließen">
          <${Icon} name="x" size=${18} />
        </button>
      </div>

      <div class="search">
        <${Icon} name="search" size=${18} />
        <input
          class="search-input" type="search" placeholder="Muskelgruppe suchen …"
          value=${q} onInput=${(e) => setQ(e.target.value)}
        />
      </div>

      <div class="muscle-sheet-list">
        <button class=${'sheet-all' + (value ? '' : ' active')} onClick=${() => onSelect('')}>Alle Muskelgruppen</button>
        ${groups.length === 0
          ? html`<p class="hint">Keine Treffer für „${q}“.</p>`
          : groups.map(
              (g) => html`<div class="muscle-group" key=${g.region}>
                <div class="muscle-group-title">${g.region}</div>
                <div class="chips">
                  ${g.muscles.map(
                    (m) => html`<button
                      type="button" key=${m}
                      class=${'chip' + (m === value ? ' active' : '')}
                      onClick=${() => onSelect(m)}
                    >${m}</button>`
                  )}
                </div>
              </div>`
            )}
      </div>
    </div>
  </div>`;
}
