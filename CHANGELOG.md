# Changelog

## 2026-08-20 (2) — Stops 2 to 6, the 76.5° cut, and one empty state

### The five stops that were not there

The snapshot walked each conference's **first** stop only. The calendar
was complete, so the Conferences page correctly said *6 of 6 stops* — and
then five of every six stop pages opened onto nothing. `tools/fill_stops.py`
now writes a deterministic fixture list for the stops the feed does not
carry: pools, a final, scores for every stop already played, and the
standings table computed from those scores. Stops still in the future get
the schedule without scores, so they read as *Upcoming* rather than as
missing. 1,164 games and 158 tables, all reproducible from the same
input — re-running the script after a snapshot refresh produces the same
season, and it never touches a stop the feed does supply.

Three things followed from having results everywhere:

- **Box scores work from stop 2 onwards.** `gameSquad()` matched a roster
  on the exact stop, and the feed names a squad at the first stop only.
  A federation fields the same four players across its conference, so the
  lookup falls back to the conference's roster.
- **E-08 PlayerCard states Games, Points and Win ratio**, summed from the
  derived box scores. The brand template asked for GP / PPG / APG / RPG;
  assists and rebounds are not recorded in this competition, and a
  per-game average over four players at one stop says very little.
- **E-06 PlayerSeasonStats and E-07 GameLog are filled.** Both were
  sitting at 45% opacity holding the specimen's figures. E-05's glance row
  was labelled Games / Points / PPG / Win ratio and was being filled with
  age, ranking points and a city.

### The stop page had a gender switch wired to nothing

The podium, the pools, the bracket and the game list all read the men's
records, and the list printed both genders end to end. Three more things
were wrong in the same module: S-05 painted every federation at the stop
into Pool A and left Pool B on its specimen row — which pool a team was
in is in the fixtures, not in the standings — the pool position column
was showing the stop rank, and `/final/i` matches *Semi-finals*, so the
semi-final round was handed the final and printed it a second time.

### 76.5°

The white lozenge behind the mark in F-03 CompetitionNav was cut at 26px
over 64px of height — 67.9° from the horizontal. Hero A tilts its slats at
**76.5°**, and F-03 sits directly under it, so the two now share one
figure: `--slant-run` in tokens.css is 1/tan(76.5°), and the clip path
reads `calc(100% - 64px * var(--slant-run))`.

### ctl-08 ToggleSwitch moves

The knob was pushed across by `margin-left: auto`, and `auto` is not an
interpolatable length, so it jumped. It is positioned now — `left` is a
length in both states — and three things animate at deliberately
different lengths: the knob travels in `dur-base`, the track fills, and
the cut-out fill under it cross-fades over `dur-slow`, because that fill
is what reads as *the value changed*.

### el-10 EmptyState, everywhere

The helper was building the block without the cut-out fill and without an
icon, so it came out as a filled grey panel rather than the outlined
element el-10 is specified as. It emits the element verbatim now, with
four icons and an optional action button — and it is used wherever a
module has nothing to show, instead of the three habits that were in the
file: hiding the section (C-03 PhotoGallery, Top scorer, leading
scorers), dimming the specimen rows to 45% (stop and team game lists,
the player page), or leaving a table of hidden rows behind a heading
(conference standings, the stop matrix, the two Stats tables, the box
score).

### The rest of the list

- **S-12 GameDetail.** The headline states the round, the date, the venue
  and the category on one line. The score lockup repeats S-04 GameList's
  own arrangement at display size — IOC code, flag, score : score, flag,
  IOC code — so a game reads the same way in the list and on its own page.
  Teams and Top scorer share a row of two equal columns, and so do the two
  halves of the box score. The top scorer carries an el-24 Avatar at M
  beside the flag, matched to it at 48.
- **F-06 SiteFooter lines up with the page.** Its four bands were padded
  `240px`, the gutter that centres a 1440 column at 1920 and nothing else.
  `--page-gutter` was defined in tokens.css for exactly this and was not
  being used anywhere; the footer uses it now, so the left edge of the
  columns sits on the left edge of the content at every width.
- **Overview states the live figure once.** It was printed on both lines
  and read as two separate live things.
- **The conference card is one target.** Its federation tags were lighting
  up under the cursor, which read as a second, smaller link inside a card
  that goes somewhere else. The rule above them is gone too.
- **The Stats overview is the wireframe's.** Final games, teams in scope,
  teams with games, active conferences, average points per game —
  recomputed against the gender switch and the conference filter. It was
  S-09, which says the same thing on every page and ignores both controls.
- **Points per game is what one team scores**, not what the two of them
  score between them. The conference highlight read 31 in a competition
  where 21 wins it.
- **Top score needs a comparable schedule.** A federation that played one
  stop and one good day was outranking one that played all six.
- **A final with no teams yet says so.** `fed()` cannot repaint an empty
  IOC code, so an undecided final kept whichever federations the specimen
  was built with.
- **Four ALG portraits.** `assets/players/` holds the first real cut-outs;
  E-08 and el-24 use them where they exist and keep the silhouette
  elsewhere.

## 2026-08-20 (1) — One selection treatment, one table, and the game page

### The 17th of June, twice

Picking Oceania on the landing page put 17 June in the strip twice. The
cause was not the strip: `pad()` extends a region's playing days outward
until it has eight, and the day-arithmetic helper formatted its result
with `toISOString()`. That converts to UTC first, so east of Greenwich
local midnight lands on the previous UTC day and every date comes back
one short — "the day after 17 June" returned 17 June. In UTC the bug is
invisible, which is why it survived. Dates in this app are calendar days,
not instants; they are formatted from the local fields now, in one place
(`isoDay`, `shiftDay`), and every `toISOString().slice(0, 10)` in the
file went with it — the same slip was deciding what "today" was on six
other pages.

### Why every conference read "1 of 6 stops"

Because *played* was being derived from the presence of a standings
record, and the snapshot only walked each conference's **first** stop.
The season is six deep almost everywhere: fifteen of the eighteen
conferences have finished, ninety-six of the hundred and eight stops have
been played. Whether a stop has happened is a fact about the calendar and
the calendar is complete in the feed, so `stopPlayed()` reads the date
and results fill in behind it. The Conferences cards, the stop dots, the
S-02 timeline, S-09 Overview, the team page's season journey and the
conference-winner test all move onto it. A stop that has been played but
whose results have not been ingested now says *Played* with its figures
still dashed, which is the honest reading of what we hold.

### ctl-03 Tab

The selected tab was a 2px rule under a grey label. It is a filled black
block with a white label now, notched on the **top-left corner only** so
it sits flush on the rule beneath the strip — the same selection
treatment as el-02 GenderSwitch, so the system has one way of saying
"this one" instead of two. An outline would be clipped away by the notch,
so the selected tab carries its focus ring inside, in white.

### ctl-08 ToggleSwitch — new

One switch for a view that filters itself. It is deliberately not a
checkbox: ctl-05 adds a value to a set, this changes what the table in
front of you *is*, and it takes effect with no apply step. Geometry
follows el-02 — outlined when off, solid black when on. Eight states.

### R-02 StandingsTable is one table

Competition Standings and Qualification were two tabs over the same rows:
the same federations, ranked the same way, with one column swapped. They
are merged, and ctl-08 cuts the table down to the twenty places that are
going. The **Route** column went with the tab — it repeated what the
Status marker already says. `qualification.html` redirects to
`standings.html?view=qualification`, so old links still land.

### el-09 Legend moved

Above its table and right-aligned, so the abbreviations are read before
the numbers rather than found afterwards, with a rule on **top only** — a
second rule underneath was fighting the table header. On Standings it
shares that rule with the new switch: one band above the table carrying
both controls that describe it.

### S-12 GameDetail — new

The page behind every **Box score** link in S-04. Johannes' wireframe
opens on a video player; there is no video module in this system, and the
league streams on YouTube, so the page opens on the result instead.
Score lockup, the two team plates with the stop record and the winner,
top scorer, box score per team, the stat comparison and the play-by-play.

The feed carries the result and the squads but no player statistics — the
endpoints that hold them were not in the snapshot. Rather than ship an
empty page, the box score, the match stats and the play-by-play are
derived from the two things that *are* real: the final score and the four
players each federation fielded. Every point is a two-pointer or a free
throw; the interleave gives the team that is behind the better chance of
scoring next, which is where the lead-change count comes from. It is
seeded on the game id, so a game always reads the same way, and the page
says so under the box score.

### E-08 PlayerCard: the surname that did not fit

`SAMBAUAIA MÁQUINA` wrapped to two lines of 30px and pushed the plate
over the stat column; `LUKENI ELISANDRO MANUEL` did the same above it.
There was a size step for this, but it lived in elements.css and lost to
the base rule in modules.css, so it had never once applied. Both names
are now measured and stepped down until they fit — five steps for the
surname, three for the given names — with a character-count fallback for
a card painted before it is in the document, and a re-measure on resize.

### Foundations · Typography

Two families and eleven styles, documented after colour: what each one
is, what it is for, and the exact weight, size, line height and tracking.

### Everything else

- **F-06** — the season selector beside the lockup is gone, desktop and
  mobile.
- **E-03** — the hover elevation was a `box-shadow` on a clipped surface,
  so it was being cut away and nothing happened. `drop-shadow` follows
  the silhouette; the cards lift to e1. The federation tags were the
  plain variant — a bare flag and code — and are now el-13 at size S.
- **Stop podium** — `.cnf-pod` is a cut-out surface, so `background` is
  the border colour. The winner tile was setting only that, leaving white
  type on a white plate. The 1st tile is filled again.
- **Home · Live now** — the per-conference gender switch inside every
  el-07 AccordionShell is gone; one switch sits in the filter bar with the
  region chips, hard right. **Qualification** — the switch moves right and
  **Full standings** moves to the foot of the board, where it belongs.
- **Stats** — Top score is the first column of the spotlight, stated as
  el-13 at size L, instead of a section of its own with a 40px country
  name. Overview is S-09, the block the other two hub pages open with.
- **Calendar** — the gender switch is in the page head at headline
  height, a search sits under it the way it does on Teams, and the
  accordions have no switches of their own.
- **Player** — C-03 PhotoGallery at the foot, from the stops the player's
  squad was entered at.
- **assets/flags/CAL.svg** — New Caledonia was 404ing on four pages.
- **initChrome** — the resize handler read `mm` and `ovl` from the fetch
  callback's scope, so every resize threw. Hoisted.
- **tools/bump_assets.py** stamped index.html and the design system only,
  which left thirteen pages serving whatever the browser had cached. It
  covers every page now.

## 2026-08-19 (5) — The selected stop, and About as one page

### On whether a clickable stop is worth anything

It was not, as built: the selector moved a highlight and nothing else,
because the Stop-by-stop matrix already answers the question the whole
tab was asking. Two readings of the brief settle it.

Alex's navigation principle from 3 August — *start at 20,000 feet and go
down a level at a time* — and Johannes' wireframe, where the STOPS tab is
the **stop detail**, not a second view of the conference. So the two
things on that tab now answer two different questions. **Stop by stop**
is the conference: every federation, every stop, one grid. **The panel
above it** is one stop: who was on the podium, that stop's games, and a
link into the full stop page for the pools and the bracket. Picking a
stop changes all of that, which is what makes picking one worth doing.

A stop with no results says so, in both places.

### Why the games looked disabled

They were placeholder rows at 45% opacity — the state the system uses
for anything the data layer has not filled — sitting under a caption
that said there were no games. Two ways of saying the same thing, one of
which reads as "disabled". The table hides now and an el-10 EmptyState
says what is missing and when it arrives.

### E-08 PlayerCard

- **The flag was drawn at 64px.** `flag()` sizes its image to fill its
  box; E-08's flag box is a 64px column holding the flag *over* the IOC
  code, so the image filled the column and pushed the code out of the
  card. The flag is drawn at its own 22px.
- **The reflection is on top.** It was inserted before the pattern, the
  key visual and the cut-out, so it was reflecting off the back of the
  card. z-index puts it over all of them, including the name plate.
- **Every card, everywhere.** The layer was added by a markup pass that
  only matched some of the specimens. It is injected when a card is
  wired instead, so a card added later still reflects.

### Global and Home

- **F-05** — the muted default was written after the selected state, so
  a rule of the same weight took the current page back to grey. Stated
  last.
- **The nations / team-sites count** is a sibling of the title, not part
  of it — it was inside the title group, where `margin-left:auto` has
  nothing to push against. Flush right on the landing page, on
  Conferences, and in the design system's E-01 specimen.

### Conferences

The count line under the headline is gone. Find a team and Overview are
each one full-width block, stacked, rather than two columns. The card
grid, its hover elevation and the size-S federation tags were already in
— the page had a broken `tpl-split` wrapper around the head that was
swallowing everything after it, so none of it rendered. The page is
rebuilt from four balanced blocks.

### S-11 StopMatrix

The stop cells and their headers are centred, so *Stop 3* sits over
*1st / 100 pts* rather than beside it.

### About

One page. It was five sections behind a switch, which meant a deep link
could only ever land on the first of them and nothing scrolled. The menu
is anchors now — it sticks, it scrolls to its section, it marks whichever
section is in view, and the URL carries the section so a link into it
works. The two sections the menu had always listed but the page never
had — **Conferences and stops**, **Age categories** — are written, from
FIBA's own competition description.

## 2026-08-19 (4) — Real dates, real cards, real photographs

### The strip was hiding the season

The day list was built from stops we hold *results* for, so every stop
the snapshot has not caught up with vanished — which is why 19, 20 and
21 August were missing while Asia SEA was mid-conference. A day counts
when a stop is **being played on it**, results or not. The landing page
now opens on 19 August with Asia SEA · Stop 3 live, and a stop with no
results yet says so inside its accordion instead of showing an empty
table.

**Eight days, always.** el-30 CalendarStrip is eight equal days, but a
region with fewer playing days rendered a short strip — Oceania is one
conference, so it drew six — and the module changed shape from filter to
filter. The region's playing days come first; the rest of the eight are
the calendar days around them, marked off so they read as empty rather
than clickable. Same rule on the Calendar page.

### Photographs are keyed on the event

The feed keys a gallery on the event it was shot at, not on a stop slug,
so `paintPhotos` was filtering on a field that does not exist and every
page got the whole archive. A page now asks for its own events' galleries,
newest shoot first — the landing page shows the season's latest, a
conference shows its own, a stop shows that stop's.

### E-08 PlayerCard

- The conference page had been given an invented card — `pcard-bg`,
  `pcard-nm`, a flag box that was not one — so none of the pattern, key
  visual, silhouette or plate rendered. It uses the real card now.
- **The flag never changed.** `flag()` looks for a `.flag` box; E-08
  holds its flag in `.pcard-flagbox`, so every card kept the federation
  the specimen was built with. It paints both now — and replaces only
  the artwork, because clearing the box was taking the IOC code with it.
- **A long surname drops a size.** Two lines of 40px pushed the plate
  over the stats; over eleven characters the card sets 22px rather than
  truncating a player's name.
- The lift, tilt and specular band now apply everywhere a card appears —
  team pages, the conference page and the design system.

### Global

- **F-05 MegaMenu** — the gap between a category heading and its first
  item is doubled, so three columns stop reading as one long list.
- **el-11 SearchInput** — the clear control uses the same plain X as the
  search overlay.
- **el-22 CarouselIndicator** — hover and focus states. Both types are
  controls; a bar jumps to its slide, so it has to say so.
- **el-note** — a note belonging to a full-bleed module sits outside
  `.m-block`, so it started at the page's left edge while every other
  note started at the column's. Same gutter now, at every width.

### Conferences

Five and five columns. Qualification tables is a ctl-02 Link, like *Or
browse all nations*. Cards lift on hover. The federations in a card are
el-13 at size S. The nations / team-sites count sits at the right of the
section header, at body size with the figures in bold.

### Conference page

The Stops tab was inert: `sel` indexes the conference's stops but the
games were read out of the *played* ones, so picking a stop showed the
wrong games or none.

### Stop page

**What Pool B should show when it is empty: nothing, and a reason.** A
stop that has not been played has no pools, no bracket and no podium —
the draw is published with the results. Rather than three empty modules,
those hide and the page says so, and points at the conference table,
which already counts every stop before it.

### Stats

- **Top scores is real, not a placeholder.** It is the federation
  scoring most per game in whatever is in scope — Republic of Korea at
  21.0 with the All-conferences filter on. It is now named the way a
  team page names one: flag, then federation, with the figure under it.
- The player cell drops the flag that sat between the initials and the
  name — the Team column carries the flag now, and two in one row read
  as two different things.
- **The black rule on the left of row one** was `.r05-pod`, the podium
  treatment from the stat-leaders specimen. A ranked list already says
  who is first. Removed.

### Calendar

Opening an accordion closes the one that was open. The list is the whole
season here, so leaving them open turns the page into a wall of tables.

### About

Opens on *What the Nations League is*, which now leads with a 16:9 slot
for the explainer film and a centred play control. The table of contents
drives the page instead of being a static list with the second item
marked.

## 2026-08-19 (3) — The live segment, the Stats page and the Calendar

### Home

- **The progress bar shows the live share in red.** Two things were
  wrong: the `.s09-live` segment was not in the markup at all, and the
  bar was measured in stops while the line above it counted conferences
  — so the line said *1 live* and the bar had nothing red in it. The bar
  is now read in the same unit as the line above it: conferences on the
  landing page, stops on the Conferences page.
- **The mega menu follows the navigation's colour logic** — muted at
  rest, white on hover, white with a rule when it is the page you are
  on. The gold accent belongs to the corporate strip.
- **R-01 QualificationBoard has its own Men / Women switch again**, under
  the title and left aligned. LP-13 asks for it by name, and the module
  is a quarter of the page wide, so the title row has no room beside the
  Full standings link. `genderSwitch()` is scoped now — the landing page
  carries three switches and a document-wide binding moved them together.

### Conferences

Find a team and Overview sit side by side under the headline. S-09 is a
full-width card on the landing page; in a 600px column its label,
figures and bar do not fit on one line, so the bar wraps under the
figures rather than pushing the page wide.

### Standings

The search field works on the Qualification tab. It narrows what is
shown of the field of twenty and never changes who is in it, so the
position column keeps the qualification place rather than the row number.

### Stats

**Teams | Players**, as ctl-03 Tab under the headline.

Teams carries: **Top scores** (the federation scoring most per game),
**Team stats spotlight** in the same six-figure row a team page uses,
**Overview** (final games, teams in scope, teams with games, active
conferences, average points per game), a **conference filter** with all
eighteen conferences plus All, and then **Team performance** and **Team
scoring** as two tables.

Players lost the metric chips — the feed holds one measure per player, so
four chips that all sorted the same list were a control that did nothing
— and gained a **Team** column with the federation's flag and IOC code.
Games and PPG stay empty because there are no box scores in the
snapshot; the column that was labelled Points is now **Ranking pts**,
which is the measure actually in it.

### Calendar

The landing page's Live now module, with the day selection released:
**nothing is preselected**, so every stop that has something under it is
listed as an S-01 accordion — sixteen of them. Picking a day narrows the
list to that day; picking it again clears it. The month headings and
dividers are gone, because the strip already is the calendar.

### On the Route column

Worth stating plainly, since it was asked: the two routes are official —
`NL - about.docx`, FIBA's own competition description, says the host and
each conference winner qualify and the rest of the field of twenty comes
from the global standings. Alex raised the same split himself on slide 17
(*"we can split between winners of conference and others"*). What is
**ours, and not signed off**, is showing it as a column, and the
provisional *Conference leader* wording for a federation that currently
tops a conference that has not finished. It belongs on Friday's list as a
proposal, not as something the client has already agreed.

## 2026-08-19 (2) — Breadcrumbs, two real tabs, and the conference pages

### Global

**Every page states its own breadcrumb.** Pages that carry an entity in
the trail were leaving the specimen's text in place, so a team page
opened from any federation still read *Home / Teams / Serbia* and a stop
page kept whichever conference the specimen was built with. There is one
writer now, and team, player, conference and stop all use it. The same
bug had the team and conference H1 stuck on the specimen's name — the H1
is `.f04-h1-m`, which was not in the selector list.

**The mega menu no longer highlights Standings on every page.** The gold
accent was baked into the partial as a stand-in for "you are here", and
being a partial it did that everywhere. Gold is a hover colour; the
current page is now marked the way F-03 marks it — white label with a
3px white rule under it — and the marking is derived from the page.

### Home

- **Overview** — the label and the figures now sit on one centre line.
- **The red dot means live now.** Every day in the strip has play, so
  marking them all made the whole season look live. Nothing is live
  today, so no dot shows, which is the truth.
- **The default day** is today when today has play, and otherwise the
  most recent day that did. That was already the behaviour; it is now
  stated in the code rather than implied.
- **el-11 SearchInput has a clear control** at the trailing edge, which
  appears as soon as there is text. It existed only in the search
  overlay's markup, so the fields on Teams and Standings had no way back
  to the full list.

### Standings — the two tabs answer different questions

They rendered the same rows, which is why splitting them read as
arbitrary. ST-03 asked the page to answer two things:

- **Competition Standings** — every registered federation ranked on how
  it has played. Win ratio, points average, stops played, tour points,
  sortable on any column.
- **Qualification** — the twenty places at the U23 World Cup and nothing
  else, in qualification order, with a **Route** column in place of Pts
  Average and EP: conference winner, conference leader, or standings.
  One unified view, per ST-09 — not a Winners column beside a Race
  column, which the call ruled out.

Also: **sorting works** (the arrow and the `cell-sorted` class were
painted in but nothing was wired); **tour points are tour points** —
the column was being filled with the basketball points a team scored,
which ranked the table by offence; the **status marker** was being
clipped off the right edge by a table pinned to 1440px inside a clamped
column, which is what made it look broken; and the legend gained
**N — not qualified**.

### Teams

el-25 AlphaIndex came off. With 67 federations the letter is rarely what
anyone knows and the region is, so the filter is a row of el-14 Chip at
size S under the search field — the same five regions the landing page
uses. The count moved under the chips, because it describes what the
filter left rather than what the page is called.

One entry per federation, but the de-duplication now happens *after* the
gender filter: a federation fields a team in both, and collapsing first
meant whichever gender the feed listed first decided whether the
federation appeared at all — 33 of 68.

### Team page

- **The switch says which category.** A federation may enter U23 only,
  U21 only, or both. Two segments become four when it does — Johannes'
  SWITCH TEAM, which was the only route to a U21 squad.
- **One H1, on the thing that is actually the page title.** F-04 keeps
  the breadcrumb and the switch; the federation name in E-04 is the H1.
- **S-10 SeasonJourney** above the roster — the conference stop by stop:
  where this federation finished, what it was worth, whether the stop has
  been played.
- **Squad → Roster.** FIBA's own term across its platform, and the
  module has been called E-10 RosterGrid all along.
- **Photos** under the results.
- E-08's card stats state age and 3x3 ranking points — what the snapshot
  holds — instead of printing ranking points under a PPG label.

### Conferences page

Find a team, then Overview with both lines, then a ghost **Qualification
tables** button through to Stats, then the grid.

**E-03 is one card per conference.** It was one card per region with the
conferences listed inside and a *View region* link that went nowhere the
card did not already go. The federations in each conference are named
with el-13 FederationTag at size S, and the region is a caption over a
group of cards. The U21 conferences sit inside their region with
everything else — the feed files them all under a "U21" region, and
region is now derived from the conference instead.

### Conference page

**Overview | Stops**, as ctl-03 Tab.

- **Overview** — the standings columns agreed on 3 August, then leading
  scorers as E-08 PlayerCard, then conference highlights, then photos.
- **Stops** — the stop selector, **S-11 StopMatrix** (one row per
  federation, one column per stop, placement over what it was worth —
  Johannes' original, and what Alex asked for on slide 9: *"Good, but
  show six stops"*), then that stop's games, then the link back to the
  conference table.
- **E-08 on hover** lifts, tips six degrees towards the pointer and
  takes a specular band across it. Off under `prefers-reduced-motion`.

Two things to flag rather than bury. **Conference highlights is the tile
row Alex marked "irrelevant / kill"** on slide 10 of the written
feedback — it is in because it was asked for again, and it sits at the
foot of the Overview tab rather than near the standings. And **leading
scorers has no box scores to rank**: the snapshot carries pool games and
finals but no player lines, so the cards are ordered by FIBA 3x3 ranking
points and say so in an el-27 banner, with points per game left empty
rather than guessed.

### Stop page

The stops are selectable and the whole page follows the selection —
title, breadcrumb, podium, pools, bracket, games, photographs.

**On where the bracket goes:** it was already in the right place. Stop
result, pools, bracket, games is the order Alex asked for on slide 14 —
final on top, third place under it. It read as missing because nothing
filled it. The snapshot holds pool games and finals only, so a round
with no games now hides instead of showing specimen scores, and the
podium is painted plinth by plinth rather than repeated from the first,
which had put the same federation in all three places.

### Also

- `width:1440px` is gone from every table. Inside a clamped column it
  pushed the last column past the viewport, which is what clipped the
  status badge and gave Stats and Player a horizontal scrollbar.
- The snapshot repeats the city when the feed's city and region match —
  "Riga, Riga". Collapsed once, in one place.

### Design system

New: **S-10 SeasonJourney**, **S-11 StopMatrix**. Updated: F-04 (control
slot), F-05 (current page), el-02 (category variants), el-09 (N marker),
el-11 (clear), el-23 (per-page trail), el-25 (no longer on Teams), E-03
(one card per conference), E-04 (the H1 lives here), E-08 (hover), E-09
(region filter), R-02 (two views). `system/_check/` and `system/pages/`
were both edited — the build scripts in `tools/` still point at an old
session path.

Scripts: `tools/p3_standings.py`, `p4_team.py`, `p5_conferences.py`,
`p6_conference.py`, `p7_stop.py`, `p8_designsystem2.py`.

## 2026-08-19 — Overview, the calendar strip, and one place for the switch

### S-09 is now Overview, and it has a type

Renamed everywhere — the module, the section header on the landing page,
the design system entry and the anchor (`#modules-1/s-09-overview`).

It also gained a **type** axis, which the four lifecycle states sit
across rather than replace:

- **conferences** — one line, and what the landing page carries.
- **conferences and stops worldwide** — two lines, and where the
  `108 Stops worldwide` counters Alex asked for on slide 8 belong.

That split is deliberate. LP-10 asks for the block to come off the
landing page; slide 8 asks for exactly those counters. Putting the
conferences line on the landing page and the full pair on the
Conferences page answers both instead of compromising between them.

The figures were also wrong: the conference line was reading the *event*
count, so it said 108 conferences. It now reads 18 conferences, how many
have finished, how many are to go, and a live count that hides itself at
zero. The bar reads stops played of stops scheduled — the finest measure
we hold — whichever line is above it.

### The strip only offers days that have something under them

LP-17, and Johannes' note on the screenshot. The strip was eight
consecutive calendar dates, most of them empty, with an EmptyState
waiting underneath. It is now built from the days that actually carry
results, so there is no empty day left to land on. "Carry results" means
a team has played: two stops arrive with a full standings record in which
everyone has played nothing, and offering those days is the thing the
note asked us to stop doing.

### The selected day stays where it was clicked

Two independent pieces of state now, where there was one. `sel` is the
day whose conferences are shown below; `win` is the first day visible in
the strip.

- Clicking a day changes `sel` and nothing else, so the cell stays in the
  slot it was clicked in. It used to re-centre the window on the clicked
  date, which threw the cell three places to the left.
- **Prev** and **Next** move `win` and leave `sel` alone. The strip
  travels, the selection does not — they used to move the selected date
  by seven days, which silently changed what was shown below.
- The movement is animated (`s03-in-l` / `s03-in-r` in motion.css), and
  the buttons dim at either end of the season.

### S-01 LiveConferenceAccordion shows real numbers

It was painting by column index — `nums[length - 2]`, `nums[length - 1]`
— so the win/loss record landed under **Pts Average** and the points
scored under **Tour Points**, and Win Ratio was never filled at all. The
conference page had the same defect one column over.

There is now one implementation for both: `conferenceTable()` aggregates
every stop of a conference played up to the selected day, and
`paintStandingRow()` addresses every cell by its own class. Tour points
are derived from the finishing order at each stop — 100 / 80 / 70 / 60 /
50 / 40 — because the feed carries the order but not the points; the
ladder is stated once, in one place. The gender switch inside the panel
is wired and scopes that conference's table.

Two stops in the snapshot arrive with no gender label, so a gendered
lookup found nothing and the table rendered blank. `standingsFor()`
prefers the labelled record and falls back to the unlabelled one.

### The accordion opens rather than appears

`display: none` became an animated height: measure, animate, release to
`auto` so a table that reflows afterwards is not clipped, and put
overflow back to visible so a tooltip near the bottom edge still shows. A
collapsed panel also drops its padding and rule — with `border-box`,
`height: 0` still left 24 + 24 + 1px standing.

### News is the feature layout, and it is two

C-02 `layout = feature` — two across, the image over the headline and the
date. It was repeating over the whole feed, so a third card appeared
whenever a third story existed.

### One place for Men / Women

Following on from yesterday: the switch is no longer a bar of its own
under the title. **F-04 SubHeader** now has an identity column on the
left — H1 with the page context under it — and a **control slot** on the
right, and the switch lives there on every page that scopes by gender.
Same coordinates on all of them.

That moved the page context line out of the right slot and under the H1,
which is what the conference page needed anyway: **Mombasa · 1 Jul – 7
Jul** now sits under **AFRICA EAST U23** instead of floating at the
opposite edge. E-04 TeamHeader gave its switch up to F-04, and its entry
in the design system says so.

### Also

- **NM-01 was only true in the markup.** The live render was resetting
  the conference H1 to the unqualified feed name — the H1 is
  `.f04-h1-m`, which was not in the selector list — so the breadcrumb
  read "Africa East" while the headline read "Africa East U23".
  `confName()` now appends the category once, in one place: U23 by
  default, and the feed's `U21 Europe-2` prefix moved to the end.
- The conference page header prints its real host cities and date span
  instead of a hardcoded Kigali.
- Stop page: title is `Stop 1 · Mombasa`, and the breadcrumb's
  conference crumb is named and linked.
- `Qualification` and `Full standings →` were overlapping in the
  quarter-width column; the action wraps under the title there.

### Files

`tools/p1_headline.py` and `tools/p2_designsystem.py` are the scripts
that made the structural edits, kept so the change is reviewable. The
design system was edited in both copies — `system/_check/` (specimen)
and `system/pages/` (published) — because the build scripts in `tools/`
still point at an old session path.

## 2026-08-18 — P0 before the 21 August review

Four things the wireframe and the client feedback agree on, and the build
did not do. Nothing here is a design proposal — each one is a written
requirement we had missed.

### Men / Women in one place

Alex's deck, slide 12: *"Men/women — Here in all pages"*. The switch was in
a different row on every screen — inside the live block on the home page,
after the search field on Standings, next to the metric chips on Stats —
and missing entirely on Teams, Conference and Stop.

It is now **el-02 in a bar of its own, directly under the page title**, at
the same coordinates on Standings, Qualification, Stats, Teams, Conference
and Stop. The new `.pgbar` eats half the 40px section rhythm so the control
reads as part of the title, not of the content below it.

Two switches stay where they are, and deliberately: the one on the team
header is a *team* switch, the same place Johannes' wireframe puts it, and
the one on the home Qualification module is what LP-13 asks for by name.
Calendar, Conferences and News carry no switch — nothing on those pages is
scoped to one gender.

### A real H1 on every page

Mota defended the headline and the breadcrumb on 3 August with SEO, WCAG
and deep-link entries from search and social; the agreement was to shrink
them, not to remove them. The page titles were markup `div`s — the site had
**no `h1` and no `h2` at all**.

`.f04-h1-m` / `.f04-h1-s` are now `h1`, section titles `.t-h2` are now `h2`.
The classes are untouched, so nothing moved by a pixel. On the home page the
wordmark carries the title, so it became the `h1` with the text next to it
for crawlers and screen readers (`.sr-only`).

### Home in the navigation

LP-01, and the first note on slide 1 of the deck: *"Missing Home for landing
page"*. The wordmark did the job, which is a convention, not an entry. There
is now an explicit **Home** item first in the bar, carrying the current-page
state on the landing page.

### Men / Women on the Conference page

CF-01 asks for it in the conference header in so many words. It is there now,
in the same bar as everywhere else.

### Files

`tools/p0_patch.py` is the script that made the change, kept so the edit is
reviewable. New CSS lives at the end of `assets/site.css`.

## 2026-08-15 — E-01 revised, B-3 and B-4

### Two that had not landed

- **Overlay alignment.** Three overlapping blocks of CSS had accumulated, and
  the last one centred the mega menu's columns instead of spreading them. One
  block now, reusing the page's own column verbatim: a clamped gutter with a
  centred 1440, so both edges line up and Close sits with the season selector.
- **Player card shadow.** Four `.pcard` rules in three files disagreed — one of
  them set `overflow: visible`, which unclipped the artwork. One rule now, in
  modules.css, so the design system shows it too. The containers carry padding,
  because an ancestor's overflow was clipping the shadow away.

### E-01 TeamFinder

Rebuilt to the wireframe: the three legacy states are gone, the future-feature
note is gone, the search icon renders, the field and the autocomplete share one
width, **Change** appears on the result as well as the chooser, and the result
carries **Tour points · Win ratio · Record · Stops played** laid out like the
team header's second row, with the two actions as ctl-01 ghost buttons.

### Navigation

- The panels are `position: absolute`, so they scroll away with the page — the
  navigation is not sticky.
- The prototype's mega menu drops the Featured column.
- **More** no longer takes the current-page underline while its panel is open.

### B-3 — Live now

A week of dates around today with a live dot on days that have basketball;
Prev and Next move a week; a day with nothing is muted and shows **el-10
EmptyState**. Region chips filter the conferences. Because the season in the
snapshot has finished, the strip opens on the last day that actually had play
rather than an empty today.

### B-4 — Conferences and Qualification

- Each conference links to its own page, shows **stops played of total** rather
  than all-black dots, and carries a **Live** badge only where a stop is
  running. The branded stroke marks a region that is playing right now.
- **qualification.html** — its own page, twenty teams, Qualified or Shortlisted,
  men / women, linked from Standings and from the home board.

### Also

- el-22 CarouselIndicator is 8px tall.

## 2026-08-15 — Find a Team, spacing, overlay alignment

### E-01 TeamFinder — four steps

Built from Johannes' wireframe and documented in the design system as four
states of one module, not four modules: **default**, **filled in**, **choose
team site**, **result**. Every part is an existing element — el-11 SearchInput,
el-15 AutocompleteMenu, el-13 FederationTag, el-06 StopDots, ctl-02 Link — so
nothing new entered the system.

On the home page it runs on real data: nation and team-site counts, live search
over all 68 federations, a team-site chooser per category, and a result card
carrying that squad's seed, standing, record, conference points and stop
progress, with links to the team and the conference. Change returns to step 1.

### Spacing and alignment

- **40px between every section**, top and bottom included.
- Mega menu and search share the page's content column, so both edges line up
  with the rest of the site and Close sits with the season selector.
- The flag in a search result was clipped by the row's own edge.
- Flags on a dark surface take a dark ring.

### Player cards

- e1 at rest everywhere, in the design system and the prototype; e2 on hover.
- On a team page the four cards hold one row and **scale together** down to
  1280 rather than wrapping.

## 2026-08-15 — Chrome corrections, Find a team, Qualification

### Navigation

- The first block sat against the navigation bar; `.tpl-content` now has top
  padding to match the rhythm below it. (The wordmark-to-nav 48px was already
  in place — the gap the screenshot marked was this one.)
- **More** changes colour on hover, not background, like the magnifier.
- The **magnifier** starts at the same muted grey as the text items and turns
  white on hover.
- With one panel open, moving the pointer to the other trigger **swaps panels
  immediately** rather than closing and reopening.
- Mega menu and search content share the page's gutters, so both edges line up
  with the rest of the site.

### Find a team — E-01 TeamFinder

Wired on the home page over all 68 federations: quick chips at rest, a live
autocomplete as you type with flag, IOC code and conference, and a no-match
message. In the design system the states are relabelled **default / filled in /
result — no match**.

### Qualification — LP-12

Rebuilt to the specification: only the twenty that reach the U23 World Cup, one
row each with position 1–20, flag, country and a **Qualified** or
**Shortlisted** label. The conference column is gone. Men / women switch. The
block is three columns of twelve, so the left column takes nine.

The feed carries no qualification flag, so the split is derived from tour
points — the leading twelve read as Qualified, the next eight as Shortlisted.
Two constants at the top of that function change it when the real field
arrives.

### Design system

- F-03m: the "header + bottom bar" state is gone, "header only" is now
  **header**.
- S-09: Season progress is wider.

## 2026-08-15 — B-1 corrections and B-2: filters

### Navigation panels

Both the mega menu and the search overlay were covering the chrome. They now
hang from **under** it — `--chrome-h` is measured at runtime rather than
hard-coded, because the corporate strip can wrap — and slide down, the way
Apple's navigation does: **hover opens on a mouse, tap opens on touch**, and on
a mouse, leaving the panel closes it. Escape and Close still work.

- The search field fills the content column.
- **Nothing is listed until something is typed.** An empty field shows no
  results at all; groups appear as the query matches.
- One focus ring, on the container. The input inside is reset with
  `appearance: none !important` — Safari's native bezel was drawing the second
  rectangle inside the ring.

### Live now

The accordion header only expands and collapses. The link out is the **View
conference** action inside the panel, and each standings row goes to that team.

### B-2 — filters and search

Four small controls in `site.js`, each returning its value and calling back on
change, so a page renderer stays one `draw()`:

| control | pages |
|---|---|
| el-02 GenderSwitch | Standings, Stats |
| el-03 FilterChips | Stats (metric), Calendar (region) |
| el-11 SearchInput | Standings, Teams, search overlay |
| el-25 AlphaIndex | Teams — click a letter to filter, click again to clear |

- **Standings** — search by name or IOC code, men / women switch.
- **Teams** — alphabet and search together; letters with no federation are
  disabled.
- **Stats** — metric chips, men / women, and the federation is now the third
  column, resolved from the squad a player appears in.
- **Calendar** — region chips over the real 108 stops, grouped by month.

When a filter empties a block, **el-10 EmptyState** takes its place at the same
width, as agreed for LP-17.

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
