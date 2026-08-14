# Figma — variables, component sets, Code Connect

Everything in this folder is generated from the code. Re-run
`tools/build_figma_export.py` after changing an element.

---

## 1 · Variables

Two routes. Take whichever your Figma account allows.

### Route A — native JSON import (no plugin)

Figma's native variable import/export follows the W3C design-tokens spec and is
rolling out through 2026; it may or may not be switched on for your account yet.
Check **Variables panel → the ⋯ menu → Import**. If it is there, drop in
`figma/tokens.json` and you are done.

### Route B — Figma Agent (no plugin, works today)

Open the design file, start the Agent, and paste the prompt below. It creates
one collection with grouped variables whose names match the CSS exactly, so a
later switch to native import will line up.

Do it in three passes — colours, then numbers, then motion. One pass per
prompt; the Agent is reliable on a narrow task and unreliable on a broad one.

---

## 2 · Elements → component sets

`figma-export/` holds one file per element: the component and its states, and
nothing else. Import them **one at a time** with html.to.design:

| Option | Setting |
|---|---|
| Viewport width | 1200 |
| Import as | Layers (not image) |
| Auto Layout detection | ON |
| Preserve class names | ON |
| Load fonts | ON |
| Inline SVG as vector | ON |

Then select the imported frame and run the component-set prompt.

---

## 3 · Code Connect

Links a Figma component to the CSS class that implements it, so Dev Mode shows
the real class name instead of generated CSS.

**What you do:** open the file in Figma **Desktop**, turn on Dev Mode MCP
(Figma menu → Preferences → Enable Dev Mode MCP Server), and tell me it is on.

**What I do:** call `get_code_connect_suggestions` to see which components are
unmapped, build the mapping from the component name to the class and file
(`el-05 StatusBadge` → `.badge` in `assets/elements.css`), and push it with
`send_code_connect_mappings`. It is a few minutes of my time, not yours.

The mapping is stored in the Figma file, so anyone opening Dev Mode sees it.

---
