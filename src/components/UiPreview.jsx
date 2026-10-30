import { useEffect, useRef } from 'react';

/**
 * UiPreview
 * ---------
 * Renders the AI-recreated HTML inside a phone-style frame.
 * Exposes its root DOM node via `containerRef` so the parent can:
 *  - run `applyPaletteToElements` on it
 *  - highlight elements by class name on hover (see `highlightedId`)
 */
export default function UiPreview({ html, containerRef, highlightedId }) {
  const wrapperRef = useRef(null);

  // Apply / remove highlight outline when highlightedId changes
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // clear previous highlights
    root.querySelectorAll('.pe-highlight').forEach((el) => {
      el.classList.remove('pe-highlight');
    });

    if (highlightedId) {
      const escaped = window.CSS?.escape ? window.CSS.escape(highlightedId) : highlightedId;
      root.querySelectorAll(`.${escaped}`).forEach((el) => {
        el.classList.add('pe-highlight');
      });
    }
  }, [highlightedId, containerRef]);

  return (
    <div className="phone-frame">
      <div className="dynamic-island" />
      <div
        className="phone-screen"
        ref={(node) => {
          wrapperRef.current = node;
          containerRef.current = node;
        }}
        // The AI returns plain HTML/CSS markup (no scripts) describing the
        // recreated UI. It is rendered directly so the kanban panel can
        // target its elements by class name for recoloring + highlighting.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
