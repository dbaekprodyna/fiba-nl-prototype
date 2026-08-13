# FIBA 3x3 Nations League — Website Prototype

Interactive prototype for the FIBA 3x3 Nations League site redesign (pitch, 2026).
Static site — no build step, no dependencies. Deployed via GitHub Pages.

**Live:** `https://<account>.github.io/fiba-nl-prototype/`

## Structure

```
index.html …            14 screen templates (T · Home, T · Conferences, …)
partials/               header / nav / footer — edited once, applied everywhere
assets/
  tokens.css            colours, spacing, type scale — mirrors Figma Variables
  base.css              reset, typography, 45° cut treatment
  modules.css           one section per module ID (F-02, S-01, R-02 …)
  motion.css            transitions & animations, all timings as variables
  app.js                nav, tabs, accordion, filters, page transitions
  data.js               all content (teams, standings, games, news)
system/                 design system specimen sheets (foundations → templates)
```

## Editing

| Change requested | File to edit |
|---|---|
| Colour / spacing / type | `assets/tokens.css` |
| Content (teams, scores, news) | `assets/data.js` |
| Section order on a screen | that screen's `.html` |
| Header, nav or footer | `partials/` |
| Animation timing | `assets/motion.css` |

## Local preview

Partials are loaded via `fetch`, so open through a local server rather than
double-clicking the file:

```
cd fiba-nl-prototype && python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publishing changes

GitHub Desktop → review changes → Commit to `main` → Push origin.
Live in about a minute at the same URL.

## Notes

- All pages carry `<meta name="robots" content="noindex">`. The Pages URL is
  public to anyone who has it — treat it as unlisted, not private.
- No framework, no bundler. Everything here is directly readable as a
  handover spec for the implementing development team.
