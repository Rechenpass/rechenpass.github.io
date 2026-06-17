import { html } from '../html.js';

// Schlichte Strich-Icons (24×24). Einzelne Icons bringen eigene Füllung mit.
const INNER = {
  dumbbell:
    '<line x1="9" y1="12" x2="15" y2="12"/><rect x="4.5" y="8" width="3" height="8" rx="1"/><rect x="16.5" y="8" width="3" height="8" rx="1"/><line x1="2.5" y1="10" x2="2.5" y2="14"/><line x1="21.5" y1="10" x2="21.5" y2="14"/>',
  list:
    '<line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  play: '<polygon points="8,5 19,12 8,19"/>',
  calendar:
    '<rect x="3" y="4.5" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2.5" x2="8" y2="6"/><line x1="16" y1="2.5" x2="16" y2="6"/>',
  chart:
    '<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="11" width="3" height="9"/><rect x="11" y="7" width="3" height="13"/><rect x="16" y="14" width="3" height="6"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>',
  trash:
    '<polyline points="3,6 5,6 21,6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  back: '<polyline points="15,18 9,12 15,6"/>',
  check: '<polyline points="20,6 9,17 4,12"/>',
  up: '<polyline points="18,15 12,9 6,15"/>',
  down: '<polyline points="6,9 12,15 18,9"/>',
  x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.3"/><circle cx="18.5" cy="17.5" r="3.3"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  manage: '<polygon points="12 3 21 8 12 13 3 8"/><polyline points="3 12 12 17 21 12"/><polyline points="3 16 12 21 21 16"/>',
  forward: '<polyline points="9 6 15 12 9 18"/>',
  alert: '<path d="M10.3 4.2 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7.5 12 12 15 13.5"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 7 7 7"/>',
  // Lotusblüte (5 Blätter, Outline) – Stil wie dumbbell/bike.
  yoga: '<path d="M12 17 C10.2 13 10.2 8 12 4 C13.8 8 13.8 13 12 17 Z"/><path d="M12 17 C12.2 13 13.8 9.5 15.8 6.8 C17 9.5 16.2 13.5 12 17 Z"/><path d="M12 17 C11.8 13 10.2 9.5 8.2 6.8 C7 9.5 7.8 13.5 12 17 Z"/><path d="M12 17 C13.5 14 16.5 12 19.5 10.5 C19.8 13.5 17 15.8 12 17 Z"/><path d="M12 17 C10.5 14 7.5 12 4.5 10.5 C4.2 13.5 7 15.8 12 17 Z"/>',
};

export function Icon({ name, size = 22, stroke = 2 }) {
  return html`<svg
    xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width=${stroke}
    stroke-linecap="round" stroke-linejoin="round" class="icon" aria-hidden="true"
    dangerouslySetInnerHTML=${{ __html: INNER[name] || '' }}></svg>`;
}
