import { html } from '../../html.js';
import { MUSCLES_BY_REGION, REGIONS } from '../../constants.js';

// Sammeleintrag für „ganze Region": ein einzelner Tag „<Region> (gesamt)" statt aller Einzelmuskeln.
export function regionAllTag(region) { return `${region} (gesamt)`; }

// Mehrfachauswahl von Muskelgruppen, gruppiert nach Region, begrenzt auf max (Standard 3).
// „Ganze Region" setzt EINEN Sammeleintrag (zählt als 1) und blendet die Einzel-Chips der Region aus.
export function MuscleSelect({ value, onChange, max = 3 }) {
  const toggle = (m) => {
    if (value.includes(m)) onChange(value.filter((x) => x !== m));
    else if (value.length < max) onChange([...value, m]);
  };
  const toggleRegion = (region) => {
    const tag = regionAllTag(region);
    if (value.includes(tag)) {
      onChange(value.filter((x) => x !== tag));
    } else {
      // Einzelmuskeln dieser Region entfernen (redundant), Sammeleintrag hinzufügen – sofern Platz
      const cleaned = value.filter((x) => !MUSCLES_BY_REGION[region].includes(x));
      if (cleaned.length < max) onChange([...cleaned, tag]);
    }
  };
  return html`<div class="muscle-select">
    ${REGIONS.map((region) => {
      const tag = regionAllTag(region);
      const wholeActive = value.includes(tag);
      return html`<div class="muscle-group" key=${region}>
        <div class="muscle-group-head">
          <div class="muscle-group-title">${region}</div>
          <button type="button" class=${'region-all' + (wholeActive ? ' active' : '')}
            onClick=${() => toggleRegion(region)}>Ganze Region</button>
        </div>
        ${wholeActive
          ? html`<div class="region-all-note">Als „${tag}" ausgewählt</div>`
          : html`<div class="chips">
              ${MUSCLES_BY_REGION[region].map((m) => {
                const selected = value.includes(m);
                const disabled = !selected && value.length >= max;
                return html`<button
                  type="button" key=${m}
                  class=${'chip' + (selected ? ' active' : '') + (disabled ? ' disabled' : '')}
                  onClick=${() => toggle(m)}
                >${m}</button>`;
              })}
            </div>`}
      </div>`;
    })}
  </div>`;
}
