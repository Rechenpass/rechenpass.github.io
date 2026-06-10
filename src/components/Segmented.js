import { html } from '../html.js';

// Segmentierte Auswahl für kleine Optionslisten.
// options: Array aus Strings oder { value, label }.
export function Segmented({ options, value, onChange, wrap = false }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return html`<div class=${'segmented' + (wrap ? ' wrap' : '')}>
    ${opts.map((o) => html`
      <button
        type="button"
        class=${'seg' + (o.value === value ? ' active' : '')}
        onClick=${() => onChange(o.value)}
      >${o.label}</button>`)}
  </div>`;
}
