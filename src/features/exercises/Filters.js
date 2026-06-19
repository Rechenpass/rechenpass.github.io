import { html } from '../../html.js';
import { useState, useMemo } from 'preact/hooks';
import { Icon } from '../../components/Icon.js';
import { MUSCLES_BY_REGION, REGIONS, GROUPS, PHASES, phaseLabel } from '../../constants.js';

const PHASE_VALUES = PHASES.map((p) => p.key);

// Feldbeschriftung bei Mehrfachauswahl (Variante B):
// 0 → „Alle", genau 1 → der Name, 2+ → „N <Begriff>" (z. B. „3 Muskeln").
function fieldLabel(selected, nounPlural, labelOf = (x) => x) {
  if (!selected || selected.length === 0) return 'Alle';
  if (selected.length === 1) return labelOf(selected[0]);
  return `${selected.length} ${nounPlural}`;
}

// Filter: Suche · Phase (Dropdown) · „Weitere Filter" (Akkordeon: Körperregion, Trainingsart, Muskeln).
// Alle Dropdowns erlauben Mehrfachauswahl über ein Häkchen-Bottom-Sheet.
export function Filters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const [sheet, setSheet] = useState(null);     // null | 'phase' | 'region' | 'group' | 'muscle'
  const [moreOpen, setMoreOpen] = useState(false);

  const phases = filters.phases || [];
  const regions = filters.regions || [];
  const groups = filters.groups || [];
  const muscles = filters.muscles || [];

  const activeCount = (regions.length ? 1 : 0) + (groups.length ? 1 : 0) + (muscles.length ? 1 : 0);

  const trigger = (label, onClick, none) => html`
    <button type="button" class="filter-select select-trigger" aria-haspopup="dialog" onClick=${onClick}>
      <span class=${'st-label' + (none ? ' placeholder' : '')}>${label}</span>
      <${Icon} name="down" size=${16} />
    </button>`;

  return html`<div class="filters">
    <div class="search">
      <${Icon} name="search" size=${18} />
      <input
        class="search-input" type="search" placeholder="Übung suchen …"
        value=${filters.search} onInput=${(e) => set({ search: e.target.value })}
      />
    </div>

    <div class="filter-field">
      <span class="filter-field-label">Phase</span>
      ${trigger(fieldLabel(phases, 'Phasen', phaseLabel), () => setSheet('phase'), phases.length === 0)}
    </div>

    <div class="card filter-acc-card">
      <button
        type="button" class="filter-acc-head"
        aria-expanded=${moreOpen} onClick=${() => setMoreOpen(!moreOpen)}
      >
        <span class="filter-acc-title">Weitere Filter</span>
        <span class="iconbtn small"><${Icon} name=${moreOpen ? 'up' : 'down'} size=${20} /></span>
      </button>
      ${moreOpen
        ? html`<div class="filter-acc-body">
            <div class="filter-field">
              <span class="filter-field-label">Körperregion</span>
              ${trigger(fieldLabel(regions, 'Regionen'), () => setSheet('region'), regions.length === 0)}
            </div>
            <div class="filter-field">
              <span class="filter-field-label">Trainingsart</span>
              ${trigger(fieldLabel(groups, 'Arten'), () => setSheet('group'), groups.length === 0)}
            </div>
            <div class="filter-field">
              <span class="filter-field-label">Muskeln</span>
              ${trigger(fieldLabel(muscles, 'Muskeln'), () => setSheet('muscle'), muscles.length === 0)}
            </div>
            ${activeCount > 0
              ? html`<div class="filter-reset">
                  <span>${activeCount} Filter aktiv</span>
                  <button type="button" class="link-btn" onClick=${() => set({ regions: [], groups: [], muscles: [] })}>Zurücksetzen</button>
                </div>`
              : null}
          </div>`
        : null}
    </div>

    ${sheet === 'phase'
      ? html`<${MultiSelectSheet} title="Phase" labelOf=${phaseLabel}
          groups=${[{ title: null, options: PHASE_VALUES }]}
          selected=${phases} onChange=${(v) => set({ phases: v })} onClose=${() => setSheet(null)} />`
      : null}
    ${sheet === 'region'
      ? html`<${MultiSelectSheet} title="Körperregion"
          groups=${[{ title: null, options: REGIONS }]}
          selected=${regions} onChange=${(v) => set({ regions: v })} onClose=${() => setSheet(null)} />`
      : null}
    ${sheet === 'group'
      ? html`<${MultiSelectSheet} title="Trainingsart"
          groups=${[{ title: null, options: GROUPS }]}
          selected=${groups} onChange=${(v) => set({ groups: v })} onClose=${() => setSheet(null)} />`
      : null}
    ${sheet === 'muscle'
      ? html`<${MultiSelectSheet} title="Muskeln" searchable chips
          groups=${REGIONS.map((r) => ({ title: r, options: MUSCLES_BY_REGION[r] }))}
          selected=${muscles} onChange=${(v) => set({ muscles: v })} onClose=${() => setSheet(null)} />`
      : null}
  </div>`;
}

// Bottom-Sheet mit Mehrfachauswahl (Häkchen). „Alle" oben leert die Auswahl.
// Optionen flach (eine Gruppe ohne Titel) oder nach Gruppen mit Titel; optional mit Suche.
function MultiSelectSheet({ title, groups, selected, onChange, onClose, searchable, chips, labelOf = (x) => x }) {
  const [q, setQ] = useState('');
  const [allOff, setAllOff] = useState(false);   // „Alle"-Schalter manuell ausgeschaltet
  const needle = q.trim().toLowerCase();
  const shown = useMemo(
    () => groups
      .map((g) => ({ title: g.title, options: g.options.filter((o) => labelOf(o).toLowerCase().includes(needle)) }))
      .filter((g) => g.options.length > 0),
    [groups, needle]
  );
  const allOn = selected.length === 0 && !allOff;   // „Alle"-Schalter an (keine Einschränkung)
  const toggle = (o) => { setAllOff(false); onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]); };

  return html`<div class="modal-overlay" onClick=${onClose}>
    <div class=${'modal-sheet muscle-sheet' + (chips ? ' tall' : '')} onClick=${(ev) => ev.stopPropagation()}>
      <div class="sheet-head">
        <div class="modal-title">${title}</div>
        <button class="iconbtn small" onClick=${onClose} aria-label="Schließen">
          <${Icon} name="x" size=${18} />
        </button>
      </div>

      ${searchable
        ? html`<div class="search">
            <${Icon} name="search" size=${18} />
            <input
              class="search-input" type="search" placeholder="Muskel suchen …"
              value=${q} onInput=${(e) => setQ(e.target.value)}
            />
          </div>`
        : null}

      <div class="muscle-sheet-list">
        ${chips
          ? html`<div class="ms-all">
              <span>Alle</span>
              <button
                type="button" role="switch" aria-checked=${allOn} aria-label="Alle Muskeln"
                class=${'switch' + (allOn ? ' on' : '')}
                onClick=${() => { if (allOn) setAllOff(true); else { setAllOff(false); onChange([]); } }}
              ></button>
            </div>`
          : html`<button type="button" class=${'muscle-all-row' + (selected.length === 0 ? ' active' : '')} onClick=${() => onChange([])}>
              <span>Alle</span>
              ${selected.length === 0 ? html`<${Icon} name="check" size=${18} />` : null}
            </button>`}
        ${shown.length === 0
          ? html`<p class="hint">Keine Treffer für „${q}“.</p>`
          : shown.map(
              (g) => html`<div class="ms-group" key=${g.title || 'flat'}>
                ${g.title ? html`<div class="muscle-group-title">${g.title}</div>` : null}
                ${chips
                  ? html`<div class="chips">
                      ${g.options.map(
                        (o) => html`<button
                          type="button" key=${o}
                          class=${'chip' + (selected.includes(o) ? ' active' : '')}
                          onClick=${() => toggle(o)}
                        >${labelOf(o)}</button>`
                      )}
                    </div>`
                  : g.options.map(
                      (o) => html`<button
                        type="button" key=${o}
                        class=${'muscle-all-row' + (selected.includes(o) ? ' active' : '')}
                        onClick=${() => toggle(o)}
                      >
                        <span>${labelOf(o)}</span>
                        ${selected.includes(o) ? html`<${Icon} name="check" size=${18} />` : null}
                      </button>`
                    )}
              </div>`
            )}
      </div>

      <button class="btn full" onClick=${onClose}>Auswahl bestätigen</button>
    </div>
  </div>`;
}
