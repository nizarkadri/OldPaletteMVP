/**
 * PaletteStrip
 * ------------
 * Shows the current palette's swatches, name, and position.
 * Clicking a swatch in the strip jumps directly to that palette
 * (the strip itself doesn't change per-palette — it's a fixed
 * preview row showing primary/secondary/accent/text for the
 * CURRENT palette only).
 */
export default function PaletteStrip({ palette, index, total, onPrev, onNext }) {
  return (
    <div className="palette-strip-wrap">
      <div className="palette-strip">
        <div style={{ background: palette.primary }} title={`Primary: ${palette.primary}`} />
        <div style={{ background: palette.secondary }} title={`Secondary: ${palette.secondary}`} />
        <div style={{ background: palette.accent }} title={`Accent: ${palette.accent}`} />
        <div style={{ background: palette.text }} title={`Text: ${palette.text}`} />
      </div>

      <div className="palette-meta">
        <button className="palette-nav-btn" onClick={onPrev} aria-label="Previous palette">
          <i className="ti ti-chevron-left" aria-hidden="true" />
        </button>
        <div className="palette-info">
          <div className="palette-name">{palette.name}</div>
          <div className="palette-counter">{index + 1} of {total}</div>
        </div>
        <button className="palette-nav-btn" onClick={onNext} aria-label="Next palette">
          <i className="ti ti-chevron-right" aria-hidden="true" />
        </button>
      </div>

      <div className="palette-kbd-hint">
        <kbd>Space</kbd> next &nbsp;·&nbsp; <kbd>←</kbd> <kbd>→</kbd> step
      </div>
    </div>
  );
}
