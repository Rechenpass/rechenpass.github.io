import { html } from '../html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon } from './Icon.js';

// Globaler Bestätigungs-Dialog als Bottom-Sheet – ersetzt die nativen confirm()-Fenster.
// Wird EINMAL neben der App gerendert (app.js); jede Stelle ruft einfach
// confirmAsk({ title, message, confirmLabel, icon, onConfirm }) auf.
let current = null;
const listeners = new Set();

export function confirmAsk(config) { current = config; listeners.forEach((f) => f()); }
function close() { current = null; listeners.forEach((f) => f()); }

export function ConfirmHost() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  if (!current) return null;
  const c = current;
  return html`<div class="modal-overlay" onClick=${close}>
    <div class="modal-sheet" onClick=${(ev) => ev.stopPropagation()}>
      <div class="sheet-head">
        <div class="modal-title">${c.title || 'Bestätigen'}</div>
        <button class="iconbtn small" onClick=${close} aria-label="Schließen"><${Icon} name="x" size=${18} /></button>
      </div>
      ${c.message ? html`<p class="hint">${c.message}</p>` : null}
      <button class="modal-opt" onClick=${() => { const f = c.onConfirm; close(); if (f) f(); }}>
        <${Icon} name=${c.icon || 'trash'} size=${18} /> ${c.confirmLabel || 'Löschen'}
      </button>
      <button class="btn full" onClick=${close}>Abbrechen</button>
    </div>
  </div>`;
}
