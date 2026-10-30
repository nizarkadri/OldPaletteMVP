import { useCallback, useEffect, useRef, useState } from 'react';
import UploadZone from './components/UploadZone.jsx';
import UiPreview from './components/UiPreview.jsx';
import RoleKanban from './components/RoleKanban.jsx';
import PaletteStrip from './components/PaletteStrip.jsx';
import ExportPanel from './components/ExportPanel.jsx';
import { analyzeScreenshot, fileToBase64 } from './lib/aiAnalysis.js';
import { applyPaletteToElements, resetElementStyles } from './lib/paletteEngine.js';
import { PALETTES } from './lib/palettes.js';

export default function App() {
  // ── Upload / AI analysis state ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);

  // ── Result of the AI call ──
  const [html, setHtml] = useState(null);
  const [elements, setElements] = useState([]);

  // ── Palette cycling state ──
  const [paletteIndex, setPaletteIndex] = useState(0);

  // ── Hover highlight state (from kanban -> preview) ──
  const [highlightedId, setHighlightedId] = useState(null);

  const previewRootRef = useRef(null);
  const hasAnyElements = elements.length > 0;

  // ── Handle upload ──
  const handleFileSelected = useCallback(async (file) => {
    setIsProcessing(true);
    setError(null);
    setStatusMessage('Reading image...');

    try {
      const base64 = await fileToBase64(file);
      setStatusMessage('AI is analyzing the UI...');

      const result = await analyzeScreenshot(base64, file.type || 'image/png');

      setHtml(result.html);
      setElements(result.elements);
      setPaletteIndex(0);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong analyzing the image.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  }, []);

  // ── Apply current palette whenever it changes (or elements change) ──
  useEffect(() => {
    if (!hasAnyElements || !previewRootRef.current) return;
    applyPaletteToElements(elements, PALETTES[paletteIndex], previewRootRef.current);
  }, [paletteIndex, elements, hasAnyElements, html]);

  // ── Role change from kanban drag/drop ──
  function handleChangeRole(elementId, newRole) {
    setElements((prev) =>
      prev.map((el) => (el.id === elementId ? { ...el, role: newRole } : el))
    );
  }

  // ── Keyboard: Space / arrows cycle palettes ──
  useEffect(() => {
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (!hasAnyElements) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setPaletteIndex((i) => (i + 1) % PALETTES.length);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setPaletteIndex((i) => (i + 1) % PALETTES.length);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setPaletteIndex((i) => (i - 1 + PALETTES.length) % PALETTES.length);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasAnyElements]);

  function handleReset() {
    resetElementStyles(elements, previewRootRef.current);
    setHtml(null);
    setElements([]);
    setPaletteIndex(0);
    setError(null);
  }

  const currentPalette = PALETTES[paletteIndex];

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>UI Palette Explorer</h1>
        <p>Upload a screenshot, let AI map its colors to roles, then press Space to explore palettes live.</p>
      </header>

      <div className="app-body">
        <div className="preview-pane">
          {!html ? (
            <UploadZone
              onFileSelected={handleFileSelected}
              isProcessing={isProcessing}
              statusMessage={statusMessage}
            />
          ) : (
            <UiPreview html={html} containerRef={previewRootRef} highlightedId={highlightedId} />
          )}

          {error && (
            <div className="error-banner">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {error}
            </div>
          )}
        </div>

        <aside className="panel-pane">
          <div className="panel-section">
            <h2>1. Element roles</h2>
            <p className="panel-hint">
              {hasAnyElements
                ? 'AI pre-sorted these. Hover to highlight in the preview, drag to recategorize.'
                : 'Upload a screenshot to get started.'}
            </p>
            <RoleKanban
              elements={elements}
              onChangeRole={handleChangeRole}
              onHover={setHighlightedId}
            />
          </div>

          <hr className="divider" />

          <div className="panel-section">
            <h2>2. Cycle palettes</h2>
            <PaletteStrip
              palette={currentPalette}
              index={paletteIndex}
              total={PALETTES.length}
              onPrev={() => setPaletteIndex((i) => (i - 1 + PALETTES.length) % PALETTES.length)}
              onNext={() => setPaletteIndex((i) => (i + 1) % PALETTES.length)}
            />
          </div>

          <hr className="divider" />

          <div className="panel-section">
            <h2>3. Export</h2>
            <ExportPanel palette={currentPalette} />
          </div>

          {html && (
            <button className="reset-link" onClick={handleReset}>
              <i className="ti ti-refresh" aria-hidden="true" /> Start over with a new screenshot
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
