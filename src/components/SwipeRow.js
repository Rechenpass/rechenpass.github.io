import { html } from '../html.js';
import { useState, useRef } from 'preact/hooks';
import { Icon } from './Icon.js';

// Zeile mit „nach links wischen" → enthüllt Aktions-Buttons rechts.
// Standard: ein roter Papierkorb (onDelete). Optional `actions` = [{ icon, label, onClick, cls }]
// für mehrere Aktionen (z. B. Edit · Reset · Löschen bei erledigten Einheiten).
// Ein Tipp (ohne nennenswerte Horizontalbewegung) bleibt ein normaler Klick,
// damit innenliegende Buttons (Play/Erfassen) weiter funktionieren.
export function SwipeRow({ children, onDelete, actions }) {
  const acts = (actions && actions.length)
    ? actions
    : [{ icon: 'trash', label: 'Löschen', onClick: onDelete, cls: 'del' }];
  const BTN = 56; // Slot-Breite je Aktion (Kreis + Abstand)
  const REVEAL = acts.length * BTN;
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const st = useRef(null);

  const down = (e) => { st.current = { x0: e.clientX, base: dx, active: false, id: e.pointerId, el: e.currentTarget }; };
  const move = (e) => {
    const s = st.current; if (!s) return;
    const delta = e.clientX - s.x0;
    if (!s.active) {
      if (Math.abs(delta) < 6) return; // erst ab kleiner Schwelle = Wischen
      s.active = true; setDragging(true);
      try { s.el.setPointerCapture(s.id); } catch (_) { /* egal */ }
    }
    setDx(Math.max(-REVEAL, Math.min(0, s.base + delta)));
  };
  const up = () => {
    const s = st.current; if (!s) return;
    if (s.active) { try { s.el.releasePointerCapture(s.id); } catch (_) { /* egal */ } }
    const wasActive = s.active;
    st.current = null; setDragging(false);
    if (wasActive) setDx((cur) => (cur < -REVEAL / 2 ? -REVEAL : 0));
  };

  return html`<div class="swipe-row">
    <div class="swipe-actions" style=${`width:${REVEAL}px`}>
      ${acts.map((a) => html`<button key=${a.label} class=${'swipe-act ' + (a.cls || '')}
        onClick=${() => { setDx(0); a.onClick && a.onClick(); }} aria-label=${a.label}>
        <${Icon} name=${a.icon} size=${20} />
      </button>`)}
    </div>
    <div class=${'swipe-content' + (dragging ? ' dragging' : '')} style=${`transform:translateX(${dx}px)`}
      onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}>
      ${children}
    </div>
  </div>`;
}
