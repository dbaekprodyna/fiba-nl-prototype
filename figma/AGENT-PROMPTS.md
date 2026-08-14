# Figma Agent prompts

Paste one at a time. Keep the selection small — the Agent is dependable on a
narrow task and unreliable on a broad one. Verify after each prompt before
running the next.

---

## P1 · Colour variables

```
Create a variable collection named "FIBA NL" with a single mode named "Light".
Add these COLOR variables, using the slash in each name to create groups.
Do not add any variables I have not listed, and do not rename anything.

**Surfaces**
- `surface/page` = `#FFFFFF`
- `surface/raised` = `#FAFAFA`
- `surface/sunken` = `#F5F5F5`
- `surface/sunken-2` = `#E5E5E5`

**Borders**
- `border/subtle` = `#E5E5E5`
- `border/default` = `#D4D4D4`
- `border/strong` = `#A3A3A3`

**Text**
- `text/primary` = `#0A0A0A`
- `text/secondary` = `#525252`
- `text/muted` = `#737373`
- `text/disabled` = `#A3A3A3`
- `text/inverse` = `#FFFFFF`

**Actions**
- `action/default` = `#000000`
- `action/hover` = `#262626`
- `action/pressed` = `#404040`
- `action/disabled` = `#D4D4D4`
- `action/ghost-bg` = `#F5F5F5`

**Status**
- `status/live` = `#E30613`
- `status/qualified` = `#009A3E`
- `status/shortlisted` = `#F9B123`
- `status/neutral` = `#737373`

**Site chrome (dark bars)**
- `chrome/bg` = `#171717`
- `chrome/bg-2` = `#262626`
- `chrome/text` = `#FFFFFF`
- `chrome/text-muted` = `#A3A3A3`
- `chrome/line` = `#262626`
- `chrome/accent` = `#DBC068`
- `chrome/hover` = `#2E2E2E`

```

## P2 · Number variables

```
In the existing "FIBA NL" collection, add these NUMBER variables.
Values are in pixels — enter the number only.

**Other**
- `space/1` = `4px`
- `space/2` = `8px`
- `space/3` = `12px`
- `space/4` = `16px`
- `space/5` = `24px`
- `space/6` = `32px`
- `space/7` = `48px`
- `space/8` = `64px`
- `space/9` = `96px`
- `cut/s` = `8px`
- `cut/m` = `12px`
- `cut/l` = `16px`

**Layout**
- `content/max` = `1440px`
- `gutter` = `240px`

```

## P3 · Motion variables

```
In the existing "FIBA NL" collection, add these variables as NUMBER
(milliseconds) and STRING (easing curve) respectively.

**Motion**
- `dur/fast` = `120ms`
- `dur/base` = `200ms`
- `dur/slow` = `360ms`
- `dur/page` = `480ms`
- `ease/out` = `cubic-bezier(0.22, 1, 0.36, 1)`
- `ease/in-out` = `cubic-bezier(0.65, 0, 0.35, 1)`

```

---

## P4 · One element → one component set

Select the imported element frame, then:

```
This frame documents one component of a design system. Each labelled row is a
STATE of the same component, not a separate component.

1. For every row, read the small uppercase label above it. That label is the
   state name.
2. Turn the row's artwork into a component.
3. Combine all of those components into a single component set named exactly
   the title shown at the top of the frame, for example "ctl-01 Button".
4. Give the component set one variant property named "state", with the values
   taken from the labels, lowercased and hyphenated: default, hover, focus,
   active, disabled, and so on.
5. Where a label describes a second dimension — a size such as "S 32 / M 40 /
   L 48", or a variant such as "primary / outline / ghost" — add that as its
   own property named "size" or "variant" rather than folding it into "state".
6. Bind every fill, stroke and text colour to the matching variable in the
   "FIBA NL" collection. Match by value: if a fill is #262626, bind it to
   action/hover. Never leave a hard-coded colour behind.
7. Do not change any size, spacing or corner geometry. Keep Auto Layout exactly
   as imported.

Report which colours you could not match to a variable.
```

## P5 · Layer clean-up (run before P4 if layer names are noisy)

```
Rename layers in this frame so that each layer takes the name of its first CSS
class, dropping the utility classes "cut", "cut-s", "cut-m", "cut-l",
"cut-out" and "cutfill". Do not change structure, order or geometry.
```

## P6 · Verification (run this yourself, or ask me to)

After each batch, tell me and I will check the file over the Dev Mode MCP:
layer structure and Auto Layout with `get_metadata`, and variable binding with
`get_variable_defs`. That replaces eyeballing every component.

---

## Known limits

- The 45° corner cut is a CSS `clip-path`. Figma cannot reproduce it as a
  resizable shape without the `el-00 CutSurface` boolean-subtract component.
  Build that once by hand, use it in the element library, and do **not**
  propagate it into modules and templates — the maintenance cost is far larger
  than the documentation value. The cut is specified in Foundations.
- Do not ask the Agent to componentise a whole page. One element per prompt.
- The Agent does not preserve pixel precision. Verify sizes after each pass.
