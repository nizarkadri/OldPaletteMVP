# UI Palette Explorer — MVP

Upload a screenshot of an app or website. Claude recreates it as simplified
HTML and categorizes every recolorable element as **Primary**, **Secondary**,
or **Accent**. From there, everything is free and instant: drag elements
between roles, hover to highlight them in the preview, and press **Space**
to cycle through curated palettes applied live with zero further API calls.

## Architecture

```
Upload screenshot
      │
      ▼
ONE Claude API call (src/lib/aiAnalysis.js)
      │
      ├─► recreated HTML (classes = recolorable groups)
      └─► element list: [{ id, label, role, swatch }]
      │
      ▼
React state (src/App.jsx)
      │
      ├─► RoleKanban — drag/drop to recategorize, hover to highlight
      ├─► UiPreview  — renders the recreated HTML, applies highlight class
      └─► PaletteStrip / Space key — cycles PALETTES (src/lib/palettes.js)
                │
                ▼
      applyPaletteToElements (src/lib/paletteEngine.js)
      — pure DOM style updates, no re-render, no API call
```

## Project structure

```
src/
  App.jsx                 Main component, wires everything together
  main.jsx                React entry point
  components/
    UploadZone.jsx        Drag-and-drop screenshot upload
    UiPreview.jsx         Renders AI-generated HTML, handles highlight
    RoleKanban.jsx         Primary/Secondary/Accent drag-and-drop columns
    PaletteStrip.jsx       Current palette swatches + prev/next controls
    ExportPanel.jsx        Copy CSS vars / JSON tokens
  lib/
    aiAnalysis.js          The ONE Claude API call (screenshot -> HTML + roles)
    paletteEngine.js        Applies a palette to elements via inline styles
    palettes.js             Curated palette definitions (12 included)
  styles/
    global.css              All styles
```

## Running locally

```bash
npm install
npm run dev
```

Requires a way to reach `https://api.anthropic.com/v1/messages` — either
proxy this through your own backend (recommended, so you don't expose an
API key client-side) or run behind an environment that injects credentials
server-side.

## How the AI call works

`analyzeScreenshot()` sends the image + a system prompt instructing Claude to:

1. Recreate the UI as simplified static HTML/CSS (no JS, no real images —
   placeholders only), using descriptive class names. Repeated elements
   (post cards, list rows, icon chips) share the same class so they recolor
   as a group.
2. Return a flat JSON array of those class names with a human label, a
   best-guess role (`primary` / `secondary` / `accent`), and the element's
   approximate current color (`swatch`).

The frontend never needs to call AI again after this — palette cycling,
recategorization, and export are all pure client-side logic.

## Extending this MVP

- **More palettes**: add entries to `src/lib/palettes.js`. Each needs
  `primary`, `secondary`, `accent`, `text`, `textMuted`, `onAccent`.
- **AI-suggested palettes**: instead of (or alongside) the curated list,
  ask Claude to generate palettes based on a text prompt (app niche, mood,
  light/dark) — same shape as `PALETTES` entries, still applied via
  `applyPaletteToElements`.
- **Complex elements (charts, illustrations)**: for elements too complex to
  recreate as flat HTML, have the AI return an inline SVG with named CSS
  variables for its key colors (e.g. `fill: var(--chart-accent)`), generated
  once on upload. `applyPaletteToElements` can be extended to set those SVG
  custom properties the same way it sets element styles.
- **Persisting results**: save `{ html, elements, paletteIndex }` to
  localStorage or a backend so users can return to a session.
