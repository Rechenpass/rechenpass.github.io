import { html } from '../html.js';
import { Icon } from './Icon.js';

const TABS = [
  { key: 'heute', label: 'Dashboard', icon: 'home' },
  { key: 'training', label: 'Training', icon: 'play' },
  { key: 'week', label: 'Woche', icon: 'calendar' },
  { key: 'stats', label: 'Statistik', icon: 'chart' },
  { key: 'manage', label: 'Bibliothek', icon: 'manage' },
];

export function BottomNav({ active, onChange }) {
  return html`<nav class="bottomnav">
    ${TABS.map((t) => html`
      <button
        class=${'navbtn' + (active === t.key ? ' active' : '')}
        onClick=${() => onChange(t.key)}
        aria-current=${active === t.key ? 'page' : null}
      >
        <${Icon} name=${t.icon} size=${22} />
        <span>${t.label}</span>
      </button>`)}
  </nav>`;
}
