import { html } from '../html.js';
import { useRef, useLayoutEffect } from 'preact/hooks';

// Textarea, die mit dem Inhalt mitwächst – volle Höhe, kein Scrollbalken.
// Höhe wird bei jeder Wertänderung an den Inhalt angepasst (scrollHeight).
export function AutoTextarea({ value, onInput, placeholder, rows = 2 }) {
  const ref = useRef(null);
  const fit = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    // scrollHeight enthält nur Inhalt + Padding; bei box-sizing: border-box muss
    // der Rahmen addiert werden, sonst wird der Inhalt um die Rahmenbreite beschnitten.
    const cs = window.getComputedStyle(el);
    const border = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    el.style.height = (el.scrollHeight + border) + 'px';
  };
  useLayoutEffect(() => { fit(ref.current); }, [value]);
  return html`<textarea
    ref=${ref}
    class="input autogrow"
    rows=${rows}
    placeholder=${placeholder || ''}
    value=${value}
    onInput=${(e) => { fit(e.target); onInput && onInput(e); }}
  ></textarea>`;
}
