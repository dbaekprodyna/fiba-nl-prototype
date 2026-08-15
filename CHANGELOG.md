# Changelog

## 2026-08-15 — B-1: navigation

**F-05 MegaMenu** opens from More on every page. **E-11 search** opens from the
magnifier as a full-screen overlay whose field fills the content column, and it
searches federations, players and news as you type. Escape or Close dismisses
either.

Both live in `partials/` — extracted from the specimen sheets, so they are the
documented modules rather than a second copy — and are injected once per page
instead of being duplicated into fourteen files. Editing the menu is one file.

T · Search already *is* the overlay, so that page wires the one it has instead
of stacking a second copy; its Close goes back.

- Header — 48px between the wordmark and the navigation.
- "How it works" links to About.
- Section rhythm — `.tpl-content` now carries the same gap between every
  section *and* below the last one, so the footer no longer butts against the
  final block.

## 2026-08-14 — The inner rectangle, and 226 games that were already here

### The focus ring, root cause

Safari paints a **native bezel** inside every `<input>`, and a rounded one on
`type="search"`. `border: 0` and `outline: 0` do not remove it — only
`appearance: none` does. That bezel is the inner rectangle that has been
sitting next to the focus ring for four rounds. Chrome does not draw it, which
is why it looked correct every time I checked.

The clue was in my own diagnostics: the computed style reported
`appearance: auto` and I read past it.

Every input inside `.live` now has `appearance: none`, plus the WebKit search
decoration pseudo-elements are suppressed. The `@property` registration of the
cut lengths from the last round stays — it is a real robustness fix.

### 226 games were in snapshot 2 all along

`games.summary` held 226 games across 17 stops with pool, round, court,
tip-off and both scores. My extractor tested the wrong key and reported the
slice as empty, so two rounds of "we need another data pass" were unnecessary.

`games.json` is now built and wired: the Stop page and the Conference page show
real fixtures with real scores, winner and loser styled from the result.

A game summary carries no `eventId` — the category does — so games are joined
to their stop through `categoryId`.

### Also

- F-03m — the inline `style` on the stage was overriding the stylesheet, which
  is why `height: 848px` never took. The inline value is 848px now.
- S-09 — number-to-label spacing halved.

## 2026-08-14 — Focus ring root cause, flag and roster bugs

### The double stroke, finally

The cut is built from **untyped** custom properties, so the browser has to
substitute `calc(8px - 0.586 * 2px)` as raw text inside `polygon()`. Chrome
resolves it; other engines treat it as invalid and fall back to a **rectangle** —
which is exactly the second black stroke that kept coming back on ctl-04 and
el-11. In my browser it always looked correct, which is why three rounds of
fixes did nothing.

`--c`, `--n` and `--ic` are now registered with `@property` as `<length>`, so
they compute to real lengths before substitution, plus an `@supports` fallback.

### Two real prototype bugs

- `flag(document.body, ioc)` repainted **every** flag on the page with one
  country — the results table and the game log all showed the selected team's
  flag. `flag()` now refuses to walk the document; header calls are scoped to
  the header.
- A team's roster merged every player the federation had fielded all season, so
  Kenya showed 16 instead of 4. A 3x3 squad is four players at one stop; the
  page shows the most recent squad.

### Design system

- Foundations block titles renamed: **Grid** and **Breakpoints**.
- Notes have their padding back instead of text against the container edge.
- S-09: column gap halved, the black and red bars overlap by 8px.
- F-03m: 848px tall.
- Prototype ↗ opens in a new tab.

### Added

`MOTA-TASKLIST-STATUS.md` — all 36 tasks from the designer task list checked
against the build: 20 done, 9 pending (all interaction wiring plus the
Qualification specification), 3 blocked on game data, 2 open questions.

## 2026-08-14 — The prototype

14 screens, built from the approved templates and filled with the real season.

`tools/build_pages.py` lifts each T · block out of `04-templates.html` as a
standalone page — the markup is the design, untouched — wires the navigation
and marks the body `.live`, so every interaction the design system documents
works on the real site.

`assets/site.js` finds each module in the page and rewrites its rows from
`assets/data/*.json`. Nothing is hard-coded into the HTML, so a change to a
component in the design system shows up here with no edits.

| screen | what is real |
|---|---|
| Home | live conferences with standings, qualification board, news, photo carousel, season counts |
| Conferences | 18 conferences grouped by region |
| Conference | stop timeline, conference standings |
| Stop | venue, pools with seeds and records |
| Standings | season federation table built from every stop |
| Teams | every federation, A–Z, letters without entries disabled |
| Team | roster as player cards, season totals |
| Player | name, federation, ranking points |
| Stats | ranking leaderboard |
| News · Article | three real articles with Cloudinary images |
| Calendar | 108 stops by month |
| Search | federation results |

**Routing** is by query string — `conference.html?id=africa-east`,
`stop.html?id=africa-east-stop-1`, `team.html?ioc=KEN`, `player.html?id=<uuid>`.
No page is generated per record, so 711 players cost one file.

**Flags** are real: 230 IOC SVGs from the brand assets, swapped in by IOC code.
67 of the 68 codes in the data have one; New Caledonia (CAL) falls back to a
grey disc.

**Photographs** come straight from Cloudinary with the crop and width as URL
parameters — no images in the repo.

Game scores are still missing from the snapshot, so the fixture tables on Stop
and the game log on Player are dimmed rather than filled with invented results.

## 2026-08-14 — Real data in place

Second snapshot folded in. `assets/data/` now holds the 2026 season:

| file | records |
|---|---|
| conferences.json | 18 |
| events.json | 108 stops, 18 with venue, coordinates and registration counts |
| standings.json | 36 — 18 stops × men/women, with rank, seed, W/L, points |
| teams.json | 202 with rosters |
| players.json | 711 with age, IOC, home city, ranking points |
| news.json | 3 |
| photos.json | 401 galleries |

About 660 KB. Verified end to end: Africa East · Stop 1 in Mombasa resolves to
its venue, its men's standings (Kenya 3–0, 58 points) and South Sudan's four-man
roster with ranking points.

Missing: individual game scores. They sit behind each stop's `/games` route and
were in neither pass, so GameList and the bracket still have no real fixtures.
Everything else is real.

`tools/build_data2.py` derives men/women from the roster's gender, since the
category id alone does not say which is which.

## 2026-08-14 — Fluid containers + real data

### Containers are fluid at source, not patched in the shell

Every fixed container width in the specimen CSS — 76 of them — was rewritten
by `tools/fluidify.py` from `width: 1440px` to `width: 100%; max-width: 1440px`.
Anything under 640px is a real component size (a 342 card, a 44 button) and was
left alone. The shell no longer has to override anything, and the same change
makes the prototype responsive later.

R-01 and the other 1400-wide tables were normalised to 1440, so every table in
Modules II lines up.

Notes, purpose text and state rows wrap instead of forcing a minimum width.

### Data

`fiba-nl-2026-snapshot.json` (1.39 MB) processed into `assets/data/`:

| file | records |
|---|---|
| conferences.json | 18 |
| events.json | 108 |
| news.json | 3 |
| photos.json | 401 |

The stop slugs generated from the data match the live site's own URLs exactly
(`africa-east-stop-1`), which means a second pass can walk them directly.

Standings, teams, players and games load per stop and were not in the first
snapshot. `tools/snapshot2.js` collects them — the stop list is baked in,
ordered one-per-conference first so a short run still covers the whole season's
shape.

Images stay as Cloudinary URLs with the crop and width as parameters, so no
image folder is needed.

## 2026-08-14 — Review round 8

### Why the anchor menu stopped working

`html, body { overflow-x: hidden }` — added last round to stop the page sliding
sideways — silently turns `<body>` into a **scroll container**. `window.scrollTo()`
then moves nothing, so every anchor click did nothing. Replaced with
`overflow-x: clip`, which does the same visual job and creates no scroll
container.

### Why the right side was cut off

`.anchor { overflow-x: clip }` clipped anything wider than the pane instead of
letting it scroll. It is `overflow-x: auto` now, with symmetric padding and a
visible scrollbar, so a 1440-wide module can be scrolled to on a smaller laptop
rather than disappearing.

### What was already fixed but not yet live

Verified against the deployed site: `motion.css` and `app.js` were being served
from cache, so el-11's focus ring, el-22's fill animation, R-01's width and
E-08's shadow were all fixed in the repo and old in the browser. The version
stamps from round 7 land with this push and end that.

el-11's focus ring was checked directly in the browser and draws a single
cut-cornered stroke — correct.

### Fixes

- F-03m — the frame is `aspect-ratio: 402/874` (iPhone 17), so its height
  follows its width. Every state's header search opens the same overlay as
  "header only". "bottom bar — Conferences current" and "more — expanded menu"
  removed.
- S-05 — tooltips removed, original layout restored.

## 2026-08-14 — Review round 7 + Figma handover

### Why fixes kept "not landing"

The live site was serving a **cached** `motion.css` and `app.js` while
`elements.css` was fresh — so el-11, el-22 and the dot animation showed the old
behaviour after a push that contained the fix. `tools/bump_assets.py` now stamps
every CSS and JS link with a content hash (`?v=1a2b3c4d`), so a changed file can
never be served from cache again. Run it before committing.

### Why the sidebar slid off screen

Two causes, both fixed:

1. `.stage` carried a 1280px floor. When a sheet was wider than the pane the
   *page* scrolled sideways and took the sticky sidebar with it.
2. `scrollIntoView` scrolls horizontally as well as vertically when the target
   is wider than the viewport. Anchor jumps now move the vertical axis only.

The stage is fully fluid: every fixed 1920 / 1440 / 1400 container is a
percentage with a max-width, padding uses `clamp()`, the nav bar wraps rather
than overflowing, and only `.m-frame` / `.tpl-frame` scroll internally.

### Fixes

- R-01 — same width as its neighbours (both fluid now).
- E-08 — e1 at rest, e2 on hover, with room in the grid for the shadow.
- S-05 — the existing W–L / PF / PA headers open tooltips; the extra tooltip
  added by mistake last round is gone.
- F-03m — the frame is 390 × 848, the iPhone 17 ratio. Search opens the E-11
  result list as an overlay under the header. More opens the menu above the
  bottom bar, which stays visible, and marks itself active. Close has double the
  vertical padding.

### Figma handover

- `figma/tokens.json` — 48 tokens in W3C DTCG format, for Figma's native
  variable import.
- `figma/AGENT-PROMPTS.md` — P1–P6 in English: three variable passes, the
  component-set prompt, a layer-rename pass, and the verification step.
- `figma/README.md` — full procedure and html.to.design import settings.
- `figma-export/` — 35 files, one element each, 2–45 KB, no page furniture.

### Data

`tools/snapshot.js` — paste into the console on the live Nations League site. It
walks the site's own routes, harvests the Redux store (Immutable, so `toJS()`),
merges the records and downloads one JSON. No API key needed. Verified against
the live site: the store is populated per route, which is why the walk is
necessary.

## 2026-08-13 — Review round 6

**Root cause of the broken flags.** `.flag-ring` drew its ring with a `border`
on a `box-sizing: border-box` element, so 4px came out of the content box. At
`flag-s` (20px) that is a fifth of the artwork, and the circular `overflow`
clip cut the rest. The ring is a `box-shadow` now, drawn outside the box, and
the flag keeps its full size. Context overrides use a `--ring` variable.

**Root cause of the unstable indicator.** Restarting a CSS *transition* depends
on a style flush landing between two frames — sometimes it did, sometimes the
bar jumped straight to full. Replaced with a keyframe animation restarted by
removing the class and forcing a reflow, which is deterministic. Both the
standalone el-22 and the C-03 carousel use it.

**gen_states.py** now indexes comma groups, so `.tabs-ghost .tab-hover,
.tab-ghost-hover { … }` is reachable as either selector. It previously keyed the
whole group as one string and silently skipped it.

### Fixes

- Sidebar — the active marker is white, not red.
- ctl-03 — the ghost variant hovers to `--action-ghost-bg`, lighter than the
  standalone strip.
- el-03 / el-30 / el-05 — the live dot is a bouncing basketball: it falls,
  squashes on contact, springs back.
- el-07 — the Live demo carries the legend under its table.
- F-02 — family links stay on one line, right aligned.
- F-03m — the phone frame is 420 tall instead of 720; search is a real control
  with the NavTab hover, opening a search bar under the header; More opens the
  menu above the bottom bar and marks itself active.
- F-05 — four columns spread across the content width with auto gaps.
- F-06 — the sponsor band is full bleed again; only its contents are inset.
- S-05 — pool headers carry the tooltip.
- R-01 / R-02 — same table width as the rest; every table with markers has its
  legend.
- E-08 — cards sit on e1 and lift to e2; the grid has room for the shadow.

## 2026-08-13 — Guideline site restructured

**Anchor navigation.** Each group is now one long page and the sidebar is its
table of contents: Foundations (11), Elements (35), Modules I · Frame &
Schedule (16), Modules II · Ranking, Entity & Content (22). Modules were split
in two to keep each page under ~470 KB. Scroll position drives the sidebar
highlight. Templates left the menu entirely — they are the prototype, linked
from the sidebar footer.

**Layout is fluid, not scaled.** The transform-scale preview and the breakpoint
buttons are gone. Fixed 1920 / 1440 widths are relaxed to percentages with a
1280 floor, so the sheets genuinely reflow with the window.

**Sidebar header** is the 3x3NL wordmark plus DESIGN SYSTEM on one line; the
Copy link button is gone.

### Fixes

- ctl-07 — the red Watch live button hovers to `#B80511`. The specimen already
  had `.wl-live.wl-hover`; the generator only mapped the generic `.wl-hover`.
- ctl-04 / el-11 — the input inside the painted container was drawing its own
  focus outline on top of the container's ring. On dark chrome the select had
  no fill layer, so its white ring had nothing to sit on; the scaffold is now
  added at init.
- el-05 — the live dot pulses (badge, Watch live, calendar, nav).
- el-08 — sortable header cells have hover and focus and are keyboard reachable.
- el-07 / S-01 / R-02 / R-03 — legend carries Q, S **and R · In the race**.
- el-11 — the trailing X clears the field.
- el-22 — the 8px cut on a 4px bar left hairlines at the corners; the cut is
  scaled to the bar. The fill reset is now flushed before the animation starts,
  which was the cause of the occasional jump straight to black.
- el-30 — day cells sit in their strip context at full size; selected is a
  filled black cell like el-03.
- Modules — `.m-block-full` pads its children by 240px for the 1920 bleed; the
  shell drops that, which was the excessive left margin.
- F-02 / F-05 / F-06 — full-bleed chrome fills the pane instead of being cut at
  1920.
- F-03m — sheet is 720 tall so the whole menu fits; the redundant heading is
  gone and Close is spaced like the rows below it.
- R-04 — flags were broken again: a markup script re-lowercased `viewBox` and
  `fix_svg_case.py` had not been re-run after it. It runs after every markup
  pass now.
- S-04 — home side reads name, code, flag; away side flag, code, name.
- E-08 — card sits on e1, lifts to e2 on hover.
- C-05 — share trigger hover restored.
- `gen_states.py` stripped no comments, so a rule directly after a comment block
  was keyed with the comment text and silently skipped.

## 2026-08-13 — Review round 4 + guideline site

### Why the same bugs kept coming back

Two of my own patches were silently doing nothing.

1. A `str.replace()` that did not match (the file had `box-shadow:inset`, the
   patch looked for `box-shadow: inset`) — so the C-02 / C-04 underline fix was
   never applied, twice.
2. A shell command chained with `&&` where an earlier `rm` failed on a
   permission error, so the heredoc that appended half of interactions.css
   never ran.

Every patch now asserts that it changed something and fails loudly if not.

### Structural change: generated state rules

`assets/interactions.css` is now **generated** by `tools/gen_states.py`. Each
`.live X:hover` rule copies the declarations of its specimen modifier class
verbatim, so a documented state and the live state cannot drift. This is what
caused the wrong Outline-button and WatchLive hovers: the hand-written rule
repainted the border layer where the specimen tints the fill. Hand-written
interaction moved to `assets/behaviour.css`.

### The bracket corner, third attempt

`.cutfill` is the first DOM child of every cut container, so
`.s06-side:first-of-type` matched *it*, never the first row. Replaced with an
adjacency selector.

### Fixes

- ctl-01 / ctl-07 / ctl-04 / el-11 — hover and focus now match the specimen.
- el-06 StopDots — the interactive dot adopts the Button Filled state set.
- el-07, S-01, R-02, T · Conference, T · Standings — el-09 Legend under the
  table, flush, no top border.
- el-16 Card — flat at rest, e2 shadow on hover.
- el-21 Tooltip — the arrow is held on the anchor and hides with the bubble
  (it sits *before* the bubble, so a sibling selector could never reach it).
- el-22 — all five bars animate through the set.
- el-30 CalendarStrip — day-cell states documented: default, hover, focus,
  selected, disabled.
- S-04 GameList — targeted `.c-away` / `.c-box`, the classes this markup
  actually uses; an earlier fix aimed at `.s04-team`, which does not exist.
- S-09 — the black and red segments overlap by 4px.
- C-03 — viewer controls reuse the documented icon button; `.lb-img` no longer
  forced to 3:2, which was pushing the photo over the modal header.
- F-03m — mobile "More" sheet built, grouped as Nations League / Info /
  Competition Family, matching the reference prototype.
- T · Home — the logo link is vertically centred again (an `align-self` I added
  last round was the cause); the Live now filter defaults to All.

### Step 2 — guideline site

`system/index.html`. Sidebar, search, deep-linkable hash URLs, viewport preview,
and a stage that scales a 1920 sheet to fit the pane. **98 blocks** split out of
the six sheets by `tools/split_blocks.py` into `system/blocks/`, with
`system/nav.json` driving the menu.

To edit: content lives in the block fragment, order and names in `nav.json`,
looks in `assets/*.css`. All single-file changes.

## 2026-08-13 — Review round 3

**Root cause of the dead Live demos.** Building a demo meant stripping the
forced-state classes off a specimen. `btn-primary-hover` was deleted whole —
so the variant `btn-primary` went with it and the clone was a bare `.btn` with
no styling and nothing to hover. Same for `wl-focus-live`, which survived the
strip (the suffix is in the middle) and pinned WatchLive permanently in focus.

Stripping now *maps* a state class back to its resting class instead of
deleting it, keeping the result only when it extends a class the element
already has. All 35 demos rebuilt. A handful also get an explicit source state
(ctl-01 and ctl-07 show all three variants, el-06 the interactive stop
selector, el-13 and el-14 the dismissible variants, el-23 four levels).

**Root cause of the missing corners.** A cut container paints its 45° corners
with its own background. Any child that fills edge to edge paints straight over
them — a collapsed accordion header, the first and last row of a bracket card,
a photo tile. Those children now carry the same cut sized to the inner radius
(`--ic`). This fixes el-07, S-01, S-06 and the C-03 viewer at once.

**Root cause of the wrong underlines.** `box-shadow: inset` follows the *box*,
so a headline in a block underlined the empty space after the text. Replaced
with `text-decoration` + offset everywhere, which follows the text.

**Root cause of the sliver photos.** `.car-slide` had a fixed width but the
default `flex-shrink: 1`, so doubling the slide count squeezed them into
portrait slivers. Slides, tiles, thumbnails and the viewer image are now
`flex: 0 0 auto` with a 3:2 ratio.

**Also fixed**

- el-11 / ctl-04 — focus lived on the inner `<input>`, so the painted container
  never matched `:focus-visible`. Now `:focus-within`.
- el-19 — the caret came from whichever specimen was cloned and could already
  point up. It is replaced at init with one known chevron; rotation alone
  expresses the state.
- el-22 — the progress bar snapped back to empty once the playhead moved past
  it. It now stays filled.
- el-13 / el-14 — clicking the X removes the chip.
- el-21 — the info anchor opens and closes the tooltip.
- el-23 — the current breadcrumb is not hoverable or clickable.
- el-30 / S-03 — selected day is filled with inverse text, like every other
  selected control. T · Home's 22nd now reads as selected.
- F-06 — sponsor and social marks have default, hover and focus states.
- S-04 — the away team reads name, code, flag; Box Score is centred on the row.
- R-02 — every table using Q / S / R markers carries the legend beneath it.
- E-11 — the search field is the width of the results; the dark skeleton pulses
  in chrome grey.
- C-03 viewer — download, share and close are real controls with states.
- T · Home — Advertising is a full-width section again, left-aligned and spaced
  like every other section. It sits after the split, so collapsing Live now does
  not move it as long as Qualification is the taller column.
- T · Conference — Conference standings and Games are both 1440 wide.

## 2026-08-13 — Review round 2

**Live demos now actually work.** The demo blocks cloned each component's
*default* state, which for a field, checkbox or disclosure row is a painted
`<div>` with nothing to operate. Two changes: the demo now clones the **richest**
state (so el-19 gets its body, el-28 its menu, ctl-04 its open select), and
`assets/app.js` gained real behaviour.

- ctl-04 — a real `<input>` in the field, plus a dark select that opens, selects
  and writes the value back to the trigger.
- ctl-05 — checkbox toggles.
- el-11 — real search `<input>`.
- el-19 — disclosure rows open and close.
- el-22 — a standalone CarouselIndicator runs its own auto-advance loop.
- el-28 — share menu opens from the trigger and closes on outside click.

**More stale cut-border rules found.** The round-1 merge only promoted the fixed
version when 02-elements had it. Rule corrected to "modern wins from any file",
which repaired five more: `.c02-card`, `.lb`, `.lb-nav`, `.car-btn-dis`,
`.s03-d` — the cause of the broken corners in C-02 NewsRail, the C-03 viewer and
the T · Stop bracket.

**Fixes**

- *el-18* — the assembled 390px bar had Home pushed out of line, from a stray
  `.darkbed` wrapper round-1 put inside the bar. Unwrapped; `tabbar-dark` now
  sits on the bar itself.
- *el-20 / T · Conferences* — `.lnk` no longer stretches, so the hover underline
  is the width of the link rather than the row.
- *R-01* — the Q / S legend moved out to sit flush under the R-02 table, no top
  border, zero spacing.
- *E-08* — the keyvisual artwork had an intrinsic pixel width, so it only looked
  full-bleed on the 240 and 180 cards where it overflowed. Now 100% at all sizes.
- *E-10* — list rows hover like table rows.
- *E-11 / T · Search* — results presented on the dark chrome surface, rows hover
  with `--chrome-hover` (same as el-18).
- *C-02 / C-04 / T · Home / T · News* — one shared news interaction: card hover
  repaints the cut-aware border, headline underlines to its own width.
- *C-03 / T · Home* — twice the photos, indicator extended to match. Pause works
  and the icon swaps to Play. Previous works (the specimen shows it disabled at
  position 0; the live carousel wraps).
- *C-04 / T · News* — category filter removed.
- *T · Home* — Advertising headline removed and the slot pinned inside the right
  column under Qualification, so collapsing Live now no longer moves it.
- *T · Standings* — table fills the 1440 content width.
- *T · Article* — category chip removed; Share button has a hover state.
- *Wording* — "Find your federation" renamed to **Find a team** everywhere, so
  the E-01 section header matches the footer link. Changed in the specimen
  sheets and in `design-system/` too, so a future html.to.design import does not
  reintroduce the old label.

## 2026-08-13 — Review round 1

**Interaction model reworked.** The 57 auto-generated `:hover` pairs from the
extraction were wrong in two ways: they made the specimen sheets react to the
pointer, and several of them targeted a container instead of the item inside it
(the whole nav bar lit up instead of one nav item). All 57 were removed.

- New `assets/interactions.css` — every interactive rule is scoped to `.live`.
  Specimen state rows are frozen; only `.live` blocks respond to the pointer.
- Correct targets derived from the markup, not from the class name:
  `.f03-i` not `.f03`, `.alpha-i` not `.alpha`, `.disc-head` not `.disc`,
  `.pag-i` not `.pag`, `.el02-seg` not `.el02`.
- **35 Live demo blocks** added, one under each element in 02-elements.
- Module and template frames are live; state rows labelled hover/focus/active
  stay static.

**Fixes**

- *Foundations 06* — `.bs-box` had lost `position:relative` in the merge, so
  `.cutfill` escaped its box and the branded gradient painted as a fill instead
  of a stroke. Restored.
- *SVG case* — HTML parsers lowercase attribute names and SVG is case-sensitive,
  so `viewBox` became `viewbox` and every flag, icon and logo broke. 2,612 names
  restored; `tools/fix_svg_case.py` added and `relink2.py` hardened.
- *el-02 GenderSwitch* — segments had no border at all, so hover read as a flat
  grey rectangle. They now use the cut-aware border, and hover tints the interior
  while keeping the 45° corner.
- *el-18 NavTab* — documented on the dark chrome bar it actually sits on. Hover
  surface changed from `--action-ghost-bg` to the new `--chrome-hover` (#2E2E2E).
- *el-19 DisclosureRow* — hover moved from the whole panel to the header only.
  Dark variant uses `--chrome-hover`.
- *el-25 AlphaIndex* — hover moved from the row to the individual letter.
- *el-26 Skeleton* — loading pulse added (1.6s, reduced-motion aware).
- *F-03 CompetitionNav* — hover moved from the bar to the nav item.
- *S-03 CalendarStrip* — base day-cell states declared: today, hover, focus,
  live, disabled.
- *S-05 Pools · S-06 Bracket · R-01 QualificationBoard · Standings table* —
  whole-row hover.
- *E-03 ConferenceGrid* — underline drawn with an inset shadow so it matches the
  text width instead of spanning the flex row.
- *E-09 FederationDirectory* — hover repaints the cut-aware border layer, so the
  colour change follows the 45° corner.
- *Season status* — branded stroke rotates (12s, `@property --bs-angle`).
- *Photos* — carousel works: slides translate, indicator fills over the dwell
  time, play/pause toggles, dots are clickable.
- *Live now* — accordions work; the first opens on load, the rest stay closed.

**New files:** `assets/interactions.css`, `assets/app.js`,
`tools/fix_svg_case.py`.

**Still to confirm visually:** *el-15 AutocompleteMenu* — the two-surface hover
could not be reproduced from the code alone. A screenshot of the hover row would
pin it down.

## 2026-08-13 — CSS extraction

Stylesheets lifted out of the six `design-system/*.html` specimen sheets into a
shared, hand-editable library.

- **898 selectors** analysed across the six sheets; 810 appeared in more than one.
- **72 conflicts** found. 66 were one issue: the cut-aware border technique
  (`--of` / `--n` / `.cutfill`) had been applied to `02-elements.html` but only
  partially propagated to the module and template sheets.
- Markup was checked and found **already consistent** — every element using a
  cut-border class already carried its `.cutfill` child. So the stale CSS meant
  **46 rules were rendering the 45° border incorrectly** in the module and
  template sheets. Merging fixed them.
- Remaining 6 conflicts resolved by hand: `:root` (union, 40 variables),
  `.t-h2` (28/32 → 32/36, foundations was stale), `.lbl`, and three doc-chrome
  rules that moved to `system/assets/docs.css`.
- **57 pseudo-class pairs** generated: every `.x-hover` / `.x-focus` / `.x-active`
  specimen class now also fires as `.x:hover` / `.x:focus-visible` / `.x:active`.
  The specimen sheets and real interaction run off the same code.
- Motion tokens and `motion.css` added (transitions, scroll reveal, view
  transitions, reduced-motion).

Files: `assets/tokens.css` `base.css` `elements.css` `modules.css` `motion.css`,
`system/assets/docs.css`. Relinked specimen sheets in `system/_check/` for
visual comparison against the originals.
