import { html } from '../../html.js';
import { useState, useMemo } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { MUSCLES_BY_REGION, REGIONS, GROUPS } from '../../constants.js';

// Filter: Name (Suche), Körperregion + Trainingsart (Dropdowns), Muskeln (Bottom-Sheet mit Suche).
export function Filters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const [muscleSheet, setMuscleSheet] = useState(false);

  const activeCount = [filters.region, filters.group, filters.muscle].filter(Boolean).length;

  return html`<div class="filters">
    <div class="search">
      <${Icon} name="search" size=${18} />
      <input
        class="search-input" type="search" placeholder="Übung suchen …"
        value=${filters.search} onInput=${(e) => set({ search: e.target.value })}
      />
    </div>

    <div class="filter-fields">
      <label class="filter-field">
        <span class="filter-field-label">Körperregion</span>
        <select class="filter-select" value=${filters.region} onChange=${(e) => set({ region: e.target.value })}>
          <option value="">Alle</option>
          ${REGIONS.map((r) => html`<option value=${r}>${r}</option>`)}
        </select>
      </label>
      <label class="filter-field">
        <span class="filter-field-label">Trainingsart</span>
        <select class="filter-select" value=${filters.group} onChange=${(e) => set({ group: e.target.value })}>
          <option value="">Alle</option>
          ${GROUPS.map((g) => html`<option value=${g}>${g}</option>`)}
        </select>
      </label>
    </div>

    <div class="filter-field">
      <span class="filter-field-label">Muskeln</span>
      <button
        type="button" class="filter-select select-trigger" aria-haspopup="dialog"
        onClick=${() => setMuscleSheet(true)}
      >
        <span class=${'st-label' + (filters.muscle ? '' : ' placeholder')}>${filters.muscle || 'Alle Muskeln'}</span>
        <${Icon} name="down" size=${16} />
      </button>
    </div>

    ${activeCount > 0
      ? html`<div class="filter-reset">
          <span>${activeCount} Filter aktiv</span>
          <button type="button" class="link-btn" onClick=${() => set({ region: '', muscle: '', group: '' })}>Zurücksetzen</button>
        </div>`
      : null}

    ${muscleSheet
      ? html`<${MuscleSheet}
          value=${filters.muscle}
          onSelect=${(m) => { set({ muscle: m }); setMuscleSheet(false); }}
          onClose=${() => setMuscleSheet(false)}
        />`
      : null}
  </div>`;
}

// Bottom-Sheet zur Auswahl EINES Muskels (Filter). Suche oben, „Alle Muskeln" als dezente
// Häkchen-Zeile, darunter die einzelnen Muskeln als Chips nach Region gruppiert (gewählter blau).
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
        <div class="modal-title">Muskeln</div>
        <button class="iconbtn small" onClick=${onClose} aria-label="Schließen">
          <${Icon} name="x" size=${18} />
        </button>
      </div>

      <div class="search">
        <${Icon} name="search" size=${18} />
        <input
          class="search-input" type="search" placeholder="Muskel suchen …"
          value=${q} onInput=${(e) => setQ(e.target.value)}
        />
      </div>

      <div class="muscle-sheet-list">
        <button type="button" class=${'muscle-all-row' + (value ? '' : ' active')} onClick=${() => onSelect('')}>
          <span>Alle Muskeln</span>
          ${!value ? html`<${Icon} name="check" size=${18} />` : null}
        </button>
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
