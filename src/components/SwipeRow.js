import { html } from '../html.js';
import { useState, useRef } from 'preact/hooks';
import { Icon } from './Icon.js';

// Zeile mit „nach links wischen" → rotes Papierkorb-Symbol → onDelete.
// Ein Tipp (ohne nennenswerte Horizontalbewegung) bleibt ein normaler Klick,
// damit innenliegende Buttons (Play/Erfassen) weiter funktionieren.
export function SwipeRow({ children, onDelete }) {
  const REVEAL = 76;
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
    <button class="swipe-del" style=${`width:${REVEAL}px`} onClick=${() => { setDx(0); onDelete(); }} aria-label="Löschen">
      <${Icon} name="trash" size=${20} />
    </button>
    <div class=${'swipe-content' + (dragging ? ' dragging' : '')} style=${`transform:translateX(${dx}px)`}
      onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}>
      ${children}
    </div>
  </div>`;
}
