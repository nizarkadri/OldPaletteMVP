import { useState } from 'react';

/**
 * ExportPanel
 * -----------
 * Lets the user copy the current palette as CSS custom properties
 * or as a JSON token object, for pasting into their real codebase.
 */
export default function ExportPanel({ palette }) {
  const [copied, setCopied] = useState(null);

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  function cssText() {
    return [
      `/* ${palette.name} */`,
      `--color-primary: ${palette.primary};`,
      `--color-secondary: ${palette.secondary};`,
      `--color-accent: ${palette.accent};`,
      `--color-text: ${palette.text};`,
      `--color-text-muted: ${palette.textMuted};`,
      `--color-on-accent: ${palette.onAccent};`,
    ].join('\n');
  }

  function jsonText() {
    return JSON.stringify(
      {
        palette: palette.name,
        colors: {
          primary: palette.primary,
          secondary: palette.secondary,
          accent: palette.accent,
          text: palette.text,
          textMuted: palette.textMuted,
          onAccent: palette.onAccent,
        },
      },
      null,
      2
    );
  }

  return (
    <div className="export-row">
      <button className="action-btn" onClick={() => copy(cssText(), 'css')}>
        <i className="ti ti-copy" aria-hidden="true" />
        {copied === 'css' ? 'Copied!' : 'Copy CSS'}
      </button>
      <button className="action-btn" onClick={() => copy(jsonText(), 'json')}>
        <i className="ti ti-braces" aria-hidden="true" />
        {copied === 'json' ? 'Copied!' : 'Copy JSON'}
      </button>
    </div>
  );
}
