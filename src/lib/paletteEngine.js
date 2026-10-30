/**
 * applyPaletteToElements
 * -----------------------
 * Given the list of AI-identified elements (each with an `id` matching a
 * CSS class in the recreated HTML, and a `role` of primary/secondary/accent)
 * and a palette, sets inline CSS custom properties on every matching DOM
 * node so the recreated UI recolors instantly.
 *
 * This runs on every Space/arrow-key press. It's pure DOM manipulation —
 * no network calls, no re-render of the AI HTML itself.
 *
 * Color assignment rules per role:
 *   primary   -> background-color: palette.primary,  color: palette.text
 *   secondary -> background-color: palette.secondary, color: palette.text
 *   accent    -> background-color: palette.accent,    color: palette.onAccent
 *                (if the element looks text-only, color is set instead of bg)
 *
 * Elements are classified as "text-like" vs "surface-like" heuristically:
 * if the element's own background is transparent/none in the recreated
 * HTML (i.e. it's just a text node), we recolor its `color` instead of
 * `background-color`. We detect this once per element on first apply and
 * cache the result.
 */

const textLikeCache = new WeakMap();

function isTextLike(el) {
  if (textLikeCache.has(el)) return textLikeCache.get(el);
  const computed = window.getComputedStyle(el);
  const bg = computed.backgroundColor;
  const isTransparent =
    bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)' || bg === '';
  // Elements with no children (or only text) and transparent bg are text-like
  const hasOnlyTextOrInline =
    el.children.length === 0 ||
    Array.from(el.children).every((c) =>
      ['SPAN', 'I', 'B', 'STRONG', 'EM'].includes(c.tagName)
    );
  const result = isTransparent && hasOnlyTextOrInline;
  textLikeCache.set(el, result);
  return result;
}

/**
 * @param {Array<{id: string, role: 'primary'|'secondary'|'accent'}>} elements
 * @param {object} palette - one entry from PALETTES
 * @param {HTMLElement} root - the container element holding the recreated HTML
 */
export function applyPaletteToElements(elements, palette, root) {
  if (!root) return;

  elements.forEach(({ id, role }) => {
    const matches = root.querySelectorAll(`.${cssEscape(id)}`);
    matches.forEach((el) => {
      switch (role) {
        case 'primary':
          if (isTextLike(el)) {
            el.style.color = palette.text;
          } else {
            el.style.backgroundColor = palette.primary;
            el.style.color = palette.text;
          }
          break;

        case 'secondary':
          if (isTextLike(el)) {
            el.style.color = palette.textMuted;
          } else {
            el.style.backgroundColor = palette.secondary;
            el.style.color = palette.text;
          }
          break;

        case 'accent':
          if (isTextLike(el)) {
            el.style.color = palette.accent;
          } else {
            el.style.backgroundColor = palette.accent;
            el.style.color = palette.onAccent;
            // also recolor any icon-like children that inherit color
            el.querySelectorAll('i').forEach((icon) => {
              icon.style.color = palette.onAccent;
            });
          }
          break;

        default:
          break;
      }

      // Also recolor border color to match role surface, if a border is set
      const computed = window.getComputedStyle(el);
      if (computed.borderWidth !== '0px' && computed.borderStyle !== 'none') {
        if (role === 'accent') {
          el.style.borderColor = palette.accent;
        } else if (role === 'secondary') {
          el.style.borderColor = palette.secondary;
        } else {
          el.style.borderColor = palette.primary;
        }
      }
    });
  });
}

/**
 * Reset all inline color/background/border styles previously applied,
 * restoring elements to whatever the AI-generated HTML originally specified
 * (i.e. nothing, since we instruct the AI not to hardcode colors).
 */
export function resetElementStyles(elements, root) {
  if (!root) return;
  elements.forEach(({ id }) => {
    const matches = root.querySelectorAll(`.${cssEscape(id)}`);
    matches.forEach((el) => {
      el.style.backgroundColor = '';
      el.style.color = '';
      el.style.borderColor = '';
      el.querySelectorAll('i').forEach((icon) => {
        icon.style.color = '';
      });
    });
  });
  textLikeCache.clear?.(); // WeakMap has no clear in some envs; ignore if unsupported
}

/**
 * Minimal CSS.escape polyfill for class names with unusual characters.
 */
function cssEscape(value) {
  if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
  return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}
